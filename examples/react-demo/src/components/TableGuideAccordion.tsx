import { useState } from 'react';
import { BookOpen, Braces, Building2, Calculator, CalendarDays, CheckSquare2, ChevronDown, Database, Gauge, ListChecks, ListFilter, MousePointer2, NotepadText, PanelsTopLeft, Save, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

const operations = [
  ['Editing', 'Modifica direttamente i prodotti nella griglia. Gli stati si aggiornano automaticamente.', MousePointer2],
  ['Validazione', 'Gli errori influenzano stato, KPI e possibilità di salvataggio.', ShieldCheck],
  ['Save', 'Le modifiche valide si salvano lasciando pending quelle da correggere.', Save],
  ['Payload', 'Payload e stato delle modifiche alimentano i pannelli React.', Braces],
] as const;

const integration = [
  ['Controlli esterni', 'La toolbar React richiama direttamente le API pubbliche AMB Grid.', SlidersHorizontal],
  ['KPI sincronizzati', 'Prodotti, modifiche, errori e indicatori di magazzino aggiornano la UI React.', Gauge],
  ['Totali dinamici', 'La riga di riepilogo calcola stock, valore inventario e prodotti da ispezionare sui dati correnti della griglia.', Calculator],
  ['UI indipendente', 'shadcn/ui e Motion personalizzano l’esperienza senza cambiare il core.', PanelsTopLeft],
  ['Backend demo', 'MSW intercetta richieste HTTP reali e simula il backend.', Database],
] as const;

type Language = 'it' | 'en';

const summaryCopy = {
  it: { title: 'Guida tecnica demo', description: 'Editing, validazione, payload e sincronizzazione React.' },
  en: { title: 'Demo technical guide', description: 'Editing, validation, payloads, and React synchronization.' },
} as const;

const fields = (language: Language) => [
  [language === 'it' ? 'Fornitore' : 'Supplier', 'LOOKUP', language === 'it'
    ? 'Ricerca un fornitore tramite codice, nome o città e aggiorna più dati della riga con mapToRow.'
    : 'Search a supplier by code, name, or city and update multiple row fields with mapToRow.', Building2],
  ['Status', 'SELECT', language === 'it'
    ? 'Un insieme ristretto di stati usa un select; badge e icone restano nel formatter.'
    : 'A small closed set of states uses a select while badges and icons stay in the formatter.', ListChecks],
  ['Stock quantity', 'INTEGER + VISUAL BAR', 'Numero editabile con indicatore visuale.', ListFilter],
  ['Inventory value', 'CALCULATED', 'Valore calcolato da quantità disponibile e prezzo unitario.', Calculator],
  ['Requires inspection', 'BOOLEAN', 'Checkbox realmente editabile.', CheckSquare2],
  ['Last check date', 'DATE', 'Data con picker e formato controllato.', CalendarDays],
  ['Notes', 'LONG TEXT', 'Editor ampio per annotazioni operative.', NotepadText],
] as const;

type TableGuideAccordionProps = { language: Language };

export function TableGuideAccordion({ language }: TableGuideAccordionProps) {
  const summary = summaryCopy[language];
  const [open, setOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const cards = (items: typeof operations | typeof integration) => items.map(([title, description, Icon]) => (
    <article key={title}><span><Icon aria-hidden="true" size={18} /></span><h4>{title}</h4><p>{description}</p></article>
  ));

  return (
    <section className="react-table-guide">
      <header className="react-demo-intro">
        <h2>{language === 'it' ? 'Inventario interattivo' : 'Interactive inventory'}</h2>
        <div className="react-demo-intro__commands">
          <button aria-controls="react-table-guide-content" aria-expanded={open} className="react-table-guide__trigger" onClick={() => setOpen((current) => !current)} type="button">
            <span className="react-table-guide__help-icon"><BookOpen aria-hidden="true" size={17} strokeWidth={2.2} /></span>
            <span className="react-table-guide__trigger-title">{summary.title}</span>
            <span className="react-table-guide__chevron-box"><ChevronDown aria-hidden="true" className="react-table-guide__chevron" data-open={open} size={18} strokeWidth={2.4} /></span>
          </button>
        </div>
        <p>Una demo moderna che mostra come integrare AMB Grid in un'applicazione React + TypeScript, mantenendo la stessa logica CRUD, validazione e payload della libreria.</p>
      </header>
      <motion.div animate={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }} aria-hidden={!open} className="react-table-guide__content" data-open={open} id="react-table-guide-content" initial={false} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}>
        <div className="react-table-guide__content-inner">
          <p className="react-table-guide__intro">{summary.description}</p>
          <section className="react-table-guide__section"><h3>Operatività</h3><div className="react-table-guide__operations">{cards(operations)}</div></section>
          <section className="react-table-guide__section"><h3>React + AMB Grid</h3><div className="react-table-guide__operations">{cards(integration)}</div></section>
          <section className="react-table-guide__columns" aria-labelledby="react-table-guide-columns-title">
            <h3 id="react-table-guide-columns-title">Campi dimostrati</h3>
            <div className="react-table-guide__column-list">
              {fields(language).map(([name, badge, description, Icon]) => <article key={name}><i><Icon aria-hidden="true" size={16} /></i><div><h4>{name}</h4><span>{badge}</span></div><p>{description}</p></article>)}
            </div>
          </section>
        </div>
      </motion.div>
    </section>
  );
}
