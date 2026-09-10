import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

type Language = 'it' | 'en';

const copy = {
  it: {
    title: 'Come funziona questa tabella',
    intro: 'Gestisci il magazzino direttamente dalla griglia: modifica prodotti, aggiungi nuovi record, valida i dati, applica filtri e prepara le modifiche da inviare al backend senza uscire dal contesto della tabella.',
    operations: [
      ['Modifica e aggiunta', 'Modifica direttamente le celle oppure usa Add product per aggiungere un nuovo prodotto. Le modifiche aggiornano automaticamente lo stato della riga.'],
      ['Azioni riga', 'Le azioni disponibili cambiano in base allo stato della riga: eliminazione, rimozione di una nuova riga o rollback delle modifiche.'],
      ['Validazione', 'Le regole di campo controllano i valori modificati e mantengono gli errori associati alla cella e alla riga interessata.'],
      ['Salvataggio', 'Le modifiche valide possono essere preparate per il backend. Se alcune righe contengono errori, l’applicazione può salvare quelle valide e lasciare le altre in attesa di correzione.'],
      ['Ricerca e filtri', 'Ricerca e filtri cambiano i record visualizzati senza modificare i dati sottostanti.'],
    ],
    columnsTitle: 'Colonne della griglia',
    columns: [
      ['Item code', 'UNIQUE', 'Codice obbligatorio e univoco del prodotto.'],
      ['Product name', 'REQUIRED', 'Nome obbligatorio del prodotto, modificabile direttamente nella cella.'],
      ['Warehouse', 'AUTOCOMPLETE', 'Magazzino selezionabile tramite suggerimenti controllati.'],
      ['Stock quantity', 'INTEGER', 'Quantità disponibile, gestita come valore intero.'],
      ['Unit price', 'DECIMAL', 'Prezzo unitario con gestione dei valori decimali.'],
      ['Last check date', 'DATE', 'Data dell’ultimo controllo del prodotto.'],
      ['Status', 'LOOKUP', 'Stato selezionato da un insieme di valori gestiti tramite lookup.'],
      ['Requires inspection', 'BOOLEAN', 'Checkbox che indica se il prodotto richiede un’ispezione.'],
      ['Notes', 'LONG TEXT', 'Campo testuale esteso per annotazioni sul prodotto.'],
    ],
  },
  en: {
    title: 'How this table works',
    intro: 'Manage inventory directly from the grid: edit products, add new records, validate data, apply filters and prepare changes for the backend without leaving the table context.',
    operations: [
      ['Edit and add', 'Edit cells directly or use Add product to add a new product. Changes automatically update the row state.'],
      ['Row actions', 'Available row actions depend on the row state: delete, remove a newly added row, or roll back changes.'],
      ['Validation', 'Field rules validate edited values and keep errors associated with the affected cell and row.'],
      ['Saving', 'Valid changes can be prepared for the backend. If some rows contain errors, the application can save the valid ones and keep the others pending for correction.'],
      ['Search and filters', 'Search and filters change the displayed records without modifying the underlying data.'],
    ],
    columnsTitle: 'Grid columns',
    columns: [
      ['Item code', 'UNIQUE', 'Required unique product code.'],
      ['Product name', 'REQUIRED', 'Required product name, editable directly in the cell.'],
      ['Warehouse', 'AUTOCOMPLETE', 'Warehouse selectable through controlled suggestions.'],
      ['Stock quantity', 'INTEGER', 'Available quantity handled as an integer value.'],
      ['Unit price', 'DECIMAL', 'Unit price with decimal value handling.'],
      ['Last check date', 'DATE', "Date of the product's latest inspection."],
      ['Status', 'LOOKUP', 'Status selected from a lookup-managed set of values.'],
      ['Requires inspection', 'BOOLEAN', 'Checkbox indicating whether the product requires inspection.'],
      ['Notes', 'LONG TEXT', 'Extended text field for product notes.'],
    ],
  },
} as const;

export function TableGuideAccordion() {
  const [open, setOpen] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const language: Language = 'it';
  const text = copy[language];

  return (
    <section className="react-table-guide">
      <button aria-controls="react-table-guide-content" aria-expanded={open} className="react-table-guide__trigger" onClick={() => setOpen((current) => !current)} type="button">
        <span>{text.title}</span>
        <ChevronDown aria-hidden="true" className="react-table-guide__chevron" data-open={open} size={20} />
      </button>
      <motion.div animate={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }} aria-hidden={!open} className="react-table-guide__content" id="react-table-guide-content" initial={false} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}>
        <div className="react-table-guide__content-inner">
          <p className="react-table-guide__intro">{text.intro}</p>
          <div className="react-table-guide__operations">
            {text.operations.map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p></article>)}
          </div>
          <section className="react-table-guide__columns" aria-labelledby="react-table-guide-columns-title">
            <h3 id="react-table-guide-columns-title">{text.columnsTitle}</h3>
            <div className="react-table-guide__column-list">
              {text.columns.map(([name, badge, description]) => <article key={name}><div><h4>{name}</h4><span>{badge}</span></div><p>{description}</p></article>)}
            </div>
          </section>
        </div>
      </motion.div>
    </section>
  );
}
