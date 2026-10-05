import { describe, expect, test, vi } from 'vitest';
import { normalizeSelectValues, select } from '../src/lib/editors/select-editor.js';
import { prepareColumnPipeline } from '../src/lib/table/column-pipeline.js';

describe('select List adapter', () => {
    test('keeps the public factory contract and marks its internal declaration', () => {
        const editor = select({ options: ['ACTIVE'] });

        expect(typeof editor).toBe('function');
        expect(editor._ambEditorType).toBe('select');
        expect(editor._ambSelectConfig).toMatchObject({ options: ['ACTIVE'], allowEmpty: true });
    });

    test('normalizes simple and object options as string List values', () => {
        expect(normalizeSelectValues({
            allowEmpty: false,
            valueField: 'code',
            labelField: 'name',
            options: ['ACTIVE', { code: 12, name: 'Review' }]
        })).toEqual([
            { value: 'ACTIVE', label: 'ACTIVE' },
            { value: '12', label: 'Review' }
        ]);
    });

    test('adds the public empty option using emptyLabel', () => {
        expect(normalizeSelectValues({ options: ['ACTIVE'], emptyLabel: 'Choose status' })).toEqual([
            { value: '', label: 'Choose status' },
            { value: 'ACTIVE', label: 'ACTIVE' }
        ]);
    });

    test('converts only AMB Select columns to Tabulator List and preserves application callbacks', () => {
        const editing = vi.fn();
        const edited = vi.fn();
        const cancelled = vi.fn();
        const applicationEditor = select({ options: [{ id: 'A', text: 'Active' }], allowEmpty: false, valueField: 'id', labelField: 'text' });
        const pipeline = prepareColumnPipeline({ columns: [
            { field: 'status', editor: applicationEditor, cellEditing: editing, cellEdited: edited, cellEditCancelled: cancelled },
            { field: 'notes', editor: 'textarea' }
        ] });
        const [status, notes] = pipeline.preparedDataColumns;

        expect(pipeline.applicationColumns[0].editor).toBe(applicationEditor);
        expect(status.editor).toBe('list');
        expect(status.editorParams).toEqual({
            values: [{ value: 'A', label: 'Active' }], autocomplete: false,
            verticalNavigation: 'editor', clearable: false, emptyValue: '',
            elementAttributes: { 'data-amb-editor': 'select' }
        });
        expect(notes.editor).toBe('textarea');

        status.cellEditing({ getElement: () => ({}) });
        status.cellEdited({ getElement: () => ({ isConnected: false }) });
        status.cellEditCancelled({ getElement: () => ({ isConnected: false }) });
        expect(editing).toHaveBeenCalledOnce();
        expect(edited).toHaveBeenCalledOnce();
        expect(cancelled).toHaveBeenCalledOnce();
    });

});
