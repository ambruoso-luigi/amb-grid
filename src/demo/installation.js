import './demo.css';
import './installation.css';
import { renderDemoFooter } from './demo-footer.js';
import { renderDemoBrand } from './demo-brand.js';
import { readDemoLanguage } from './demo-language-switch.js';
import { demoIcon, demoYoutubeIcon } from './demo-icons.js';
import { mountSiteNavbar } from './components/site-navbar.js';

const root = document.querySelector('#app');
const publishedReleaseVersion = '0.6.0';
const releaseTag = `v${publishedReleaseVersion}`;
const zipName = `amb-grid-legacy-${publishedReleaseVersion}.zip`;
const zipUrl = `https://github.com/ambruoso-luigi/amb-grid/releases/download/${releaseTag}/${zipName}`;
const INSTALLATION_VIDEO_URL = 'https://www.youtube.com/watch?v=2qhXHt0Upps';
let language = readDemoLanguage();
mountSiteNavbar(document.querySelector('#site-navbar'), { onLanguageChange: next => { language = next; render(); } });

const copy = {
    it: {
        title: 'AMB Grid - Installazione e download', description: 'Usa npm nei progetti moderni oppure scarica il bundle standalone per applicazioni browser e server-rendered.',
        hero: 'Installa AMB Grid', intro: 'Usa npm nei progetti moderni oppure scarica il bundle standalone per applicazioni browser e server-rendered.',
        videoLabel: 'Guida all\'installazione', videoLink: 'Apri la guida di installazione su YouTube', npm: 'npm / ESM', download: 'Scarica bundle standalone',
        modesKicker: 'Due modalità, una sola API', modesTitle: 'Usare AMB Grid con JavaScript', modesText: 'AMB Grid è indipendente dal framework utilizzato. Nei progetti moderni, inclusi React, Vue e Angular, l\'installazione tramite npm/ESM è comune; cambia soltanto il modo in cui la griglia viene integrata nel ciclo di vita del framework. Per pagine tradizionali o applicazioni senza bundler è disponibile il bundle standalone.',
        modernText: 'La scelta naturale per Vite, bundler e applicazioni JavaScript moderne, con installazione e aggiornamenti gestiti da npm.', installLabel: 'Installazione', importLabel: 'Import',
        browserText: 'Per pagine browser, server-rendered e applicazioni esistenti che non richiedono npm, bundler o framework.', assetsLabel: 'Caricamento asset', globalLabel: 'Global pubblico',
        bundleText: 'Il bundle UMD è pronto per l’uso standalone: carica soltanto gli asset AMB Grid indicati qui sopra.', bundleContents: 'Contenuto ZIP',
        assetPlacement: 'Estrai lo ZIP nella cartella ./vendor/: i file saranno in ./vendor/amb-grid/, come nei percorsi qui sopra.', allReleases: 'Vedi tutte le release su GitHub →',
        htmlLabel: 'HTML', javascriptLabel: 'JavaScript',
        verify: 'Verifica l\'installazione', verifyText: 'Dopo aver caricato AMB Grid, crea un contenitore HTML e inizializza una tabella con pochi dati. Se la griglia viene visualizzata correttamente, l\'installazione è pronta. Questo esempio utilizza JavaScript diretto; nei framework la creazione della griglia va collegata al ciclo di vita del componente.',
        guide: 'Continua con la guida JavaScript', next: 'AMB Grid è pronta.', frameworkOverview: 'Panoramica framework'
    },
    en: {
        title: 'AMB Grid - Installation and download', description: 'Use npm in modern projects or download the standalone bundle for browser and server-rendered applications.',
        hero: 'Install AMB Grid', intro: 'Use npm in modern projects or download the standalone bundle for browser and server-rendered applications.',
        videoLabel: 'Installation guide', videoLink: 'Open the installation guide on YouTube', npm: 'npm / ESM', download: 'Download standalone bundle',
        modesKicker: 'Two modes, one API', modesTitle: 'Use AMB Grid with JavaScript', modesText: 'AMB Grid is framework-agnostic. Modern projects, including React, Vue, and Angular, share the same npm/ESM installation process; only the integration with each framework\'s component lifecycle differs. A standalone bundle is also available for traditional browser pages and applications without a bundler.',
        modernText: 'The natural choice for Vite, bundlers, and modern JavaScript applications, with installation and updates managed by npm.', installLabel: 'Install', importLabel: 'Import',
        browserText: 'For browser pages, server-rendered applications, and existing systems that do not need npm, a bundler, or a framework.', assetsLabel: 'Load assets', globalLabel: 'Public global',
        bundleText: 'The UMD bundle is ready for standalone use: load only the AMB Grid assets shown above.', bundleContents: 'ZIP contents',
        assetPlacement: 'Extract the ZIP into ./vendor/: the files will be in ./vendor/amb-grid/, matching the paths above.', allReleases: 'View all releases on GitHub →',
        htmlLabel: 'HTML', javascriptLabel: 'JavaScript',
        verify: 'Verify the installation', verifyText: 'After loading AMB Grid, create an HTML container and initialize a table with a small dataset. If the grid renders correctly, the installation is ready. This example uses plain JavaScript; in frameworks, grid initialization must be connected to the component lifecycle.',
        guide: 'Continue with the JavaScript guide', next: 'AMB Grid is ready.', frameworkOverview: 'Framework overview'
    }
};
const text = key => copy[language][key];
const code = value => `<pre class="demo-code-block demo-code-block--compact"><code>${value}</code></pre>`;

const verificationCode = () => code(`<span class="syntax-keyword">const</span> data = [
  { <span class="syntax-property">id</span>: <span class="syntax-number">1</span>, <span class="syntax-property">name</span>: <span class="syntax-string">'Notebook'</span> },
  { <span class="syntax-property">id</span>: <span class="syntax-number">2</span>, <span class="syntax-property">name</span>: <span class="syntax-string">'Monitor'</span> }
];

<span class="syntax-keyword">const</span> columns = [
  {
    <span class="syntax-property">title</span>: <span class="syntax-string">'Nome'</span>,
    <span class="syntax-property">field</span>: <span class="syntax-string">'name'</span>
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
      <section class="demo-guide-section demo-guide-integration installation-modes" aria-labelledby="installation-modes-title">
        <div class="demo-section-heading"><p class="demo-kicker">${text('modesKicker')}</p><h2 id="installation-modes-title">${text('modesTitle')}</h2><p class="demo-note">${text('modesText')}</p></div>
        <div class="installation-modes__panel">
          <article class="installation-mode installation-mode--modern" id="npm">
            <div class="demo-guide-mode-card__header"><div class="installation-mode__identity"><span class="installation-mode__number">01</span><span class="demo-guide-mode-card__icon">${demoIcon('modern', { size: 24 })}</span><h3>Modern JavaScript / npm</h3></div><span class="demo-guide-badge">npm + ESM</span></div>
            <div class="demo-guide-mode-card__body"><p class="demo-note">${text('modernText')}</p>
              <span class="demo-guide-code-label">${text('installLabel')}</span>${code(`<span class="syntax-command">npm install</span> <span class="syntax-string">amb-grid</span>`)}
              <span class="demo-guide-code-label">${text('importLabel')}</span>${code(`<span class="syntax-keyword">import</span> { <span class="syntax-api">AMB</span> } <span class="syntax-keyword">from</span> <span class="syntax-string">'amb-grid'</span>;
<span class="syntax-keyword">import</span> <span class="syntax-string">'amb-grid/style.css'</span>;`)}
            </div>
          </article>
          <article class="installation-mode installation-mode--legacy" id="standalone">
            <div class="demo-guide-mode-card__header"><div class="installation-mode__identity"><span class="installation-mode__number">02</span><span class="demo-guide-mode-card__icon">${demoIcon('legacy', { size: 24 })}</span><h3>Browser / standalone</h3></div><span class="demo-guide-badge demo-guide-badge--legacy">Standalone</span></div>
            <div class="demo-guide-mode-card__body"><p class="demo-note">${text('browserText')}</p>
              <span class="demo-guide-code-label">${text('assetsLabel')}</span>${code(`&lt;<span class="syntax-tag">link</span> <span class="syntax-attr">rel</span>=<span class="syntax-string">"stylesheet"</span> <span class="syntax-attr">href</span>=<span class="syntax-string">"./vendor/amb-grid/amb-grid.css"</span>&gt;
&lt;<span class="syntax-tag">script</span> <span class="syntax-attr">src</span>=<span class="syntax-string">"./vendor/amb-grid/amb-grid.umd.js"</span>&gt;&lt;/<span class="syntax-tag">script</span>&gt;`)}
              <span class="demo-guide-code-label">${text('globalLabel')}</span>${code(`<span class="syntax-keyword">const</span> grid = <span class="syntax-api">AMB</span>.<span class="syntax-function">table</span>({ ... });`)}
              <p class="demo-guide-mode-note">${text('bundleText')}</p>
              <div class="installation-bundle"><a class="demo-button demo-button--primary installation-download" href="${zipUrl}">${text('download')} →</a><span>${zipName} · GitHub Release ${releaseTag}</span><a class="installation-all-releases" href="https://github.com/ambruoso-luigi/amb-grid/releases">${text('allReleases')}</a><p class="installation-asset-placement">${text('assetPlacement')}</p><h4>${text('bundleContents')}</h4>${code(`amb-grid/
├── amb-grid.umd.js
├── amb-grid.css
├── README.md
├── LICENSE
└── VERSION.txt`)}</div>
            </div>
          </article>
        </div>
      </section>
      <section class="installation-verification" aria-labelledby="installation-verification-title"><div class="installation-verification__copy"><h2 id="installation-verification-title">${text('verify')}</h2><p class="demo-note">${text('verifyText')}</p><span class="demo-guide-code-label">${text('htmlLabel')}</span>${code(`&lt;<span class="syntax-tag">div</span> <span class="syntax-attr">id</span>=<span class="syntax-string">"grid"</span>&gt;&lt;/<span class="syntax-tag">div</span>&gt;`)}<a class="installation-guide-link" href="/#getting-started-javascript">${text('guide')} →</a></div><div class="installation-verification__example"><span class="demo-guide-code-label">${text('javascriptLabel')}</span>${verificationCode()}</div></section>
      <section class="installation-next" aria-labelledby="installation-next-title"><h2 id="installation-next-title">${text('next')}</h2><nav class="installation-frameworks" aria-label="${text('next')}"><a href="/#getting-started-javascript">JavaScript →</a><a href="/#getting-started-react">React →</a><a href="/#framework-integrations">Vue → <small>${text('frameworkOverview')}</small></a><a href="/#framework-integrations">Angular → <small>${text('frameworkOverview')}</small></a></nav></section>
      ${renderDemoFooter({ demoHref: '/#javascript-demo', examplesHref: '/#feature-examples', guideHref: '/#getting-started-javascript' })}</main>`;
    document.documentElement.lang = language;
    document.title = text('title');
    document.querySelector('meta[name="description"]')?.setAttribute('content', text('description'));
};
render();
