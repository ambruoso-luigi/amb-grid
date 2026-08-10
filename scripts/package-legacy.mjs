import {
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { strToU8, zipSync } from 'fflate';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'));
const artifactDirectory = resolve(projectRoot, 'release-artifacts');
const artifactPath = resolve(
    artifactDirectory,
    `amb-grid-legacy-${packageJson.version}.zip`
);
const requiredFiles = {
    'amb-grid/amb-grid.umd.js': resolve(projectRoot, 'dist-lib/amb-grid.umd.js'),
    'amb-grid/amb-grid.css': resolve(projectRoot, 'dist-lib/amb-grid.css'),
    'amb-grid/README.md': resolve(projectRoot, 'README.md'),
    'amb-grid/LICENSE': resolve(projectRoot, 'LICENSE')
};

Object.values(requiredFiles).forEach(path => {
    if (!existsSync(path)) throw new Error(`Required legacy package file is missing: ${path}`);
});

const archiveFiles = Object.fromEntries(
    Object.entries(requiredFiles).map(([archivePath, sourcePath]) => [
        archivePath,
        new Uint8Array(readFileSync(sourcePath))
    ])
);

archiveFiles['amb-grid/VERSION.txt'] = strToU8(`AMB Grid ${packageJson.version}\n`);

[
    ['amb-grid/amb-grid.umd.js.map', resolve(projectRoot, 'dist-lib/amb-grid.umd.js.map')],
    ['amb-grid/amb-grid.css.map', resolve(projectRoot, 'dist-lib/amb-grid.css.map')]
].forEach(([archivePath, sourcePath]) => {
    if (existsSync(sourcePath)) {
        archiveFiles[archivePath] = new Uint8Array(readFileSync(sourcePath));
    }
});

mkdirSync(artifactDirectory, { recursive: true });
writeFileSync(artifactPath, zipSync(archiveFiles, { level: 9 }));

console.log(`Created ${artifactPath}`);
