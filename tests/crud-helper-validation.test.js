import { describe, expect, test, vi } from 'vitest';
import { CrudHelper, ROW_STATE } from '../src/lib/crud-helper.js';
import { validators } from '../src/lib/validators.js';

const createElementMock = () => ({
    dataset: {},
    title: '',
    removeAttribute(name) {
        if (name === 'title') {
            this.title = '';
        }
    }
});

const createTableMock = rowsData => {
    const table = {
        on: vi.fn(),
        off: vi.fn(),
        getRows: () => rows
    };

    const rows = rowsData.map(data => {
        const rowElement = createElementMock();
        const cells = new Map();
        let row;

        const getCell = field => {
            if (!cells.has(field)) {
                const cellElement = createElementMock();

                cells.set(field, {
                    getField: () => field,
                    getRow: () => row,
                    getValue: () => data[field],
                    getElement: () => cellElement
                });
            }

            return cells.get(field);
        };

        row = {
            getData: () => data,
            getElement: () => rowElement,
            getCell,
            getCells: () => Object.keys(data).map(getCell),
            update: patch => {
                Object.assign(data, patch);
                Object.keys(patch).forEach(getCell);
                return row;
            },
            delete: () => {
                const index = rows.indexOf(row);

                if (index >= 0) {
                    rows.splice(index, 1);
                }
            }
        };

        Object.keys(data).forEach(getCell);

        return row;
    });

    return { table, rows };
};

const createCrud = rowsData => {
    const { table, rows } = createTableMock(rowsData);
    const crud = new CrudHelper(table);

    crud.addCellValidator('alias', 'Alias must be unique', validators.unique().validate);

    return { crud, rows };
};

describe('CrudHelper validation lifecycle', () => {
    test('validateChanges marks only a modified row that duplicates a clean row', () => {
        const { crud } = createCrud([
            { id: 1, alias: 'Atlas' },
            { id: 2, alias: 'Beacon' }
        ]);

        crud.updateRow(2, { alias: 'Atlas' });

        const result = crud.validateChanges();

        expect(result.isValid).toBe(false);
        expect(result.rows).toHaveLength(1);
        expect(result.errors).toEqual([
            expect.objectContaining({
                id: 2,
                field: 'alias',
                message: 'Alias must be unique',
                value: 'Atlas'
            })
        ]);
        expect(crud.cellErrors.has(1)).toBe(false);
        expect(crud.cellErrors.has(2)).toBe(true);
    });

    test('validateChanges marks only a new row that duplicates a clean row', () => {
        const { crud } = createCrud([
            { id: 1, alias: 'Atlas' },
            { id: 2, alias: 'Atlas', _state: ROW_STATE.NEW }
        ]);

        const result = crud.validateChanges();

        expect(result.isValid).toBe(false);
        expect(result.rows).toHaveLength(1);
        expect(result.errors).toEqual([
            expect.objectContaining({
                id: 2,
                field: 'alias',
                message: 'Alias must be unique',
                value: 'Atlas'
            })
        ]);
        expect(crud.cellErrors.has(1)).toBe(false);
        expect(crud.cellErrors.has(2)).toBe(true);
    });

    test('validateChanges does not validate clean rows', () => {
        const { crud } = createCrud([
            { id: 1, alias: 'Atlas' },
            { id: 2, alias: 'Atlas' }
        ]);

        const result = crud.validateChanges();

        expect(result).toEqual({
            isValid: true,
            rows: [],
            errors: []
        });
        expect(crud.cellErrors.size).toBe(0);
    });

    test('validateChanges ignores deleted rows', () => {
        const { crud } = createCrud([
            { id: 1, alias: 'Atlas' },
            { id: 2, alias: 'Atlas', _state: ROW_STATE.DELETED }
        ]);

        const result = crud.validateChanges();

        expect(result).toEqual({
            isValid: true,
            rows: [],
            errors: []
        });
        expect(crud.cellErrors.size).toBe(0);
    });

    test('validateAll continues to audit all active rows', () => {
        const { crud } = createCrud([
            { id: 1, alias: 'Atlas' },
            { id: 2, alias: 'Beacon' }
        ]);

        crud.updateRow(2, { alias: 'Atlas' });

        const result = crud.validateAll();

        expect(result.isValid).toBe(false);
        expect(result.rows).toHaveLength(2);
        expect(result.errors).toEqual([
            expect.objectContaining({ id: 1, field: 'alias', value: 'Atlas' }),
            expect.objectContaining({ id: 2, field: 'alias', value: 'Atlas' })
        ]);
        expect(crud.cellErrors.has(1)).toBe(true);
        expect(crud.cellErrors.has(2)).toBe(true);
    });

    test('rollback clears errors from the affected row', () => {
        const { crud } = createCrud([
            { id: 1, alias: 'Atlas' },
            { id: 2, alias: 'Beacon' }
        ]);

        crud.updateRow(2, { alias: 'Atlas' });
        crud.validateChanges();

        expect(crud.cellErrors.has(2)).toBe(true);

        crud.rollbackRow(2);

        expect(crud.cellErrors.has(2)).toBe(false);
        expect(crud.findRowById(2).getData().alias).toBe('Beacon');
        expect(crud.findRowById(2).getData()._state).toBe(ROW_STATE.CLEAN);
    });

    test('delete clears errors from the affected row', () => {
        const { crud } = createCrud([
            { id: 1, alias: 'Atlas' },
            { id: 2, alias: 'Beacon' }
        ]);

        crud.updateRow(2, { alias: 'Atlas' });
        crud.validateChanges();

        expect(crud.cellErrors.has(2)).toBe(true);

        crud.deleteRow(2);

        expect(crud.cellErrors.has(2)).toBe(false);
        expect(crud.findRowById(2).getData()._state).toBe(ROW_STATE.DELETED);
    });
});
