import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '..');
const source = resolve(repositoryRoot, 'examples/angular-demo/dist/angular-demo/browser');
const publicRoot = resolve(repositoryRoot, 'public');
const target = resolve(publicRoot, 'angular');

// The only directory this script replaces is the generated Angular site.
const relativeTarget = relative(publicRoot, target);
if (relativeTarget !== 'angular' || relativeTarget.startsWith(`..${sep}`)) {
  throw new Error(`Unexpected Angular staging path: ${target}`);
}

await access(resolve(source, 'index.html'));
const index = await readFile(resolve(source, 'index.html'), 'utf8');
if (!index.includes('<head>') || index.includes('<base ')) {
  throw new Error('Unexpected Angular index structure for /angular/ staging');
}

await mkdir(publicRoot, { recursive: true });
await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });
await writeFile(resolve(target, 'index.html'), index.replace('<head>', '<head>\n    <base href="/angular/">'));
console.log(`Angular site staged at ${target}`);
