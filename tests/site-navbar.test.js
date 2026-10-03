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
        const dropdown = navbar.slice(navbar.indexOf('id="site-navbar-demo-menu"'), navbar.indexOf('</div></div><a href="/docs/index.html"'));

        expect(dropdown.indexOf('data-demo-label="examples"')).toBeLessThan(dropdown.indexOf('data-demo-label="javascript"'));
        expect(dropdown.indexOf('data-demo-label="javascript"')).toBeLessThan(dropdown.indexOf('data-demo-label="react"'));
        expect(dropdown.indexOf('data-demo-label="react"')).toBeLessThan(dropdown.indexOf('data-demo-label="vue"'));
        expect(dropdown.indexOf('data-demo-label="vue"')).toBeLessThan(dropdown.indexOf('data-demo-label="angular"'));
        expect(navbar).toContain("demoIcon('framework'");
        expect(navbar).toContain('renderNavbarDemoIcon');
        expect(navbar).not.toContain('frameworkIcon');
        expect(navbar).toContain('class="site-navbar__dropdown-item is-unavailable" aria-disabled="true"');
        expect(navbar).toContain('class="site-navbar__dropdown-label"');
        expect(navbar).toContain('data-demo-future');
        expect(navbar).toContain("querySelector('[data-demo-label=\"examples\"]')");
        expect(navbar).not.toContain("querySelector('[href=\"/#feature-examples\"]').textContent");
        expect(navbar).toContain('href="/#feature-examples"');
        expect(navbar).toContain('href="/#getting-started-javascript"');
        expect(navbar).toContain('href="/#getting-started-react"');
        expect(navbar).toContain('aria-expanded');
        expect(navbar).toContain("event.key === 'Escape'");
        expect(navbar).toContain('amb-demo-language-change');
        expect(navbar).toContain('currentRoute');
        expect(navbar).toContain("['#feature-examples', '#getting-started-javascript', '#getting-started-react']");
        expect(navbar).toContain('site-navbar__main-nav');
        expect(navbar).toContain('site-navbar__utilities');
        expect(navbar).toContain('site-navbar__github');
        expect(navbar).toContain('renderDemoChevron');
        expect(navbar).toContain("document.addEventListener('pointerdown'");
        expect(navbar).toContain('demo.contains(event.target)');
        expect(navbar).toContain('aria-label="GitHub"');
        expect(navbar).not.toContain('site-navbar__install');
        expect(css).toContain('#site-navbar {');
        expect(css).toContain('position: sticky;');
        expect(css).toContain('.site-navbar__dropdown > a');
        expect(css).not.toContain('.site-navbar__dropdown span {');
        expect(css).toContain('@media (max-width: 1080px)');
        expect(css).toContain('@keyframes site-navbar-chevron-bob');
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
        expect(hero).toContain('className="react-hero-brand"');
        expect(hero).not.toContain('react-demo-topbar');
        expect(hero).not.toContain('react-demo-language');
    });
});
