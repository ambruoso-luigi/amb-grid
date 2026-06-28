import fs from 'node:fs';
import { describe, expect, test } from 'vitest';

const source = fs.readFileSync(
    new URL('../src/demo/full-demo.js', import.meta.url),
    'utf8'
);
const demoCss = fs.readFileSync(
    new URL('../src/demo/demo.css', import.meta.url),
    'utf8'
);

describe('Legacy-friendly warehouse demo', () => {
    test('uses legacy-friendly naming with warehouse scenario', () => {
        expect(source).toContain('Demo legacy-friendly');
        expect(source).toContain('Gestionale Magazzino Classico');
        expect(source).toContain('Classic Warehouse Backoffice');
        expect(source).toContain('fakeApi.getProducts()');
        expect(source).toContain('fakeApi.saveProductChanges(payload)');
    });

    test('uses the AMB Grid toolbar instead of external action buttons', () => {
        expect(source).toContain('toolbar: {');
        expect(source).toContain("buttons: [");
        expect(source).toContain("'add'");
        expect(source).toContain("'reload'");
        expect(source).toContain("'save'");
        expect(source).toContain("'payload'");
        expect(source).toContain("'validate'");
        expect(source).toContain("id: 'show-report'");
        expect(source).toContain('onAdd: handleAdd');
        expect(source).toContain('onReload: handleReload');
        expect(source).toContain('onSave: handleSave');
        expect(source).toContain('onPayload: handleShowPayload');
        expect(source).toContain('onValidate: handleValidate');
        expect(source).not.toContain('id="add-product"');
        expect(source).not.toContain('id="save-products"');
        expect(source).not.toContain('id="product-report"');
        expect(source).not.toContain('<pre class="demo-output" id="inventory-output">');
    });

    test('uses the shared report dialog for payload, validation, report, and save result', () => {
        expect(source).toContain(
            "import { createDemoReportDialog } from './utils/demo-report-dialog.js'"
        );
        expect(source).toContain('const reportDialog = createDemoReportDialog()');
        expect(source).toContain('openPayloadReport(payload)');
        expect(source).toContain('openStateReport()');
        expect(source).toContain('openValidationReport(validateResult)');
        expect(source).toContain("title: t('saveTitle')");
        expect(source).toContain('reportDialog.destroy()');
    });

    test('reloads table data through fake API without browser reload', () => {
        expect(source).toContain('async function handleReload()');
        expect(source).toContain('const reloadedProducts = await fakeApi.getProducts()');
        expect(source).toContain('await demo.table.setData(reloadedProducts)');
        expect(source).toContain("message: t('reloaded')");
        expect(source).not.toContain('location.reload');
        expect(source).not.toContain('window.location');
    });

    test('keeps inventory capabilities in the main demo', () => {
        expect(source).toContain("title: 'SKU'");
        expect(source).toContain("field: 'sku'");
        expect(source).toContain("title: 'Product name'");
        expect(source).toContain("field: 'productName'");
        expect(source).toContain("title: 'Category'");
        expect(source).toContain("title: 'Warehouse'");
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
        expect(source).toContain('unique: {');
        expect(source).toContain('minLength: {');
        expect(source).toContain('min: {');
    });

    test('includes inventory fields in newly inserted products', () => {
        expect(source).toContain("sku: ''");
        expect(source).toContain("productName: ''");
        expect(source).toContain("category: ''");
        expect(source).toContain("warehouse: ''");
        expect(source).toContain('stockQuantity: 0');
        expect(source).toContain('minimumStock: 0');
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

    test('keeps the main demo toolbar compact and the Tabulator surface clean in demo CSS', () => {
        expect(demoCss).toContain('.demo-panel .amb-toolbar {');
        expect(demoCss).toContain('grid-template-columns: minmax(0, 1fr) minmax(280px, 380px);');
        expect(demoCss).toContain('.demo-panel .amb-toolbar__search {');
        expect(demoCss).toContain('.demo-panel .tabulator .tabulator-tableholder,');
        expect(demoCss).toContain('.demo-panel .tabulator .tabulator-placeholder');
        expect(demoCss).toContain('background: #fff;');
        expect(demoCss).toContain('grid-template-columns: minmax(0, 920px);');
    });

    test('supports a large showcase variant without changing the default API surface', () => {
        expect(source).toContain('compactHeader = false');
        expect(source).toContain("tableHeight = '340px'");
        expect(source).toContain("variant && variant !== 'default' ? `demo-shell--${variant}` : ''");
        expect(source).toContain("compactHeader ? 'demo-shell--compact-header' : ''");
        expect(source).toContain("app.style.setProperty('--demo-table-height', tableHeight)");
        expect(source).toContain("app.style.removeProperty('--demo-table-height')");
        expect(demoCss).toContain('.demo-showcase--large');
        expect(demoCss).toContain('grid-template-columns: minmax(0, 1fr) minmax(320px, 520px);');
        expect(demoCss).toContain('min-height: var(--demo-table-height, min(760px, 64vh));');
    });
});
