import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'tsup';

const projectRoot = resolve(__dirname);
const sourceDirectory = resolve(projectRoot, 'src');
const outputDirectory = resolve(projectRoot, 'dist');

const copyDirectory = (directory: string) => {
  const source = resolve(sourceDirectory, directory);
  const destination = resolve(outputDirectory, directory);

  if (!existsSync(source)) return;
  if (existsSync(destination)) rmSync(destination, { recursive: true, force: true });

  mkdirSync(outputDirectory, { recursive: true });
  cpSync(source, destination, { recursive: true });
};

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'client/index': 'src/client/index.ts',
    defaultConfig: 'src/defaultConfig.ts',
  },
  clean: true,
  dts: false,
  format: ['esm'],
  minify: false,
  outDir: 'dist',
  sourcemap: true,
  target: 'es2021',
  treeshake: true,
  tsconfig: 'tsconfig.build.json',
  esbuildOptions(options) {
    options.external = [
      ...(options.external ?? []),
      'astro',
      'vanilla-cookieconsent',
      './components/CookieConsent.astro',
      './components/ConsentModeDefaults.astro',
      './components/CookiePreferencesLink.astro',
    ];
  },
  async onSuccess() {
    copyDirectory('components');
    copyDirectory('styles');
  },
});
