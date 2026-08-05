import { describe, expect, test, vi } from 'vitest';

import { prepareColumnPipeline } from '../src/lib/table/column-pipeline.js';
import { decimal as createDecimalEditor } from '../src/lib/editors/number-editors.js';

const createEditor = (type, metadata = {}) => {
    const editor = vi.fn();

    editor._ambEditorType = type;
    Object.assign(editor, metadata);

    return editor;
};

const createCell = ({
    field = 'field',
    state = 'clean',
    value = 'N'
} = {}) => {
    const element = {
        dataset: {}
    };

    return {
        getElement: () => element,
        getField: () => field,
        getRow: () => ({
            getData: () => ({
                id: 0,
                _state: state
            })
        }),
        getValue: vi.fn(() => value),
        setValue: vi.fn(),
        element
    };
};

const createEvent = ({
    button = 0,
    editorTarget = false
} = {}) => ({
    button,
    target: {
        closest: vi.fn(selector => {
            return selector === '.amb-checkbox-editor' && editorTarget
                ? {}
                : null;
        })
    },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    stopImmediatePropagation: vi.fn()
});

const createLookupEditor = ({
    lookupInstance,
    setHandlers
}) => {
    return createEditor('lookup', {
        _ambLookupConfig: {
            lookupInstance,
            valueField: 'code',
            labelField: 'description',
            context: { source: 'pipeline-test' },
            normalizeValue: value => String(value ?? '').trim(),
            normalizeComparableValue: value => String(value ?? '').toLowerCase(),
            caseSensitive: false,
            showDescription: true
        },
        _ambSetLookupErrorHandlers: setHandlers
    });
};

const findPreparedColumn = (pipeline, field) => {
    return pipeline.preparedDataColumns[0].columns
        .find(column => column.field === field);
};

describe('AMB Grid column preparation pipeline', () => {
    test('adds a decimal formatter from editor metadata while preserving explicit formatters', () => {
        const explicitFormatter = vi.fn(() => 'explicit');
        const commaOptions = { decimalDigits: 2 };
        const dotOptions = {
            decimalDigits: 3,
            decimalSeparator: '.'
        };
        const applicationColumns = [{
            title: 'Decimals',
            columns: [{
                field: 'comma',
                editor: createDecimalEditor(commaOptions)
            },
            {
                field: 'dot',
                editor: createDecimalEditor(dotOptions)
            },
            {
                field: 'explicit',
                editor: createDecimalEditor({ decimalDigits: 4 }),
                formatter: explicitFormatter
            },
            {
                field: 'named',
                editor: createDecimalEditor(),
                formatter: 'plaintext'
            }]
        }];
        const pipeline = prepareColumnPipeline({
            columns: applicationColumns
        });
        const comma = findPreparedColumn(pipeline, 'comma');
        const dot = findPreparedColumn(pipeline, 'dot');
        const explicit = findPreparedColumn(pipeline, 'explicit');
        const named = findPreparedColumn(pipeline, 'named');
        const cell = value => ({ getValue: () => value });

        expect(comma.formatter(cell(120.5))).toBe('120,50');
        expect(dot.formatter(cell(120.5))).toBe('120.500');
        expect(explicit.formatter).toBe(explicitFormatter);
        expect(named.formatter).toBe('plaintext');
        expect(comma.hozAlign).toBe('right');
        expect(dot.hozAlign).toBe('right');
        expect(commaOptions).toEqual({ decimalDigits: 2 });
        expect(dotOptions).toEqual({
            decimalDigits: 3,
            decimalSeparator: '.'
        });
        expect(applicationColumns[0].columns[0]).not.toHaveProperty('formatter');

        const repeated = prepareColumnPipeline({ columns: applicationColumns });

        expect(findPreparedColumn(repeated, 'comma').formatter(cell(120.5)))
            .toBe('120,50');
        expect(findPreparedColumn(repeated, 'explicit').formatter)
            .toBe(explicitFormatter);
    });

    test('prepares nested data and managed runtime columns through one complete sequence', () => {
        const editable = vi.fn(() => true);
        const customValidator = vi.fn(() => true);
        const originalLookupFormatter = vi.fn(() => '<strong>Active</strong>');
        const originalCheckboxMouseDown = vi.fn(() => 'application-result');
        const lookupInstance = {
            load: vi.fn(() => Promise.resolve([]))
        };
        let lookupHandlers;
        const setLookupHandlers = vi.fn(handlers => {
            lookupHandlers = handlers;
        });
        const textEditor = createEditor('text');
        const numericEditor = createEditor('integer');
        const dateEditor = createEditor('date');
        const lookupEditor = createLookupEditor({
            lookupInstance,
            setHandlers: setLookupHandlers
        });
        const checkboxEditor = createEditor('checkbox', {
            _ambCheckboxConfig: {
                checkedValue: 'Y',
                uncheckedValue: 'N'
            }
        });
        const columns = [
            {
                title: 'Application data',
                columns: [
                    {
                        field: 'name',
                        editor: textEditor,
                        editable,
                        required: true,
                        validation: {
                            minLength: {
                                value: 2,
                                message: 'Name is too short'
                            }
                        },
                        validator: {
                            message: 'Custom name error',
                            validate: customValidator
                        }
                    },
                    {
                        field: 'amount',
                        editor: numericEditor
                    },
                    {
                        field: 'createdAt',
                        editor: dateEditor,
                        hozAlign: 'left'
                    },
                    {
                        field: 'status',
                        editor: lookupEditor,
                        formatter: originalLookupFormatter
                    },
                    {
                        field: 'enabled',
                        editor: checkboxEditor,
                        cellMouseDown: originalCheckboxMouseDown
                    }
                ]
            }
        ];
        const selectionColumn = {
            cssClass: 'amb-selection-column'
        };
        const deleteColumn = {
            cssClass: 'amb-action-column'
        };
        const crud = {
            options: {
                idField: 'id',
                tempIdField: '_ambTempId',
                stateField: '_state'
            },
            markCellError: vi.fn(),
            clearCellError: vi.fn(),
            updateRowFields: vi.fn(() => ({ component: 'updated-row' }))
        };

        const pipeline = prepareColumnPipeline({
            columns,
            messages: {
                required: 'Name is required'
            },
            getCrud: () => crud,
            selectionColumn,
            deleteColumn
        });
        const preparedName = findPreparedColumn(pipeline, 'name');
        const preparedAmount = findPreparedColumn(pipeline, 'amount');
        const preparedDate = findPreparedColumn(pipeline, 'createdAt');
        const preparedLookup = findPreparedColumn(pipeline, 'status');
        const preparedCheckbox = findPreparedColumn(pipeline, 'enabled');

        expect(pipeline.runtimeColumns).toEqual([
            selectionColumn,
            deleteColumn,
            pipeline.preparedDataColumns[0]
        ]);
        expect(pipeline.runtimeColumns[0]).toBe(selectionColumn);
        expect(pipeline.runtimeColumns[1]).toBe(deleteColumn);
        expect(pipeline.searchColumns).toBe(pipeline.preparedDataColumns);
        expect(pipeline.searchColumns).not.toContain(selectionColumn);
        expect(pipeline.searchColumns).not.toContain(deleteColumn);
        expect(pipeline.validators).toHaveLength(3);
        expect(pipeline.validators.map(validator => validator.field))
            .toEqual(['name', 'name', 'name']);
        expect(pipeline.lookupColumns).toEqual([
            expect.objectContaining({
                field: 'status',
                lookupInstance
            })
        ]);
        expect(preparedName).not.toHaveProperty('required');
        expect(preparedName).not.toHaveProperty('validation');
        expect(preparedName).not.toHaveProperty('validator');
        expect(preparedName.editor).toBe(textEditor);
        expect(preparedName.editable).not.toBe(editable);
        expect(preparedAmount.hozAlign).toBe('right');
        expect(preparedDate.hozAlign).toBe('left');
        expect(preparedLookup.editor).toBe(lookupEditor);
        expect(preparedLookup.formatter).not.toBe(originalLookupFormatter);
        expect(preparedCheckbox.editor).toBe(checkboxEditor);
        expect(preparedCheckbox.cellMouseDown)
            .not.toBe(originalCheckboxMouseDown);
        expect(setLookupHandlers).toHaveBeenCalledOnce();

        const lookupCell = createCell({ field: 'status' });

        lookupHandlers.markInvalid(lookupCell, 'Invalid status');
        lookupHandlers.clearInvalid(lookupCell);
        expect(lookupHandlers.applyRecord(lookupCell, { status: 'A' }))
            .toEqual({ component: 'updated-row' });
        expect(crud.markCellError)
            .toHaveBeenCalledWith(0, 'status', 'Invalid status');
        expect(crud.clearCellError).toHaveBeenCalledWith(0, 'status');
        expect(crud.updateRowFields)
            .toHaveBeenCalledWith(0, { status: 'A' });

        expect(preparedLookup.formatter(
            lookupCell,
            { format: true },
            'rendered'
        )).toBe('<strong>Active</strong>');
        expect(originalLookupFormatter).toHaveBeenCalledOnce();
        expect(lookupCell.element.dataset.lookupField).toBe('status');
    });

    test('preserves application arrays, column objects, nested configuration, and callbacks', () => {
        const editable = vi.fn(() => true);
        const validator = {
            message: 'Custom validation',
            validate: vi.fn(() => true)
        };
        const validation = {
            required: {
                message: 'Required'
            }
        };
        const originalFormatter = vi.fn(() => 'formatted');
        const originalCellMouseDown = vi.fn();
        const editorConfig = {
            lookupInstance: {
                load: vi.fn(() => Promise.resolve([]))
            },
            valueField: 'code',
            labelField: 'description',
            showDescription: true
        };
        const lookupEditor = createEditor('lookup', {
            _ambLookupConfig: editorConfig,
            _ambSetLookupErrorHandlers: vi.fn()
        });
        const checkboxEditor = createEditor('checkbox');
        const textColumn = {
            field: 'name',
            editor: createEditor('text'),
            editable,
            required: true,
            validation,
            validator
        };
        const lookupColumn = {
            field: 'status',
            editor: lookupEditor,
            formatter: originalFormatter
        };
        const checkboxColumn = {
            field: 'enabled',
            editor: checkboxEditor,
            cellMouseDown: originalCellMouseDown
        };
        const childColumns = [
            textColumn,
            lookupColumn,
            checkboxColumn
        ];
        const group = {
            title: 'Group',
            columns: childColumns
        };
        const columns = [group];

        const pipeline = prepareColumnPipeline({
            columns
        });

        expect(columns).toEqual([group]);
        expect(columns[0]).toBe(group);
        expect(group.columns).toBe(childColumns);
        expect(childColumns[0]).toBe(textColumn);
        expect(childColumns[1]).toBe(lookupColumn);
        expect(childColumns[2]).toBe(checkboxColumn);
        expect(textColumn.required).toBe(true);
        expect(textColumn.validation).toBe(validation);
        expect(textColumn.validator).toBe(validator);
        expect(textColumn.editable).toBe(editable);
        expect(lookupColumn.editor).toBe(lookupEditor);
        expect(lookupColumn.formatter).toBe(originalFormatter);
        expect(lookupEditor._ambLookupConfig).toBe(editorConfig);
        expect(checkboxColumn.cellMouseDown).toBe(originalCellMouseDown);
        expect(checkboxColumn).not.toHaveProperty('hozAlign');
        expect(pipeline.applicationColumns).not.toBe(columns);
        expect(pipeline.applicationColumns[0]).not.toBe(group);
        expect(pipeline.applicationColumns[0].columns).not.toBe(childColumns);
        expect(pipeline.applicationColumns[0].columns[0].validation)
            .toBe(validation);
        expect(pipeline.applicationColumns[0].columns[0].validator)
            .toBe(validator);
    });

    test('repeated preparation creates independent wrappers without duplicated behavior', () => {
        const editable = vi.fn(() => true);
        const originalFormatter = vi.fn(() => 'lookup output');
        const originalCellMouseDown = vi.fn(() => 'application-result');
        const setLookupHandlers = vi.fn();
        const lookupEditor = createLookupEditor({
            lookupInstance: {
                load: vi.fn(() => Promise.resolve([]))
            },
            setHandlers: setLookupHandlers
        });
        const columns = [
            {
                title: 'Repeated',
                columns: [
                    {
                        field: 'name',
                        editor: createEditor('text'),
                        editable,
                        required: true
                    },
                    {
                        field: 'status',
                        editor: lookupEditor,
                        formatter: originalFormatter
                    },
                    {
                        field: 'enabled',
                        editor: createEditor('checkbox', {
                            _ambCheckboxConfig: {
                                checkedValue: 'Y',
                                uncheckedValue: 'N'
                            }
                        }),
                        cellMouseDown: originalCellMouseDown
                    }
                ]
            }
        ];
        const selectionColumn = {
            cssClass: 'amb-selection-column'
        };
        const deleteColumn = {
            cssClass: 'amb-action-column'
        };
        const getCrud = () => ({
            options: {
                idField: 'id',
                tempIdField: '_ambTempId',
                stateField: '_state'
            }
        });

        const first = prepareColumnPipeline({
            columns,
            getCrud,
            selectionColumn,
            deleteColumn
        });
        const firstEditable = findPreparedColumn(first, 'name').editable;
        const firstLookupFormatter = findPreparedColumn(first, 'status').formatter;
        const firstCheckboxMouseDown = findPreparedColumn(first, 'enabled')
            .cellMouseDown;
        const second = prepareColumnPipeline({
            columns,
            getCrud,
            selectionColumn,
            deleteColumn
        });
        const secondEditable = findPreparedColumn(second, 'name').editable;
        const secondLookupFormatter = findPreparedColumn(second, 'status').formatter;
        const secondCheckboxMouseDown = findPreparedColumn(second, 'enabled')
            .cellMouseDown;

        expect(first.runtimeColumns).toHaveLength(3);
        expect(second.runtimeColumns).toHaveLength(3);
        expect(first.validators).toHaveLength(1);
        expect(second.validators).toHaveLength(1);
        expect(first.lookupColumns).toHaveLength(1);
        expect(second.lookupColumns).toHaveLength(1);
        expect(first.runtimeColumns.filter(column => column === selectionColumn))
            .toHaveLength(1);
        expect(second.runtimeColumns.filter(column => column === selectionColumn))
            .toHaveLength(1);
        expect(first.runtimeColumns.filter(column => column === deleteColumn))
            .toHaveLength(1);
        expect(second.runtimeColumns.filter(column => column === deleteColumn))
            .toHaveLength(1);
        expect(firstEditable).not.toBe(secondEditable);
        expect(firstLookupFormatter).not.toBe(secondLookupFormatter);
        expect(firstCheckboxMouseDown).not.toBe(secondCheckboxMouseDown);
        expect(findPreparedColumn(first, 'name').editable).toBe(firstEditable);
        expect(findPreparedColumn(first, 'status').formatter)
            .toBe(firstLookupFormatter);
        expect(findPreparedColumn(first, 'enabled').cellMouseDown)
            .toBe(firstCheckboxMouseDown);
        expect(setLookupHandlers).toHaveBeenCalledTimes(2);

        const cleanCell = createCell({ field: 'name' });
        const deletedCell = createCell({
            field: 'name',
            state: 'deleted'
        });

        expect(secondEditable(cleanCell)).toBe(true);
        expect(secondEditable(deletedCell)).toBe(false);
        expect(editable).toHaveBeenCalledOnce();

        const lookupCell = createCell({ field: 'status' });

        expect(secondLookupFormatter(lookupCell)).toBe('lookup output');
        expect(originalFormatter).toHaveBeenCalledOnce();

        const checkboxCell = createCell({
            field: 'enabled',
            value: 'N'
        });

        expect(secondCheckboxMouseDown(
            createEvent({ button: 2 }),
            checkboxCell
        )).toBe('application-result');
        expect(originalCellMouseDown).toHaveBeenCalledOnce();

        secondCheckboxMouseDown(createEvent(), checkboxCell);
        expect(checkboxCell.setValue).toHaveBeenCalledOnce();
        expect(checkboxCell.setValue).toHaveBeenCalledWith('Y', true);
        expect(originalCellMouseDown).toHaveBeenCalledOnce();
        expect(columns[0].columns[0].editable).toBe(editable);
        expect(columns[0].columns[1].formatter).toBe(originalFormatter);
        expect(columns[0].columns[2].cellMouseDown)
            .toBe(originalCellMouseDown);
    });
});
