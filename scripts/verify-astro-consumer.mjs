import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const major = process.argv[2] ?? process.env.ASTRO_MAJOR;
if (!major || !/^\d+$/.test(major)) {
  console.error('Usage: node scripts/verify-astro-consumer.mjs <astro-major>');
  process.exit(1);
}

const projectRoot = resolve(import.meta.dirname, '..');
const workDirectory = mkdtempSync(join(tmpdir(), `digital-craft-astro-cookie-consent-astro${major}-`));
const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

try {
  const packed = run('npm', ['pack', '--pack-destination', workDirectory], projectRoot).trim().split('\n').pop();
  const tarball = join(workDirectory, packed);
  const appDirectory = join(workDirectory, 'app');
  mkdirSync(join(appDirectory, 'src', 'pages'), { recursive: true });

  writeFileSync(
    join(appDirectory, 'package.json'),
    JSON.stringify(
      {
        name: `@digital-craft/astro-cookie-consent-consumer-${major}`,
        private: true,
        type: 'module',
        dependencies: {
          astro: `^${major}.0.0`,
          '@digital-craft/astro-cookie-consent': `file:${tarball}`,
        },
        devDependencies: {
          '@astrojs/check': 'latest',
          typescript: '^5.9.3',
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(join(appDirectory, 'astro.config.mjs'), "import { defineConfig } from 'astro/config';\nexport default defineConfig({});\n");
  writeFileSync(join(appDirectory, 'tsconfig.json'), JSON.stringify({ extends: 'astro/tsconfigs/strict' }, null, 2));
  writeFileSync(
    join(appDirectory, 'src', 'pages', 'index.astro'),
    `---
import {
  ConsentModeDefaults,
  CookieConsent,
  CookiePreferencesLink,
  createDefaultConsentConfig,
} from '@digital-craft/astro-cookie-consent';

const config = createDefaultConsentConfig({
  privacyPolicyUrl: '/privacy/',
  termsUrl: '/terms/',
});
---
<html lang="en-GB">
  <head>
    <title>Consumer</title>
    <ConsentModeDefaults />
  </head>
  <body>
    <CookieConsent {config} googleConsentMode />
    <CookiePreferencesLink />
  </body>
</html>
`,
  );

  run('npm', ['install', '--no-audit', '--no-fund'], appDirectory);
  const astroBinary = join(appDirectory, 'node_modules', '.bin', 'astro');
  if (!existsSync(astroBinary)) throw new Error('Astro was not installed in the consumer fixture.');

  run(astroBinary, ['check'], appDirectory);
  run(astroBinary, ['build'], appDirectory);

  const html = readFileSync(join(appDirectory, 'dist', 'index.html'), 'utf8');
  for (const marker of ['dc-cookie-consent-root', 'data-dc-cookie-preferences', 'consent']) {
    if (!html.includes(marker)) throw new Error(`Rendered consumer HTML is missing ${marker}.`);
  }
} finally {
  rmSync(workDirectory, { recursive: true, force: true });
}
