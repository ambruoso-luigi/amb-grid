import { useState } from 'react';
import { Braces, Building2, Calculator, CalendarDays, CheckSquare2, ChevronDown, CircleHelp, Database, Gauge, ListChecks, ListFilter, MousePointer2, NotepadText, PanelsTopLeft, Save, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

const operations = [
  ['Editing', 'Modifica direttamente i prodotti nella griglia. Gli stati si aggiornano automaticamente.', MousePointer2],
  ['Validazione', 'Gli errori influenzano stato, KPI e possibilità di salvataggio.', ShieldCheck],
  ['Save', 'Le modifiche valide si salvano lasciando pending quelle da correggere.', Save],
  ['Payload', 'Payload e stato delle modifiche alimentano i pannelli React.', Braces],
] as const;

const integration = [
  ['Controlli esterni', 'La toolbar React richiama direttamente le API pubbliche AMB Grid.', SlidersHorizontal],
  ['KPI sincronizzati', 'Modifiche, errori e righe pending aggiornano la UI React.', Gauge],
  ['Totali dinamici', 'La riga di riepilogo calcola stock, valore inventario e prodotti da ispezionare sui dati correnti della griglia. Gli stessi aggregati alimentano i KPI superiori.', Calculator],
  ['UI indipendente', 'shadcn/ui e Motion personalizzano l’esperienza senza cambiare il core.', PanelsTopLeft],
  ['Backend demo', 'MSW intercetta richieste HTTP reali e simula il backend.', Database],
] as const;

type Language = 'it' | 'en';

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
  const [open, setOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const cards = (items: typeof operations | typeof integration) => items.map(([title, description, Icon]) => (
    <article key={title}><span><Icon aria-hidden="true" size={18} /></span><h4>{title}</h4><p>{description}</p></article>
  ));

  return (
    <section className="react-table-guide">
      <button aria-controls="react-table-guide-content" aria-expanded={open} className="react-table-guide__trigger" onClick={() => setOpen((current) => !current)} type="button">
        <span className="react-table-guide__trigger-copy"><span className="react-table-guide__help-icon"><CircleHelp aria-hidden="true" size={18} /></span><span><strong>Come funziona questa demo</strong><small>Editing, validazione, save e UI React sincronizzata con AMB Grid.</small></span></span>
        <ChevronDown aria-hidden="true" className="react-table-guide__chevron" data-open={open} size={20} />
      </button>
      <motion.div animate={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }} aria-hidden={!open} className="react-table-guide__content" id="react-table-guide-content" initial={false} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}>
        <div className="react-table-guide__content-inner">
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
