import fs from 'node:fs';
import { describe, expect, test } from 'vitest';

const source = fs.readFileSync(
    new URL('../src/demo/full-demo.js', import.meta.url),
    'utf8'
);

describe('Classic Warehouse Backoffice demo', () => {
    test('uses inventory-oriented title, fake API, and controls', () => {
        expect(source).toContain('Gestionale Magazzino Classico');
        expect(source).toContain('fakeApi.getProducts()');
        expect(source).toContain('fakeApi.saveProductChanges(payload)');
        expect(source).toContain('id="add-product"');
        expect(source).toContain('id="save-products"');
        expect(source).toContain('id="product-report"');
    });

    test('keeps lookup, autocomplete, numeric, and date capabilities in the main demo', () => {
        expect(source).toContain("title: 'SKU'");
        expect(source).toContain("field: 'sku'");
        expect(source).toContain("title: 'Product name'");
        expect(source).toContain("field: 'productName'");
        expect(source).toContain("title: 'Stock quantity'");
        expect(source).toContain("field: 'stockQuantity'");
        expect(source).toContain("title: 'Minimum stock'");
        expect(source).toContain("field: 'minimumStock'");
        expect(source).toContain("title: 'Unit price'");
        expect(source).toContain("field: 'unitPrice'");
        expect(source).toContain("title: 'Last check date'");
        expect(source).toContain("field: 'lastCheckDate'");
        expect(source).toContain("title: 'Status'");
        expect(source).toContain("field: 'status'");
        expect(source).toContain('AMB.editors.autocomplete(categories');
        expect(source).toContain('AMB.editors.lookup(statusLookup');
        expect(source).toContain('fakeApi.searchStatuses(query)');
    });

    test('includes inventory fields in newly inserted products', () => {
        expect(source).toContain("sku: ''");
        expect(source).toContain("productName: ''");
        expect(source).toContain("category: ''");
        expect(source).toContain("warehouse: ''");
        expect(source).toContain("stockQuantity: ''");
        expect(source).toContain("minimumStock: ''");
        expect(source).toContain("unitPrice: ''");
        expect(source).toContain("lastCheckDate: ''");
        expect(source).toContain("status: ''");
        expect(source).toContain('crud.getSavePayload()');
    });

    test('keeps the Notes large text editor open when its backdrop is clicked', () => {
        expect(source).toMatch(
            /title: 'Notes'[\s\S]*?AMB\.editors\.largeText\(\{[\s\S]*?closeOnBackdropClick: false/
        );
        expect(source).toMatch(
            /title: 'Notes'[\s\S]*?AMB\.editors\.largeText\(\{[\s\S]*?tabBehavior: 'save-and-navigate'/
        );
    });
});
