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
        expect(main).toContain("mountMainDemo('#javascript-demo', 'guide')");
    });

    test('uses visible flag-only language buttons with accessible labels', () => {
        const main = read('src/demo/main.js');
        const guide = read('src/demo/getting-started-javascript.js');
        const combined = `${main}\n${guide}`;

        expect(combined).toContain('data-language="it" data-i18n-title="language.itTitle">🇮🇹</button>');
        expect(combined).toContain('data-language="en" data-i18n-title="language.enTitle">🇬🇧</button>');
        expect(combined).not.toContain('>🇮🇹 IT</button>');
        expect(combined).not.toContain('>🇬🇧 EN</button>');
    });
});
