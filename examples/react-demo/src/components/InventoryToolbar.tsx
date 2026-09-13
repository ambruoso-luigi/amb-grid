import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
  onFiltersClose: () => void;
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
  const filtersControlRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!props.filtersOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!filtersControlRef.current?.contains(event.target as Node)) props.onFiltersClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [props.filtersOpen, props.onFiltersClose]);

  return <div className="inventory-toolbar" aria-label="Inventory toolbar">
    <div className="inventory-toolbar__actions">
      <Button disabled={disabled} onClick={props.onAdd}><PackagePlus aria-hidden="true" className="inventory-toolbar__icon" /> Add product</Button>
      <Button disabled={disabled || props.pending === 0} onClick={props.onSave} variant="outline">{props.busy ? <LoaderCircle aria-hidden="true" className="inventory-spinner inventory-toolbar__icon" /> : <Save aria-hidden="true" className="inventory-toolbar__icon" />} Save changes</Button>
      <Button disabled={disabled} onClick={props.onValidate} variant="outline"><ShieldCheck aria-hidden="true" className="inventory-toolbar__icon" /> Validate</Button>
      <Button disabled={disabled} onClick={props.onReload} variant="outline"><RotateCcw aria-hidden="true" className="inventory-toolbar__icon" /> Reload</Button>
    </div>
    <div className="inventory-toolbar__utilities">
      <label className="inventory-search"><Search aria-hidden="true" className="inventory-toolbar__icon" /><input aria-label="Search inventory" onChange={(event) => props.onSearch(event.target.value)} placeholder="Search inventory..." value={props.searchQuery} /></label>
      <div className="inventory-toolbar__filter-control" ref={filtersControlRef}>
        <Button aria-expanded={props.filtersOpen} disabled={disabled} onClick={props.onFiltersToggle} size="sm" variant="outline"><Filter aria-hidden="true" className="inventory-toolbar__icon" /> Filters</Button>
        <AnimatePresence>
          {props.filtersOpen && <motion.div animate={{ opacity: 1, y: 0 }} className="inventory-filters" exit={{ opacity: 0, y: -6 }} initial={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
            <label>Status<select onChange={(event) => props.onFiltersChange({ ...props.filters, status: event.target.value })} value={props.filters.status}><option value="">Tutti</option><option value="ACTIVE">ACTIVE</option><option value="REVIEW">REVIEW</option><option value="HOLD">HOLD</option></select></label>
            <label>Inspection<select onChange={(event) => props.onFiltersChange({ ...props.filters, inspection: event.target.value })} value={props.filters.inspection}><option value="">Tutte</option><option value="true">Richiesta</option><option value="false">Non richiesta</option></select></label>
          </motion.div>}
        </AnimatePresence>
      </div>
      <Button disabled={!props.gridReady} onClick={props.onPayload} size="sm" variant="outline"><Braces aria-hidden="true" className="inventory-toolbar__icon" /> Payload</Button>
    </div>
  </div>;
}
