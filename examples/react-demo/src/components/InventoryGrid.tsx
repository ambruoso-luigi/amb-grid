import { useEffect, useRef } from 'react';
import { AMB } from '../lib/amb-grid';
import { warehouseOptions } from '../data/inventory';

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

const money = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', useGrouping: true });
const numberValue = (value: unknown) => typeof value === 'number' ? value : Number(value) || 0;
const inventoryValue = (data: Record<string, unknown>) => numberValue(data.stockQuantity) * numberValue(data.unitPrice);

const stockFormatter = (cell: GridCell) => {
  const value = Math.max(0, numberValue(cell.getValue()));
  const percentage = Math.min(100, value / 1.5);
  const tone = value < 15 ? 'low' : value > 80 ? 'high' : 'normal';
  return `<div class="inventory-stock" data-tone="${tone}"><strong>${value}</strong><span><i style="width:${percentage}%"></i></span></div>`;
};

const statusFormatter = (cell: GridCell) => {
  const status = String(cell.getValue() ?? '');
  return `<span class="inventory-status" data-status="${status.toLowerCase()}">${status}</span>`;
};

const inventoryValueFormatter = (cell: GridCell) => money.format(inventoryValue(cell.getRow().getData()));
const sumNumbers = (values: unknown[]) => values.reduce<number>((total, value) => total + numberValue(value), 0);
const sumInventoryValue = (_values: unknown[], rows: Record<string, unknown>[]) => rows.reduce((total, row) => total + inventoryValue(row), 0);
const countInspections = (values: unknown[]) => values.filter(Boolean).length;
const currencyCalculationFormatter = (cell: GridCell) => money.format(numberValue(cell.getValue()));
const inspectionCalculationFormatter = (cell: GridCell) => `${numberValue(cell.getValue())} inspection`;

const statusLookup = AMB.lookup({
  keyField: 'id',
  valueField: 'id',
  labelField: 'description',
  columns: [
    { field: 'id', title: 'Code', visible: true, width: 90 },
    { field: 'description', title: 'Description', visible: true, width: 180 },
  ],
  load: ({ query }: { query?: string }) => {
    const statuses = [
      { id: 'ACTIVE', description: 'Active' },
      { id: 'HOLD', description: 'On hold' },
      { id: 'REVIEW', description: 'Review required' },
    ];
    const normalizedQuery = query?.trim().toLowerCase() ?? '';
    return normalizedQuery ? statuses.filter(({ id, description }) => `${id} ${description}`.toLowerCase().includes(normalizedQuery)) : statuses;
  },
});

export function InventoryGrid({ onReady, onStateChange }: InventoryGridProps) {
  const gridElementRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<InventoryGridController | null>(null);

  useEffect(() => {
    if (!gridElementRef.current) return;

    const statusDialog = new AMB.LookupDialog();
    const statusEditorOptions = {
      allowEmpty: false,
      dialog: statusDialog,
      dialogTitle: 'Search status',
      invalidMessage: 'Unknown status code',
      autoComplete: true,
      autoCompleteMinChars: 1,
      autoCompleteOnTab: true,
      showDescription: true,
      dialogOptions: { closeOnBackdropClick: false, destroyOnClose: true },
    } as Parameters<typeof AMB.editors.lookup>[1] & { dialog: typeof statusDialog };
    const tableOptions = {
      selector: gridElementRef.current,
      data: [],
      layout: 'fitDataStretch',
      toolbar: false,
      // React demo intentionally keeps row actions immediate.
      rowActionColumn: { enabled: true, width: 52 },
      columns: [
        { title: 'Item code', field: 'itemCode', minWidth: 118, editor: AMB.editors.text({ uppercase: true, trim: true }), required: true, validation: { pattern: { regex: /^ITM-[A-Z0-9]{4}$/, message: 'Use ITM-1001 format' }, unique: { caseSensitive: false, message: 'Item code must be unique' } } },
        { title: 'Product name', field: 'productName', minWidth: 210, editor: AMB.editors.text({ trim: true }), required: true, validation: { minLength: { value: 3, message: 'Enter at least 3 characters' } } },
        { title: 'Warehouse', field: 'warehouse', minWidth: 145, editor: AMB.editors.autocomplete(warehouseOptions, { allowEmpty: false, allowCustomValue: false, placeholder: 'Choose warehouse...' }), required: true, validation: { allowedValues: { values: warehouseOptions, message: 'Choose a known warehouse' } } },
        { title: 'Stock quantity', field: 'stockQuantity', minWidth: 142, editor: AMB.editors.integer({ allowEmpty: false }), formatter: stockFormatter, bottomCalc: sumNumbers, required: true, validation: { integer: true, min: { value: 0, message: 'Cannot be negative' } } },
        { title: 'Unit price', field: 'unitPrice', minWidth: 118, editor: AMB.editors.decimal({ integerDigits: 7, decimalDigits: 2, allowEmpty: false }), formatter: AMB.formatters.currency(), required: true, validation: { decimal: { integerDigits: 7, decimalDigits: 2, allowNegative: false, message: 'Enter a valid price' } } },
        { title: 'Inventory value', field: 'inventoryValue', minWidth: 142, editable: false, formatter: inventoryValueFormatter, bottomCalc: sumInventoryValue, bottomCalcFormatter: currencyCalculationFormatter },
        { title: 'Status', field: 'status', minWidth: 112, editor: AMB.editors.lookup(statusLookup, statusEditorOptions), formatter: statusFormatter, required: true },
        { title: 'Requires inspection', field: 'requiresInspection', minWidth: 150, hozAlign: 'center', formatter: AMB.formatters.checkbox(), editor: AMB.editors.checkbox(), bottomCalc: countInspections, bottomCalcFormatter: inspectionCalculationFormatter },
        { title: 'Last check date', field: 'lastCheckDate', minWidth: 132, editor: AMB.editors.date({ format: 'yyyy-mm-dd', allowEmpty: false, picker: true }), formatter: AMB.formatters.date('yyyy-mm-dd'), required: true, validation: { date: { format: 'yyyy-mm-dd', allowEmpty: false, message: 'Enter a valid date' } } },
        { title: 'Notes', field: 'notes', minWidth: 210, formatter: AMB.formatters.largeTextPreview({ maxLength: 42 }), editor: AMB.editors.largeText({ title: 'Edit inventory notes', rows: 8 }) },
      ],
    };
    const grid = AMB.table(tableOptions);
    const refresh = () => queueMicrotask(() => onStateChange(grid));
    const refreshEditedRow = (cell: GridCell) => requestAnimationFrame(() => {
      if (cell.getField() === 'stockQuantity' || cell.getField() === 'unitPrice') {
        const valueCell = cell.getRow().getCell('inventoryValue');
        if (valueCell) valueCell.getElement().textContent = inventoryValueFormatter(valueCell);
      }
      grid.recalc();
      onStateChange(grid);
    });
    const engineEvents = ['rowAdded', 'rowDeleted', 'dataChanged'];
    const crudEvents = ['row-state-changed', 'cell-error', 'cell-error-cleared', 'row-error', 'row-error-cleared', 'row-saved'];
    const removeCrudListeners = crudEvents.map((eventName) => grid.onCrud(eventName, refresh));
    engineEvents.forEach((eventName) => grid.on(eventName, refresh));
    grid.on('cellEdited', refreshEditedRow);

    gridRef.current = grid;
    onReady(grid);
    refresh();

    return () => {
      engineEvents.forEach((eventName) => grid.off(eventName, refresh));
      grid.off('cellEdited', refreshEditedRow);
      removeCrudListeners.forEach((removeListener) => removeListener());
      gridRef.current?.destroy();
      statusDialog.destroy();
      gridRef.current = null;
      onReady(null);
    };
  }, [onReady, onStateChange]);

  return <div className="react-demo-grid" ref={gridElementRef} />;
}
