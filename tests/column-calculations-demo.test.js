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
        expect(source).toContain("descriptionEmphasisKey: 'examples.columnCalculations.detail1Emphasis'");
        expect(source).toContain("descriptionEmphasisKey: 'examples.columnCalculations.productCalcEmphasis'");
        expect(source).toContain("badge: 'PRINT'");
        expect(source).toContain('topCalc: countPrintProducts');
        expect(source).toContain('Example of a custom calculation: a developer-defined function counts product names containing “print”.');
        expect(source).toContain('Each calculation receives the values from its own column. In addition to built-in aggregates, the developer can provide a custom calculation function.');

        [
            'examples.columnCalculations.introEmphasis',
            'examples.columnCalculations.detail1Emphasis',
            'examples.columnCalculations.productCalcEmphasis'
        ].forEach(key => {
            expect(copy.match(new RegExp(`'${key.replace(/\./g, '\\.')}':`, 'g'))).toHaveLength(2);
        });
        expect(copy).toContain('Column calculations shows built-in aggregates and custom calculations defined by the developer, updated directly in their respective columns when the data changes.');
        expect(copy).toContain('Ogni calcolo riceve i valori della propria colonna. Oltre agli aggregati integrati, lo sviluppatore può fornire una funzione di calcolo personalizzata.');
    });
});
