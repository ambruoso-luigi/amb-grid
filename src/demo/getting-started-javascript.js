import { renderDemoBrand } from './demo-brand.js';
import { demoIcon } from './demo-icons.js';
import { renderDemoFooter } from './demo-footer.js';

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
                <div class="demo-guide-hero__layout">
                    <div class="demo-guide-hero__copy">
                        <a class="demo-back-link" href="#top" data-i18n="guide.back">Torna alla home demo</a>
                        <div class="demo-guide-hero__content">
                            <p class="demo-kicker" data-i18n="guide.badge">JavaScript</p>
                            <h1 data-i18n="guide.title">AMB Grid con JavaScript</h1>
                            <p class="demo-hero__text" data-i18n="guide.description">Demo tabellare e guida essenziale per usare AMB Grid con JavaScript moderno o direttamente nel browser, senza framework obbligatori.</p>
                        </div>
                    </div>
                    <a
                        class="demo-guide-video"
                        href="https://youtu.be/4m0EZ4vPmT0"
                        target="_blank"
                        rel="noopener noreferrer"
                        data-i18n-title="guide.videoOpen"
                        aria-label="Apri il video demo placeholder su YouTube"
                    >
                        <img
                            class="demo-guide-video__image"
                            src="https://i.ytimg.com/vi/4m0EZ4vPmT0/hqdefault.jpg"
                            alt=""
                            loading="eager"
                        >
                        <span class="demo-guide-video__overlay" aria-hidden="true"></span>
                        <span class="demo-guide-video__play" aria-hidden="true">${demoIcon('video', { size: 30 })}</span>
                        <span class="demo-guide-video__label" data-i18n="guide.videoLabel">Video demo — placeholder</span>
                    </a>
                </div>
            </header>

            <section class="demo-panel demo-panel--main demo-panel--javascript" id="javascript-demo"></section>

            <section class="demo-guide-section demo-guide-start" id="javascript-getting-started">
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
                            <pre class="demo-code-block"><code>&lt;<span class="syntax-tag">div</span> <span class="syntax-attr">id</span>=<span class="syntax-string">"grid"</span>&gt;&lt;/<span class="syntax-tag">div</span>&gt;</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-step">
                        <span class="demo-guide-step__number">2</span>
                        <div>
                            <h3 data-i18n="guide.step2.title">Importa AMB Grid</h3>
                            <p class="demo-note" data-i18n="guide.step2.text">Installa il package e importa l'API pubblica insieme allo stylesheet completo.</p>
                            <pre class="demo-code-block"><code><span class="syntax-command">npm install</span> <span class="syntax-string">amb-grid</span>

<span class="syntax-keyword">import</span> { <span class="syntax-api">AMB</span> } <span class="syntax-keyword">from</span> <span class="syntax-string">'amb-grid'</span>;
<span class="syntax-keyword">import</span> <span class="syntax-string">'amb-grid/style.css'</span>;</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-step">
                        <span class="demo-guide-step__number">3</span>
                        <div>
                            <h3 data-i18n="guide.step3.title">Definisci dati e colonne</h3>
                            <p class="demo-note" data-i18n="guide.step3.text">Parti da un dataset piccolo e da colonne esplicite. I validator possono essere aggiunti dove servono regole applicative.</p>
                            <pre class="demo-code-block"><code><span class="syntax-keyword">const</span> rows = [
  { <span class="syntax-property">id</span>: <span class="syntax-number">1</span>, <span class="syntax-property">sku</span>: <span class="syntax-string">'SKU-1001'</span>, <span class="syntax-property">productName</span>: <span class="syntax-string">'Steel shelving unit'</span>, <span class="syntax-property">stockQuantity</span>: <span class="syntax-number">42</span> },
  { <span class="syntax-property">id</span>: <span class="syntax-number">2</span>, <span class="syntax-property">sku</span>: <span class="syntax-string">'SKU-1002'</span>, <span class="syntax-property">productName</span>: <span class="syntax-string">'Barcode scanner'</span>, <span class="syntax-property">stockQuantity</span>: <span class="syntax-number">8</span> }
];

<span class="syntax-keyword">const</span> columns = [
  { <span class="syntax-property">title</span>: <span class="syntax-string">'SKU'</span>, <span class="syntax-property">field</span>: <span class="syntax-string">'sku'</span>, <span class="syntax-property">editor</span>: <span class="syntax-api">AMB.editors</span>.<span class="syntax-function">text</span>({ <span class="syntax-property">uppercase</span>: <span class="syntax-keyword">true</span> }) },
  { <span class="syntax-property">title</span>: <span class="syntax-string">'Product name'</span>, <span class="syntax-property">field</span>: <span class="syntax-string">'productName'</span>, <span class="syntax-property">editor</span>: <span class="syntax-api">AMB.editors</span>.<span class="syntax-function">text</span>({ <span class="syntax-property">trim</span>: <span class="syntax-keyword">true</span> }) },
  {
    <span class="syntax-property">title</span>: <span class="syntax-string">'Stock quantity'</span>,
    <span class="syntax-property">field</span>: <span class="syntax-string">'stockQuantity'</span>,
    <span class="syntax-property">editor</span>: <span class="syntax-api">AMB.editors</span>.<span class="syntax-function">integer</span>({ <span class="syntax-property">allowEmpty</span>: <span class="syntax-keyword">false</span> }),
    <span class="syntax-property">formatter</span>: <span class="syntax-api">AMB.formatters</span>.<span class="syntax-function">integer</span>(),
    <span class="syntax-property">validation</span>: { <span class="syntax-property">integer</span>: <span class="syntax-keyword">true</span>, <span class="syntax-property">min</span>: { <span class="syntax-property">value</span>: <span class="syntax-number">0</span> } }
  }
];</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-step">
                        <span class="demo-guide-step__number">4</span>
                        <div>
                            <h3 data-i18n="guide.step4.title">Crea la griglia CRUD</h3>
                            <p class="demo-note" data-i18n="guide.step4.text">AMB.table monta la griglia e coordina stati riga, validazione e payload attraverso l’API pubblica di AMB Grid.</p>
                            <pre class="demo-code-block"><code><span class="syntax-keyword">const</span> grid = <span class="syntax-api">AMB</span>.<span class="syntax-function">table</span>({
  <span class="syntax-property">selector</span>: <span class="syntax-string">'#grid'</span>,
  <span class="syntax-property">data</span>: rows,
  <span class="syntax-property">columns</span>,
  <span class="syntax-property">layout</span>: <span class="syntax-string">'fitColumns'</span>,
  <span class="syntax-property">deleteColumn</span>: { <span class="syntax-property">enabled</span>: <span class="syntax-keyword">true</span> },
  <span class="syntax-property">toolbar</span>: {
    <span class="syntax-property">buttons</span>: [<span class="syntax-string">'add'</span>, <span class="syntax-string">'reload'</span>, <span class="syntax-string">'save'</span>, <span class="syntax-string">'payload'</span>, <span class="syntax-string">'validate'</span>],
    <span class="syntax-function">onAdd</span>: () => {
      <span class="syntax-keyword">return</span> grid.crud.<span class="syntax-function">addRow</span>({ <span class="syntax-property">id</span>: <span class="syntax-keyword">null</span>, <span class="syntax-property">sku</span>: <span class="syntax-string">''</span>, <span class="syntax-property">productName</span>: <span class="syntax-string">''</span>, <span class="syntax-property">stockQuantity</span>: <span class="syntax-number">0</span> });
    },
    <span class="syntax-function">onPayload</span>: ({ payload }) => console.<span class="syntax-function">log</span>(payload)
  }
});</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-step">
                        <span class="demo-guide-step__number">5</span>
                        <div>
                            <h3 data-i18n="guide.step5.title">Leggi il payload</h3>
                            <p class="demo-note" data-i18n="guide.step5.text">Quando l'applicazione deve salvare, leggi il payload CRUD generato da AMB Grid e invialo al tuo backend.</p>
                            <pre class="demo-code-block"><code><span class="syntax-keyword">const</span> payload = grid.crud.<span class="syntax-function">getSavePayload</span>();

<span class="syntax-keyword">if</span> (payload.canSave) {
  <span class="syntax-keyword">await</span> <span class="syntax-function">saveRows</span>(payload.changes);
}</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-step demo-guide-step--next">
                        <span class="demo-guide-step__number">6</span>
                        <div>
                            <h3 data-i18n="guide.step6.title">Prossimi passi</h3>
                            <p class="demo-note" data-i18n="guide.step6.text">Rivedi la demo completa per vedere lookup, autocomplete, toolbar, rollback, validazione e payload nello stesso flusso.</p>
                            <div class="demo-guide-actions">
                                <a class="demo-button demo-button--primary" href="#javascript-demo">${demoIcon('arrowRight')}<span data-i18n="guide.openMainDemo">Torna alla demo</span></a>
                                <a class="demo-button" href="#feature-examples">${demoIcon('selected')}<span data-i18n="guide.openExamples">Vedi esempi funzionali</span></a>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            <section class="demo-guide-section demo-guide-start demo-guide-integration" id="javascript-integration">
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
                            <p class="demo-note" data-i18n="guide.integration.modernText">La scelta naturale per Vite, bundler e applicazioni JavaScript moderne, con installazione e aggiornamenti gestiti da npm.</p>
                            <span class="demo-guide-code-label" data-i18n="guide.integration.installLabel">Installazione</span>
                            <pre class="demo-code-block demo-code-block--compact"><code><span class="syntax-command">npm install</span> <span class="syntax-string">amb-grid</span></code></pre>
                            <span class="demo-guide-code-label" data-i18n="guide.integration.importLabel">Import</span>
                            <pre class="demo-code-block demo-code-block--compact"><code><span class="syntax-keyword">import</span> { <span class="syntax-api">AMB</span> } <span class="syntax-keyword">from</span> <span class="syntax-string">'amb-grid'</span>;
<span class="syntax-keyword">import</span> <span class="syntax-string">'amb-grid/style.css'</span>;</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-mode-card demo-guide-mode-card--legacy">
                        <div class="demo-guide-mode-card__header">
                            <span class="demo-guide-mode-card__icon">${demoIcon('legacy', { size: 24 })}</span>
                            <span class="demo-guide-badge demo-guide-badge--legacy" data-i18n="guide.integration.browserBadge">Standalone</span>
                        </div>
                        <div class="demo-guide-mode-card__body">
                            <h3 data-i18n="guide.integration.browserTitle">Browser / standalone</h3>
                            <p class="demo-note" data-i18n="guide.integration.browserText">Per pagine browser, server-rendered e applicazioni esistenti che non richiedono npm, bundler o framework.</p>
                            <span class="demo-guide-code-label" data-i18n="guide.integration.assetsLabel">Caricamento asset</span>
                            <pre class="demo-code-block demo-code-block--compact"><code>&lt;<span class="syntax-tag">link</span> <span class="syntax-attr">rel</span>=<span class="syntax-string">"stylesheet"</span> <span class="syntax-attr">href</span>=<span class="syntax-string">"./vendor/amb-grid/amb-grid.css"</span>&gt;
&lt;<span class="syntax-tag">script</span> <span class="syntax-attr">src</span>=<span class="syntax-string">"./vendor/amb-grid/amb-grid.umd.js"</span>&gt;&lt;/<span class="syntax-tag">script</span>&gt;</code></pre>
                            <span class="demo-guide-code-label" data-i18n="guide.integration.globalLabel">Global pubblico</span>
                            <pre class="demo-code-block demo-code-block--compact"><code><span class="syntax-keyword">const</span> grid = <span class="syntax-api">AMB</span>.<span class="syntax-function">table</span>({ ... });</code></pre>
                            <p class="demo-guide-mode-note" data-i18n="guide.integration.bundleText">Il bundle UMD è pronto per l’uso standalone: carica soltanto gli asset AMB Grid indicati qui sopra.</p>
                        </div>
                    </article>

                    <article class="demo-guide-code-section demo-guide-code-section--wide demo-guide-code-section--setup">
                        <div class="demo-guide-code-heading">
                            <span class="demo-guide-badge demo-guide-badge--setup">${demoIcon('code', { size: 15 })}<span data-i18n="guide.integration.setupBadge">Setup essenziale</span></span>
                            <h3 data-i18n="guide.integration.containerTitle">1. Prepara il container</h3>
                            <p class="demo-note" data-i18n="guide.integration.containerText">La pagina prepara soltanto un punto di mount dedicato; AMB Grid gestisce il DOM interno della tabella.</p>
                            <pre class="demo-code-block"><code>&lt;<span class="syntax-tag">main</span> <span class="syntax-attr">class</span>=<span class="syntax-string">"inventory-page"</span>&gt;
  &lt;<span class="syntax-tag">div</span> <span class="syntax-attr">id</span>=<span class="syntax-string">"inventory-table"</span>&gt;&lt;/<span class="syntax-tag">div</span>&gt;
&lt;/<span class="syntax-tag">main</span>&gt;</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-code-section">
                        <div class="demo-guide-code-heading">
                            <h3 data-i18n="guide.integration.jsTitle">2. Dati, colonne e griglia</h3>
                            <p class="demo-note" data-i18n="guide.integration.jsText">La stessa API pubblica funziona con l'import ESM o con il global AMB del bundle browser.</p>
                            <pre class="demo-code-block"><code><span class="syntax-keyword">const</span> rows = [
  { <span class="syntax-property">code</span>: <span class="syntax-string">'SKU-1001'</span>, <span class="syntax-property">description</span>: <span class="syntax-string">'Steel shelving unit'</span> },
  { <span class="syntax-property">code</span>: <span class="syntax-string">'SKU-1002'</span>, <span class="syntax-property">description</span>: <span class="syntax-string">'Barcode scanner'</span> }
];

<span class="syntax-keyword">const</span> columns = [
  { <span class="syntax-property">title</span>: <span class="syntax-string">'Code'</span>, <span class="syntax-property">field</span>: <span class="syntax-string">'code'</span>, <span class="syntax-property">editor</span>: <span class="syntax-api">AMB.editors</span>.<span class="syntax-function">text</span>({ <span class="syntax-property">uppercase</span>: <span class="syntax-keyword">true</span> }) },
  { <span class="syntax-property">title</span>: <span class="syntax-string">'Description'</span>, <span class="syntax-property">field</span>: <span class="syntax-string">'description'</span>, <span class="syntax-property">editor</span>: <span class="syntax-api">AMB.editors</span>.<span class="syntax-function">text</span>() }
];

<span class="syntax-keyword">const</span> grid = <span class="syntax-api">AMB</span>.<span class="syntax-function">table</span>({
  <span class="syntax-property">selector</span>: <span class="syntax-string">'#inventory-table'</span>,
  <span class="syntax-property">data</span>: rows,
  <span class="syntax-property">columns</span>
});</code></pre>
                        </div>
                    </article>

                    <article class="demo-guide-code-section">
                        <div class="demo-guide-code-heading">
                            <h3 data-i18n="guide.integration.cssTitle">3. CSS applicativo</h3>
                            <p class="demo-note" data-i18n="guide.integration.cssText">Lo stile della pagina resta piccolo e separato dallo stylesheet completo di AMB Grid.</p>
                            <pre class="demo-code-block"><code><span class="syntax-selector">.inventory-page</span> {
  <span class="syntax-property">padding</span>: <span class="syntax-number">24px</span>;
}

<span class="syntax-selector">#inventory-table</span> {
  <span class="syntax-property">margin-top</span>: <span class="syntax-number">16px</span>;
}</code></pre>
                        </div>
                    </article>
                </div>
            </section>

            ${renderDemoFooter({ demoHref: '#javascript-demo' })}

        </main>
    `;

    return null;
}
