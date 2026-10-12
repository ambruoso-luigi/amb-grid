import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('installation page', () => {
    test('uses a real multipage entry with shared site components', () => {
        const html = read('install/index.html');
        const source = read('src/demo/installation.js');
        const vite = read('vite.config.js');

        expect(html).toContain('/src/demo/installation.js');
        expect(vite).toContain("install/index.html");
        expect(html).toContain('id="site-navbar"');
        expect(source).toContain("mountSiteNavbar(document.querySelector('#site-navbar')");
        expect(source).toContain('renderDemoFooter({');
        expect(source).toContain("id=\"npm\"");
        expect(source).toContain("id=\"standalone\"");
        expect(source).toContain('AMB.table');
        expect(source).not.toContain('Tabulator');
        expect(source).toContain('packageJson.version');
        expect(source).toContain('amb-grid-legacy-${version}.zip');
        expect(source).toContain('const INSTALLATION_VIDEO_URL = null');
        expect(source).toContain("kicker: 'INSTALLATION & DOWNLOAD'");
        expect(source).toContain("hero: 'Porta AMB Grid nel tuo progetto'");
        expect(source).toContain("hero: 'Bring AMB Grid into your project'");
        expect(source).toContain('Installa AMB Grid con npm nei progetti moderni');
        expect(source).toContain('Install AMB Grid with npm in modern projects');
        expect(source).toContain('class="installation-hero__content"');
        expect(source).toContain('class="installation-hero__media"');
        expect(source).toContain('href="#npm"');
        expect(source).toContain('href="#standalone"');
        expect(source).toContain('Installation video coming soon');
        expect(source).toContain('Video di installazione in arrivo');
        expect(source).toContain('Installation guide');
        expect(source).not.toContain('href="#"');

        const css = read('src/demo/installation.css');
        expect(css).toContain('grid-template-columns: minmax(0, 1.55fr) minmax(280px, .9fr)');
        expect(css).toContain('.installation-video-preview--link');
        expect(css).toContain(':focus-visible');
        expect(css).toContain('@media (prefers-reduced-motion: reduce)');
        expect(css).toContain('grid-template-columns: minmax(0, 1fr)');
    });

    test('persists the shared language preference', () => {
        const language = read('src/demo/demo-language-switch.js');

        expect(language).toContain("amb-grid-demo-language");
        expect(language).toContain('localStorage');
        expect(language).toContain('readDemoLanguage');
        expect(language).toContain('writeDemoLanguage');
    });
});
