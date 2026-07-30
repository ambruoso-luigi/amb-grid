import { describe, expect, test, vi } from 'vitest';

import { CrudHelper, ROW_STATE } from '../src/lib/crud-helper.js';

const createElement = () => ({
    dataset: {},
    title: '',
    removeAttribute(name) {
        if (name === 'title') this.title = '';
    }
});

const createRow = data => {
    const rowElement = createElement();
    const cells = new Map();
    const row = {
        data,
        element: rowElement,
        getData: () => row.data,
        getElement: () => rowElement,
        getCells: () => Array.from(cells.values()),
        getCell: field => cells.get(field) || null,
        getTreeChildren: () => [],
        update: vi.fn(patch => {
            Object.assign(row.data, patch);
            return Promise.resolve();
        })
    };

    Object.keys(data).forEach(field => {
        const element = createElement();
        const cell = {
            getField: () => field,
            getValue: () => row.data[field],
            getRow: () => row,
            getElement: () => element
        };

        cells.set(field, cell);
    });

    row.ensureCell = field => {
        if (cells.has(field)) return cells.get(field);

        const element = createElement();
        const cell = {
            getField: () => field,
            getValue: () => row.data[field],
            getRow: () => row,
            getElement: () => element
        };

        cells.set(field, cell);
        return cell;
    };

    return row;
};

const createHarness = () => {
    const first = createRow({
        id: 1,
        name: 'Ada',
        _ambRowNumber: 1
    });
    const second = createRow({
        id: 2,
        name: 'Grace',
        _ambRowNumber: 2
    });
    const rows = [first, second];
    const listeners = new Map();
    const table = {
        getRows: vi.fn(() => rows),
        on: vi.fn((eventName, callback) => {
            listeners.set(eventName, callback);
        }),
        off: vi.fn((eventName, callback) => {
            if (listeners.get(eventName) === callback) listeners.delete(eventName);
        })
    };
    const crud = new CrudHelper(table);

    return {
        crud,
        first,
        listeners,
        rows,
        second,
        table
    };
};

const cloneOriginalRows = crud => {
    return Array.from(crud.originalRows, ([key, value]) => [
        key,
        structuredClone(value)
    ]);
};

describe('CrudHelper interaction-history reconciliation', () => {
    test('reconciles cellEdit tracking and validation without disturbing other errors or baseline', async () => {
        const { crud, first, second } = createHarness();
        const baseline = cloneOriginalRows(crud);
        const firstCell = first.getCell('name');

        crud.addCellValidator('name', 'Required', value => Boolean(value));
        crud.markRowError(2, 'Manual row error');
        crud.markCellError(2, 'name', 'Other cell error');

        first.data.name = '';
        await crud.reconcileHistoryAction('redo', 'cellEdit', firstCell, {
            oldValue: 'Ada',
            newValue: ''
        });

        expect(first.data._state).toBe(ROW_STATE.MODIFIED);
        expect(crud.modifiedCells.get(1)).toEqual(new Set(['name']));
        expect(crud.cellErrors.get(1).get('name')).toBe('Required');
        expect(crud.rowErrors.get(2)).toBe('Manual row error');
        expect(crud.cellErrors.get(2).get('name')).toBe('Other cell error');
        expect(crud.getSavePayload({ onlyValid: false }).changes.updated).toHaveLength(1);

        first.data.name = 'Ada';
        await crud.reconcileHistoryAction('undo', 'cellEdit', firstCell, {
            oldValue: 'Ada',
            newValue: ''
        });

        expect(first.data._state).toBe(ROW_STATE.CLEAN);
        expect(crud.modifiedCells.has(1)).toBe(false);
        expect(crud.cellErrors.has(1)).toBe(false);
        expect(crud.rowErrors.get(2)).toBe('Manual row error');
        expect(crud.cellErrors.get(2).get('name')).toBe('Other cell error');
        expect(crud.getSavePayload({ onlyValid: false }).changes.updated).toEqual([]);
        expect(cloneOriginalRows(crud)).toEqual(baseline);
        expect(second.data._state).toBe(ROW_STATE.CLEAN);
    });

    test('reconciles the complete add and delete history cycle of a new row', async () => {
        const { crud, rows } = createHarness();
        const baseline = cloneOriginalRows(crud);
        const rowData = {
            id: null,
            name: '',
            _ambTempId: 'amb-temp-9',
            _ambRowNumber: 3,
            _state: ROW_STATE.NEW
        };
        const added = createRow({ ...rowData });

        crud.addCellValidator('name', 'Required', value => Boolean(value));
        rows.push(added);
        crud.modifiedCells.set('amb-temp-9', new Set(['name']));
        crud.markCellError('amb-temp-9', 'name', 'Manual cell error');
        crud.markRowError('amb-temp-9', 'Manual row error');

        rows.splice(rows.indexOf(added), 1);
        await crud.reconcileHistoryAction('undo', 'rowAdd', added, {
            data: rowData
        });

        expect(crud.modifiedCells.has('amb-temp-9')).toBe(false);
        expect(crud.cellErrors.has('amb-temp-9')).toBe(false);
        expect(crud.rowErrors.has('amb-temp-9')).toBe(false);

        const restored = createRow({ ...rowData });

        rows.push(restored);
        await crud.reconcileHistoryAction('redo', 'rowAdd', restored, {
            data: rowData
        });

        expect(restored.data._state).toBe(ROW_STATE.NEW);
        expect(restored.data._ambTempId).toBe('amb-temp-9');
        expect(restored.data._ambRowNumber).toBe(3);
        expect(crud.modifiedCells.has('amb-temp-9')).toBe(false);
        expect(crud.cellErrors.get('amb-temp-9').get('name')).toBe('Required');
        expect(crud.getChanges().inserted).toHaveLength(1);

        crud.markRowError('amb-temp-9', 'Do not restore');
        rows.splice(rows.indexOf(restored), 1);
        await crud.reconcileHistoryAction('redo', 'rowDelete', restored, {
            data: rowData
        });
        expect(crud.rowErrors.has('amb-temp-9')).toBe(false);
        expect(crud.cellErrors.has('amb-temp-9')).toBe(false);

        const restoredAgain = createRow({ ...rowData });

        rows.push(restoredAgain);
        await crud.reconcileHistoryAction('undo', 'rowDelete', restoredAgain, {
            data: rowData
        });
        expect(restoredAgain.data._state).toBe(ROW_STATE.NEW);

        rows.splice(rows.indexOf(restoredAgain), 1);
        await crud.reconcileHistoryAction('redo', 'rowDelete', restoredAgain, {
            data: rowData
        });

        expect(crud.modifiedCells.has('amb-temp-9')).toBe(false);
        expect(crud.getChanges()).toEqual({
            inserted: [],
            updated: [],
            deleted: []
        });
        expect(cloneOriginalRows(crud)).toEqual(baseline);
    });

    test('restores a persisted row by comparing current data with its unchanged snapshot', async () => {
        const { crud, first, rows } = createHarness();
        const baseline = cloneOriginalRows(crud);
        const deletedData = { ...first.data };

        rows.splice(rows.indexOf(first), 1);
        await crud.reconcileHistoryAction('redo', 'rowDelete', first, {
            data: deletedData
        });
        expect(crud.getChanges().deleted).toEqual([]);

        const restored = createRow({
            ...deletedData,
            name: 'Augusta'
        });

        rows.unshift(restored);
        await crud.reconcileHistoryAction('undo', 'rowDelete', restored, {
            data: deletedData
        });

        expect(restored.data._state).toBe(ROW_STATE.MODIFIED);
        expect(crud.modifiedCells.get(1)).toEqual(new Set(['name']));
        expect(crud.getChanges().updated).toHaveLength(1);
        expect(cloneOriginalRows(crud)).toEqual(baseline);
    });

    test('handles rowMove, technical fields and unknown actions without baseline changes', async () => {
        const { crud, first, rows, second } = createHarness();
        const baseline = cloneOriginalRows(crud);
        const payload = crud.getSavePayload();

        rows.splice(0, rows.length, second, first);
        await crud.reconcileHistoryAction('undo', 'rowMove', second, {
            posFrom: 2,
            posTo: 1
        });

        expect(second.data._ambRowNumber).toBe(1);
        expect(first.data._ambRowNumber).toBe(2);
        expect(second.element.dataset.ambRowParity).toBe('odd');
        expect(first.element.dataset.ambRowParity).toBe('even');
        expect(second.data._state).toBe(ROW_STATE.CLEAN);
        expect(first.data._state).toBe(ROW_STATE.CLEAN);
        expect(crud.getSavePayload()).toEqual(payload);
        expect(cloneOriginalRows(crud)).toEqual(baseline);

        first.data._ambRowNumber = 7;
        await crud.reconcileHistoryAction('redo', 'cellEdit', first.getCell('_ambRowNumber'), {
            oldValue: 2,
            newValue: 7
        });

        expect(first.data._state).toBe(ROW_STATE.CLEAN);
        expect(crud.modifiedCells.has(1)).toBe(false);
        expect(crud.getChanges().updated).toEqual([]);
        expect(cloneOriginalRows(crud)).toEqual(baseline);

        await expect(crud.reconcileHistoryAction(
            'undo',
            'futureAction',
            first,
            {}
        )).rejects.toThrow(/unknown history action "futureAction"/);
    });
});
