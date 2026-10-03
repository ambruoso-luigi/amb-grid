import './site-navbar.css';
import { renderDemoBrand } from '../demo-brand.js';
import { demoIcon } from '../demo-icons.js';
import { readDemoLanguage, renderDemoLanguageSwitch, syncDemoLanguageSwitch, writeDemoLanguage } from '../demo-language-switch.js';

const labels = {
    it: { home: 'Home', demo: 'Demo', javascript: 'JavaScript', react: 'React', examples: 'Esempi funzionali', documentation: 'Documentazione', video: 'Video', install: 'Installazione', menu: 'Apri menu', closeMenu: 'Chiudi menu', future: 'In arrivo' },
    en: { home: 'Home', demo: 'Demo', javascript: 'JavaScript', react: 'React', examples: 'Feature examples', documentation: 'Documentation', video: 'Video', install: 'Installation', menu: 'Open menu', closeMenu: 'Close menu', future: 'Coming soon' }
};

const currentRoute = () => window.location.pathname === '/install/' ? 'install' : window.location.hash || '#top';

const renderNavbarDemoIcon = name => {
    const icons = {
        javascript: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="2" fill="#e2b400"/><path d="M10 17.5c.7.8 1.4 1.1 2.2 1.1 1 0 1.6-.5 1.6-1.5v-5.2h1.8v5.3c0 2.1-1.2 3.2-3.3 3.2-1.8 0-2.8-.9-3.4-2l1.1-.9Zm7.1 1c.5.8 1.2 1.3 2.2 1.3.9 0 1.5-.4 1.5-1.1 0-.8-.6-1.1-1.6-1.6l-.5-.2c-1.4-.6-2.3-1.3-2.3-2.8 0-1.4 1.1-2.5 2.8-2.5 1.2 0 2.1.4 2.7 1.5l-1.5 1c-.3-.6-.7-.8-1.2-.8-.6 0-1 .4-1 .8 0 .6.4.8 1.4 1.3l.5.2c1.6.7 2.5 1.4 2.5 3 0 1.7-1.4 2.7-3.2 2.7-1.8 0-3-.9-3.6-2.1l1.5-.9Z" fill="#102950"/></svg>',
        react: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2" fill="#2687b9"/><g fill="none" stroke="#2687b9" stroke-width="1.6"><ellipse cx="12" cy="12" rx="9" ry="3.7"/><ellipse cx="12" cy="12" rx="9" ry="3.7" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.7" transform="rotate(120 12 12)"/></g></svg>',
        vue: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h4.1L12 12.1 16.9 4H21L12 20 3 4Z" fill="#2f8b70"/><path d="M7.1 4H10l2 3.4L14 4h2.9L12 14.2 7.1 4Z" fill="#fff"/></svg>',
        angular: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 21 5.2l-1.4 12L12 22l-7.6-4.8L3 5.2 12 2Z" fill="#bd2636"/><path d="m12 5.4-4.3 10h1.8l.9-2.2h3.2l.9 2.2h1.8L12 5.4Zm0 3.3 1 2.6h-2L12 8.7Z" fill="#fff"/></svg>'
    };
    return icons[name];
};

const renderDemoChevron = () => '<svg class="site-navbar__demo-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4"/></svg>';

const renderGithubIcon = () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.91-2.78.62-3.37-1.2-3.37-1.2-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.54 1.06 1.54 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.15-4.56-5.1 0-1.13.39-2.05 1.03-2.77-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.06A9.3 9.3 0 0 1 12 5.1c.85 0 1.71.12 2.51.34 1.91-1.34 2.75-1.06 2.75-1.06.55 1.42.2 2.47.1 2.73.64.72 1.03 1.64 1.03 2.77 0 3.96-2.35 4.83-4.58 5.09.36.33.68.96.68 1.94 0 1.4-.01 2.52-.01 2.87 0 .27.18.59.69.49A10.23 10.23 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z"/></svg>';

export const mountSiteNavbar = (container, { onLanguageChange } = {}) => {
    if (!container) return null;
    container.innerHTML = `<nav class="site-navbar" aria-label="AMB Grid"><div class="site-navbar__inner">${renderDemoBrand({ href: '/#top' })}<button class="site-navbar__menu-toggle" type="button" aria-expanded="false" aria-controls="site-navbar-menu"><span aria-hidden="true">☰</span><span class="sr-only" data-navbar-menu-label></span></button><div class="site-navbar__menu" id="site-navbar-menu"><div class="site-navbar__main-nav"><a href="/#top" data-navbar-route="#top"><span data-navbar-label="home">Home</span></a><div class="site-navbar__demo"><button type="button" aria-expanded="false" aria-controls="site-navbar-demo-menu"><span data-navbar-label="demo">Demo</span>${renderDemoChevron()}</button><div class="site-navbar__dropdown" id="site-navbar-demo-menu"><a href="/#feature-examples" data-navbar-route="#feature-examples"><span class="site-navbar__dropdown-icon" aria-hidden="true">${demoIcon('framework', { className: 'site-navbar__dropdown-svg', size: 17 })}</span><span class="site-navbar__dropdown-label" data-demo-label="examples">Esempi funzionali</span></a><a href="/#getting-started-javascript" data-navbar-route="#getting-started-javascript"><span class="site-navbar__dropdown-icon" aria-hidden="true">${renderNavbarDemoIcon('javascript')}</span><span class="site-navbar__dropdown-label" data-demo-label="javascript">JavaScript</span></a><a href="/#getting-started-react" data-navbar-route="#getting-started-react"><span class="site-navbar__dropdown-icon" aria-hidden="true">${renderNavbarDemoIcon('react')}</span><span class="site-navbar__dropdown-label" data-demo-label="react">React</span></a><span class="site-navbar__dropdown-item is-unavailable" aria-disabled="true"><span class="site-navbar__dropdown-icon" aria-hidden="true">${renderNavbarDemoIcon('vue')}</span><span class="site-navbar__dropdown-label" data-demo-label="vue">Vue</span><small class="site-navbar__dropdown-future" data-demo-future></small></span><span class="site-navbar__dropdown-item is-unavailable" aria-disabled="true"><span class="site-navbar__dropdown-icon" aria-hidden="true">${renderNavbarDemoIcon('angular')}</span><span class="site-navbar__dropdown-label" data-demo-label="angular">Angular</span><small class="site-navbar__dropdown-future" data-demo-future></small></span></div></div><a href="/docs/index.html"><span data-navbar-label="documentation">Documentazione</span></a><a href="/#video" data-navbar-route="#video"><span data-navbar-label="video">Video</span></a><a href="/install/" data-navbar-route="install"><span data-navbar-label="install">Installazione</span></a><a class="site-navbar__github" href="https://github.com/ambruoso-luigi/amb-grid" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">${renderGithubIcon()}</a></div><div class="site-navbar__utilities">${renderDemoLanguageSwitch()}</div></div></div></nav>`;
    const menu = container.querySelector('.site-navbar__menu');
    const menuToggle = container.querySelector('.site-navbar__menu-toggle');
    const demo = container.querySelector('.site-navbar__demo');
    const dropdown = container.querySelector('.site-navbar__dropdown');
    const demoToggle = container.querySelector('.site-navbar__demo > button');
    const setMenuOpen = open => { menu.classList.toggle('is-open', open); menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.querySelector('[data-navbar-menu-label]').textContent = labels[readDemoLanguage()][open ? 'closeMenu' : 'menu']; };
    const setDemoOpen = open => { demo.classList.toggle('is-open', open); demoToggle.setAttribute('aria-expanded', String(open)); };
    const sync = language => {
        const copy = labels[language];
        const route = currentRoute();
        container.querySelectorAll('[data-navbar-route]').forEach(link => link.classList.toggle('is-active', link.dataset.navbarRoute === route));
        demo.classList.toggle('is-active', ['#feature-examples', '#getting-started-javascript', '#getting-started-react'].includes(route));
        container.querySelector('[data-navbar-label="home"]').textContent = copy.home;
        container.querySelector('[data-navbar-label="demo"]').textContent = copy.demo;
        container.querySelector('[data-demo-label="javascript"]').textContent = copy.javascript;
        container.querySelector('[data-demo-label="react"]').textContent = copy.react;
        container.querySelector('[data-demo-label="examples"]').textContent = copy.examples;
        container.querySelector('[data-navbar-label="documentation"]').textContent = copy.documentation;
        container.querySelector('[data-navbar-label="video"]').textContent = copy.video;
        container.querySelector('[data-navbar-label="install"]').textContent = copy.install;
        container.querySelectorAll('[data-demo-future]').forEach(item => { item.textContent = copy.future; });
        syncDemoLanguageSwitch(container, language, key => key.endsWith('switchToIt') ? 'Switch language to Italian' : 'Switch language to English');
        setMenuOpen(false); setDemoOpen(false);
    };
    const changeLanguage = language => { const next = writeDemoLanguage(language); document.documentElement.lang = next; sync(next); onLanguageChange?.(next); window.dispatchEvent(new CustomEvent('amb-demo-language-change', { detail: { language: next } })); };
    menuToggle.addEventListener('click', () => setMenuOpen(!menu.classList.contains('is-open')));
    demoToggle.addEventListener('click', () => setDemoOpen(!demo.classList.contains('is-open')));
    document.addEventListener('pointerdown', event => { if (!demo.contains(event.target)) setDemoOpen(false); });
    container.querySelectorAll('[data-language-set]').forEach(button => button.addEventListener('click', () => changeLanguage(button.dataset.languageSet)));
    container.querySelector('[data-language-toggle]').addEventListener('click', () => changeLanguage(readDemoLanguage() === 'it' ? 'en' : 'it'));
    container.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { setMenuOpen(false); setDemoOpen(false); }));
    window.addEventListener('hashchange', () => sync(readDemoLanguage()));
    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            const restoreDemoFocus = demo.classList.contains('is-open') && dropdown.contains(document.activeElement);
            setMenuOpen(false); setDemoOpen(false);
            if (restoreDemoFocus) demoToggle.focus();
        }
    });
    window.addEventListener('scroll', () => container.querySelector('.site-navbar').classList.toggle('is-scrolled', window.scrollY > 4), { passive: true });
    sync(readDemoLanguage());
    return { sync };
};
