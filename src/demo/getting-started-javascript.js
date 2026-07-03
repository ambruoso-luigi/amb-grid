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
                            <p class="demo-note" data-i18n="guide.step2.text">Durante lo sviluppo locale importa la libreria dal sorgente o dal build del progetto. Quando il pacchetto npm sarà disponibile, questa sezione conterrà il comando ufficiale.</p>
                            <pre class="demo-code-block"><code>import { AMB } from './src/index.js';
// oppure importa lo stesso export dal tuo build locale quando lo prepari.</code></pre>
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

            <section class="demo-section demo-guide-start demo-guide-classic" id="classic-html-js-css-integration">
                <div class="demo-section-heading">
                    <p class="demo-kicker" data-i18n="guide.classic.kicker">Legacy-friendly</p>
                    <h2 data-i18n="guide.classic.title">Integrazione classica HTML + JS + CSS</h2>
                    <p class="demo-note" data-i18n="guide.classic.text">AMB Grid resta framework-agnostic: Tabulator è il motore tabellare, mentre AMB Grid aggiunge lo strato CRUD applicativo senza imporre React, Vue o Angular.</p>
                </div>

                <div class="demo-guide-classic-layout">
                    <article class="demo-guide-mode-card">
                        <span class="demo-guide-badge" data-i18n="guide.classic.modernBadge">Modern</span>
                        <div>
                            <h3 data-i18n="guide.classic.modernTitle">Modern JavaScript / bundler</h3>
                            <p class="demo-note" data-i18n="guide.classic.modernText">Usa import ESM in Vite, bundler o progetti moderni. Durante lo sviluppo locale puoi importare AMB dal sorgente o dal build preparato dal progetto.</p>
                            <pre class="demo-code-block demo-code-block--compact"><code>import { AMB } from './src/index.js';</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-mode-card demo-guide-mode-card--legacy">
                        <span class="demo-guide-badge demo-guide-badge--legacy" data-i18n="guide.classic.legacyBadge">Legacy-friendly</span>
                        <div>
                            <h3 data-i18n="guide.classic.classicTitle">Classic HTML + JS + CSS</h3>
                            <p class="demo-note" data-i18n="guide.classic.classicText">Nelle pagine server-rendered puoi mantenere una struttura classica: HTML importa CSS e script, il JS della pagina configura AMB Grid, il CSS della pagina contiene solo lo stile specifico del progetto.</p>
                            <div class="demo-guide-file-structure">
                                <span class="demo-guide-code-label" data-i18n="guide.classic.filesTitle">Struttura file</span>
                                <p class="demo-note" data-i18n="guide.classic.filesText">Tre file separano markup, configurazione AMB Grid e stile applicativo della pagina.</p>
                                <pre class="demo-code-block demo-code-block--compact"><code>inventory-page.html
inventory-page.js
inventory-page.css</code></pre>
                            </div>
                        </div>
                    </article>

                    <article class="demo-guide-code-section demo-guide-code-section--wide demo-guide-code-section--planned">
                        <div class="demo-guide-code-heading">
                            <span class="demo-guide-badge demo-guide-badge--planned" data-i18n="guide.classic.plannedBadge">Futura build browser</span>
                            <h3 data-i18n="guide.classic.htmlTitle">HTML previsto per la futura build browser</h3>
                            <p class="demo-note" data-i18n="guide.classic.htmlText">AMB Grid non produce ancora un file amb-grid.umd.js o amb-grid.iife.js. Questo snippet è uno schema previsto per la futura build browser, non un path già pronto in produzione.</p>
                            <pre class="demo-code-block"><code>&lt;link rel="stylesheet" href="https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator.min.css"&gt;
&lt;link rel="stylesheet" href="./vendor/amb-grid/amb-grid.css"&gt;
&lt;link rel="stylesheet" href="./css/inventory-page.css"&gt;

&lt;div id="inventory-table"&gt;&lt;/div&gt;

&lt;script src="https://unpkg.com/tabulator-tables@6.3.1/dist/js/tabulator.min.js"&gt;&lt;/script&gt;
&lt;script src="./vendor/amb-grid/amb-grid.umd.js"&gt;&lt;/script&gt;
&lt;script src="./js/inventory-page.js"&gt;&lt;/script&gt;</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-code-section">
                        <div class="demo-guide-code-heading">
                            <h3 data-i18n="guide.classic.jsTitle">inventory-page.js</h3>
                            <p class="demo-note" data-i18n="guide.classic.jsText">La callback Add restituisce la Promise di crud.addRow(...), così la toolbar può mantenere lo stato busy e attendere reveal e focus.</p>
                            <pre class="demo-code-block"><code>const grid = AMB.table({
  selector: '#inventory-table',
  data: products,
  columns: [
    {
      title: 'Code',
      field: 'code',
      editor: AMB.editors.text({ uppercase: true })
    },
    {
      title: 'Description',
      field: 'description',
      editor: AMB.editors.text()
    }
  ],
  toolbar: {
    buttons: ['add', 'save', 'payload'],
    onAdd() {
      return grid.crud.addRow({
        code: '',
        description: ''
      });
    }
  }
});</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-code-section">
                        <div class="demo-guide-code-heading">
                            <h3 data-i18n="guide.classic.cssTitle">inventory-page.css</h3>
                            <p class="demo-note" data-i18n="guide.classic.cssText">Lo stile applicativo resta separato dallo stylesheet della libreria.</p>
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
