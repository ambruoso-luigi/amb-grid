import { CheckCircle2, CircleAlert, GitBranch, Minus, Plus, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
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

const highlightJson = (serialized: string): ReactNode[] => {
  const tokens: ReactNode[] = [];
  let index = 0;

  const addToken = (className: string, value: string) => {
    tokens.push(<span className={className} key={index}>{value}</span>);
  };

  while (index < serialized.length) {
    const character = serialized[index];

    if (/\s/.test(character)) {
      let end = index + 1;
      while (end < serialized.length && /\s/.test(serialized[end])) end += 1;
      tokens.push(serialized.slice(index, end));
      index = end;
      continue;
    }

    if (character === '"') {
      let end = index + 1;
      let escaped = false;

      while (end < serialized.length) {
        const current = serialized[end];
        if (current === '"' && !escaped) {
          end += 1;
          break;
        }
        escaped = current === '\\' && !escaped;
        if (current !== '\\') escaped = false;
        end += 1;
      }

      let lookahead = end;
      while (/\s/.test(serialized[lookahead] || '')) lookahead += 1;
      addToken(
        serialized[lookahead] === ':' ? 'payload-json__key' : 'payload-json__string',
        serialized.slice(index, end)
      );
      index = end;
      continue;
    }

    if (/[{}\[\],:]/.test(character)) {
      addToken('payload-json__punctuation', character);
      index += 1;
      continue;
    }

    const number = serialized.slice(index).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (number) {
      addToken('payload-json__number', number[0]);
      index += number[0].length;
      continue;
    }

    const literal = serialized.slice(index).match(/^(?:true|false|null)/);
    if (literal) {
      addToken(literal[0] === 'null' ? 'payload-json__null' : 'payload-json__boolean', literal[0]);
      index += literal[0].length;
      continue;
    }

    tokens.push(character);
    index += 1;
  }

  return tokens;
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
      <pre className="payload-json"><code>{highlightJson(JSON.stringify(payload, null, 2))}</code></pre>
    </Sheet>
  );
}
