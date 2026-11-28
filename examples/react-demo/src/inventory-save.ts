import type { InventoryGridController } from './components/InventoryGrid';
import { inventorySnapshot } from './inventory-metrics';

export type SaveReport = ReturnType<InventoryGridController['getStateReport']>;
export type SavePayload = ReturnType<InventoryGridController['getSavePayload']>;
export type SaveReview = { report: SaveReport; payload: SavePayload; signature: string };

export function createSaveGate() {
  let active = false;
  return {
    begin() { if (active) return false; active = true; return true; },
    end() { active = false; },
  };
}

export function summarizeReport(report: SaveReport) {
  const snapshot = inventorySnapshot(report);
  return {
    pending: report.changedRowsCount,
    ready: report.validChangedRowsCount,
    invalidRows: report.rows.filter(row => row.state !== 'deleted' && row.hasErrors).length,
    errors: snapshot.errors,
  };
}

export function reviewChanges(grid: InventoryGridController): SaveReview {
  grid.validateChanges();
  const report = grid.getStateReport();
  const payload = grid.getSavePayload({ savePolicy: 'valid-only', includeInvalid: true });
  return { report, payload, signature: JSON.stringify({ changes: payload.changes, invalid: report.invalidChangedRows }) };
}

export async function sendValidChanges(grid: InventoryGridController, current: SaveReview, send: typeof fetch = fetch) {
  const candidates = current.report.validChangedRows.map(({ key, tempId, state }) => ({ key, tempId, state }));
  const response = await send('/api/products/save', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(current.payload.changes),
  });
  if (!response.ok) throw new Error(`POST /api/products/save failed with ${response.status}`);
  try {
    const result = await response.json() as { insertedIds: { tempId?: string; id: number }[] };
    const idByTempId = new Map(result.insertedIds.filter(({ tempId }) => Boolean(tempId)).map(({ tempId, id }) => [tempId as string, id]));
    const newRows = candidates.filter(candidate => candidate.state === 'new');
    if (newRows.some(candidate => !candidate.tempId || !idByTempId.has(candidate.tempId))) throw new Error('Missing backend identifiers');
    const mappings = newRows.map(candidate => ({ tempId: candidate.tempId as string, id: idByTempId.get(candidate.tempId as string) as number }));
    const applied = grid.applyBackendIds(mappings);
    if (applied.applied.length !== mappings.length || applied.notFound.length || applied.invalid.length || applied.duplicates.length) throw new Error('Backend identifiers could not be applied');
    const identifiers = candidates.map(({ key, tempId }) => tempId ? idByTempId.get(tempId) ?? key : key);
    if (!grid.markRowsSaved(identifiers)) throw new Error('Rows could not be acknowledged');
  } catch (error) {
    throw new Error('Local reconciliation failed after server response', { cause: error });
  }
}

const fieldNames: Record<string, string> = {
  itemCode: 'Item code', productName: 'Product name', supplierCode: 'Supplier', stockQuantity: 'Stock quantity',
  unitPrice: 'Unit price', inventoryValue: 'Inventory value', status: 'Status', requiresInspection: 'Requires inspection',
  lastCheckDate: 'Last check date', notes: 'Notes',
};
const translations: Record<string, string> = {
  'This field is required': 'Campo obbligatorio',
  'Enter at least 3 characters': 'Inserisci almeno 3 caratteri',
  'Use ITM-1001 format': 'Usa il formato ITM-1001',
  'Item code must be unique': 'Item code deve essere univoco',
  'Cannot be negative': 'Il valore non può essere negativo',
  'Enter a valid price': 'Inserisci un prezzo valido',
  'Enter a valid date': 'Inserisci una data valida',
  'Unknown supplier code': 'Codice fornitore sconosciuto',
  'Value must be an integer': 'Il valore deve essere un numero intero',
  'Invalid decimal value': 'Valore decimale non valido',
  'Invalid date': 'Data non valida',
  'Invalid format': 'Formato non valido',
  'Value must be unique': 'Il valore deve essere univoco',
  'Invalid value': 'Valore non valido',
};

export function excludedRows(report: SaveReport, language: 'it' | 'en') {
  return describeRows(report.invalidChangedRows, language);
}

export function describeRows(rows: SaveReport['rows'], language: 'it' | 'en') {
  return rows.map((row, index) => {
    const code = Reflect.get(row.after, 'itemCode');
    const label = typeof code === 'string' && code.trim() ? code.trim() : language === 'it' ? `Nuovo prodotto ${index + 1}` : `New product ${index + 1}`;
    const errors = row.cellErrors.map(({ field, message }) => `${fieldNames[field] ?? field}: ${language === 'it' ? translations[message] ?? message : message}`);
    if (row.rowError) errors.push(String(row.rowError));
    return { label, errors };
  });
}
