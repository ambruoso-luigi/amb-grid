import fs from 'node:fs';
import { describe, expect, test } from 'vitest';
import { publicExampleTranslations } from '../src/demo/example-copy.js';
const source = fs.readFileSync(new URL('../src/demo/crud-row-states.js', import.meta.url), 'utf8');
describe('Unified CRUD & Row States demo', () => {
    test('starts with nine business records and preserves the tutorial record', () => {
        const records = [...source.matchAll(/\{ id: '(REC-\d+)', description: '([^']+)', type: '([^']+)', department: '([^']+)', tag: '([^']+)', archived: '([YN])' \}/g)];
        expect(records.map(record => record[1])).toEqual(Array.from({ length: 9 }, (_, index) => `REC-${String(index + 1).padStart(3, '0')}`));
        expect(records[0].slice(3, 5)).toEqual(['Request', 'Operations']);
        expect(records[3][2]).toBe('Compliance evidence requires review');
        expect(source).toContain("layout: 'fitColumns'");
        expect(source.match(/cssClass: 'demo-cell--passive demo-cell--derived'/g)).toHaveLength(3);
        expect(source).not.toContain("field: '_ambTempId'");
        expect(source).not.toContain("field: '_ambRowNumber'");
    });
    test('prepares valid lifecycle states explicitly and reloads the baseline', () => {
        const prepare = source.slice(source.indexOf('async function handlePrepareStates()'), source.indexOf('async function handleReload()'));
        expect(prepare).toContain('await resetToCleanBaseline()');
        expect(prepare).toContain("demo.updateRow('REC-005', { tag: 'review' })");
        expect(prepare).toContain("demo.deleteRow('REC-003')");
        expect(prepare).toContain('await handleAdd()');
        expect(prepare).not.toContain('REC-002');
        expect(prepare).not.toContain('validateRow');
        expect(prepare).not.toContain('tutorial.notify');
        expect(prepare).not.toContain("description: ''");
        expect(source).toContain('let nextId = 10');
        expect(source).toContain('await demo.setData(initialData.map(row => ({ ...row })))');
    });
    test('preserves public valid-only saving, backend rejection and checkbox editing', () => {
        for (const operation of ['demo.validateChanges()', 'demo.getSavePayload(', 'crud.applyBackendIds(generatedIds)', 'crud.markValidChangesSaved()', "crud.markCellError(row.key, 'type'"]) expect(source).toContain(operation);
        expect(source).toContain("row.after.type === 'Restricted'");
        expect(source).toContain("row.after.type === 'Restricted' && row.after.department !== 'Compliance'");
        expect(source).toContain("crud.clearCellError(key, 'type')");
        expect(source).toContain('error?.message === message');
        expect(source).toContain('serverRejectedRows.delete(key)');
        expect(source).toContain("demo.table.off('cellEdited', handleBackendCorrection)");
        expect(source).toContain("createDemoCheckboxFormatter({ checkedValue: 'Y' })");
        expect(source).toContain("uncheckedValue: 'N'");
        expect(source).toContain('partialSaveDialog.confirm(');
        expect(source).toContain('rowConfirmDialog.confirm(');
        expect(source).not.toContain('backendRetryRows');
        expect(source).not.toContain('result.saved.push(');
        expect(source).not.toContain('row.getElement().dataset.state =');
    });
    test('keeps report, payload, cleanup and translated copy together', () => {
        expect(source).toContain('jsonData: report');
        expect(source).toContain('jsonData: payload');
        expect(source).toContain('row.tempId');
        expect(source).toContain('row.rowNumber');
        for (const resource of ['reportDialog', 'partialSaveDialog', 'rowConfirmDialog', 'commandGuideToolbar']) expect(source).toContain(`${resource}.destroy()`);
        expect(source).toContain("window.removeEventListener('amb-demo-language-change', syncPresentation)");
        const keys = Object.keys(publicExampleTranslations.en).filter(key => key.startsWith('examples.crudRowStates.'));
        expect(keys.length).toBeGreaterThan(50);
        for (const key of keys) expect(publicExampleTranslations.it[key]).toBeTruthy();
        expect(source).not.toContain('ROW_STATE.ERROR');
    });

    test('describes the backend rule and identifies rejected records in both languages', () => {
        for (const locale of ['it', 'en']) {
            const copy = publicExampleTranslations[locale];
            const prefix = 'examples.crudRowStates.';
            expect(copy[`${prefix}backendRejected`]).toContain('{id}');
            expect(copy[`${prefix}backendRejectedMany`]).toContain('{ids}');
            expect(copy[`${prefix}backendRejected`]).toContain('Compliance');
            expect(copy[`${prefix}typeGuide`]).toContain('Compliance');
            expect(copy[`${prefix}backendPartial`]).not.toEqual(copy[`${prefix}backendNotSaved`]);
        }
        expect(source).toContain("t(result.saved.length ? 'backendPartial' : 'backendNotSaved')");
    });
    test('requires a real Department correction and an accepted save in the final phase', () => {
        const finalPhase = source.slice(source.indexOf("id: 'correct-save'"), source.indexOf('const formatArchivedCheckbox'));
        expect(finalPhase).toContain("field === 'department'");
        expect(finalPhase).toContain("previous === 'Operations'");
        expect(finalPhase).toContain("row.after.department === 'Compliance'");
        expect(finalPhase).toContain("row.after.type === 'Restricted'");
        expect(finalPhase).toContain("row.state === 'modified'");
        expect(finalPhase).toContain("saved.some(row => row.id === 'REC-001')");
        for (const locale of ['it', 'en']) {
            const copy = publicExampleTranslations[locale];
            expect(copy['examples.crudRowStates.tutorialCorrectEdit']).toContain('Operations');
            expect(copy['examples.crudRowStates.tutorialCorrectEdit']).toContain('Compliance');
            expect(copy['examples.crudRowStates.tutorialCorrectSave']).toContain(locale === 'en' ? 'Save' : 'Salva');
        }
    });
});
