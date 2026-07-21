import { describe, expect, test, vi } from 'vitest';

import { createValidationMethods } from '../src/lib/table/controller/validation-methods.js';

const forbiddenCrudMethodNames = [
    'validateChanges',
    'validateRow',
    'getSavePayload',
    'getStateReport',
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
    test('exposes exactly the flat validation controller method', () => {
        const methods = createValidationMethods({
            crud: {
                validateAll: vi.fn()
            }
        });

        expect(Object.keys(methods)).toEqual(['validate']);
        expect(typeof methods.validate).toBe('function');
    });

    test('delegates validation without arguments to the AMB CRUD validation layer', () => {
        const report = {
            isValid: true,
            rows: [],
            errors: []
        };
        const crud = {
            ...createForbiddenCrudMethods(),
            validateAll: vi.fn(() => report)
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
        expectForbiddenCrudMethodsNotCalled(crud);
    });

    test('forwards validation options unchanged and preserves their identity', () => {
        const options = {
            includeDeleted: true
        };
        const emptyOptions = {};
        const crud = {
            ...createForbiddenCrudMethods(),
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
            validateAll: vi.fn(() => report)
        };
        const methods = createValidationMethods({ crud });

        expect(methods.validate()).toBe(report);
        expect(methods.validate().rows).toBe(report.rows);
        expect(methods.validate().errors).toBe(report.errors);
        expect(crud.validateAll).toHaveBeenCalledTimes(3);
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
            validateAll: vi.fn(() => sentinel)
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
        expectForbiddenCrudMethodsNotCalled(crud);
    });
});
