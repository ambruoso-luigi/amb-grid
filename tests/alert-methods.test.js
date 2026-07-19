import { describe, expect, test, vi } from 'vitest';

import { createAlertMethods } from '../src/lib/table/controller/alert-methods.js';

describe('AMB table controller alert method group', () => {
    test('exposes exactly the flat alert controller methods', () => {
        const methods = createAlertMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'alert',
            'clearAlert'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('delegates table alerts without transforming content, styles or grid state', () => {
        const originalWindow = globalThis.window;
        const originalDocument = globalThis.document;
        const domNode = { nodeType: 1, tagName: 'DIV' };
        const customStyle = { name: 'custom-alert-style' };
        const firstResult = { shown: 'loading' };
        const thirdResult = { shown: 'empty' };
        const fourthResult = { shown: 'custom' };
        const crud = {
            getSavePayload: vi.fn(),
            getStateReport: vi.fn(),
            validateRow: vi.fn(),
            updateRowFields: vi.fn(),
            deleteRow: vi.fn(),
            rollbackRow: vi.fn()
        };
        const table = {
            alert: vi.fn()
                .mockReturnValueOnce(firstResult)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(thirdResult)
                .mockReturnValueOnce(fourthResult),
            clearAlert: vi.fn(),
            getData: vi.fn(),
            getRows: vi.fn(),
            getColumns: vi.fn(),
            setData: vi.fn(),
            replaceData: vi.fn(),
            updateData: vi.fn(),
            setFilter: vi.fn(),
            clearFilter: vi.fn(),
            refreshFilter: vi.fn(),
            setSort: vi.fn(),
            clearSort: vi.fn(),
            setPage: vi.fn(),
            setPageSize: vi.fn(),
            selectRow: vi.fn(),
            deselectRow: vi.fn(),
            redraw: vi.fn(),
            crud
        };
        const methods = createAlertMethods({ table });

        globalThis.window = { alert: vi.fn() };
        globalThis.document = {
            createElement: vi.fn(),
            querySelector: vi.fn(),
            appendChild: vi.fn()
        };

        try {
            expect(methods.alert('Caricamento...')).toBe(firstResult);
            expect(table.alert).toHaveBeenCalledOnce();
            expect(table.alert).toHaveBeenLastCalledWith('Caricamento...');

            expect(methods.alert('Errore', 'error')).toBeUndefined();
            expect(table.alert).toHaveBeenCalledTimes(2);
            expect(table.alert).toHaveBeenLastCalledWith('Errore', 'error');

            expect(methods.alert('', '')).toBe(thirdResult);
            expect(table.alert).toHaveBeenCalledTimes(3);
            expect(table.alert).toHaveBeenLastCalledWith('', '');
            expect(table.alert.mock.calls[2][0]).toBe('');
            expect(table.alert.mock.calls[2][1]).toBe('');

            expect(methods.alert(domNode, customStyle)).toBe(fourthResult);
            expect(table.alert).toHaveBeenCalledTimes(4);
            expect(table.alert).toHaveBeenLastCalledWith(domNode, customStyle);
            expect(table.alert.mock.calls[3][0]).toBe(domNode);
            expect(table.alert.mock.calls[3][1]).toBe(customStyle);
            expect(table.clearAlert).not.toHaveBeenCalled();
            expect(globalThis.window.alert).not.toHaveBeenCalled();
            expect(globalThis.document.createElement).not.toHaveBeenCalled();
            expect(globalThis.document.querySelector).not.toHaveBeenCalled();
            expect(globalThis.document.appendChild).not.toHaveBeenCalled();
            expect(table.redraw).not.toHaveBeenCalled();
            expect(table.getData).not.toHaveBeenCalled();
            expect(table.getRows).not.toHaveBeenCalled();
            expect(table.getColumns).not.toHaveBeenCalled();
            expect(table.setData).not.toHaveBeenCalled();
            expect(table.replaceData).not.toHaveBeenCalled();
            expect(table.updateData).not.toHaveBeenCalled();
            expect(table.setFilter).not.toHaveBeenCalled();
            expect(table.clearFilter).not.toHaveBeenCalled();
            expect(table.refreshFilter).not.toHaveBeenCalled();
            expect(table.setSort).not.toHaveBeenCalled();
            expect(table.clearSort).not.toHaveBeenCalled();
            expect(table.setPage).not.toHaveBeenCalled();
            expect(table.setPageSize).not.toHaveBeenCalled();
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.deselectRow).not.toHaveBeenCalled();
            expect(crud.getSavePayload).not.toHaveBeenCalled();
            expect(crud.getStateReport).not.toHaveBeenCalled();
            expect(crud.validateRow).not.toHaveBeenCalled();
            expect(crud.updateRowFields).not.toHaveBeenCalled();
            expect(crud.deleteRow).not.toHaveBeenCalled();
            expect(crud.rollbackRow).not.toHaveBeenCalled();
        } finally {
            globalThis.window = originalWindow;
            globalThis.document = originalDocument;
        }
    });

    test('delegates alert clearing without touching messages, DOM or data state', () => {
        const originalDocument = globalThis.document;
        const result = { cleared: true };
        const crud = {
            getSavePayload: vi.fn(),
            getStateReport: vi.fn(),
            validateRow: vi.fn(),
            updateRowFields: vi.fn(),
            deleteRow: vi.fn(),
            rollbackRow: vi.fn()
        };
        const floatingMessage = {
            hide: vi.fn(),
            destroy: vi.fn()
        };
        const feedback = {
            clear: vi.fn(),
            destroy: vi.fn()
        };
        const confirmDialog = {
            close: vi.fn(),
            destroy: vi.fn()
        };
        const table = {
            alert: vi.fn(),
            clearAlert: vi.fn()
                .mockReturnValueOnce(result)
                .mockReturnValueOnce(undefined),
            getData: vi.fn(),
            getRows: vi.fn(),
            getColumns: vi.fn(),
            setData: vi.fn(),
            replaceData: vi.fn(),
            updateData: vi.fn(),
            setFilter: vi.fn(),
            clearFilter: vi.fn(),
            refreshFilter: vi.fn(),
            setSort: vi.fn(),
            clearSort: vi.fn(),
            setPage: vi.fn(),
            setPageSize: vi.fn(),
            selectRow: vi.fn(),
            deselectRow: vi.fn(),
            redraw: vi.fn(),
            crud,
            floatingMessage,
            feedback,
            confirmDialog
        };
        const methods = createAlertMethods({ table });

        globalThis.document = {
            createElement: vi.fn(),
            querySelector: vi.fn()
        };

        try {
            expect(methods.clearAlert()).toBe(result);
            expect(table.clearAlert).toHaveBeenCalledOnce();
            expect(table.clearAlert).toHaveBeenLastCalledWith();

            expect(methods.clearAlert()).toBeUndefined();
            expect(table.clearAlert).toHaveBeenCalledTimes(2);
            expect(table.clearAlert).toHaveBeenLastCalledWith();
            expect(table.alert).not.toHaveBeenCalled();
            expect(globalThis.document.createElement).not.toHaveBeenCalled();
            expect(globalThis.document.querySelector).not.toHaveBeenCalled();
            expect(floatingMessage.hide).not.toHaveBeenCalled();
            expect(floatingMessage.destroy).not.toHaveBeenCalled();
            expect(feedback.clear).not.toHaveBeenCalled();
            expect(feedback.destroy).not.toHaveBeenCalled();
            expect(confirmDialog.close).not.toHaveBeenCalled();
            expect(confirmDialog.destroy).not.toHaveBeenCalled();
            expect(table.redraw).not.toHaveBeenCalled();
            expect(table.getData).not.toHaveBeenCalled();
            expect(table.getRows).not.toHaveBeenCalled();
            expect(table.getColumns).not.toHaveBeenCalled();
            expect(table.setData).not.toHaveBeenCalled();
            expect(table.replaceData).not.toHaveBeenCalled();
            expect(table.updateData).not.toHaveBeenCalled();
            expect(table.setFilter).not.toHaveBeenCalled();
            expect(table.clearFilter).not.toHaveBeenCalled();
            expect(table.refreshFilter).not.toHaveBeenCalled();
            expect(table.setSort).not.toHaveBeenCalled();
            expect(table.clearSort).not.toHaveBeenCalled();
            expect(table.setPage).not.toHaveBeenCalled();
            expect(table.setPageSize).not.toHaveBeenCalled();
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.deselectRow).not.toHaveBeenCalled();
            expect(crud.getSavePayload).not.toHaveBeenCalled();
            expect(crud.getStateReport).not.toHaveBeenCalled();
            expect(crud.validateRow).not.toHaveBeenCalled();
            expect(crud.updateRowFields).not.toHaveBeenCalled();
            expect(crud.deleteRow).not.toHaveBeenCalled();
            expect(crud.rollbackRow).not.toHaveBeenCalled();
        } finally {
            globalThis.document = originalDocument;
        }
    });
});
