import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'dist/index.js',
  'dist/index.d.ts',
  'dist/defaultConfig.js',
  'dist/client/index.js',
  'dist/client/index.d.ts',
  'dist/components/CookieConsent.astro',
  'dist/components/ConsentModeDefaults.astro',
  'dist/components/CookiePreferencesLink.astro',
  'dist/styles/cookie-consent.css',
];

const missingFiles = requiredFiles.filter((file) => !existsSync(file));
if (missingFiles.length > 0) {
  console.error(`Missing package output: ${missingFiles.join(', ')}`);
  process.exit(1);
}

const banner = readFileSync('dist/components/CookieConsent.astro', 'utf8');
if (!banner.includes('data-dc-cookie-consent-options')) {
  console.error('CookieConsent.astro is missing its serialized configuration boundary.');
  process.exit(1);
}
