import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

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
