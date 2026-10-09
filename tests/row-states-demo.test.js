import fs from 'node:fs';
import { describe, expect, test } from 'vitest';

const source = fs.readFileSync(
    new URL('../src/demo/row-states.js', import.meta.url),
    'utf8'
);

describe('Row states demo', () => {
    test('uses the AMB toolbar and standard CRUD actions without loose buttons', () => {
        expect(source).toContain("buttons: [");
        expect(source).toContain("'add'");
        expect(source).toContain("'save'");
        expect(source).toContain("'reload'");
        expect(source).toContain('onAdd: handleAdd');
        expect(source).toContain('onSave: handleSave');
        expect(source).toContain('onReload: handleReload');
        expect(source).not.toContain('<button');
        expect(source).not.toContain('id="state-add"');
        expect(source).not.toContain('id="state-save"');
    });

    test('uses the standard row action column and a compact lifecycle scenario', () => {
        expect(source).toContain('rowActionColumn: {');
        expect(source).toContain('enabled: true');
        expect(source.match(/\{ id: 'REC-\d+', description:/g)).toHaveLength(4);
        expect(source).not.toContain("_state: 'clean'");
        expect(source).toContain("return crud.addRow({");
        expect(source).toContain("description: 'New lifecycle sample'");
        expect(source).toContain('crud.applyBackendIds(generatedIds)');
        expect(source).toContain('crud.markValidChangesSaved()');
    });

    test('uses report dialogs and removes inline report output', () => {
        expect(source).toContain(
            "import { createDemoReportDialog } from './utils/demo-report-dialog.js'"
        );
        expect(source).toContain("title: 'Row states report'");
        expect(source).toContain("title: 'Row numbers'");
        expect(source).toContain('jsonData: report');
        expect(source).toContain('jsonData: rows');
        expect(source).toContain('reportDialog.destroy()');
        expect(source).not.toContain('<pre');
        expect(source).not.toContain('row-states-output');
        expect(source).not.toContain('textContent = JSON.stringify');
    });

    test('uses a numeric derived Errors column without adding an error state', () => {
        expect(source).toContain(
            "summaryKey: 'examples.rowStates.detailsTitle'"
        );
        expect(source).not.toContain('<details class="demo-disclosure" open>');
        expect(source).toContain('ID identifies persisted rows, Temp ID identifies unsaved rows');
        expect(source).toContain('Errors belong to a row or cell and remain conceptually distinct from Deleted.');
        expect(source).toContain("title: 'State'");
        expect(source).toContain("title: 'Errors'");
        expect(source).toContain("field: '_ambErrorCount'");
        expect(source).toContain('const errorCounts = new Map()');
        expect(source).toContain('function formatErrorCount(cell)');
        expect(source).not.toContain("title: 'Health'");
        expect(source).not.toContain("field: '_ambHealth'");
        expect(source).not.toContain('ROW_STATE.ERROR');
        expect(source).not.toContain("_state: 'error'");
        expect(source).toContain("'Lifecycle states'");
        expect(source).toContain("'Errors'");
        expect(source).toContain('Rows with errors: ${report.errorRowsCount}');
        expect(source).toContain('Cell errors: ${report.errors.cells.length}');
        expect(source).toContain('Row errors: ${report.errors.rows.length}');
        expect(source).toContain('buildErrorDetails(report)');
        expect(
            source.match(/cssClass: 'demo-cell--passive demo-cell--derived'/g)
        ).toHaveLength(5);
        expect(source).not.toContain('demo-cell--readonly');
        expect(source).not.toContain("cssClass: 'amb-cell--readonly-passive");
    });

    test('keeps report and row numbers as lifecycle-focused custom actions', () => {
        expect(source).toContain("id: 'state-report'");
        expect(source).toContain("label: 'Report'");
        expect(source).toContain("id: 'state-row-numbers'");
        expect(source).toContain("label: 'Row numbers'");
        expect(source).toContain('async function handleShowStates()');
        expect(source).toContain("demo.updateRow('REC-002', {");
        expect(source).toContain("demo.deleteRow('REC-003')");
        expect(source).toContain("demo.addRow({ id: null, description: 'New vendor risk assessment', type: 'Request' })");
        expect(source).toContain("demo.validateRow('REC-004')");
        expect(source).toContain("AMB.editors.select({ options: ['Request', 'Contract', 'Procedure', 'Compliance', 'Restricted'] })");
        expect(source).toContain("crud.markCellError(row.key, 'type'");
        expect(source).toContain('function refreshErrorCounts()');
        expect(source).toContain("row.getCell('_ambErrorCount')");
        expect(source).toContain('refreshErrorCounts()');
        expect(source).toContain('handleShowStates');
    });

    test('settles active edits before Save and report actions read row state', () => {
        expect(source).toContain('const runAfterEditSettled = callback =>');
        expect(source).toContain('document.activeElement.blur()');
        expect(source).toContain('return runAfterEditSettled(saveChangedRows)');
        expect(source).toContain('return runAfterEditSettled(openStateReport)');
        expect(source).toContain('return runAfterEditSettled(openRowNumbersReport)');
        expect(source).toContain('crud.markValidChangesSaved()');
        expect(source).toContain('There are no valid changes to save.');
    });

    test('reloads the initial lifecycle scenario and closes reports', () => {
        expect(source).toContain('async function handleReload()');
        expect(source).toContain('reportDialog.close()');
        expect(source).toContain('nextId = 5');
        expect(source).toContain('await resetToCleanBaseline();');
        expect(source).toContain('Clean baseline reloaded.');
    });
});
