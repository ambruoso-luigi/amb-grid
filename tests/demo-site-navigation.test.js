import { readFileSync, statSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('demo site navigation', () => {
    test('links the JavaScript framework card to the internal JavaScript page', () => {
        const main = read('src/demo/main.js');

        expect(main).toContain('href="#getting-started-javascript"');
        expect(main).toContain("['#getting-started-javascript', '#javascript-demo'].includes(window.location.hash)");
        expect(main).toContain("'frameworks.title': 'Integrabile dove lavori gi\u00e0'");
        expect(main).toContain("'frameworks.title': 'Use AMB Grid where you already work'");
        expect(main).toContain("'frameworks.javascript.badge': 'Classic integration'");
        expect(main).toContain("'frameworks.javascript.status': 'Apri guida JavaScript'");
        expect(main).toContain("'frameworks.javascript.status': 'Open JavaScript guide'");
        expect(main).toContain('demo-framework-card--ready');
        expect(main).toContain('data-i18n="frameworks.javascript.status"');
        expect(main).toContain('data-i18n="frameworks.react.status"');
        expect(main).toContain("'frameworks.react.badge': 'Lifecycle integration'");
        expect(main).toContain("'frameworks.vue.badge': 'Composition API example'");
        expect(main).toContain("'frameworks.angular.badge': 'Component lifecycle example'");
        expect(main).toContain("'frameworks.react.status': 'Planned full demo'");
        expect(main).toContain("'frameworks.angular.description': 'Conceptual example with AfterViewInit and OnDestroy.'");
        expect(main).not.toContain('demo-framework-card__meta-item');

        const css = read('src/demo/demo.css');

        expect(css).toContain('grid-template-columns: repeat(4, minmax(0, 1fr));');
        expect(css).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
        expect(css).toContain('grid-template-columns: 1fr;');
        expect(css).not.toContain('grid-column: span 2;');
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

    test('documents the current npm and standalone JavaScript integrations', () => {
        const guide = read('src/demo/getting-started-javascript.js');
        const main = read('src/demo/main.js');

        expect(guide).toContain('id="javascript-integration"');
        expect(main).toContain("'guide.integration.title': 'Usare AMB Grid con JavaScript'");
        expect(main).toContain("'guide.integration.title': 'Use AMB Grid with JavaScript'");
        expect(main).toContain("'guide.integration.modernTitle': 'Modern JavaScript / npm'");
        expect(main).toContain("'guide.integration.browserTitle': 'Browser / standalone'");
        expect(guide).toContain('class="demo-guide-mode-card');
        expect(guide).toContain('class="demo-guide-badge');
        expect(guide).toContain('class="demo-guide-code-section');
        expect(guide).toContain("<span class=\"syntax-api\">AMB</span> } <span class=\"syntax-keyword\">from</span> <span class=\"syntax-string\">'amb-grid'</span>");
        expect(guide).toContain("<span class=\"syntax-keyword\">import</span> <span class=\"syntax-string\">'amb-grid/style.css'</span>");
        expect(guide).toContain('./vendor/amb-grid/amb-grid.css');
        expect(guide).toContain('./vendor/amb-grid/amb-grid.umd.js');
        expect(guide).toContain('<span class="syntax-keyword">const</span> grid = <span class="syntax-api">AMB</span>.<span class="syntax-function">table</span>({ ... });');
        expect(guide).not.toContain('classic-html-js-css-integration');
        expect(main).not.toContain('Futura build browser');
        expect(main).not.toContain('Planned browser bundle');
    });

    test('keeps the JavaScript guide add-row snippets promise-aware', () => {
        const guide = read('src/demo/getting-started-javascript.js');

        expect(guide).toContain('<span class="syntax-function">onAdd</span>: () => {\n      <span class="syntax-keyword">return</span> grid.crud.<span class="syntax-function">addRow</span>');
        expect(guide).not.toContain('<span class="syntax-function">onAdd</span>: () => {\n      grid.crud.<span class="syntax-function">addRow</span>');
        expect(guide).toContain('href="#javascript-demo"');
        expect(guide).toContain('id="javascript-demo"');
    });

    test('uses a video preview and one feature-examples CTA in the home hero', () => {
        const main = read('src/demo/main.js');
        const css = read('src/demo/demo.css');

        expect(main).not.toContain('id="main-demo"');
        expect(main).not.toContain('mountMainDemo();');
        expect(main).toContain('class="demo-guide-video demo-hero__video"');
        expect(main).toContain('href="https://youtu.be/4m0EZ4vPmT0"');
        expect(main).toContain('src="https://i.ytimg.com/vi/4m0EZ4vPmT0/hqdefault.jpg"');
        expect(main).toContain('data-i18n="hero.videoLabel">Anteprima video</span>');
        expect(main.match(/href="#feature-examples"/g)).toHaveLength(4);
        expect(main).toContain('class="demo-button demo-button--primary" href="#feature-examples"');
        expect(main).not.toContain('data-i18n="hero.primary"');
        expect(main).not.toContain('demo-hero__metrics');
        expect(main).not.toContain("'hero.statState'");
        expect(main).not.toContain("'hero.statPayload'");
        expect(main).not.toContain("'hero.statIntegration'");
        expect(main).toContain("'hero.description': 'AMB Grid coordinates row states, validation, lookups, rollback, saving, and backend-ready payloads without forcing a framework.'");
        expect(main).not.toContain("'hero.description': 'AMB Grid adds a framework-agnostic CRUD layer on top of Tabulator");
        expect(read('src/demo/getting-started-javascript.js')).not.toMatch(/Tabulator|Awesomplete|vanilla-datepicker/);
        expect(main).not.toContain('class="demo-hero-visual"');
        expect(main).not.toContain('data-i18n="hero.visualTitle"');
        expect(main).not.toContain('data-i18n="hero.visualPayload"');
        expect(main).not.toContain('amb-grid.js');
        expect(main).not.toContain('Tabulator engine');
        expect(main).not.toContain('AMB Grid layer');
        expect(css).toContain('.demo-hero__body');
        expect(css).toContain('.demo-hero__video');
        expect(css).not.toContain('.demo-hero-visual');
        expect(css).not.toContain('.demo-hero-visual__flow');
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
        const englishFlag = statSync(new URL('../src/demo/assets/lang-en.svg', import.meta.url));
        const italianFlag = statSync(new URL('../src/demo/assets/lang-it.svg', import.meta.url));
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
        expect(css).toContain("url('./assets/lang-en.svg')");
        expect(css).toContain("url('./assets/lang-it.svg')");
        expect(englishFlag.size).toBeGreaterThan(0);
        expect(italianFlag.size).toBeGreaterThan(0);
    });

    test('shows column calculations instead of multiple tables', () => {
        const main = read('src/demo/main.js');

        expect(main).toContain('class="demo-feature-grid"');
        expect(main).toContain('class="demo-feature-card');
        expect(main).toContain("'examples.multifieldLookup.description'");
        expect(main).toContain("import columnCalculations from './column-calculations.js'");
        expect(main).toContain("id: 'column-calculations'");
        expect(main).toContain("label: 'Column calculations'");
        expect(main).toContain("'examples.columnCalculations.description'");
        expect(main).not.toContain('multiple-tables');
        expect(main).not.toContain('examples.multipleTables.description');
    });

    test('keeps each public column calculation on its own field', () => {
        const calculations = read('src/demo/column-calculations.js');
        const expectedCalculations = [
            ["field: 'id'", "topCalc: 'count'"],
            ["field: 'category'", "topCalc: 'unique'"],
            ["field: 'quantity'", "topCalc: 'sum'"],
            ["field: 'unitPrice'", "topCalc: 'avg'"],
            ["field: 'deliveryDays'", "topCalc: 'min'"],
            ["field: 'score'", "topCalc: 'max'"]
        ];

        expectedCalculations.forEach(([field, calculation]) => {
            const fieldIndex = calculations.indexOf(field);
            const nextFieldIndex = calculations.indexOf("field: '", fieldIndex + field.length);
            const columnSource = calculations.slice(fieldIndex, nextFieldIndex === -1 ? undefined : nextFieldIndex);

            expect(fieldIndex).toBeGreaterThan(-1);
            expect(columnSource).toContain(calculation);
        });

        expect(calculations.match(/topCalc: '(count|unique|sum|avg|min|max)'/g)).toHaveLength(6);
        expect(calculations).not.toContain("topCalc: 'concat'");
        expect(calculations).not.toContain('calculateScoreRange');
        expect(calculations).not.toContain("label: 'RANGE:'");
        expect(calculations).toContain("layout: 'fitColumns'");
        expect(calculations).toContain('formatValue: formatAveragePrice');
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
