import { execFileSync } from 'node:child_process';
import {
    existsSync,
    readFileSync,
    statSync
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = resolve(projectRoot, 'package.json');
const packageLockPath = resolve(projectRoot, 'package-lock.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmPackArguments = ['pack', '--dry-run', '--json', '--ignore-scripts'];
const errors = [];

const addError = (requirement, detail) => {
    errors.push(`${requirement}: ${detail}`);
};

const normalizePath = path => path.replaceAll('\\', '/').replace(/^\.\//, '');

const expectEqual = (actual, expected, field) => {
    if (actual !== expected) {
        addError(
            `Invalid ${field}`,
            `expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
        );
    }
};

expectEqual(packageJson.name, 'amb-grid', 'name');
expectEqual(packageLock.version, packageJson.version, 'package-lock version');
expectEqual(
    packageLock.packages && packageLock.packages[''] && packageLock.packages[''].version,
    packageJson.version,
    'package-lock root package version'
);
expectEqual(packageJson.license, 'Apache-2.0', 'license');
expectEqual(packageJson.type, 'module', 'type');
expectEqual(packageJson.main, './dist-lib/amb-grid.js', 'main');
expectEqual(packageJson.module, './dist-lib/amb-grid.js', 'module');
expectEqual(packageJson.style, './dist-lib/amb-grid.css', 'style');
expectEqual(packageJson.types, './dist-lib/index.d.ts', 'types');
expectEqual(packageJson.repository && packageJson.repository.type, 'git', 'repository.type');
expectEqual(
    packageJson.repository && packageJson.repository.url,
    'git+https://github.com/ambruoso-luigi/amb-grid.git',
    'repository.url'
);
expectEqual(
    packageJson.homepage,
    'https://github.com/ambruoso-luigi/amb-grid#readme',
    'homepage'
);
expectEqual(
    packageJson.bugs && packageJson.bugs.url,
    'https://github.com/ambruoso-luigi/amb-grid/issues',
    'bugs.url'
);

if (
    !Array.isArray(packageJson.files)
    || packageJson.files.length !== 1
    || packageJson.files[0] !== 'dist-lib'
) {
    addError('Invalid files allowlist', 'expected exactly ["dist-lib"]');
}

if (
    !Array.isArray(packageJson.sideEffects)
    || !packageJson.sideEffects.includes('**/*.css')
) {
    addError('Invalid sideEffects', 'expected CSS files to be preserved with "**/*.css"');
}

const description = String(packageJson.description || '').toLowerCase();
[
    'powered by tabulator',
    'wrapper for tabulator',
    'tabulator wrapper'
].forEach(phrase => {
    if (description.includes(phrase)) {
        addError('Dependency-centered description', `description contains "${phrase}"`);
    }
});

const keywords = Array.isArray(packageJson.keywords)
    ? packageJson.keywords.map(keyword => String(keyword).toLowerCase())
    : [];
['tabulator', 'tabulator-wrapper'].forEach(keyword => {
    if (keywords.includes(keyword)) {
        addError('Dependency-centered keyword', `keywords contains "${keyword}"`);
    }
});

const exportsMap = packageJson.exports;

if (!exportsMap || typeof exportsMap !== 'object' || Array.isArray(exportsMap)) {
    addError('Invalid exports map', 'exports must be an object');
} else {
    expectEqual(
        exportsMap['.'] && exportsMap['.'].types,
        './dist-lib/index.d.ts',
        'exports["."].types'
    );
    expectEqual(
        exportsMap['.'] && exportsMap['.'].import,
        './dist-lib/amb-grid.js',
        'exports["."].import'
    );
    expectEqual(
        exportsMap['.'] && exportsMap['.'].default,
        './dist-lib/amb-grid.js',
        'exports["."].default'
    );
    expectEqual(
        exportsMap['./style.css'],
        './dist-lib/amb-grid.css',
        'exports["./style.css"]'
    );

    const forbiddenExportPrefixes = [
        './src',
        './lib',
        './ui',
        './tests',
        './demo',
        './dist-lib/'
    ];

    Object.keys(exportsMap).forEach(exportKey => {
        if (forbiddenExportPrefixes.some(prefix => exportKey.startsWith(prefix))) {
            addError('Forbidden export subpath', exportKey);
        }
    });
}

let report = null;

try {
    const commandOptions = {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    };
    const output = process.platform === 'win32' && process.env.npm_execpath
        ? execFileSync(
            process.execPath,
            [process.env.npm_execpath, ...npmPackArguments],
            commandOptions
        )
        : execFileSync(npmCommand, npmPackArguments, commandOptions);
    const result = JSON.parse(output);

    if (!Array.isArray(result) || result.length !== 1) {
        addError('Invalid npm pack report', 'expected a JSON array with exactly one item');
    } else {
        [report] = result;
    }
} catch (error) {
    const stderr = error && error.stderr ? String(error.stderr).trim() : '';

    addError('npm pack dry-run failed', stderr || error.message);
}

const tarballPaths = new Set();

if (report) {
    if (!Array.isArray(report.files)) {
        addError('Invalid npm pack report', 'report.files must be an array');
    } else {
        report.files.forEach(file => {
            if (!file || typeof file.path !== 'string') {
                addError('Invalid npm pack file entry', JSON.stringify(file));
                return;
            }

            tarballPaths.add(normalizePath(file.path));
        });
    }
}

const localTargets = new Set();
const collectLocalTargets = value => {
    if (typeof value === 'string') {
        if (value.startsWith('./')) {
            localTargets.add(normalizePath(value));
        }
        return;
    }

    if (Array.isArray(value)) {
        value.forEach(collectLocalTargets);
        return;
    }

    if (value && typeof value === 'object') {
        Object.values(value).forEach(collectLocalTargets);
    }
};

[
    packageJson.main,
    packageJson.module,
    packageJson.style,
    packageJson.exports
].forEach(collectLocalTargets);

localTargets.forEach(target => {
    const absoluteTarget = resolve(projectRoot, target);

    if (!existsSync(absoluteTarget)) {
        addError('Missing public entry', target);
        return;
    }

    if (!statSync(absoluteTarget).isFile()) {
        addError('Public entry is not a file', target);
    }

    if (report && !tarballPaths.has(target)) {
        addError('Public entry missing from tarball', target);
    }
});

const requiredFiles = [
    'package.json',
    'README.md',
    'LICENSE',
    'dist-lib/amb-grid.js',
    'dist-lib/amb-grid.umd.js',
    'dist-lib/amb-grid.css',
    'dist-lib/index.d.ts'
];

requiredFiles.forEach(path => {
    if (!existsSync(resolve(projectRoot, path))) {
        addError('Required repository file is missing', path);
    }

    if (report && !tarballPaths.has(path)) {
        addError('Required file missing from tarball', path);
    }
});

const forbiddenTarballPrefixes = [
    'src/',
    'tests/',
    'docs/',
    'demo/',
    'scripts/',
    'dist/',
    'coverage/',
    'node_modules/',
    '.github/',
    '.vscode/',
    'test-results/',
    'playwright-report/'
];

tarballPaths.forEach(path => {
    const forbiddenPrefix = forbiddenTarballPrefixes.find(prefix => path.startsWith(prefix));

    if (forbiddenPrefix) {
        addError('Forbidden path in tarball', `${path} matches ${forbiddenPrefix}`);
    }

    if (
        path.startsWith('dist-lib/')
        && !['.js', '.css', '.map', '.d.ts'].some(extension => path.endsWith(extension))
    ) {
        addError('Unsupported dist-lib file type', path);
    }
});

if (tarballPaths.has('dist-lib/index.html')) {
    addError('Forbidden library HTML entry', 'dist-lib/index.html');
}

const javascriptPath = 'dist-lib/amb-grid.js';
const legacyJavascriptPath = 'dist-lib/amb-grid.umd.js';
const stylesheetPath = 'dist-lib/amb-grid.css';
const declarationPath = 'dist-lib/index.d.ts';
const javascriptAbsolutePath = resolve(projectRoot, javascriptPath);
const legacyJavascriptAbsolutePath = resolve(projectRoot, legacyJavascriptPath);
const stylesheetAbsolutePath = resolve(projectRoot, stylesheetPath);
const declarationAbsolutePath = resolve(projectRoot, declarationPath);

if (existsSync(javascriptAbsolutePath)) {
    const javascript = readFileSync(javascriptAbsolutePath, 'utf8');

    if (!javascript.trim()) {
        addError('Empty JavaScript bundle', javascriptPath);
    }

    [
        'window.AMB',
        'Gestionale Magazzino',
        'featureExamples',
        'full-demo',
        'demo/main.js',
        'src/demo'
    ].forEach(reference => {
        if (javascript.includes(reference)) {
            addError('Demo reference in JavaScript bundle', `${javascriptPath}: ${reference}`);
        }
    });

    [
        'tabulator-tables',
        'awesomplete',
        'vanillajs-datepicker/Datepicker'
    ].forEach(dependency => {
        if (!javascript.includes(dependency)) {
            addError('Missing external runtime reference', `${javascriptPath}: ${dependency}`);
        }
    });
}

if (existsSync(legacyJavascriptAbsolutePath)) {
    const legacyJavascript = readFileSync(legacyJavascriptAbsolutePath, 'utf8');

    if (!legacyJavascript.trim()) {
        addError('Empty legacy JavaScript bundle', legacyJavascriptPath);
    }
}

if (existsSync(declarationAbsolutePath)) {
    const declaration = readFileSync(declarationAbsolutePath, 'utf8');

    if (!declaration.trim()) {
        addError('Empty TypeScript declaration', declarationPath);
    }
}

if (existsSync(stylesheetAbsolutePath)) {
    const stylesheet = readFileSync(stylesheetAbsolutePath, 'utf8');

    if (!stylesheet.trim()) {
        addError('Empty stylesheet bundle', stylesheetPath);
    }

    ['.tabulator', '.datepicker', '.awesomplete', '.amb-toolbar'].forEach(fragment => {
        if (!stylesheet.includes(fragment)) {
            addError('Missing stylesheet family', `${stylesheetPath}: ${fragment}`);
        }
    });

    if (
        !['.amb-feedback-region', '.amb-lookup-dialog', '.amb-confirm-dialog']
            .some(fragment => stylesheet.includes(fragment))
    ) {
        addError('Missing AMB component styles', stylesheetPath);
    }

    ['.demo-page', '.demo-hero', '.demo-panel'].forEach(fragment => {
        if (stylesheet.includes(fragment)) {
            addError('Demo selector in stylesheet bundle', `${stylesheetPath}: ${fragment}`);
        }
    });
}

if (errors.length > 0) {
    console.error('AMB Grid package verification failed:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
} else {
    console.log('AMB Grid package verification passed.');
    console.log(`Package: ${packageJson.name}@${packageJson.version}`);
    console.log(`Files: ${report.entryCount ?? tarballPaths.size}`);
    console.log(`Unpacked size: ${report.unpackedSize ?? 'unknown'} bytes`);
    console.log(`JavaScript: ${javascriptPath}`);
    console.log(`Legacy JavaScript: ${legacyJavascriptPath}`);
    console.log(`Stylesheet: ${stylesheetPath}`);
    console.log(`TypeScript: ${declarationPath}`);
}
