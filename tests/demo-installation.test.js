import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('installation page', () => {
    test('keeps the site shell and approved hero at the Home width', () => {
        const html = read('install/index.html');
        const source = read('src/demo/installation.js');
        const css = read('src/demo/installation.css');
        expect(html).toContain('/src/demo/installation.js');
        expect(source).toContain("mountSiteNavbar(document.querySelector('#site-navbar')");
        expect(source).toContain('renderDemoFooter({');
        expect(source).toContain("renderDemoBrand({ href: '/#top' })");
        expect(source).toContain("hero: 'Installa AMB Grid'");
        expect(source).toContain("hero: 'Install AMB Grid'");
        expect(source).toContain('class="demo-hero installation-hero"');
        expect(source).toContain('demo-hero__video installation-video-preview');
        expect(source).toContain('href="#npm"');
        expect(source).toContain('href="#standalone"');
        expect(css).toMatch(/\.installation-page\s*\{[^}]*padding:\s*0 0 48px/);
    });

    test('has two modes, release download, simple verification, and next steps', () => {
        const source = read('src/demo/installation.js');
        const css = read('src/demo/installation.css');
        const developmentVersion = JSON.parse(read('package.json')).version;
        for (const fragment of [
            'Due modalità, una sola API', 'Two modes, one API',
            'demo-guide-integration installation-modes', 'installation-modes__panel',
            'installation-mode installation-mode--modern', 'installation-mode installation-mode--legacy',
            'installation-mode__number">01', 'installation-mode__number">02',
            "demoIcon('modern'", "demoIcon('legacy'",
            'Modern JavaScript / npm', 'Browser / standalone',
            'npm install', "'amb-grid/style.css'", './vendor/amb-grid/amb-grid.css',
            './vendor/amb-grid/amb-grid.umd.js', 'demo-guide-mode-note',
            "publishedReleaseVersion = '0.6.0'", 'amb-grid-legacy-${publishedReleaseVersion}.zip',
            'GitHub Release ${releaseTag}', 'Contenuto ZIP', 'ZIP contents',
            'amb-grid/', '├── amb-grid.umd.js', '├── amb-grid.css',
            '├── README.md', '├── LICENSE', '└── VERSION.txt',
            'installation-download', 'installation-all-releases',
            'https://github.com/ambruoso-luigi/amb-grid/releases',
            'assetPlacement', 'Estrai lo ZIP nella cartella ./vendor/',
            'Extract the ZIP into ./vendor/',
            'id</span>=<span class="syntax-string">"grid"',
            String.raw`Verifica l\'installazione`, 'Verify the installation',
            'installation-verification__copy', 'installation-verification__example',
            'frameworkOverview', 'Panoramica framework', 'Framework overview',
            'href="/#getting-started-javascript"', 'href="/#getting-started-react"',
            'Vue →', 'Angular →'
        ]) expect(source).toContain(fragment);
        for (const fragment of ['AMB.editors', 'AMB.formatters', 'Package not yet published', 'Package non ancora pubblicato', 'coming soon', 'in arrivo', 'installation-paths']) {
            expect(source).not.toContain(fragment);
        }
        expect(source).not.toContain('amb-grid-legacy-${version}.zip');
        expect(source).not.toContain('packageJson.version');
        expect(developmentVersion).toBe('0.7.0');
        expect(source).not.toContain('demo-guide-classic-layout');
        expect(source).not.toContain('demo-guide-mode-card demo-guide-mode-card--');
        expect(source.indexOf('id="npm"')).toBeLessThan(source.indexOf('id="standalone"'));
        expect(source).toContain('AMB Grid è indipendente dal framework utilizzato.');
        expect(source).toContain('AMB Grid is framework-agnostic.');
        expect(source).toContain('Dopo aver caricato AMB Grid');
        expect(source).toContain('After loading AMB Grid');
        expect(css).toContain('.installation-modes__panel { background: #fff; border:');
        expect(css).toContain('.installation-mode + .installation-mode { border-top:');
        expect(css).toContain('.installation-mode--modern { --mode-accent: var(--amb-site-blue-strong)');
        expect(css).toContain('.installation-mode--legacy { --mode-accent: #16806f');
        expect(css).toContain('.installation-verification { display: grid;');
        expect(css).toContain('@media (max-width: 900px) { .installation-verification { grid-template-columns: minmax(0, 1fr); } }');
        expect(css).not.toContain('max-width: 760px;');
        expect(css).not.toMatch(/^\.demo-guide-mode-card\s*\{/m);
        expect(css).not.toMatch(/^\.demo-code-block\s*\{/m);
    });
});
