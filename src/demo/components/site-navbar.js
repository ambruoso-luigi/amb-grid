import './site-navbar.css';
import { renderDemoBrand } from '../demo-brand.js';
import { readDemoLanguage, renderDemoLanguageSwitch, syncDemoLanguageSwitch, writeDemoLanguage } from '../demo-language-switch.js';

const labels = {
    it: { home: 'Home', demo: 'Demo', javascript: 'JavaScript', react: 'React', examples: 'Esempi funzionali', documentation: 'Documentazione', video: 'Video', github: 'GitHub', install: 'Installa', menu: 'Apri menu', closeMenu: 'Chiudi menu', future: 'In arrivo' },
    en: { home: 'Home', demo: 'Demo', javascript: 'JavaScript', react: 'React', examples: 'Feature examples', documentation: 'Documentation', video: 'Video', github: 'GitHub', install: 'Install', menu: 'Open menu', closeMenu: 'Close menu', future: 'Coming soon' }
};

const currentRoute = () => window.location.pathname === '/install/' ? 'install' : window.location.hash;

export const mountSiteNavbar = (container, { onLanguageChange } = {}) => {
    if (!container) return null;
    container.innerHTML = `<nav class="site-navbar" aria-label="AMB Grid"><div class="site-navbar__inner">${renderDemoBrand({ href: '/#top' })}<button class="site-navbar__menu-toggle" type="button" aria-expanded="false" aria-controls="site-navbar-menu"><span aria-hidden="true">☰</span><span class="sr-only" data-navbar-menu-label></span></button><div class="site-navbar__menu" id="site-navbar-menu"><div class="site-navbar__links"><a href="/#top" data-navbar-route="#top">Home</a><div class="site-navbar__demo"><button type="button" aria-expanded="false" aria-controls="site-navbar-demo-menu">Demo <span aria-hidden="true">⌄</span></button><div class="site-navbar__dropdown" id="site-navbar-demo-menu"><a href="/#getting-started-javascript" data-navbar-route="#getting-started-javascript">JavaScript</a><a href="/#getting-started-react" data-navbar-route="#getting-started-react">React</a><a href="/#feature-examples" data-navbar-route="#feature-examples">Esempi funzionali</a><span aria-disabled="true">Vue <small></small></span><span aria-disabled="true">Angular <small></small></span></div></div><a href="/docs/index.html">Documentazione</a><a href="/#video" data-navbar-route="#video">Video</a></div><div class="site-navbar__actions"><a href="https://github.com/ambruoso-luigi/amb-grid" target="_blank" rel="noopener noreferrer">GitHub</a>${renderDemoLanguageSwitch()}<a class="site-navbar__install" href="/install/" data-navbar-route="install">Installa</a></div></div></div></nav>`;
    const menu = container.querySelector('.site-navbar__menu');
    const menuToggle = container.querySelector('.site-navbar__menu-toggle');
    const demoToggle = container.querySelector('.site-navbar__demo > button');
    const setMenuOpen = open => { menu.classList.toggle('is-open', open); menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.querySelector('[data-navbar-menu-label]').textContent = labels[readDemoLanguage()][open ? 'closeMenu' : 'menu']; };
    const setDemoOpen = open => { container.querySelector('.site-navbar__demo').classList.toggle('is-open', open); demoToggle.setAttribute('aria-expanded', String(open)); };
    const sync = language => {
        const copy = labels[language];
        container.querySelectorAll('[data-navbar-route]').forEach(link => link.classList.toggle('is-active', link.dataset.navbarRoute === currentRoute()));
        container.querySelector('.site-navbar__links > a[href="/#top"]').textContent = copy.home;
        demoToggle.childNodes[0].textContent = `${copy.demo} `;
        container.querySelector('[href="/#getting-started-javascript"]').textContent = copy.javascript;
        container.querySelector('[href="/#getting-started-react"]').textContent = copy.react;
        container.querySelector('[href="/#feature-examples"]').textContent = copy.examples;
        container.querySelector('[href="/docs/index.html"]').textContent = copy.documentation;
        container.querySelector('[href="/#video"]').textContent = copy.video;
        container.querySelector('[href="https://github.com/ambruoso-luigi/amb-grid"]').textContent = copy.github;
        container.querySelector('.site-navbar__install').textContent = copy.install;
        container.querySelectorAll('[aria-disabled="true"] small').forEach(item => { item.textContent = copy.future; });
        syncDemoLanguageSwitch(container, language, key => key.endsWith('switchToIt') ? 'Switch language to Italian' : 'Switch language to English');
        setMenuOpen(false); setDemoOpen(false);
    };
    const changeLanguage = language => { const next = writeDemoLanguage(language); document.documentElement.lang = next; sync(next); onLanguageChange?.(next); window.dispatchEvent(new CustomEvent('amb-demo-language-change', { detail: { language: next } })); };
    menuToggle.addEventListener('click', () => setMenuOpen(!menu.classList.contains('is-open')));
    demoToggle.addEventListener('click', () => setDemoOpen(!container.querySelector('.site-navbar__demo').classList.contains('is-open')));
    container.querySelectorAll('[data-language-set]').forEach(button => button.addEventListener('click', () => changeLanguage(button.dataset.languageSet)));
    container.querySelector('[data-language-toggle]').addEventListener('click', () => changeLanguage(readDemoLanguage() === 'it' ? 'en' : 'it'));
    container.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { setMenuOpen(false); setDemoOpen(false); }));
    window.addEventListener('hashchange', () => sync(readDemoLanguage()));
    window.addEventListener('keydown', event => { if (event.key === 'Escape') { setMenuOpen(false); setDemoOpen(false); } });
    window.addEventListener('scroll', () => container.querySelector('.site-navbar').classList.toggle('is-scrolled', window.scrollY > 4), { passive: true });
    sync(readDemoLanguage());
    return { sync };
};
