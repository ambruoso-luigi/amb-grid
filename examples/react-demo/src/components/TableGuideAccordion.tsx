import { useState } from 'react';
import { BookOpen, Calculator, ChevronDown, Database, Gauge, SlidersHorizontal } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

type Language = 'it' | 'en';
const copy = {
  it: {
    title: 'Guida tecnica demo', heading: 'Inventario interattivo',
    description: "Una demo moderna che mostra come integrare AMB Grid in un'applicazione React + TypeScript, mantenendo la stessa logica CRUD, validazione e payload della libreria.",
    intro: "AMB Grid gestisce la griglia, mentre React coordina l'interfaccia, lo stato applicativo e la comunicazione con il backend simulato.",
    integration: 'INTEGRAZIONE REACT', operations: 'OPERATIVITÀ DELLA GRIGLIA', fields: 'CAMPI PRINCIPALI',
    integrationCards: [
      ['Controlli esterni', 'La toolbar React richiama le API pubbliche di AMB Grid attraverso controlli applicativi personalizzati.'],
      ['KPI sincronizzati', 'Gli indicatori React si aggiornano al variare dei dati, degli errori e degli stati delle righe.'],
      ['Totali dinamici', "Le aggregazioni integrate nella parte inferiore della griglia mostrano scorte, valore dell'inventario e prodotti da ispezionare."],
      ['Backend simulato', "MSW intercetta le richieste HTTP dell'applicazione e simula le risposte del backend."],
    ],
    note: "L'interfaccia utilizza shadcn/ui e Motion per personalizzare l'esperienza applicativa senza modificare il CORE di AMB Grid.",
    operationText: "AMB Grid gestisce l'editing diretto, la validazione automatica, gli stati CRUD e la preparazione del payload. L'applicazione React utilizza queste informazioni per aggiornare l'interfaccia e inviare le modifiche al backend simulato.",
    descriptions: ['Ricerca del fornitore per codice, nome o città e aggiornamento dei campi collegati tramite mapToRow.', 'Quantità modificabile con barra grafica dinamica.', 'Valore calcolato moltiplicando la quantità disponibile per il prezzo unitario.', 'Selezione dello stato con rappresentazione grafica tramite badge e icone.', 'Editor data con calendario e formato controllato.', 'Editor esteso per la gestione delle annotazioni operative.'],
  },
  en: {
    title: 'Demo technical guide', heading: 'Interactive inventory',
    description: "A modern demo showing how to integrate AMB Grid into a React + TypeScript application while retaining the library's CRUD, validation and payload logic.",
    intro: 'AMB Grid manages the data grid, while React coordinates the interface, application state and communication with the simulated backend.',
    integration: 'REACT INTEGRATION', operations: 'GRID OPERATIONS', fields: 'KEY FIELDS',
    integrationCards: [
      ['External controls', "The React toolbar calls AMB Grid's public APIs through custom application controls."],
      ['Synchronized KPIs', 'React indicators update as data, validation errors and row states change.'],
      ['Dynamic totals', 'Aggregations integrated at the bottom of the grid display stock levels, inventory value and products requiring inspection.'],
      ['Simulated backend', "MSW intercepts the application's HTTP requests and simulates backend responses."],
    ],
    note: 'The interface uses shadcn/ui and Motion to customize the application experience without modifying the AMB Grid core.',
    operationText: 'AMB Grid handles direct editing, automatic validation, CRUD states and payload preparation. The React application uses this information to update the interface and send changes to the simulated backend.',
    descriptions: ['Search suppliers by code, name or city and update related fields through mapToRow.', 'Editable quantity with a dynamic visual bar.', 'Calculated value obtained by multiplying stock quantity by unit price.', 'Status selection with visual representation through badges and icons.', 'Date editor with calendar picker and controlled formatting.', 'Extended editor for managing operational notes.'],
  },
} as const;
const icons = [SlidersHorizontal, Gauge, Calculator, Database] as const;
const fields = [['Supplier', 'LOOKUP'], ['Stock quantity', 'INTEGER + VISUAL BAR'], ['Inventory value', 'CALCULATED'], ['Status', 'SELECT + FORMATTER'], ['Last check date', 'DATE'], ['Notes', 'LONG TEXT']] as const;

export function TableGuideAccordion({ language }: { language: Language }) {
  const text = copy[language];
  const [open, setOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  return (
    <section className="react-table-guide">
      <header className="react-demo-intro">
        <h2>{text.heading}</h2>
        <div className="react-demo-intro__commands">
          <button aria-controls="react-table-guide-content" aria-expanded={open} className="react-table-guide__trigger" onClick={() => setOpen((current) => !current)} type="button">
            <span className="react-table-guide__help-icon"><BookOpen aria-hidden="true" size={17} strokeWidth={2.2} /></span>
            <span className="react-table-guide__trigger-title">{text.title}</span>
            <span className="react-table-guide__chevron-box"><ChevronDown aria-hidden="true" className="react-table-guide__chevron" data-open={open} size={18} strokeWidth={2.4} /></span>
          </button>
        </div>
        <p>{text.description}</p>
      </header>
      <motion.div animate={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }} aria-hidden={!open} className="react-table-guide__content" data-open={open} id="react-table-guide-content" initial={false} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}>
        <div className="react-table-guide__content-inner">
          <p className="react-table-guide__intro">{text.intro}</p>
          <section className="react-table-guide__section"><h3>{text.integration}</h3><div className="react-table-guide__operations">{text.integrationCards.map(([title, description], index) => { const Icon = icons[index]; return <article key={title}><span><Icon aria-hidden="true" size={18} strokeWidth={1.75} /></span><h4>{title}</h4><p>{description}</p></article>; })}</div><p className="react-table-guide__note">{text.note}</p></section>
          <section className="react-table-guide__section"><h3>{text.operations}</h3><p>{text.operationText}</p></section>
          <section className="react-table-guide__columns" aria-labelledby="react-table-guide-columns-title"><h3 id="react-table-guide-columns-title">{text.fields}</h3><div className="react-table-guide__column-list">{fields.map(([name, badge], index) => <article key={name}><div><h4>{name}</h4><span>{badge}</span></div><p>{text.descriptions[index]}</p></article>)}</div></section>
        </div>
      </motion.div>
    </section>
  );
}
