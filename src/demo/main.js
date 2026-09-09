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
import { demoIcon, demoYoutubeIcon, frameworkIcon } from './demo-icons.js';
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
        'hero.videoLabel': 'Demo AMB Grid',
        'hero.videoOpen': 'Apri Demo AMB Grid su YouTube',
        'video.youtube': 'YouTube',
        'frameworks.title': 'Integrabile dove lavori già',
        'frameworks.description': 'Usa AMB Grid in pagine JavaScript classiche, sistemi legacy-friendly o stack moderni come React, Vue e Angular.',
        'frameworks.javascript.badge': 'Classic integration',
        'frameworks.javascript.description': 'Snippet base con AMB.table(...).',
        'frameworks.javascript.status': 'Apri guida JavaScript',
        'frameworks.react.badge': 'Lifecycle integration',
        'frameworks.react.description': 'Esempio concettuale con mount e grid.destroy() nel cleanup.',
        'frameworks.react.status': 'Apri demo React',
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
        'cycle.keyboardText': 'Navigazione, editing e controlli gestibili interamente da tastiera, anche tra righe, pagine ed editor complessi.',
        'cycle.validateTitle': 'Validate',
        'cycle.validateText': 'Validazione, errori contestuali e parser mantengono separate qualità del dato e forma del payload.',
        'cycle.payloadTitle': 'Payload',
        'cycle.payloadText': 'Nuove, modificate ed eliminate restano distinte fino a un payload già pronto per il backend.',
        'cycle.alignTitle': 'Align',
        'cycle.alignText': 'Dopo il salvataggio, solo i dati confermati dal backend vengono riallineati; le modifiche ancora pendenti restano intatte.',
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
        'cycle.detail.keyboard.intro': 'L’intero flusso di navigazione ed editing della griglia può essere gestito da tastiera: celle, righe, pagine, selezione, azioni ed editor complessi mantengono un percorso di focus coerente.',
        'cycle.detail.keyboard.tab': 'Tab',
        'cycle.detail.keyboard.shiftTab': 'Shift+Tab',
        'cycle.detail.keyboard.pageUp': 'Alt+PageUp',
        'cycle.detail.keyboard.pageDown': 'Alt+PageDown',
        'cycle.detail.keyboard.space': 'Space',
        'cycle.detail.keyboard.enter': 'Enter',
        'cycle.detail.keyboard.vertical': 'Alt+↑ / Alt+↓',
        'cycle.detail.keyboard.group1Title': 'Navigazione continua',
        'cycle.detail.keyboard.group1Text': 'Tab e Shift+Tab attraversano le celle editabili e continuano automaticamente tra le pagine. Alt+PageUp e Alt+PageDown permettono di cambiare pagina direttamente da tastiera.',
        'cycle.detail.keyboard.group2Title': 'Navigazione verticale',
        'cycle.detail.keyboard.group2Text': 'Alt+↑ e Alt+↓ cambiano riga mantenendo la stessa colonna e continuano anche oltre il bordo della pagina.',
        'cycle.detail.keyboard.group3Title': 'Controlli e azioni',
        'cycle.detail.keyboard.group3Text': 'Checkbox, selezione di riga e azioni CRUD possono essere gestite senza mouse. Space ed Enter attivano i controlli, mentre 0 e 1 consentono impostazioni esplicite dove previste.',
        'cycle.detail.keyboard.group4Title': 'Editor e dialog',
        'cycle.detail.keyboard.group4Text': 'Lookup, calendari e testi estesi mantengono il flusso da tastiera: Enter apre o conferma, le frecce navigano dove previsto, Escape annulla e il focus ritorna coerentemente alla griglia.',
        'cycle.detail.keyboard.value': 'Pensato per backoffice e inserimento intensivo: l’intero flusso di editing può restare sulla tastiera.',
        'cycle.detail.validate.title': 'Qualità del dato e forma del payload restano separate',
        'cycle.detail.validate.intro': 'AMB Grid verifica se un dato è accettabile senza confondere questa decisione con la sua trasformazione per il backend: validatori e parser restano due passaggi distinti dello stesso flusso.',
        'cycle.detail.validate.group1Title': 'Regole sul dato',
        'cycle.detail.validate.group1Text': 'Required, formati, range, valori ammessi, unicità e regole personalizzate verificano la qualità del dato e possono essere combinate quando il controllo richiede più condizioni.',
        'cycle.detail.validate.group2Title': 'Parser separati',
        'cycle.detail.validate.group2Text': 'I parser normalizzano il valore nella forma prevista dal payload, ma non decidono se il dato è valido e non sostituiscono le regole applicative.',
        'cycle.detail.validate.group3Title': 'Errori nel contesto',
        'cycle.detail.validate.group3Text': 'Gli errori restano associati alla cella e alla riga interessata, così l’utente individua dove intervenire, corregge il valore e può validarlo nuovamente.',
        'cycle.detail.validate.group4Title': 'Validazione mirata',
        'cycle.detail.validate.group4.prefix': 'controlla le righe nuove o modificate, mentre',
        'cycle.detail.validate.group4.middle': 'può verificare l’intera griglia e restituisce all’applicazione un risultato strutturato.',
        'cycle.detail.validate.value': 'AMB Grid distingue ciò che è cambiato, ciò che è valido e ciò che viene trasformato per il backend.',
        'cycle.detail.payload.title': 'Dal ciclo CRUD a un payload pronto per il backend',
        'cycle.detail.payload.intro': 'AMB Grid raccoglie le modifiche della griglia mantenendo separate righe inserite, aggiornate ed eliminate, così l’applicazione riceve un payload già organizzato per il salvataggio.',
        'cycle.detail.payload.group1Title': 'Inserite',
        'cycle.detail.payload.group1Text': 'Le nuove righe vengono raccolte separatamente, così il backend può riconoscere con chiarezza i record da creare.',
        'cycle.detail.payload.group2Title': 'Aggiornate',
        'cycle.detail.payload.group2Text': 'Solo i record realmente modificati vengono inclusi come aggiornamenti, distinguendoli dai dati rimasti invariati.',
        'cycle.detail.payload.group3Title': 'Eliminate',
        'cycle.detail.payload.group3Text': 'Le cancellazioni fanno parte dello stesso flusso CRUD e vengono riportate nel payload senza richiedere una gestione parallela esterna.',
        'cycle.detail.payload.group4Title': 'Payload applicativo',
        'cycle.detail.payload.group4.prefix': 'restituisce una struttura già pronta per il backend, mantenendo la distinzione tra operazioni e lasciando separate le modifiche non ancora salvabili.',
        'cycle.detail.payload.value': 'L’applicazione non deve ricostruire manualmente le differenze: AMB Grid consegna un payload coerente con il ciclo CRUD.',
        'cycle.detail.align.title': 'Dalla risposta backend a un nuovo stato coerente',
        'cycle.detail.align.intro': 'Dopo una risposta positiva del backend, AMB Grid riallinea le modifiche effettivamente salvate: integra gli identificativi assegnati, aggiorna la baseline e lascia invece pendenti le righe che non sono state confermate.',
        'cycle.detail.align.group1Title': 'ID backend',
        'cycle.detail.align.group1Text': 'Le nuove righe salvate possono ricevere l’identificativo definitivo assegnato dal backend, sostituendo il riferimento temporaneo usato durante l’editing locale.',
        'cycle.detail.align.group2Title': 'Salvataggio parziale opzionale',
        'cycle.detail.align.group2Text': 'L’applicazione può scegliere un salvataggio completo oppure salvare solo le modifiche valide. In questo secondo caso AMB Grid consente di riallineare quelle confermate lasciando pendenti le righe ancora da correggere.',
        'cycle.detail.align.group3Title': 'Baseline aggiornata',
        'cycle.detail.align.group3Text': 'I valori confermati diventano il nuovo riferimento della riga, così eventuali modifiche successive e rollback partono dai dati realmente accettati dal backend.',
        'cycle.detail.align.group4Title': 'Modifiche pendenti',
        'cycle.detail.align.group4Text': 'Le righe escluse dal salvataggio non vengono perse né riallineate per errore: mantengono dati, stato ed eventuali errori e possono essere corrette e salvate successivamente.',
        'cycle.detail.align.value': 'Il ciclo CRUD si chiude solo sui dati realmente confermati: ciò che è stato salvato viene riallineato, ciò che resta da correggere rimane disponibile senza perdere il lavoro dell’utente.',
        'examples.kicker': 'Mini-demo tecniche',
        'examples.title': 'Esempi funzionali',
        'examples.description': 'Le demo esistenti restano accessibili come esempi focalizzati su singole capacità di AMB Grid.',
        'examples.open': 'Apri esempio',
        'guide.home': 'Home',
        'guide.badge': 'JavaScript',
        'guide.title': 'AMB Grid con JavaScript',
        'guide.description': 'Demo tabellare e guida essenziale per usare AMB Grid con JavaScript moderno o direttamente nel browser, senza framework obbligatori.',
        'guide.identity.title': 'Integrazione JavaScript',
        'guide.identity.description': 'AMB Grid utilizzata direttamente in Vanilla JavaScript, senza framework applicativi obbligatori.',
        'guide.identity.stack': 'JavaScript · Tailwind CSS · daisyUI · Motion · Lucide',
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
        'guide.videoTitle': 'Demo JavaScript',
        'guide.videoOpen': 'Apri Demo JavaScript su YouTube',
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
        'hero.videoLabel': 'AMB Grid Demo',
        'hero.videoOpen': 'Open the AMB Grid Demo on YouTube',
        'video.youtube': 'YouTube',
        'frameworks.title': 'Use AMB Grid where you already work',
        'frameworks.description': 'Integrate AMB Grid in classic JavaScript pages, legacy-friendly systems or modern stacks like React, Vue and Angular.',
        'frameworks.javascript.badge': 'Classic integration',
        'frameworks.javascript.description': 'Basic snippet with AMB.table(...).',
        'frameworks.javascript.status': 'Open JavaScript guide',
        'frameworks.react.badge': 'Lifecycle integration',
        'frameworks.react.description': 'Conceptual example with mount and grid.destroy() in cleanup.',
        'frameworks.react.status': 'Open React demo',
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
        'cycle.keyboardText': 'Navigation, editing and controls can be managed entirely from the keyboard, across rows, pages and complex editors.',
        'cycle.validateTitle': 'Validate',
        'cycle.validateText': 'Validation, contextual errors and parsers keep data quality separate from payload representation.',
        'cycle.payloadTitle': 'Payload',
        'cycle.payloadText': 'New, updated and deleted rows remain distinct through to a backend-ready payload.',
        'cycle.alignTitle': 'Align',
        'cycle.alignText': 'After saving, only backend-confirmed data is aligned; changes still pending remain untouched.',
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
        'cycle.detail.keyboard.intro': 'The entire grid navigation and editing flow can be managed from the keyboard: cells, rows, pages, selection, actions and complex editors maintain a consistent focus path.',
        'cycle.detail.keyboard.tab': 'Tab',
        'cycle.detail.keyboard.shiftTab': 'Shift+Tab',
        'cycle.detail.keyboard.pageUp': 'Alt+PageUp',
        'cycle.detail.keyboard.pageDown': 'Alt+PageDown',
        'cycle.detail.keyboard.space': 'Space',
        'cycle.detail.keyboard.enter': 'Enter',
        'cycle.detail.keyboard.vertical': 'Alt+↑ / Alt+↓',
        'cycle.detail.keyboard.group1Title': 'Continuous navigation',
        'cycle.detail.keyboard.group1Text': 'Tab and Shift+Tab move through editable cells and continue automatically across pages. Alt+PageUp and Alt+PageDown switch pages directly from the keyboard.',
        'cycle.detail.keyboard.group2Title': 'Vertical navigation',
        'cycle.detail.keyboard.group2Text': 'Alt+↑ and Alt+↓ move between rows while keeping the same column and continue across page boundaries.',
        'cycle.detail.keyboard.group3Title': 'Controls and actions',
        'cycle.detail.keyboard.group3Text': 'Checkboxes, row selection and CRUD actions can be managed without a mouse. Space and Enter activate controls, while 0 and 1 provide explicit values where supported.',
        'cycle.detail.keyboard.group4Title': 'Editors and dialogs',
        'cycle.detail.keyboard.group4Text': 'Lookups, calendars and extended-text editors preserve the keyboard flow: Enter opens or confirms, arrow keys navigate where supported, Escape cancels and focus returns consistently to the grid.',
        'cycle.detail.keyboard.value': 'Designed for backoffice and intensive data entry: the entire editing flow can remain on the keyboard.',
        'cycle.detail.validate.title': 'Data quality and payload representation remain separate',
        'cycle.detail.validate.intro': 'AMB Grid determines whether data is acceptable without mixing that decision with its transformation for the backend: validators and parsers remain two distinct steps in the same flow.',
        'cycle.detail.validate.group1Title': 'Data rules',
        'cycle.detail.validate.group1Text': 'Required fields, formats, ranges, allowed values, uniqueness and custom rules verify data quality and can be combined when a check requires multiple conditions.',
        'cycle.detail.validate.group2Title': 'Separate parsers',
        'cycle.detail.validate.group2Text': 'Parsers normalize values into the representation expected by the payload, but they do not decide whether the data is valid and do not replace application rules.',
        'cycle.detail.validate.group3Title': 'Errors in context',
        'cycle.detail.validate.group3Text': 'Errors remain associated with the affected cell and row, so users can see where to intervene, correct the value and validate it again.',
        'cycle.detail.validate.group4Title': 'Targeted validation',
        'cycle.detail.validate.group4.prefix': 'checks new or modified rows, while',
        'cycle.detail.validate.group4.middle': 'can validate the entire grid and returns a structured result to the application.',
        'cycle.detail.validate.value': 'AMB Grid distinguishes what changed, what is valid and what is transformed for the backend.',
        'cycle.detail.payload.title': 'From the CRUD lifecycle to a backend-ready payload',
        'cycle.detail.payload.intro': 'AMB Grid collects grid changes while keeping inserted, updated and deleted rows separate, so the application receives a payload already organized for saving.',
        'cycle.detail.payload.group1Title': 'Inserted',
        'cycle.detail.payload.group1Text': 'New rows are collected separately, allowing the backend to clearly identify the records that need to be created.',
        'cycle.detail.payload.group2Title': 'Updated',
        'cycle.detail.payload.group2Text': 'Only records that actually changed are included as updates, keeping them separate from data that remained unchanged.',
        'cycle.detail.payload.group3Title': 'Deleted',
        'cycle.detail.payload.group3Text': 'Deletions remain part of the same CRUD flow and are represented in the payload without requiring a separate external process.',
        'cycle.detail.payload.group4Title': 'Application payload',
        'cycle.detail.payload.group4.prefix': 'returns a backend-ready structure that preserves the distinction between operations while keeping changes that are not yet savable separate.',
        'cycle.detail.payload.value': 'The application does not need to reconstruct changes manually: AMB Grid provides a payload that remains consistent with the CRUD lifecycle.',
        'cycle.detail.align.title': 'From the backend response to a consistent new state',
        'cycle.detail.align.intro': 'After a successful backend response, AMB Grid aligns the changes that were actually saved: it applies assigned identifiers, updates the baseline, and leaves unconfirmed rows pending.',
        'cycle.detail.align.group1Title': 'Backend IDs',
        'cycle.detail.align.group1Text': 'Newly saved rows can receive the definitive identifier assigned by the backend, replacing the temporary reference used during local editing.',
        'cycle.detail.align.group2Title': 'Optional partial save',
        'cycle.detail.align.group2Text': 'The application can choose an all-or-nothing save or persist only valid changes. In the latter case, AMB Grid can align the confirmed changes while rows still needing correction remain pending.',
        'cycle.detail.align.group3Title': 'Updated baseline',
        'cycle.detail.align.group3Text': 'Confirmed values become the new reference for the row, so later edits and rollbacks start from the data actually accepted by the backend.',
        'cycle.detail.align.group4Title': 'Pending changes',
        'cycle.detail.align.group4Text': 'Rows excluded from the save are neither lost nor incorrectly aligned: they keep their data, state and errors and can be corrected and saved later.',
        'cycle.detail.align.value': 'The CRUD cycle closes only for data actually confirmed by the backend: saved changes are aligned, while pending corrections remain available without losing the user’s work.',
        'examples.kicker': 'Technical mini-demos',
        'examples.title': 'Feature examples',
        'examples.description': 'The existing demos remain available as focused examples for individual AMB Grid capabilities.',
        'examples.open': 'Open example',
        'guide.home': 'Home',
        'guide.badge': 'JavaScript',
        'guide.title': 'AMB Grid with JavaScript',
        'guide.description': 'A tabular demo and essential guide for using AMB Grid with modern JavaScript or directly in the browser, with no required framework.',
        'guide.identity.title': 'JavaScript integration',
        'guide.identity.description': 'AMB Grid used directly with Vanilla JavaScript, without requiring an application framework.',
        'guide.identity.stack': 'JavaScript · Tailwind CSS · daisyUI · Motion · Lucide',
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
        'guide.videoTitle': 'JavaScript Demo',
        'guide.videoOpen': 'Open the JavaScript Demo on YouTube',
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
let currentReactDemoUnmount = null;
let currentLang = 'it';
let currentView = null;
let featureLoadToken = 0;
let mainDemoLoadToken = 0;
let reactDemoLoadToken = 0;

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
                <h4 data-i18n="cycle.detail.keyboard.group1Title">Navigazione continua</h4>
                <div class="demo-cycle-detail__keycaps"><kbd data-i18n="cycle.detail.keyboard.tab">Tab</kbd><kbd data-i18n="cycle.detail.keyboard.shiftTab">Shift+Tab</kbd><kbd data-i18n="cycle.detail.keyboard.pageUp">Alt+PageUp</kbd><kbd data-i18n="cycle.detail.keyboard.pageDown">Alt+PageDown</kbd></div>
                <p data-i18n="cycle.detail.keyboard.group1Text">Tab e Shift+Tab attraversano le celle editabili e continuano automaticamente tra le pagine. Alt+PageUp e Alt+PageDown permettono di cambiare pagina direttamente da tastiera.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.keyboard.group2Title">Navigazione verticale</h4>
                <div class="demo-cycle-detail__keycaps"><kbd>Alt+↑</kbd><kbd>Alt+↓</kbd></div>
                <p data-i18n="cycle.detail.keyboard.group2Text">Alt+↑ e Alt+↓ cambiano riga mantenendo la stessa colonna e continuano anche oltre il bordo della pagina.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.keyboard.group3Title">Controlli e azioni</h4>
                <div class="demo-cycle-detail__keycaps"><kbd data-i18n="cycle.detail.keyboard.space">Space</kbd><kbd data-i18n="cycle.detail.keyboard.enter">Enter</kbd><kbd>0</kbd><kbd>1</kbd></div>
                <p data-i18n="cycle.detail.keyboard.group3Text">Checkbox, selezione di riga e azioni CRUD possono essere gestite senza mouse. Space ed Enter attivano i controlli, mentre 0 e 1 consentono impostazioni esplicite dove previste.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.keyboard.group4Title">Editor e dialog</h4>
                <div class="demo-cycle-detail__keycaps"><kbd data-i18n="cycle.detail.keyboard.enter">Enter</kbd><kbd>↑ ↓</kbd><kbd>Esc</kbd><kbd>Ctrl+Enter</kbd></div>
                <p data-i18n="cycle.detail.keyboard.group4Text">Lookup, calendari e testi estesi mantengono il flusso da tastiera: Enter apre o conferma, le frecce navigano dove previsto, Escape annulla e il focus ritorna coerentemente alla griglia.</p>
            </div>
        </div>
        <p class="demo-cycle-detail__value" data-i18n="cycle.detail.keyboard.value">Pensato per backoffice e inserimento intensivo: l’intero flusso di editing può restare sulla tastiera.</p>`,
    validate: `
        <div class="demo-cycle-detail__groups">
            <div>
                <h4 data-i18n="cycle.detail.validate.group1Title">Regole sul dato</h4>
                <p data-i18n="cycle.detail.validate.group1Text">Required, formati, range, valori ammessi, unicità e regole personalizzate verificano la qualità del dato e possono essere combinate quando il controllo richiede più condizioni.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.validate.group2Title">Parser separati</h4>
                <p data-i18n="cycle.detail.validate.group2Text">I parser normalizzano il valore nella forma prevista dal payload, ma non decidono se il dato è valido e non sostituiscono le regole applicative.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.validate.group3Title">Errori nel contesto</h4>
                <p data-i18n="cycle.detail.validate.group3Text">Gli errori restano associati alla cella e alla riga interessata, così l’utente individua dove intervenire, corregge il valore e può validarlo nuovamente.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.validate.group4Title">Validazione mirata</h4>
                <p><code>validateChanges()</code> <span data-i18n="cycle.detail.validate.group4.prefix">controlla le righe nuove o modificate, mentre</span> <code>validate()</code> <span data-i18n="cycle.detail.validate.group4.middle">può verificare l’intera griglia e restituisce all’applicazione un risultato strutturato.</span></p>
            </div>
        </div>
        <p class="demo-cycle-detail__value" data-i18n="cycle.detail.validate.value">AMB Grid distingue ciò che è cambiato, ciò che è valido e ciò che viene trasformato per il backend.</p>`,
    payload: `
        <div class="demo-cycle-detail__groups">
            <div><h4 data-i18n="cycle.detail.payload.group1Title">Inserite</h4><p data-i18n="cycle.detail.payload.group1Text">Le nuove righe vengono raccolte separatamente, così il backend può riconoscere con chiarezza i record da creare.</p></div>
            <div><h4 data-i18n="cycle.detail.payload.group2Title">Aggiornate</h4><p data-i18n="cycle.detail.payload.group2Text">Solo i record realmente modificati vengono inclusi come aggiornamenti, distinguendoli dai dati rimasti invariati.</p></div>
            <div><h4 data-i18n="cycle.detail.payload.group3Title">Eliminate</h4><p data-i18n="cycle.detail.payload.group3Text">Le cancellazioni fanno parte dello stesso flusso CRUD e vengono riportate nel payload senza richiedere una gestione parallela esterna.</p></div>
            <div><h4 data-i18n="cycle.detail.payload.group4Title">Payload applicativo</h4><p><code>getSavePayload()</code> <span data-i18n="cycle.detail.payload.group4.prefix">restituisce una struttura già pronta per il backend, mantenendo la distinzione tra operazioni e lasciando separate le modifiche non ancora salvabili.</span></p></div>
        </div>
        <p class="demo-cycle-detail__value" data-i18n="cycle.detail.payload.value">L’applicazione non deve ricostruire manualmente le differenze: AMB Grid consegna un payload coerente con il ciclo CRUD.</p>`,
    align: `
        <div class="demo-cycle-detail__groups">
            <div>
                <h4 data-i18n="cycle.detail.align.group1Title">ID backend</h4>
                <p data-i18n="cycle.detail.align.group1Text">Le nuove righe salvate possono ricevere l’identificativo definitivo assegnato dal backend, sostituendo il riferimento temporaneo usato durante l’editing locale.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.align.group2Title">Salvataggio parziale opzionale</h4>
                <p data-i18n="cycle.detail.align.group2Text">L’applicazione può scegliere un salvataggio completo oppure salvare solo le modifiche valide. In questo secondo caso AMB Grid consente di riallineare quelle confermate lasciando pendenti le righe ancora da correggere.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.align.group3Title">Baseline aggiornata</h4>
                <p data-i18n="cycle.detail.align.group3Text">I valori confermati diventano il nuovo riferimento della riga, così eventuali modifiche successive e rollback partono dai dati realmente accettati dal backend.</p>
            </div>
            <div>
                <h4 data-i18n="cycle.detail.align.group4Title">Modifiche pendenti</h4>
                <p data-i18n="cycle.detail.align.group4Text">Le righe escluse dal salvataggio non vengono perse né riallineate per errore: mantengono dati, stato ed eventuali errori e possono essere corrette e salvate successivamente.</p>
            </div>
        </div>
        <p class="demo-cycle-detail__value" data-i18n="cycle.detail.align.value">Il ciclo CRUD si chiude solo sui dati realmente confermati: ciò che è stato salvato viene riallineato, ciò che resta da correggere rimane disponibile senza perdere il lavoro dell’utente.</p>`
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
    if (typeof currentReactDemoUnmount === 'function') {
        currentReactDemoUnmount();
    }
    currentMainDemo = null;
    currentFeatureExample = null;
    currentReactDemoUnmount = null;
    featureLoadToken += 1;
    mainDemoLoadToken += 1;
    reactDemoLoadToken += 1;
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
                        class="demo-video-preview demo-guide-video demo-hero__video"
                        href="https://youtu.be/4m0EZ4vPmT0"
                        target="_blank"
                        rel="noopener noreferrer"
                        data-i18n-title="hero.videoOpen"
                        aria-label="Apri Demo AMB Grid su YouTube"
                    >
                        <img class="demo-video-preview__image" src="https://i.ytimg.com/vi/4m0EZ4vPmT0/hqdefault.jpg" alt="" loading="eager">
                        <span class="demo-video-preview__overlay" aria-hidden="true"></span>
                        <span class="demo-video-preview__title" data-i18n="hero.videoLabel">Demo AMB Grid</span>
                        <span class="demo-video-preview__destination">
                            <span class="demo-video-preview__brand">${demoYoutubeIcon({ className: 'demo-video-preview__brand-icon', size: 20 })}</span>
                            <span data-i18n="video.youtube">YouTube</span>
                        </span>
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
                    <a class="demo-framework-card demo-framework-card--react demo-framework-card--ready card bg-base-100 border shadow-sm transition" href="#getting-started-react">
                        <span class="demo-framework-card__icon" aria-hidden="true">
                            ${frameworkIcon('react')}
                        </span>
                        <span class="demo-framework-card__body">
                            <span class="demo-framework-card__name">React</span>
                            <span class="demo-framework-card__badge demo-framework-card__badge--integration" data-i18n="frameworks.react.badge">Lifecycle integration</span>
                            <span class="demo-framework-card__description" data-i18n="frameworks.react.description">Esempio concettuale con mount e grid.destroy() nel cleanup.</span>
                            <span class="demo-framework-card__status demo-framework-card__status--ready" data-i18n="frameworks.react.status">Apri demo React</span>
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
                        <span class="demo-flow-card__connector" aria-hidden="true">${demoIcon('arrowRight', { className: 'demo-flow-card__connector-icon', size: 20 })}</span>
                    </article>
                    <article class="demo-flow-card" role="button" tabindex="0" aria-selected="false" aria-expanded="false" aria-controls="cycle-detail" data-cycle-detail="keyboard">
                        <span class="demo-flow-card__header">
                            <span class="demo-flow-card__step" aria-hidden="true">02</span>
                            ${demoIcon('keyboard', { className: 'demo-card-icon demo-card-icon--flow', size: 18 })}
                            <strong data-i18n="cycle.keyboardTitle">Editing orientato alla tastiera</strong>
                        </span>
                        <p data-i18n="cycle.keyboardText">Navigazione, editing e controlli gestibili interamente da tastiera, anche tra righe, pagine ed editor complessi.</p>
                        <span class="demo-flow-card__connector" aria-hidden="true">${demoIcon('arrowRight', { className: 'demo-flow-card__connector-icon', size: 20 })}</span>
                    </article>
                    <article class="demo-flow-card" role="button" tabindex="0" aria-selected="false" aria-expanded="false" aria-controls="cycle-detail" data-cycle-detail="validate">
                        <span class="demo-flow-card__header">
                            <span class="demo-flow-card__step" aria-hidden="true">03</span>
                            ${demoIcon('validation', { className: 'demo-card-icon demo-card-icon--flow', size: 18 })}
                            <strong data-i18n="cycle.validateTitle">Validate</strong>
                        </span>
                        <p data-i18n="cycle.validateText">Validazione, errori contestuali e parser mantengono separate qualità del dato e forma del payload.</p>
                        <span class="demo-flow-card__connector" aria-hidden="true">${demoIcon('arrowRight', { className: 'demo-flow-card__connector-icon', size: 20 })}</span>
                    </article>
                    <article class="demo-flow-card" role="button" tabindex="0" aria-selected="false" aria-expanded="false" aria-controls="cycle-detail" data-cycle-detail="payload">
                        <span class="demo-flow-card__header">
                            <span class="demo-flow-card__step" aria-hidden="true">04</span>
                            ${demoIcon('payload', { className: 'demo-card-icon demo-card-icon--flow', size: 18 })}
                            <strong data-i18n="cycle.payloadTitle">Payload</strong>
                        </span>
                        <p data-i18n="cycle.payloadText">Nuove, modificate ed eliminate restano distinte fino a un payload già pronto per il backend.</p>
                        <span class="demo-flow-card__connector" aria-hidden="true">${demoIcon('arrowRight', { className: 'demo-flow-card__connector-icon', size: 20 })}</span>
                    </article>
                    <article class="demo-flow-card" role="button" tabindex="0" aria-selected="false" aria-expanded="false" aria-controls="cycle-detail" data-cycle-detail="align">
                        <span class="demo-flow-card__header">
                            <span class="demo-flow-card__step" aria-hidden="true">05</span>
                            ${demoIcon('backend', { className: 'demo-card-icon demo-card-icon--flow', size: 18 })}
                            <strong data-i18n="cycle.alignTitle">Align</strong>
                        </span>
                        <p data-i18n="cycle.alignText">Dopo il salvataggio, solo i dati confermati dal backend vengono riallineati; le modifiche ancora pendenti restano intatte.</p>
                        <span class="demo-flow-card__connector" aria-hidden="true">${demoIcon('arrowRight', { className: 'demo-flow-card__connector-icon', size: 20 })}</span>
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

const renderReactGuide = async () => {
    if (currentView === 'react') return;

    destroyCurrentDemos();
    currentView = 'react';
    const token = reactDemoLoadToken + 1;

    reactDemoLoadToken = token;
    root.innerHTML = '<div id="react-demo-root"></div>';
    window.scrollTo(0, 0);

    const { mountReactDemo } = await import('../../examples/react-demo/src/mount.tsx');

    if (token !== reactDemoLoadToken || currentView !== 'react') return;

    const container = root.querySelector('#react-demo-root');

    if (!container) return;

    const unmount = mountReactDemo(container);

    if (token !== reactDemoLoadToken || currentView !== 'react') {
        unmount();
        return;
    }

    currentReactDemoUnmount = unmount;
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

    if (window.location.hash === '#getting-started-react') {
        renderReactGuide();
        return;
    }

    renderHome();
};

window.addEventListener('hashchange', renderRoute);
renderRoute();
