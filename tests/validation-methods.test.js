import { describe, expect, test, vi } from 'vitest';

import { createValidationMethods } from '../src/lib/table/controller/validation-methods.js';

const forbiddenCrudMethodNames = [
    'getSavePayload',
    'getStateReport',
    'findRowByKey',
    'updateRowFields',
    'addRow',
    'deleteRow',
    'rollbackRow',
    'clearCellValidation',
    'getInvalidCells'
];

const createForbiddenCrudMethods = () => Object.fromEntries(
    forbiddenCrudMethodNames.map(name => [name, vi.fn()])
);

const expectForbiddenCrudMethodsNotCalled = crud => {
    forbiddenCrudMethodNames.forEach(name => {
        expect(crud[name]).not.toHaveBeenCalled();
    });
};

describe('AMB-aware validation method group', () => {
    test('exposes exactly the flat validation controller methods', () => {
        const methods = createValidationMethods({
            crud: {
                validateAll: vi.fn(),
                validateChanges: vi.fn(),
                validateRow: vi.fn()
            }
        });

        expect(Object.keys(methods).sort()).toEqual([
            'validate',
            'validateChanges',
            'validateRow'
        ]);
        expect(typeof methods.validate).toBe('function');
        expect(typeof methods.validateChanges).toBe('function');
        expect(typeof methods.validateRow).toBe('function');
    });

    test('delegates validation without arguments to the AMB CRUD validation layer', () => {
        const report = {
            isValid: true,
            rows: [],
            errors: []
        };
        const crud = {
            ...createForbiddenCrudMethods(),
            validateAll: vi.fn(() => report),
            validateChanges: vi.fn(),
            validateRow: vi.fn()
        };
        const methods = createValidationMethods({ crud });

        const result = methods.validate();

        expect(crud.validateAll).toHaveBeenCalledOnce();
        expect(crud.validateAll).toHaveBeenCalledWith();
        expect(result).toEqual({
            isValid: true,
            rows: [],
            errors: []
        });
        expect(crud.validateChanges).not.toHaveBeenCalled();
        expect(crud.validateRow).not.toHaveBeenCalled();
        expectForbiddenCrudMethodsNotCalled(crud);
    });

    test('forwards validation options unchanged and preserves their identity', () => {
        const options = {
            includeDeleted: true
        };
        const emptyOptions = {};
        const crud = {
            ...createForbiddenCrudMethods(),
            validateChanges: vi.fn(),
            validateRow: vi.fn(),
            validateAll: vi.fn(() => ({
                isValid: true,
                rows: [],
                errors: []
            }))
        };
        const methods = createValidationMethods({ crud });

        methods.validate(options);
        methods.validate(emptyOptions);

        expect(crud.validateAll).toHaveBeenCalledTimes(2);
        expect(crud.validateAll).toHaveBeenNthCalledWith(1, options);
        expect(crud.validateAll.mock.calls[0][0]).toBe(options);
        expect(crud.validateAll).toHaveBeenNthCalledWith(2, emptyOptions);
        expect(crud.validateAll.mock.calls[1][0]).toBe(emptyOptions);
        expect(crud.validateChanges).not.toHaveBeenCalled();
        expect(crud.validateRow).not.toHaveBeenCalled();
        expectForbiddenCrudMethodsNotCalled(crud);
    });

    test('preserves the structured AMB Grid validation report by identity', () => {
        const report = {
            isValid: false,
            rows: [
                {
                    id: 1,
                    isValid: false,
                    errors: []
                }
            ],
            errors: [
                {
                    id: 1,
                    field: 'name',
                    message: 'Required'
                }
            ]
        };
        const crud = {
            ...createForbiddenCrudMethods(),
            validateAll: vi.fn(() => report),
            validateChanges: vi.fn(),
            validateRow: vi.fn()
        };
        const methods = createValidationMethods({ crud });

        expect(methods.validate()).toBe(report);
        expect(methods.validate().rows).toBe(report.rows);
        expect(methods.validate().errors).toBe(report.errors);
        expect(crud.validateAll).toHaveBeenCalledTimes(3);
        expect(crud.validateChanges).not.toHaveBeenCalled();
        expect(crud.validateRow).not.toHaveBeenCalled();
        expectForbiddenCrudMethodsNotCalled(crud);
    });

    test('preserves sentinel results and does not require a table dependency', () => {
        const sentinel = {
            validation: 'sentinel'
        };
        const row = {
            id: 1,
            _state: 'modified',
            _errors: {
                name: 'Required'
            },
            _ambTempId: 'tmp-1'
        };
        const crud = {
            ...createForbiddenCrudMethods(),
            validateAll: vi.fn(() => sentinel),
            validateChanges: vi.fn(),
            validateRow: vi.fn()
        };
        const methods = createValidationMethods({ crud });

        expect(methods.validate()).toBe(sentinel);
        expect(crud.validateAll).toHaveBeenCalledOnce();
        expect(crud.validateAll).toHaveBeenCalledWith();
        expect(row).toEqual({
            id: 1,
            _state: 'modified',
            _errors: {
                name: 'Required'
            },
            _ambTempId: 'tmp-1'
        });
        expect(methods).not.toHaveProperty('table');
        expect(crud.validateChanges).not.toHaveBeenCalled();
        expect(crud.validateRow).not.toHaveBeenCalled();
        expectForbiddenCrudMethodsNotCalled(crud);
    });

    test('validates pending changes through the CRUD layer only', () => {
        const report = {
            isValid: false,
            rows: [
                {
                    id: 1,
                    isValid: false,
                    errors: [
                        {
                            field: 'name',
                            message: 'Required'
                        }
                    ]
                }
            ],
            errors: [
                {
                    id: 1,
                    field: 'name',
                    message: 'Required'
                }
            ]
        };
        const crud = {
            ...createForbiddenCrudMethods(),
            validateAll: vi.fn(),
            validateChanges: vi.fn(() => report),
            validateRow: vi.fn()
        };
        const methods = createValidationMethods({ crud });

        expect(methods.validateChanges()).toBe(report);
        expect(methods.validateChanges().rows).toBe(report.rows);
        expect(methods.validateChanges().errors).toBe(report.errors);
        expect(crud.validateChanges).toHaveBeenCalledTimes(3);
        crud.validateChanges.mock.calls.forEach(call => {
            expect(call).toEqual([]);
        });
        expect(crud.validateAll).not.toHaveBeenCalled();
        expect(crud.validateRow).not.toHaveBeenCalled();
        expectForbiddenCrudMethodsNotCalled(crud);
    });

    test('preserves empty and sentinel validate-changes reports', () => {
        const emptyReport = {
            isValid: true,
            rows: [],
            errors: []
        };
        const sentinel = {
            validation: 'changes-sentinel'
        };
        const crud = {
            ...createForbiddenCrudMethods(),
            validateAll: vi.fn(),
            validateChanges: vi.fn()
                .mockReturnValueOnce(emptyReport)
                .mockReturnValueOnce(sentinel),
            validateRow: vi.fn()
        };
        const methods = createValidationMethods({ crud });

        expect(methods.validateChanges()).toBe(emptyReport);
        expect(methods.validateChanges()).toBe(sentinel);
        expect(crud.validateChanges).toHaveBeenCalledTimes(2);
        expect(crud.validateChanges).toHaveBeenNthCalledWith(1);
        expect(crud.validateChanges).toHaveBeenNthCalledWith(2);
        expect(crud.validateAll).not.toHaveBeenCalled();
        expect(crud.validateRow).not.toHaveBeenCalled();
        expectForbiddenCrudMethodsNotCalled(crud);
    });

    test('validates one row while forwarding identifiers and options unchanged', () => {
        const options = {
            markDeletedErrors: false
        };
        const rowReport = {
            id: 12,
            tempId: undefined,
            rowNumber: 3,
            isValid: true,
            errors: []
        };
        const crud = {
            ...createForbiddenCrudMethods(),
            validateAll: vi.fn(),
            validateChanges: vi.fn(),
            validateRow: vi.fn().mockReturnValue(rowReport)
        };
        const methods = createValidationMethods({ crud });

        expect(methods.validateRow(12, options)).toBe(rowReport);
        expect(crud.validateRow).toHaveBeenCalledWith(12, options);
        expect(crud.validateRow.mock.calls[0][1]).toBe(options);

        methods.validateRow('amb-temp-1');
        methods.validateRow(0);
        methods.validateRow('');
        methods.validateRow(null);
        methods.validateRow(undefined);

        expect(crud.validateRow).toHaveBeenNthCalledWith(2, 'amb-temp-1');
        expect(crud.validateRow).toHaveBeenNthCalledWith(3, 0);
        expect(crud.validateRow).toHaveBeenNthCalledWith(4, '');
        expect(crud.validateRow).toHaveBeenNthCalledWith(5, null);
        expect(crud.validateRow).toHaveBeenNthCalledWith(6, undefined);
        expect(crud.validateAll).not.toHaveBeenCalled();
        expect(crud.validateChanges).not.toHaveBeenCalled();
        expectForbiddenCrudMethodsNotCalled(crud);
    });

    test('preserves null and sentinel row validation results', () => {
        const sentinel = {
            validation: 'row-sentinel'
        };
        const crud = {
            ...createForbiddenCrudMethods(),
            validateAll: vi.fn(),
            validateChanges: vi.fn(),
            validateRow: vi.fn()
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(sentinel)
        };
        const methods = createValidationMethods({ crud });

        expect(methods.validateRow('missing-row')).toBeNull();
        expect(methods.validateRow('amb-temp-1')).toBe(sentinel);
        expect(crud.validateRow).toHaveBeenCalledTimes(2);
        expect(crud.validateRow).toHaveBeenNthCalledWith(1, 'missing-row');
        expect(crud.validateRow).toHaveBeenNthCalledWith(2, 'amb-temp-1');
        expect(crud.validateAll).not.toHaveBeenCalled();
        expect(crud.validateChanges).not.toHaveBeenCalled();
        expectForbiddenCrudMethodsNotCalled(crud);
    });
});
