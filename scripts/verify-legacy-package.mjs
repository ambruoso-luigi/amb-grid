import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { strFromU8, unzipSync } from 'fflate';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'));
const artifactPath = resolve(
    projectRoot,
    'release-artifacts',
    `amb-grid-legacy-${packageJson.version}.zip`
);

if (!existsSync(artifactPath) || !statSync(artifactPath).isFile()) {
    throw new Error(`Legacy ZIP is missing: ${artifactPath}`);
}

if (statSync(artifactPath).size === 0) throw new Error('Legacy ZIP is empty.');

const archive = unzipSync(new Uint8Array(readFileSync(artifactPath)));
const archivePaths = Object.keys(archive);
const requiredFiles = {
    'amb-grid/amb-grid.umd.js': resolve(projectRoot, 'dist-lib/amb-grid.umd.js'),
    'amb-grid/amb-grid.css': resolve(projectRoot, 'dist-lib/amb-grid.css'),
    'amb-grid/README.md': resolve(projectRoot, 'README.md'),
    'amb-grid/LICENSE': resolve(projectRoot, 'LICENSE')
};
const allowedPaths = new Set([
    ...Object.keys(requiredFiles),
    'amb-grid/VERSION.txt',
    'amb-grid/amb-grid.umd.js.map',
    'amb-grid/amb-grid.css.map'
]);

Object.keys(requiredFiles).concat('amb-grid/VERSION.txt').forEach(path => {
    if (!archive[path]) throw new Error(`Required ZIP entry is missing: ${path}`);
});

archivePaths.forEach(path => {
    if (!path.startsWith('amb-grid/')) throw new Error(`ZIP entry is outside amb-grid/: ${path}`);
    if (!allowedPaths.has(path)) throw new Error(`Unexpected ZIP entry: ${path}`);
});

Object.entries(requiredFiles).forEach(([archivePath, sourcePath]) => {
    const archived = Buffer.from(archive[archivePath]);
    const source = readFileSync(sourcePath);

    if (archived.length === 0) throw new Error(`ZIP entry is empty: ${archivePath}`);
    if (!archived.equals(source)) throw new Error(`ZIP entry differs from source: ${archivePath}`);
});

const versionText = strFromU8(archive['amb-grid/VERSION.txt']);
if (!versionText.includes(packageJson.version)) {
    throw new Error('VERSION.txt does not contain the current package version.');
}

console.log('AMB Grid legacy ZIP verification passed.');
console.log(`Archive: ${artifactPath}`);
console.log('Contents:');
archivePaths.sort().forEach(path => console.log(`- ${path}`));
