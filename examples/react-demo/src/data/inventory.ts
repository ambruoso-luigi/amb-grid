export type Supplier = {
  id: number;
  code: string;
  name: string;
  city: string;
  category: string;
  leadTimeDays: number;
  description: string;
};

export type InventoryRow = {
  id: number;
  itemCode: string;
  productName: string;
  supplierCode: string;
  supplierName: string;
  supplierCity: string;
  stockQuantity: number;
  unitPrice: number;
  status: 'ACTIVE' | 'HOLD' | 'REVIEW';
  requiresInspection: boolean;
  lastCheckDate: string;
  notes: string;
};

export const suppliers: Supplier[] = [
  { id: 1, code: 'SUP-001', name: 'Adriatica Components', city: 'Ancona', category: 'Industrial components', leadTimeDays: 2, description: 'Adriatica Components · Ancona\nIndustrial components · Lead time 2 days' },
  { id: 2, code: 'SUP-002', name: 'Emilia Tech Supplies', city: 'Bologna', category: 'Warehouse equipment', leadTimeDays: 4, description: 'Emilia Tech Supplies · Bologna\nWarehouse equipment · Lead time 4 days' },
  { id: 3, code: 'SUP-003', name: 'Lombarda Industrial', city: 'Milano', category: 'Automation', leadTimeDays: 3, description: 'Lombarda Industrial · Milano\nAutomation · Lead time 3 days' },
  { id: 4, code: 'SUP-004', name: 'Roma Handling Systems', city: 'Roma', category: 'Material handling', leadTimeDays: 5, description: 'Roma Handling Systems · Roma\nMaterial handling · Lead time 5 days' },
  { id: 5, code: 'SUP-005', name: 'Veneto Safety Supply', city: 'Padova', category: 'Safety equipment', leadTimeDays: 3, description: 'Veneto Safety Supply · Padova\nSafety equipment · Lead time 3 days' },
  { id: 6, code: 'SUP-006', name: 'Toscana Packaging', city: 'Firenze', category: 'Packaging', leadTimeDays: 2, description: 'Toscana Packaging · Firenze\nPackaging · Lead time 2 days' },
  { id: 7, code: 'SUP-007', name: 'Piemonte Automation', city: 'Torino', category: 'Industrial automation', leadTimeDays: 4, description: 'Piemonte Automation · Torino\nIndustrial automation · Lead time 4 days' },
  { id: 8, code: 'SUP-008', name: 'Marche Logistics Parts', city: 'Pesaro', category: 'Logistics components', leadTimeDays: 2, description: 'Marche Logistics Parts · Pesaro\nLogistics components · Lead time 2 days' },
  { id: 9, code: 'SUP-009', name: 'Campania Technical Supply', city: 'Napoli', category: 'Technical supplies', leadTimeDays: 5, description: 'Campania Technical Supply · Napoli\nTechnical supplies · Lead time 5 days' },
  { id: 10, code: 'SUP-010', name: 'Romagna Service Equipment', city: 'Rimini', category: 'Service equipment', leadTimeDays: 3, description: 'Romagna Service Equipment · Rimini\nService equipment · Lead time 3 days' },
];

export const inventoryRows: InventoryRow[] = [
  { id: 1, itemCode: 'ITM-1001', productName: 'Industrial barcode scanner', supplierCode: 'SUP-001', supplierName: 'Adriatica Components', supplierCity: 'Ancona', stockQuantity: 24, unitPrice: 189.9, status: 'ACTIVE', requiresInspection: false, lastCheckDate: '2026-09-08', notes: 'Primary picking area' },
  { id: 2, itemCode: 'ITM-1002', productName: 'Steel shelving unit', supplierCode: 'SUP-002', supplierName: 'Emilia Tech Supplies', supplierCity: 'Bologna', stockQuantity: 12, unitPrice: 425, status: 'ACTIVE', requiresInspection: true, lastCheckDate: '2026-08-22', notes: 'Inspect upright frames before restock' },
  { id: 3, itemCode: 'ITM-1003', productName: 'Thermal label printer', supplierCode: 'SUP-003', supplierName: 'Lombarda Industrial', supplierCity: 'Milano', stockQuantity: 8, unitPrice: 312.5, status: 'REVIEW', requiresInspection: true, lastCheckDate: '2026-09-01', notes: 'Firmware update scheduled' },
  { id: 4, itemCode: 'ITM-1004', productName: 'Safety gloves, size L', supplierCode: 'SUP-005', supplierName: 'Veneto Safety Supply', supplierCity: 'Padova', stockQuantity: 146, unitPrice: 8.75, status: 'ACTIVE', requiresInspection: false, lastCheckDate: '2026-09-06', notes: 'Seasonal stock' },
  { id: 5, itemCode: 'ITM-1005', productName: 'Portable pallet scale', supplierCode: 'SUP-004', supplierName: 'Roma Handling Systems', supplierCity: 'Roma', stockQuantity: 3, unitPrice: 780, status: 'HOLD', requiresInspection: true, lastCheckDate: '2026-07-18', notes: 'Awaiting calibration certificate' },
  { id: 6, itemCode: 'ITM-1006', productName: 'ESD work mat', supplierCode: 'SUP-002', supplierName: 'Emilia Tech Supplies', supplierCity: 'Bologna', stockQuantity: 37, unitPrice: 54.3, status: 'ACTIVE', requiresInspection: false, lastCheckDate: '2026-08-30', notes: 'Assembly line stations' },
  { id: 7, itemCode: 'ITM-1007', productName: 'Handheld RFID reader', supplierCode: 'SUP-003', supplierName: 'Lombarda Industrial', supplierCity: 'Milano', stockQuantity: 5, unitPrice: 645, status: 'REVIEW', requiresInspection: true, lastCheckDate: '2026-08-26', notes: 'Compare read-range performance' },
  { id: 8, itemCode: 'ITM-1008', productName: 'Packing tape dispenser', supplierCode: 'SUP-006', supplierName: 'Toscana Packaging', supplierCity: 'Firenze', stockQuantity: 61, unitPrice: 18.4, status: 'ACTIVE', requiresInspection: false, lastCheckDate: '2026-09-04', notes: 'Standard packing bench equipment' },
];
