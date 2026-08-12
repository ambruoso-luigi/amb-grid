import { renderDemoBrand } from './demo-brand.js';
import { demoIcon } from './demo-icons.js';

export default function gettingStartedJavaScript(app) {
    app.innerHTML = `
        <main class="demo-page demo-guide-page js-guide-page site-container site-container--wide">
            <header class="demo-guide-hero">
                <nav class="demo-topbar" aria-label="AMB Grid guide navigation">
                    ${renderDemoBrand()}
                    <div class="language-switch is-it" data-language-switch aria-label="Language">
                        <button
                            type="button"
                            class="language-switch__label language-switch__label--en"
                            data-language-label="en"
                            data-language-set="en"
                            aria-label="English"
                            aria-pressed="false"
                        >EN</button>
                        <button
                            type="button"
                            class="language-switch__control"
                            data-language-toggle
                            role="switch"
                            aria-checked="true"
                            aria-label="Cambia lingua in inglese"
                        >
                            <span class="language-switch__flag language-switch__flag--en" aria-hidden="true"></span>
                            <span class="language-switch__flag language-switch__flag--it" aria-hidden="true"></span>
                            <span class="language-switch__knob" aria-hidden="true"></span>
                        </button>
                        <button
                            type="button"
                            class="language-switch__label language-switch__label--it"
                            data-language-label="it"
                            data-language-set="it"
                            aria-label="Italiano"
                            aria-pressed="true"
                        >IT</button>
                    </div>
                </nav>
                <a class="demo-back-link" href="#top" data-i18n="guide.back">Torna alla home demo</a>
                <div class="demo-guide-hero__content">
                    <p class="demo-kicker" data-i18n="guide.badge">JavaScript</p>
                    <h1 data-i18n="guide.title">AMB Grid con JavaScript</h1>
                    <p class="demo-hero__text" data-i18n="guide.description">Demo tabellare e guida essenziale per usare AMB Grid in una pagina JavaScript classica, senza framework obbligatori.</p>
                </div>
            </header>

            <section class="demo-panel demo-panel--main demo-panel--javascript" id="javascript-demo"></section>

            <section class="demo-section demo-guide-start" id="javascript-getting-started">
                <div class="demo-section-heading">
                    <p class="demo-kicker" data-i18n="guide.badge">JavaScript</p>
                    <h2 data-i18n="guide.startTitle">Inizia con AMB Grid in JavaScript</h2>
                    <p class="demo-note" data-i18n="guide.startText">Dopo la demo completa, questi step mostrano il minimo necessario per preparare container, dati, colonne e payload in una pagina JavaScript.</p>
                </div>

                <div class="demo-guide-steps" aria-label="JavaScript getting started steps">
                    <article class="demo-guide-step">
                        <span class="demo-guide-step__number">1</span>
                        <div>
                            <h3 data-i18n="guide.step1.title">Prepara il container</h3>
                            <p class="demo-note" data-i18n="guide.step1.text">Crea nel markup un punto di mount dedicato alla griglia.</p>
                            <pre class="demo-code-block"><code>&lt;div id="grid"&gt;&lt;/div&gt;</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-step">
                        <span class="demo-guide-step__number">2</span>
                        <div>
                            <h3 data-i18n="guide.step2.title">Importa AMB Grid</h3>
                            <p class="demo-note" data-i18n="guide.step2.text">Installa il package e importa l'API pubblica insieme allo stylesheet completo.</p>
                            <pre class="demo-code-block"><code>npm install amb-grid

import { AMB } from 'amb-grid';
import 'amb-grid/style.css';</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-step">
                        <span class="demo-guide-step__number">3</span>
                        <div>
                            <h3 data-i18n="guide.step3.title">Definisci dati e colonne</h3>
                            <p class="demo-note" data-i18n="guide.step3.text">Parti da un dataset piccolo e da colonne esplicite. I validator possono essere aggiunti dove servono regole applicative.</p>
                            <pre class="demo-code-block"><code>const rows = [
  { id: 1, sku: 'SKU-1001', productName: 'Steel shelving unit', stockQuantity: 42 },
  { id: 2, sku: 'SKU-1002', productName: 'Barcode scanner', stockQuantity: 8 }
];

const columns = [
  { title: 'SKU', field: 'sku', editor: AMB.editors.text({ uppercase: true }) },
  { title: 'Product name', field: 'productName', editor: AMB.editors.text({ trim: true }) },
  {
    title: 'Stock quantity',
    field: 'stockQuantity',
    editor: AMB.editors.integer({ allowEmpty: false }),
    formatter: AMB.formatters.integer(),
    validation: { integer: true, min: { value: 0 } }
  }
];</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-step">
                        <span class="demo-guide-step__number">4</span>
                        <div>
                            <h3 data-i18n="guide.step4.title">Crea la griglia CRUD</h3>
                            <p class="demo-note" data-i18n="guide.step4.text">AMB.table monta Tabulator e aggiunge lo strato CRUD di AMB Grid per stati riga, validazione e payload.</p>
                            <pre class="demo-code-block"><code>const grid = AMB.table({
  selector: '#grid',
  data: rows,
  columns,
  layout: 'fitColumns',
  deleteColumn: { enabled: true },
  toolbar: {
    buttons: ['add', 'reload', 'save', 'payload', 'validate'],
    onAdd: () => {
      return grid.crud.addRow({ id: null, sku: '', productName: '', stockQuantity: 0 });
    },
    onPayload: ({ payload }) => console.log(payload)
  }
});</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-step">
                        <span class="demo-guide-step__number">5</span>
                        <div>
                            <h3 data-i18n="guide.step5.title">Leggi il payload</h3>
                            <p class="demo-note" data-i18n="guide.step5.text">Quando l'applicazione deve salvare, leggi il payload CRUD generato da AMB Grid e invialo al tuo backend.</p>
                            <pre class="demo-code-block"><code>const payload = grid.crud.getSavePayload();

if (payload.canSave) {
  await saveRows(payload.changes);
}</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-step demo-guide-step--next">
                        <span class="demo-guide-step__number">6</span>
                        <div>
                            <h3 data-i18n="guide.step6.title">Prossimi passi</h3>
                            <p class="demo-note" data-i18n="guide.step6.text">Rivedi la demo completa per vedere lookup, autocomplete, toolbar, rollback, validazione e payload nello stesso flusso.</p>
                            <div class="demo-guide-actions">
                                <a class="demo-button demo-button--primary" href="#getting-started-javascript">${demoIcon('arrowRight')}<span data-i18n="guide.openMainDemo">Torna alla demo</span></a>
                                <a class="demo-button" href="#feature-examples">${demoIcon('selected')}<span data-i18n="guide.openExamples">Vedi esempi funzionali</span></a>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            <section class="demo-section demo-guide-start demo-guide-integration" id="javascript-integration">
                <div class="demo-section-heading">
                    <p class="demo-kicker" data-i18n="guide.integration.kicker">Due modalità, una sola API</p>
                    <h2 data-i18n="guide.integration.title">Usare AMB Grid con JavaScript</h2>
                    <p class="demo-note" data-i18n="guide.integration.text">AMB Grid si integra direttamente in JavaScript ed è framework-agnostic: usa il package npm in un progetto moderno oppure il bundle UMD in una pagina browser o server-rendered.</p>
                </div>

                <div class="demo-guide-classic-layout">
                    <article class="demo-guide-mode-card demo-guide-mode-card--modern">
                        <div class="demo-guide-mode-card__header">
                            <span class="demo-guide-mode-card__icon">${demoIcon('modern', { size: 24 })}</span>
                            <span class="demo-guide-badge" data-i18n="guide.integration.modernBadge">npm + ESM</span>
                        </div>
                        <div class="demo-guide-mode-card__body">
                            <h3 data-i18n="guide.integration.modernTitle">Modern JavaScript / npm</h3>
                            <p class="demo-note" data-i18n="guide.integration.modernText">La scelta naturale per Vite, bundler e applicazioni JavaScript moderne, con dipendenze gestite da npm.</p>
                            <span class="demo-guide-code-label" data-i18n="guide.integration.installLabel">Installazione</span>
                            <pre class="demo-code-block demo-code-block--compact"><code>npm install amb-grid</code></pre>
                            <span class="demo-guide-code-label" data-i18n="guide.integration.importLabel">Import</span>
                            <pre class="demo-code-block demo-code-block--compact"><code>import { AMB } from 'amb-grid';
import 'amb-grid/style.css';</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-mode-card demo-guide-mode-card--legacy">
                        <div class="demo-guide-mode-card__header">
                            <span class="demo-guide-mode-card__icon">${demoIcon('legacy', { size: 24 })}</span>
                            <span class="demo-guide-badge demo-guide-badge--legacy" data-i18n="guide.integration.browserBadge">Standalone</span>
                        </div>
                        <div class="demo-guide-mode-card__body">
                            <h3 data-i18n="guide.integration.browserTitle">Browser / legacy-friendly</h3>
                            <p class="demo-note" data-i18n="guide.integration.browserText">Per pagine browser, server-rendered e applicazioni esistenti che non richiedono npm, bundler o framework.</p>
                            <span class="demo-guide-code-label" data-i18n="guide.integration.assetsLabel">Caricamento asset</span>
                            <pre class="demo-code-block demo-code-block--compact"><code>&lt;link rel="stylesheet" href="./vendor/amb-grid/amb-grid.css"&gt;
&lt;script src="./vendor/amb-grid/amb-grid.umd.js"&gt;&lt;/script&gt;</code></pre>
                            <span class="demo-guide-code-label" data-i18n="guide.integration.globalLabel">Global pubblico</span>
                            <pre class="demo-code-block demo-code-block--compact"><code>const grid = AMB.table({ ... });</code></pre>
                            <p class="demo-guide-mode-note" data-i18n="guide.integration.bundleText">Il bundle UMD incorpora le dipendenze JavaScript interne: non caricare separatamente Tabulator, Awesomplete o vanilla-datepicker.</p>
                        </div>
                    </article>

                    <article class="demo-guide-code-section demo-guide-code-section--wide demo-guide-code-section--setup">
                        <div class="demo-guide-code-heading">
                            <span class="demo-guide-badge demo-guide-badge--setup">${demoIcon('code', { size: 15 })}<span data-i18n="guide.integration.setupBadge">Setup essenziale</span></span>
                            <h3 data-i18n="guide.integration.containerTitle">1. Prepara il container</h3>
                            <p class="demo-note" data-i18n="guide.integration.containerText">La pagina prepara soltanto un punto di mount dedicato; AMB Grid gestisce il DOM interno della tabella.</p>
                            <pre class="demo-code-block"><code>&lt;main class="inventory-page"&gt;
  &lt;div id="inventory-table"&gt;&lt;/div&gt;
&lt;/main&gt;</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-code-section">
                        <div class="demo-guide-code-heading">
                            <h3 data-i18n="guide.integration.jsTitle">2. Dati, colonne e griglia</h3>
                            <p class="demo-note" data-i18n="guide.integration.jsText">La stessa API pubblica funziona con l'import ESM o con il global AMB del bundle browser.</p>
                            <pre class="demo-code-block"><code>const rows = [
  { code: 'SKU-1001', description: 'Steel shelving unit' },
  { code: 'SKU-1002', description: 'Barcode scanner' }
];

const columns = [
  { title: 'Code', field: 'code', editor: AMB.editors.text({ uppercase: true }) },
  { title: 'Description', field: 'description', editor: AMB.editors.text() }
];

const grid = AMB.table({
  selector: '#inventory-table',
  data: rows,
  columns
});</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-code-section">
                        <div class="demo-guide-code-heading">
                            <h3 data-i18n="guide.integration.cssTitle">3. CSS applicativo</h3>
                            <p class="demo-note" data-i18n="guide.integration.cssText">Lo stile della pagina resta piccolo e separato dallo stylesheet completo di AMB Grid.</p>
                            <pre class="demo-code-block"><code>.inventory-page {
  padding: 24px;
}

#inventory-table {
  margin-top: 16px;
}</code></pre>
                        </div>
                    </article>
                </div>
            </section>

            <section class="demo-section demo-video-card">
                <div>
                    <p class="demo-kicker" data-i18n="guide.videoKicker">Video guida</p>
                    <h2 data-i18n="guide.videoTitle">Installazione e uso in JavaScript</h2>
                    <p class="demo-note" data-i18n="guide.videoText">Qui verrà collegato il video introduttivo su installazione e uso di AMB Grid in JavaScript.</p>
                </div>
                <button class="demo-button demo-button--disabled" type="button" disabled>${demoIcon('video')}<span data-i18n="guide.videoCta">Video in arrivo</span></button>
            </section>
        </main>
    `;

    return null;
}
