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
const fakeApiSource = fs.readFileSync(
    new URL('../demo/fake-backend/fake-api.js', import.meta.url),
    'utf8'
);
const demoDatabase = JSON.parse(fs.readFileSync(
    new URL('../demo/fake-backend/database.json', import.meta.url),
    'utf8'
));

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
        expect(source).toContain("title: 'Item code'");
        expect(source).toContain("field: 'itemCode'");
        expect(source).toContain("title: 'Product name'");
        expect(source).toContain("field: 'productName'");
        expect(source).toContain("title: 'Warehouse'");
        expect(source).toContain("field: 'warehouse'");
        expect(source).toContain("title: 'Stock quantity'");
        expect(source).toContain("field: 'stockQuantity'");
        expect(source).toContain("title: 'Unit price'");
        expect(source).toContain("field: 'unitPrice'");
        expect(source).toContain('formatter: AMB.formatters.currency()');
        expect(source).toContain("title: 'Last check date'");
        expect(source).toContain("field: 'lastCheckDate'");
        expect(source).toContain("title: 'Status'");
        expect(source).toContain("field: 'status'");
        expect(source).toContain("title: 'Requires inspection'");
        expect(source).toContain("field: 'requiresInspection'");
        expect(source).toContain('formatter: formatInspectionCheckbox');
        expect(source).toContain('editor: AMB.editors.checkbox({');
        expect(source).not.toContain('cellMouseDown: toggleInspectionCheckbox');
        expect(source).toContain('AMB.editors.autocomplete(warehouseOptions, {');
        expect(source).toContain('maxOptions: 8');
        expect(source).toContain('AMB.editors.lookup(statusLookup');
        expect(source).toContain('fakeApi.searchStatuses(query)');
        expect(source).toContain('data: products');
        expect(source).toContain('pagination: true');
        expect(source).toContain('paginationMode: \'local\'');
        expect(source).toContain('paginationSize: 10');
        expect(source).toContain('paginationSizeSelector: [10, 20, 50]');
        expect(source).not.toContain('products.slice(0, 10)');
        expect(source).not.toContain('data: visibleProducts');
        expect(source).not.toContain('addRowPos');
        expect(source).toContain('unique: {');
        expect(source).toContain('minLength: {');
        expect(source).toContain('min: {');
        expect(source).not.toContain("title: 'Category'");
        expect(source).not.toContain("title: 'Minimum stock'");
        expect(source).not.toContain("title: 'Internal code'");
        expect(source).not.toContain('const warehouseLookup = AMB.lookup({');
        expect(source).not.toContain('dialogTitle: \'Search warehouse\'');
    });

    test('includes inventory fields in newly inserted products', () => {
        expect(source).toContain("itemCode: ''");
        expect(source).toContain("productName: ''");
        expect(source).toContain("warehouse: ''");
        expect(source).toContain('stockQuantity: 0');
        expect(source).toContain("unitPrice: ''");
        expect(source).toContain("lastCheckDate: ''");
        expect(source).toContain("status: ''");
        expect(source).toContain('requiresInspection: false');
        expect(source).toContain('crud.getSavePayload()');
    });

    test('uses the same simple Add row pattern as the base demos', () => {
        expect(source).toContain('function handleAdd()');
        expect(source).toContain('demo.feedback.clear()');
        expect(source).toContain('return crud.addRow({');
        expect(source).not.toContain('async function handleAdd()');
        expect(source).not.toContain('await crud.addRow');
        expect(source).not.toContain('setPage(');
        expect(source).not.toContain('scrollToRow');
        expect(source).not.toContain('setTimeout');
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
        expect(source).toContain('class="demo-inventory-panel card bg-base-100 text-base-content"');
        expect(source).toContain('class="demo-app-shell card bg-base-100"');
        expect(source).toContain('data-theme="light"');
        expect(source).toContain('Dati magazzino editabili');
        expect(source).toContain('data-i18n="mainDemo.panelKicker"');
        expect(source).toContain('data-i18n="mainDemo.panelTitle"');
        expect(source).not.toContain('class="demo-app-shell__chips"');
        expect(source).not.toContain('data-i18n="mainDemo.chipPagination"');
        expect(source).not.toContain('data-i18n="mainDemo.chipValidation"');
        expect(demoCss).toContain('.demo-inventory-panel');
        expect(demoCss).toContain('.demo-app-shell__header');
        expect(demoCss).toContain('.demo-panel .amb-feedback-region');
        expect(demoCss).not.toContain('.demo-app-chip');
        expect(demoCss).toContain('@import "tailwindcss" source(none);');
        expect(demoCss).toContain('@plugin "daisyui"');
        expect(demoCss).toContain('.amb-demo-inventory-grid');
        expect(demoCss).toContain('.demo-panel .amb-toolbar {');
        expect(demoCss).toContain('grid-template-columns: minmax(0, 1fr) minmax(280px, 380px);');
        expect(demoCss).toContain('.demo-panel .amb-toolbar__search {');
        expect(source).toContain('class="amb-demo-inventory-grid"');
        expect(demoCss).toContain('.demo-panel .tabulator .tabulator-tableholder,');
        expect(demoCss).toContain('.demo-panel .tabulator .tabulator-placeholder');
        expect(demoCss).toContain('--amb-demo-row-height: 36px;');
        expect(demoCss).toContain('--amb-demo-visible-rows: 10;');
        expect(demoCss).toContain('.demo-panel .amb-demo-inventory-grid .tabulator-tableholder {');
        expect(demoCss).toContain('max-height: calc(var(--amb-demo-row-height, 36px) * var(--amb-demo-visible-rows, 10) + 22px);');
        expect(demoCss).toContain('overflow-y: auto;');
        expect(demoCss).toContain('background: #fff;');
        expect(demoCss).toContain('grid-template-columns: minmax(0, 920px);');
    });

    test('supports a large showcase variant without changing the default API surface', () => {
        expect(source).toContain('compactHeader = false');
        expect(source).toContain('tableHeight = null');
        expect(source).toContain("variant && variant !== 'default' ? `demo-shell--${variant}` : ''");
        expect(source).toContain("compactHeader ? 'demo-shell--compact-header' : ''");
        expect(source).toContain("app.style.setProperty('--demo-table-height', tableHeight)");
        expect(source).toContain("app.style.removeProperty('--demo-table-height')");
        expect(demoCss).toContain('.demo-showcase--large');
        expect(demoCss).toContain('grid-template-columns: minmax(0, 1fr) minmax(320px, 520px);');
        expect(demoCss).toContain('min-height: var(--demo-table-height, 0);');
    });

    test('uses distinct short status codes with descriptive lookup labels', () => {
        const statusIds = demoDatabase.statuses.map(item => item.id);
        const statusDescriptions = demoDatabase.statuses.map(item => item.description);

        expect(statusIds).toEqual(expect.arrayContaining(['A001', 'AB03', 'A085', 'B120', 'C040', 'HOLD', 'DISC']));
        expect(statusIds.length).toBeGreaterThanOrEqual(35);
        expect(statusDescriptions).toContain('Available for standard warehouse picking');
        expect(statusDescriptions).toContain('Low stock: reorder suggested within 7 days');
        expect(statusDescriptions).toContain('Blocked pending quality inspection');
        expect(statusDescriptions).toContain('Reserved for internal maintenance order');
        expect(statusDescriptions).toContain('Discontinued item kept for historical references');
        demoDatabase.statuses.forEach(status => {
            expect(status.description).not.toBe(status.id);
            expect(status.description.length).toBeGreaterThan(status.id.length + 10);
        });
        expect(source).toContain('pageSize: 8');
        expect(source).toContain("controls: 'full'");
    });

    test('uses a long unique warehouse autocomplete list and generates a larger demo dataset', async () => {
        const { fakeApi } = await import('../demo/fake-backend/fake-api.js');
        const warehouses = await fakeApi.getWarehouses();

        expect(fakeApiSource).toContain('const createDemoProducts = (count, warehouses, statuses) =>');
        expect(fakeApiSource).toContain('const warehouseOptions = [');
        expect(fakeApiSource).toContain('warehouses: clone(warehouseOptions)');
        expect(fakeApiSource).toContain('createDemoProducts(100, state.warehouses, state.statuses)');
        expect(fakeApiSource).toContain("field: 'itemCode'");
        expect(fakeApiSource).toContain("message: 'Item code already exists'");
        expect(source).toContain('const warehouseOptions = await fakeApi.getWarehouses()');
        expect(source).toContain('AMB.editors.autocomplete(warehouseOptions, {');
        expect(source).toContain('maxOptions: 8');
        expect(source).not.toContain('fakeApi.searchWarehouses(query)');
        expect(source).not.toContain('warehouseDialog');
        expect(fakeApiSource).not.toContain('const createDemoWarehouses = count =>');
        expect(fakeApiSource).not.toContain('const warehouseAreas = [');
        expect(warehouses.length).toBeGreaterThanOrEqual(50);
        expect(new Set(warehouses).size).toBe(warehouses.length);
        expect(warehouses.every(value => !/^WH-[A-Z][0-9]{2} - /.test(value))).toBe(true);
        expect(warehouses[0]).toBe('Milano Nord Distribution Area');
        expect(warehouses).toContain('Milano Nord Overflow Storage');
        expect(warehouses).toContain('Roma Est Spare Parts Hub');
        expect(warehouses).toContain('Roma Est Fast Picking Line');
        expect(warehouses).toContain('Bologna Central Handling Depot');
        expect(warehouses).toContain('Bologna Quality Check Area');
    });

    test('renders Requires inspection with passive demo visual and AMB checkbox editor', () => {
        expect(source).toContain('const formatInspectionCheckbox = cell =>');
        expect(source).toContain('class="demo-inspection-visual${stateClass}"');
        expect(source).toContain('aria-hidden="true"');
        expect(source).toContain('formatter: formatInspectionCheckbox');
        expect(source).toContain('editor: AMB.editors.checkbox({');
        expect(source).toContain("checkedLabel: ''");
        expect(source).toContain("uncheckedLabel: ''");
        expect(source).not.toContain('const suppressInspectionPointerClick = () =>');
        expect(source).not.toContain('const toggleInspectionCheckbox = (event, cell) =>');
        expect(source).not.toContain('cellMouseDown: toggleInspectionCheckbox');
        expect(source).not.toContain("target.closest('.amb-demo-inventory-grid .tabulator-cell[tabulator-field=\"requiresInspection\"]')");
        expect(source).not.toContain("document.addEventListener('click', handleClick, true)");
        expect(source).not.toContain("document.removeEventListener('click', handleClick, true)");
        expect(source).not.toContain('suppressInspectionPointerClick();');
        expect(source).not.toContain('cell.setValue(cell.getValue() !== true, true);');
        expect(source).not.toContain('cellClick: toggleInspectionCheckbox');
        expect(source).not.toContain('cellClick: releaseInspectionPointerToggle');
        expect(source).not.toContain('const inspectionPointerToggleCells = new WeakSet()');
        expect(source).not.toContain('dataset.demoInspectionPointerToggle');
        expect(source).not.toContain('const shouldEditInspectionCheckbox = cell =>');
        expect(source).not.toContain("classList.contains('tabulator-editing')");
        expect(source).not.toContain("cellElement.querySelector('.amb-checkbox-editor__input')");
        expect(source).not.toContain("dispatchEvent(new Event('change'");
        expect(source).not.toContain('demo-inspection-checkbox');
        expect(source).not.toContain('role="checkbox"');
        expect(source).not.toContain('role="button"');
        expect(source).not.toContain('<button');
        expect(source).not.toContain('tabindex');
        expect(source).not.toContain('addEventListener(\'keydown\'');
        expect(source).not.toContain('const formatBooleanCheck = cell =>');
        expect(source).not.toContain('class="demo-checkbox-input"');
        expect(source).not.toContain('formatter: AMB.formatters.checkbox({');
        expect(source).not.toContain("checkedLabel: 'Yes'");
        expect(source).not.toContain("uncheckedLabel: 'No'");
        expect(demoCss).not.toContain('.demo-checkbox-input');
        expect(demoCss).not.toContain('.demo-panel .amb-demo-inventory-grid .demo-inspection-checkbox');
        expect(demoCss).not.toContain('@keyframes demo-checkbox-pop');
        expect(demoCss).toContain('.demo-panel .amb-demo-inventory-grid .demo-inspection-visual');
        expect(demoCss).toContain('.demo-panel .amb-demo-inventory-grid .demo-inspection-visual.is-checked');
        expect(demoCss).toContain('.demo-panel .tabulator-cell .amb-checkbox-editor');
        expect(demoCss).toContain('justify-content: center;');
    });
});
