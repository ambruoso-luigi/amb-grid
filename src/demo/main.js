import 'tabulator-tables/dist/css/tabulator.min.css';
import 'vanillajs-datepicker/css/datepicker.min.css';
import '../amb-grid.css';
import './demo.css';
import { AMB } from '../index.js';
import basicCrud from './basic-crud.js';
import validation from './validation.js';
import autocomplete from './autocomplete.js';
import multifieldLookup from './multifield-lookup.js';
import rowStates from './row-states.js';
import columnCalculations from './column-calculations.js';
import fullDemo from './full-demo.js';
import gettingStartedJavaScript from './getting-started-javascript.js';
import { renderDemoBrand } from './demo-brand.js';
import { demoIcon, frameworkIcon } from './demo-icons.js';
import { initDemoMotion } from './demo-motion.js';
import { publicExampleTranslations } from './example-copy.js';

window.AMB = AMB;
window.LookupDialog = AMB.LookupDialog;

const featureExamples = [
    { id: 'basic-crud', titleKey: 'examples.basicCrud.title', descriptionKey: 'examples.basicCrud.description', mount: basicCrud },
    { id: 'validation', titleKey: 'examples.validation.title', descriptionKey: 'examples.validation.description', mount: validation },
    { id: 'autocomplete', titleKey: 'examples.autocomplete.title', descriptionKey: 'examples.autocomplete.description', mount: autocomplete },
    { id: 'multifield-lookup', titleKey: 'examples.multifieldLookup.title', descriptionKey: 'examples.multifieldLookup.description', mount: multifieldLookup },
    { id: 'row-states', titleKey: 'examples.rowStates.title', descriptionKey: 'examples.rowStates.description', mount: rowStates },
    { id: 'column-calculations', titleKey: 'examples.columnCalculations.title', descriptionKey: 'examples.columnCalculations.description', mount: columnCalculations }
];

const translations = {
    it: {
        ...publicExampleTranslations.it,
        'page.title': 'AMB Grid',
        'page.subtitle': 'Libreria CRUD framework-agnostic per dati tabellari editabili nelle applicazioni business.',
        'language.itTitle': 'Italiano',
        'language.enTitle': 'English',
        'language.switchToIt': 'Cambia lingua in italiano',
        'language.switchToEn': 'Cambia lingua in inglese',
        'hero.badge': 'AMB Grid',
        'hero.badgeDetail': 'Griglie CRUD per applicazioni business',
        'hero.title': 'Griglie CRUD per applicazioni business',
        'hero.description': 'AMB Grid coordina stati riga, validazione, lookup, rollback, salvataggio e payload pronti per il backend senza imporre un framework.',
        'hero.secondary': 'Vedi esempi funzionali',
        'hero.videoLabel': 'Anteprima video',
        'hero.videoOpen': 'Apri l’anteprima video su YouTube',
        'frameworks.title': 'Integrabile dove lavori già',
        'frameworks.description': 'Usa AMB Grid in pagine JavaScript classiche, sistemi legacy-friendly o stack moderni come React, Vue e Angular.',
        'frameworks.javascript.badge': 'Classic integration',
        'frameworks.javascript.description': 'Snippet base con AMB.table(...).',
        'frameworks.javascript.status': 'Apri guida JavaScript',
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
        'mainDemo.primaryLabel': 'Demo principale',
        'mainDemo.title': 'Gestionale Magazzino Classico',
        'mainDemo.description': 'Una pagina gestionale classica, adatta a contesti server-rendered e legacy-friendly, con una UI moderna per CRUD, validazione e payload applicativi.',
        'mainDemo.scenario': 'Scenario: Classic Warehouse Backoffice',
        'mainDemo.panelKicker': 'Pannello operativo',
        'mainDemo.panelTitle': 'Dati magazzino editabili',
        'mainDemo.panelText': 'Gestisci righe prodotto, stati CRUD, validazione e payload backend nello stesso flusso.',
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
        'roadmap.kicker': 'Prossimi passi',
        'roadmap.title': 'Roadmap essenziale',
        'roadmap.demo': 'Raffinare la demo magazzino con fake API più completa, rollback guidato e salvataggio simulato più realistico.',
        'roadmap.site': 'Preparare una futura versione bilingue completa e una pubblicazione GitHub Pages dedicata alla demo.',
        'roadmap.package': 'Definire in seguito build libreria, `files` npm o `.npmignore`, tipi e artifact pubblicabile senza demo.',
        'guide.back': 'Torna alla home demo',
        'guide.badge': 'JavaScript',
        'guide.title': 'AMB Grid con JavaScript',
        'guide.description': 'Demo tabellare e guida essenziale per usare AMB Grid con JavaScript moderno o direttamente nel browser, senza framework obbligatori.',
        'guide.startTitle': 'Inizia con AMB Grid in JavaScript',
        'guide.startText': 'Dopo la demo completa, questi step mostrano il minimo necessario per preparare container, dati, colonne e payload in una pagina JavaScript.',
        'guide.step1.title': 'Prepara il container',
        'guide.step1.text': 'Crea nel markup un punto di mount dedicato alla griglia.',
        'guide.step2.title': 'Importa AMB Grid',
        'guide.step2.text': 'Installa il package e importa l’API pubblica insieme allo stylesheet completo.',
        'guide.step3.title': 'Definisci dati e colonne',
        'guide.step3.text': 'Parti da un dataset piccolo e da colonne esplicite. I validator possono essere aggiunti dove servono regole applicative.',
        'guide.step4.title': 'Crea la griglia CRUD',
        'guide.step4.text': 'AMB.table monta la griglia e coordina stati riga, validazione e payload attraverso l’API pubblica di AMB Grid.',
        'guide.step5.title': 'Leggi il payload',
        'guide.step5.text': 'Quando l’applicazione deve salvare, leggi il payload CRUD generato da AMB Grid e invialo al tuo backend.',
        'guide.step6.title': 'Prossimi passi',
        'guide.step6.text': 'Rivedi la demo completa per vedere lookup, autocomplete, toolbar, rollback, validazione e payload nello stesso flusso.',
        'guide.integration.kicker': 'Due modalità, una sola API',
        'guide.integration.title': 'Usare AMB Grid con JavaScript',
        'guide.integration.text': 'AMB Grid si integra direttamente in JavaScript ed è framework-agnostic: usa il package npm in un progetto moderno oppure il bundle UMD in una pagina browser o server-rendered.',
        'guide.integration.modernBadge': 'npm + ESM',
        'guide.integration.modernTitle': 'Modern JavaScript / npm',
        'guide.integration.modernText': 'La scelta naturale per Vite, bundler e applicazioni JavaScript moderne, con installazione e aggiornamenti gestiti da npm.',
        'guide.integration.installLabel': 'Installazione',
        'guide.integration.importLabel': 'Import',
        'guide.integration.browserBadge': 'Standalone',
        'guide.integration.browserTitle': 'Browser / standalone',
        'guide.integration.browserText': 'Per pagine browser, server-rendered e applicazioni esistenti che non richiedono npm, bundler o framework.',
        'guide.integration.assetsLabel': 'Caricamento asset',
        'guide.integration.globalLabel': 'Global pubblico',
        'guide.integration.bundleText': 'Il bundle UMD è pronto per l’uso standalone: carica soltanto gli asset AMB Grid indicati qui sopra.',
        'guide.integration.setupBadge': 'Setup essenziale',
        'guide.integration.containerTitle': '1. Prepara il container',
        'guide.integration.containerText': 'La pagina prepara soltanto un punto di mount dedicato; AMB Grid gestisce il DOM interno della tabella.',
        'guide.integration.jsTitle': '2. Dati, colonne e griglia',
        'guide.integration.jsText': 'La stessa API pubblica funziona con l’import ESM o con il global AMB del bundle browser.',
        'guide.integration.cssTitle': '3. CSS applicativo',
        'guide.integration.cssText': 'Lo stile della pagina resta piccolo e separato dallo stylesheet completo di AMB Grid.',
        'guide.openMainDemo': 'Torna alla demo',
        'guide.openExamples': 'Vedi esempi funzionali',
        'guide.videoLabel': 'Video demo — placeholder',
        'guide.videoOpen': 'Apri il video demo placeholder su YouTube'
    },
    en: {
        ...publicExampleTranslations.en,
        'page.title': 'AMB Grid',
        'page.subtitle': 'A framework-agnostic CRUD grid library for editable tabular data in business applications.',
        'language.itTitle': 'Italiano',
        'language.enTitle': 'English',
        'language.switchToIt': 'Switch language to Italian',
        'language.switchToEn': 'Switch language to English',
        'hero.badge': 'AMB Grid',
        'hero.badgeDetail': 'CRUD grids for business applications',
        'hero.title': 'CRUD data grids for business applications',
        'hero.description': 'AMB Grid coordinates row states, validation, lookups, rollback, saving, and backend-ready payloads without forcing a framework.',
        'hero.secondary': 'View feature examples',
        'hero.videoLabel': 'Video preview',
        'hero.videoOpen': 'Open the video preview on YouTube',
        'frameworks.title': 'Use AMB Grid where you already work',
        'frameworks.description': 'Integrate AMB Grid in classic JavaScript pages, legacy-friendly systems or modern stacks like React, Vue and Angular.',
        'frameworks.javascript.badge': 'Classic integration',
        'frameworks.javascript.description': 'Basic snippet with AMB.table(...).',
        'frameworks.javascript.status': 'Open JavaScript guide',
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
        'mainDemo.primaryLabel': 'Main demo',
        'mainDemo.title': 'Classic Warehouse Backoffice',
        'mainDemo.description': 'A classic server-rendered and legacy-friendly business page with a modern UI for CRUD, validation, and application payloads.',
        'mainDemo.scenario': 'Scenario: Gestionale Magazzino Classico',
        'mainDemo.panelKicker': 'Operational panel',
        'mainDemo.panelTitle': 'Editable inventory data',
        'mainDemo.panelText': 'Manage product rows, CRUD states, validation, and backend payloads in one workflow.',
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
        'roadmap.kicker': 'Next steps',
        'roadmap.title': 'Essential roadmap',
        'roadmap.demo': 'Refine the warehouse demo with a fuller fake API, guided rollback, and a more realistic simulated save.',
        'roadmap.site': 'Prepare a future complete bilingual version and a GitHub Pages publication dedicated to the demo.',
        'roadmap.package': 'Later define a library build, npm `files` or `.npmignore`, types, and a publishable artifact without demos.',
        'guide.back': 'Back to demo home',
        'guide.badge': 'JavaScript',
        'guide.title': 'AMB Grid with JavaScript',
        'guide.description': 'A tabular demo and essential guide for using AMB Grid with modern JavaScript or directly in the browser, with no required framework.',
        'guide.startTitle': 'Getting started with AMB Grid in JavaScript',
        'guide.startText': 'After the complete demo, these steps show the minimum needed to prepare the container, data, columns, and payload in a JavaScript page.',
        'guide.step1.title': 'Prepare the container',
        'guide.step1.text': 'Create a dedicated mount point for the grid in your markup.',
        'guide.step2.title': 'Import AMB Grid',
        'guide.step2.text': 'Install the package and import the public API together with the complete stylesheet.',
        'guide.step3.title': 'Define data and columns',
        'guide.step3.text': 'Start with a small dataset and explicit columns. Validators can be added wherever application rules are needed.',
        'guide.step4.title': 'Create the CRUD grid',
        'guide.step4.text': 'AMB.table mounts the grid and coordinates row states, validation, and payloads through the public AMB Grid API.',
        'guide.step5.title': 'Read the payload',
        'guide.step5.text': 'When the application needs to save, read the CRUD payload generated by AMB Grid and send it to your backend.',
        'guide.step6.title': 'Next steps',
        'guide.step6.text': 'Review the complete demo to see lookup, autocomplete, toolbar, rollback, validation, and payload in one workflow.',
        'guide.integration.kicker': 'Two modes, one API',
        'guide.integration.title': 'Use AMB Grid with JavaScript',
        'guide.integration.text': 'AMB Grid integrates directly with JavaScript and remains framework-agnostic: use the npm package in a modern project or the UMD bundle in a browser or server-rendered page.',
        'guide.integration.modernBadge': 'npm + ESM',
        'guide.integration.modernTitle': 'Modern JavaScript / npm',
        'guide.integration.modernText': 'The natural choice for Vite, bundlers, and modern JavaScript applications, with installation and updates managed by npm.',
        'guide.integration.installLabel': 'Install',
        'guide.integration.importLabel': 'Import',
        'guide.integration.browserBadge': 'Standalone',
        'guide.integration.browserTitle': 'Browser / standalone',
        'guide.integration.browserText': 'For browser pages, server-rendered applications, and existing systems that do not need npm, a bundler, or a framework.',
        'guide.integration.assetsLabel': 'Load assets',
        'guide.integration.globalLabel': 'Public global',
        'guide.integration.bundleText': 'The UMD bundle is ready for standalone use: load only the AMB Grid assets shown above.',
        'guide.integration.setupBadge': 'Essential setup',
        'guide.integration.containerTitle': '1. Prepare the container',
        'guide.integration.containerText': 'The page provides only a dedicated mount point; AMB Grid manages the table DOM inside it.',
        'guide.integration.jsTitle': '2. Data, columns, and grid',
        'guide.integration.jsText': 'The same public API works with the ESM import or the AMB global from the browser bundle.',
        'guide.integration.cssTitle': '3. Application CSS',
        'guide.integration.cssText': 'Page styling stays small and separate from the complete AMB Grid stylesheet.',
        'guide.openMainDemo': 'Back to demo',
        'guide.openExamples': 'View feature examples',
        'guide.videoLabel': 'Demo video — placeholder',
        'guide.videoOpen': 'Open the placeholder demo video on YouTube'
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
                        <p class="demo-hero-badge">
                            ${demoIcon('crud', { className: 'demo-hero-badge-icon', size: 16, strokeWidth: 2.2 })}
                            <span data-i18n="hero.badge">AMB Grid</span>
                            <strong data-i18n="hero.badgeDetail">Griglie CRUD per applicazioni business</strong>
                        </p>
                        <h1 data-i18n="hero.title">Griglie CRUD per applicazioni business</h1>
                        <p class="demo-hero__text" data-i18n="hero.description">AMB Grid coordina stati riga, validazione, lookup, rollback, salvataggio e payload pronti per il backend senza imporre un framework.</p>
                        <div class="demo-hero__actions">
                            <a class="demo-button demo-button--primary" href="#feature-examples">${demoIcon('selected', { className: 'demo-icon demo-hero-cta-icon' })}<span data-i18n="hero.secondary">Vedi esempi funzionali</span></a>
                        </div>
                    </div>
                    <a
                        class="demo-guide-video demo-hero__video"
                        href="https://youtu.be/4m0EZ4vPmT0"
                        target="_blank"
                        rel="noopener noreferrer"
                        data-i18n-title="hero.videoOpen"
                        aria-label="Apri l’anteprima video su YouTube"
                    >
                        <img class="demo-guide-video__image" src="https://i.ytimg.com/vi/4m0EZ4vPmT0/hqdefault.jpg" alt="" loading="eager">
                        <span class="demo-guide-video__overlay" aria-hidden="true"></span>
                        <span class="demo-guide-video__play" aria-hidden="true">${demoIcon('video', { size: 30 })}</span>
                        <span class="demo-guide-video__label" data-i18n="hero.videoLabel">Anteprima video</span>
                    </a>
                </div>
            </header>

            <section class="demo-section demo-frameworks card bg-base-100 text-base-content border shadow-sm" id="framework-integrations" data-theme="light">
                <div class="demo-section-heading">
                    <h2 data-i18n="frameworks.title">Integrabile dove lavori già</h2>
                    <p class="demo-note" data-i18n="frameworks.description">Usa AMB Grid in pagine JavaScript classiche, sistemi legacy-friendly o stack moderni come React, Vue e Angular.</p>
                </div>
                <div class="demo-framework-grid">
                    <a class="demo-framework-card demo-framework-card--javascript demo-framework-card--ready card bg-base-100 border shadow-sm transition" href="#getting-started-javascript">
                        <span class="demo-framework-card__icon" aria-hidden="true">
                            ${frameworkIcon('javascript')}
                        </span>
                        <span class="demo-framework-card__body">
                            <span class="demo-framework-card__name">JavaScript</span>
                            <span class="demo-framework-card__badge demo-framework-card__badge--ready" data-i18n="frameworks.javascript.badge">Classic integration</span>
                            <span class="demo-framework-card__description" data-i18n="frameworks.javascript.description">Snippet base con AMB.table(...).</span>
                            <span class="demo-framework-card__status demo-framework-card__status--ready" data-i18n="frameworks.javascript.status">Apri guida JavaScript</span>
                        </span>
                        <span class="demo-framework-card__arrow" aria-hidden="true">&rarr;</span>
                    </a>
                    <a class="demo-framework-card demo-framework-card--react demo-framework-card--integration card bg-base-100 border shadow-sm transition" href="#feature-examples">
                        <span class="demo-framework-card__icon" aria-hidden="true">
                            ${frameworkIcon('react')}
                        </span>
                        <span class="demo-framework-card__body">
                            <span class="demo-framework-card__name">React</span>
                            <span class="demo-framework-card__badge demo-framework-card__badge--integration" data-i18n="frameworks.react.badge">Lifecycle integration</span>
                            <span class="demo-framework-card__description" data-i18n="frameworks.react.description">Esempio concettuale con mount e grid.destroy() nel cleanup.</span>
                            <span class="demo-framework-card__status" data-i18n="frameworks.react.status">Planned full demo</span>
                        </span>
                        <span class="demo-framework-card__arrow" aria-hidden="true">&rarr;</span>
                    </a>
                    <a class="demo-framework-card demo-framework-card--vue demo-framework-card--integration card bg-base-100 border shadow-sm transition" href="#feature-examples">
                        <span class="demo-framework-card__icon" aria-hidden="true">
                            ${frameworkIcon('vue')}
                        </span>
                        <span class="demo-framework-card__body">
                            <span class="demo-framework-card__name">Vue</span>
                            <span class="demo-framework-card__badge demo-framework-card__badge--integration" data-i18n="frameworks.vue.badge">Composition API example</span>
                            <span class="demo-framework-card__description" data-i18n="frameworks.vue.description">Esempio concettuale con onMounted e onUnmounted.</span>
                            <span class="demo-framework-card__status" data-i18n="frameworks.vue.status">Snippet planned</span>
                        </span>
                        <span class="demo-framework-card__arrow" aria-hidden="true">&rarr;</span>
                    </a>
                    <a class="demo-framework-card demo-framework-card--angular demo-framework-card--integration card bg-base-100 border shadow-sm transition" href="#feature-examples">
                        <span class="demo-framework-card__icon" aria-hidden="true">
                            ${frameworkIcon('angular')}
                        </span>
                        <span class="demo-framework-card__body">
                            <span class="demo-framework-card__name">Angular</span>
                            <span class="demo-framework-card__badge demo-framework-card__badge--integration" data-i18n="frameworks.angular.badge">Component lifecycle example</span>
                            <span class="demo-framework-card__description" data-i18n="frameworks.angular.description">Esempio concettuale con AfterViewInit e OnDestroy.</span>
                            <span class="demo-framework-card__status" data-i18n="frameworks.angular.status">Snippet planned</span>
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
                            <span class="demo-feature-card__title" data-i18n="${example.titleKey}">${getText(example.titleKey)}</span>
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
    initDemoMotion(container);
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
    applyI18n();
    initDemoMotion(container);
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
        window.requestAnimationFrame(scrollToHashTarget);
        return;
    }

    destroyCurrentDemos();
    currentView = 'guide';
    gettingStartedJavaScript(root);
    bindLanguageButtons();
    applyI18n();
    initDemoMotion(root);
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
        initDemoMotion(root);
        loadFeatureExample(featureExamples[0].id);
        window.requestAnimationFrame(scrollToHashTarget);
        return;
    }

    window.requestAnimationFrame(scrollToHashTarget);
};

const renderRoute = () => {
    if (['#getting-started-javascript', '#javascript-demo'].includes(window.location.hash)) {
        renderGuide();
        return;
    }

    renderHome();
};

window.addEventListener('hashchange', renderRoute);
renderRoute();
