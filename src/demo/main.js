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
import dates from './dates.js';
import parsers from './parsers.js';
import fullDemo from './full-demo.js';
import gettingStartedJavaScript from './getting-started-javascript.js';
import { renderDemoBrand } from './demo-brand.js';
import { demoIcon, frameworkIcon } from './demo-icons.js';
import { animateCycleDetail, initDemoMotion } from './demo-motion.js';
import { publicExampleTranslations } from './example-copy.js';
import { demoColumnGuideTranslations } from './demo-column-guide-copy.js';
import { renderDemoFooter } from './demo-footer.js';

window.AMB = AMB;
window.LookupDialog = AMB.LookupDialog;

const featureExamples = [
    { id: 'basic-crud', titleKey: 'examples.basicCrud.title', descriptionKey: 'examples.basicCrud.description', mount: basicCrud },
    { id: 'validation', titleKey: 'examples.validation.title', descriptionKey: 'examples.validation.description', mount: validation },
    { id: 'autocomplete', titleKey: 'examples.autocomplete.title', descriptionKey: 'examples.autocomplete.description', mount: autocomplete },
    { id: 'multifield-lookup', titleKey: 'examples.multifieldLookup.title', descriptionKey: 'examples.multifieldLookup.description', mount: multifieldLookup },
    { id: 'row-states', titleKey: 'examples.rowStates.title', descriptionKey: 'examples.rowStates.description', mount: rowStates },
    { id: 'column-calculations', titleKey: 'examples.columnCalculations.title', descriptionKey: 'examples.columnCalculations.description', mount: columnCalculations },
    { id: 'dates', titleKey: 'examples.dates.title', descriptionKey: 'examples.dates.description', mount: dates },
    { id: 'parsers', titleKey: 'examples.parsers.title', descriptionKey: 'examples.parsers.description', mount: parsers }
];

const translations = {
    it: {
        ...publicExampleTranslations.it,
        ...demoColumnGuideTranslations.it,
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
        'cycle.editText': 'Modifica diretta delle celle con editor dedicati, stato della riga e rollback integrati nel ciclo CRUD.',
        'cycle.keyboardTitle': 'Editing orientato alla tastiera',
        'cycle.keyboardText': 'Navigazione Tab/Shift+Tab e flusso rapido pensato per l’uso gestionale da tastiera.',
        'cycle.validateTitle': 'Validate',
        'cycle.validateText': 'Validatori e parser mantengono separati qualità del dato e formato del payload.',
        'cycle.payloadTitle': 'Payload',
        'cycle.payloadText': 'Inserimenti, modifiche ed eliminazioni diventano un payload strutturato.',
        'cycle.alignTitle': 'Align',
        'cycle.alignText': 'Dopo il salvataggio dati, ID e stati vengono riallineati alla risposta backend.',
        'cycle.detail.edit.title': 'Editing pensato per dati gestionali',
        'cycle.detail.edit.intro': 'Le modifiche avvengono direttamente nella griglia: AMB Grid coordina editor, stato della riga e rollback nello stesso ciclo CRUD, senza separare l’editing dal dato che l’utente sta gestendo.',
        'cycle.detail.edit.group1Title': 'Editor dedicati',
        'cycle.detail.edit.group1Text': 'Testo, numeri, date, checkbox e lookup usano editor coerenti con il tipo di dato, mantenendo l’utente sempre nel contesto della griglia.',
        'cycle.detail.edit.group2Title': 'Stato automatico della riga',
        'cycle.detail.edit.group2Text': 'Quando un valore cambia realmente, AMB Grid aggiorna automaticamente lo stato della riga e mantiene traccia della modifica.',
        'cycle.detail.edit.group3Title': 'Rollback',
        'cycle.detail.edit.group3Text': 'Le modifiche possono essere annullate ripristinando i valori precedenti e riallineando automaticamente lo stato della riga.',
        'cycle.detail.edit.group4Title': 'Editing nel contesto',
        'cycle.detail.edit.group4Text': 'Il record viene modificato nel punto in cui viene consultato, senza aprire continuamente form separati per ogni operazione.',
        'cycle.detail.edit.value': 'Meno passaggi e meno perdita di contesto: l’utente lavora direttamente sui dati mentre AMB Grid mantiene coerente il ciclo CRUD.',
        'cycle.detail.keyboard.title': 'Editing orientato alla tastiera',
        'cycle.detail.keyboard.intro': 'Il flusso è pensato per inserimento rapido dei dati e uso frequente della tastiera, riducendo la necessità del mouse.',
        'cycle.detail.keyboard.tab': 'Tab',
        'cycle.detail.keyboard.shiftTab': 'Shift+Tab',
        'cycle.detail.keyboard.space': 'Space',
        'cycle.detail.keyboard.enter': 'Enter',
        'cycle.detail.keyboard.vertical': 'Alt+↑ / Alt+↓',
        'cycle.detail.keyboard.group1Title': 'Navigazione orizzontale',
        'cycle.detail.keyboard.group1Text': 'Spostano il focus tra le celle gestibili mantenendo continuo il flusso di editing.',
        'cycle.detail.keyboard.group2Title': 'Navigazione verticale',
        'cycle.detail.keyboard.group2Text': 'Consentono di cambiare riga mantenendo la stessa colonna quando il flusso lo richiede.',
        'cycle.detail.keyboard.group3Title': 'Checkbox',
        'cycle.detail.keyboard.group3Text': 'Le checkbox possono essere gestite da tastiera: toggle con Space/Invio e impostazione esplicita con 0/1.',
        'cycle.detail.keyboard.group4Title': 'Lookup ed editor complessi',
        'cycle.detail.keyboard.group4Text': 'Lookup, autocomplete, datepicker e dialog mantengono un percorso di focus coerente per tornare alla griglia senza interrompere il lavoro.',
        'cycle.detail.keyboard.value': 'Un flusso particolarmente adatto a backoffice e gestionali con inserimento intensivo di dati.',
        'cycle.detail.validate.title': 'Validazione e trasformazione restano separate',
        'cycle.detail.validate.intro': 'AMB Grid mantiene distinti controllo della qualità del dato e trasformazione del valore destinato al payload.',
        'cycle.detail.validate.group1Title': 'Regole sul dato',
        'cycle.detail.validate.group1Text': 'Required, formati, range, valori ammessi e regole applicative verificano la qualità del dato.',
        'cycle.detail.validate.group2Title': 'Parser',
        'cycle.detail.validate.group2Text': 'Normalizzano il valore nella forma prevista dal backend senza sostituire la validazione.',
        'cycle.detail.validate.group3Title': 'Errori contestuali',
        'cycle.detail.validate.group3Text': 'Gli errori restano associati alla cella e alla riga interessata.',
        'cycle.detail.validate.group4Title': 'Salvataggio consapevole',
        'cycle.detail.validate.group4Text': 'Lo stato di validità determina quali modifiche sono pronte per il backend.',
        'cycle.detail.validate.value': 'La UI distingue chiaramente un dato modificato da un dato effettivamente valido.',
        'cycle.detail.payload.title': 'Dal ciclo CRUD al payload backend',
        'cycle.detail.payload.intro': 'Il flusso di salvataggio conserva la distinzione tra righe nuove, modificate ed eliminate.',
        'cycle.detail.payload.flowTitle': 'getSavePayload()',
        'cycle.detail.payload.flowResult': 'payload pronto per il backend',
        'cycle.detail.payload.new': 'inserted',
        'cycle.detail.payload.modified': 'updated',
        'cycle.detail.payload.deleted': 'deleted',
        'cycle.detail.payload.group1Title': 'Inserite',
        'cycle.detail.payload.group1Text': 'Le nuove righe vengono raccolte separatamente.',
        'cycle.detail.payload.group2Title': 'Aggiornate',
        'cycle.detail.payload.group2Text': 'I record realmente modificati vengono distinti dai dati rimasti invariati.',
        'cycle.detail.payload.group3Title': 'Eliminate',
        'cycle.detail.payload.group3Text': 'Le cancellazioni fanno parte dello stesso ciclo senza gestione esterna parallela.',
        'cycle.detail.payload.group4Title': 'Validità',
        'cycle.detail.payload.group4Text': 'Le modifiche non valide restano distinte da quelle pronte per il salvataggio.',
        'cycle.detail.payload.value': 'L’applicazione riceve una struttura già organizzata per comunicare con il backend.',
        'cycle.detail.align.title': 'Riallineamento dopo il salvataggio',
        'cycle.detail.align.intro': 'Dopo la conferma del backend, la griglia può riallineare dati applicativi e stato locale.',
        'cycle.detail.align.group1Title': 'ID backend',
        'cycle.detail.align.group1Text': 'Una nuova riga può ricevere l’identificatore definitivo assegnato dal backend.',
        'cycle.detail.align.group2Title': 'Conferma dello stato',
        'cycle.detail.align.group2Text': 'Le modifiche salvate possono diventare la nuova baseline della tabella.',
        'cycle.detail.align.group3Title': 'Rollback aggiornato',
        'cycle.detail.align.group3Text': 'I successivi rollback fanno riferimento ai dati ormai confermati.',
        'cycle.detail.align.group4Title': 'Continuità applicativa',
        'cycle.detail.align.group4Text': 'Il client continua a lavorare sugli stessi record senza ricostruire manualmente l’intero stato.',
        'cycle.detail.align.value': 'Il ciclo non termina con l’invio del payload: AMB Grid gestisce anche il ritorno a uno stato coerente dopo il salvataggio.',
        'examples.kicker': 'Mini-demo tecniche',
        'examples.title': 'Esempi funzionali',
        'examples.description': 'Le demo esistenti restano accessibili come esempi focalizzati su singole capacità di AMB Grid.',
        'examples.open': 'Apri esempio',
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
        'guide.videoOpen': 'Apri il video demo placeholder su YouTube',
        'footer.cta.kicker': 'Prossimo passo',
        'footer.cta.title': 'Porta AMB Grid nel tuo progetto',
        'footer.cta.description': 'Esplora la guida JavaScript, prova gli esempi funzionali oppure consulta il progetto su GitHub.',
        'footer.cta.guide': 'Guida JavaScript',
        'footer.cta.examples': 'Vedi esempi',
        'footer.cta.github': 'GitHub',
        'footer.resources': 'Risorse',
        'footer.projectLinks': 'Progetto',
        'footer.tagline': 'Libreria CRUD framework-agnostic per applicazioni business.',
        'footer.project': 'Progetto open source',
        'footer.demo': 'Demo principale',
        'footer.examples': 'Esempi funzionali',
        'footer.guide': 'Guida JavaScript',
        'footer.github': 'GitHub',
        'footer.issues': 'Issues / Feedback',
        'footer.license': 'Apache 2.0',
        'footer.maintainer': 'Creato e mantenuto da Luigi Ambruoso'
    },
    en: {
        ...publicExampleTranslations.en,
        ...demoColumnGuideTranslations.en,
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
        'cycle.editText': 'Direct cell editing with dedicated editors, row state tracking and rollback integrated into the CRUD lifecycle.',
        'cycle.keyboardTitle': 'Keyboard-first editing',
        'cycle.keyboardText': 'Tab/Shift+Tab navigation and a fast keyboard-first workflow for business data entry.',
        'cycle.validateTitle': 'Validate',
        'cycle.validateText': 'Validators and parsers keep data quality separate from payload formatting.',
        'cycle.payloadTitle': 'Payload',
        'cycle.payloadText': 'Inserts, updates and deletes become a structured application payload.',
        'cycle.alignTitle': 'Align',
        'cycle.alignText': 'After save, data, IDs and states align with the backend response.',
        'cycle.detail.edit.title': 'Editing designed for business data',
        'cycle.detail.edit.intro': 'Changes happen directly in the grid: AMB Grid coordinates editors, row state and rollback within the same CRUD lifecycle, without separating editing from the data the user is working with.',
        'cycle.detail.edit.group1Title': 'Dedicated editors',
        'cycle.detail.edit.group1Text': 'Text, numbers, dates, checkboxes and lookups use editors suited to each data type, keeping the user in the context of the grid.',
        'cycle.detail.edit.group2Title': 'Automatic row state',
        'cycle.detail.edit.group2Text': 'When a value actually changes, AMB Grid automatically updates the row state and keeps track of the modification.',
        'cycle.detail.edit.group3Title': 'Rollback',
        'cycle.detail.edit.group3Text': 'Changes can be undone by restoring the previous values and automatically realigning the row state.',
        'cycle.detail.edit.group4Title': 'Editing in context',
        'cycle.detail.edit.group4Text': 'The record is edited where it is being viewed, without constantly opening separate forms for each operation.',
        'cycle.detail.edit.value': 'Fewer steps and less context switching: the user works directly with the data while AMB Grid keeps the CRUD lifecycle consistent.',
        'cycle.detail.keyboard.title': 'Keyboard-first editing',
        'cycle.detail.keyboard.intro': 'The workflow is designed for fast data entry and frequent keyboard use, reducing the need for a mouse.',
        'cycle.detail.keyboard.tab': 'Tab',
        'cycle.detail.keyboard.shiftTab': 'Shift+Tab',
        'cycle.detail.keyboard.space': 'Space',
        'cycle.detail.keyboard.enter': 'Enter',
        'cycle.detail.keyboard.vertical': 'Alt+↑ / Alt+↓',
        'cycle.detail.keyboard.group1Title': 'Horizontal navigation',
        'cycle.detail.keyboard.group1Text': 'They move focus between manageable cells while keeping the editing flow continuous.',
        'cycle.detail.keyboard.group2Title': 'Vertical navigation',
        'cycle.detail.keyboard.group2Text': 'They change row while preserving the same column when the workflow requires it.',
        'cycle.detail.keyboard.group3Title': 'Checkboxes',
        'cycle.detail.keyboard.group3Text': 'Checkboxes work directly from the keyboard: Space/Enter toggle and 0/1 explicitly set the value.',
        'cycle.detail.keyboard.group4Title': 'Lookups and complex editors',
        'cycle.detail.keyboard.group4Text': 'Lookup, autocomplete, datepicker, and dialogs preserve a coherent focus route back to the grid.',
        'cycle.detail.keyboard.value': 'Especially suited to back-office and business workflows with intensive data entry.',
        'cycle.detail.validate.title': 'Validation and transformation stay separate',
        'cycle.detail.validate.intro': 'AMB Grid keeps data-quality checks distinct from transforming the value destined for the payload.',
        'cycle.detail.validate.group1Title': 'Data rules',
        'cycle.detail.validate.group1Text': 'Required fields, formats, ranges, allowed values, and application rules verify data quality.',
        'cycle.detail.validate.group2Title': 'Parser',
        'cycle.detail.validate.group2Text': 'They normalize the value into the form expected by the backend without replacing validation.',
        'cycle.detail.validate.group3Title': 'Contextual errors',
        'cycle.detail.validate.group3Text': 'Errors remain associated with the affected cell and row.',
        'cycle.detail.validate.group4Title': 'Aware saving',
        'cycle.detail.validate.group4Text': 'Validation state helps determine which changes are ready for the backend.',
        'cycle.detail.validate.value': 'The UI clearly distinguishes changed data from data that is actually valid.',
        'cycle.detail.payload.title': 'From CRUD cycle to backend payload',
        'cycle.detail.payload.intro': 'The save flow preserves the distinction between new, modified, and deleted rows.',
        'cycle.detail.payload.flowTitle': 'getSavePayload()',
        'cycle.detail.payload.flowResult': 'payload ready for the backend',
        'cycle.detail.payload.new': 'inserted',
        'cycle.detail.payload.modified': 'updated',
        'cycle.detail.payload.deleted': 'deleted',
        'cycle.detail.payload.group1Title': 'Inserted',
        'cycle.detail.payload.group1Text': 'New rows are collected separately.',
        'cycle.detail.payload.group2Title': 'Updated',
        'cycle.detail.payload.group2Text': 'Records that really changed stay distinct from unchanged data.',
        'cycle.detail.payload.group3Title': 'Deleted',
        'cycle.detail.payload.group3Text': 'Deletes belong to the same cycle with no parallel external handling.',
        'cycle.detail.payload.group4Title': 'Validity',
        'cycle.detail.payload.group4Text': 'Invalid changes remain distinct from those ready to save.',
        'cycle.detail.payload.value': 'The application receives a structure already organized for backend communication.',
        'cycle.detail.align.title': 'Realignment after saving',
        'cycle.detail.align.intro': 'After backend confirmation, the grid can realign application data and local state.',
        'cycle.detail.align.group1Title': 'Backend ID',
        'cycle.detail.align.group1Text': 'A new row can receive the definitive identifier assigned by the backend.',
        'cycle.detail.align.group2Title': 'State confirmation',
        'cycle.detail.align.group2Text': 'Saved changes can become the table’s new baseline.',
        'cycle.detail.align.group3Title': 'Updated rollback',
        'cycle.detail.align.group3Text': 'Later rollbacks reference the data that has now been confirmed.',
        'cycle.detail.align.group4Title': 'Application continuity',
        'cycle.detail.align.group4Text': 'The client keeps working on the same records without manually rebuilding the whole state.',
        'cycle.detail.align.value': 'The cycle does not end with payload delivery: AMB Grid also returns to a coherent state after saving.',
        'examples.kicker': 'Technical mini-demos',
        'examples.title': 'Feature examples',
        'examples.description': 'The existing demos remain available as focused examples for individual AMB Grid capabilities.',
        'examples.open': 'Open example',
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
        'guide.videoOpen': 'Open the placeholder demo video on YouTube',
        'footer.cta.kicker': 'Next step',
        'footer.cta.title': 'Bring AMB Grid into your project',
        'footer.cta.description': 'Explore the JavaScript guide, try the feature examples, or follow the project on GitHub.',
        'footer.cta.guide': 'JavaScript guide',
        'footer.cta.examples': 'View examples',
        'footer.cta.github': 'GitHub',
        'footer.resources': 'Resources',
        'footer.projectLinks': 'Project',
        'footer.tagline': 'Framework-agnostic CRUD grid library for business applications.',
        'footer.project': 'Open-source project',
        'footer.demo': 'Main demo',
        'footer.examples': 'Feature examples',
        'footer.guide': 'JavaScript guide',
        'footer.github': 'GitHub',
        'footer.issues': 'Issues / Feedback',
        'footer.license': 'Apache 2.0',
        'footer.maintainer': 'Created and maintained by Luigi Ambruoso'
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

const cycleDetailBodies = {
    edit: `
        <div class="demo-cycle-detail__groups">
            <div>
                <h4 data-i18n="cycle.detail.edit.group1Title">Editor dedicati</h4>
                <p data-i18n="cycle.detail.edit.group1Text">Testo, numeri, date, checkbox e lookup usano editor coerenti con il tipo di dato, mantenendo l’utente sempre nel contesto della griglia.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.edit.group2Title">Stato automatico della riga</h4>
                <p data-i18n="cycle.detail.edit.group2Text">Quando un valore cambia realmente, AMB Grid aggiorna automaticamente lo stato della riga e mantiene traccia della modifica.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.edit.group3Title">Rollback</h4>
                <p data-i18n="cycle.detail.edit.group3Text">Le modifiche possono essere annullate ripristinando i valori precedenti e riallineando automaticamente lo stato della riga.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.edit.group4Title">Editing nel contesto</h4>
                <p data-i18n="cycle.detail.edit.group4Text">Il record viene modificato nel punto in cui viene consultato, senza aprire continuamente form separati per ogni operazione.</p>
            </div>
        </div>
        <p class="demo-cycle-detail__value" data-i18n="cycle.detail.edit.value">Meno passaggi e meno perdita di contesto: l’utente lavora direttamente sui dati mentre AMB Grid mantiene coerente il ciclo CRUD.</p>`,
    keyboard: `
        <div class="demo-cycle-detail__groups demo-cycle-detail__groups--keyboard">
            <div>
                <div class="demo-cycle-detail__keycaps"><kbd data-i18n="cycle.detail.keyboard.tab">Tab</kbd><kbd data-i18n="cycle.detail.keyboard.shiftTab">Shift+Tab</kbd></div>
                <h4 data-i18n="cycle.detail.keyboard.group1Title">Navigazione orizzontale</h4>
                <p data-i18n="cycle.detail.keyboard.group1Text">Spostano il focus tra le celle gestibili mantenendo continuo il flusso di editing.</p>
            </div>
            <div>
                <div class="demo-cycle-detail__keycaps"><kbd data-i18n="cycle.detail.keyboard.vertical">Alt+↑ / Alt+↓</kbd></div>
                <h4 data-i18n="cycle.detail.keyboard.group2Title">Navigazione verticale</h4>
                <p data-i18n="cycle.detail.keyboard.group2Text">Consentono di cambiare riga mantenendo la stessa colonna quando il flusso lo richiede.</p>
            </div>
            <div>
                <div class="demo-cycle-detail__keycaps"><kbd data-i18n="cycle.detail.keyboard.space">Space</kbd><kbd data-i18n="cycle.detail.keyboard.enter">Enter</kbd><kbd>0</kbd><kbd>1</kbd></div>
                <h4 data-i18n="cycle.detail.keyboard.group3Title">Checkbox</h4>
                <p data-i18n="cycle.detail.keyboard.group3Text">Le checkbox possono essere gestite da tastiera: toggle con Space/Invio e impostazione esplicita con 0/1.</p>
            </div>
            <div class="demo-cycle-detail__group-with-icon">
                ${demoIcon('lookup', { className: 'demo-cycle-detail__icon', size: 18 })}
                <div><h4 data-i18n="cycle.detail.keyboard.group4Title">Lookup ed editor complessi</h4><p data-i18n="cycle.detail.keyboard.group4Text">Lookup, autocomplete, datepicker e dialog mantengono un percorso di focus coerente per tornare alla griglia senza interrompere il lavoro.</p></div>
            </div>
        </div>
        <p class="demo-cycle-detail__value" data-i18n="cycle.detail.keyboard.value">Un flusso particolarmente adatto a backoffice e gestionali con inserimento intensivo di dati.</p>`,
    validate: `
        <div class="demo-cycle-detail__groups">
            <div>
                <h4 data-i18n="cycle.detail.validate.group1Title">Regole sul dato</h4>
                <p data-i18n="cycle.detail.validate.group1Text">Required, formati, range, valori ammessi e regole applicative verificano la qualità del dato.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.validate.group2Title">Parser</h4>
                <p data-i18n="cycle.detail.validate.group2Text">Normalizzano il valore nella forma prevista dal backend senza sostituire la validazione.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.validate.group3Title">Errori contestuali</h4>
                <p data-i18n="cycle.detail.validate.group3Text">Gli errori restano associati alla cella e alla riga interessata.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.validate.group4Title">Salvataggio consapevole</h4>
                <p data-i18n="cycle.detail.validate.group4Text">Lo stato di validità determina quali modifiche sono pronte per il backend.</p>
            </div>
        </div>
        <p class="demo-cycle-detail__value" data-i18n="cycle.detail.validate.value">La UI distingue chiaramente un dato modificato da un dato effettivamente valido.</p>`,
    payload: `
        <div class="demo-cycle-detail__payload-flow">
            <div class="demo-cycle-detail__payload-states"><span data-i18n="cycle.detail.payload.new">new</span><span data-i18n="cycle.detail.payload.modified">modified</span><span data-i18n="cycle.detail.payload.deleted">deleted</span></div>
            <div class="demo-cycle-detail__payload-arrow" aria-hidden="true">↓</div>
            <strong data-i18n="cycle.detail.payload.flowTitle">getSavePayload()</strong>
            <div class="demo-cycle-detail__payload-arrow" aria-hidden="true">↓</div>
            <span data-i18n="cycle.detail.payload.flowResult">payload pronto per il backend</span>
        </div>
        <div class="demo-cycle-detail__groups">
            <div><h4 data-i18n="cycle.detail.payload.group1Title">Inserite</h4><p data-i18n="cycle.detail.payload.group1Text">Le nuove righe vengono raccolte separatamente.</p></div>
            <div><h4 data-i18n="cycle.detail.payload.group2Title">Aggiornate</h4><p data-i18n="cycle.detail.payload.group2Text">I record realmente modificati vengono distinti dai dati rimasti invariati.</p></div>
            <div><h4 data-i18n="cycle.detail.payload.group3Title">Eliminate</h4><p data-i18n="cycle.detail.payload.group3Text">Le cancellazioni fanno parte dello stesso ciclo senza gestione esterna parallela.</p></div>
            <div><h4 data-i18n="cycle.detail.payload.group4Title">Validità</h4><p data-i18n="cycle.detail.payload.group4Text">Le modifiche non valide restano distinte da quelle pronte per il salvataggio.</p></div>
        </div>
        <p class="demo-cycle-detail__value" data-i18n="cycle.detail.payload.value">L’applicazione riceve una struttura già organizzata per comunicare con il backend.</p>`,
    align: `
        <div class="demo-cycle-detail__groups">
            <div>
                <h4 data-i18n="cycle.detail.align.group1Title">ID backend</h4>
                <p data-i18n="cycle.detail.align.group1Text">Una nuova riga può ricevere l’identificatore definitivo assegnato dal backend.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.align.group2Title">Conferma dello stato</h4>
                <p data-i18n="cycle.detail.align.group2Text">Le modifiche salvate possono diventare la nuova baseline della tabella.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.align.group3Title">Rollback aggiornato</h4>
                <p data-i18n="cycle.detail.align.group3Text">I successivi rollback fanno riferimento ai dati ormai confermati.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.align.group4Title">Continuità applicativa</h4>
                <p data-i18n="cycle.detail.align.group4Text">Il client continua a lavorare sugli stessi record senza ricostruire manualmente l’intero stato.</p>
            </div>
        </div>
        <p class="demo-cycle-detail__value" data-i18n="cycle.detail.align.value">Il ciclo non termina con l’invio del payload: AMB Grid gestisce anche il ritorno a uno stato coerente dopo il salvataggio.</p>`
};

const cycleDetailCopy = {
    edit: ['cycle.detail.edit.title', 'cycle.detail.edit.intro'],
    keyboard: ['cycle.detail.keyboard.title', 'cycle.detail.keyboard.intro'],
    validate: ['cycle.detail.validate.title', 'cycle.detail.validate.intro'],
    payload: ['cycle.detail.payload.title', 'cycle.detail.payload.intro'],
    align: ['cycle.detail.align.title', 'cycle.detail.align.intro']
};

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

let activeCycleDetail = null;

const renderCycleDetailContent = id => {
    const [titleKey, introKey] = cycleDetailCopy[id];

    return `
        <h3 id="cycle-detail-title" data-i18n="${titleKey}">${getText(titleKey)}</h3>
        <p class="demo-cycle-detail__intro" data-i18n="${introKey}">${getText(introKey)}</p>
        ${cycleDetailBodies[id]}`;
};

const setCycleDetailState = id => {
    root.querySelectorAll('[data-cycle-detail]').forEach(card => {
        const isActive = card.dataset.cycleDetail === id;

        card.classList.toggle('is-active', isActive);
        card.setAttribute('aria-selected', String(isActive));
        card.setAttribute('aria-expanded', String(isActive));
    });
};

const openCycleDetail = id => {
    const panel = root.querySelector('#cycle-detail');
    const content = panel?.querySelector('.demo-cycle-detail__content');

    if (!panel || !content) return;

    const wasOpen = !panel.hidden;
    const isSameDetail = activeCycleDetail === id;

    activeCycleDetail = id;
    setCycleDetailState(id);
    panel.dataset.cycleAccent = id;

    if (!isSameDetail) {
        content.innerHTML = renderCycleDetailContent(id);
        applyI18n();
    }

    panel.hidden = false;

    if (wasOpen && !isSameDetail) {
        animateCycleDetail(content, 'content');
    } else if (!wasOpen) {
        animateCycleDetail(panel, 'open');
    }

    panel.dataset.opened = 'true';
};

const bindCycleDetails = () => {
    root.querySelectorAll('[data-cycle-detail]').forEach(card => {
        card.addEventListener('click', () => openCycleDetail(card.dataset.cycleDetail));
        card.addEventListener('keydown', event => {
            if (!['Enter', ' '].includes(event.key)) return;

            event.preventDefault();
            openCycleDetail(card.dataset.cycleDetail);
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
                    <article class="demo-flow-card is-active" role="button" tabindex="0" aria-selected="true" aria-expanded="true" aria-controls="cycle-detail" data-cycle-detail="edit">
                        <span class="demo-flow-card__header">
                            <span class="demo-flow-card__step" aria-hidden="true">01</span>
                            ${demoIcon('edit', { className: 'demo-card-icon demo-card-icon--flow', size: 18 })}
                            <strong data-i18n="cycle.editTitle">Edit</strong>
                        </span>
                        <p data-i18n="cycle.editText">Modifica diretta delle celle con editor dedicati, stato della riga e rollback integrati nel ciclo CRUD.</p>
                        <span class="demo-flow-card__connector" aria-hidden="true">${demoIcon('arrowRight', { className: 'demo-flow-card__connector-icon', size: 18 })}</span>
                    </article>
                    <article class="demo-flow-card" role="button" tabindex="0" aria-selected="false" aria-expanded="false" aria-controls="cycle-detail" data-cycle-detail="keyboard">
                        <span class="demo-flow-card__header">
                            <span class="demo-flow-card__step" aria-hidden="true">02</span>
                            ${demoIcon('keyboard', { className: 'demo-card-icon demo-card-icon--flow', size: 18 })}
                            <strong data-i18n="cycle.keyboardTitle">Editing orientato alla tastiera</strong>
                        </span>
                        <p data-i18n="cycle.keyboardText">Navigazione Tab/Shift+Tab, editing senza mouse, checkbox da tastiera e lookup rapidi anche tramite codice.</p>
                        <span class="demo-flow-card__connector" aria-hidden="true">${demoIcon('arrowRight', { className: 'demo-flow-card__connector-icon', size: 18 })}</span>
                    </article>
                    <article class="demo-flow-card" role="button" tabindex="0" aria-selected="false" aria-expanded="false" aria-controls="cycle-detail" data-cycle-detail="validate">
                        <span class="demo-flow-card__header">
                            <span class="demo-flow-card__step" aria-hidden="true">03</span>
                            ${demoIcon('validation', { className: 'demo-card-icon demo-card-icon--flow', size: 18 })}
                            <strong data-i18n="cycle.validateTitle">Validate</strong>
                        </span>
                        <p data-i18n="cycle.validateText">Validatori e parser separano qualità del dato e trasformazione del payload.</p>
                        <span class="demo-flow-card__connector" aria-hidden="true">${demoIcon('arrowRight', { className: 'demo-flow-card__connector-icon', size: 18 })}</span>
                    </article>
                    <article class="demo-flow-card" role="button" tabindex="0" aria-selected="false" aria-expanded="false" aria-controls="cycle-detail" data-cycle-detail="payload">
                        <span class="demo-flow-card__header">
                            <span class="demo-flow-card__step" aria-hidden="true">04</span>
                            ${demoIcon('payload', { className: 'demo-card-icon demo-card-icon--flow', size: 18 })}
                            <strong data-i18n="cycle.payloadTitle">Payload</strong>
                        </span>
                        <p data-i18n="cycle.payloadText">Le modifiche diventano un payload leggibile e pronto per il backend.</p>
                        <span class="demo-flow-card__connector" aria-hidden="true">${demoIcon('arrowRight', { className: 'demo-flow-card__connector-icon', size: 18 })}</span>
                    </article>
                    <article class="demo-flow-card" role="button" tabindex="0" aria-selected="false" aria-expanded="false" aria-controls="cycle-detail" data-cycle-detail="align">
                        <span class="demo-flow-card__header">
                            <span class="demo-flow-card__step" aria-hidden="true">05</span>
                            ${demoIcon('backend', { className: 'demo-card-icon demo-card-icon--flow', size: 18 })}
                            <strong data-i18n="cycle.alignTitle">Align</strong>
                        </span>
                        <p data-i18n="cycle.alignText">Dopo il salvataggio, dati applicativi e stato locale possono riallinearsi.</p>
                        <span class="demo-flow-card__connector" aria-hidden="true">${demoIcon('arrowRight', { className: 'demo-flow-card__connector-icon', size: 18 })}</span>
                    </article>
                </div>
                <section id="cycle-detail" class="demo-cycle-detail" data-cycle-accent="edit" hidden aria-live="polite" aria-labelledby="cycle-detail-title">
                    <div class="demo-cycle-detail__content"></div>
                </section>
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

            ${renderDemoFooter()}

        </main>
    `;

    root.querySelectorAll('[data-example]').forEach(button => {
        button.addEventListener('click', () => loadFeatureExample(button.dataset.example));
    });
    bindCycleDetails();
    openCycleDetail('edit');
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
