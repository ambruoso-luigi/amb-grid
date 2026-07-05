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
import gettingStartedJavaScript from './getting-started-javascript.js';
import { renderDemoBrand } from './demo-brand.js';
import { demoIcon } from './demo-icons.js';

window.AMB = AMB;
window.LookupDialog = AMB.LookupDialog;

const featureExamples = [
    { id: 'basic-crud', label: 'Basic CRUD', descriptionKey: 'examples.basicCrud.description', mount: basicCrud },
    { id: 'validation', label: 'Validation', descriptionKey: 'examples.validation.description', mount: validation },
    { id: 'numeric', label: 'Numeric fields', descriptionKey: 'examples.numeric.description', mount: numeric },
    { id: 'dates', label: 'Dates', descriptionKey: 'examples.dates.description', mount: dates },
    { id: 'autocomplete', label: 'Autocomplete', descriptionKey: 'examples.autocomplete.description', mount: autocomplete },
    { id: 'multifield-lookup', label: 'Multifield lookup', descriptionKey: 'examples.multifieldLookup.description', mount: multifieldLookup },
    { id: 'parsers', label: 'Parsers', descriptionKey: 'examples.parsers.description', mount: parsers },
    { id: 'row-states', label: 'Row states', descriptionKey: 'examples.rowStates.description', mount: rowStates },
    { id: 'multiple-tables', label: 'Multiple tables', descriptionKey: 'examples.multipleTables.description', mount: multipleTables }
];

const translations = {
    it: {
        'page.title': 'AMB Grid',
        'page.subtitle': 'Libreria CRUD framework-agnostic per dati tabellari editabili, powered by Tabulator.',
        'language.itTitle': 'Italiano',
        'language.enTitle': 'English',
        'language.switchToIt': 'Cambia lingua in italiano',
        'language.switchToEn': 'Cambia lingua in inglese',
        'hero.badge': 'AMB Grid',
        'hero.title': 'Griglie CRUD per applicazioni business',
        'hero.description': 'AMB Grid aggiunge a Tabulator uno strato CRUD framework-agnostic per stati riga, validazione, lookup, rollback, salvataggio e payload pronti per il backend.',
        'hero.primary': 'Apri demo JavaScript',
        'hero.secondary': 'Vedi esempi funzionali',
        'hero.statState': 'Stati riga',
        'hero.statStateText': 'clean, new, modified, deleted, saved',
        'hero.statPayload': 'Payload CRUD',
        'hero.statPayloadText': 'inserted, updated, deleted, backend-ready',
        'hero.statIntegration': 'Framework-agnostic',
        'hero.statIntegrationText': 'JavaScript classico, stack moderni e sistemi legacy-friendly',
        'hero.visualTitle': 'Ciclo CRUD applicativo',
        'hero.visualAria': 'Ciclo CRUD di AMB Grid',
        'hero.visualSubtitle': 'Motore Tabulator + layer AMB Grid',
        'hero.visualEdit': 'Edit',
        'hero.visualValidate': 'Validate',
        'hero.visualSave': 'Save',
        'hero.visualPayload': 'Payload',
        'hero.visualLegacy': 'legacy-friendly',
        'hero.visualFramework': 'framework-ready',
        'hero.visualBackend': 'backend payload',
        'frameworks.title': 'Scegli il percorso di integrazione',
        'frameworks.description': 'La logica CRUD resta la stessa in JavaScript, React, Vue, Angular e pagine legacy-friendly: scegli il percorso piu vicino al tuo stack.',
        'frameworks.javascript.badge': 'Guida disponibile',
        'frameworks.javascript.description': 'Modern JavaScript, Classic HTML + JS + CSS e contesti legacy-friendly con la guida gia disponibile.',
        'frameworks.javascript.detailModern': 'Modern bundler',
        'frameworks.javascript.detailClassic': 'Classic HTML + JS + CSS',
        'frameworks.javascript.detailRecommended': 'Primo percorso consigliato',
        'frameworks.javascript.status': 'Apri guida',
        'frameworks.react.badge': 'React + TypeScript',
        'frameworks.react.description': 'AMB Grid montato dentro componenti React, con cleanup del ciclo di vita tramite grid.destroy().',
        'frameworks.react.detailLifecycle': 'Mount / destroy',
        'frameworks.react.status': 'Vedi integrazione',
        'frameworks.vue.badge': 'Vue + TypeScript',
        'frameworks.vue.description': 'Integrazione con lifecycle Vue e cleanup quando il componente viene smontato.',
        'frameworks.vue.detailLifecycle': 'Lifecycle / cleanup',
        'frameworks.vue.status': 'Vedi integrazione',
        'frameworks.angular.badge': 'Angular integration',
        'frameworks.angular.description': 'Integrazione in componenti Angular e pagine gestionali moderne, senza promettere wrapper ufficiali.',
        'frameworks.angular.detailLifecycle': 'Component lifecycle',
        'frameworks.angular.status': 'Vedi integrazione',
        'mainDemo.kicker': 'Demo legacy-friendly',
        'mainDemo.primaryLabel': 'Demo principale',
        'mainDemo.title': 'Gestionale Magazzino Classico',
        'mainDemo.description': 'Una pagina gestionale classica, adatta a contesti server-rendered e legacy-friendly, con una UI moderna per CRUD, validazione e payload applicativi.',
        'mainDemo.scenario': 'Scenario: Classic Warehouse Backoffice',
        'mainDemo.panelKicker': 'Pannello operativo',
        'mainDemo.panelTitle': 'Dati magazzino editabili',
        'mainDemo.panelText': 'Gestisci righe prodotto, stati CRUD, validazione e payload backend nello stesso flusso.',
        'mainDemo.chipPagination': 'Paginazione locale',
        'mainDemo.chipStates': 'Stati riga',
        'mainDemo.chipBackend': 'Backend fake',
        'mainDemo.chipValidation': 'Validazione attiva',
        'cycle.kicker': 'Flusso applicativo',
        'cycle.title': 'CRUD, validazione e payload nello stesso ciclo',
        'cycle.description': 'AMB Grid coordina editing, validazione, lookup, rollback, salvataggio e payload pronti per il backend senza imporre un framework.',
        'cycle.editTitle': 'Edit',
        'cycle.editText': 'Le celle editabili aggiornano i dati senza nascondere gli stati riga.',
        'cycle.keyboardTitle': 'Editing orientato alla tastiera',
        'cycle.keyboardText': 'Inserimento rapido dei dati con navigazione Tab, conferma lookup e flusso pensato per utenti gestionali.',
        'cycle.validateTitle': 'Validate',
        'cycle.validateText': 'Validatori e parser separano qualità del dato e normalizzazione payload.',
        'cycle.payloadTitle': 'Payload',
        'cycle.payloadText': 'Le modifiche diventano JSON leggibile e pronto per una API applicativa.',
        'cycle.alignTitle': 'Align',
        'cycle.alignText': 'Dopo il salvataggio, ID backend e stati possono essere riallineati.',
        'examples.kicker': 'Mini-demo tecniche',
        'examples.title': 'Esempi funzionali',
        'examples.description': 'Le demo esistenti restano accessibili come esempi focalizzati su singole capacità di AMB Grid.',
        'examples.open': 'Apri esempio',
        'examples.basicCrud.description': 'CRUD minimo con toolbar e payload applicativo.',
        'examples.validation.description': 'Regole campo, errori riga e report di validazione.',
        'examples.numeric.description': 'Integer, decimal e percentuali con parser coerenti.',
        'examples.dates.description': 'Editor data, picker e normalizzazione payload.',
        'examples.autocomplete.description': 'Suggerimenti controllati per campi testuali business.',
        'examples.multifieldLookup.description': 'Lookup che aggiorna più campi da un record scelto.',
        'examples.parsers.description': 'Parser dedicati per trasformare i valori verso API.',
        'examples.rowStates.description': 'Stati riga, rollback, delete e report tecnici.',
        'examples.multipleTables.description': 'Più griglie indipendenti nella stessa pagina.',
        'roadmap.kicker': 'Prossimi passi',
        'roadmap.title': 'Roadmap essenziale',
        'roadmap.demo': 'Raffinare la demo magazzino con fake API più completa, rollback guidato e salvataggio simulato più realistico.',
        'roadmap.site': 'Preparare una futura versione bilingue completa e una pubblicazione GitHub Pages dedicata alla demo.',
        'roadmap.package': 'Definire in seguito build libreria, `files` npm o `.npmignore`, tipi e artifact pubblicabile senza demo.',
        'guide.back': 'Torna alla home demo',
        'guide.badge': 'JavaScript',
        'guide.title': 'AMB Grid con JavaScript',
        'guide.description': 'Demo tabellare e guida essenziale per usare AMB Grid in una pagina JavaScript classica, senza framework obbligatori.',
        'guide.startTitle': 'Inizia con AMB Grid in JavaScript',
        'guide.startText': 'Dopo la demo completa, questi step mostrano il minimo necessario per preparare container, dati, colonne e payload in una pagina JavaScript.',
        'guide.step1.title': 'Prepara il container',
        'guide.step1.text': 'Crea nel markup un punto di mount dedicato alla griglia.',
        'guide.step2.title': 'Importa AMB Grid',
        'guide.step2.text': 'Durante lo sviluppo locale importa la libreria dal sorgente o dal build del progetto. Quando il pacchetto npm sarà disponibile, questa sezione conterrà il comando ufficiale.',
        'guide.step3.title': 'Definisci dati e colonne',
        'guide.step3.text': 'Parti da un dataset piccolo e da colonne esplicite. I validator possono essere aggiunti dove servono regole applicative.',
        'guide.step4.title': 'Crea la griglia CRUD',
        'guide.step4.text': 'AMB.table monta Tabulator e aggiunge lo strato CRUD di AMB Grid per stati riga, validazione e payload.',
        'guide.step5.title': 'Leggi il payload',
        'guide.step5.text': 'Quando l’applicazione deve salvare, leggi il payload CRUD generato da AMB Grid e invialo al tuo backend.',
        'guide.step6.title': 'Prossimi passi',
        'guide.step6.text': 'Rivedi la demo completa per vedere lookup, autocomplete, toolbar, rollback, validazione e payload nello stesso flusso.',
        'guide.classic.kicker': 'Legacy-friendly',
        'guide.classic.title': 'Integrazione classica HTML + JS + CSS',
        'guide.classic.modernBadge': 'Modern',
        'guide.classic.legacyBadge': 'Legacy-friendly',
        'guide.classic.plannedBadge': 'Futura build browser',
        'guide.classic.text': 'AMB Grid resta framework-agnostic: Tabulator è il motore tabellare, mentre AMB Grid aggiunge lo strato CRUD applicativo senza imporre React, Vue o Angular.',
        'guide.classic.modernTitle': 'Modern JavaScript / bundler',
        'guide.classic.modernText': 'Usa import ESM in Vite, bundler o progetti moderni. Durante lo sviluppo locale puoi importare AMB dal sorgente o dal build preparato dal progetto.',
        'guide.classic.classicTitle': 'Classic HTML + JS + CSS',
        'guide.classic.filesTitle': 'Struttura file',
        'guide.classic.filesText': 'Tre file separano markup, configurazione AMB Grid e stile applicativo della pagina.',
        'guide.classic.classicText': 'Nelle pagine server-rendered puoi mantenere una struttura classica: HTML importa CSS e script, il JS della pagina configura AMB Grid, il CSS della pagina contiene solo lo stile specifico del progetto.',
        'guide.classic.htmlTitle': 'HTML previsto per la futura build browser',
        'guide.classic.htmlText': 'AMB Grid non produce ancora un file amb-grid.umd.js o amb-grid.iife.js. Questo snippet è uno schema previsto per la futura build browser, non un path già pronto in produzione.',
        'guide.classic.jsTitle': 'inventory-page.js',
        'guide.classic.jsText': 'La callback Add restituisce la Promise di crud.addRow(...), così la toolbar può mantenere lo stato busy e attendere reveal e focus.',
        'guide.classic.cssTitle': 'inventory-page.css',
        'guide.classic.cssText': 'Lo stile applicativo resta separato dallo stylesheet della libreria.',
        'guide.openMainDemo': 'Torna alla demo',
        'guide.openExamples': 'Vedi esempi funzionali',
        'guide.videoKicker': 'Video guida',
        'guide.videoTitle': 'Installazione e uso in JavaScript',
        'guide.videoText': 'Qui verrà collegato il video introduttivo su installazione e uso di AMB Grid in JavaScript.',
        'guide.videoCta': 'Video in arrivo'
    },
    en: {
        'page.title': 'AMB Grid',
        'page.subtitle': 'A framework-agnostic CRUD grid library for editable tabular business data, powered by Tabulator.',
        'language.itTitle': 'Italiano',
        'language.enTitle': 'English',
        'language.switchToIt': 'Switch language to Italian',
        'language.switchToEn': 'Switch language to English',
        'hero.badge': 'AMB Grid',
        'hero.title': 'CRUD data grids for business applications',
        'hero.description': 'AMB Grid adds a framework-agnostic CRUD layer on top of Tabulator for row states, validation, lookup, rollback, saving, and backend-ready payloads.',
        'hero.primary': 'Open JavaScript demo',
        'hero.secondary': 'View feature examples',
        'hero.statState': 'Row states',
        'hero.statStateText': 'clean, new, modified, deleted, saved',
        'hero.statPayload': 'CRUD payload',
        'hero.statPayloadText': 'inserted, updated, deleted, backend-ready',
        'hero.statIntegration': 'Framework-agnostic',
        'hero.statIntegrationText': 'Classic JavaScript, modern stacks, and legacy-friendly systems',
        'hero.visualTitle': 'Application CRUD lifecycle',
        'hero.visualAria': 'AMB Grid CRUD lifecycle',
        'hero.visualSubtitle': 'Tabulator engine + AMB Grid layer',
        'hero.visualEdit': 'Edit',
        'hero.visualValidate': 'Validate',
        'hero.visualSave': 'Save',
        'hero.visualPayload': 'Payload',
        'hero.visualLegacy': 'legacy-friendly',
        'hero.visualFramework': 'framework-ready',
        'hero.visualBackend': 'backend payload',
        'frameworks.title': 'Choose your integration path',
        'frameworks.description': 'The CRUD logic stays the same across JavaScript, React, Vue, Angular, and legacy-friendly pages: choose the path closest to your stack.',
        'frameworks.javascript.badge': 'Guide available',
        'frameworks.javascript.description': 'Modern JavaScript, Classic HTML + JS + CSS, and legacy-friendly contexts with the guide already available.',
        'frameworks.javascript.detailModern': 'Modern bundler',
        'frameworks.javascript.detailClassic': 'Classic HTML + JS + CSS',
        'frameworks.javascript.detailRecommended': 'Recommended first path',
        'frameworks.javascript.status': 'Open guide',
        'frameworks.react.badge': 'React + TypeScript',
        'frameworks.react.description': 'AMB Grid mounted inside React components, with lifecycle cleanup through grid.destroy().',
        'frameworks.react.detailLifecycle': 'Mount / destroy',
        'frameworks.react.status': 'View integration',
        'frameworks.vue.badge': 'Vue + TypeScript',
        'frameworks.vue.description': 'Integration with the Vue lifecycle and cleanup when the component unmounts.',
        'frameworks.vue.detailLifecycle': 'Lifecycle / cleanup',
        'frameworks.vue.status': 'View integration',
        'frameworks.angular.badge': 'Angular integration',
        'frameworks.angular.description': 'Integration in Angular components and modern business pages, without promising an official wrapper.',
        'frameworks.angular.detailLifecycle': 'Component lifecycle',
        'frameworks.angular.status': 'View integration',
        'mainDemo.kicker': 'Legacy-friendly demo',
        'mainDemo.primaryLabel': 'Main demo',
        'mainDemo.title': 'Classic Warehouse Backoffice',
        'mainDemo.description': 'A classic server-rendered and legacy-friendly business page with a modern UI for CRUD, validation, and application payloads.',
        'mainDemo.scenario': 'Scenario: Gestionale Magazzino Classico',
        'mainDemo.panelKicker': 'Operational panel',
        'mainDemo.panelTitle': 'Editable inventory data',
        'mainDemo.panelText': 'Manage product rows, CRUD states, validation, and backend payloads in one workflow.',
        'mainDemo.chipPagination': 'Local pagination',
        'mainDemo.chipStates': 'Row states',
        'mainDemo.chipBackend': 'Fake backend',
        'mainDemo.chipValidation': 'Validation enabled',
        'cycle.kicker': 'Application flow',
        'cycle.title': 'CRUD, validation, and payload in one cycle',
        'cycle.description': 'AMB Grid coordinates editing, validation, lookups, rollback, saving, and backend-ready payloads without forcing a framework.',
        'cycle.editTitle': 'Edit',
        'cycle.editText': 'Editable cells update data while row states remain visible.',
        'cycle.keyboardTitle': 'Work without leaving the keyboard',
        'cycle.keyboardText': 'AMB Grid is designed for fast backoffice-style data entry: type, confirm with Tab and move to the next cell.',
        'cycle.validateTitle': 'Validate',
        'cycle.validateText': 'Validators and parsers keep data quality and payload normalization separate.',
        'cycle.payloadTitle': 'Payload',
        'cycle.payloadText': 'Changes become readable JSON ready for an application API.',
        'cycle.alignTitle': 'Align',
        'cycle.alignText': 'After save, backend IDs and row states can be synchronized.',
        'examples.kicker': 'Technical mini-demos',
        'examples.title': 'Feature examples',
        'examples.description': 'The existing demos remain available as focused examples for individual AMB Grid capabilities.',
        'examples.open': 'Open example',
        'examples.basicCrud.description': 'Minimal CRUD with toolbar and application payload.',
        'examples.validation.description': 'Field rules, row errors, and validation reports.',
        'examples.numeric.description': 'Integer, decimal, and percentage fields with coherent parsers.',
        'examples.dates.description': 'Date editor, picker, and payload normalization.',
        'examples.autocomplete.description': 'Controlled suggestions for business text fields.',
        'examples.multifieldLookup.description': 'Lookup that updates several fields from one selected record.',
        'examples.parsers.description': 'Dedicated parsers for transforming values toward APIs.',
        'examples.rowStates.description': 'Row states, rollback, delete, and technical reports.',
        'examples.multipleTables.description': 'Multiple independent grids on the same page.',
        'roadmap.kicker': 'Next steps',
        'roadmap.title': 'Essential roadmap',
        'roadmap.demo': 'Refine the warehouse demo with a fuller fake API, guided rollback, and a more realistic simulated save.',
        'roadmap.site': 'Prepare a future complete bilingual version and a GitHub Pages publication dedicated to the demo.',
        'roadmap.package': 'Later define a library build, npm `files` or `.npmignore`, types, and a publishable artifact without demos.',
        'guide.back': 'Back to demo home',
        'guide.badge': 'JavaScript',
        'guide.title': 'AMB Grid with JavaScript',
        'guide.description': 'A tabular demo and essential guide for using AMB Grid in a classic JavaScript page, with no required framework.',
        'guide.startTitle': 'Getting started with AMB Grid in JavaScript',
        'guide.startText': 'After the complete demo, these steps show the minimum needed to prepare the container, data, columns, and payload in a JavaScript page.',
        'guide.step1.title': 'Prepare the container',
        'guide.step1.text': 'Create a dedicated mount point for the grid in your markup.',
        'guide.step2.title': 'Import AMB Grid',
        'guide.step2.text': 'During local development, import the library from the project source or build. When the npm package is available, this section will contain the official command.',
        'guide.step3.title': 'Define data and columns',
        'guide.step3.text': 'Start with a small dataset and explicit columns. Validators can be added wherever application rules are needed.',
        'guide.step4.title': 'Create the CRUD grid',
        'guide.step4.text': 'AMB.table mounts Tabulator and adds the AMB Grid CRUD layer for row states, validation, and payloads.',
        'guide.step5.title': 'Read the payload',
        'guide.step5.text': 'When the application needs to save, read the CRUD payload generated by AMB Grid and send it to your backend.',
        'guide.step6.title': 'Next steps',
        'guide.step6.text': 'Review the complete demo to see lookup, autocomplete, toolbar, rollback, validation, and payload in one workflow.',
        'guide.classic.kicker': 'Legacy-friendly',
        'guide.classic.title': 'Classic HTML + JS + CSS integration',
        'guide.classic.modernBadge': 'Modern',
        'guide.classic.legacyBadge': 'Legacy-friendly',
        'guide.classic.plannedBadge': 'Planned browser bundle',
        'guide.classic.text': 'AMB Grid stays framework-agnostic: Tabulator is the table engine, while AMB Grid adds the application CRUD layer without forcing React, Vue, or Angular.',
        'guide.classic.modernTitle': 'Modern JavaScript / bundler',
        'guide.classic.modernText': 'Use ESM imports in Vite, bundlers, or modern projects. During local development you can import AMB from source or from the project build you prepare.',
        'guide.classic.classicTitle': 'Classic HTML + JS + CSS',
        'guide.classic.filesTitle': 'File structure',
        'guide.classic.filesText': 'Three files keep markup, AMB Grid configuration, and page-specific application styling separate.',
        'guide.classic.classicText': 'In server-rendered pages you can keep a classic structure: HTML imports CSS and scripts, the page JavaScript configures AMB Grid, and the page CSS contains only project-specific styling.',
        'guide.classic.htmlTitle': 'HTML planned for the future browser bundle',
        'guide.classic.htmlText': 'AMB Grid does not yet produce an amb-grid.umd.js or amb-grid.iife.js file. This snippet is the planned browser bundle integration shape, not a production-ready path today.',
        'guide.classic.jsTitle': 'inventory-page.js',
        'guide.classic.jsText': 'The Add callback returns the crud.addRow(...) Promise, so the toolbar can keep its busy state and wait for reveal and focus.',
        'guide.classic.cssTitle': 'inventory-page.css',
        'guide.classic.cssText': 'Application styling stays separate from the library stylesheet.',
        'guide.openMainDemo': 'Back to demo',
        'guide.openExamples': 'View feature examples',
        'guide.videoKicker': 'Video guide',
        'guide.videoTitle': 'Installation and JavaScript usage',
        'guide.videoText': 'An introductory video about installing and using AMB Grid with JavaScript will be linked here.',
        'guide.videoCta': 'Coming soon'
    }
};

const root = document.querySelector('#app');
let currentMainDemo = null;
let currentFeatureExample = null;
let currentLang = 'it';
let currentView = null;
let featureLoadToken = 0;
let mainDemoLoadToken = 0;

const getText = key => translations[currentLang][key] || translations.it[key] || key;

const renderLanguageSwitch = () => `
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
`;

const applyI18n = () => {
    document.documentElement.lang = currentLang;
    document.title = currentLang === 'it'
        ? 'AMB Grid - Demo legacy-friendly'
        : 'AMB Grid - Legacy-friendly demo';

    root.querySelectorAll('[data-i18n]').forEach(element => {
        element.textContent = getText(element.dataset.i18n);
    });

    root.querySelectorAll('[data-i18n-title]').forEach(element => {
        const title = getText(element.dataset.i18nTitle);

        element.title = title;
        element.setAttribute('aria-label', title);
    });

    root.querySelectorAll('[data-language-switch]').forEach(switchElement => {
        switchElement.classList.toggle('is-it', currentLang === 'it');
        switchElement.classList.toggle('is-en', currentLang === 'en');
    });

    root.querySelectorAll('[data-language-label]').forEach(label => {
        const isActive = label.dataset.languageLabel === currentLang;

        label.classList.toggle('is-active', isActive);
        label.setAttribute('aria-pressed', String(isActive));
    });

    root.querySelectorAll('[data-language-toggle]').forEach(button => {
        const isItalian = currentLang === 'it';
        const nextLanguageLabel = getText(isItalian ? 'language.switchToEn' : 'language.switchToIt');

        button.setAttribute('aria-checked', String(isItalian));
        button.setAttribute('aria-label', nextLanguageLabel);
        button.title = nextLanguageLabel;
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

const destroyCurrentDemos = () => {
    destroyDemo(currentMainDemo);
    destroyDemo(currentFeatureExample);
    currentMainDemo = null;
    currentFeatureExample = null;
    featureLoadToken += 1;
    mainDemoLoadToken += 1;
};

const bindLanguageButtons = () => {
    root.querySelectorAll('[data-language-toggle]').forEach(button => {
        button.addEventListener('click', () => {
            currentLang = currentLang === 'it' ? 'en' : 'it';
            applyI18n();
        });
    });

    root.querySelectorAll('[data-language-set]').forEach(button => {
        button.addEventListener('click', () => {
            currentLang = button.dataset.languageSet === 'en' ? 'en' : 'it';
            applyI18n();
        });
    });
};

const renderShell = selectedId => {
    root.innerHTML = `
        <main class="demo-page site-container">
            <header class="demo-hero">
                <nav class="demo-topbar" aria-label="AMB Grid demo navigation">
                    ${renderDemoBrand()}
                    ${renderLanguageSwitch()}
                </nav>
                <div class="demo-hero__body">
                    <div class="demo-hero__content" id="top">
                        <h1 data-i18n="hero.title">Griglie CRUD per applicazioni business</h1>
                        <p class="demo-hero__text" data-i18n="hero.description">AMB Grid aggiunge a Tabulator uno strato CRUD framework-agnostic per stati riga, validazione, lookup, rollback, salvataggio e payload pronti per il backend.</p>
                        <div class="demo-hero__actions">
                            <a class="demo-button demo-button--primary" href="#getting-started-javascript">${demoIcon('arrowRight')}<span data-i18n="hero.primary">Apri demo JavaScript</span></a>
                            <a class="demo-button" href="#feature-examples">${demoIcon('selected')}<span data-i18n="hero.secondary">Vedi esempi funzionali</span></a>
                        </div>
                    </div>
                    <aside class="demo-hero-visual" data-i18n-title="hero.visualAria" aria-label="Ciclo CRUD di AMB Grid">
                        <div class="demo-hero-visual__chrome" aria-hidden="true">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <div class="demo-hero-visual__header">
                            <span data-i18n="hero.visualTitle">Ciclo CRUD applicativo</span>
                            <strong>AMB Grid</strong>
                        </div>
                        <p data-i18n="hero.visualSubtitle">Motore Tabulator + layer AMB Grid</p>
                        <div class="demo-hero-visual__flow">
                            <span data-i18n="hero.visualEdit">Edit</span>
                            <span data-i18n="hero.visualValidate">Validate</span>
                            <span data-i18n="hero.visualSave">Save</span>
                            <span data-i18n="hero.visualPayload">Payload</span>
                        </div>
                        <div class="demo-hero-visual__chips">
                            <span data-i18n="hero.visualLegacy">legacy-friendly</span>
                            <span data-i18n="hero.visualFramework">framework-ready</span>
                            <span data-i18n="hero.visualBackend">backend payload</span>
                        </div>
                    </aside>
                    <div class="demo-hero__metrics" aria-label="AMB Grid capabilities">
                        <div>
                            <strong data-i18n="hero.statState">Stati riga</strong>
                            <span data-i18n="hero.statStateText">clean, new, modified, deleted, saved</span>
                        </div>
                        <div>
                            <strong data-i18n="hero.statPayload">Payload CRUD</strong>
                            <span data-i18n="hero.statPayloadText">inserted, updated, deleted, backend-ready</span>
                        </div>
                        <div>
                            <strong data-i18n="hero.statIntegration">Framework-agnostic</strong>
                            <span data-i18n="hero.statIntegrationText">JavaScript classico, stack moderni e sistemi legacy-friendly</span>
                        </div>
                    </div>
                </div>
            </header>

            <section class="demo-section demo-frameworks" id="framework-integrations">
                <div class="demo-section-heading">
                    <h2 data-i18n="frameworks.title">Scegli il percorso di integrazione</h2>
                    <p class="demo-note" data-i18n="frameworks.description">La logica CRUD resta la stessa in JavaScript, React, Vue, Angular e pagine legacy-friendly: scegli il percorso piu vicino al tuo stack.</p>
                </div>
                <div class="demo-framework-grid">
                    <a class="demo-framework-card demo-framework-card--javascript demo-framework-card--ready" href="#getting-started-javascript">
                        <span class="demo-framework-card__icon" aria-hidden="true">
                            ${demoIcon('javascript', { className: 'demo-card-icon demo-card-icon--framework', size: 34 })}
                        </span>
                        <span class="demo-framework-card__body">
                            <span class="demo-framework-card__name">JavaScript</span>
                            <span class="demo-framework-card__badge demo-framework-card__badge--ready" data-i18n="frameworks.javascript.badge">Guida disponibile</span>
                            <span class="demo-framework-card__description" data-i18n="frameworks.javascript.description">Modern JavaScript, Classic HTML + JS + CSS e contesti legacy-friendly con la guida gia disponibile.</span>
                            <span class="demo-framework-card__meta">
                                <span class="demo-framework-card__meta-item" data-i18n="frameworks.javascript.detailModern">Modern bundler</span>
                                <span class="demo-framework-card__meta-item" data-i18n="frameworks.javascript.detailClassic">Classic HTML + JS + CSS</span>
                                <span class="demo-framework-card__meta-item" data-i18n="frameworks.javascript.detailRecommended">Primo percorso consigliato</span>
                            </span>
                            <span class="demo-framework-card__status demo-framework-card__status--ready" data-i18n="frameworks.javascript.status">Apri guida</span>
                        </span>
                        <span class="demo-framework-card__arrow" aria-hidden="true">&rarr;</span>
                    </a>
                    <a class="demo-framework-card demo-framework-card--react demo-framework-card--integration" href="#feature-examples">
                        <span class="demo-framework-card__icon" aria-hidden="true">
                            ${demoIcon('react', { className: 'demo-card-icon demo-card-icon--framework', size: 34 })}
                        </span>
                        <span class="demo-framework-card__body">
                            <span class="demo-framework-card__name">React</span>
                            <span class="demo-framework-card__badge demo-framework-card__badge--integration" data-i18n="frameworks.react.badge">React + TypeScript</span>
                            <span class="demo-framework-card__description" data-i18n="frameworks.react.description">AMB Grid montato dentro componenti React, con cleanup del ciclo di vita tramite grid.destroy().</span>
                            <span class="demo-framework-card__meta">
                                <span class="demo-framework-card__meta-item" data-i18n="frameworks.react.detailLifecycle">Mount / destroy</span>
                            </span>
                            <span class="demo-framework-card__status" data-i18n="frameworks.react.status">Vedi integrazione</span>
                        </span>
                        <span class="demo-framework-card__arrow" aria-hidden="true">&rarr;</span>
                    </a>
                    <a class="demo-framework-card demo-framework-card--vue demo-framework-card--integration" href="#feature-examples">
                        <span class="demo-framework-card__icon" aria-hidden="true">
                            ${demoIcon('vue', { className: 'demo-card-icon demo-card-icon--framework', size: 34 })}
                        </span>
                        <span class="demo-framework-card__body">
                            <span class="demo-framework-card__name">Vue</span>
                            <span class="demo-framework-card__badge demo-framework-card__badge--integration" data-i18n="frameworks.vue.badge">Vue + TypeScript</span>
                            <span class="demo-framework-card__description" data-i18n="frameworks.vue.description">Integrazione con lifecycle Vue e cleanup quando il componente viene smontato.</span>
                            <span class="demo-framework-card__meta">
                                <span class="demo-framework-card__meta-item" data-i18n="frameworks.vue.detailLifecycle">Lifecycle / cleanup</span>
                            </span>
                            <span class="demo-framework-card__status" data-i18n="frameworks.vue.status">Vedi integrazione</span>
                        </span>
                        <span class="demo-framework-card__arrow" aria-hidden="true">&rarr;</span>
                    </a>
                    <a class="demo-framework-card demo-framework-card--angular demo-framework-card--integration" href="#feature-examples">
                        <span class="demo-framework-card__icon" aria-hidden="true">
                            ${demoIcon('angular', { className: 'demo-card-icon demo-card-icon--framework', size: 34 })}
                        </span>
                        <span class="demo-framework-card__body">
                            <span class="demo-framework-card__name">Angular</span>
                            <span class="demo-framework-card__badge demo-framework-card__badge--integration" data-i18n="frameworks.angular.badge">Angular integration</span>
                            <span class="demo-framework-card__description" data-i18n="frameworks.angular.description">Integrazione in componenti Angular e pagine gestionali moderne, senza promettere wrapper ufficiali.</span>
                            <span class="demo-framework-card__meta">
                                <span class="demo-framework-card__meta-item" data-i18n="frameworks.angular.detailLifecycle">Component lifecycle</span>
                            </span>
                            <span class="demo-framework-card__status" data-i18n="frameworks.angular.status">Vedi integrazione</span>
                        </span>
                        <span class="demo-framework-card__arrow" aria-hidden="true">&rarr;</span>
                    </a>
                </div>
            </section>

            <section class="demo-section demo-section--flow">
                <div class="demo-section-heading">
                    <p class="demo-kicker" data-i18n="cycle.kicker">Flusso applicativo</p>
                    <h2 data-i18n="cycle.title">CRUD, validazione e payload nello stesso ciclo</h2>
                    <p class="demo-note" data-i18n="cycle.description">AMB Grid coordina editing, validazione, lookup, rollback, salvataggio e payload pronti per il backend senza imporre un framework.</p>
                </div>
                <div class="demo-flow-grid">
                    <article class="demo-flow-card">
                        <span class="demo-flow-card__header">
                            <span class="demo-flow-card__step" aria-hidden="true">01</span>
                            ${demoIcon('edit', { className: 'demo-card-icon demo-card-icon--flow', size: 18 })}
                            <strong data-i18n="cycle.editTitle">Edit</strong>
                        </span>
                        <p data-i18n="cycle.editText">Le celle editabili aggiornano i dati senza nascondere gli stati riga.</p>
                    </article>
                    <article class="demo-flow-card">
                        <span class="demo-flow-card__header">
                            <span class="demo-flow-card__step" aria-hidden="true">02</span>
                            ${demoIcon('keyboard', { className: 'demo-card-icon demo-card-icon--flow', size: 18 })}
                            <strong data-i18n="cycle.keyboardTitle">Editing orientato alla tastiera</strong>
                        </span>
                        <p data-i18n="cycle.keyboardText">Inserimento rapido dei dati con navigazione Tab, conferma lookup e flusso pensato per utenti gestionali.</p>
                    </article>
                    <article class="demo-flow-card">
                        <span class="demo-flow-card__header">
                            <span class="demo-flow-card__step" aria-hidden="true">03</span>
                            ${demoIcon('validation', { className: 'demo-card-icon demo-card-icon--flow', size: 18 })}
                            <strong data-i18n="cycle.validateTitle">Validate</strong>
                        </span>
                        <p data-i18n="cycle.validateText">Validatori e parser separano qualità del dato e normalizzazione payload.</p>
                    </article>
                    <article class="demo-flow-card">
                        <span class="demo-flow-card__header">
                            <span class="demo-flow-card__step" aria-hidden="true">04</span>
                            ${demoIcon('payload', { className: 'demo-card-icon demo-card-icon--flow', size: 18 })}
                            <strong data-i18n="cycle.payloadTitle">Payload</strong>
                        </span>
                        <p data-i18n="cycle.payloadText">Le modifiche diventano JSON leggibile e pronto per una API applicativa.</p>
                    </article>
                    <article class="demo-flow-card">
                        <span class="demo-flow-card__header">
                            <span class="demo-flow-card__step" aria-hidden="true">05</span>
                            ${demoIcon('backend', { className: 'demo-card-icon demo-card-icon--flow', size: 18 })}
                            <strong data-i18n="cycle.alignTitle">Align</strong>
                        </span>
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
                <div class="demo-feature-grid" aria-label="Feature examples">
                    ${featureExamples.map(example => `
                        <button
                            type="button"
                            class="demo-feature-card${example.id === selectedId ? ' is-active' : ''}"
                            data-example="${example.id}"
                        >
                            <span class="demo-feature-card__title">${example.label}</span>
                            <span class="demo-feature-card__description" data-i18n="${example.descriptionKey}">${getText(example.descriptionKey)}</span>
                            <span class="demo-feature-card__action" data-i18n="examples.open">Apri esempio</span>
                        </button>
                    `).join('')}
                </div>
                <section id="feature-example" class="demo-example demo-panel"></section>
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
    bindLanguageButtons();
};

const mountMainDemo = async (selector, expectedView = 'guide', options = {}) => {
    const token = mainDemoLoadToken + 1;
    const container = root.querySelector(selector);

    mainDemoLoadToken = token;
    destroyDemo(currentMainDemo);
    currentMainDemo = null;

    if (!container) return;

    const mountedDemo = await fullDemo(container, options);

    if (token !== mainDemoLoadToken || currentView !== expectedView) {
        destroyDemo(mountedDemo);
        return;
    }

    currentMainDemo = mountedDemo;
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

const scrollToHashTarget = () => {
    const id = window.location.hash.replace(/^#/, '');

    if (!id || id === 'top') {
        window.scrollTo(0, 0);
        return;
    }

    const target = document.getElementById(id);

    if (target) {
        target.scrollIntoView();
    }
};

const renderGuide = () => {
    if (currentView === 'guide') {
        applyI18n();
        return;
    }

    destroyCurrentDemos();
    currentView = 'guide';
    gettingStartedJavaScript(root);
    bindLanguageButtons();
    applyI18n();
    mountMainDemo('#javascript-demo', 'guide', {
        className: 'demo-showcase demo-showcase--large',
        compactHeader: true,
        variant: 'showcase'
    });
    window.scrollTo(0, 0);
};

const renderHome = () => {
    if (currentView !== 'home') {
        destroyCurrentDemos();
        currentView = 'home';
        renderShell(featureExamples[0].id);
        applyI18n();
        loadFeatureExample(featureExamples[0].id);
        window.requestAnimationFrame(scrollToHashTarget);
        return;
    }

    window.requestAnimationFrame(scrollToHashTarget);
};

const renderRoute = () => {
    if (window.location.hash === '#getting-started-javascript') {
        renderGuide();
        return;
    }

    renderHome();
};

window.addEventListener('hashchange', renderRoute);
renderRoute();
