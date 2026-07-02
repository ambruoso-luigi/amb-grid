import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const readSource = relativePath => {
    return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
};

describe('demo report dialog integration', () => {
    test('opens on Report and switches between Report and JSON views', () => {
        const source = readSource('../src/demo/utils/demo-report-dialog.js');

        expect(source).toContain("import { demoIcon } from '../demo-icons.js'");
        expect(source).toContain("reportButton.innerHTML = `${demoIcon('report')}<span>Report</span>`");
        expect(source).toContain("jsonButton.innerHTML = `${demoIcon('json')}<span>JSON</span>`");
        expect(source).toContain("closeButton.innerHTML = `${demoIcon('arrowRight')}<span>Close</span>`");
        expect(source).toContain("const showReport = () => setView('report')");
        expect(source).toContain("const showJson = () => setView('json')");
        expect(source).toContain("setView('report');");
        expect(source).toContain('report.hidden = !showReport');
        expect(source).toContain('json.hidden = showReport');
        expect(source).toContain('JSON.stringify(jsonData, null, 2)');
        expect(source).toContain("panel.setAttribute('role', 'dialog')");
        expect(source).toContain("panel.setAttribute('aria-modal', 'true')");
        expect(source).not.toContain('Summary');
    });

    test('uses the shared dialog for Basic CRUD show actions', () => {
        const source = readSource('../src/demo/basic-crud.js');

        expect(source).toContain(
            "import { createDemoReportDialog } from './utils/demo-report-dialog.js'"
        );
        expect(source).not.toContain('id="basic-output"');
        expect(source).not.toContain('output.textContent = JSON.stringify');
        expect(source).toContain("title: 'Save payload'");
        expect(source).toContain("title: 'Basic CRUD report'");
        expect(source).toContain("title: 'Selected rows'");

        const saveHandler = source.slice(source.indexOf('async function handleSave()'));

        expect(saveHandler).not.toContain('reportDialog.open');
        expect(saveHandler).toContain("message: 'Save cancelled.'");
    });

    test('uses the same Report/JSON dialog in Validation', () => {
        const source = readSource('../src/demo/validation.js');

        expect(source).toContain(
            "import { createDemoReportDialog } from './utils/demo-report-dialog.js'"
        );
        expect(source).not.toContain('const createReportDialog');
        expect(source).not.toContain('validation-report-dialog__tabs');
        expect(source).not.toContain("textContent = 'Summary'");
        expect(source).not.toContain('Summary');
    });

    test('uses the shared report dialog and integrated toolbar in Autocomplete', () => {
        const source = readSource('../src/demo/autocomplete.js');

        expect(source).toContain(
            "import { createDemoReportDialog } from './utils/demo-report-dialog.js'"
        );
        expect(source).toContain(
            '<summary class="demo-disclosure__summary">Autocomplete behavior</summary>'
        );
        expect(source).toContain("label: 'Validate autocomplete'");
        expect(source).toContain("label: 'Create anomalies'");
        expect(source).toContain("label: 'Reset data'");
        expect(source).toContain("title: 'Autocomplete validation report'");
        expect(source).toContain('data: createAutocompleteData()');
        expect(source).toContain('await demo.table.setData(createAutocompleteData())');
        expect(source).toContain('reportDialog.destroy()');
        expect(source).not.toContain('id="autocomplete-output"');
        expect(source).not.toContain('id="action-create-autocomplete-anomalies"');
    });

    test('configures Validation with useful toolbar actions only', () => {
        const source = readSource('../src/demo/validation.js');
        const toolbarSource = source.slice(
            source.indexOf('toolbar: {'),
            source.indexOf('data: validationData')
        );
        const createAnomaliesHandler = source.slice(
            source.indexOf('async function handleCreateAnomalies()'),
            source.indexOf('function handleShowReport()')
        );

        expect(toolbarSource).toContain("id: 'create-anomalies'");
        expect(toolbarSource).toContain("label: 'Create anomalies'");
        expect(toolbarSource).toContain("id: 'show-report'");
        expect(toolbarSource).toContain("label: 'Show report'");
        expect(toolbarSource).toContain("id: 'reset-data'");
        expect(toolbarSource).toContain("label: 'Reset data'");
        expect(toolbarSource).not.toContain("'add'");
        expect(toolbarSource).not.toContain("'reload'");
        expect(toolbarSource).not.toContain("'save'");
        expect(source).not.toContain('id="action-validate-changes"');
        expect(source).not.toContain('id="action-full-table-audit"');
        expect(source).not.toContain('id="action-create-anomalies"');
        expect(source).not.toContain('id="action-show-report"');
        expect(createAnomaliesHandler).not.toContain('reportDialog.open');
        expect(createAnomaliesHandler).toContain('crud.validateChanges()');
        expect(createAnomaliesHandler).toContain(
            'Anomalies created. Check highlighted cells or open the report.'
        );
        expect(source).toContain('crud.rollbackRow(row.key)');
        expect(source).toContain("message: 'Validation demo data reset.'");
    });

    test('keeps demo guidance compact in closed disclosures', () => {
        const validationSource = readSource('../src/demo/validation.js');
        const basicCrudSource = readSource('../src/demo/basic-crud.js');
        const demoCss = readSource('../src/demo/demo.css');

        expect(validationSource).toContain(
            'Use the toolbar to create intentional validation errors, inspect the report, or reset the demo data.'
        );
        expect(validationSource).toContain(
            '<summary class="demo-disclosure__summary">Validation rules and limits</summary>'
        );
        expect(basicCrudSource).toContain(
            '<summary class="demo-disclosure__summary">Basic CRUD behavior</summary>'
        );
        expect(validationSource).not.toContain('<details class="demo-disclosure" open>');
        expect(basicCrudSource).not.toContain('<details class="demo-disclosure" open>');
        expect(demoCss).toContain('.demo-disclosure__summary');
        expect(demoCss).toContain('.demo-rules-list');
    });

    test('shows Row beside the built-in Add icon without changing accessibility text', () => {
        const toolbarSource = readSource('../src/ui/toolbar.js');
        const libraryCss = readSource('../src/amb-grid.css');

        expect(toolbarSource).toContain("label: 'Row'");
        expect(toolbarSource).toContain("title: 'Add row'");
        expect(libraryCss).not.toContain(
            '.amb-toolbar__button--add .amb-toolbar__button-label {\n    display: none;'
        );
        expect(libraryCss).not.toContain('.amb-toolbar__button--add {\n    font-size: 0;');
    });

    test('keeps report dialog styling in demo CSS only', () => {
        const demoCss = readSource('../src/demo/demo.css');
        const libraryCss = readSource('../src/amb-grid.css');

        expect(demoCss).toContain('.demo-report-dialog__report');
        expect(demoCss).toContain('.demo-report-dialog__json');
        expect(demoCss).toContain('.demo-report-dialog__tab.is-active');
        expect(demoCss).toContain('.demo-report-dialog__report[hidden]');
        expect(libraryCss).not.toContain('.demo-report-dialog');
    });

    test('preserves AMB row parity and restores the previous zebra color', () => {
        const libraryCss = readSource('../src/amb-grid.css');

        expect(libraryCss).toContain('--amb-row-clean-alt-bg: #f7f8fa');
        expect(libraryCss).toContain('[data-amb-row-parity="odd"]');
        expect(libraryCss).toContain('[data-amb-row-parity="even"]');
        expect(libraryCss).not.toContain('.tabulator-row-even');
        expect(libraryCss).not.toContain('.tabulator-row-odd');
        expect(libraryCss).not.toMatch(/nth-child\s*\(/);
    });
});
