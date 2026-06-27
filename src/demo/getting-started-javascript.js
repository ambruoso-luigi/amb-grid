export default function gettingStartedJavaScript(app) {
    app.innerHTML = `
        <main class="demo-page demo-guide-page">
            <header class="demo-guide-hero">
                <nav class="demo-topbar" aria-label="AMB Grid guide navigation">
                    <a class="demo-brand" href="#top" aria-label="AMB Grid">AMB Grid</a>
                    <div class="demo-language" aria-label="Language">
                        <button type="button" data-language="it" data-i18n="language.it" data-i18n-title="language.itTitle">🇮🇹 IT</button>
                        <button type="button" data-language="en" data-i18n="language.en" data-i18n-title="language.enTitle">🇬🇧 EN</button>
                    </div>
                </nav>
                <a class="demo-back-link" href="#top" data-i18n="guide.back">Torna alla home demo</a>
                <div class="demo-guide-hero__content">
                    <p class="demo-kicker" data-i18n="guide.badge">JavaScript</p>
                    <h1 data-i18n="guide.title">Inizia con AMB Grid in JavaScript</h1>
                    <p class="demo-hero__text" data-i18n="guide.description">Un percorso rapido per montare una griglia CRUD AMB Grid in una pagina JavaScript classica, senza framework obbligatori.</p>
                </div>
            </header>

            <section class="demo-section demo-guide-intro">
                <div class="demo-section-heading">
                    <h2 data-i18n="guide.introTitle">Esempio base, prima della demo completa</h2>
                    <p class="demo-note" data-i18n="guide.introText">Questa guida mostra il minimo necessario per preparare container, dati, colonne e payload. AMB Grid resta framework-agnostic: puoi usarlo in pagine server-rendered, JavaScript classico o integrazioni moderne. La demo legacy-friendly completa resta nella home.</p>
                </div>
                <div class="demo-guide-actions">
                    <a class="demo-button demo-button--primary" href="#main-demo" data-i18n="guide.openMainDemo">Apri demo legacy-friendly</a>
                    <a class="demo-button" href="#feature-examples" data-i18n="guide.openExamples">Vedi esempi funzionali</a>
                </div>
            </section>

            <section class="demo-section demo-guide-steps" aria-label="JavaScript getting started steps">
                <article class="demo-guide-step">
                    <span class="demo-guide-step__number">1</span>
                    <div>
                        <h2 data-i18n="guide.step1.title">Prepara il container</h2>
                        <p class="demo-note" data-i18n="guide.step1.text">Crea nel markup un punto di mount dedicato alla griglia.</p>
                        <pre class="demo-code-block"><code>&lt;div id="grid"&gt;&lt;/div&gt;</code></pre>
                    </div>
                </article>

                <article class="demo-guide-step">
                    <span class="demo-guide-step__number">2</span>
                    <div>
                        <h2 data-i18n="guide.step2.title">Importa AMB Grid</h2>
                        <p class="demo-note" data-i18n="guide.step2.text">Durante lo sviluppo locale importa la libreria dal sorgente o dal build del progetto. Quando il pacchetto npm sarà disponibile, questa sezione conterrà il comando ufficiale.</p>
                        <pre class="demo-code-block"><code>import { AMB } from './src/index.js';
// oppure importa lo stesso export dal tuo build locale quando lo prepari.</code></pre>
                    </div>
                </article>

                <article class="demo-guide-step">
                    <span class="demo-guide-step__number">3</span>
                    <div>
                        <h2 data-i18n="guide.step3.title">Definisci dati e colonne</h2>
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
                        <h2 data-i18n="guide.step4.title">Crea la griglia CRUD</h2>
                        <p class="demo-note" data-i18n="guide.step4.text">AMB.table monta Tabulator e aggiunge lo strato CRUD di AMB Grid per stati riga, validazione e payload.</p>
                        <pre class="demo-code-block"><code>const grid = AMB.table({
  selector: '#grid',
  data: rows,
  columns,
  layout: 'fitColumns',
  deleteColumn: { enabled: true },
  toolbar: {
    buttons: ['add', 'reload', 'save', 'payload', 'validate'],
    onAdd: () => grid.crud.addRow({ id: null, sku: '', productName: '', stockQuantity: 0 }),
    onPayload: ({ payload }) => console.log(payload)
  }
});</code></pre>
                    </div>
                </article>

                <article class="demo-guide-step">
                    <span class="demo-guide-step__number">5</span>
                    <div>
                        <h2 data-i18n="guide.step5.title">Leggi il payload</h2>
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
                        <h2 data-i18n="guide.step6.title">Prossimi passi</h2>
                        <p class="demo-note" data-i18n="guide.step6.text">Passa alla demo completa per vedere lookup, autocomplete, toolbar, rollback, validazione e payload nello stesso flusso.</p>
                        <div class="demo-guide-actions">
                            <a class="demo-button demo-button--primary" href="#main-demo" data-i18n="guide.openMainDemo">Apri demo legacy-friendly</a>
                            <a class="demo-button" href="#feature-examples" data-i18n="guide.openExamples">Vedi esempi funzionali</a>
                        </div>
                    </div>
                </article>
            </section>

            <section class="demo-section demo-video-card">
                <div>
                    <p class="demo-kicker" data-i18n="guide.videoKicker">Video guida</p>
                    <h2 data-i18n="guide.videoTitle">Installazione e uso in JavaScript</h2>
                    <p class="demo-note" data-i18n="guide.videoText">Qui verrà collegato il video introduttivo su installazione e uso di AMB Grid in JavaScript.</p>
                </div>
                <button class="demo-button demo-button--disabled" type="button" disabled data-i18n="guide.videoCta">Video in arrivo</button>
            </section>
        </main>
    `;

    return null;
}
