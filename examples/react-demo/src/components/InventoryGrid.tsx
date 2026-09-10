import { useEffect, useRef } from 'react';
import { AMB } from '../lib/amb-grid';
import { inventoryRows, warehouseOptions } from '../data/inventory';

export type InventoryGridController = ReturnType<typeof AMB.table>;

type InventoryGridProps = {
  onReady: (grid: InventoryGridController | null) => void;
};

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

export function InventoryGrid({ onReady }: InventoryGridProps) {
  const gridElementRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<InventoryGridController | null>(null);

  useEffect(() => {
    if (!gridElementRef.current) return;

    const tableOptions = {
      selector: gridElementRef.current,
      data: inventoryRows.map((row) => ({ ...row })),
      layout: 'fitColumns',
      toolbar: false,
      rowActionColumn: { enabled: true, width: 52 },
      columns: [
        { title: 'Item code', field: 'itemCode', minWidth: 112, widthGrow: 0.85, editor: AMB.editors.text({ uppercase: true, trim: true }), required: true, validation: { pattern: { regex: /^ITM-[A-Z0-9]{4}$/, message: 'Use ITM-1001 format' }, unique: { caseSensitive: false, message: 'Item code must be unique' } } },
        { title: 'Product name', field: 'productName', minWidth: 180, widthGrow: 1.8, editor: AMB.editors.text({ trim: true }), required: true, validation: { minLength: { value: 3, message: 'Enter at least 3 characters' } } },
        { title: 'Warehouse', field: 'warehouse', minWidth: 145, widthGrow: 1.1, editor: AMB.editors.autocomplete(warehouseOptions, { allowEmpty: false, allowCustomValue: false, placeholder: 'Choose warehouse...' }), required: true, validation: { allowedValues: { values: warehouseOptions, message: 'Choose a known warehouse' } } },
        { title: 'Stock quantity', field: 'stockQuantity', minWidth: 118, widthGrow: 0.7, editor: AMB.editors.integer({ allowEmpty: false }), formatter: AMB.formatters.integer(), required: true, validation: { integer: true, min: { value: 0, message: 'Cannot be negative' } } },
        { title: 'Unit price', field: 'unitPrice', minWidth: 112, widthGrow: 0.7, editor: AMB.editors.decimal({ integerDigits: 7, decimalDigits: 2, allowEmpty: false }), formatter: AMB.formatters.currency(), required: true, validation: { decimal: { integerDigits: 7, decimalDigits: 2, allowNegative: false, message: 'Enter a valid price' } } },
        { title: 'Status', field: 'status', minWidth: 106, widthGrow: 0.7, editor: AMB.editors.lookup(statusLookup, { allowEmpty: false, autoComplete: true, showDescription: true }), required: true },
        { title: 'Requires inspection', field: 'requiresInspection', minWidth: 148, widthGrow: 0.75, hozAlign: 'center', formatter: AMB.formatters.checkbox(), editor: AMB.editors.checkbox() },
        { title: 'Last check date', field: 'lastCheckDate', minWidth: 128, widthGrow: 0.8, editor: AMB.editors.date({ format: 'yyyy-mm-dd', allowEmpty: false, picker: true }), formatter: AMB.formatters.date('yyyy-mm-dd'), required: true, validation: { date: { format: 'yyyy-mm-dd', allowEmpty: false, message: 'Enter a valid date' } } },
        { title: 'Notes', field: 'notes', minWidth: 190, widthGrow: 1.5, formatter: AMB.formatters.largeTextPreview({ maxLength: 42 }), editor: AMB.editors.largeText({ title: 'Edit inventory notes', rows: 8 }) },
      ],
    };
    const grid = AMB.table(tableOptions);

    gridRef.current = grid;
    onReady(grid);

    return () => {
      gridRef.current?.destroy();
      gridRef.current = null;
      onReady(null);
    };
  }, [onReady]);

  return <div className="react-demo-grid" ref={gridElementRef} />;
}
