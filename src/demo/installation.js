import './demo.css';
import './installation.css';
import packageJson from '../../package.json';
import { renderDemoFooter } from './demo-footer.js';
import { renderDemoBrand } from './demo-brand.js';
import { readDemoLanguage } from './demo-language-switch.js';
import { demoYoutubeIcon } from './demo-icons.js';
import { mountSiteNavbar } from './components/site-navbar.js';

const root = document.querySelector('#app');
const version = packageJson.version;
const releaseTag = `v${version}`;
const zipName = `amb-grid-legacy-${version}.zip`;
const zipUrl = `https://github.com/ambruoso-luigi/amb-grid/releases/download/${releaseTag}/${zipName}`;
const INSTALLATION_VIDEO_URL = 'https://www.youtube.com/watch?v=2qhXHt0Upps';
let language = readDemoLanguage();
mountSiteNavbar(document.querySelector('#site-navbar'), { onLanguageChange: next => { language = next; render(); } });

const copy = {
    it: { title: 'AMB Grid - Installazione e download', description: 'Usa npm nei progetti moderni oppure scarica il bundle standalone per applicazioni browser e server-rendered.', hero: 'Installa AMB Grid', intro: 'Usa npm nei progetti moderni oppure scarica il bundle standalone per applicazioni browser e server-rendered.', videoLabel: 'Guida all\'installazione', videoLink: 'Apri la guida di installazione su YouTube', npm: 'npm / ESM', npmText: 'Consigliato per progetti con npm e bundler moderni.', npmStatus: 'Package non ancora pubblicato su npm.', npmNote: 'Il percorso seguente sarà disponibile quando il package verrà pubblicato.', zip: 'Standalone / ZIP', zipText: 'Bundle autonomo per pagine senza bundler.', download: 'Scarica bundle standalone', methods: 'Scegli come installare', standalone: 'Installazione standalone', first: 'Primo avvio', next: 'AMB Grid è pronta.', guide: 'Continua con la guida JavaScript', frameworks: 'Usi un framework?' },
    en: { title: 'AMB Grid - Installation and download', description: 'Use npm in modern projects or download the standalone bundle for browser and server-rendered applications.', hero: 'Install AMB Grid', intro: 'Use npm in modern projects or download the standalone bundle for browser and server-rendered applications.', videoLabel: 'Installation guide', videoLink: 'Open the installation guide on YouTube', npm: 'npm / ESM', npmText: 'Recommended for projects with npm and modern bundlers.', npmStatus: 'Package not yet published on npm.', npmNote: 'This path will be available when the package is published.', zip: 'Standalone / ZIP', zipText: 'Self-contained bundle for pages without a bundler.', download: 'Download standalone bundle', methods: 'Choose how to install', standalone: 'Standalone installation', first: 'First start', next: 'AMB Grid is ready.', guide: 'Continue with the JavaScript guide', frameworks: 'Using a framework?' }
};
const text = key => copy[language][key];
const code = (value, compact = false) => `<pre class="demo-code-block${compact ? ' demo-code-block--compact' : ''} installation-code"><code>${value}</code></pre>`;
const npmPublishingNote = () => `<p class="installation-status">${text('npmStatus')}</p><p>${text('npmNote')}</p>`;

const npmCode = () => code(`<span class="syntax-command">npm install</span> <span class="syntax-string">amb-grid</span>

<span class="syntax-keyword">import</span> { <span class="syntax-api">AMB</span> } <span class="syntax-keyword">from</span> <span class="syntax-string">'amb-grid'</span>;
<span class="syntax-keyword">import</span> <span class="syntax-string">'amb-grid/style.css'</span>;`, true);
const standaloneCode = () => code(`&lt;<span class="syntax-tag">link</span> <span class="syntax-attr">rel</span>=<span class="syntax-string">"stylesheet"</span> <span class="syntax-attr">href</span>=<span class="syntax-string">"./amb-grid/amb-grid.css"</span>&gt;
&lt;<span class="syntax-tag">script</span> <span class="syntax-attr">src</span>=<span class="syntax-string">"./amb-grid/amb-grid.umd.js"</span>&gt;&lt;/<span class="syntax-tag">script</span>&gt;

<span class="syntax-keyword">const</span> grid = <span class="syntax-api">AMB</span>.<span class="syntax-function">table</span>({
  <span class="syntax-property">selector</span>: <span class="syntax-string">'#grid'</span>,
  <span class="syntax-property">data</span>,
  <span class="syntax-property">columns</span>
});`);
const firstStartCode = () => code(`<span class="syntax-keyword">const</span> data = [
  {
    <span class="syntax-property">id</span>: <span class="syntax-number">1</span>,
    <span class="syntax-property">name</span>: <span class="syntax-string">'Notebook'</span>,
    <span class="syntax-property">quantity</span>: <span class="syntax-number">4</span>
  },
  {
    <span class="syntax-property">id</span>: <span class="syntax-number">2</span>,
    <span class="syntax-property">name</span>: <span class="syntax-string">'Monitor'</span>,
    <span class="syntax-property">quantity</span>: <span class="syntax-number">2</span>
  }
];

<span class="syntax-keyword">const</span> columns = [
  {
    <span class="syntax-property">title</span>: <span class="syntax-string">'Nome'</span>,
    <span class="syntax-property">field</span>: <span class="syntax-string">'name'</span>,
    <span class="syntax-property">editor</span>: <span class="syntax-api">AMB.editors</span>.<span class="syntax-function">text</span>()
  },
  {
    <span class="syntax-property">title</span>: <span class="syntax-string">'Quantità'</span>,
    <span class="syntax-property">field</span>: <span class="syntax-string">'quantity'</span>,
    <span class="syntax-property">editor</span>: <span class="syntax-api">AMB.editors</span>.<span class="syntax-function">integer</span>({
      <span class="syntax-property">allowEmpty</span>: <span class="syntax-keyword">false</span>
    }),
    <span class="syntax-property">formatter</span>: <span class="syntax-api">AMB.formatters</span>.<span class="syntax-function">integer</span>()
  }
];

<span class="syntax-keyword">const</span> grid = <span class="syntax-api">AMB</span>.<span class="syntax-function">table</span>({
  <span class="syntax-property">selector</span>: <span class="syntax-string">'#grid'</span>,
  <span class="syntax-property">data</span>,
  <span class="syntax-property">columns</span>
});`);

const getYoutubeThumbnail = url => {
    const videoId = new URL(url).searchParams.get('v');
    return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';
};
const renderInstallationVideoPreview = () => `<a class="demo-video-preview demo-guide-video demo-hero__video installation-video-preview" href="${INSTALLATION_VIDEO_URL}" target="_blank" rel="noreferrer" aria-label="${text('videoLink')}"><img class="demo-video-preview__image" src="${getYoutubeThumbnail(INSTALLATION_VIDEO_URL)}" alt=""><span class="demo-video-preview__overlay"></span><span class="demo-video-preview__title">${text('videoLabel')}</span><span class="demo-video-preview__destination"><span class="demo-video-preview__brand">${demoYoutubeIcon({ className: 'demo-video-preview__brand-icon', size: 17 })}</span>YouTube</span></a>`;

const render = () => {
    root.innerHTML = `<main class="installation-page site-container">
      <header class="demo-hero installation-hero"><div class="demo-hero__brand">${renderDemoBrand({ href: '/#top' })}</div><div class="demo-hero__body"><div class="demo-hero__content"><h1>${text('hero')}</h1><p class="demo-hero__text">${text('intro')}</p><div class="demo-hero__actions"><a class="demo-button demo-button--secondary" href="#npm">${text('npm')}</a><a class="demo-button demo-button--primary" href="#standalone">${text('download')}</a></div></div></div>${renderInstallationVideoPreview()}</header>
      <section class="installation-paths" aria-label="${text('methods')}"><article class="installation-path"><h2>${text('npm')}</h2><p>${text('npmText')}</p><span class="installation-badge">ESM · TypeScript</span></article><article class="installation-path"><h2>${text('zip')}</h2><p>${text('zipText')}</p><span class="installation-badge">UMD · ${releaseTag}</span><p><a href="${zipUrl}">${text('download')}</a><br><small>${zipName}<br>GitHub Release ${releaseTag}</small></p></article></section>
      <section class="installation-details"><article class="installation-detail" id="npm"><h2>${text('npm')}</h2>${npmPublishingNote()}${npmCode()}</article><article class="installation-detail" id="standalone"><h2>${text('standalone')}</h2>${standaloneCode()}<p><a href="https://github.com/ambruoso-luigi/amb-grid/releases">${language === 'it' ? 'Vedi tutte le release su GitHub →' : 'View all releases on GitHub →'}</a></p></article><article class="installation-detail installation-detail--wide"><h2>${text('first')}</h2>${firstStartCode()}<p><strong>${language === 'it' ? 'Contenuto ZIP' : 'ZIP contents'}</strong></p>${code(`amb-grid/
├── amb-grid.umd.js
├── amb-grid.css
├── README.md
├── LICENSE
└── VERSION.txt`, true)}</article></section>
      <section class="installation-next"><h2>${text('next')}</h2><p><a href="/#getting-started-javascript">${text('guide')} →</a></p><h3>${text('frameworks')}</h3><div class="installation-frameworks"><a href="/#getting-started-javascript">JavaScript →</a><a href="/#getting-started-react">React →</a><span>Vue — ${language === 'it' ? 'in arrivo' : 'coming soon'}</span><span>Angular — ${language === 'it' ? 'in arrivo' : 'coming soon'}</span></div></section>
      ${renderDemoFooter({ demoHref: '/#javascript-demo', examplesHref: '/#feature-examples', guideHref: '/#getting-started-javascript' })}</main>`;
    document.documentElement.lang = language;
    document.title = text('title');
    document.querySelector('meta[name="description"]')?.setAttribute('content', text('description'));
};
render();
