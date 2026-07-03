import { readFileSync, statSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('demo site navigation', () => {
    test('links the JavaScript framework card to the internal JavaScript page', () => {
        const main = read('src/demo/main.js');

        expect(main).toContain('href="#getting-started-javascript"');
        expect(main).toContain("window.location.hash === '#getting-started-javascript'");
        expect(main).toContain("'frameworks.javascript.status': 'Apri guida JavaScript'");
        expect(main).toContain("'frameworks.javascript.status': 'Open JavaScript guide'");
    });

    test('uses the shared logo brand on the home and JavaScript guide pages', () => {
        const main = read('src/demo/main.js');
        const guide = read('src/demo/getting-started-javascript.js');
        const brand = read('src/demo/demo-brand.js');
        const css = read('src/demo/demo.css');
        const logo = statSync(new URL('../src/demo/amb-grid-logo.png', import.meta.url));

        expect(main).toContain("import { renderDemoBrand } from './demo-brand.js';");
        expect(guide).toContain("import { renderDemoBrand } from './demo-brand.js';");
        expect(main).toContain('${renderDemoBrand()}');
        expect(guide).toContain('${renderDemoBrand()}');
        expect(brand).toContain("new URL('./amb-grid-logo.png', import.meta.url).href");
        expect(brand).toContain('class="demo-brand__logo"');
        expect(brand).toContain('alt="AMB Grid"');
        expect(css).toContain('.demo-brand__logo');
        expect(logo.size).toBeGreaterThan(0);
    });

    test('renders the JavaScript demo before the getting started steps', () => {
        const guide = read('src/demo/getting-started-javascript.js');
        const main = read('src/demo/main.js');
        const demoIndex = guide.indexOf('id="javascript-demo"');
        const stepsIndex = guide.indexOf('id="javascript-getting-started"');

        expect(demoIndex).toBeGreaterThan(-1);
        expect(stepsIndex).toBeGreaterThan(-1);
        expect(demoIndex).toBeLessThan(stepsIndex);
        expect(main).toContain("mountMainDemo('#javascript-demo', 'guide', {");
        expect(main).toContain("className: 'demo-showcase demo-showcase--large'");
        expect(main).toContain('compactHeader: true');
        expect(main).not.toContain("tableHeight: 'clamp(560px, 64vh, 760px)'");
        expect(main).toContain("variant: 'showcase'");
    });

    test('documents classic HTML JS CSS integration as a planned browser bundle path', () => {
        const guide = read('src/demo/getting-started-javascript.js');
        const main = read('src/demo/main.js');

        expect(guide).toContain('id="classic-html-js-css-integration"');
        expect(main).toContain("'guide.classic.title': 'Integrazione classica HTML + JS + CSS'");
        expect(main).toContain("'guide.classic.title': 'Classic HTML + JS + CSS integration'");
        expect(guide).toContain('class="demo-guide-mode-card');
        expect(guide).toContain('class="demo-guide-badge');
        expect(guide).toContain('class="demo-guide-file-structure"');
        expect(guide).toContain('class="demo-guide-code-section');
        expect(main).toContain("'guide.classic.plannedBadge': 'Futura build browser'");
        expect(main).toContain("'guide.classic.plannedBadge': 'Planned browser bundle'");
        expect(main).toContain("'guide.classic.filesTitle': 'Struttura file'");
        expect(main).toContain("'guide.classic.filesTitle': 'File structure'");
        expect(guide).toContain('inventory-page.html');
        expect(guide).toContain('inventory-page.js');
        expect(guide).toContain('inventory-page.css');
        expect(guide).toContain('https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator.min.css');
        expect(guide).toContain('./vendor/amb-grid/amb-grid.css');
        expect(guide).toContain('./vendor/amb-grid/amb-grid.umd.js');
        expect(main).toContain('AMB Grid non produce ancora un file amb-grid.umd.js o amb-grid.iife.js');
        expect(main).toContain('This snippet is the planned browser bundle integration shape');
        expect(guide).toContain('return grid.crud.addRow({');
        expect(guide).not.toContain('onAdd() {\n      grid.crud.addRow');
    });

    test('keeps the JavaScript guide add-row snippets promise-aware', () => {
        const guide = read('src/demo/getting-started-javascript.js');

        expect(guide).toContain('onAdd: () => {\n      return grid.crud.addRow');
        expect(guide).toContain('onAdd() {\n      return grid.crud.addRow');
    });

    test('keeps the complete warehouse demo out of the home shell', () => {
        const main = read('src/demo/main.js');

        expect(main).not.toContain('id="main-demo"');
        expect(main).not.toContain('mountMainDemo();');
        expect(main).toContain('href="#getting-started-javascript">${demoIcon(\'arrowRight\')}<span data-i18n="hero.primary"');
    });

    test('does not post-process AMB Grid generated controls from the demo', () => {
        const main = read('src/demo/main.js');
        const icons = read('src/demo/demo-icons.js');
        const fullDemo = read('src/demo/full-demo.js');
        const combined = `${main}\n${icons}\n${fullDemo}`;

        expect(combined).not.toContain('installDemoGridIcons');
        expect(combined).not.toContain('applyDemoGridIcons');
        expect(combined).not.toContain('MutationObserver');
        expect(combined).not.toContain("querySelectorAll('.amb-toolbar__button");
        expect(combined).not.toContain("querySelectorAll('.amb-search-toolbar__filters-button");
        expect(combined).not.toContain("querySelectorAll('.amb-row-action-button");
        expect(combined).not.toContain('demoDeleteColumnIcons');
        expect(fullDemo).not.toContain('querySelector(`[data-action=');
    });

    test('uses a visual language switch with a single flag control', () => {
        const main = read('src/demo/main.js');
        const guide = read('src/demo/getting-started-javascript.js');
        const css = read('src/demo/demo.css');
        const combined = `${main}\n${guide}`;

        expect(combined).toContain('class="language-switch');
        expect(combined).toContain('data-language-toggle');
        expect(combined).toContain('data-language-set="en"');
        expect(combined).toContain('data-language-set="it"');
        expect(combined).toContain('class="language-switch__flag language-switch__flag--en"');
        expect(combined).toContain('class="language-switch__flag language-switch__flag--it"');
        expect(combined).not.toContain('data-language-flag');
        expect(combined).not.toContain('🇬🇧');
        expect(combined).not.toContain('data-language="it"');
        expect(combined).not.toContain('data-language="en"');
        expect(css).toContain('.language-switch__flag--en');
        expect(css).toContain('.language-switch__flag--it');
        expect(css).toContain('data:image/svg+xml');
        expect(css).toContain('%23012169');
        expect(css).toContain('%23c8102e');
        expect(css).toContain('#008c45');
        expect(css).toContain('#cd212a');
    });

    test('shows feature examples as cards without removing demos', () => {
        const main = read('src/demo/main.js');

        expect(main).toContain('class="demo-feature-grid"');
        expect(main).toContain('class="demo-feature-card');
        expect(main).toContain("'examples.multifieldLookup.description'");
        expect(main).toContain("id: 'multiple-tables'");
    });

    test('keeps the home wide and highlights keyboard-first editing', () => {
        const main = read('src/demo/main.js');
        const css = read('src/demo/demo.css');

        expect(css).toContain('width: min(100% - 12px, 1824px);');
        expect(main).toContain("'cycle.keyboardTitle': 'Editing orientato alla tastiera'");
        expect(main).toContain("'cycle.keyboardText': 'Inserimento rapido dei dati con navigazione Tab, conferma lookup e flusso pensato per utenti gestionali.'");
        expect(main).toContain("'cycle.keyboardTitle': 'Work without leaving the keyboard'");
        expect(main).toContain("'cycle.keyboardText': 'AMB Grid is designed for fast backoffice-style data entry: type, confirm with Tab and move to the next cell.'");
        expect(main).toContain('data-i18n="cycle.keyboardTitle"');
        expect(main).toContain('data-i18n="cycle.keyboardText"');
    });
});
