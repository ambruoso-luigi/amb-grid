import { describe, expect, test, vi } from 'vitest';

import { getLookupMetadata } from '../src/lib/lookup-metadata.js';
import { prepareColumnPipeline } from '../src/lib/table/column-pipeline.js';
import { createColumnRuntime } from '../src/lib/table/column-runtime.js';

const createLookupEditor = ({
    description,
    setHandlers = vi.fn()
}) => {
    const lookupInstance = {
        load: vi.fn(async ({ query }) => [{
            code: query,
            description
        }])
    };
    const editor = vi.fn();

    editor._ambEditorType = 'lookup';
    editor._ambLookupConfig = {
        lookupInstance,
        valueField: 'code',
        labelField: 'description',
        context: {
            source: description
        },
        normalizeValue: value => String(value ?? '').trim(),
        normalizeComparableValue: value => String(value ?? '').toLowerCase(),
        showDescription: true
    };
    editor._ambSetLookupErrorHandlers = setHandlers;

    return {
        editor,
        lookupInstance,
        setHandlers
    };
};

const findColumn = (columns, field) => {
    for (const column of columns || []) {
        if (column.field === field) return column;

        const nested = findColumn(column.columns, field);

        if (nested) return nested;
    }

    return null;
};

const createCrudHarness = (initialValidators, runtimeValidator) => {
    const declarative = initialValidators.map(validator => ({
        message: validator.message,
        validateFn: validator.validate
    }));
    const runtime = [{
        message: 'Runtime rule',
        validateFn: runtimeValidator
    }];
    const harness = {
        options: {
            idField: 'id',
            tempIdField: '_ambTempId',
            stateField: '_state'
        },
        declarative,
        runtime,
        validators: [
            ...declarative,
            ...runtime
        ],
        changes: {
            updated: [{
                id: 1,
                name: 'Changed outside the updated field'
            }]
        },
        errors: [{
            id: 1,
            field: 'name',
            message: 'Unrelated application error'
        }],
        markCellError: vi.fn(),
        clearCellError: vi.fn(),
        updateRowFields: vi.fn(),
        replaceDeclarativeCellValidators: vi.fn(function replace(field, validators) {
            expect(field).toBe('status');
            this.declarative = [...validators];
            this.validators = [
                ...this.declarative,
                ...this.runtime
            ];
        })
    };

    return harness;
};

const createHarness = () => {
    const initialLookup = createLookupEditor({
        description: 'Initial description'
    });
    const originalFormatter = vi.fn(cell => String(cell.getValue()));
    const initialValidator = {
        message: 'Initial declarative rule',
        validate: vi.fn(value => Boolean(value))
    };
    const applicationColumns = [{
        title: 'Business data',
        columns: [{
            title: 'Status',
            field: 'status',
            editor: initialLookup.editor,
            formatter: originalFormatter,
            editable: vi.fn(() => true),
            required: true,
            requiredMessage: 'Status is required',
            validator: initialValidator
        }, {
            title: 'Name',
            field: 'name'
        }]
    }];
    const selectionColumn = {
        _ambManagedColumn: 'selection'
    };
    const deleteColumn = {
        _ambManagedColumn: 'delete'
    };
    let crud;
    const pipelineOptions = {
        messages: {
            required: 'Required'
        },
        lookupDescriptions: true,
        getCrud: () => crud,
        selectionColumn,
        deleteColumn
    };
    const initialPipeline = prepareColumnPipeline({
        ...pipelineOptions,
        columns: applicationColumns
    });
    const runtimeValidator = vi.fn(() => true);

    crud = createCrudHarness(initialPipeline.validators, runtimeValidator);

    const rowData = {
        id: 1,
        status: 'A',
        name: 'Changed outside the updated field',
        _state: 'modified',
        _ambLookup: {
            status: {
                initial: {
                    value: 'A',
                    description: 'Stale description'
                },
                current: {
                    value: 'A',
                    description: 'Stale description'
                }
            }
        }
    };
    const row = {
        getData: () => rowData
    };
    const statusComponent = {
        getField: () => 'status',
        getDefinition: () => findColumn(
            initialPipeline.preparedDataColumns,
            'status'
        )
    };
    const selectionComponent = {
        getField: () => false,
        getDefinition: () => selectionColumn
    };
    const deleteComponent = {
        getField: () => false,
        getDefinition: () => deleteColumn
    };
    const groupComponent = {
        getField: () => false,
        getDefinition: () => ({
            title: 'Business data',
            columns: []
        })
    };
    const newComponents = [{
        generation: 1
    }, {
        generation: 2
    }];
    const handlers = new Map();
    const table = {
        getRows: vi.fn(() => [row]),
        getColumn: vi.fn(lookup => {
            if (lookup === 'status' || lookup === statusComponent) {
                return statusComponent;
            }
            if (lookup === 'selection') return selectionComponent;
            if (lookup === 'delete') return deleteComponent;
            if (lookup === 'group') return groupComponent;

            return false;
        }),
        updateColumnDefinition: vi.fn()
            .mockResolvedValueOnce(newComponents[0])
            .mockResolvedValueOnce(newComponents[1]),
        setColumns: vi.fn(),
        on: vi.fn((eventName, handler) => {
            handlers.set(eventName, handler);
        }),
        off: vi.fn()
    };
    const previousLookupUnsubscribe = vi.fn();
    const lifecycleResources = {
        unsubscribeLookupMetadata: previousLookupUnsubscribe
    };
    const searchState = {
        query: 'a',
        selectedFields: ['status'],
        caseSensitive: true,
        wholeWord: false
    };
    const searchController = {
        replaceColumns: vi.fn(),
        getSearchState: vi.fn(() => ({
            ...searchState,
            selectedFields: [...searchState.selectedFields]
        }))
    };
    const columnRuntime = createColumnRuntime({
        table,
        crud,
        initialPipeline,
        pipelineOptions,
        lifecycleResources,
        getSearchController: () => searchController
    });

    return {
        applicationColumns,
        columnRuntime,
        crud,
        deleteColumn,
        initialLookup,
        initialPipeline,
        lifecycleResources,
        newComponents,
        originalFormatter,
        pipelineOptions,
        previousLookupUnsubscribe,
        rowData,
        runtimeValidator,
        searchController,
        searchState,
        selectionColumn,
        statusComponent,
        table
    };
};

describe('AMB Grid managed column definition updates', () => {
    test('commits one prepared nested application column and synchronizes owned resources', async () => {
        const harness = createHarness();
        const nextLookup = createLookupEditor({
            description: 'Updated description'
        });
        const nextDeclarativeValidator = vi.fn(value => value !== 'X');
        const definitionPatch = {
            title: 'Operational status',
            field: 'status',
            editor: nextLookup.editor,
            required: false,
            requiredMessage: 'Unused after update',
            validator: {
                message: 'Updated declarative rule',
                validate: nextDeclarativeValidator
            }
        };
        const originalApplicationSnapshot = {
            root: harness.applicationColumns[0],
            nested: harness.applicationColumns[0].columns,
            status: harness.applicationColumns[0].columns[0],
            validator: harness.applicationColumns[0].columns[0].validator
        };
        const patchSnapshot = {
            ...definitionPatch,
            validator: definitionPatch.validator
        };
        const crudChanges = harness.crud.changes;
        const crudErrors = harness.crud.errors;
        const initialRuntimeColumns = harness.initialPipeline.runtimeColumns;
        const initialSearchState = harness.searchController.getSearchState();

        nextLookup.setHandlers.mockClear();

        const result = harness.columnRuntime.updateColumnDefinition(
            harness.statusComponent,
            definitionPatch
        );

        expect(result).toBeInstanceOf(Promise);
        await expect(result).resolves.toBe(harness.newComponents[0]);

        expect(harness.table.updateColumnDefinition).toHaveBeenCalledOnce();
        expect(harness.table.updateColumnDefinition.mock.calls[0][0])
            .toBe('status');
        const firstPreparedDefinition =
            harness.table.updateColumnDefinition.mock.calls[0][1];

        expect(firstPreparedDefinition).toEqual(expect.objectContaining({
            title: 'Operational status',
            field: 'status',
            editor: nextLookup.editor
        }));
        expect(firstPreparedDefinition).not.toHaveProperty('required');
        expect(firstPreparedDefinition).not.toHaveProperty('requiredMessage');
        expect(firstPreparedDefinition).not.toHaveProperty('validator');
        expect(typeof firstPreparedDefinition.editable).toBe('function');
        expect(firstPreparedDefinition.formatter)
            .not.toBe(harness.originalFormatter);
        expect(harness.table.setColumns).not.toHaveBeenCalled();
        expect(initialRuntimeColumns).toEqual([
            harness.selectionColumn,
            harness.deleteColumn,
            harness.initialPipeline.preparedDataColumns[0]
        ]);
        expect(initialRuntimeColumns.filter(column => column === harness.selectionColumn))
            .toHaveLength(1);
        expect(initialRuntimeColumns.filter(column => column === harness.deleteColumn))
            .toHaveLength(1);

        expect(harness.crud.replaceDeclarativeCellValidators)
            .toHaveBeenCalledOnce();
        expect(harness.crud.declarative).toEqual([{
            message: 'Updated declarative rule',
            validateFn: nextDeclarativeValidator
        }]);
        expect(harness.crud.validators).toEqual([
            {
                message: 'Updated declarative rule',
                validateFn: nextDeclarativeValidator
            },
            {
                message: 'Runtime rule',
                validateFn: harness.runtimeValidator
            }
        ]);

        expect(harness.previousLookupUnsubscribe).toHaveBeenCalledOnce();
        expect(harness.table.on).toHaveBeenCalledTimes(2);
        expect(harness.table.on).toHaveBeenCalledWith(
            'tableBuilt',
            expect.any(Function)
        );
        expect(harness.table.on).toHaveBeenCalledWith(
            'dataLoaded',
            expect.any(Function)
        );
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(harness.rowData.status).toBe('A');
        expect(getLookupMetadata(harness.rowData, 'status').current).toEqual({
            value: 'A',
            description: 'Updated description'
        });
        expect(nextLookup.lookupInstance.load).toHaveBeenCalledOnce();
        expect(nextLookup.setHandlers).toHaveBeenCalledOnce();

        expect(harness.searchController.replaceColumns).toHaveBeenCalledOnce();
        const firstSearchColumns =
            harness.searchController.replaceColumns.mock.calls[0][0];

        expect(findColumn(firstSearchColumns, 'status').title)
            .toBe('Operational status');
        expect(harness.searchController.getSearchState())
            .toEqual(initialSearchState);
        expect(harness.crud.changes).toBe(crudChanges);
        expect(harness.crud.errors).toBe(crudErrors);
        expect(harness.rowData.name)
            .toBe('Changed outside the updated field');
        expect(harness.rowData._state).toBe('modified');

        expect(harness.applicationColumns[0])
            .toBe(originalApplicationSnapshot.root);
        expect(harness.applicationColumns[0].columns)
            .toBe(originalApplicationSnapshot.nested);
        expect(harness.applicationColumns[0].columns[0])
            .toBe(originalApplicationSnapshot.status);
        expect(harness.applicationColumns[0].columns[0].validator)
            .toBe(originalApplicationSnapshot.validator);
        expect(definitionPatch).toEqual(patchSnapshot);
        expect(definitionPatch.validator).toBe(patchSnapshot.validator);

        harness.table.on.mockClear();
        harness.table.off.mockClear();
        harness.crud.replaceDeclarativeCellValidators.mockClear();
        harness.searchController.replaceColumns.mockClear();
        nextLookup.setHandlers.mockClear();

        const secondResult = harness.columnRuntime.updateColumnDefinition(
            'status',
            {
                title: 'Final operational status'
            }
        );

        await expect(secondResult).resolves.toBe(harness.newComponents[1]);

        expect(harness.table.updateColumnDefinition).toHaveBeenCalledTimes(2);
        const secondPreparedDefinition =
            harness.table.updateColumnDefinition.mock.calls[1][1];

        expect(secondPreparedDefinition.title)
            .toBe('Final operational status');
        expect(secondPreparedDefinition.formatter)
            .not.toBe(firstPreparedDefinition.formatter);
        expect(nextLookup.setHandlers).toHaveBeenCalledOnce();
        expect(harness.table.off).toHaveBeenCalledTimes(2);
        expect(harness.table.on).toHaveBeenCalledTimes(2);
        expect(harness.crud.replaceDeclarativeCellValidators)
            .toHaveBeenCalledOnce();
        expect(harness.searchController.replaceColumns).toHaveBeenCalledOnce();
        expect(harness.table.setColumns).not.toHaveBeenCalled();

        const cell = {
            getElement: () => ({
                dataset: {}
            }),
            getField: () => 'status',
            getValue: () => 'A'
        };

        firstPreparedDefinition.formatter(cell);
        secondPreparedDefinition.formatter(cell);
        expect(harness.originalFormatter).toHaveBeenCalledTimes(2);
    });

    test('rejects invalid or managed updates and preserves canonical state on runtime rejection', async () => {
        const harness = createHarness();
        const originalCanonical = harness.columnRuntime.getApplicationColumns();
        const originalStatus = findColumn(originalCanonical, 'status');

        [
            null,
            [],
            'invalid',
            42
        ].forEach(patch => {
            expect(
                harness.columnRuntime.updateColumnDefinition('status', patch)
            ).toBe(false);
        });

        expect(
            harness.columnRuntime.updateColumnDefinition('missing', {
                title: 'Missing'
            })
        ).toBe(false);
        expect(
            harness.columnRuntime.updateColumnDefinition('status', {
                field: 'renamedStatus'
            })
        ).toBe(false);
        expect(
            harness.columnRuntime.updateColumnDefinition('selection', {
                title: 'Selection'
            })
        ).toBe(false);
        expect(
            harness.columnRuntime.updateColumnDefinition('delete', {
                title: 'Delete'
            })
        ).toBe(false);
        expect(
            harness.columnRuntime.updateColumnDefinition('group', {
                title: 'Group'
            })
        ).toBe(false);
        expect(harness.table.updateColumnDefinition).not.toHaveBeenCalled();

        const runtimeError = new Error('Runtime column update failed');

        harness.table.updateColumnDefinition.mockReset();
        harness.table.updateColumnDefinition.mockRejectedValueOnce(runtimeError);

        const rejectedResult = harness.columnRuntime.updateColumnDefinition(
            'status',
            {
                title: 'Rejected title'
            }
        );

        await expect(rejectedResult).rejects.toBe(runtimeError);
        expect(harness.table.updateColumnDefinition).toHaveBeenCalledOnce();
        expect(harness.table.setColumns).not.toHaveBeenCalled();
        expect(harness.columnRuntime.getApplicationColumns())
            .toBe(originalCanonical);
        expect(findColumn(
            harness.columnRuntime.getApplicationColumns(),
            'status'
        )).toBe(originalStatus);
        expect(originalStatus.title).toBe('Status');
        expect(harness.crud.replaceDeclarativeCellValidators)
            .not.toHaveBeenCalled();
        expect(harness.previousLookupUnsubscribe).not.toHaveBeenCalled();
        expect(harness.table.on).not.toHaveBeenCalled();
        expect(harness.table.off).not.toHaveBeenCalled();
        expect(harness.searchController.replaceColumns)
            .not.toHaveBeenCalled();
    });
});
