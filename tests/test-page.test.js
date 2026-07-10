import fs from 'node:fs';
import { describe, expect, test } from 'vitest';

const testSource = fs.readFileSync(
    new URL('../src/demo/test.js', import.meta.url),
    'utf8'
);
const testHtml = fs.readFileSync(
    new URL('../test/index.html', import.meta.url),
    'utf8'
);

describe('technical test page', () => {
    test('uses the standard AMB selection column with switchable mode', () => {
        expect(testSource).toContain('selectionColumn: {');
        expect(testSource).toContain('enabled: true');
        expect(testSource).toContain('mode: selectionMode');
        expect(testSource).toContain("const createGrid = async (selectionMode = 'single')");
        expect(testSource).toContain("grid.getSelectedRows()");
        expect(testHtml).toContain('id="selection-mode"');
        expect(testHtml).toContain('value="multiple"');
        expect(testHtml).toContain('<option value="single" selected>');
        expect(testSource).not.toContain('amb-selection-column__input');
        expect(testSource).not.toContain("titleFormatter: 'rowSelection'");
    });

    test('does not load public demo modules or force checkbox labels', () => {
        expect(testSource).not.toContain("import './demo.css'");
        expect(testSource).not.toContain("from './full-demo.js'");
        expect(testSource).not.toContain("from './main.js'");
        expect(testSource).toContain('formatter: AMB.formatters.checkbox()');
        expect(testSource).toContain('editor: AMB.editors.checkbox()');
        expect(testSource).not.toContain("checkedLabel: 'Yes'");
        expect(testSource).not.toContain("uncheckedLabel: 'No'");
    });
});
