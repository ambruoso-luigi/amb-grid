export type InventoryRow = {
  id: number;
  itemCode: string;
  productName: string;
  warehouse: string;
  stockQuantity: number;
  unitPrice: number;
  status: 'ACTIVE' | 'HOLD' | 'REVIEW';
  requiresInspection: boolean;
  lastCheckDate: string;
  notes: string;
};

export const inventoryRows: InventoryRow[] = [
  { id: 1, itemCode: 'ITM-1001', productName: 'Industrial barcode scanner', warehouse: 'Ancona', stockQuantity: 24, unitPrice: 189.9, status: 'ACTIVE', requiresInspection: false, lastCheckDate: '2026-09-08', notes: 'Primary picking area' },
  { id: 2, itemCode: 'ITM-1002', productName: 'Steel shelving unit', warehouse: 'Bologna', stockQuantity: 12, unitPrice: 425, status: 'ACTIVE', requiresInspection: true, lastCheckDate: '2026-08-22', notes: 'Inspect upright frames before restock' },
  { id: 3, itemCode: 'ITM-1003', productName: 'Thermal label printer', warehouse: 'Milano', stockQuantity: 8, unitPrice: 312.5, status: 'REVIEW', requiresInspection: true, lastCheckDate: '2026-09-01', notes: 'Firmware update scheduled' },
  { id: 4, itemCode: 'ITM-1004', productName: 'Safety gloves, size L', warehouse: 'Ancona', stockQuantity: 146, unitPrice: 8.75, status: 'ACTIVE', requiresInspection: false, lastCheckDate: '2026-09-06', notes: 'Seasonal stock' },
  { id: 5, itemCode: 'ITM-1005', productName: 'Portable pallet scale', warehouse: 'Roma', stockQuantity: 3, unitPrice: 780, status: 'HOLD', requiresInspection: true, lastCheckDate: '2026-07-18', notes: 'Awaiting calibration certificate' },
  { id: 6, itemCode: 'ITM-1006', productName: 'ESD work mat', warehouse: 'Bologna', stockQuantity: 37, unitPrice: 54.3, status: 'ACTIVE', requiresInspection: false, lastCheckDate: '2026-08-30', notes: 'Assembly line stations' },
  { id: 7, itemCode: 'ITM-1007', productName: 'Handheld RFID reader', warehouse: 'Milano', stockQuantity: 5, unitPrice: 645, status: 'REVIEW', requiresInspection: true, lastCheckDate: '2026-08-26', notes: 'Compare read-range performance' },
  { id: 8, itemCode: 'ITM-1008', productName: 'Packing tape dispenser', warehouse: 'Roma', stockQuantity: 61, unitPrice: 18.4, status: 'ACTIVE', requiresInspection: false, lastCheckDate: '2026-09-04', notes: 'Standard packing bench equipment' },
];

export const warehouseOptions = ['Ancona', 'Bologna', 'Milano', 'Roma'];
