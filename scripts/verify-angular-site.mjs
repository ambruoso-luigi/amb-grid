import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const browserRoot = resolve(import.meta.dirname, '../dist/angular');
const index = await readFile(resolve(browserRoot, 'index.html'), 'utf8');
if (!index.includes('<base href="/angular/">') ||
    !index.includes('<app-root></app-root>') ||
    !index.includes('Live Multi-Asset Portfolio')) {
  throw new Error('dist/angular/index.html is not the Angular application');
}

for (const [, asset] of index.matchAll(/(?:src|href)="((?:main|styles)-[^"/]+\.(?:js|css))"/g)) {
  await access(resolve(browserRoot, asset));
}
if (!/src="main-[^"/]+\.js"/.test(index) ||
    !/href="styles-[^"/]+\.css"/.test(index)) {
  throw new Error('Angular JavaScript or CSS bundle is missing from the page');
}
await access(resolve(browserRoot, 'assets/amb-grid-logo.png'));
console.log('dist/angular contains the Angular page, bundles and logo asset.');
