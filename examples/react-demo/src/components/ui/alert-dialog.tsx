import { useRef, type ReactNode } from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { Check, ClipboardList, RefreshCw, Trash2, TriangleAlert } from 'lucide-react';
import { Button } from './button';
import { describeRows, summarizeReport, type SaveReport } from '../../inventory-save';

function SharedDialog({ open, onOpenChange, busy = false, className = '', initialFocus, children }: { open: boolean; onOpenChange: (open: boolean) => void; busy?: boolean; className?: string; initialFocus: React.RefObject<HTMLButtonElement | null>; children: ReactNode }) {
  const previousFocus = useRef<HTMLElement | null>(null);
  return <AlertDialogPrimitive.Root onOpenChange={next => { if (!busy) onOpenChange(next); }} open={open}>
    <AlertDialogPrimitive.Portal><AlertDialogPrimitive.Overlay className="react-alert__overlay" />
      <AlertDialogPrimitive.Content className={`react-alert__content ${className}`} onOpenAutoFocus={event => { previousFocus.current = document.activeElement as HTMLElement; event.preventDefault(); initialFocus.current?.focus(); }} onCloseAutoFocus={event => { if (previousFocus.current?.isConnected) { event.preventDefault(); previousFocus.current.focus(); } }} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}>
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  </AlertDialogPrimitive.Root>;
}

type PartialSaveAlertProps = {
  language: 'it' | 'en';
  invalidCount: number;
  validCount: number;
  excluded: { label: string; errors: string[] }[];
  busy: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function PartialSaveAlert({ language, invalidCount, validCount, excluded, busy, onConfirm, onOpenChange, open }: PartialSaveAlertProps) {
  const it = language === 'it';
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <SharedDialog busy={busy} className="react-alert__content--partial" initialFocus={cancelRef} onOpenChange={onOpenChange} open={open}>
          <span className="react-alert__icon"><TriangleAlert aria-hidden="true" size={20} strokeWidth={1.75} /></span>
          <AlertDialogPrimitive.Title>{it ? 'Alcune righe non sono valide' : 'Some rows are invalid'}</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description>{it ? 'Vuoi salvare soltanto le modifiche valide?' : 'Do you want to save only the valid changes?'}</AlertDialogPrimitive.Description>
          <div className="react-alert__summary">
            <div><span>{it ? (validCount === 1 ? 'Riga valida da salvare' : 'Righe valide da salvare') : (validCount === 1 ? 'Valid row to save' : 'Valid rows to save')}</span><strong>{validCount}</strong></div>
            <div><span>{it ? (invalidCount === 1 ? 'Riga esclusa dal salvataggio' : 'Righe escluse dal salvataggio') : (invalidCount === 1 ? 'Row excluded from saving' : 'Rows excluded from saving')}</span><strong>{invalidCount}</strong></div>
          </div>
          <div className="react-alert__excluded" aria-label={it ? 'Righe escluse dal salvataggio' : 'Rows excluded from saving'}>
            {excluded.map((row, index) => <div key={`${row.label}-${index}`}><strong>{row.label}</strong><ul>{row.errors.map((error, errorIndex) => <li key={errorIndex}>{error}</li>)}</ul></div>)}
          </div>
          <p className="react-alert__hint">{it ? 'Le righe con errori rimarranno disponibili per la correzione.' : 'Rows containing errors will remain available for correction.'}</p>
          <div className="react-alert__actions">
            <AlertDialogPrimitive.Cancel asChild><Button disabled={busy} ref={cancelRef} variant="outline">{it ? 'Torna alla tabella' : 'Back to grid'}</Button></AlertDialogPrimitive.Cancel>
            <Button disabled={busy || validCount === 0} onClick={onConfirm}><Check aria-hidden="true" size={16} strokeWidth={1.75} />{it ? 'Salva righe valide' : 'Save valid rows'}</Button>
          </div>
    </SharedDialog>
  );
}

export function ActionConfirmation({ kind, itemCode, language, open, onClose, onConfirm }: { kind: 'delete' | 'reload'; itemCode?: string; language: 'it' | 'en'; open: boolean; onClose: () => void; onConfirm: () => void }) {
  const it = language === 'it', deleting = kind === 'delete';
  const cancelRef = useRef<HTMLButtonElement>(null);
  const Icon = deleting ? Trash2 : RefreshCw;
  return <SharedDialog className={deleting ? 'react-alert--delete' : 'react-alert--reload'} initialFocus={cancelRef} open={open} onOpenChange={next => { if (!next) onClose(); }}>
    <span className="react-alert__icon"><Icon aria-hidden="true" size={20} strokeWidth={1.75} /></span>
    <AlertDialogPrimitive.Title>{deleting ? (it ? `Eliminare ${itemCode}?` : `Delete ${itemCode}?`) : (it ? 'Ricaricare i dati?' : 'Reload data?')}</AlertDialogPrimitive.Title>
    <AlertDialogPrimitive.Description>{deleting ? (it ? "Il prodotto verrà contrassegnato per l'eliminazione, che sarà applicata al salvataggio." : 'The product will be marked for deletion. The deletion will be applied when changes are saved.') : (it ? 'Le modifiche non ancora salvate verranno perse.' : 'Unsaved changes will be lost.')}</AlertDialogPrimitive.Description>
    <div className="react-alert__actions"><AlertDialogPrimitive.Cancel asChild><Button ref={cancelRef} variant="outline">{it ? 'Annulla' : 'Cancel'}</Button></AlertDialogPrimitive.Cancel><Button onClick={onConfirm}><Icon aria-hidden="true" size={16} strokeWidth={1.75} />{deleting ? (it ? 'Elimina' : 'Delete') : (it ? 'Ricarica' : 'Reload')}</Button></div>
  </SharedDialog>;
}

export function ChangesReport({ language, report, open, onClose }: { language: 'it' | 'en'; report: SaveReport | null; open: boolean; onClose: () => void }) {
  const it = language === 'it';
  const closeRef = useRef<HTMLButtonElement>(null);
  const metrics = report ? summarizeReport(report) : null;
  const changes = report ? describeRows(report.changedRows, language) : [];
  const errors = report ? describeRows(report.rows.filter(row => row.hasErrors && row.state !== 'deleted'), language) : [];
  const labels = it ? ['Modifiche pendenti', 'Pronte da salvare', 'Righe non valide', 'Errori'] : ['Pending changes', 'Ready to save', 'Invalid rows', 'Errors'];
  const counts = [metrics?.pending ?? 0, metrics?.ready ?? 0, metrics?.invalidRows ?? 0, metrics?.errors ?? 0];
  return <SharedDialog className="react-alert__content--report" initialFocus={closeRef} open={open} onOpenChange={next => { if (!next) onClose(); }}>
    <span className="react-alert__icon react-alert__icon--report"><ClipboardList aria-hidden="true" size={20} strokeWidth={1.75} /></span>
    <AlertDialogPrimitive.Title>{it ? 'Report delle modifiche' : 'Changes report'}</AlertDialogPrimitive.Title>
    <AlertDialogPrimitive.Description>{it ? 'Consulta lo stato delle modifiche e gli eventuali errori di validazione.' : 'Review pending changes and any validation errors.'}</AlertDialogPrimitive.Description>
    <div className="react-report__body"><section><h3>{it ? 'Riepilogo' : 'Summary'}</h3><div className="react-report__counts">{labels.map((label, index) => <div key={label}><span>{label}</span><strong>{counts[index]}</strong></div>)}</div></section>
      <section><h3>{it ? 'Modifiche' : 'Changes'}</h3><div className="react-report__changes">{changes.length ? changes.map((row, index) => <div key={index}><strong>{row.label}</strong><span data-state={report?.changedRows[index].state}>{({ new: it ? 'Inserimento' : 'Insert', modified: it ? 'Aggiornamento' : 'Update', deleted: it ? 'Eliminazione' : 'Delete' } as Record<string, string>)[report?.changedRows[index].state ?? '']}</span></div>) : (it ? 'Nessuna modifica pendente.' : 'No pending changes.')}</div></section>
      <section><h3>{it ? 'Errori di validazione' : 'Validation errors'}</h3><div className={errors.length ? 'react-report__errors' : 'react-report__empty'}>{errors.length ? errors.map((row, index) => <div key={index}><strong>{row.label}</strong><ul>{row.errors.map((error, i) => <li key={i}>{error}</li>)}</ul></div>) : (it ? 'Nessun errore di validazione.' : 'No validation errors.')}</div></section></div>
    <div className="react-alert__actions"><Button ref={closeRef} onClick={onClose}>{it ? 'Chiudi' : 'Close'}</Button></div>
  </SharedDialog>;
}
