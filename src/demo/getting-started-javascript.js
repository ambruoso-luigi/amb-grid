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
                                <p data-i18n="guide.identity.description">Vanilla JavaScript · Nessun framework richiesto</p>
                            </div>
                        </div>
                        <div class="demo-guide-hero__content">
                            <h1 data-i18n="guide.title">Gestionale Magazzino</h1>
                            <p class="demo-hero__text" data-i18n="guide.description">Demo tabellare e guida essenziale per gestire prodotti, giacenze e modifiche in JavaScript moderno o direttamente nel browser, senza framework obbligatori.</p>
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
                    <p class="demo-note" data-i18n="guide.startText">Quattro passaggi per creare una prima griglia con AMB Grid: prepara il contenitore, definisci dati e colonne, inizializza la tabella e ottieni il payload delle modifiche. È un esempio minimo, distinto dal gestionale completo mostrato sopra.</p>
                    <p class="demo-guide-install-link"><span data-i18n="guide.installPrompt">Devi ancora installare AMB Grid?</span> <a href="/install/" data-i18n="guide.installLink">Vai alla pagina Installazione →</a></p>
                </div>

                <ol class="demo-guide-steps" aria-label="JavaScript getting started steps">
                    <li class="demo-guide-step">
                        <span class="demo-guide-step__number" aria-hidden="true">1</span>
                        <div class="demo-guide-step__body">
                            <h3 data-i18n="guide.step1.title">Prepara il contenitore</h3>
                            <p class="demo-note" data-i18n="guide.step1.text">AMB Grid viene montata all'interno di un normale elemento HTML. Aggiungi un contenitore con un identificatore univoco nella posizione in cui vuoi visualizzare la griglia.</p>
                            <p class="demo-note" data-i18n="guide.step1.text2">La libreria utilizzerà questo elemento per generare la tabella e gestirne le interazioni, senza richiedere una struttura HTML complessa.</p>
                            <pre class="demo-code-block"><code>&lt;<span class="syntax-tag">div</span> <span class="syntax-attr">id</span>=<span class="syntax-string">"grid"</span>&gt;&lt;/<span class="syntax-tag">div</span>&gt;</code></pre>
                        </div>
                    </li>

                    <li class="demo-guide-step">
                        <span class="demo-guide-step__number" aria-hidden="true">2</span>
                        <div class="demo-guide-step__body">
                            <h3 data-i18n="guide.step2.title">Definisci dati e colonne</h3>
                            <p class="demo-note" data-i18n="guide.step2.text">I dati della griglia sono rappresentati da un array di oggetti JavaScript. Ogni oggetto corrisponde a una riga e le sue proprietà identificano i valori delle celle.</p>
                            <p class="demo-note" data-i18n="guide.step2.text2">Le colonne definiscono quali informazioni visualizzare e come modificarle. Puoi associare editor, formatter e validatori ai singoli campi, mantenendo la configurazione separata dai dati.</p>
                            <p class="demo-note" data-i18n="guide.step2.text3">In questo esempio utilizziamo un piccolo elenco di prodotti e tre colonne, di cui una con validazione numerica.</p>
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
                    </li>

                    <li class="demo-guide-step">
                        <span class="demo-guide-step__number" aria-hidden="true">3</span>
                        <div class="demo-guide-step__body">
                            <h3 data-i18n="guide.step3.title">Crea la griglia CRUD</h3>
                            <p class="demo-note" data-i18n="guide.step3.text">Con AMB.table() puoi creare una griglia utilizzando il contenitore HTML, i dati e le colonne definiti nei passaggi precedenti.</p>
                            <p class="demo-note" data-i18n="guide.step3.text2">AMB Grid gestisce l'editing delle celle, le validazioni e lo stato delle righe. Le modifiche vengono tracciate per consentire all'applicazione di distinguere i record nuovi, modificati ed eliminati.</p>
                            <p class="demo-note" data-i18n="guide.step3.text3">Puoi inoltre configurare una toolbar con le azioni necessarie alla tua applicazione.</p>
                            <pre class="demo-code-block"><code><span class="syntax-keyword">const</span> grid = <span class="syntax-api">AMB</span>.<span class="syntax-function">table</span>({
  <span class="syntax-property">selector</span>: <span class="syntax-string">'#grid'</span>,
  <span class="syntax-property">data</span>: rows,
  <span class="syntax-property">columns</span>,
  <span class="syntax-property">layout</span>: <span class="syntax-string">'fitColumns'</span>,
  <span class="syntax-property">rowActionColumn</span>: { <span class="syntax-property">enabled</span>: <span class="syntax-keyword">true</span> },
  <span class="syntax-property">toolbar</span>: {
    <span class="syntax-property">buttons</span>: [<span class="syntax-string">'add'</span>, <span class="syntax-string">'payload'</span>],
    <span class="syntax-function">onAdd</span>: ({ grid }) => grid.<span class="syntax-function">addRow</span>({
      <span class="syntax-property">id</span>: <span class="syntax-keyword">null</span>, <span class="syntax-property">sku</span>: <span class="syntax-string">''</span>, <span class="syntax-property">productName</span>: <span class="syntax-string">''</span>, <span class="syntax-property">stockQuantity</span>: <span class="syntax-number">0</span>
    }),
    <span class="syntax-function">onPayload</span>: ({ payload }) => console.<span class="syntax-function">log</span>(payload.changes)
  }
});</code></pre>
                        </div>
                    </li>

                    <li class="demo-guide-step">
                        <span class="demo-guide-step__number" aria-hidden="true">4</span>
                        <div class="demo-guide-step__body">
                            <h3 data-i18n="guide.step4.title">Ottieni il payload CRUD</h3>
                            <p class="demo-note" data-i18n="guide.step4.text">AMB Grid tiene traccia delle modifiche effettuate dall'utente. Quando l'applicazione deve salvare, può ottenere un payload che distingue le operazioni da inviare al backend.</p>
                            <p class="demo-note" data-i18n="guide.step4.text2">Il payload contiene le informazioni necessarie per identificare i record inseriti, modificati ed eliminati.</p>
                            <p class="demo-note" data-i18n="guide.step4.text3">La comunicazione con il server rimane responsabilità dell'applicazione. Dopo un salvataggio riuscito, AMB Grid mette a disposizione API specifiche per aggiornare lo stato delle righe e riallineare i dati confermati.</p>
                            <pre class="demo-code-block"><code><span class="syntax-keyword">const</span> payload = grid.<span class="syntax-function">getSavePayload</span>();

console.<span class="syntax-function">log</span>(payload.changes);</code></pre>
                            <p class="demo-note" data-i18n="guide.step4.note">Il payload descrive le modifiche, ma non esegue il salvataggio. L'invio al backend e la conferma dei record salvati sono operazioni applicative approfondite nella documentazione tecnica.</p>
                        </div>
                    </li>

                </ol>
            </section>
        </main>
        ${renderDemoFooter()}
    `;

    return null;
}
