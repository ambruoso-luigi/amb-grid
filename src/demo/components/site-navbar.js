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

const renderGithubIcon = () => '<span class="site-navbar__github-icon" aria-hidden="true"><svg class="site-navbar__github-mark" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943"/></svg><svg class="site-navbar__github-ring" viewBox="0 0 44 44"><path class="site-navbar__github-ring-arc" d="M22 42 A20 20 0 0 0 22 2"/><path class="site-navbar__github-ring-arc" d="M22 42 A20 20 0 0 1 22 2"/></svg></span>';

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
