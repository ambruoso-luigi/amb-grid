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

    test('documents row states and marks technical columns as readonly derived', () => {
        expect(source).toContain(
            '<summary class="demo-disclosure__summary">Row states behavior</summary>'
        );
        expect(source).not.toContain('<details class="demo-disclosure" open>');
        expect(source).toContain('<code>clean</code>');
        expect(source).toContain('<code>new</code>');
        expect(source).toContain('<code>modified</code>');
        expect(source).toContain('<code>deleted</code>');
        expect(source).toContain('<code>saved</code>');
        expect(source).toContain('<code>error</code>');
        expect(source).toContain('<code>_ambTempId</code>');
        expect(source).toContain('<code>_ambRowNumber</code>');
        expect(source).toContain('<code>_state</code>');
        expect(
            source.match(/cssClass: 'amb-cell--readonly-passive amb-cell--derived'/g)
        ).toHaveLength(4);
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
    });
});
