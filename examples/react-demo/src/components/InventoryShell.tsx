import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Activity, CheckCircle2, CircleAlert } from 'lucide-react';
import { InventoryGrid, type InventoryGridController } from './InventoryGrid';
import { InventoryKpis, type InventorySnapshot } from './InventoryKpis';
import { InventoryToolbar, type InventoryFilters } from './InventoryToolbar';
import { PayloadSheet, type InventoryPayload } from './PayloadSheet';
import { PartialSaveAlert } from './ui/alert-dialog';
import type { InventoryRow } from '../data/inventory';

type InventoryReportRow = {
  key: string | number;
  id?: number;
  tempId?: string;
  state: string;
  after: Record<string, unknown>;
};

type InventoryReport = {
  totalRows: number;
  changedRowsCount: number;
  errorRowsCount: number;
  validChangedRowsCount: number;
  invalidChangedRowsCount: number;
  rows: InventoryReportRow[];
  validChangedRows: InventoryReportRow[];
};

type SaveResponse = {
  insertedIds: { tempId?: string; id: number }[];
};

const emptyPayload: InventoryPayload = {
  canSave: false,
  hasChanges: false,
  hasInvalidChanges: false,
  isPartialSave: false,
  changes: { inserted: [], updated: [], deleted: [] },
  summary: { validChangedRowsCount: 0, invalidChangedRowsCount: 0 },
};

const emptySnapshot: InventorySnapshot = {
  products: 0,
  modified: 0,
  errors: 0,
  pending: 0,
  totalStock: 0,
  inventoryValue: 0,
};

const asNumber = (value: unknown) => typeof value === 'number' ? value : Number(value) || 0;
const applyGridView = (controller: InventoryGridController, query: string, filters: InventoryFilters) => {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery && !filters.status && !filters.inspection) {
    controller.clearFilter();
    return;
  }

  controller.setFilter((row: Record<string, unknown>) => {
    const searchable = [row.itemCode, row.productName, row.warehouse, row.status, row.notes].join(' ').toLocaleLowerCase();
    const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
    const matchesStatus = !filters.status || row.status === filters.status;
    const matchesInspection = !filters.inspection || row.requiresInspection === (filters.inspection === 'true');
    return matchesQuery && matchesStatus && matchesInspection;
  });
};

export function InventoryShell() {
  const shouldReduceMotion = useReducedMotion();
  const [grid, setGrid] = useState<InventoryGridController | null>(null);
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [payload, setPayload] = useState<InventoryPayload>(emptyPayload);
  const [payloadOpen, setPayloadOpen] = useState(false);
  const [partialSaveOpen, setPartialSaveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<InventoryFilters>({ status: '', inspection: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const nextItemNumber = useRef(1009);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = useCallback((tone: 'success' | 'error', text: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ tone, text });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 4200);
  }, []);

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  const syncFromGrid = useCallback((controller: InventoryGridController) => {
    const report = controller.getStateReport() as InventoryReport;
    const nextPayload = controller.getSavePayload({ savePolicy: 'valid-only', includeInvalid: true }) as InventoryPayload;
    const totals = report.rows.reduce((current, row) => ({
      stock: current.stock + asNumber(row.after.stockQuantity),
      value: current.value + asNumber(row.after.stockQuantity) * asNumber(row.after.unitPrice),
    }), { stock: 0, value: 0 });

    setSnapshot({
      products: report.totalRows,
      modified: report.changedRowsCount,
      errors: report.errorRowsCount,
      pending: report.changedRowsCount,
      totalStock: totals.stock,
      inventoryValue: totals.value,
    });
    setPayload(nextPayload);
  }, []);

  const loadProducts = useCallback(async (controller: InventoryGridController) => {
    setBusy(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error(`GET /api/products failed with ${response.status}`);
      const body = await response.json() as { products: InventoryRow[] };
      await Promise.resolve(controller.replaceData(body.products));
      syncFromGrid(controller);
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'Impossibile caricare i prodotti.');
    } finally {
      setBusy(false);
    }
  }, [showFeedback, syncFromGrid]);

  const handleGridReady = useCallback((controller: InventoryGridController | null) => {
    setGrid(controller);
    if (controller) void loadProducts(controller);
  }, [loadProducts]);

  const addProduct = useCallback(() => {
    if (!grid) return;
    const itemCode = `ITM-${nextItemNumber.current++}`;
    void Promise.resolve(grid.addRow({
      itemCode,
      productName: '',
      warehouse: 'Ancona',
      stockQuantity: 0,
      unitPrice: 0,
      status: 'ACTIVE',
      requiresInspection: false,
      lastCheckDate: '2026-09-10',
      notes: '',
    })).then(() => syncFromGrid(grid));
  }, [grid, syncFromGrid]);

  const validate = useCallback(async () => {
    if (!grid) return;
    await Promise.resolve(grid.validate());
    syncFromGrid(grid);
    const report = grid.getStateReport() as InventoryReport;
    showFeedback(report.errorRowsCount ? 'error' : 'success', report.errorRowsCount ? `${report.errorRowsCount} righe richiedono attenzione.` : 'Validazione completata: nessun errore.');
  }, [grid, showFeedback, syncFromGrid]);

  const saveValidChanges = useCallback(async () => {
    if (!grid) return;
    const currentPayload = grid.getSavePayload({ savePolicy: 'valid-only', includeInvalid: true }) as InventoryPayload;
    const report = grid.getStateReport() as InventoryReport;
    const savedCandidates = report.validChangedRows.map(({ key, tempId }) => ({ key, tempId }));
    setBusy(true);
    try {
      const response = await fetch('/api/products/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPayload.changes),
      });
      if (!response.ok) throw new Error(`POST /api/products/save failed with ${response.status}`);
      const result = await response.json() as SaveResponse;
      const idByTempId = new Map(result.insertedIds.filter(({ tempId }) => Boolean(tempId)).map(({ tempId, id }) => [tempId as string, id]));
      grid.applyBackendIds(result.insertedIds);
      const identifiers = savedCandidates.map(({ key, tempId }) => tempId ? idByTempId.get(tempId) ?? key : key);
      const acknowledged = grid.markRowsSaved(identifiers);
      if (!acknowledged) throw new Error('Il backend ha risposto, ma AMB Grid non ha confermato tutte le righe.');
      syncFromGrid(grid);
      const remaining = (grid.getStateReport() as InventoryReport).invalidChangedRowsCount;
      showFeedback('success', remaining ? `${identifiers.length} modifiche salvate. ${remaining} righe restano da correggere.` : 'Modifiche salvate.');
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'Salvataggio non riuscito.');
    } finally {
      setBusy(false);
    }
  }, [grid, showFeedback, syncFromGrid]);

  const prepareSave = useCallback(async () => {
    if (!grid) return;
    await Promise.resolve(grid.validateChanges());
    syncFromGrid(grid);
    const currentPayload = grid.getSavePayload({ savePolicy: 'valid-only', includeInvalid: true }) as InventoryPayload;
    if (!currentPayload.hasChanges) return showFeedback('success', 'Nessuna modifica da salvare.');
    if (!currentPayload.canSave) return showFeedback('error', 'Correggi le righe non valide prima di salvare.');
    if (currentPayload.isPartialSave) return setPartialSaveOpen(true);
    await saveValidChanges();
  }, [grid, saveValidChanges, showFeedback, syncFromGrid]);

  const updateSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (grid) applyGridView(grid, query, filters);
  }, [filters, grid]);

  const updateFilters = useCallback((nextFilters: InventoryFilters) => {
    setFilters(nextFilters);
    if (!grid) return;
    applyGridView(grid, searchQuery, nextFilters);
  }, [grid, searchQuery]);

  return (
    <motion.section animate={{ opacity: 1, y: 0 }} className="inventory-operations" id="inventory-operations" initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
      <div className="inventory-workspace">
        <header className="inventory-workspace__header">
          <div><span className="inventory-workspace__eyebrow"><Activity aria-hidden="true" size={14} /> Live workspace</span><h2>Inventory Operations</h2><p>Gestione prodotti, stato modifiche e flusso operativo della tabella.</p></div>
          <span className="inventory-workspace__tag">React + TypeScript</span>
        </header>

        <InventoryKpis snapshot={snapshot} />
        <InventoryToolbar busy={busy} filters={filters} filtersOpen={filtersOpen} gridReady={Boolean(grid)} onAdd={addProduct} onFiltersChange={updateFilters} onFiltersToggle={() => setFiltersOpen((open) => !open)} onPayload={() => setPayloadOpen(true)} onReload={() => grid && void loadProducts(grid)} onSave={() => void prepareSave()} onSearch={updateSearch} onValidate={() => void validate()} pending={snapshot.pending} searchQuery={searchQuery} />
        {feedback && <motion.div animate={{ opacity: 1, y: 0 }} className="inventory-feedback" data-tone={feedback.tone} initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }} role="status">{feedback.tone === 'success' ? <CheckCircle2 aria-hidden="true" size={16} /> : <CircleAlert aria-hidden="true" size={16} />}{feedback.text}</motion.div>}
        <div className="react-demo-grid-shell" aria-busy={busy}><InventoryGrid onReady={handleGridReady} onStateChange={syncFromGrid} /></div>
      </div>
      <PayloadSheet onOpenChange={setPayloadOpen} open={payloadOpen} payload={payload} />
      <PartialSaveAlert invalidCount={payload.summary.invalidChangedRowsCount} onConfirm={() => void saveValidChanges()} onOpenChange={setPartialSaveOpen} open={partialSaveOpen} validCount={payload.summary.validChangedRowsCount} />
    </motion.section>
  );
}
