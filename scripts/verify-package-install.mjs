import { execFileSync } from 'node:child_process';
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    statSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import {
    dirname,
    join,
    resolve
} from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePackage = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'));
const packageDirectory = resolve(projectRoot, 'dist-lib');
const viteBin = resolve(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const typescriptBin = resolve(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const npmCommand = process.platform === 'win32'
    ? 'npm.cmd'
    : 'npm';
const temporaryRoot = mkdtempSync(join(tmpdir(), 'amb-grid-package-smoke-'));
const temporaryPackageRoot = join(temporaryRoot, 'package');
const consumerRoot = join(temporaryRoot, 'consumer');
const consumerSourceRoot = join(consumerRoot, 'src');
const cleanEnvironment = { ...process.env };

delete cleanEnvironment.NODE_PATH;

let summary = null;
let failure = null;
let temporaryFilesRemoved = false;

const getErrorDetail = error => {
    const stderr = error && error.stderr ? String(error.stderr).trim() : '';
    const stdout = error && error.stdout ? String(error.stdout).trim() : '';

    return stderr || stdout || error.message || String(error);
};

const runPhase = (phase, action) => {
    try {
        return action();
    } catch (error) {
        throw new Error(`${phase} failed: ${getErrorDetail(error)}`, {
            cause: error
        });
    }
};

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};

const runCommand = (command, args, cwd) => {
    const options = {
        cwd,
        encoding: 'utf8',
        env: cleanEnvironment,
        stdio: ['ignore', 'pipe', 'pipe']
    };

    if (
        process.platform === 'win32'
        && command === npmCommand
        && process.env.npm_execpath
    ) {
        return execFileSync(
            process.execPath,
            [process.env.npm_execpath, ...args],
            options
        );
    }

    return execFileSync(command, args, options);
};

const collectFiles = root => {
    const files = [];

    readdirSync(root, { withFileTypes: true }).forEach(entry => {
        const entryPath = join(root, entry.name);

        if (entry.isDirectory()) {
            files.push(...collectFiles(entryPath));
        } else if (entry.isFile()) {
            files.push(entryPath);
        }
    });

    return files;
};

try {
    runPhase('package build verification', () => {
        [
            join(packageDirectory, 'amb-grid.js'),
            join(packageDirectory, 'amb-grid.umd.js'),
            join(packageDirectory, 'amb-grid.css'),
            join(packageDirectory, 'index.d.ts'),
            typescriptBin,
            viteBin
        ].forEach(path => {
            assert(existsSync(path), `Required file is missing: ${path}`);
            assert(statSync(path).isFile(), `Required path is not a file: ${path}`);
        });
    });

    const report = runPhase('tarball creation', () => {
        mkdirSync(temporaryPackageRoot, { recursive: true });
        const output = runCommand(
            npmCommand,
            [
                'pack',
                '--json',
                '--ignore-scripts',
                '--pack-destination',
                temporaryPackageRoot
            ],
            projectRoot
        );
        const reports = JSON.parse(output);

        assert(
            Array.isArray(reports) && reports.length === 1,
            'Expected exactly one npm pack report.'
        );
        assert(
            reports[0] && typeof reports[0].filename === 'string',
            'The npm pack report does not contain a filename.'
        );

        const tarballPath = resolve(temporaryPackageRoot, reports[0].filename);

        assert(existsSync(tarballPath), `Tarball is missing: ${tarballPath}`);
        assert(statSync(tarballPath).isFile(), `Tarball is not a file: ${tarballPath}`);

        return {
            ...reports[0],
            tarballPath
        };
    });

    runPhase('consumer project creation', () => {
        mkdirSync(consumerSourceRoot, { recursive: true });
        writeFileSync(
            join(consumerRoot, 'package.json'),
            `${JSON.stringify({
                name: 'amb-grid-package-smoke-consumer',
                private: true,
                version: '0.0.0',
                type: 'module'
            }, null, 2)}\n`,
            'utf8'
        );
        writeFileSync(
            join(consumerRoot, 'index.html'),
            `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >
  <title>AMB Grid package smoke test</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
`,
            'utf8'
        );
        writeFileSync(
            join(consumerSourceRoot, 'main.js'),
            `import {
    AMB,
    editors,
    validators,
    ConfirmDialog
} from 'amb-grid';
import 'amb-grid/style.css';

if (
    !AMB
    || typeof AMB.table !== 'function'
    || typeof editors.text !== 'function'
    || typeof validators.required !== 'function'
    || typeof ConfirmDialog !== 'function'
) {
    throw new Error('AMB Grid public package exports are unavailable.');
}

document.querySelector('#app').dataset.ambGridPackage = 'resolved';
`,
            'utf8'
        );
        writeFileSync(
            join(consumerSourceRoot, 'typecheck.ts'),
            `import {
    AMB,
    CrudHelper,
    ROW_STATE,
    editors,
    formatters,
    validators,
    parsers,
    date,
    createLookup,
    createMultifieldLookup,
    multifieldLookup,
    ConfirmDialog,
    LookupDialog,
    SearchFiltersDialog,
    FeedbackRegion
} from 'amb-grid';

const grid = AMB.table({
    selector: '#grid',
    data: [{ id: 1, name: 'Test' }],
    columns: [
        { title: 'ID', field: 'id' },
        { title: 'Name', field: 'name' }
    ]
});

void grid;
void [
    CrudHelper,
    ROW_STATE,
    editors,
    formatters,
    validators,
    parsers,
    date,
    createLookup,
    createMultifieldLookup,
    multifieldLookup,
    ConfirmDialog,
    LookupDialog,
    SearchFiltersDialog,
    FeedbackRegion
];
`,
            'utf8'
        );
        writeFileSync(
            join(consumerRoot, 'tsconfig.json'),
            `${JSON.stringify({
                compilerOptions: {
                    noEmit: true,
                    strict: true,
                    target: 'ES2022',
                    module: 'ESNext',
                    moduleResolution: 'Bundler',
                    lib: ['ES2022', 'DOM']
                },
                files: ['src/typecheck.ts']
            }, null, 2)}\n`,
            'utf8'
        );
    });

    runPhase('consumer installation', () => {
        runCommand(
            npmCommand,
            [
                'install',
                report.tarballPath,
                '--ignore-scripts',
                '--no-audit',
                '--no-fund'
            ],
            consumerRoot
        );
    });

    const installedPackage = runPhase('installed package inspection', () => {
        const installedRoot = resolve(consumerRoot, 'node_modules', 'amb-grid');
        const installedPackagePath = join(installedRoot, 'package.json');

        assert(
            existsSync(installedPackagePath),
            'Installed amb-grid package.json is missing.'
        );

        const installed = JSON.parse(readFileSync(installedPackagePath, 'utf8'));

        assert(installed.name === 'amb-grid', 'Installed package name is not amb-grid.');
        assert(
            installed.version === sourcePackage.version,
            `Installed package version ${installed.version} does not match source version ${sourcePackage.version}.`
        );
        assert(installed.type === 'module', 'Installed package type is not module.');

        [
            'dist-lib/amb-grid.js',
            'dist-lib/amb-grid.umd.js',
            'dist-lib/amb-grid.css',
            'dist-lib/index.d.ts',
            'README.md',
            'LICENSE'
        ].forEach(path => {
            const installedPath = resolve(installedRoot, path);

            assert(existsSync(installedPath), `Installed package file is missing: ${path}`);
            assert(statSync(installedPath).isFile(), `Installed path is not a file: ${path}`);
        });

        [
            'src',
            'tests',
            'docs',
            'demo',
            'scripts',
            'dist',
            '.github'
        ].forEach(path => {
            assert(
                !existsSync(resolve(installedRoot, path)),
                `Forbidden installed package directory is present: ${path}`
            );
        });

        [
            'tabulator-tables',
            'awesomplete',
            'vanillajs-datepicker'
        ].forEach(dependency => {
            const dependencyPath = resolve(
                consumerRoot,
                'node_modules',
                dependency
            );

            assert(
                existsSync(dependencyPath) && statSync(dependencyPath).isDirectory(),
                `Runtime dependency is unavailable: ${dependency}`
            );
        });

        return installed;
    });

    runPhase('consumer Vite build', () => {
        runCommand(
            process.execPath,
            [viteBin, 'build'],
            consumerRoot
        );
    });

    runPhase('consumer TypeScript check', () => {
        runCommand(
            process.execPath,
            [typescriptBin, '--noEmit', '-p', join(consumerRoot, 'tsconfig.json')],
            consumerRoot
        );
    });

    const assets = runPhase('consumer output inspection', () => {
        const outputRoot = resolve(consumerRoot, 'dist');
        const outputIndex = join(outputRoot, 'index.html');
        const outputAssets = join(outputRoot, 'assets');

        assert(existsSync(outputIndex), 'Consumer dist/index.html is missing.');
        assert(existsSync(outputAssets), 'Consumer dist/assets is missing.');
        assert(statSync(outputAssets).isDirectory(), 'Consumer dist/assets is not a directory.');

        const outputFiles = collectFiles(outputRoot);
        const javascriptFiles = outputFiles.filter(path => path.endsWith('.js'));
        const cssFiles = outputFiles.filter(path => path.endsWith('.css'));

        assert(javascriptFiles.length > 0, 'Consumer build contains no JavaScript assets.');
        assert(cssFiles.length > 0, 'Consumer build contains no CSS assets.');

        [...javascriptFiles, ...cssFiles].forEach(path => {
            assert(statSync(path).size > 0, `Consumer asset is empty: ${path}`);
        });

        const javascript = javascriptFiles
            .map(path => readFileSync(path, 'utf8'))
            .join('\n');
        const css = cssFiles
            .map(path => readFileSync(path, 'utf8'))
            .join('\n');

        [
            /from\s*["']amb-grid["']/,
            /from\s*["']amb-grid\/style\.css["']/,
            /amb-grid\/style\.css/
        ].forEach(pattern => {
            assert(
                !pattern.test(javascript),
                `Consumer JavaScript contains an unresolved import: ${pattern}`
            );
        });

        ['.tabulator', '.datepicker', '.awesomplete', '.amb-toolbar']
            .forEach(fragment => {
                assert(
                    css.includes(fragment),
                    `Consumer CSS is missing the ${fragment} family.`
                );
            });

        assert(
            ['.amb-feedback-region', '.amb-lookup-dialog', '.amb-confirm-dialog']
                .some(fragment => css.includes(fragment)),
            'Consumer CSS is missing AMB component styles.'
        );

        return {
            javascript: javascriptFiles.length,
            css: cssFiles.length
        };
    });

    summary = {
        packageName: installedPackage.name,
        packageVersion: installedPackage.version,
        tarball: report.filename,
        javascriptAssets: assets.javascript,
        cssAssets: assets.css,
        typescript: true,
        runtimeDependencies: 3
    };
} catch (error) {
    failure = error;
} finally {
    try {
        rmSync(temporaryRoot, {
            recursive: true,
            force: true
        });
        temporaryFilesRemoved = !existsSync(temporaryRoot);
    } catch (error) {
        failure ||= new Error(`cleanup failed: ${getErrorDetail(error)}`, {
            cause: error
        });
    }
}

if (failure) {
    console.error('AMB Grid package installation smoke test failed.');
    console.error(failure.message);
    console.error(`Temporary files removed: ${temporaryFilesRemoved ? 'yes' : 'no'}`);
    process.exitCode = 1;
} else {
    console.log('AMB Grid package installation smoke test passed.');
    console.log(`Package: ${summary.packageName}@${summary.packageVersion}`);
    console.log(`Tarball: ${summary.tarball}`);
    console.log(`Consumer JavaScript assets: ${summary.javascriptAssets}`);
    console.log(`Consumer CSS assets: ${summary.cssAssets}`);
    console.log(`Consumer TypeScript check: ${summary.typescript ? 'passed' : 'failed'}`);
    console.log(`Installed runtime dependencies: ${summary.runtimeDependencies}`);
    console.log(`Temporary files removed: ${temporaryFilesRemoved ? 'yes' : 'no'}`);
}
