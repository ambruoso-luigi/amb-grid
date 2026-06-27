import 'tabulator-tables/dist/css/tabulator.min.css';
import 'vanillajs-datepicker/css/datepicker.min.css';
import '../amb-grid.css';
import './demo.css';
import { AMB } from '../index.js';
import basicCrud from './basic-crud.js';
import validation from './validation.js';
import numeric from './numeric.js';
import dates from './dates.js';
import autocomplete from './autocomplete.js';
import multifieldLookup from './multifield-lookup.js';
import parsers from './parsers.js';
import rowStates from './row-states.js';
import multipleTables from './multiple-tables.js';
import fullDemo from './full-demo.js';

window.AMB = AMB;
window.LookupDialog = AMB.LookupDialog;

const featureExamples = [
    { id: 'basic-crud', label: 'Basic CRUD', mount: basicCrud },
    { id: 'validation', label: 'Validation', mount: validation },
    { id: 'numeric', label: 'Numeric fields', mount: numeric },
    { id: 'dates', label: 'Dates', mount: dates },
    { id: 'autocomplete', label: 'Autocomplete', mount: autocomplete },
    { id: 'multifield-lookup', label: 'Multifield lookup', mount: multifieldLookup },
    { id: 'parsers', label: 'Parsers', mount: parsers },
    { id: 'row-states', label: 'Row states', mount: rowStates },
    { id: 'multiple-tables', label: 'Multiple tables', mount: multipleTables }
];

const translations = {
    it: {
        'page.title': 'AMB Grid',
        'page.subtitle': 'Libreria CRUD framework-agnostic per dati tabellari editabili, powered by Tabulator.',
        'hero.badge': 'AMB Grid',
        'hero.title': 'CRUD grid framework-agnostic per applicazioni business',
        'hero.description': 'AMB Grid aggiunge a Tabulator uno strato applicativo per stati riga, validazione, lookup, rollback, salvataggio e payload pronti per il backend.',
        'hero.primary': 'Apri demo legacy-friendly',
        'hero.secondary': 'Vedi esempi funzionali',
        'hero.statState': 'Stati riga',
        'hero.statStateText': 'clean, new, modified, deleted, saved',
        'hero.statPayload': 'Payload CRUD',
        'hero.statPayloadText': 'inserted, updated, deleted',
        'hero.statIntegration': 'Integrazione',
        'hero.statIntegrationText': 'JavaScript, legacy-friendly, framework-ready',
        'frameworks.title': 'Integrabile dove lavori già',
        'frameworks.description': 'Usa AMB Grid in pagine JavaScript classiche, sistemi legacy-friendly o stack moderni come React, Vue e Angular.',
        'frameworks.javascript.badge': 'Classic integration',
        'frameworks.javascript.description': 'Snippet base con AMB.table(...).',
        'frameworks.javascript.status': 'Available',
        'frameworks.react.badge': 'Lifecycle integration',
        'frameworks.react.description': 'Esempio concettuale con mount e grid.destroy() nel cleanup.',
        'frameworks.react.status': 'Planned full demo',
        'frameworks.vue.badge': 'Composition API example',
        'frameworks.vue.description': 'Esempio concettuale con onMounted e onUnmounted.',
        'frameworks.vue.status': 'Snippet planned',
        'frameworks.angular.badge': 'Component lifecycle example',
        'frameworks.angular.description': 'Esempio concettuale con AfterViewInit e OnDestroy.',
        'frameworks.angular.status': 'Snippet planned',
        'mainDemo.kicker': 'Demo legacy-friendly',
        'mainDemo.title': 'Gestionale Magazzino Classico',
        'mainDemo.description': 'Una pagina gestionale classica, adatta a contesti server-rendered e legacy-friendly, con una UI moderna per CRUD, validazione e payload applicativi.',
        'mainDemo.scenario': 'Scenario: Classic Warehouse Backoffice',
        'cycle.kicker': 'Flusso applicativo',
        'cycle.title': 'CRUD, validazione e payload nello stesso ciclo',
        'cycle.description': 'La demo principale prepara il percorso evolutivo: lookup, autocomplete, campi numerici, date, rollback, save fake e riallineamento dello stato dopo il salvataggio.',
        'cycle.editTitle': 'Edit',
        'cycle.editText': 'Le celle editabili aggiornano i dati senza nascondere gli stati riga.',
        'cycle.validateTitle': 'Validate',
        'cycle.validateText': 'Validatori e parser separano qualità del dato e normalizzazione payload.',
        'cycle.payloadTitle': 'Payload',
        'cycle.payloadText': 'Le modifiche diventano JSON leggibile e pronto per una API applicativa.',
        'cycle.alignTitle': 'Align',
        'cycle.alignText': 'Dopo il salvataggio, ID backend e stati possono essere riallineati.',
        'examples.kicker': 'Mini-demo tecniche',
        'examples.title': 'Esempi funzionali',
        'examples.description': 'Le demo esistenti restano accessibili come esempi focalizzati su singole capacità di AMB Grid.',
        'roadmap.kicker': 'Prossimi passi',
        'roadmap.title': 'Roadmap essenziale',
        'roadmap.demo': 'Raffinare la demo magazzino con fake API più completa, rollback guidato e salvataggio simulato più realistico.',
        'roadmap.site': 'Preparare una futura versione bilingue completa e una pubblicazione GitHub Pages dedicata alla demo.',
        'roadmap.package': 'Definire in seguito build libreria, `files` npm o `.npmignore`, tipi e artifact pubblicabile senza demo.'
    },
    en: {
        'page.title': 'AMB Grid',
        'page.subtitle': 'A framework-agnostic CRUD grid library for editable tabular business data, powered by Tabulator.',
        'hero.badge': 'AMB Grid',
        'hero.title': 'Framework-agnostic CRUD grid for business applications',
        'hero.description': 'AMB Grid adds an application layer to Tabulator for row states, validation, lookups, rollback, saving, and backend-ready payloads.',
        'hero.primary': 'Open legacy-friendly demo',
        'hero.secondary': 'View feature examples',
        'hero.statState': 'Row states',
        'hero.statStateText': 'clean, new, modified, deleted, saved',
        'hero.statPayload': 'CRUD payload',
        'hero.statPayloadText': 'inserted, updated, deleted',
        'hero.statIntegration': 'Integration',
        'hero.statIntegrationText': 'JavaScript, legacy-friendly, framework-ready',
        'frameworks.title': 'Use AMB Grid where you already work',
        'frameworks.description': 'Integrate AMB Grid in classic JavaScript pages, legacy-friendly systems or modern stacks like React, Vue and Angular.',
        'frameworks.javascript.badge': 'Classic integration',
        'frameworks.javascript.description': 'Basic snippet with AMB.table(...).',
        'frameworks.javascript.status': 'Available',
        'frameworks.react.badge': 'Lifecycle integration',
        'frameworks.react.description': 'Conceptual example with mount and grid.destroy() in cleanup.',
        'frameworks.react.status': 'Planned full demo',
        'frameworks.vue.badge': 'Composition API example',
        'frameworks.vue.description': 'Conceptual example with onMounted and onUnmounted.',
        'frameworks.vue.status': 'Snippet planned',
        'frameworks.angular.badge': 'Component lifecycle example',
        'frameworks.angular.description': 'Conceptual example with AfterViewInit and OnDestroy.',
        'frameworks.angular.status': 'Snippet planned',
        'mainDemo.kicker': 'Legacy-friendly demo',
        'mainDemo.title': 'Classic Warehouse Backoffice',
        'mainDemo.description': 'A classic server-rendered and legacy-friendly business page with a modern UI for CRUD, validation, and application payloads.',
        'mainDemo.scenario': 'Scenario: Gestionale Magazzino Classico',
        'cycle.kicker': 'Application flow',
        'cycle.title': 'CRUD, validation, and payload in one cycle',
        'cycle.description': 'The main demo prepares the next evolution: lookup, autocomplete, numeric fields, dates, rollback, fake save, and state alignment after saving.',
        'cycle.editTitle': 'Edit',
        'cycle.editText': 'Editable cells update data while row states remain visible.',
        'cycle.validateTitle': 'Validate',
        'cycle.validateText': 'Validators and parsers keep data quality and payload normalization separate.',
        'cycle.payloadTitle': 'Payload',
        'cycle.payloadText': 'Changes become readable JSON ready for an application API.',
        'cycle.alignTitle': 'Align',
        'cycle.alignText': 'After save, backend IDs and row states can be synchronized.',
        'examples.kicker': 'Technical mini-demos',
        'examples.title': 'Feature examples',
        'examples.description': 'The existing demos remain available as focused examples for individual AMB Grid capabilities.',
        'roadmap.kicker': 'Next steps',
        'roadmap.title': 'Essential roadmap',
        'roadmap.demo': 'Refine the warehouse demo with a fuller fake API, guided rollback, and a more realistic simulated save.',
        'roadmap.site': 'Prepare a future complete bilingual version and a GitHub Pages publication dedicated to the demo.',
        'roadmap.package': 'Later define a library build, npm `files` or `.npmignore`, types, and a publishable artifact without demos.'
    }
};

const root = document.querySelector('#app');
let currentMainDemo = null;
let currentFeatureExample = null;
let currentLang = 'it';
let featureLoadToken = 0;

const getText = key => translations[currentLang][key] || translations.it[key] || key;

const applyI18n = () => {
    document.documentElement.lang = currentLang;
    document.title = currentLang === 'it'
        ? 'AMB Grid - Demo legacy-friendly'
        : 'AMB Grid - Legacy-friendly demo';

    root.querySelectorAll('[data-i18n]').forEach(element => {
        element.textContent = getText(element.dataset.i18n);
    });

    root.querySelectorAll('[data-language]').forEach(button => {
        const isActive = button.dataset.language === currentLang;

        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });

    window.dispatchEvent(new CustomEvent('amb-demo-language-change', {
        detail: { language: currentLang }
    }));
};

const setActiveExample = selectedId => {
    root.querySelectorAll('[data-example]').forEach(button => {
        button.classList.toggle('is-active', button.dataset.example === selectedId);
    });
};

const destroyDemo = demo => {
    if (demo && typeof demo.destroy === 'function') {
        demo.destroy();
    }
};

const renderShell = selectedId => {
    root.innerHTML = `
        <main class="demo-page">
            <header class="demo-hero">
                <nav class="demo-topbar" aria-label="AMB Grid demo navigation">
                    <a class="demo-brand" href="#top" aria-label="AMB Grid">AMB Grid</a>
                    <div class="demo-language" aria-label="Language">
                        <button type="button" data-language="it">IT</button>
                        <button type="button" data-language="en">EN</button>
                    </div>
                </nav>
                <div class="demo-hero__content" id="top">
                    <p class="demo-kicker" data-i18n="hero.badge">AMB Grid</p>
                    <h1 data-i18n="hero.title">CRUD grid framework-agnostic per applicazioni business</h1>
                    <p class="demo-hero__text" data-i18n="hero.description">AMB Grid aggiunge a Tabulator uno strato applicativo per stati riga, validazione, lookup, rollback, salvataggio e payload pronti per il backend.</p>
                    <div class="demo-hero__actions">
                        <a class="demo-button demo-button--primary" href="#main-demo" data-i18n="hero.primary">Apri demo magazzino</a>
                        <a class="demo-button" href="#feature-examples" data-i18n="hero.secondary">Vedi esempi funzionali</a>
                    </div>
                </div>
                <div class="demo-hero__metrics" aria-label="AMB Grid capabilities">
                    <div>
                        <strong data-i18n="hero.statState">Stati riga</strong>
                        <span data-i18n="hero.statStateText">clean, new, modified, deleted, saved</span>
                    </div>
                    <div>
                        <strong data-i18n="hero.statPayload">Payload CRUD</strong>
                        <span data-i18n="hero.statPayloadText">inserted, updated, deleted</span>
                    </div>
                    <div>
                        <strong data-i18n="hero.statIntegration">Integrazione</strong>
                        <span data-i18n="hero.statIntegrationText">vanilla JS, legacy-friendly, framework-ready</span>
                    </div>
                </div>
            </header>

            <section class="demo-section demo-frameworks" id="framework-integrations">
                <div class="demo-section-heading">
                    <h2 data-i18n="frameworks.title">Integrabile dove lavori già</h2>
                    <p class="demo-note" data-i18n="frameworks.description">Usa AMB Grid in pagine JavaScript classiche, sistemi legacy-friendly o stack moderni come React, Vue e Angular.</p>
                </div>
                <div class="demo-framework-grid">
                    <a class="demo-framework-card demo-framework-card--javascript" href="#main-demo">
                        <span class="demo-framework-card__icon" aria-hidden="true">
                            <span class="demo-framework-card__icon-text">JS</span>
                        </span>
                        <span class="demo-framework-card__body">
                            <span class="demo-framework-card__name">JavaScript</span>
                            <span class="demo-framework-card__badge" data-i18n="frameworks.javascript.badge">Classic integration</span>
                            <span class="demo-framework-card__description" data-i18n="frameworks.javascript.description">Snippet base con AMB.table(...).</span>
                            <span class="demo-framework-card__status" data-i18n="frameworks.javascript.status">Available</span>
                        </span>
                        <span class="demo-framework-card__arrow" aria-hidden="true">&rarr;</span>
                    </a>
                    <a class="demo-framework-card demo-framework-card--react" href="#feature-examples">
                        <span class="demo-framework-card__icon" aria-hidden="true">
                            <svg viewBox="0 0 48 48">
                                <ellipse cx="24" cy="24" rx="18" ry="7"></ellipse>
                                <ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(60 24 24)"></ellipse>
                                <ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(120 24 24)"></ellipse>
                                <circle cx="24" cy="24" r="3.5"></circle>
                            </svg>
                        </span>
                        <span class="demo-framework-card__body">
                            <span class="demo-framework-card__name">React</span>
                            <span class="demo-framework-card__badge" data-i18n="frameworks.react.badge">Lifecycle integration</span>
                            <span class="demo-framework-card__description" data-i18n="frameworks.react.description">Esempio concettuale con mount e grid.destroy() nel cleanup.</span>
                            <span class="demo-framework-card__status" data-i18n="frameworks.react.status">Planned full demo</span>
                        </span>
                        <span class="demo-framework-card__arrow" aria-hidden="true">&rarr;</span>
                    </a>
                    <a class="demo-framework-card demo-framework-card--vue" href="#feature-examples">
                        <span class="demo-framework-card__icon" aria-hidden="true">
                            <svg viewBox="0 0 48 48">
                                <path d="M8 12h10l6 11 6-11h10L24 38 8 12z"></path>
                                <path d="M16 12h8l4 7 4-7h8L24 31 16 12z"></path>
                            </svg>
                        </span>
                        <span class="demo-framework-card__body">
                            <span class="demo-framework-card__name">Vue</span>
                            <span class="demo-framework-card__badge" data-i18n="frameworks.vue.badge">Composition API example</span>
                            <span class="demo-framework-card__description" data-i18n="frameworks.vue.description">Esempio concettuale con onMounted e onUnmounted.</span>
                            <span class="demo-framework-card__status" data-i18n="frameworks.vue.status">Snippet planned</span>
                        </span>
                        <span class="demo-framework-card__arrow" aria-hidden="true">&rarr;</span>
                    </a>
                    <a class="demo-framework-card demo-framework-card--angular" href="#feature-examples">
                        <span class="demo-framework-card__icon" aria-hidden="true">
                            <svg viewBox="0 0 48 48">
                                <path d="M24 5 40 12 37 34 24 43 11 34 8 12 24 5z"></path>
                                <path d="M17 34 24 13l7 21"></path>
                                <path d="M20 27h8"></path>
                            </svg>
                        </span>
                        <span class="demo-framework-card__body">
                            <span class="demo-framework-card__name">Angular</span>
                            <span class="demo-framework-card__badge" data-i18n="frameworks.angular.badge">Component lifecycle example</span>
                            <span class="demo-framework-card__description" data-i18n="frameworks.angular.description">Esempio concettuale con AfterViewInit e OnDestroy.</span>
                            <span class="demo-framework-card__status" data-i18n="frameworks.angular.status">Snippet planned</span>
                        </span>
                        <span class="demo-framework-card__arrow" aria-hidden="true">&rarr;</span>
                    </a>
                </div>
            </section>

            <section class="demo-panel demo-panel--main" id="main-demo"></section>

            <section class="demo-section">
                <div class="demo-section-heading">
                    <p class="demo-kicker" data-i18n="cycle.kicker">Flusso applicativo</p>
                    <h2 data-i18n="cycle.title">CRUD, validazione e payload nello stesso ciclo</h2>
                    <p class="demo-note" data-i18n="cycle.description">La demo principale prepara il percorso evolutivo: lookup, autocomplete, campi numerici, date, rollback, save fake e riallineamento dello stato dopo il salvataggio.</p>
                </div>
                <div class="demo-flow-grid">
                    <article class="demo-flow-card">
                        <strong data-i18n="cycle.editTitle">Edit</strong>
                        <p data-i18n="cycle.editText">Le celle editabili aggiornano i dati senza nascondere gli stati riga.</p>
                    </article>
                    <article class="demo-flow-card">
                        <strong data-i18n="cycle.validateTitle">Validate</strong>
                        <p data-i18n="cycle.validateText">Validatori e parser separano qualità del dato e normalizzazione payload.</p>
                    </article>
                    <article class="demo-flow-card">
                        <strong data-i18n="cycle.payloadTitle">Payload</strong>
                        <p data-i18n="cycle.payloadText">Le modifiche diventano JSON leggibile e pronto per una API applicativa.</p>
                    </article>
                    <article class="demo-flow-card">
                        <strong data-i18n="cycle.alignTitle">Align</strong>
                        <p data-i18n="cycle.alignText">Dopo il salvataggio, ID backend e stati possono essere riallineati.</p>
                    </article>
                </div>
            </section>

            <section class="demo-section" id="feature-examples">
                <div class="demo-section-heading">
                    <p class="demo-kicker" data-i18n="examples.kicker">Mini-demo tecniche</p>
                    <h2 data-i18n="examples.title">Esempi funzionali</h2>
                    <p class="demo-note" data-i18n="examples.description">Le demo esistenti restano accessibili come esempi focalizzati su singole capacità di AMB Grid.</p>
                </div>
                <nav class="demo-menu" aria-label="Feature examples">
                    ${featureExamples.map(example => `
                        <button
                            type="button"
                            class="demo-menu-button${example.id === selectedId ? ' is-active' : ''}"
                            data-example="${example.id}"
                        >
                            ${example.label}
                        </button>
                    `).join('')}
                </nav>
                <section id="feature-example" class="demo-example"></section>
            </section>

            <section class="demo-section demo-roadmap">
                <div class="demo-section-heading">
                    <p class="demo-kicker" data-i18n="roadmap.kicker">Prossimi passi</p>
                    <h2 data-i18n="roadmap.title">Roadmap essenziale</h2>
                </div>
                <ul class="demo-roadmap-list">
                    <li data-i18n="roadmap.demo">Raffinare la demo magazzino con fake API più completa, rollback guidato e salvataggio simulato più realistico.</li>
                    <li data-i18n="roadmap.site">Preparare una futura versione bilingue completa e una pubblicazione GitHub Pages dedicata alla demo.</li>
                    <li data-i18n="roadmap.package">Definire in seguito build libreria, files npm o .npmignore, tipi e artifact pubblicabile senza demo.</li>
                </ul>
            </section>
        </main>
    `;

    root.querySelectorAll('[data-example]').forEach(button => {
        button.addEventListener('click', () => loadFeatureExample(button.dataset.example));
    });
    root.querySelectorAll('[data-language]').forEach(button => {
        button.addEventListener('click', () => {
            currentLang = button.dataset.language;
            applyI18n();
        });
    });
};

const mountMainDemo = async () => {
    destroyDemo(currentMainDemo);
    currentMainDemo = await fullDemo(root.querySelector('#main-demo'));
    applyI18n();
};

const loadFeatureExample = async id => {
    const example = featureExamples.find(item => item.id === id) || featureExamples[0];
    const token = featureLoadToken + 1;
    const container = root.querySelector('#feature-example');

    featureLoadToken = token;
    destroyDemo(currentFeatureExample);
    currentFeatureExample = null;
    container.innerHTML = '';
    setActiveExample(example.id);

    const mountedExample = await example.mount(container);

    if (token !== featureLoadToken) {
        destroyDemo(mountedExample);
        return;
    }

    currentFeatureExample = mountedExample || null;
};

renderShell(featureExamples[0].id);
applyI18n();
mountMainDemo();
loadFeatureExample(featureExamples[0].id);
