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
        expect(source).toContain('onAdd: handleAdd');
        expect(source).toContain('onSave: handleSave');
        expect(source).not.toContain('<button');
        expect(source).not.toContain('id="state-add"');
        expect(source).not.toContain('id="state-save"');
    });

    test('uses the standard delete column and an expanded sample dataset', () => {
        expect(source).toContain('deleteColumn: {');
        expect(source).toContain('enabled: true');
        expect(source.match(/\{ id: \d, item:/g)).toHaveLength(6);
        expect(source).toContain("crud.addRow({");
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

    test('separates lifecycle state from real error health', () => {
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
        expect(source).toContain("title: 'Health'");
        expect(source).toContain("field: '_ambHealth'");
        expect(source).toContain("return reportRow?.hasErrors ? 'Error' : 'OK'");
        expect(source).not.toContain('ROW_STATE.ERROR');
        expect(source).not.toContain("_state: 'error'");
        expect(source).toContain("'Lifecycle states'");
        expect(source).toContain("'Errors'");
        expect(source).toContain('Rows with errors: ${report.errorRowsCount}');
        expect(source).toContain('Cell errors: ${report.errors.cells.length}');
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
        expect(source).toContain(
            "crud.markCellError(1, 'note', 'Manual demo error')"
        );
        expect(source).toContain('function refreshHealth()');
        expect(source).toContain("row.getCell('_ambHealth')");
        expect(source).toContain('refreshHealth()');
        expect(source).toContain(
            'Lifecycle remains clean; Health is now Error.'
        );
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
});
