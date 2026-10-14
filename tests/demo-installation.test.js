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

    test('keeps installation content in one panel with the published release', () => {
        const source = read('src/demo/installation.js');
        const css = read('src/demo/installation.css');
        const developmentVersion = JSON.parse(read('package.json')).version;
        for (const fragment of [
            'Due modalità, una sola API', 'Two modes, one API',
            'demo-guide-integration installation-modes', 'installation-modes__panel',
            'installation-mode installation-mode--modern', 'installation-mode installation-mode--legacy',
            "demoIcon('modern'", "demoIcon('legacy'", "demoIcon('validation'",
            'installation-mode__content', 'installation-verification__layout',
            'installation-section-header', 'installation-section-header__identity',
            'bothModes: \'Entrambe le modalità\'', 'bothModes: \'Both modes\'',
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
        expect(source).not.toContain('installation-mode__number');
        expect(source.indexOf('installation-modes__panel')).toBeLessThan(source.indexOf('installation-modes__intro'));
        expect(source.indexOf('installation-modes__intro')).toBeLessThan(source.indexOf('id="npm"'));
        expect(source.indexOf('id="npm"')).toBeLessThan(source.indexOf('id="standalone"'));
        expect(source.indexOf('id="standalone"')).toBeLessThan(source.indexOf('class="installation-verification"'));
        expect(source.indexOf('class="installation-verification"')).toBeLessThan(source.indexOf('class="installation-next"'));
        expect(source.indexOf('class="installation-next"')).toBeLessThan(source.indexOf('${renderDemoFooter({'));
        expect(source).toContain('AMB Grid è indipendente dal framework utilizzato.');
        expect(source).toContain('AMB Grid is framework-agnostic.');
        expect(source).toContain('Dopo aver caricato AMB Grid');
        expect(source).toContain('After loading AMB Grid');
        expect(css).toContain('.installation-modes__panel { background: #fff; border:');
        expect(css).toContain('.installation-mode, .installation-verification { border-bottom:');
        expect(css).toContain('.installation-mode--modern { --mode-accent: var(--amb-site-blue-strong)');
        expect(css).toContain('.installation-mode--legacy { --mode-accent: #16806f');
        expect(css).toContain('.installation-verification { --mode-accent: var(--amb-site-navy)');
        expect(css).toContain('.installation-mode__content, .installation-verification__layout { display: grid;');
        expect(css).toContain('@media (max-width: 900px) { .installation-mode__content, .installation-verification__layout { grid-template-columns: minmax(0, 1fr); } }');
        expect(css).not.toMatch(/^\.demo-guide-mode-card\s*\{/m);
        expect(css).not.toMatch(/^\.demo-code-block\s*\{/m);
    });
});
