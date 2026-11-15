import { describe, expect, test } from 'vitest';
import { generateInventoryItemCode } from '../src/demo/utils/inventory-item-code.js';

describe('generateInventoryItemCode', () => {
    test('starts with a valid product code', () => {
        const code = generateInventoryItemCode([]);
        expect(code).toBe('PRD-X001');
        expect(code).toMatch(/^PRD-[A-Z0-9]{4}$/);
    });

    test('increments and skips occupied codes regardless of case and whitespace', () => {
        expect(generateInventoryItemCode([
            { itemCode: ' prd-x001 ' }, { itemCode: 'PRD-X002' }, { itemCode: 'PrD-X004' }
        ])).toBe('PRD-X003');
    });

    test('includes current codes in new, modified and deleted rows', () => {
        expect(generateInventoryItemCode([
            { itemCode: 'PRD-X001', state: 'new' },
            { itemCode: 'PRD-X002', state: 'modified' },
            { itemCode: 'PRD-X003', state: 'deleted' }
        ])).toBe('PRD-X004');
    });

    test('advances across the alphanumeric boundary', () => {
        const rows = Array.from({ length: 9 }, (_, i) => ({ itemCode: `PRD-X00${i + 1}` }));
        expect(generateInventoryItemCode(rows)).toBe('PRD-X00A');
    });

    test('ignores empty and unrelated codes', () => {
        expect(generateInventoryItemCode([{ itemCode: null }, {}, { itemCode: 'PRD-A001' }]))
            .toBe('PRD-X001');
    });
});
