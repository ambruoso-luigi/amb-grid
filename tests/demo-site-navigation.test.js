import { readFileSync } from 'node:fs';
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
        expect(main).toContain("tableHeight: 'clamp(560px, 64vh, 760px)'");
        expect(main).toContain("variant: 'showcase'");
    });

    test('keeps the complete warehouse demo out of the home shell', () => {
        const main = read('src/demo/main.js');

        expect(main).not.toContain('id="main-demo"');
        expect(main).not.toContain('mountMainDemo();');
        expect(main).toContain('href="#getting-started-javascript" data-i18n="hero.primary"');
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
});
