import fs from 'node:fs';
import { describe, expect, test } from 'vitest';
import { createDemoColumnGuide } from '../src/demo/utils/demo-column-guide.js';

const source = fs.readFileSync(
    new URL('../src/demo/full-demo.js', import.meta.url),
    'utf8'
);
const mainDemoSource = fs.readFileSync(
    new URL('../src/demo/main.js', import.meta.url),
    'utf8'
);
const demoColumnGuideCopySource = fs.readFileSync(
    new URL('../src/demo/demo-column-guide-copy.js', import.meta.url),
    'utf8'
);
const crudRowStatesSource = fs.readFileSync(
    new URL('../src/demo/crud-row-states.js', import.meta.url),
    'utf8'
);
const demoCss = fs.readFileSync(
    new URL('../src/demo/demo.css', import.meta.url),
    'utf8'
);
const checkboxFormatterSource = fs.readFileSync(
    new URL('../src/demo/utils/demo-checkbox.js', import.meta.url),
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
        expect(source).toContain('Demo principale · Legacy-friendly');
        expect(source).toContain('Gestionale Magazzino Classico');
        expect(source).toContain('Demo gestionale classica per contesti server-rendered e legacy-friendly');
        expect(source).not.toContain('Classic Warehouse Backoffice');
        expect(source).toContain('fakeApi.getProducts()');
        expect(source).toContain('fakeApi.saveProductChanges(payload)');
    });

    test('configures the main guide with its rich summary without changing its content', () => {
        expect(source).toContain("summary: 'How this table works'");
        expect(source).toContain("summaryKey: 'mainDemo.guide.summary'");
        expect(source).toContain("summaryIcon: 'guide'");
        expect(source).toContain("summaryDescription: 'Editing, validation, lookup and saving'");
        expect(source).toContain("summaryDescriptionKey: 'mainDemo.guide.summaryDescription'");
        expect(source).toContain("title: 'Edit and add'");
        expect(source).toContain("title: 'Selection and row actions'");
        expect(source).toContain("title: 'Validation and lookup'");
        expect(source).toContain("title: 'Payload and save'");
        expect(source).toContain("title: 'Search and filters'");
        expect(mainDemoSource).toContain("'mainDemo.guide.summary': 'Come funziona questa tabella'");
        expect(mainDemoSource).toContain("'mainDemo.guide.summaryDescription': 'Editing, validazione, lookup e salvataggio'");
        expect(demoColumnGuideCopySource).toContain("'mainDemo.guide.actions.title': 'Selezione e azioni riga'");
        expect(mainDemoSource).toContain("'mainDemo.guide.summary': 'How this table works'");
        expect(mainDemoSource).toContain("'mainDemo.guide.summaryDescription': 'Editing, validation, lookup and saving'");
        expect(demoColumnGuideCopySource).toContain("'mainDemo.guide.actions.title': 'Selection and row actions'");
        expect(source).toContain('bindDemoColumnGuideAnimations, createDemoColumnGuide');
        expect(source).toContain('const destroyColumnGuideAnimations = bindDemoColumnGuideAnimations(app)');
        expect(source).toContain('destroyColumnGuideAnimations();');
        expect(demoCss).toContain('.demo-disclosure__summary-chevron-icon');
        expect(demoCss).toContain('.demo-disclosure--rich {');
        expect(demoCss).toContain('border-left-color: #c8961d;');
        expect(demoCss).toContain('.demo-disclosure--rich::after');
        expect(demoCss).not.toContain('.demo-disclosure--rich::before');
        expect(demoCss).toContain('.demo-disclosure--rich[open] .demo-disclosure__summary-chevron-icon');
        expect(demoCss).toContain('.demo-disclosure__body');
        expect(demoCss).toContain('.demo-disclosure__body-inner');
        expect(demoCss).toContain('@media (prefers-reduced-motion: reduce)');
    });

    test('uses the AMB Grid toolbar instead of external action buttons', () => {
        const toolbarSource = source.slice(
            source.indexOf('toolbar: {'),
            source.indexOf('data: products')
        );
        const actionOrder = [
            "'add'",
            "'reload'",
            "'save'",
            "'payload'",
            "id: 'show-report'",
            "id: 'demo-command-guide'"
        ].map(action => toolbarSource.indexOf(action));

        expect(toolbarSource).toContain('buttons: [');
        actionOrder.forEach(index => expect(index).toBeGreaterThan(-1));
        actionOrder.slice(1).forEach((index, position) => {
            expect(index).toBeGreaterThan(actionOrder[position]);
        });
        expect(toolbarSource).not.toContain("'validate'");
        expect(toolbarSource).not.toContain('onValidate:');
        expect(source).toContain('onAdd: handleAdd');
        expect(source).toContain('onReload: handleReload');
        expect(source).toContain('onSave: handleSave');
        expect(source).toContain('onPayload: handleShowPayload');
        expect(source).not.toContain('function handleValidate()');
        expect(source).not.toContain('id="add-product"');
        expect(source).not.toContain('id="save-products"');
        expect(source).not.toContain('id="product-report"');
        expect(source).not.toContain('<pre class="demo-output" id="inventory-output">');
    });

    test('keeps validation in Save and the main disclosure closed by default', () => {
        const guideMarkup = createDemoColumnGuide({
            summary: 'How this table works',
            columns: []
        });

        expect(source).toContain('demo.validateChanges()');
        expect(source).toContain('openPayloadReport(');
        expect(source).toContain('openStateReport()');
        expect(guideMarkup).toContain('<details class="demo-disclosure">');
        expect(guideMarkup).not.toContain('<details class="demo-disclosure" open>');
    });

    test('uses the shared report dialog for payload, validation, report, and save result', () => {
        expect(source).toContain(
            "import { createDemoReportDialog } from './utils/demo-report-dialog.js'"
        );
        expect(source).toContain('const reportDialog = createDemoReportDialog()');
        expect(source).toContain('openPayloadReport();');
        expect(source).toContain('openStateReport()');
        expect(source).toContain('openValidationReport(validateResult)');
        expect(source).toContain("title: t('saveTitle')");
        expect(source).toContain('reportDialog.destroy()');
    });

    test('includes the current public selection in the state report', () => {
        const stateReportSource = source.slice(
            source.indexOf('function openStateReport()'),
            source.indexOf('function openValidationReport(')
        );

        expect(source).toContain("selectedRows: 'Righe selezionate'");
        expect(source).toContain("selectedRows: 'Selected rows'");
        expect(source).toContain('const selectedRows = demo.getSelectedData()');
        expect(source).not.toContain('demo.table.getSelectedData()');
        expect(stateReportSource).toContain('const report = demo.getStateReport()');
        expect(stateReportSource).not.toContain('crud.getStateReport()');
        expect(stateReportSource).toContain("'grid.getStateReport()'");
        expect(stateReportSource).toContain("'grid.getSelectedData()'");
        expect(source).toContain("`${t('selectedRows')}: ${selectedRows.length}`");
        expect(source).toContain('selection: {');
        expect(source).toContain('count: selectedRows.length');
        expect(source).toContain('selectedRows.map(({ itemCode, productName }) => ({');
    });

    test('labels manual payload and state inspectors with their public APIs', () => {
        const payloadReportSource = source.slice(
            source.indexOf('function openPayloadReport('),
            source.indexOf('function openStateReport()')
        );

        expect(payloadReportSource).toContain("apiMethods: ['grid.getSavePayload()']");
        expect(payloadReportSource).toContain('jsonData: payload');
        expect(payloadReportSource).not.toContain('selectedRows');
        expect(demoCss).toContain('.demo-panel--javascript .amb-toolbar__button--save');
        expect(demoCss).toContain('.demo-panel--javascript .amb-toolbar__button--add');
        expect(demoCss).toContain('.demo-panel--javascript .amb-toolbar__button--reload');
        expect(demoCss).toContain('.demo-panel--javascript .amb-toolbar__button--payload');
    });

    test('reloads table data through fake API without browser reload', () => {
        expect(source).toContain('async function handleReload()');
        expect(source).toContain('const reloadedProducts = await fakeApi.getProducts()');
        expect(source).toContain('await demo.setData(reloadedProducts)');
        expect(source).toContain('demo.clearSelection()');
        expect(source).not.toContain('demo.table.setData(reloadedProducts)');
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
        expect(source).toContain('const statusOptions = (await fakeApi.getStatuses()).map(status => status.id)');
        expect(source).toMatch(/title: 'Status'[\s\S]*?validation: \{[\s\S]*?allowedValues: \{[\s\S]*?values: statusOptions,[\s\S]*?message: 'Unknown status code'/);
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
        expect(source).toContain('demo.getSavePayload({');
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

    test('uses selection, then the standard row action column, before business columns', () => {
        const tableColumnsSource = source.slice(source.indexOf('const tableOptions = {'));
        const selectionColumnIndex = tableColumnsSource.indexOf('selectionColumn: {');
        const rowActionColumnIndex = tableColumnsSource.indexOf('rowActionColumn: {');
        const itemCodeIndex = tableColumnsSource.indexOf("title: 'Item code'");

        expect(selectionColumnIndex).toBeGreaterThan(-1);
        expect(rowActionColumnIndex).toBeGreaterThan(-1);
        expect(itemCodeIndex).toBeGreaterThan(-1);
        expect(selectionColumnIndex).toBeLessThan(rowActionColumnIndex);
        expect(rowActionColumnIndex).toBeLessThan(itemCodeIndex);
        expect(tableColumnsSource).toContain("mode: 'multiple'");
        expect(source).not.toContain('createDemoRowActionColumn');
        expect(source).not.toContain("field: '_demoRowActions'");
        expect(source).toContain('enabled: true');
        expect(source).toContain('width: 55');
        expect(source).toContain("delete: 'Delete product'");
        expect(source).toContain("rollback: 'Rollback product changes'");
        expect(source).toContain("removeNew: 'Remove new product'");
        expect(source).not.toContain("delete: 'Delete this product?'");
        expect(source).not.toContain("rollback: 'Rollback this product?'");
        expect(source).toContain("removeNew: 'Remove this new product?'");
        expect(source).not.toContain('confirmDeleteMessage: demoRowActionMessages.delete');
        expect(source).not.toContain('confirmRollbackMessage: demoRowActionMessages.rollback');
        expect(source).toContain('confirmRemoveNewMessage: demoRowActionMessages.removeNew');
        expect(source).not.toContain('demoRowActionIcons');
        expect(source).not.toMatch(/rowActionColumn: \{[\s\S]*?icons:/);
        expect(source).toContain('labels: demoRowActionLabels');
        expect(source).not.toContain('bindInventoryRowActionKeyboardBridge');
        expect(source).not.toContain('KEYDOWN_EVENT');
        expect(source).not.toContain("addEventListener('keydown'");
        expect(source).not.toContain('addEventListener("keydown"');
        expect(source).not.toContain('preventDefault()');
        expect(source).not.toContain('stopPropagation()');
        expect(source).not.toContain('focus({ preventScroll: true })');
        expect(source).not.toContain('tabindex');
        expect(source).toContain('const partialSaveDialog = new AMB.ConfirmDialog()');
        expect(source).toContain('partialSaveDialog.destroy()');
        expect(source).not.toContain('createDemoRowActionColumn');
        expect(crudRowStatesSource).toContain('rowActionColumn: {');
        expect(crudRowStatesSource).not.toContain('selectionColumn: {');
    });

    test('keeps the Notes large text editor open when its backdrop is clicked', () => {
        expect(source).toMatch(
            /title: 'Notes'[\s\S]*?AMB\.editors\.largeText\(\{[\s\S]*?closeOnBackdropClick: false/
        );
    });

    test('uses valid-only payloads and confirms a partial save before sending it', () => {
        expect(source).toContain("const DEMO_SAVE_POLICY = 'valid-only'");
        expect(source).toContain('const validateResult = demo.validateChanges()');
        expect(source).toContain('savePolicy: DEMO_SAVE_POLICY');
        expect(source).toContain('includeInvalid: true');
        expect(source).toContain('payload.hasChanges === false');
        expect(source).toContain('payload.hasValidChanges === false && payload.hasInvalidChanges === true');
        expect(source).toContain('&& payload.isPartialSave');
        expect(source).toContain('if (!payload.canSave) {');
        expect(source).toContain('await partialSaveDialog.confirm({');
        expect(source).toContain("confirmText: t('partialSaveConfirm')");
        expect(source).toContain("cancelText: t('partialSaveCancel')");
        expect(source).toContain("partialSaveConfirm: 'Salva modifiche valide'");
        expect(source).toContain("partialSaveConfirm: 'Save valid changes'");
        expect(source).toContain('fakeApi.saveProductChanges(payload)');
        expect(source).toContain('crud.applyBackendIds(result.generatedIds || [])');
        expect(source).toContain('crud.markValidChangesSaved()');
        expect(source).toContain('message: payload.isPartialSave ? t(\'partialSaved\') : t(\'saved\')');
    });

    test('confirms only Remove new while reserving ConfirmDialog for partial save', () => {
        expect(source).toContain('rowActionColumn: {');
        expect(source).not.toContain('confirmDeleteMessage: demoRowActionMessages.delete');
        expect(source).not.toContain('confirmRollbackMessage: demoRowActionMessages.rollback');
        expect(source).toContain('confirmRemoveNewMessage: demoRowActionMessages.removeNew');
        expect(source).toContain('const partialSaveDialog = new AMB.ConfirmDialog()');
        expect(source).not.toContain('createDemoRowActionColumn');
        expect(source).not.toContain('bindInventoryRowActionKeyboardBridge');
    });

    test('keeps the main demo toolbar compact and the Tabulator surface clean in demo CSS', () => {
        expect(source).toContain('class="demo-inventory-panel card bg-base-100 text-base-content"');
        expect(source).toContain('class="demo-app-shell card bg-base-100"');
        expect(source).toContain('data-theme="light"');
        expect(source).toContain('data-i18n="mainDemo.kicker">Demo principale · Legacy-friendly');
        expect(source).toContain('data-i18n="mainDemo.title">Gestionale Magazzino Classico');
        expect(source).toContain('data-i18n="mainDemo.description">Demo gestionale classica per contesti server-rendered e legacy-friendly: modifica prodotti, valida i dati e prepara il payload backend nello stesso flusso.');
        expect(source).not.toContain('Pannello operativo');
        expect(source).not.toContain('Dati magazzino editabili');
        expect(source).not.toContain('Scenario: Classic Warehouse Backoffice');
        expect(source).not.toContain('showScenario');
        expect(mainDemoSource).not.toContain('mainDemo.primaryLabel');
        expect(mainDemoSource).not.toContain('mainDemo.scenario');
        expect(mainDemoSource).not.toContain('mainDemo.panelKicker');
        expect(mainDemoSource).not.toContain('mainDemo.panelTitle');
        expect(mainDemoSource).not.toContain('mainDemo.panelText');
        expect(mainDemoSource).toContain("'mainDemo.kicker': 'Demo principale · Legacy-friendly'");
        expect(mainDemoSource).toContain("'mainDemo.kicker': 'Main demo · Legacy-friendly'");
        expect(source).not.toContain('class="demo-app-shell__chips"');
        expect(source).not.toContain('data-i18n="mainDemo.chipPagination"');
        expect(source).not.toContain('data-i18n="mainDemo.chipValidation"');
        expect(demoCss).toContain('.demo-inventory-panel');
        expect(demoCss).toContain('.demo-app-shell__meta h2');
        expect(demoCss).not.toContain('.demo-app-shell__header');
        expect(demoCss).not.toContain('.demo-scenario-label');
        expect(demoCss).not.toContain('.demo-main-badge');
        expect(demoCss).toContain('.demo-panel .amb-feedback-region');
        expect(demoCss).not.toContain('.demo-app-chip');
        expect(demoCss).toContain('@import "tailwindcss" source(none);');
        expect(demoCss).toContain('@plugin "daisyui"');
        expect(demoCss).toContain('.demo-business-grid');
        expect(demoCss).toContain('.demo-panel .amb-toolbar {');
        expect(demoCss).toContain('grid-template-columns: minmax(0, 1fr) minmax(280px, 380px);');
        expect(demoCss).toContain('.demo-panel .amb-toolbar__search {');
        expect(demoCss).toContain('body.demo-main-demo-active .teh-confirm-dialog__message');
        expect(demoCss).toContain('white-space: pre-line;');
        expect(source).toContain('class="amb-demo-inventory-grid demo-business-grid"');
        expect(source).not.toContain('class="amb-demo-inventory-grid demo-business-grid demo-business-grid--viewport"');
        expect(demoCss).toContain('.demo-panel .tabulator .tabulator-tableholder,');
        expect(demoCss).toContain('.demo-panel .tabulator .tabulator-placeholder');
        expect(demoCss).toContain('--amb-demo-row-height: 36px;');
        expect(demoCss).toContain('--amb-demo-visible-rows: 10;');
        expect(demoCss).toContain('.demo-panel .demo-business-grid--viewport .tabulator-tableholder {');
        expect(demoCss).toContain('max-height: calc(var(--amb-demo-row-height, 36px) * var(--amb-demo-visible-rows, 10) + 22px);');
        expect(demoCss).toContain('overflow-y: auto;');
        expect(demoCss).toContain('background: #fff;');
        expect(demoCss).toContain('grid-template-columns: minmax(0, 920px);');
    });

    test('supports a large showcase variant without changing the default API surface', () => {
        expect(source).toContain('compactHeader = false');
        expect(source).toContain('tableHeight = null');
        expect(source).toContain('if (tableHeight) {');
        expect(source).toContain('tableOptions.height = tableHeight');
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
        expect(source).toContain('const formatInspectionCheckbox = createDemoCheckboxFormatter();');
        expect(source).toContain("cssClass: 'demo-business-checkbox-cell'");
        expect(crudRowStatesSource).toContain("createDemoCheckboxFormatter({ checkedValue: 'Y' })");
        expect(checkboxFormatterSource).toContain('class="demo-inspection-visual${stateClass}"');
        expect(checkboxFormatterSource).toContain('aria-hidden="true"');
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
        expect(demoCss).toContain('.demo-panel .demo-business-grid .demo-inspection-visual');
        expect(demoCss).toContain('.demo-panel .demo-business-grid .demo-inspection-visual.is-checked');
        expect(demoCss).toContain('.demo-panel .tabulator-cell .amb-checkbox-editor');
        expect(demoCss).toContain('justify-content: center;');
    });
});
