export const LOW_STOCK_THRESHOLD = 20;

export type InventorySnapshot = {
  products: number;
  modified: number;
  errors: number;
  ready: number;
  lowStock: number;
  onHold: number;
};

type InventoryReport = {
  rows: { state: string; after: object; cellErrors: { field: string }[] }[];
  changedRowsCount: number;
  validChangedRowsCount: number;
};

export function inventorySnapshot(report: InventoryReport): InventorySnapshot {
  const current = report.rows.filter((row) => row.state !== 'deleted');
  const lowStock = current.filter(({ after }) => {
    const raw = Reflect.get(after, 'stockQuantity');
    if (typeof raw !== 'number' && (typeof raw !== 'string' || !raw.trim())) return false;
    const quantity = typeof raw === 'number' ? raw : Number(raw);
    return Number.isInteger(quantity) && quantity >= 0 && quantity < LOW_STOCK_THRESHOLD;
  }).length;
  return {
    products: current.length,
    modified: report.changedRowsCount,
    errors: current.reduce((count, row) => count + new Set(row.cellErrors.map(({ field }) => field)).size, 0),
    ready: report.validChangedRowsCount,
    lowStock,
    onHold: current.filter(({ after }) => Reflect.get(after, 'status') === 'HOLD').length,
  };
}
