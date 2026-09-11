import { CheckCircle2, CircleAlert, GitBranch, Minus, Plus, RefreshCw } from 'lucide-react';
import { Sheet } from './ui/sheet';

export type InventoryPayload = {
  canSave: boolean;
  hasChanges: boolean;
  hasInvalidChanges: boolean;
  isPartialSave: boolean;
  changes: { inserted: object[]; updated: object[]; deleted: object[] };
  summary: { validChangedRowsCount: number; invalidChangedRowsCount: number };
};

type PayloadSheetProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  payload: InventoryPayload;
};

export function PayloadSheet({ onOpenChange, open, payload }: PayloadSheetProps) {
  const metrics = [
    ['Inserted', payload.changes.inserted.length, Plus],
    ['Updated', payload.changes.updated.length, RefreshCw],
    ['Deleted', payload.changes.deleted.length, Minus],
    ['Valid', payload.summary.validChangedRowsCount, CheckCircle2],
    ['Invalid', payload.summary.invalidChangedRowsCount, CircleAlert],
    ['Partial save', payload.isPartialSave ? 'Sì' : 'No', GitBranch],
  ] as const;

  return (
    <Sheet description="Snapshot live generato dalla public API CRUD di AMB Grid." onOpenChange={onOpenChange} open={open} title="Payload di salvataggio">
      <div className="payload-summary">
        {metrics.map(([label, value, Icon]) => <article key={label}><Icon aria-hidden="true" size={15} /><span>{label}</span><strong>{value}</strong></article>)}
      </div>
      <div className="payload-json__heading"><span>JSON payload</span><small>policy: valid-only</small></div>
      <pre className="payload-json"><code>{JSON.stringify(payload, null, 2)}</code></pre>
    </Sheet>
  );
}
