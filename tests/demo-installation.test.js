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
        expect(source).toContain("import { renderDemoBrand } from './demo-brand.js'");
        expect(source).toContain("renderDemoBrand({ href: '/#top' })");
        expect(source).toContain("id=\"npm\"");
        expect(source).toContain("id=\"standalone\"");
        expect(source).toContain('syntax-api">AMB</span>.<span class="syntax-function">table');
        expect(source).not.toContain('Tabulator');
        expect(source).toContain('packageJson.version');
        expect(source).toContain('amb-grid-legacy-${version}.zip');
        expect(source).toContain("const INSTALLATION_VIDEO_URL = 'https://www.youtube.com/watch?v=2qhXHt0Upps'");
        expect(source).not.toContain('INSTALLATION & DOWNLOAD');
        expect(source).not.toContain('INSTALLAZIONE E DOWNLOAD');
        expect(source).toContain("hero: 'Installa AMB Grid'");
        expect(source).toContain("hero: 'Install AMB Grid'");
        expect(source).toContain('Usa npm nei progetti moderni');
        expect(source).toContain('Use npm in modern projects');
        expect(source).toContain('class="demo-hero installation-hero"');
        expect(source).toContain('class="demo-hero__brand"');
        expect(source).toContain('class="demo-hero__body"');
        expect(source).toContain('class="demo-hero__content"');
        expect(source).toContain('class="demo-hero__actions"');
        expect(source).toContain('demo-hero__video');
        expect(source).toContain('href="#npm"');
        expect(source).toContain('href="#standalone"');
        expect((source.match(/text\('npmStatus'\)/g) ?? []).length).toBe(1);
        expect(source).toContain('npm install');
        expect(source).toContain("'amb-grid/style.css'");
        expect(source).toContain('./amb-grid/amb-grid.umd.js');
        expect(source).toContain('Installation guide');
        expect(source).toContain('demo-video-preview demo-guide-video demo-hero__video installation-video-preview');
        expect(source).toContain('demo-video-preview__image');
        expect(source).toContain('demo-video-preview__overlay');
        expect(source).toContain('demoYoutubeIcon');
        expect(source).toContain('demo-code-block');
        expect(source).toContain('syntax-command');
        expect(source).toContain('syntax-keyword');
        expect(source).toContain('syntax-api');
        expect(source).toContain('syntax-tag');
        expect(source).toContain('syntax-attr');
        expect(source).toContain("const</span> data = [");
        expect(source).not.toContain('installation-video-preview__terminal');
        expect(source).not.toContain('installation-video-preview__packages');
        expect(source).not.toContain('installation-video-preview__grid');
        expect(source).not.toContain('href="#"');

        const css = read('src/demo/installation.css');
        expect(css).not.toContain('max-width: 1120px');
        expect(css).toContain('.installation-hero { gap:');
        expect(css).not.toContain('background: linear-gradient');
        expect(css).not.toContain('padding: clamp(24px, 4vw, 52px)');
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
