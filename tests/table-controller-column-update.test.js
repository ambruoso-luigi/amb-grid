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
    const initialEditor = vi.fn();

    initialEditor._ambEditorType = 'text';

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
            editor: initialEditor,
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
        initialEditor,
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

const collectFields = columns => {
    return (columns || []).flatMap(column => {
        return [
            ...(column.field ? [column.field] : []),
            ...collectFields(column.columns)
        ];
    });
};

const createRuntimeComponent = (definition, subColumns = []) => {
    return {
        getDefinition: () => definition,
        getField: () => definition.field || false,
        getSubColumns: () => subColumns
    };
};

const createAddHarness = () => {
    const applicationColumns = [{
        title: 'Name',
        field: 'name'
    }, {
        title: 'Details',
        columns: [{
            title: 'Nested code',
            field: 'nestedCode'
        }]
    }, {
        title: 'Age',
        field: 'age'
    }];
    const selectionColumn = {
        _ambManagedColumn: 'selection'
    };
    const deleteColumn = {
        _ambManagedColumn: 'delete'
    };
    const runtimeValidator = vi.fn(() => true);
    const declarativeByField = new Map();
    const runtimeByField = new Map([
        ['region', [{
            message: 'Existing runtime region rule',
            validateFn: runtimeValidator
        }]]
    ]);
    const crud = {
        options: {
            idField: 'id',
            tempIdField: '_ambTempId',
            stateField: '_state'
        },
        changes: {
            updated: [{
                id: 1,
                name: 'Changed'
            }]
        },
        errors: [{
            id: 1,
            field: 'name',
            message: 'Unrelated error'
        }],
        markCellError: vi.fn(),
        clearCellError: vi.fn(),
        updateRowFields: vi.fn(),
        replaceDeclarativeCellValidators: vi.fn((field, validators) => {
            if (validators.length) {
                declarativeByField.set(field, [...validators]);
            } else {
                declarativeByField.delete(field);
            }
        })
    };
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
    const rowData = {
        id: 1,
        name: 'Changed',
        nestedCode: 'N1',
        age: 42,
        region: 'EU',
        _state: 'modified',
        _ambTempId: 'tmp-existing',
        _ambLookup: {
            region: {
                initial: {
                    value: 'EU',
                    description: 'Untrusted description'
                },
                current: {
                    value: 'EU',
                    description: 'Untrusted description'
                }
            }
        }
    };
    const row = {
        getData: () => rowData
    };
    const selectionComponent = createRuntimeComponent(selectionColumn);
    const deleteComponent = createRuntimeComponent(deleteColumn);
    const nameComponent = createRuntimeComponent(applicationColumns[0]);
    const nestedComponent = createRuntimeComponent(
        applicationColumns[1].columns[0]
    );
    const groupComponent = createRuntimeComponent(
        applicationColumns[1],
        [nestedComponent]
    );
    const ageComponent = createRuntimeComponent(applicationColumns[2]);
    const topLevelComponents = [
        selectionComponent,
        deleteComponent,
        nameComponent,
        groupComponent,
        ageComponent
    ];
    const addedComponents = [];
    const table = {
        getRows: vi.fn(() => [row]),
        getColumns: vi.fn(() => [...topLevelComponents]),
        getColumn: vi.fn(position => {
            if (
                topLevelComponents.includes(position)
                || position === nestedComponent
            ) {
                return position;
            }
            if (position === 'selection') return selectionComponent;
            if (position === 'delete') return deleteComponent;
            if (position === 'name') return nameComponent;
            if (position === 'nestedCode') return nestedComponent;
            if (position === 'age') return ageComponent;

            return topLevelComponents.find(component => {
                return component.getField() === position;
            }) || false;
        }),
        addColumn: vi.fn((definition, before, position) => {
            const component = createRuntimeComponent(definition);
            const positionIndex = position
                ? topLevelComponents.indexOf(position)
                : -1;
            const insertionIndex = positionIndex >= 0
                ? positionIndex + (before === true ? 0 : 1)
                : topLevelComponents.length;

            topLevelComponents.splice(insertionIndex, 0, component);
            addedComponents.push(component);

            return Promise.resolve(component);
        }),
        updateColumnDefinition: vi.fn(),
        setColumns: vi.fn(),
        on: vi.fn(),
        off: vi.fn()
    };
    const previousLookupUnsubscribe = vi.fn();
    const lifecycleResources = {
        unsubscribeLookupMetadata: previousLookupUnsubscribe
    };
    const searchState = {
        query: 'e',
        selectedFields: ['name', 'nestedCode', 'age'],
        caseSensitive: true,
        wholeWord: true
    };
    let availableSearchFields = [...searchState.selectedFields];
    const searchController = {
        replaceColumns: vi.fn(columns => {
            const previouslySelectedAll =
                searchState.selectedFields.length === availableSearchFields.length
                && availableSearchFields.every(field => {
                    return searchState.selectedFields.includes(field);
                });

            availableSearchFields = collectFields(columns);
            searchState.selectedFields = previouslySelectedAll
                ? [...availableSearchFields]
                : searchState.selectedFields.filter(field => {
                    return availableSearchFields.includes(field);
                });
        }),
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
        addedComponents,
        ageComponent,
        applicationColumns,
        columnRuntime,
        crud,
        declarativeByField,
        deleteComponent,
        groupComponent,
        initialPipeline,
        lifecycleResources,
        nameComponent,
        nestedComponent,
        pipelineOptions,
        previousLookupUnsubscribe,
        rowData,
        runtimeByField,
        runtimeValidator,
        searchController,
        searchState,
        selectionComponent,
        table,
        topLevelComponents
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

    test('adds prepared top-level columns while preserving managed placement and owned state', async () => {
        const harness = createAddHarness();
        const lookup = createLookupEditor({
            description: 'European region'
        });
        const declarativeValidator = vi.fn(value => value !== 'blocked');
        const regionDefinition = {
            title: 'Region',
            field: 'region',
            editor: lookup.editor,
            required: true,
            requiredMessage: 'Region is required',
            validator: {
                message: 'Region is blocked',
                validate: declarativeValidator
            }
        };
        const priorityDefinition = {
            title: 'Priority',
            field: 'priority'
        };
        const regionSnapshot = {
            ...regionDefinition,
            validator: regionDefinition.validator
        };
        const prioritySnapshot = {
            ...priorityDefinition
        };
        const canonicalBefore = harness.columnRuntime.getApplicationColumns();
        const changesBefore = harness.crud.changes;
        const errorsBefore = harness.crud.errors;
        const searchBefore = harness.searchController.getSearchState();

        lookup.setHandlers.mockClear();

        const appendedResult = harness.columnRuntime.addColumn(
            regionDefinition,
            'truthy'
        );

        expect(appendedResult).toBeInstanceOf(Promise);
        await expect(appendedResult).resolves.toBe(
            harness.addedComponents[0]
        );

        expect(harness.table.addColumn).toHaveBeenCalledOnce();
        expect(harness.table.addColumn.mock.calls[0]).toHaveLength(2);
        expect(harness.table.addColumn.mock.calls[0][1]).toBe(false);
        const preparedRegion = harness.table.addColumn.mock.calls[0][0];

        expect(preparedRegion).toEqual(expect.objectContaining({
            title: 'Region',
            field: 'region',
            editor: lookup.editor
        }));
        expect(preparedRegion).not.toHaveProperty('required');
        expect(preparedRegion).not.toHaveProperty('requiredMessage');
        expect(preparedRegion).not.toHaveProperty('validator');
        expect(typeof preparedRegion.editable).toBe('function');
        expect(typeof preparedRegion.formatter).toBe('function');
        expect(harness.table.updateColumnDefinition).not.toHaveBeenCalled();
        expect(harness.table.setColumns).not.toHaveBeenCalled();
        expect(harness.topLevelComponents.slice(0, 2)).toEqual([
            harness.selectionComponent,
            harness.deleteComponent
        ]);

        const canonicalAfterAppend =
            harness.columnRuntime.getApplicationColumns();

        expect(canonicalAfterAppend.map(column => {
            return column.field || 'group';
        })).toEqual(['name', 'group', 'age', 'region']);
        expect(canonicalAfterAppend[0]).toBe(canonicalBefore[0]);
        expect(canonicalAfterAppend[1]).toBe(canonicalBefore[1]);
        expect(canonicalAfterAppend[2]).toBe(canonicalBefore[2]);
        expect(canonicalAfterAppend[3]).not.toBe(regionDefinition);
        expect(canonicalAfterAppend[3].editor).toBe(lookup.editor);
        expect(regionDefinition).toEqual(regionSnapshot);
        expect(regionDefinition.validator).toBe(regionSnapshot.validator);

        const regionDeclarative =
            harness.declarativeByField.get('region');

        expect(regionDeclarative).toHaveLength(2);
        expect(regionDeclarative.map(validator => validator.validateFn))
            .toEqual(expect.arrayContaining([
                declarativeValidator,
                expect.any(Function)
            ]));
        expect(harness.runtimeByField.get('region')).toEqual([{
            message: 'Existing runtime region rule',
            validateFn: harness.runtimeValidator
        }]);
        expect(harness.crud.replaceDeclarativeCellValidators)
            .toHaveBeenCalledTimes(1);

        expect(harness.previousLookupUnsubscribe).toHaveBeenCalledOnce();
        expect(harness.table.on).toHaveBeenCalledTimes(2);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(harness.rowData.region).toBe('EU');
        expect(getLookupMetadata(harness.rowData, 'region').current).toEqual({
            value: 'EU',
            description: 'European region'
        });
        expect(lookup.lookupInstance.load).toHaveBeenCalledOnce();
        expect(lookup.setHandlers).toHaveBeenCalledOnce();

        expect(harness.searchController.replaceColumns).toHaveBeenCalledOnce();
        expect(harness.searchController.getSearchState()).toEqual({
            ...searchBefore,
            selectedFields: [
                ...searchBefore.selectedFields,
                'region'
            ]
        });
        expect(harness.crud.changes).toBe(changesBefore);
        expect(harness.crud.errors).toBe(errorsBefore);
        expect(harness.rowData._state).toBe('modified');
        expect(harness.rowData._ambTempId).toBe('tmp-existing');

        harness.table.on.mockClear();
        harness.table.off.mockClear();
        harness.crud.replaceDeclarativeCellValidators.mockClear();
        harness.searchController.replaceColumns.mockClear();
        lookup.setHandlers.mockClear();

        const positionedResult = harness.columnRuntime.addColumn(
            priorityDefinition,
            true,
            harness.ageComponent
        );

        await expect(positionedResult).resolves.toBe(
            harness.addedComponents[1]
        );
        expect(harness.table.addColumn).toHaveBeenCalledTimes(2);
        expect(harness.table.addColumn.mock.calls[1][1]).toBe(true);
        expect(harness.table.addColumn.mock.calls[1][2])
            .toBe(harness.ageComponent);
        expect(harness.table.addColumn.mock.calls[1][0]).toEqual(
            expect.objectContaining(priorityDefinition)
        );
        expect(harness.columnRuntime.getApplicationColumns().map(column => {
            return column.field || 'group';
        })).toEqual([
            'name',
            'group',
            'priority',
            'age',
            'region'
        ]);
        expect(harness.topLevelComponents.slice(0, 2)).toEqual([
            harness.selectionComponent,
            harness.deleteComponent
        ]);
        expect(priorityDefinition).toEqual(prioritySnapshot);
        expect(harness.declarativeByField.has('priority')).toBe(false);
        expect(harness.crud.replaceDeclarativeCellValidators)
            .toHaveBeenCalledOnce();
        expect(harness.crud.replaceDeclarativeCellValidators)
            .toHaveBeenCalledWith('priority', []);
        expect(harness.table.off).toHaveBeenCalledTimes(2);
        expect(harness.table.on).toHaveBeenCalledTimes(2);
        expect(harness.searchController.replaceColumns).toHaveBeenCalledOnce();
        expect(harness.table.updateColumnDefinition).not.toHaveBeenCalled();
        expect(harness.table.setColumns).not.toHaveBeenCalled();
        expect(harness.crud.changes).toBe(changesBefore);
        expect(harness.crud.errors).toBe(errorsBefore);

        const leadingDefinition = {
            title: 'Leading',
            field: 'leading'
        };
        const leadingResult = harness.columnRuntime.addColumn(
            leadingDefinition,
            true
        );

        await expect(leadingResult).resolves.toBe(
            harness.addedComponents[2]
        );
        expect(harness.table.addColumn).toHaveBeenCalledTimes(3);
        expect(harness.table.addColumn.mock.calls[2][1]).toBe(true);
        expect(harness.table.addColumn.mock.calls[2][2])
            .toBe(harness.nameComponent);
        expect(harness.columnRuntime.getApplicationColumns()[0])
            .toEqual(expect.objectContaining(leadingDefinition));
        expect(harness.topLevelComponents.slice(0, 2)).toEqual([
            harness.selectionComponent,
            harness.deleteComponent
        ]);
    });

    test('rejects unsupported additions and preserves canonical state on runtime rejection', async () => {
        const harness = createAddHarness();
        const originalCanonical = harness.columnRuntime.getApplicationColumns();

        [
            null,
            [],
            'invalid',
            42,
            {},
            { field: '' },
            { field: 'group', columns: [] },
            { field: 'name' },
            { field: 'nestedCode' },
            { field: 'managed', _ambManagedColumn: 'custom' },
            { field: '_technical' }
        ].forEach(definition => {
            expect(harness.columnRuntime.addColumn(definition)).toBe(false);
        });

        expect(harness.columnRuntime.addColumn(
            { field: 'missingPosition' },
            false,
            'missing'
        )).toBe(false);
        expect(harness.columnRuntime.addColumn(
            { field: 'selectionPosition' },
            false,
            'selection'
        )).toBe(false);
        expect(harness.columnRuntime.addColumn(
            { field: 'deletePosition' },
            true,
            'delete'
        )).toBe(false);
        expect(harness.columnRuntime.addColumn(
            { field: 'nestedPosition' },
            true,
            'nestedCode'
        )).toBe(false);
        expect(harness.table.addColumn).not.toHaveBeenCalled();

        harness.table.getColumns.mockReturnValueOnce([
            harness.selectionComponent,
            harness.deleteComponent,
            harness.nameComponent,
            harness.ageComponent
        ]);
        expect(harness.columnRuntime.addColumn({
            field: 'misaligned'
        })).toBe(false);
        expect(harness.table.addColumn).not.toHaveBeenCalled();

        const runtimeError = new Error('Runtime column addition failed');

        harness.table.addColumn.mockRejectedValueOnce(runtimeError);

        const rejectedResult = harness.columnRuntime.addColumn({
            title: 'Rejected',
            field: 'rejected'
        });

        await expect(rejectedResult).rejects.toBe(runtimeError);
        expect(harness.table.addColumn).toHaveBeenCalledOnce();
        expect(harness.columnRuntime.getApplicationColumns())
            .toBe(originalCanonical);
        expect(harness.crud.replaceDeclarativeCellValidators)
            .not.toHaveBeenCalled();
        expect(harness.previousLookupUnsubscribe).not.toHaveBeenCalled();
        expect(harness.table.on).not.toHaveBeenCalled();
        expect(harness.table.off).not.toHaveBeenCalled();
        expect(harness.searchController.replaceColumns)
            .not.toHaveBeenCalled();
        expect(harness.table.updateColumnDefinition).not.toHaveBeenCalled();
        expect(harness.table.setColumns).not.toHaveBeenCalled();
        expect(harness.table.addColumn).toHaveBeenCalledTimes(1);
    });
});
