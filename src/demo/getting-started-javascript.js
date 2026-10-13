import { demoIcon, demoYoutubeIcon, frameworkIcon } from './demo-icons.js';
import { renderDemoBrand } from './demo-brand.js';
import { renderDemoFooter } from './demo-footer.js';

export default function gettingStartedJavaScript(app) {
    app.innerHTML = `
        <main class="demo-page demo-guide-page js-guide-page site-container site-container--wide">
            <header class="demo-guide-hero">
                <div class="demo-guide-hero__brand">${renderDemoBrand({ href: '#top' })}</div>
                <div class="demo-guide-hero__layout">
                    <div class="demo-guide-hero__copy">
                        <div class="demo-framework-identity">
                            <span class="demo-framework-identity__logo">
                                ${frameworkIcon('javascript')}
                            </span>
                            <div class="demo-framework-identity__copy">
                                <p class="demo-framework-identity__title" data-i18n="guide.identity.title">Integrazione JavaScript</p>
                                <p data-i18n="guide.identity.description">AMB Grid utilizzata direttamente in Vanilla JavaScript, senza framework applicativi obbligatori.</p>
                            </div>
                        </div>
                        <div class="demo-guide-hero__content">
                            <h1 data-i18n="guide.title">AMB Grid con JavaScript</h1>
                            <p class="demo-hero__text" data-i18n="guide.description">Demo tabellare e guida essenziale per usare AMB Grid con JavaScript moderno o direttamente nel browser, senza framework obbligatori.</p>
                            <p class="demo-framework-identity__stack" data-i18n="guide.identity.stack">JavaScript · Tailwind CSS · daisyUI · Motion · Lucide</p>
                        </div>
                    </div>
                </div>
                <a
                    class="demo-video-preview demo-guide-video"
                    href="https://youtu.be/4m0EZ4vPmT0"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-i18n-title="guide.videoOpen"
                    aria-label="Apri Demo JavaScript su YouTube"
                >
                    <img
                        class="demo-video-preview__image"
                        src="https://i.ytimg.com/vi/4m0EZ4vPmT0/hqdefault.jpg"
                        alt=""
                        loading="eager"
                    >
                    <span class="demo-video-preview__overlay" aria-hidden="true"></span>
                    <span class="demo-video-preview__title" data-i18n="guide.videoTitle">Demo JavaScript</span>
                    <span class="demo-video-preview__destination">
                        <span class="demo-video-preview__brand">${demoYoutubeIcon({ className: 'demo-video-preview__brand-icon', size: 20 })}</span>
                        <span data-i18n="video.youtube">YouTube</span>
                    </span>
                </a>
            </header>

            <section class="demo-panel demo-panel--main demo-panel--javascript" id="javascript-demo"></section>

            <section class="demo-guide-section demo-guide-start" id="javascript-getting-started">
                <div class="demo-section-heading">
                    <p class="demo-kicker" data-i18n="guide.badge">JavaScript</p>
                    <h2 data-i18n="guide.startTitle">Inizia con AMB Grid in JavaScript</h2>
                    <p class="demo-note" data-i18n="guide.startText">Dopo la demo completa, questi step mostrano il minimo necessario per preparare container, dati, colonne e payload in una pagina JavaScript.</p>
                    <p class="demo-guide-install-link"><span data-i18n="guide.installPrompt">Devi ancora installare AMB Grid?</span> <a href="/install/" data-i18n="guide.installLink">Vai alla pagina Installazione →</a></p>
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
                            <h3 data-i18n="guide.step2.title">Definisci dati e colonne</h3>
                            <p class="demo-note" data-i18n="guide.step2.text">Parti da un dataset piccolo e da colonne esplicite. I validator possono essere aggiunti dove servono regole applicative.</p>
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
                        <span class="demo-guide-step__number">3</span>
                        <div>
                            <h3 data-i18n="guide.step3.title">Crea la griglia CRUD</h3>
                            <p class="demo-note" data-i18n="guide.step3.text">AMB.table monta la griglia e coordina stati riga, validazione e payload attraverso l’API pubblica di AMB Grid.</p>
                            <pre class="demo-code-block"><code><span class="syntax-keyword">const</span> grid = <span class="syntax-api">AMB</span>.<span class="syntax-function">table</span>({
  <span class="syntax-property">selector</span>: <span class="syntax-string">'#grid'</span>,
  <span class="syntax-property">data</span>: rows,
  <span class="syntax-property">columns</span>,
  <span class="syntax-property">layout</span>: <span class="syntax-string">'fitColumns'</span>,
  <span class="syntax-property">rowActionColumn</span>: { <span class="syntax-property">enabled</span>: <span class="syntax-keyword">true</span> },
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
                        <span class="demo-guide-step__number">4</span>
                        <div>
                            <h3 data-i18n="guide.step4.title">Leggi il payload</h3>
                            <p class="demo-note" data-i18n="guide.step4.text">Quando l'applicazione deve salvare, leggi il payload CRUD generato da AMB Grid e invialo al tuo backend.</p>
                            <pre class="demo-code-block"><code><span class="syntax-keyword">const</span> payload = grid.crud.<span class="syntax-function">getSavePayload</span>();

<span class="syntax-keyword">if</span> (payload.canSave) {
  <span class="syntax-keyword">await</span> <span class="syntax-function">saveRows</span>(payload.changes);
}</code></pre>
                        </div>
                    </article>

                </div>
                <div class="demo-guide-next">
                    <h3 data-i18n="guide.next.title">Prossimi passi</h3>
                    <p class="demo-note" data-i18n="guide.next.text">Rivedi la demo completa per vedere lookup, autocomplete, toolbar, rollback, validazione e payload nello stesso flusso.</p>
                    <div class="demo-guide-actions">
                        <a class="demo-button demo-button--primary" href="#javascript-demo">${demoIcon('arrowRight')}<span data-i18n="guide.openMainDemo">Torna alla demo</span></a>
                        <a class="demo-button" href="#feature-examples">${demoIcon('selected')}<span data-i18n="guide.openExamples">Vedi esempi funzionali</span></a>
                    </div>
                </div>
            </section>

            ${renderDemoFooter({ demoHref: '#javascript-demo' })}

        </main>
    `;

    return null;
}
