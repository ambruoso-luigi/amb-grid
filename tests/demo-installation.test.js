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
        for (const fragment of [
            'Due modalità, una sola API', 'Two modes, one API',
            'demo-guide-integration installation-modes', 'demo-guide-classic-layout',
            'demo-guide-mode-card--modern', 'demo-guide-mode-card--legacy',
            "demoIcon('modern'", "demoIcon('legacy'",
            'Modern JavaScript / npm', 'Browser / standalone',
            'npm install', "'amb-grid/style.css'", './vendor/amb-grid/amb-grid.css',
            './vendor/amb-grid/amb-grid.umd.js', 'demo-guide-mode-note',
            'packageJson.version', 'amb-grid-legacy-${version}.zip',
            'GitHub Release ${releaseTag}', 'README.md', 'LICENSE', 'VERSION.txt',
            String.raw`Verifica l\'installazione`, 'Verify the installation',
            'href="/#getting-started-javascript"', 'href="/#getting-started-react"',
            'Vue →', 'Angular →'
        ]) expect(source).toContain(fragment);
        for (const fragment of ['AMB.editors', 'AMB.formatters', 'Package not yet published', 'Package non ancora pubblicato', 'coming soon', 'in arrivo', 'installation-paths']) {
            expect(source).not.toContain(fragment);
        }
        expect(css).not.toMatch(/^\.demo-guide-mode-card\s*\{/m);
        expect(css).not.toMatch(/^\.demo-code-block\s*\{/m);
    });
});
