import { describe, expect, test } from 'vitest';
import { countPrintProducts } from '../src/demo/utils/demo-calculations.js';

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
});
