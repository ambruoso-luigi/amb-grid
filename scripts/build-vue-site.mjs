import { spawnSync } from 'node:child_process';
import { access, cp, mkdir, readFile, rm } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const vueRoot = resolve(root, 'examples/vue-demo');
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this command through npm so its CLI path is available');

const result = spawnSync(process.execPath, [npmCli, 'run', 'build:site'], {
  cwd: vueRoot,
  stdio: 'inherit'
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const source = resolve(vueRoot, 'dist');
const publicRoot = resolve(root, 'public');
const target = resolve(publicRoot, 'vue');
if (relative(publicRoot, target) !== 'vue') throw new Error(`Unexpected Vue staging path: ${target}`);
await access(resolve(source, 'index.html'));
const index = await readFile(resolve(source, 'index.html'), 'utf8');
if (!index.includes('/vue/assets/') || !index.includes('id="site-navbar"')) {
  throw new Error('Unexpected Vue index structure for /vue/ staging');
}
await mkdir(publicRoot, { recursive: true });
await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });
console.log(`Vue site staged at ${target}`);
