import './demo.css';
import './installation.css';
import packageJson from '../../package.json';
import { renderDemoBrand } from './demo-brand.js';
import { renderDemoFooter } from './demo-footer.js';
import { bindDemoLanguageSwitch, readDemoLanguage, renderDemoLanguageSwitch, syncDemoLanguageSwitch, writeDemoLanguage } from './demo-language-switch.js';

const root = document.querySelector('#app');
const version = packageJson.version;
const releaseTag = `v${version}`;
const zipName = `amb-grid-legacy-${version}.zip`;
const zipUrl = `https://github.com/ambruoso-luigi/amb-grid/releases/download/${releaseTag}/${zipName}`;
let language = readDemoLanguage();

const copy = {
    it: { title: 'AMB Grid - Installazione e download', description: 'Installa AMB Grid con npm oppure scarica il bundle standalone.', kicker: 'INSTALLAZIONE E DOWNLOAD', hero: 'Porta AMB Grid nel tuo progetto', intro: 'Usa il bundle standalone in pagine classiche, server-rendered e applicazioni esistenti. Il package npm non è ancora pubblicato.', npm: 'npm / ESM', npmText: 'Consigliato per progetti con npm e bundler moderni.', npmStatus: 'Package non ancora pubblicato su npm.', zip: 'Standalone / ZIP', zipText: 'Bundle autonomo per pagine senza bundler.', download: 'Scarica bundle standalone', methods: 'Scegli come installare', standalone: 'Installazione standalone', first: 'Primo avvio', next: 'AMB Grid è pronta.', guide: 'Continua con la guida JavaScript', frameworks: 'Usi un framework?', switchToIt: 'Cambia lingua in italiano', switchToEn: 'Cambia lingua in inglese' },
    en: { title: 'AMB Grid - Installation and download', description: 'Install AMB Grid with npm or download the standalone bundle.', kicker: 'INSTALLATION AND DOWNLOAD', hero: 'Bring AMB Grid into your project', intro: 'Use the standalone bundle in classic pages, server-rendered systems, and existing applications. The npm package is not yet published.', npm: 'npm / ESM', npmText: 'Recommended for projects with npm and modern bundlers.', npmStatus: 'Package not yet published on npm.', zip: 'Standalone / ZIP', zipText: 'Self-contained bundle for pages without a bundler.', download: 'Download standalone bundle', methods: 'Choose how to install', standalone: 'Standalone installation', first: 'First start', next: 'AMB Grid is ready.', guide: 'Continue with the JavaScript guide', frameworks: 'Using a framework?', switchToIt: 'Switch language to Italian', switchToEn: 'Switch language to English' }
};
const text = key => copy[language][key];
const npmPublishingNote = () => language === 'it'
    ? '<p>Il percorso sarà disponibile quando il package verrà pubblicato.</p>'
    : '<p>This path will be available when the package is published.</p>';
const code = value => value.includes("from 'amb-grid'")
    ? npmPublishingNote()
    : `<pre class="installation-code"><code>${value}</code></pre>`;

const render = () => {
    root.innerHTML = `<main class="installation-page site-container">
      <nav class="demo-topbar" aria-label="AMB Grid navigation">${renderDemoBrand({ href: '/' })}${renderDemoLanguageSwitch()}</nav>
      <header class="installation-hero"><p class="installation-kicker">${text('kicker')}</p><h1>${text('hero')}</h1><p>${text('intro')}</p><div class="installation-actions"><a class="demo-button demo-button--secondary" href="#npm">${text('npm')}</a><a class="demo-button demo-button--primary" href="#standalone">${text('download')}</a></div></header>
      <section class="installation-paths" aria-label="${text('methods')}"><article class="installation-path"><h2>${text('npm')}</h2><p>${text('npmText')}</p><span class="installation-badge">ESM · TypeScript</span><p class="installation-status">${text('npmStatus')}</p></article><article class="installation-path"><h2>${text('zip')}</h2><p>${text('zipText')}</p><span class="installation-badge">UMD · ${releaseTag}</span><p><a href="${zipUrl}">${text('download')}</a><br><small>${zipName}<br>GitHub Release ${releaseTag}</small></p></article></section>
      <section class="installation-details"><article class="installation-detail" id="npm"><h2>${text('npm')}</h2><p>${text('npmStatus')}</p>${code("import { AMB } from 'amb-grid';\nimport 'amb-grid/style.css';")}</article><article class="installation-detail" id="standalone"><h2>${text('standalone')}</h2>${code('<link rel="stylesheet" href="./amb-grid/amb-grid.css">\n<script src="./amb-grid/amb-grid.umd.js"><\/script>\n\nAMB.table({ selector: \'#grid\', data, columns });')}<p><a href="https://github.com/ambruoso-luigi/amb-grid/releases">${language === 'it' ? 'Vedi tutte le release su GitHub →' : 'View all releases on GitHub →'}</a></p></article><article class="installation-detail installation-detail--wide"><h2>${text('first')}</h2>${code('<div id="grid"></div>\n\nconst data = [{ id: 1, name: \'Notebook\', quantity: 4 }, { id: 2, name: \'Monitor\', quantity: 2 }];\nconst columns = [{ title: \'Nome\', field: \'name\', editor: AMB.editors.text() }, { title: \'Quantità\', field: \'quantity\', editor: AMB.editors.integer({ allowEmpty: false }), formatter: AMB.formatters.integer() }];\nconst grid = AMB.table({ selector: \'#grid\', data, columns });')}<p><strong>${language === 'it' ? 'Contenuto ZIP' : 'ZIP contents'}</strong></p>${code(`amb-grid/\n├── amb-grid.umd.js\n├── amb-grid.css\n├── README.md\n├── LICENSE\n└── VERSION.txt`)}</article></section>
      <section class="installation-next"><h2>${text('next')}</h2><p><a href="/#getting-started-javascript">${text('guide')} →</a></p><h3>${text('frameworks')}</h3><div class="installation-frameworks"><a href="/#getting-started-javascript">JavaScript →</a><a href="/#getting-started-react">React →</a><span>Vue — ${language === 'it' ? 'in arrivo' : 'coming soon'}</span><span>Angular — ${language === 'it' ? 'in arrivo' : 'coming soon'}</span></div></section>
      ${renderDemoFooter({ demoHref: '/#javascript-demo', examplesHref: '/#feature-examples', guideHref: '/#getting-started-javascript' })}</main>`;
    document.documentElement.lang = language;
    document.title = text('title');
    document.querySelector('meta[name="description"]')?.setAttribute('content', text('description'));
    syncDemoLanguageSwitch(root, language, key => text(key.replace('language.', '')));
    bindDemoLanguageSwitch(root, () => language, next => { language = writeDemoLanguage(next); render(); });
};
render();
