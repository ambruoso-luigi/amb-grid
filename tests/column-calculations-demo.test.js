import fs from 'node:fs';
import { describe, expect, test } from 'vitest';
import { countPrintProducts } from '../src/demo/utils/demo-calculations.js';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('Public column calculations demo', () => {
    test('counts print product names case-insensitively and updates with edited values', () => {
        const initialProducts = [
            'Barcode printer',
            'Label printer',
            'Shipping labels',
            'Storage bin',
            'Packing tape',
            'Safety gloves',
            'Steel shelving',
            'Thermal printer',
            'Bubble wrap',
            'Print server'
        ];

        expect(countPrintProducts(initialProducts)).toBe(4);
        expect(countPrintProducts([
            ...initialProducts.slice(0, 2),
            'PRINTING supplies',
            ...initialProducts.slice(3)
        ])).toBe(5);
        expect(countPrintProducts([
            'Barcode scanner',
            ...initialProducts.slice(1)
        ])).toBe(3);
    });

    test('explains built-in aggregates and developer-defined custom calculations', () => {
        const source = read('src/demo/column-calculations.js');
        const copy = read('src/demo/example-copy.js');

        expect(source).toContain('data-i18n-emphasis="examples.columnCalculations.introEmphasis"');
        expect(source).toContain("label: 'PRINT'");
        expect(source).toContain('topCalc: countPrintProducts');
        for (const calc of ['count', 'unique', 'sum', 'avg', 'min', 'max']) {
            expect(source).toContain(`topCalc: '${calc}'`);
        }
        expect(source).toContain('Deleted rows are excluded from aggregates until restored.');
        const keys = ['examples.columnCalculations.introEmphasis'];
        for (let i = 1; i <= 5; i++) {
            keys.push(`examples.columnCalculations.point${i}Title`, `examples.columnCalculations.detail${i}`);
        }
        keys.forEach(key => {
            expect(copy.match(new RegExp(`'${key.replace(/\./g, '\\.')}':`, 'g'))).toHaveLength(2);
        });
        expect(copy).toContain('Column calculations shows built-in aggregates and custom calculations defined by the developer, updated directly in their respective columns when the data changes.');
        expect(copy).toContain('Rollback restores the row and includes it in the calculations again.');
    });
});
