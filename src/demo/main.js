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
        'hero.badge': 'Demo locale',
        'hero.description': 'Una base più professionale per presentare AMB Grid in contesti backoffice, admin panel e applicazioni business server-rendered o integrate con framework moderni.',
        'hero.primary': 'Apri demo magazzino',
        'hero.secondary': 'Vedi esempi funzionali',
        'hero.statState': 'Stati riga',
        'hero.statStateText': 'clean, new, modified, deleted, saved',
        'hero.statPayload': 'Payload CRUD',
        'hero.statPayloadText': 'inserted, updated, deleted',
        'hero.statIntegration': 'Integrazione',
        'hero.statIntegrationText': 'vanilla JS, legacy-friendly, framework-ready',
        'mainDemo.kicker': 'Demo principale',
        'mainDemo.title': 'Gestionale Magazzino Classico',
        'mainDemo.description': 'Una base backoffice per inventario: modifica prodotti, controlla stock e prezzi, valida i dati e genera un payload CRUD pronto per il backend.',
        'mainDemo.add': 'Aggiungi prodotto',
        'mainDemo.save': 'Salva modifiche',
        'mainDemo.report': 'Mostra report stato',
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
        'hero.badge': 'Local demo',
        'hero.description': 'A more professional foundation for presenting AMB Grid in backoffice, admin panel, business application, server-rendered, and framework-integrated contexts.',
        'hero.primary': 'Open warehouse demo',
        'hero.secondary': 'View feature examples',
        'hero.statState': 'Row states',
        'hero.statStateText': 'clean, new, modified, deleted, saved',
        'hero.statPayload': 'CRUD payload',
        'hero.statPayloadText': 'inserted, updated, deleted',
        'hero.statIntegration': 'Integration',
        'hero.statIntegrationText': 'vanilla JS, legacy-friendly, framework-ready',
        'mainDemo.kicker': 'Main demo',
        'mainDemo.title': 'Classic Warehouse Backoffice',
        'mainDemo.description': 'An inventory backoffice foundation: edit products, review stock and prices, validate data, and generate a backend-ready CRUD payload.',
        'mainDemo.add': 'Add product',
        'mainDemo.save': 'Save changes',
        'mainDemo.report': 'Show state report',
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
        ? 'AMB Grid - Gestionale Magazzino Classico'
        : 'AMB Grid - Classic Warehouse Backoffice';

    root.querySelectorAll('[data-i18n]').forEach(element => {
        element.textContent = getText(element.dataset.i18n);
    });

    root.querySelectorAll('[data-language]').forEach(button => {
        const isActive = button.dataset.language === currentLang;

        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
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
                    <p class="demo-kicker" data-i18n="hero.badge">Demo locale</p>
                    <h1 data-i18n="page.title">AMB Grid</h1>
                    <p class="demo-hero__subtitle" data-i18n="page.subtitle">Libreria CRUD framework-agnostic per dati tabellari editabili, powered by Tabulator.</p>
                    <p class="demo-hero__text" data-i18n="hero.description">Una base più professionale per presentare AMB Grid in contesti backoffice, admin panel e applicazioni business server-rendered o integrate con framework moderni.</p>
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
