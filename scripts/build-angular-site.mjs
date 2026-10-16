import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build as buildVite } from 'vite';

const repositoryRoot = resolve(import.meta.dirname, '..');
const angularRoot = resolve(import.meta.dirname, '../examples/angular-demo');
const npmCli = process.env.npm_execpath;
if (!npmCli) {
  throw new Error('Run this command through npm so its CLI path is available');
}

const result = spawnSync(process.execPath, [npmCli, 'run', 'build:site'], {
  cwd: angularRoot,
  stdio: 'inherit',
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

await import('./stage-angular-site.mjs');

const navbarOutput = await buildVite({
  configFile: false,
  root: repositoryRoot,
  publicDir: false,
  base: '/angular/navbar/',
  build: {
    outDir: resolve(repositoryRoot, 'public/angular/navbar'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: resolve(repositoryRoot, 'src/demo/angular-navbar.js'),
      output: { entryFileNames: 'navbar.js', assetFileNames: '[name][extname]' },
    },
  },
});

const files = (Array.isArray(navbarOutput) ? navbarOutput : [navbarOutput])
  .flatMap(output => output.output);
const javascript = files.find(file => file.type === 'chunk' && file.isEntry);
const stylesheet = files.find(file => file.type === 'asset' && file.fileName.endsWith('.css'));
if (!javascript || !stylesheet) throw new Error('Shared navbar JavaScript or CSS was not generated');

const indexPath = resolve(repositoryRoot, 'public/angular/index.html');
const index = await readFile(indexPath, 'utf8');
if (!index.includes('<header id="site-navbar"></header>')) {
  throw new Error('Angular page has no shared navbar mount point');
}
await writeFile(indexPath, index
  .replace('</head>', `  <link rel="stylesheet" href="/angular/navbar/${stylesheet.fileName}">\n  </head>`)
  .replace('</body>', `  <script type="module" src="/angular/navbar/${javascript.fileName}"></script>\n  </body>`));
