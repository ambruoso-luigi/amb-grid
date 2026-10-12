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
        expect(source).toContain("const INSTALLATION_VIDEO_URL = 'https://www.youtube.com/watch?v=2qhXHt0Upps'");
        expect(source).toContain("kicker: 'INSTALLATION & DOWNLOAD'");
        expect(source).toContain("hero: 'Porta AMB Grid nel tuo progetto'");
        expect(source).toContain("hero: 'Bring AMB Grid into your project'");
        expect(source).toContain('Installa AMB Grid con npm nei progetti moderni');
        expect(source).toContain('Install AMB Grid with npm in modern projects');
        expect(source).toContain('class="installation-hero__content"');
        expect(source).toContain('class="installation-hero__media"');
        expect(source).toContain('href="#npm"');
        expect(source).toContain('href="#standalone"');
        expect(source).toContain('Installation guide');
        expect(source).toContain('demo-video-preview installation-video-preview');
        expect(source).toContain('demo-video-preview__image');
        expect(source).toContain('demo-video-preview__overlay');
        expect(source).toContain('demoYoutubeIcon');
        expect(source).not.toContain('installation-video-preview__terminal');
        expect(source).not.toContain('installation-video-preview__packages');
        expect(source).not.toContain('installation-video-preview__grid');
        expect(source).not.toContain('href="#"');

        const css = read('src/demo/installation.css');
        expect(css).not.toContain('max-width: 1120px');
        expect(css).toContain('grid-template-columns: minmax(0, 1fr) minmax(290px, 430px)');
        expect(css).toContain('font-size: clamp(34px, 5.2vw, 66px)');
        expect(css).toContain('@media (max-width: 1100px)');
        expect(css).not.toContain('installation-video-preview__terminal');
    });

    test('persists the shared language preference', () => {
        const language = read('src/demo/demo-language-switch.js');

        expect(language).toContain("amb-grid-demo-language");
        expect(language).toContain('localStorage');
        expect(language).toContain('readDemoLanguage');
        expect(language).toContain('writeDemoLanguage');
    });
});
