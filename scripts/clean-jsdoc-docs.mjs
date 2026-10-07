import { readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const docsDirectory = resolve('docs');
const generatedDirectories = ['fonts', 'scripts', 'styles'];

for (const directory of generatedDirectories) {
    await rm(resolve(docsDirectory, directory), { recursive: true, force: true });
}

for (const entry of await readdir(docsDirectory, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.html')) {
        await rm(resolve(docsDirectory, entry.name), { force: true });
    }
}
