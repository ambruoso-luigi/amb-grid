import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('shared site navbar', () => {
    test('owns the public destinations, state and responsive accessible menu', () => {
        const navbar = read('src/demo/components/site-navbar.js');
        const css = read('src/demo/components/site-navbar.css');

        expect(navbar).toContain('href="/#top"');
        expect(navbar).toContain('href="/#getting-started-javascript"');
        expect(navbar).toContain('href="/#getting-started-react"');
        expect(navbar).toContain('href="/#feature-examples"');
        expect(navbar).toContain('href="/docs/index.html"');
        expect(navbar).toContain('href="/#video"');
        expect(navbar).toContain('href="/install/"');
        expect(navbar).toContain('https://github.com/ambruoso-luigi/amb-grid');
        expect(navbar).toContain('Vue <small>');
        expect(navbar).toContain('Angular <small>');
        expect(navbar).toContain('aria-expanded');
        expect(navbar).toContain("event.key === 'Escape'");
        expect(navbar).toContain('amb-demo-language-change');
        expect(navbar).toContain('currentRoute');
        expect(css).toContain('position: sticky');
        expect(css).toContain('@media (max-width: 760px)');
        expect(css).toContain('prefers-reduced-motion');
    });

    test('keeps the navbar mount stable while React replaces only app content', () => {
        const html = read('index.html');
        const main = read('src/demo/main.js');
        const app = read('examples/react-demo/src/App.tsx');
        const hero = read('examples/react-demo/src/components/ReactHero.tsx');

        expect(html).toContain('id="site-navbar"');
        expect(main).toContain("root.innerHTML = '<div id=\"react-demo-root\"></div>'");
        expect(app).toContain("readDemoLanguage");
        expect(app).toContain("amb-demo-language-change");
        expect(hero).not.toContain('react-demo-topbar');
        expect(hero).not.toContain('react-demo-language');
    });
});
