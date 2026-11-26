import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { InventoryGrid, type InventoryGridController } from './InventoryGrid';
import { InventoryKpis } from './InventoryKpis';
import { inventorySnapshot, type InventorySnapshot } from '../inventory-metrics';
import { InventoryToolbar, type InventoryFilters } from './InventoryToolbar';
import { PayloadSheet, type InventoryPayload } from './PayloadSheet';
import { PartialSaveAlert } from './ui/alert-dialog';
import type { InventoryRow } from '../data/inventory';
import {
  createDemoCommandGuide,
  type DemoCommandGuideController,
} from '../../../../src/demo/components/demo-command-guide';

type SaveResponse = {
  insertedIds: { tempId?: string; id: number }[];
};

type Language = 'it' | 'en';
type InventoryShellProps = { language: Language };

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
  ready: 0,
  lowStock: 0,
  onHold: 0,
};

const getObjectValue = (object: object, field: string) => Object.entries(object).find(([key]) => key === field)?.[1];
const applyGridView = (controller: InventoryGridController, query: string, filters: InventoryFilters) => {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery && !filters.status && !filters.inspection) {
    controller.clearFilter();
    return;
  }

  controller.setFilter((row: object) => {
    const searchable = ['itemCode', 'productName', 'supplierCode', 'supplierName', 'supplierCity', 'status', 'notes'].map((field) => String(getObjectValue(row, field) ?? '')).join(' ').toLocaleLowerCase();
    const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
    const matchesStatus = !filters.status || getObjectValue(row, 'status') === filters.status;
    const matchesInspection = !filters.inspection || getObjectValue(row, 'requiresInspection') === (filters.inspection === 'true');
    return matchesQuery && matchesStatus && matchesInspection;
  });
};

export function InventoryShell({ language }: InventoryShellProps) {
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
  const languageRef = useRef(language);
  languageRef.current = language;
  const nextItemNumber = useRef(1009);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeGridRef = useRef<InventoryGridController | null>(null);
  const loadAbortRef = useRef<AbortController | null>(null);
  const commandGuideHostRef = useRef<HTMLDivElement | null>(null);
  const commandGuideTriggerRef = useRef<HTMLButtonElement | null>(null);
  const commandGuideRef = useRef<DemoCommandGuideController | null>(null);

  useEffect(() => {
    if (!commandGuideHostRef.current || !commandGuideTriggerRef.current) return;

    const controller = createDemoCommandGuide({
      host: commandGuideHostRef.current,
      trigger: commandGuideTriggerRef.current,
      locale: language,
    });
    commandGuideRef.current = controller;

    return () => {
      controller.destroy();
      if (commandGuideRef.current === controller) commandGuideRef.current = null;
    };
  }, []);

  useEffect(() => {
    commandGuideRef.current?.setLocale(language);
  }, [language]);

  const showFeedback = useCallback((tone: 'success' | 'error', text: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ tone, text });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 4200);
  }, []);

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    loadAbortRef.current?.abort();
    loadAbortRef.current = null;
    activeGridRef.current = null;
  }, []);

  const syncFromGrid = useCallback((controller: InventoryGridController) => {
    const report = controller.getStateReport();
    const nextPayload = controller.getSavePayload({ savePolicy: 'valid-only', includeInvalid: true });
    setSnapshot(inventorySnapshot(report));
    setPayload(nextPayload);
  }, []);

  const loadProducts = useCallback(async (controller: InventoryGridController) => {
    loadAbortRef.current?.abort();
    const abortController = new AbortController();
    loadAbortRef.current = abortController;
    setBusy(true);
    try {
      const response = await fetch('/api/products', {
        signal: abortController.signal,
      });
      if (!response.ok) throw new Error(`GET /api/products failed with ${response.status}`);
      const body = await response.json() as { products: InventoryRow[] };
      if (abortController.signal.aborted || activeGridRef.current !== controller) return;
      await Promise.resolve(controller.replaceData(body.products));
      if (abortController.signal.aborted || activeGridRef.current !== controller) return;
      syncFromGrid(controller);
    } catch (error) {
      if (abortController.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
      if (activeGridRef.current !== controller) return;
      showFeedback('error', error instanceof Error ? error.message : languageRef.current === 'it' ? 'Impossibile caricare i prodotti.' : 'Unable to load products.');
    } finally {
      if (loadAbortRef.current === abortController) {
        loadAbortRef.current = null;
        if (activeGridRef.current === controller) setBusy(false);
      }
    }
  }, [showFeedback, syncFromGrid]);

  const handleGridReady = useCallback((controller: InventoryGridController | null) => {
    if (!controller) {
      loadAbortRef.current?.abort();
      loadAbortRef.current = null;
      activeGridRef.current = null;
    } else {
      activeGridRef.current = controller;
    }
    setGrid(controller);
    if (controller) void loadProducts(controller);
  }, [loadProducts]);

  const addProduct = useCallback(() => {
    if (!grid) return;
    const itemCode = `ITM-${nextItemNumber.current++}`;
    void Promise.resolve(grid.addRow({
      itemCode,
      productName: '',
      supplierCode: 'SUP-001',
      supplierName: 'Adriatica Components',
      supplierCity: 'Ancona',
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
    const report = grid.getStateReport();
    const cellErrorCount = grid.getCellErrors().length;
    const it = languageRef.current === 'it';
    const cellLabel = it ? (cellErrorCount === 1 ? 'cella non valida' : 'celle non valide') : (cellErrorCount === 1 ? 'invalid cell' : 'invalid cells');
    const rowLabel = it ? (report.errorRowsCount === 1 ? 'riga' : 'righe') : (report.errorRowsCount === 1 ? 'row' : 'rows');
    showFeedback(report.errorRowsCount ? 'error' : 'success', report.errorRowsCount ? `${cellErrorCount} ${cellLabel} in ${report.errorRowsCount} ${rowLabel}.` : it ? 'Validazione completata: nessun errore.' : 'Validation complete: no errors.');
  }, [grid, showFeedback, syncFromGrid]);

  const saveValidChanges = useCallback(async () => {
    if (!grid) return;
    const currentPayload = grid.getSavePayload({ savePolicy: 'valid-only', includeInvalid: true });
    const report = grid.getStateReport();
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
      grid.applyBackendIds(result.insertedIds.filter((mapping): mapping is { tempId: string; id: number } => typeof mapping.tempId === 'string'));
      const identifiers = savedCandidates.map(({ key, tempId }) => tempId ? idByTempId.get(tempId) ?? key : key);
      const acknowledged = grid.markRowsSaved(identifiers);
      if (!acknowledged) throw new Error(languageRef.current === 'it' ? 'Il backend ha risposto, ma AMB Grid non ha confermato tutte le righe.' : 'The backend responded, but AMB Grid did not acknowledge all rows.');
      syncFromGrid(grid);
      const remaining = grid.getStateReport().invalidChangedRowsCount;
      showFeedback('success', languageRef.current === 'it' ? (remaining ? `${identifiers.length} modifiche salvate. ${remaining} righe restano da correggere.` : 'Modifiche salvate.') : (remaining ? `${identifiers.length} changes saved. ${remaining} rows still need correction.` : 'Changes saved.'));
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : languageRef.current === 'it' ? 'Salvataggio non riuscito.' : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }, [grid, showFeedback, syncFromGrid]);

  const prepareSave = useCallback(async () => {
    if (!grid) return;
    await Promise.resolve(grid.validateChanges());
    syncFromGrid(grid);
    const currentPayload = grid.getSavePayload({ savePolicy: 'valid-only', includeInvalid: true });
    if (!currentPayload.hasChanges) return showFeedback('success', languageRef.current === 'it' ? 'Nessuna modifica da salvare.' : 'No changes to save.');
    if (!currentPayload.canSave) return showFeedback('error', languageRef.current === 'it' ? 'Correggi le righe non valide prima di salvare.' : 'Correct invalid rows before saving.');
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

  const handleCommandGuideToggle = useCallback(() => {
    commandGuideRef.current?.toggle(commandGuideTriggerRef.current ?? undefined);
  }, []);

  return (
    <motion.section animate={{ opacity: 1, y: 0 }} className="inventory-operations" id="inventory-operations" initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
      <div className="inventory-workspace">
        <InventoryKpis language={language} snapshot={snapshot} />
        <div className="demo-command-guide-host" ref={commandGuideHostRef} />
        <InventoryToolbar busy={busy} commandGuideTriggerRef={commandGuideTriggerRef} filters={filters} filtersOpen={filtersOpen} gridReady={Boolean(grid)} language={language} onAdd={addProduct} onCommandGuideToggle={handleCommandGuideToggle} onFiltersChange={updateFilters} onFiltersClose={() => setFiltersOpen(false)} onFiltersToggle={() => setFiltersOpen((open) => !open)} onPayload={() => setPayloadOpen(true)} onReload={() => grid && void loadProducts(grid)} onSave={() => void prepareSave()} onSearch={updateSearch} onValidate={() => void validate()} pending={snapshot.modified} searchQuery={searchQuery} />
        {feedback && <motion.div animate={{ opacity: 1, y: 0 }} className="inventory-feedback" data-tone={feedback.tone} initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }} role="status">{feedback.tone === 'success' ? <CheckCircle2 aria-hidden="true" size={16} /> : <CircleAlert aria-hidden="true" size={16} />}{feedback.text}</motion.div>}
        <div className="react-demo-grid-shell" aria-busy={busy}><InventoryGrid language={language} onReady={handleGridReady} onStateChange={syncFromGrid} /></div>
      </div>
      <PayloadSheet language={language} onOpenChange={setPayloadOpen} open={payloadOpen} payload={payload} />
      <PartialSaveAlert language={language} invalidCount={payload.summary.invalidChangedRowsCount} onConfirm={() => void saveValidChanges()} onOpenChange={setPartialSaveOpen} open={partialSaveOpen} validCount={payload.summary.validChangedRowsCount} />
    </motion.section>
  );
}
