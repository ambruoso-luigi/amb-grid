import { useEffect, useRef } from 'react';
import { AMB } from '../lib/amb-grid';
import type { Supplier } from '../data/inventory';

export type InventoryGridController = ReturnType<typeof AMB.table>;

type InventoryGridProps = {
  onReady: (grid: InventoryGridController | null) => void;
  onStateChange: (grid: InventoryGridController) => void;
};

type GridCell = {
  getField: () => string;
  getElement: () => HTMLElement;
  getValue: () => unknown;
  getRow: () => {
    getCell: (field: string) => GridCell | false;
    getData: () => Record<string, unknown>;
  };
};

const isGridCell = (value: unknown): value is GridCell => {
  if (!value || typeof value !== 'object') return false;

  return ['getField', 'getElement', 'getValue', 'getRow'].every((method) => typeof Reflect.get(value, method) === 'function');
};

const money = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', useGrouping: true });
const numberValue = (value: unknown) => typeof value === 'number' ? value : Number(value) || 0;
const inventoryValue = (data: Record<string, unknown>) => numberValue(data.stockQuantity) * numberValue(data.unitPrice);

const stockFormatter = (cell: GridCell) => {
  const value = Math.max(0, numberValue(cell.getValue()));
  const percentage = Math.min(100, value / 1.5);
  const level = value < 15 ? 'critical' : value < 35 ? 'low' : value < 70 ? 'medium' : value < 100 ? 'good' : 'high';
  return `<div class="inventory-stock" data-level="${level}"><div class="inventory-stock__top"><strong>${value}</strong><span>stock</span></div><span class="inventory-stock__track"><i style="width:${percentage}%"></i></span></div>`;
};

const inspectionCheckboxFormatter = (cell: GridCell) => {
  const checked = Boolean(cell.getValue());

  return `<span class="inventory-checkbox-visual" data-checked="${checked ? 'true' : 'false'}" aria-hidden="true"></span>`;
};

const statusFormatter = (cell: GridCell) => {
  const status = String(cell.getValue() ?? '');
  const icons: Record<string, string> = {
    ACTIVE: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 8.25 2.35 2.35L12.25 4.7"/></svg>',
    REVIEW: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4.1v4.3M8 11.5h.01"/><path d="M7.05 2.8 2.2 11.2a1.1 1.1 0 0 0 .95 1.65h9.7a1.1 1.1 0 0 0 .95-1.65L8.95 2.8a1.1 1.1 0 0 0-1.9 0Z"/></svg>',
    HOLD: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.25 4.25v7.5M10.75 4.25v7.5"/></svg>',
  };
  return `<span class="inventory-status" data-status="${status.toLowerCase()}"><i class="inventory-status__icon">${icons[status] ?? ''}</i><span>${status}</span></span>`;
};

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;',
})[character] ?? character);

const supplierFormatter = (cell: GridCell) => {
  const { supplierCity, supplierCode, supplierName } = cell.getRow().getData();

  return `<span class="inventory-supplier"><strong>${escapeHtml(supplierName)}</strong><small>${escapeHtml(supplierCode)} · ${escapeHtml(supplierCity)}</small></span>`;
};

const inventoryValueFormatter = (cell: GridCell) => money.format(inventoryValue(cell.getRow().getData()));
const sumNumbers = (values: unknown[]) => values.reduce<number>((total, value) => total + numberValue(value), 0);
const sumInventoryValue = (_values: unknown[], rows: Record<string, unknown>[]) => rows.reduce((total, row) => total + inventoryValue(row), 0);
const countInspections = (values: unknown[]) => values.filter(Boolean).length;
const summaryLabelFormatter = (cell: GridCell) => `<span class="inventory-summary-label"><span aria-hidden="true">Σ</span><strong>${cell.getValue()}</strong></span>`;
const stockCalculationFormatter = (cell: GridCell) => `<span class="inventory-summary-number"><strong>${numberValue(cell.getValue())}</strong><small>unità</small></span>`;
const inventoryValueCalculationFormatter = (cell: GridCell) => `<span class="inventory-summary-money">${money.format(numberValue(cell.getValue()))}</span>`;
const inspectionCalculationFormatter = (cell: GridCell) => {
  const count = numberValue(cell.getValue());
  const label = count === 1 ? 'ispezione' : 'ispezioni';

  return `<span class="inventory-summary-inspections"><strong>${count}</strong><small>${label}</small></span>`;
};

const supplierLookup = AMB.lookup({
  keyField: 'id',
  valueField: 'code',
  labelField: 'description',
  columns: [
    { field: 'code', title: 'Code', visible: true, width: 92 },
    { field: 'name', title: 'Supplier', visible: true, width: 200 },
    { field: 'city', title: 'City', visible: true, width: 120 },
    { field: 'category', title: 'Category', visible: true, width: 170 },
  ],
  search: {
    fields: ['code', 'name', 'city'],
  },
  mapToRow: {
    supplierCode: 'code',
    supplierName: 'name',
    supplierCity: 'city',
  },
  load: async ({ query }) => {
    const response = await fetch(`/api/suppliers?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`GET /api/suppliers failed with ${response.status}`);

    const body = await response.json() as { suppliers: Supplier[] };
    return body.suppliers;
  },
});

export function InventoryGrid({ onReady, onStateChange }: InventoryGridProps) {
  const gridElementRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<InventoryGridController | null>(null);

  useEffect(() => {
    if (!gridElementRef.current) return;

    let destroyGrid = () => {};
    const initializeGrid = window.setTimeout(() => {
    if (!gridElementRef.current) return;

    const supplierDialog = new AMB.LookupDialog();
    const tableOptions = {
      selector: gridElementRef.current,
      data: [],
      layout: 'fitDataStretch',
      toolbar: false,
      // React demo intentionally keeps row actions immediate.
      rowActionColumn: { enabled: true, width: 52 },
      columns: [
        { title: 'Item code', field: 'itemCode', minWidth: 118, editor: AMB.editors.text({ uppercase: true, trim: true }), required: true, validation: { pattern: { regex: /^ITM-[A-Z0-9]{4}$/, message: 'Use ITM-1001 format' }, unique: { caseSensitive: false, message: 'Item code must be unique' } } },
        { title: 'Product name', field: 'productName', minWidth: 210, editor: AMB.editors.text({ trim: true }), bottomCalc: () => 'Totali correnti', bottomCalcFormatter: summaryLabelFormatter, required: true, validation: { minLength: { value: 3, message: 'Enter at least 3 characters' } } },
        { title: 'Supplier', field: 'supplierCode', minWidth: 210, formatter: supplierFormatter, editor: AMB.editors.lookup(supplierLookup, { allowEmpty: false, dialog: supplierDialog, dialogTitle: 'Search supplier', searchPlaceholder: 'Search supplier...', invalidMessage: 'Unknown supplier code', autoComplete: false, showDescription: true, dialogOptions: { closeOnBackdropClick: false, destroyOnClose: true } }), required: true },
        { title: 'Stock quantity', field: 'stockQuantity', minWidth: 142, editor: AMB.editors.integer({ allowEmpty: false }), formatter: stockFormatter, bottomCalc: sumNumbers, bottomCalcFormatter: stockCalculationFormatter, required: true, validation: { integer: true, min: { value: 0, message: 'Cannot be negative' } } },
        { title: 'Unit price', field: 'unitPrice', minWidth: 118, editor: AMB.editors.decimal({ integerDigits: 7, decimalDigits: 2, allowEmpty: false }), formatter: AMB.formatters.currency(), required: true, validation: { decimal: { integerDigits: 7, decimalDigits: 2, allowNegative: false, message: 'Enter a valid price' } } },
        { title: 'Inventory value', field: 'inventoryValue', minWidth: 142, editable: false, formatter: inventoryValueFormatter, bottomCalc: sumInventoryValue, bottomCalcFormatter: inventoryValueCalculationFormatter },
        { title: 'Status', field: 'status', minWidth: 112, editor: AMB.editors.select({ options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'REVIEW', label: 'Review' }, { value: 'HOLD', label: 'On hold' }], allowEmpty: false }), formatter: statusFormatter, required: true },
        { title: 'Requires inspection', field: 'requiresInspection', minWidth: 150, hozAlign: 'center', formatter: inspectionCheckboxFormatter, editor: AMB.editors.checkbox(), bottomCalc: countInspections, bottomCalcFormatter: inspectionCalculationFormatter },
        { title: 'Last check date', field: 'lastCheckDate', minWidth: 132, editor: AMB.editors.date({ format: 'yyyy-mm-dd', allowEmpty: false, picker: true }), formatter: AMB.formatters.date('yyyy-mm-dd'), required: true, validation: { date: { format: 'yyyy-mm-dd', allowEmpty: false, message: 'Enter a valid date' } } },
        { title: 'Notes', field: 'notes', minWidth: 210, formatter: AMB.formatters.largeTextPreview({ maxLength: 42 }), editor: AMB.editors.largeText({ title: 'Edit inventory notes', rows: 8 }) },
      ],
    } satisfies Parameters<typeof AMB.table>[0];
    const grid = AMB.table(tableOptions);
    let isActive = true;
    const refresh = () => queueMicrotask(() => {
      if (isActive) onStateChange(grid);
    });
    const refreshEditedRow = (...args: unknown[]) => {
      const cell = args[0];
      if (!isGridCell(cell)) return;

      requestAnimationFrame(() => {
        if (!isActive) return;
        if (cell.getField() === 'stockQuantity' || cell.getField() === 'unitPrice') {
          const valueCell = cell.getRow().getCell('inventoryValue');
          if (valueCell) valueCell.getElement().textContent = inventoryValueFormatter(valueCell);
        }
        onStateChange(grid);
      });
    };
    const engineEvents = ['rowAdded', 'rowDeleted', 'dataChanged', 'dataFiltered'];
    const crudEvents = ['row-state-changed', 'cell-error', 'cell-error-cleared', 'row-error', 'row-error-cleared', 'row-saved'];
    const removeCrudListeners = crudEvents.map((eventName) => grid.onCrud(eventName, refresh));
    engineEvents.forEach((eventName) => grid.on(eventName, refresh));
    grid.on('cellEdited', refreshEditedRow);

    const handleTableBuilt = () => {
      if (!isActive) return;
      gridRef.current = grid;
      onReady(grid);
      refresh();
    };
    grid.on('tableBuilt', handleTableBuilt);

    destroyGrid = () => {
      isActive = false;
      engineEvents.forEach((eventName) => grid.off(eventName, refresh));
      grid.off('cellEdited', refreshEditedRow);
      grid.off('tableBuilt', handleTableBuilt);
      removeCrudListeners.forEach((removeListener) => removeListener());
      gridRef.current?.destroy();
      supplierDialog.destroy();
      gridRef.current = null;
      onReady(null);
    };

    }, 0);

    return () => {
      window.clearTimeout(initializeGrid);
      destroyGrid();
    };
  }, [onReady, onStateChange]);

  return <div className="react-demo-grid" ref={gridElementRef} />;
}
