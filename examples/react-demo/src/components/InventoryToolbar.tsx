import { Braces, Filter, LoaderCircle, PackagePlus, RotateCcw, Save, Search, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';

export type InventoryFilters = { status: string; inspection: string };

type InventoryToolbarProps = {
  busy: boolean;
  filters: InventoryFilters;
  filtersOpen: boolean;
  gridReady: boolean;
  onAdd: () => void;
  onFiltersChange: (filters: InventoryFilters) => void;
  onFiltersToggle: () => void;
  onPayload: () => void;
  onReload: () => void;
  onSave: () => void;
  onSearch: (query: string) => void;
  onValidate: () => void;
  pending: number;
  searchQuery: string;
};

export function InventoryToolbar(props: InventoryToolbarProps) {
  const disabled = !props.gridReady || props.busy;
  return <div className="inventory-toolbar" aria-label="Inventory toolbar">
    <div className="inventory-toolbar__actions">
      <Button disabled={disabled} onClick={props.onAdd}><PackagePlus aria-hidden="true" className="size-4" /> Add product</Button>
      <Button disabled={disabled || props.pending === 0} onClick={props.onSave} variant="outline">{props.busy ? <LoaderCircle aria-hidden="true" className="inventory-spinner size-4" /> : <Save aria-hidden="true" className="size-4" />} Save changes</Button>
      <Button disabled={disabled} onClick={props.onValidate} variant="outline"><ShieldCheck aria-hidden="true" className="size-4" /> Validate</Button>
      <Button disabled={disabled} onClick={props.onReload} variant="outline"><RotateCcw aria-hidden="true" className="size-4" /> Reload</Button>
    </div>
    <div className="inventory-toolbar__utilities">
      <label className="inventory-search"><Search aria-hidden="true" size={16} /><input aria-label="Search inventory" onChange={(event) => props.onSearch(event.target.value)} placeholder="Search inventory..." value={props.searchQuery} /></label>
      <Button aria-expanded={props.filtersOpen} disabled={disabled} onClick={props.onFiltersToggle} size="sm" variant="outline"><Filter aria-hidden="true" className="size-4" /> Filters</Button>
      <Button disabled={!props.gridReady} onClick={props.onPayload} size="sm" variant="outline"><Braces aria-hidden="true" className="size-4" /> Payload</Button>
    </div>
    {props.filtersOpen && <div className="inventory-filters">
      <label>Status<select onChange={(event) => props.onFiltersChange({ ...props.filters, status: event.target.value })} value={props.filters.status}><option value="">Tutti</option><option value="ACTIVE">ACTIVE</option><option value="REVIEW">REVIEW</option><option value="HOLD">HOLD</option></select></label>
      <label>Inspection<select onChange={(event) => props.onFiltersChange({ ...props.filters, inspection: event.target.value })} value={props.filters.inspection}><option value="">Tutte</option><option value="true">Richiesta</option><option value="false">Non richiesta</option></select></label>
    </div>}
  </div>;
}
