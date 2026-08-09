import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const bundlePath = resolve(projectRoot, 'dist-lib/amb-grid.umd.js');
const stylesheetPath = resolve(projectRoot, 'dist-lib/amb-grid.css');
const fixturePath = resolve(projectRoot, 'tests/fixtures/legacy-smoke.html');

const assert = (condition, message) => {
    if (!condition) throw new Error(message);
};

assert(existsSync(bundlePath), 'Missing dist-lib/amb-grid.umd.js');
assert(existsSync(stylesheetPath), 'Missing dist-lib/amb-grid.css');
assert(existsSync(fixturePath), 'Missing legacy smoke fixture');

const fixtureSource = readFileSync(fixturePath, 'utf8');
assert(!/<script[^>]+type=["']module["']/i.test(fixtureSource), 'Fixture must not use module scripts');
assert(!/\bimport\s*(?:\(|[\s{*])/m.test(fixtureSource), 'Fixture must not use JavaScript imports');

const dependencyAssetPattern = /(tabulator|awesomplete|datepicker)[^"']*\.(?:js|css)/i;
assert(!dependencyAssetPattern.test(fixtureSource), 'Fixture must not load dependency assets separately');

const bundleSource = readFileSync(bundlePath, 'utf8');
assert(!/(^|\n)\s*import\s/m.test(bundleSource), 'Legacy bundle contains an unresolved ES module import');

const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.map': 'application/json; charset=utf-8'
};

const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const relativePath = pathname === '/' ? 'tests/fixtures/legacy-smoke.html' : pathname.slice(1);
    const absolutePath = resolve(projectRoot, relativePath);

    if (absolutePath !== projectRoot && !absolutePath.startsWith(`${projectRoot}${sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
    }

    try {
        const body = readFileSync(absolutePath);
        response.writeHead(200, { 'Content-Type': contentTypes[extname(absolutePath)] || 'application/octet-stream' });
        response.end(body);
    } catch {
        response.writeHead(404).end('Not found');
    }
});

await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', resolveListen);
});

const { port } = server.address();
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const pageErrors = [];

page.on('pageerror', error => pageErrors.push(error.message));

try {
    await page.goto(`http://127.0.0.1:${port}/tests/fixtures/legacy-smoke.html`);
    await page.waitForSelector('#grid.tabulator');

    const result = await page.evaluate(() => ({
        hasAMB: Boolean(window.AMB),
        hasNestedAMB: Boolean(window.AMB && window.AMB.AMB),
        table: typeof window.AMB?.table,
        lookup: typeof window.AMB?.lookup,
        multifieldLookup: typeof window.AMB?.multifieldLookup,
        editors: Boolean(window.AMB?.editors),
        formatters: Boolean(window.AMB?.formatters),
        validators: Boolean(window.AMB?.validators),
        parsers: Boolean(window.AMB?.parsers),
        gridMarkup: Boolean(document.querySelector('#grid.tabulator .tabulator-table')),
        resourcePaths: performance.getEntriesByType('resource').map(entry => new URL(entry.name).pathname)
    }));

    assert(pageErrors.length === 0, `Page errors: ${pageErrors.join('; ')}`);
    assert(result.hasAMB, 'window.AMB is unavailable');
    assert(!result.hasNestedAMB, 'Unexpected window.AMB.AMB namespace');
    assert(result.table === 'function', 'window.AMB.table is not a function');
    assert(result.lookup === 'function', 'window.AMB.lookup is not a function');
    assert(result.multifieldLookup === 'function', 'window.AMB.multifieldLookup is not a function');
    assert(result.editors && result.formatters && result.validators && result.parsers, 'Public AMB namespaces are unavailable');
    assert(result.gridMarkup, 'AMB.table did not render Tabulator markup');
    assert(
        result.resourcePaths.every(path => !dependencyAssetPattern.test(path)),
        `Dependency asset loaded separately: ${result.resourcePaths.join(', ')}`
    );

    console.log('AMB Grid legacy bundle smoke test passed.');
} finally {
    await browser.close();
    await new Promise(resolveClose => server.close(resolveClose));
}
