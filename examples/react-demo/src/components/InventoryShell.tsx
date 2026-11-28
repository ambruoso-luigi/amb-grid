import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { InventoryGrid, type InventoryGridController } from './InventoryGrid';
import { InventoryKpis } from './InventoryKpis';
import { inventorySnapshot, type InventorySnapshot } from '../inventory-metrics';
import { createSaveGate, excludedRows, reviewChanges, sendValidChanges, type SaveReview } from '../inventory-save';
import { InventoryToolbar, type InventoryFilters } from './InventoryToolbar';
import { PayloadSheet, type InventoryPayload } from './PayloadSheet';
import { ActionConfirmation, ChangesReport, PartialSaveAlert } from './ui/alert-dialog';
import type { InventoryRow } from '../data/inventory';
import {
  createDemoCommandGuide,
  type DemoCommandGuideController,
} from '../../../../src/demo/components/demo-command-guide';

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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportData, setReportData] = useState<SaveReview['report'] | null>(null);
  const [confirmation, setConfirmation] = useState<{ kind: 'delete' | 'reload'; itemCode?: string } | null>(null);
  const confirmDeleteRef = useRef<((value: boolean) => void) | null>(null);
  const [busy, setBusy] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<InventoryFilters>({ status: '', inspection: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [review, setReview] = useState<SaveReview | null>(null);
  const saveGate = useRef(createSaveGate());
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

  const showFeedback = useCallback((tone: 'success' | 'warning' | 'error', text: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ tone, text });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 4200);
  }, []);

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    loadAbortRef.current?.abort();
    loadAbortRef.current = null;
    activeGridRef.current = null;
    confirmDeleteRef.current?.(false);
    confirmDeleteRef.current = null;
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
      const message = languageRef.current === 'it' ? 'Impossibile caricare i prodotti.' : 'Unable to load products.';
      showFeedback('error', error instanceof Error ? `${message} (${error.message})` : message);
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
    })).then(() => {
      grid.validateChanges();
      syncFromGrid(grid);
    });
  }, [grid, syncFromGrid]);

  const openReport = useCallback(() => {
    if (!grid) return;
    const current = reviewChanges(grid);
    syncFromGrid(grid);
    setReportData(current.report);
    setReportOpen(true);
  }, [grid, syncFromGrid]);

  const confirmDelete = useCallback((itemCode: string) => new Promise<boolean>(resolve => {
    if (confirmDeleteRef.current) return resolve(false);
    confirmDeleteRef.current = resolve;
    setConfirmation({ kind: 'delete', itemCode });
  }), []);
  const cancelConfirmation = useCallback(() => {
    confirmDeleteRef.current?.(false);
    confirmDeleteRef.current = null;
    setConfirmation(null);
  }, []);
  const acceptConfirmation = useCallback(() => {
    if (confirmation?.kind === 'delete') confirmDeleteRef.current?.(true);
    else if (confirmation?.kind === 'reload' && grid) void loadProducts(grid);
    confirmDeleteRef.current = null;
    setConfirmation(null);
  }, [confirmation, grid, loadProducts]);
  const requestReload = useCallback(() => {
    if (!grid) return;
    if (grid.getStateReport().hasChanges) setConfirmation({ kind: 'reload' });
    else void loadProducts(grid);
  }, [grid, loadProducts]);

  const sendReviewedChanges = useCallback(async (current: SaveReview) => {
    if (!grid) return;
    try {
      await sendValidChanges(grid, current);
      syncFromGrid(grid);
      setPartialSaveOpen(false);
      showFeedback(current.payload.isPartialSave ? 'warning' : 'success', languageRef.current === 'it' ? (current.payload.isPartialSave ? 'Modifiche valide salvate. Le righe con errori restano da correggere.' : 'Modifiche salvate correttamente.') : (current.payload.isPartialSave ? 'Valid changes saved. Rows containing errors still need correction.' : 'Changes saved successfully.'));
    } catch (error) {
      syncFromGrid(grid);
      showFeedback('error', error instanceof Error && error.message === 'Local reconciliation failed after server response'
        ? (languageRef.current === 'it' ? 'Il server ha risposto, ma il riallineamento locale non è stato completato. Verifica le righe prima di riprovare.' : 'The server responded, but local reconciliation did not complete. Check the rows before retrying.')
        : (languageRef.current === 'it' ? 'Impossibile salvare le modifiche. I dati non salvati sono stati conservati.' : 'Unable to save changes. Unsaved data has been preserved.'));
    }
  }, [grid, showFeedback, syncFromGrid]);

  const prepareSave = useCallback(async (confirmed?: SaveReview) => {
    if (!grid || !saveGate.current.begin()) return;
    flushSync(() => { setSaving(true); setBusy(true); });
    try {
      const current = reviewChanges(grid);
      syncFromGrid(grid);
      if (!current.payload.canSave) {
        setReview(current);
        if (confirmed) setPartialSaveOpen(false);
        return showFeedback('error', languageRef.current === 'it' ? 'Correggi le righe non valide prima di salvare.' : 'Correct invalid rows before saving.');
      }
      if (confirmed && current.signature !== confirmed.signature) {
        setReview(current);
        return showFeedback('warning', languageRef.current === 'it' ? 'Le modifiche sono cambiate. Controlla il riepilogo aggiornato.' : 'Changes have changed. Review the updated summary.');
      }
      if (!confirmed && current.payload.isPartialSave) {
        setReview(current);
        setPartialSaveOpen(true);
        return;
      }
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      setFeedback({ tone: 'success', text: languageRef.current === 'it' ? 'Salvataggio in corso…' : 'Saving changes…' });
      await sendReviewedChanges(current);
    } catch {
      showFeedback('error', languageRef.current === 'it' ? 'Impossibile verificare le modifiche.' : 'Unable to validate changes.');
    } finally {
      saveGate.current.end();
      setSaving(false);
      setBusy(false);
    }
  }, [grid, sendReviewedChanges, showFeedback, syncFromGrid]);

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
        <InventoryToolbar busy={busy} commandGuideTriggerRef={commandGuideTriggerRef} filters={filters} filtersOpen={filtersOpen} gridReady={Boolean(grid)} language={language} onAdd={addProduct} onCommandGuideToggle={handleCommandGuideToggle} onFiltersChange={updateFilters} onFiltersClose={() => setFiltersOpen(false)} onFiltersToggle={() => setFiltersOpen((open) => !open)} onPayload={() => setPayloadOpen(true)} onReload={requestReload} onSave={() => void prepareSave()} onSearch={updateSearch} onReport={openReport} pending={snapshot.ready} searchQuery={searchQuery} />
        {feedback && <motion.div animate={{ opacity: 1, y: 0 }} className="inventory-feedback" data-tone={feedback.tone} initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }} role="status">{feedback.tone === 'success' ? <CheckCircle2 aria-hidden="true" size={16} /> : <CircleAlert aria-hidden="true" size={16} />}{feedback.text}</motion.div>}
        <div className="react-demo-grid-shell" aria-busy={busy} inert={busy}><InventoryGrid language={language} onConfirmDelete={confirmDelete} onReady={handleGridReady} onStateChange={syncFromGrid} /></div>
      </div>
      <PayloadSheet language={language} onOpenChange={setPayloadOpen} open={payloadOpen} payload={payload} />
      <PartialSaveAlert busy={saving} excluded={review ? excludedRows(review.report, language) : []} language={language} invalidCount={review?.report.invalidChangedRowsCount ?? 0} onConfirm={() => review && void prepareSave(review)} onOpenChange={setPartialSaveOpen} open={partialSaveOpen} validCount={review?.report.validChangedRowsCount ?? 0} />
      <ChangesReport language={language} onClose={() => setReportOpen(false)} open={reportOpen} report={reportData} />
      <ActionConfirmation kind={confirmation?.kind ?? 'reload'} itemCode={confirmation?.itemCode} language={language} onClose={cancelConfirmation} onConfirm={acceptConfirmation} open={Boolean(confirmation)} />
    </motion.section>
  );
}
