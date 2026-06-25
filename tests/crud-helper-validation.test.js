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
    test('keeps lifecycle state separate from manual cell errors', () => {
        const { crud } = createCrud([
            { id: 1, alias: 'Atlas' }
        ]);

        crud.markCellError(1, 'alias', 'Manual demo error');

        const row = crud.getStateReport().rows[0];

        expect(crud.findRowById(1).getData()._state).toBe(ROW_STATE.CLEAN);
        expect(row.state).toBe(ROW_STATE.CLEAN);
        expect(row.hasErrors).toBe(true);
        expect(row.cellErrors).toEqual([
            { field: 'alias', message: 'Manual demo error' }
        ]);
    });

    test('marks changed valid rows as saved without changing clean rows', () => {
        const { crud } = createCrud([
            { id: 1, alias: 'Atlas' },
            { id: 2, alias: 'Beacon' }
        ]);

        crud.updateRowFields(2, { alias: 'Comet' });

        expect(crud.findRowById(1).getData()._state).toBe(ROW_STATE.CLEAN);
        expect(crud.findRowById(2).getData()._state).toBe(ROW_STATE.MODIFIED);

        const result = crud.markValidChangesSaved();

        expect(result.saved).toHaveLength(1);
        expect(crud.findRowById(1).getData()._state).toBe(ROW_STATE.CLEAN);
        expect(crud.findRowById(2).getData()._state).toBe(ROW_STATE.SAVED);
    });

    test('updates and validates multiple lookup-mapped fields atomically', () => {
        const { table } = createTableMock([
            {
                id: 1,
                istatCode: '065116',
                municipality: 'Salerno',
                province: 'SA',
                postalCode: '84121'
            }
        ]);
        const crud = new CrudHelper(table);

        crud.addCellValidator('istatCode', 'ISTAT code is required', value => Boolean(value));
        crud.addCellValidator('postalCode', 'Postal code is required', value => Boolean(value));

        crud.updateRowFields(1, {
            istatCode: '065078',
            municipality: 'Nocera Inferiore',
            province: 'SA',
            postalCode: '84014'
        });

        const row = crud.findRowById(1);
        const payload = crud.getSavePayload();

        expect(row.getData()).toEqual(expect.objectContaining({
            istatCode: '065078',
            municipality: 'Nocera Inferiore',
            province: 'SA',
            postalCode: '84014',
            _state: ROW_STATE.MODIFIED
        }));
        expect(crud.cellErrors.size).toBe(0);
        expect(payload.changes.updated[0].changedFields).toEqual(
            expect.arrayContaining(['istatCode', 'municipality', 'postalCode'])
        );

        crud.rollbackRow(1);

        expect(row.getData()).toEqual(expect.objectContaining({
            istatCode: '065116',
            municipality: 'Salerno',
            province: 'SA',
            postalCode: '84121',
            _state: ROW_STATE.CLEAN
        }));
    });

    test('keeps new rows new and refuses lookup patches on deleted rows', () => {
        const { table } = createTableMock([
            { id: null, _ambTempId: 'amb-temp-1', municipality: '', _state: ROW_STATE.NEW },
            { id: 2, municipality: 'Salerno', _state: ROW_STATE.DELETED }
        ]);
        const crud = new CrudHelper(table);

        crud.updateRowFields('amb-temp-1', { municipality: 'Nocera Inferiore' });

        expect(crud.findRowByKey('amb-temp-1').getData()).toEqual(expect.objectContaining({
            municipality: 'Nocera Inferiore',
            _state: ROW_STATE.NEW
        }));
        expect(crud.updateRowFields(2, { municipality: 'Nocera Inferiore' })).toBeNull();
        expect(crud.findRowById(2).getData().municipality).toBe('Salerno');
    });

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

    test('validateAll ignores deleted rows by default', () => {
        const { crud } = createCrud([
            { id: 1, alias: 'Atlas' },
            { id: 2, alias: 'Atlas', _state: ROW_STATE.DELETED }
        ]);

        const result = crud.validateAll();

        expect(result.isValid).toBe(true);
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].id).toBe(1);
        expect(result.errors).toEqual([]);
        expect(crud.cellErrors.size).toBe(0);
    });

    test('validateAll can include deleted rows for technical audits', () => {
        const { crud } = createCrud([
            { id: 1, alias: 'Atlas' },
            { id: 2, alias: 'Atlas', _state: ROW_STATE.DELETED }
        ]);

        const result = crud.validateAll({ includeDeleted: true });

        expect(result.isValid).toBe(false);
        expect(result.rows).toHaveLength(2);
        expect(result.errors).toEqual([
            expect.objectContaining({
                id: 2,
                field: 'alias',
                value: 'Atlas'
            })
        ]);
        expect(crud.cellErrors.size).toBe(0);
    });

    test('uses dynamic validator messages and codes when provided', () => {
        const { table } = createTableMock([
            { id: 1, alias: 'Atlas' }
        ]);
        const crud = new CrudHelper(table);

        crud.addCellValidator('alias', 'Fallback message', () => {
            return {
                isValid: false,
                message: 'Dynamic message',
                code: 'dynamic-code'
            };
        });

        const result = crud.validateAll();

        expect(result.errors).toEqual([
            expect.objectContaining({
                id: 1,
                field: 'alias',
                message: 'Dynamic message',
                code: 'dynamic-code'
            })
        ]);
        expect(crud.cellErrors.get(1).get('alias')).toBe('Dynamic message');
    });

    test('validateChanges still validates only new and modified rows', () => {
        const { crud } = createCrud([
            { id: 1, alias: 'Atlas' },
            { id: 2, alias: 'Atlas', _state: ROW_STATE.NEW },
            { id: 3, alias: 'Atlas', _state: ROW_STATE.MODIFIED },
            { id: 4, alias: 'Atlas', _state: ROW_STATE.DELETED }
        ]);

        const result = crud.validateChanges();

        expect(result.isValid).toBe(false);
        expect(result.rows.map(row => row.id)).toEqual([2, 3]);
        expect(result.errors.map(error => error.id)).toEqual([2, 3]);
        expect(crud.cellErrors.has(1)).toBe(false);
        expect(crud.cellErrors.has(2)).toBe(true);
        expect(crud.cellErrors.has(3)).toBe(true);
        expect(crud.cellErrors.has(4)).toBe(false);
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
