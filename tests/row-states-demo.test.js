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

    test('uses the standard delete column and an expanded sample dataset', () => {
        expect(source).toContain('deleteColumn: {');
        expect(source).toContain('enabled: true');
        expect(source.match(/\{ id: \d, item:/g)).toHaveLength(6);
        expect(source.match(/_state: 'clean'/g)).toHaveLength(6);
        expect(source).toContain("return crud.addRow({");
        expect(source).toContain("item: 'New sample'");
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
            '<summary class="demo-disclosure__summary">Row states behavior</summary>'
        );
        expect(source).not.toContain('<details class="demo-disclosure" open>');
        expect(source).toContain('<code>clean</code>');
        expect(source).toContain('<code>new</code>');
        expect(source).toContain('<code>modified</code>');
        expect(source).toContain('<code>deleted</code>');
        expect(source).toContain('<code>saved</code>');
        expect(source).toContain('An error is not a lifecycle state.');
        expect(source).toContain("title: 'Lifecycle'");
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
        expect(source).toContain('<code>_ambTempId</code>');
        expect(source).toContain('<code>_ambRowNumber</code>');
        expect(source).toContain('<code>_state</code>');
        expect(
            source.match(/cssClass: 'amb-cell--readonly-passive amb-cell--derived'/g)
        ).toHaveLength(5);
    });

    test('keeps report, row numbers, and error as clearly named custom actions', () => {
        expect(source).toContain("id: 'state-report'");
        expect(source).toContain("label: 'Report'");
        expect(source).toContain("id: 'state-row-numbers'");
        expect(source).toContain("label: 'Row numbers'");
        expect(source).toContain("id: 'state-error'");
        expect(source).toContain("label: 'Create error'");
        expect(source).toContain('crud.updateRowFields(1, {');
        expect(source).toContain("crud.markCellError(1, 'note', 'Manual demo error')");
        expect(source).toContain('crud.updateRowFields(4, {');
        expect(source).toContain(
            "crud.markCellError(4, 'owner', 'Owner is not valid for this demo')"
        );
        expect(source).toContain(
            "crud.markCellError(4, 'note', 'Note requires review')"
        );
        expect(source).toContain('function refreshErrorCounts()');
        expect(source).toContain("row.getCell('_ambErrorCount')");
        expect(source).toContain('refreshErrorCounts()');
        expect(source).toContain('row 1 has 1 error, row 4 has 2 errors');
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

    test('reloads the initial clean data and clears demo error counts', () => {
        expect(source).toContain('async function handleReload()');
        expect(source).toContain('reportDialog.close()');
        expect(source).toContain('crud.rollbackRow(row.key)');
        expect(source).toContain('errorCounts.clear()');
        expect(source).toContain('nextId = 7');
        expect(source).toContain(
            'await demo.table.setData(initialData.map(row => ({ ...row })))'
        );
        expect(source).toContain('Initial row states data reloaded.');
    });
});
