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
        expect(source).toContain("renderDemoBrand({ href: '/' })");
        expect(source).toContain('renderDemoLanguageSwitch()');
        expect(source).toContain('renderDemoFooter({');
        expect(source).toContain("id=\"npm\"");
        expect(source).toContain("id=\"standalone\"");
        expect(source).toContain('AMB.table');
        expect(source).not.toContain('Tabulator');
        expect(source).toContain('packageJson.version');
        expect(source).toContain('amb-grid-legacy-${version}.zip');
        expect(source).toContain('not yet published on npm');
    });

    test('persists the shared language preference', () => {
        const language = read('src/demo/demo-language-switch.js');

        expect(language).toContain("amb-grid-demo-language");
        expect(language).toContain('localStorage');
        expect(language).toContain('readDemoLanguage');
        expect(language).toContain('writeDemoLanguage');
    });
});
