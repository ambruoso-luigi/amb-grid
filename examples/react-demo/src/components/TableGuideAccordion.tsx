import { useState } from 'react';
import { BadgeDollarSign, Boxes, Braces, CalendarDays, ChevronDown, CircleDot, CircleHelp, ClipboardCheck, Hash, NotepadText, Package, PencilLine, ShieldCheck, Undo2, Warehouse } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

type Language = 'it' | 'en';

const copy = {
  it: {
    title: 'Come funziona questa demo',
    summary: 'Modifica prodotti, controlla la validazione, usa le azioni riga e prepara il payload.',
    overviewTitle: 'Panoramica',
    intro: 'Questa demo simula un pannello operativo di magazzino. Puoi modificare dati, aggiungere righe, verificare lo stato delle modifiche, applicare validazioni e preparare il salvataggio senza uscire dal contesto della tabella.',
    operations: [
      ['Modifica dati', 'Modifica direttamente le celle della tabella. Le modifiche aggiornano automaticamente lo stato della riga.'],
      ['Azioni riga', 'Le azioni disponibili cambiano in base allo stato. Puoi ripristinare modifiche, rimuovere nuove righe o eliminare dati.'],
      ['Validazione', 'I controlli verificano campi e formati. Gli errori restano associati alla cella e alla riga interessata.'],
      ['Payload', 'Le modifiche vengono raccolte in una struttura pronta per il backend. La demo mostra il ciclo CRUD → validazione → payload.'],
    ],
    columnsTitle: 'Colonne principali',
    columnsSummary: 'Editor e regole differenti mostrano i principali tipi di campo gestiti dalla demo.',
    columns: [
      ['Item code', 'UNIQUE', 'Codice obbligatorio e univoco del prodotto.'],
      ['Product name', 'REQUIRED', 'Nome obbligatorio del prodotto, modificabile direttamente nella cella.'],
      ['Warehouse', 'AUTOCOMPLETE', 'Magazzino selezionabile tramite suggerimenti controllati.'],
      ['Stock quantity', 'INTEGER', 'Quantità disponibile, gestita come valore intero.'],
      ['Unit price', 'DECIMAL', 'Prezzo unitario con gestione dei valori decimali.'],
      ['Status', 'LOOKUP', 'Stato selezionato da un insieme di valori gestiti tramite lookup.'],
      ['Requires inspection', 'BOOLEAN', 'Checkbox che indica se il prodotto richiede un’ispezione.'],
      ['Last check date', 'DATE', 'Data dell’ultimo controllo del prodotto.'],
      ['Notes', 'LONG TEXT', 'Campo testuale esteso per annotazioni sul prodotto.'],
    ],
  },
  en: {
    title: 'How this demo works',
    summary: 'Edit products, review validation, use row actions and prepare the payload.',
    overviewTitle: 'Overview',
    intro: 'This demo simulates an inventory operations panel. You can edit data, add rows, review change state, apply validation and prepare a save without leaving the table context.',
    operations: [
      ['Edit data', 'Edit cells directly in the table. Changes automatically update the row state.'],
      ['Row actions', 'Available row actions depend on the row state: delete, remove a newly added row, or roll back changes.'],
      ['Validation', 'Field rules validate edited values and keep errors associated with the affected cell and row.'],
      ['Payload', 'Changes are collected in a structure ready for the backend. The demo shows the CRUD → validation → payload cycle.'],
    ],
    columnsTitle: 'Key columns',
    columnsSummary: 'Different editors and rules show the main field types supported by the demo.',
    columns: [
      ['Item code', 'UNIQUE', 'Required unique product code.'],
      ['Product name', 'REQUIRED', 'Required product name, editable directly in the cell.'],
      ['Warehouse', 'AUTOCOMPLETE', 'Warehouse selectable through controlled suggestions.'],
      ['Stock quantity', 'INTEGER', 'Available quantity handled as an integer value.'],
      ['Unit price', 'DECIMAL', 'Unit price with decimal value handling.'],
      ['Status', 'LOOKUP', 'Status selected from a lookup-managed set of values.'],
      ['Requires inspection', 'BOOLEAN', 'Checkbox indicating whether the product requires inspection.'],
      ['Last check date', 'DATE', "Date of the product's latest inspection."],
      ['Notes', 'LONG TEXT', 'Extended text field for product notes.'],
    ],
  },
} as const;

export function TableGuideAccordion() {
  const [open, setOpen] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const language: Language = 'it';
  const text = copy[language];
  const operationIcons = [PencilLine, Undo2, ShieldCheck, Braces];
  const columnIcons = [Hash, Package, Warehouse, Boxes, BadgeDollarSign, CircleDot, ClipboardCheck, CalendarDays, NotepadText];

  return (
    <section className="react-table-guide">
      <button aria-controls="react-table-guide-content" aria-expanded={open} className="react-table-guide__trigger" onClick={() => setOpen((current) => !current)} type="button">
        <span className="react-table-guide__trigger-copy"><span className="react-table-guide__help-icon"><CircleHelp aria-hidden="true" size={18} /></span><span><strong>{text.title}</strong><small>{text.summary}</small></span></span>
        <ChevronDown aria-hidden="true" className="react-table-guide__chevron" data-open={open} size={20} />
      </button>
      <motion.div animate={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }} aria-hidden={!open} className="react-table-guide__content" id="react-table-guide-content" initial={false} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}>
        <div className="react-table-guide__content-inner">
          <section className="react-table-guide__overview"><h3>{text.overviewTitle}</h3><p className="react-table-guide__intro">{text.intro}</p></section>
          <div className="react-table-guide__operations">
            {text.operations.map(([title, description], index) => { const Icon = operationIcons[index]; return <article key={title}><span><Icon aria-hidden="true" size={18} /></span><h3>{title}</h3><p>{description}</p></article>; })}
          </div>
          <section className="react-table-guide__columns" aria-labelledby="react-table-guide-columns-title">
            <h3 id="react-table-guide-columns-title">{text.columnsTitle}</h3><p>{text.columnsSummary}</p>
            <div className="react-table-guide__column-list">
              {text.columns.map(([name, badge, description], index) => { const Icon = columnIcons[index]; return <article key={name}><i><Icon aria-hidden="true" size={16} /></i><div><h4>{name}</h4><span>{badge}</span></div><p>{description}</p></article>; })}
            </div>
          </section>
        </div>
      </motion.div>
    </section>
  );
}
