import { describe, expect, test, vi } from 'vitest';

import { createRowMethods } from '../src/lib/table/controller/row-methods.js';

const DATA_TREE_METHOD_NAMES = [
    'expandTreeRow',
    'collapseTreeRow',
    'toggleTreeRow',
    'getTreeParent',
    'getTreeChildren',
    'isTreeExpanded'
];
const ROW_CONTEXT_METHOD_NAMES = [
    'getRowData',
    'getRowIndex',
    'getNextRow',
    'getPrevRow',
    'getRowElement',
    'getRowCells',
    'getRowCell'
];

const createFreezableRow = (overrides = {}) => ({
    freeze: vi.fn(),
    unfreeze: vi.fn(),
    isFrozen: vi.fn(() => false),
    getData: vi.fn(),
    select: vi.fn(),
    deselect: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides
});

const createFreezingHarness = ({
    crudRows = new Map(),
    fallbackRows = new Map()
} = {}) => {
    const table = {
        getRow: vi.fn(identifier => fallbackRows.get(identifier) || false),
        freezeRow: vi.fn(),
        unfreezeRow: vi.fn(),
        isRowFrozen: vi.fn(),
        selectRow: vi.fn(),
        deselectRow: vi.fn(),
        setFilter: vi.fn(),
        setSort: vi.fn(),
        setPage: vi.fn(),
        redraw: vi.fn()
    };
    const crud = {
        findRowByKey: vi.fn(identifier => crudRows.get(identifier) || null),
        updateRowFields: vi.fn(),
        addRow: vi.fn(),
        deleteRow: vi.fn()
    };
    const methods = createRowMethods({ table, crud });

    return {
        table,
        crud,
        methods
    };
};

const expectNoFreezingSideEffects = (table, crud) => {
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.addRow).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(table.freezeRow).not.toHaveBeenCalled();
    expect(table.unfreezeRow).not.toHaveBeenCalled();
    expect(table.isRowFrozen).not.toHaveBeenCalled();
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(table.setFilter).not.toHaveBeenCalled();
    expect(table.setSort).not.toHaveBeenCalled();
    expect(table.setPage).not.toHaveBeenCalled();
    expect(table.redraw).not.toHaveBeenCalled();
};

const createTreeRow = (overrides = {}) => {
    const children = overrides.children || [{ name: 'child-row' }];
    const parent = overrides.parent || { name: 'parent-row' };
    let expanded = overrides.expanded || false;

    return {
        treeExpand: vi.fn(() => {
            expanded = true;
        }),
        treeCollapse: vi.fn(() => {
            expanded = false;
        }),
        treeToggle: vi.fn(() => {
            expanded = !expanded;
        }),
        getTreeParent: vi.fn(() => parent),
        getTreeChildren: vi.fn(() => children),
        isTreeExpanded: vi.fn(() => expanded),
        addTreeChild: vi.fn(),
        getData: vi.fn(),
        select: vi.fn(),
        deselect: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        ...overrides
    };
};

const createTreeHarness = ({
    dataTree = true,
    crudRows = new Map(),
    fallbackRows = new Map()
} = {}) => {
    const options = { dataTree };
    const table = {
        options,
        getRow: vi.fn(identifier => fallbackRows.get(identifier) || false),
        setData: vi.fn(),
        replaceData: vi.fn(),
        updateData: vi.fn(),
        addData: vi.fn(),
        selectRow: vi.fn(),
        setFilter: vi.fn(),
        setSort: vi.fn(),
        setPage: vi.fn(),
        redraw: vi.fn(),
        refreshFilter: vi.fn()
    };
    const crud = {
        findRowByKey: vi.fn(identifier => crudRows.get(identifier) || null),
        updateRowFields: vi.fn(),
        addRow: vi.fn(),
        deleteRow: vi.fn(),
        validateAll: vi.fn()
    };
    const methods = createRowMethods({ table, crud });

    return {
        table,
        crud,
        methods,
        options
    };
};

const expectNoTreeSideEffects = (table, crud) => {
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.addRow).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.validateAll).not.toHaveBeenCalled();
    expect(table.setData).not.toHaveBeenCalled();
    expect(table.replaceData).not.toHaveBeenCalled();
    expect(table.updateData).not.toHaveBeenCalled();
    expect(table.addData).not.toHaveBeenCalled();
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.setFilter).not.toHaveBeenCalled();
    expect(table.setSort).not.toHaveBeenCalled();
    expect(table.setPage).not.toHaveBeenCalled();
    expect(table.redraw).not.toHaveBeenCalled();
    expect(table.refreshFilter).not.toHaveBeenCalled();
};

const createReadableRow = (overrides = {}) => {
    const data = overrides.data || { id: 15, name: 'Ada' };

    return {
        getData: vi.fn(() => data),
        getIndex: vi.fn(() => data.id),
        getNextRow: vi.fn(() => false),
        getPrevRow: vi.fn(() => false),
        getElement: vi.fn(() => false),
        getCells: vi.fn(() => []),
        getCell: vi.fn(() => false),
        select: vi.fn(),
        deselect: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        ...overrides
    };
};

const createReadableHarness = ({
    crudRows = new Map(),
    fallbackRows = new Map()
} = {}) => {
    const table = {
        getRow: vi.fn(identifier => fallbackRows.get(identifier) || false),
        setData: vi.fn(),
        replaceData: vi.fn(),
        updateData: vi.fn(),
        addData: vi.fn(),
        selectRow: vi.fn(),
        deselectRow: vi.fn(),
        setFilter: vi.fn(),
        setSort: vi.fn(),
        setPage: vi.fn(),
        redraw: vi.fn()
    };
    const crud = {
        findRowByKey: vi.fn(identifier => crudRows.get(identifier) || null),
        updateRowFields: vi.fn(),
        addRow: vi.fn(),
        deleteRow: vi.fn(),
        validateRow: vi.fn()
    };
    const methods = createRowMethods({ table, crud });

    return {
        table,
        crud,
        methods
    };
};

const expectNoReadableSideEffects = (table, crud) => {
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.addRow).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.validateRow).not.toHaveBeenCalled();
    expect(table.setData).not.toHaveBeenCalled();
    expect(table.replaceData).not.toHaveBeenCalled();
    expect(table.updateData).not.toHaveBeenCalled();
    expect(table.addData).not.toHaveBeenCalled();
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(table.setFilter).not.toHaveBeenCalled();
    expect(table.setSort).not.toHaveBeenCalled();
    expect(table.setPage).not.toHaveBeenCalled();
    expect(table.redraw).not.toHaveBeenCalled();
};

describe('AMB table controller row method group', () => {
    test('exposes exactly the flat row controller methods', () => {
        const methods = createRowMethods({
            table: {},
            crud: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'collapseTreeRow',
            'expandTreeRow',
            'freezeRow',
            'getNextRow',
            'getPrevRow',
            'getRow',
            'getRowCell',
            'getRowCells',
            'getRowData',
            'getRowElement',
            'getRowFromPosition',
            'getRowIndex',
            'getRowPosition',
            'getRows',
            'getTreeChildren',
            'getTreeParent',
            'isRowFrozen',
            'isTreeExpanded',
            'scrollToRow',
            'searchRows',
            'toggleTreeRow',
            'unfreezeRow'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
        DATA_TREE_METHOD_NAMES.forEach(name => {
            expect(typeof methods[name]).toBe('function');
        });
        ROW_CONTEXT_METHOD_NAMES.forEach(name => {
            expect(typeof methods[name]).toBe('function');
        });
        expect(methods.rows).toBeUndefined();
        expect(methods.tree).toBeUndefined();
        expect(methods.dataTree).toBeUndefined();
        expect(methods.frozenRows).toBeUndefined();
        expect(methods.rowFreezing).toBeUndefined();
        expect(methods.freezeRows).toBeUndefined();
        expect(methods.unfreezeRows).toBeUndefined();
        expect(methods.toggleRowFrozen).toBeUndefined();
        expect(methods.addTreeChild).toBeUndefined();
        expect(methods.expandTreeRows).toBeUndefined();
        expect(methods.collapseTreeRows).toBeUndefined();
        expect(methods.toggleTreeRows).toBeUndefined();
        expect(methods.getRowTable).toBeUndefined();
        expect(methods.watchRowPosition).toBeUndefined();
    });

    test('resolves row freezing methods through AMB identifiers before engine fallback', () => {
        const backendId = 15;
        const tempId = 'amb-temp-1';
        const zeroId = 0;
        const emptyId = '';
        const identifiers = [backendId, tempId, zeroId, emptyId];
        const operations = [
            {
                name: 'freezeRow',
                rowFactory: label => createFreezableRow({ label })
            },
            {
                name: 'unfreezeRow',
                rowFactory: label => createFreezableRow({ label })
            },
            {
                name: 'isRowFrozen',
                rowFactory: label => createFreezableRow({
                    label,
                    isFrozen: vi.fn(() => true)
                })
            }
        ];

        operations.forEach(operation => {
            const crudRows = new Map(identifiers.map(identifier => [
                identifier,
                operation.rowFactory(`row-${String(identifier)}`)
            ]));
            const { table, crud, methods } = createFreezingHarness({ crudRows });

            identifiers.forEach(identifier => {
                expect(methods[operation.name](identifier)).toBe(true);
                expect(crud.findRowByKey).toHaveBeenLastCalledWith(identifier);
                expect(crud.findRowByKey.mock.calls.at(-1)[0]).toBe(identifier);
            });

            expect(crud.findRowByKey).toHaveBeenCalledTimes(identifiers.length);
            expect(table.getRow).not.toHaveBeenCalled();
            expectNoFreezingSideEffects(table, crud);
        });
    });

    test('uses the engine row lookup fallback without transforming identifiers', () => {
        const lookup = { lookup: 'engine-supported-row' };
        const operations = [
            {
                name: 'freezeRow',
                operation: 'freeze',
                row: createFreezableRow()
            },
            {
                name: 'unfreezeRow',
                operation: 'unfreeze',
                row: createFreezableRow()
            },
            {
                name: 'isRowFrozen',
                operation: 'isFrozen',
                row: createFreezableRow({ isFrozen: vi.fn(() => true) })
            }
        ];

        operations.forEach(({ name, operation, row }) => {
            const { table, crud, methods } = createFreezingHarness({
                fallbackRows: new Map([[lookup, row]])
            });

            expect(methods[name](lookup)).toBe(true);
            expect(crud.findRowByKey).toHaveBeenCalledOnce();
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(lookup);
            expect(crud.findRowByKey.mock.calls[0][0]).toBe(lookup);
            expect(table.getRow).toHaveBeenCalledOnce();
            expect(table.getRow).toHaveBeenLastCalledWith(lookup);
            expect(table.getRow.mock.calls[0][0]).toBe(lookup);
            expect(row[operation]).toHaveBeenCalledOnce();
            expectNoFreezingSideEffects(table, crud);
        });
    });

    test('freezeRow calls only row.freeze once and returns false when unavailable', () => {
        const row = createFreezableRow();
        const missingFreezeRow = createFreezableRow({ freeze: undefined });
        const { table, crud, methods } = createFreezingHarness({
            crudRows: new Map([
                [15, row],
                ['no-freeze', missingFreezeRow]
            ])
        });

        expect(methods.freezeRow(15)).toBe(true);
        expect(row.freeze).toHaveBeenCalledOnce();
        expect(row.unfreeze).not.toHaveBeenCalled();
        expect(row.isFrozen).not.toHaveBeenCalled();

        expect(methods.freezeRow('missing-row')).toBe(false);
        expect(table.getRow).toHaveBeenCalledOnce();
        expect(table.getRow).toHaveBeenLastCalledWith('missing-row');

        expect(methods.freezeRow('no-freeze')).toBe(false);
        expect(missingFreezeRow.unfreeze).not.toHaveBeenCalled();
        expect(missingFreezeRow.isFrozen).not.toHaveBeenCalled();
        expectNoFreezingSideEffects(table, crud);
    });

    test('unfreezeRow calls only row.unfreeze once and returns false when unavailable', () => {
        const row = createFreezableRow();
        const missingUnfreezeRow = createFreezableRow({ unfreeze: undefined });
        const { table, crud, methods } = createFreezingHarness({
            crudRows: new Map([
                [15, row],
                ['no-unfreeze', missingUnfreezeRow]
            ])
        });

        expect(methods.unfreezeRow(15)).toBe(true);
        expect(row.unfreeze).toHaveBeenCalledOnce();
        expect(row.freeze).not.toHaveBeenCalled();
        expect(row.isFrozen).not.toHaveBeenCalled();

        expect(methods.unfreezeRow('missing-row')).toBe(false);
        expect(table.getRow).toHaveBeenCalledOnce();
        expect(table.getRow).toHaveBeenLastCalledWith('missing-row');

        expect(methods.unfreezeRow('no-unfreeze')).toBe(false);
        expect(missingUnfreezeRow.freeze).not.toHaveBeenCalled();
        expect(missingUnfreezeRow.isFrozen).not.toHaveBeenCalled();
        expectNoFreezingSideEffects(table, crud);
    });

    test('isRowFrozen calls only row.isFrozen once and forwards boolean results', () => {
        const frozenRow = createFreezableRow({ isFrozen: vi.fn(() => true) });
        const movableRow = createFreezableRow({ isFrozen: vi.fn(() => false) });
        const missingIsFrozenRow = createFreezableRow({ isFrozen: undefined });
        const { table, crud, methods } = createFreezingHarness({
            crudRows: new Map([
                ['frozen', frozenRow],
                ['movable', movableRow],
                ['no-is-frozen', missingIsFrozenRow]
            ])
        });

        expect(methods.isRowFrozen('frozen')).toBe(true);
        expect(frozenRow.isFrozen).toHaveBeenCalledOnce();
        expect(frozenRow.freeze).not.toHaveBeenCalled();
        expect(frozenRow.unfreeze).not.toHaveBeenCalled();

        expect(methods.isRowFrozen('movable')).toBe(false);
        expect(movableRow.isFrozen).toHaveBeenCalledOnce();
        expect(movableRow.freeze).not.toHaveBeenCalled();
        expect(movableRow.unfreeze).not.toHaveBeenCalled();

        expect(methods.isRowFrozen('missing-row')).toBe(false);
        expect(table.getRow).toHaveBeenCalledOnce();
        expect(table.getRow).toHaveBeenLastCalledWith('missing-row');

        expect(methods.isRowFrozen('no-is-frozen')).toBe(false);
        expect(missingIsFrozenRow.freeze).not.toHaveBeenCalled();
        expect(missingIsFrozenRow.unfreeze).not.toHaveBeenCalled();
        expectNoFreezingSideEffects(table, crud);
    });

    test('resolves contextual row reads through AMB identifiers before engine fallback', () => {
        const backendRow = createReadableRow();
        const tempRow = createReadableRow({ data: { id: null, _ambTempId: 'amb-temp-1' } });
        const fallbackRow = createReadableRow({ data: { id: 30 } });
        const lookup = { lookup: 'engine-row' };
        const { table, crud, methods } = createReadableHarness({
            crudRows: new Map([
                [15, backendRow],
                ['amb-temp-1', tempRow]
            ]),
            fallbackRows: new Map([[lookup, fallbackRow]])
        });

        expect(methods.getRowData(15)).toBe(backendRow.getData());
        expect(crud.findRowByKey).toHaveBeenLastCalledWith(15);
        expect(table.getRow).not.toHaveBeenCalled();

        expect(methods.getRowIndex('amb-temp-1')).toBe(null);
        expect(crud.findRowByKey).toHaveBeenLastCalledWith('amb-temp-1');
        expect(table.getRow).not.toHaveBeenCalled();

        expect(methods.getNextRow(lookup)).toBe(false);
        expect(crud.findRowByKey).toHaveBeenLastCalledWith(lookup);
        expect(table.getRow).toHaveBeenCalledOnce();
        expect(table.getRow).toHaveBeenLastCalledWith(lookup);
        expect(table.getRow.mock.calls[0][0]).toBe(lookup);
        expectNoReadableSideEffects(table, crud);
    });

    test('delegates contextual row reads and preserves identity and falsy results', () => {
        const transform = { transform: 'data' };
        const data = { id: 0, name: 'Zero' };
        const nextRow = { name: 'next-row' };
        const prevRow = { name: 'prev-row' };
        const descriptors = [
            {
                method: 'getRowData',
                rowMethod: 'getData',
                row: createReadableRow({ getData: vi.fn(() => data) }),
                args: ['row-data', transform],
                expected: data
            },
            {
                method: 'getRowIndex',
                rowMethod: 'getIndex',
                row: createReadableRow({ getIndex: vi.fn(() => 0) }),
                args: ['row-index'],
                expected: 0
            },
            {
                method: 'getNextRow',
                rowMethod: 'getNextRow',
                row: createReadableRow({ getNextRow: vi.fn(() => nextRow) }),
                args: ['row-next'],
                expected: nextRow
            },
            {
                method: 'getPrevRow',
                rowMethod: 'getPrevRow',
                row: createReadableRow({ getPrevRow: vi.fn(() => prevRow) }),
                args: ['row-prev'],
                expected: prevRow
            }
        ];
        const { table, crud, methods } = createReadableHarness({
            crudRows: new Map(descriptors.map(({ args, row }) => [args[0], row]))
        });

        descriptors.forEach(({ method, rowMethod, row, args, expected }) => {
            expect(methods[method](...args)).toBe(expected);
            expect(row[rowMethod]).toHaveBeenCalledOnce();
        });
        expect(descriptors[0].row.getData).toHaveBeenLastCalledWith(transform);

        descriptors.forEach(({ row }) => {
            row.getData.mockClear();
            row.getIndex.mockClear();
            row.getNextRow.mockClear();
            row.getPrevRow.mockClear();
        });

        descriptors[0].row.getData.mockReturnValueOnce('');
        descriptors[1].row.getIndex.mockReturnValueOnce('');
        descriptors[2].row.getNextRow.mockReturnValueOnce(false);
        descriptors[3].row.getPrevRow.mockReturnValueOnce(false);

        expect(methods.getRowData('row-data')).toBe('');
        expect(methods.getRowIndex('row-index')).toBe('');
        expect(methods.getNextRow('row-next')).toBe(false);
        expect(methods.getPrevRow('row-prev')).toBe(false);
        expectNoReadableSideEffects(table, crud);
    });

    test('returns false for contextual row reads when row or operation is missing', () => {
        const missingMethodRows = new Map([
            ['no-data', createReadableRow({ getData: undefined })],
            ['no-index', createReadableRow({ getIndex: undefined })],
            ['no-next', createReadableRow({ getNextRow: undefined })],
            ['no-prev', createReadableRow({ getPrevRow: undefined })]
        ]);
        const { table, crud, methods } = createReadableHarness({
            crudRows: missingMethodRows
        });

        expect(methods.getRowData('missing-row')).toBe(false);
        expect(table.getRow).toHaveBeenLastCalledWith('missing-row');
        expect(methods.getRowData('no-data')).toBe(false);
        expect(methods.getRowIndex('no-index')).toBe(false);
        expect(methods.getNextRow('no-next')).toBe(false);
        expect(methods.getPrevRow('no-prev')).toBe(false);
        expectNoReadableSideEffects(table, crud);
    });

    test('delegates structural row reads through AMB identifiers and fallback lookup', () => {
        const column = { field: 'status' };
        const element = { nodeType: 1 };
        const cells = [];
        const cell = { field: 'status' };
        const lookup = { lookup: 'engine-row' };
        const backendRow = createReadableRow({
            getElement: vi.fn(() => element),
            getCells: vi.fn(() => cells),
            getCell: vi.fn(() => cell)
        });
        const fallbackRow = createReadableRow({ getCells: vi.fn(() => false) });
        const { table, crud, methods } = createReadableHarness({
            crudRows: new Map([[15, backendRow], ['no-cell', createReadableRow({ getCell: undefined })]]),
            fallbackRows: new Map([[lookup, fallbackRow]])
        });
        const cases = [
            ['getRowElement', [15], backendRow, 'getElement', element],
            ['getRowCells', [15], backendRow, 'getCells', cells],
            ['getRowCell', [15, column], backendRow, 'getCell', cell],
            ['getRowCells', [lookup], fallbackRow, 'getCells', false]
        ];

        cases.forEach(([method, args, row, rowMethod, expected]) => {
            expect(methods[method](...args)).toBe(expected);
            expect(row[rowMethod]).toHaveBeenCalledOnce();
        });
        expect(backendRow.getCell).toHaveBeenLastCalledWith(column);
        expect(table.getRow).toHaveBeenCalledOnce();
        expect(table.getRow).toHaveBeenLastCalledWith(lookup);
        expect(methods.getRowElement('missing-row')).toBe(false);
        expect(methods.getRowCell('no-cell', column)).toBe(false);
        expect(crud.findRowByKey).toHaveBeenLastCalledWith('no-cell');
    });

    test('resolves Data Tree row methods through AMB identifiers before engine fallback', () => {
        const backendId = 15;
        const tempId = 'amb-temp-1';
        const zeroId = 0;
        const emptyId = '';
        const lookup = { lookup: 'engine-row' };
        const identifiers = [backendId, tempId, zeroId, emptyId];
        const descriptors = [
            { name: 'expandTreeRow', rowMethod: 'treeExpand', expected: true },
            { name: 'collapseTreeRow', rowMethod: 'treeCollapse', expected: true },
            { name: 'toggleTreeRow', rowMethod: 'treeToggle', expected: true },
            { name: 'getTreeParent', rowMethod: 'getTreeParent', expected: { name: 'parent-row' } },
            { name: 'getTreeChildren', rowMethod: 'getTreeChildren', expected: [{ name: 'child-row' }] },
            { name: 'isTreeExpanded', rowMethod: 'isTreeExpanded', expected: true }
        ];

        descriptors.forEach(({ name, rowMethod, expected }) => {
            const crudRows = new Map(identifiers.map(identifier => [
                identifier,
                createTreeRow({
                    parent: expected,
                    children: expected,
                    expanded: expected === true
                })
            ]));
            const fallbackRow = createTreeRow({
                parent: expected,
                children: expected,
                expanded: expected === true
            });
            const { table, crud, methods } = createTreeHarness({
                crudRows,
                fallbackRows: new Map([[lookup, fallbackRow]])
            });

            identifiers.forEach(identifier => {
                const result = methods[name](identifier);

                expect(result).toBe(expected);
                expect(crud.findRowByKey).toHaveBeenLastCalledWith(identifier);
                expect(crud.findRowByKey.mock.calls.at(-1)[0]).toBe(identifier);
            });

            expect(table.getRow).not.toHaveBeenCalled();
            expect(methods[name](lookup)).toBe(expected);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(lookup);
            expect(crud.findRowByKey.mock.calls.at(-1)[0]).toBe(lookup);
            expect(table.getRow).toHaveBeenCalledOnce();
            expect(table.getRow).toHaveBeenLastCalledWith(lookup);
            expect(table.getRow.mock.calls[0][0]).toBe(lookup);
            expect(fallbackRow[rowMethod]).toHaveBeenCalledOnce();
            expectNoTreeSideEffects(table, crud);
        });
    });

    test('returns false for Data Tree methods when Data Tree is disabled without side effects', () => {
        const row = createTreeRow();
        const options = { dataTree: false };
        const { table, crud, methods } = createTreeHarness({
            dataTree: false,
            crudRows: new Map([[15, row]])
        });
        const beforeOptions = structuredClone(options);

        Object.assign(table.options, options);

        DATA_TREE_METHOD_NAMES.forEach(name => {
            expect(methods[name](15)).toBe(false);
        });

        expect(table.options).toEqual(beforeOptions);
        expect(crud.findRowByKey).not.toHaveBeenCalled();
        expect(table.getRow).not.toHaveBeenCalled();
        expect(row.treeExpand).not.toHaveBeenCalled();
        expect(row.treeCollapse).not.toHaveBeenCalled();
        expect(row.treeToggle).not.toHaveBeenCalled();
        expect(row.getTreeParent).not.toHaveBeenCalled();
        expect(row.getTreeChildren).not.toHaveBeenCalled();
        expect(row.isTreeExpanded).not.toHaveBeenCalled();
        expect(row.addTreeChild).not.toHaveBeenCalled();
        expectNoTreeSideEffects(table, crud);
    });

    test('delegates Data Tree runtime operations once and returns false when unavailable', () => {
        const operationRows = {
            expandTreeRow: createTreeRow(),
            collapseTreeRow: createTreeRow(),
            toggleTreeRow: createTreeRow()
        };
        const operations = [
            ['expandTreeRow', 'treeExpand', ['treeCollapse', 'treeToggle']],
            ['collapseTreeRow', 'treeCollapse', ['treeExpand', 'treeToggle']],
            ['toggleTreeRow', 'treeToggle', ['treeExpand', 'treeCollapse']]
        ];

        operations.forEach(([methodName, rowMethod, otherMethods]) => {
            const row = operationRows[methodName];
            const missingMethodRow = createTreeRow({ [rowMethod]: undefined });
            const { table, crud, methods } = createTreeHarness({
                crudRows: new Map([
                    [methodName, row],
                    [`no-${rowMethod}`, missingMethodRow]
                ])
            });

            expect(methods[methodName](methodName)).toBe(true);
            expect(row[rowMethod]).toHaveBeenCalledOnce();
            otherMethods.forEach(otherMethod => {
                expect(row[otherMethod]).not.toHaveBeenCalled();
            });

            expect(methods[methodName](`missing-${methodName}`)).toBe(false);
            expect(table.getRow).toHaveBeenLastCalledWith(`missing-${methodName}`);
            table.getRow.mockClear();

            expect(methods[methodName](`no-${rowMethod}`)).toBe(false);
            expect(table.getRow).not.toHaveBeenCalled();
            otherMethods.forEach(otherMethod => {
                expect(missingMethodRow[otherMethod]).not.toHaveBeenCalled();
            });
            expect(missingMethodRow.addTreeChild).not.toHaveBeenCalled();
            expectNoTreeSideEffects(table, crud);
        });
    });

    test('getTreeParent forwards parent row components and false without expansion side effects', () => {
        const parent = { name: 'parent-component' };
        const childRow = createTreeRow({ parent });
        const rootRow = createTreeRow({ getTreeParent: vi.fn(() => false) });
        const missingMethodRow = createTreeRow({ getTreeParent: undefined });
        const { table, crud, methods } = createTreeHarness({
            crudRows: new Map([
                ['child', childRow],
                ['root', rootRow],
                ['no-parent-method', missingMethodRow]
            ])
        });

        expect(methods.getTreeParent('child')).toBe(parent);
        expect(childRow.getTreeParent).toHaveBeenCalledOnce();
        expect(childRow.treeExpand).not.toHaveBeenCalled();
        expect(childRow.treeCollapse).not.toHaveBeenCalled();
        expect(childRow.treeToggle).not.toHaveBeenCalled();

        expect(methods.getTreeParent('root')).toBe(false);
        expect(rootRow.getTreeParent).toHaveBeenCalledOnce();
        expect(methods.getTreeParent('missing-row')).toBe(false);
        expect(table.getRow).toHaveBeenLastCalledWith('missing-row');
        expect(methods.getTreeParent('no-parent-method')).toBe(false);
        expect(missingMethodRow.treeExpand).not.toHaveBeenCalled();
        expectNoTreeSideEffects(table, crud);
    });

    test('getTreeChildren forwards the engine array and row components by identity', () => {
        const children = [{ name: 'first-child' }, { name: 'second-child' }];
        const childRow = createTreeRow({ children });
        const emptyChildren = [];
        const leafRow = createTreeRow({ getTreeChildren: vi.fn(() => emptyChildren) });
        const missingMethodRow = createTreeRow({ getTreeChildren: undefined });
        const { table, crud, methods } = createTreeHarness({
            crudRows: new Map([
                ['parent', childRow],
                ['leaf', leafRow],
                ['no-children-method', missingMethodRow]
            ])
        });

        expect(methods.getTreeChildren('parent')).toBe(children);
        expect(methods.getTreeChildren('parent')[0]).toBe(children[0]);
        expect(childRow.getTreeChildren).toHaveBeenCalledTimes(2);
        expect(childRow.addTreeChild).not.toHaveBeenCalled();

        expect(methods.getTreeChildren('leaf')).toBe(emptyChildren);
        expect(methods.getTreeChildren('missing-row')).toBe(false);
        expect(table.getRow).toHaveBeenLastCalledWith('missing-row');
        expect(methods.getTreeChildren('no-children-method')).toBe(false);
        expect(missingMethodRow.addTreeChild).not.toHaveBeenCalled();
        expectNoTreeSideEffects(table, crud);
    });

    test('isTreeExpanded forwards boolean state without implicit runtime operations', () => {
        const expandedRow = createTreeRow({ expanded: true });
        const collapsedRow = createTreeRow({ expanded: false });
        const missingMethodRow = createTreeRow({ isTreeExpanded: undefined });
        const { table, crud, methods } = createTreeHarness({
            crudRows: new Map([
                ['expanded', expandedRow],
                ['collapsed', collapsedRow],
                ['no-state-method', missingMethodRow]
            ])
        });

        expect(methods.isTreeExpanded('expanded')).toBe(true);
        expect(expandedRow.isTreeExpanded).toHaveBeenCalledOnce();
        expect(expandedRow.treeExpand).not.toHaveBeenCalled();
        expect(expandedRow.treeCollapse).not.toHaveBeenCalled();
        expect(expandedRow.treeToggle).not.toHaveBeenCalled();

        expect(methods.isTreeExpanded('collapsed')).toBe(false);
        expect(collapsedRow.isTreeExpanded).toHaveBeenCalledOnce();
        expect(collapsedRow.treeExpand).not.toHaveBeenCalled();
        expect(collapsedRow.treeCollapse).not.toHaveBeenCalled();
        expect(collapsedRow.treeToggle).not.toHaveBeenCalled();

        expect(methods.isTreeExpanded('missing-row')).toBe(false);
        expect(table.getRow).toHaveBeenLastCalledWith('missing-row');
        expect(methods.isTreeExpanded('no-state-method')).toBe(false);
        expect(missingMethodRow.treeExpand).not.toHaveBeenCalled();
        expect(missingMethodRow.treeCollapse).not.toHaveBeenCalled();
        expect(missingMethodRow.treeToggle).not.toHaveBeenCalled();
        expectNoTreeSideEffects(table, crud);
    });

    test('searches row components without touching CRUD or persistent grid state', () => {
        const firstRow = {
            type: 'first-row',
            getData: vi.fn()
        };
        const secondRow = {
            type: 'second-row',
            getData: vi.fn()
        };
        const rows = [firstRow, secondRow];
        const emptyRows = [];
        const customFilter = (data, params) => data.age >= params.minimum;
        const params = { minimum: 18 };
        const filterGroups = [
            { field: 'status', type: '=', value: 'active' },
            [
                { field: 'role', type: '=', value: 'admin' },
                { field: 'role', type: '=', value: 'editor' }
            ]
        ];
        const table = {
            searchRows: vi.fn()
                .mockReturnValueOnce(rows)
                .mockReturnValueOnce(rows)
                .mockReturnValueOnce(emptyRows),
            getRows: vi.fn(),
            getRow: vi.fn(),
            setFilter: vi.fn(),
            addFilter: vi.fn(),
            removeFilter: vi.fn(),
            clearFilter: vi.fn(),
            refreshFilter: vi.fn(),
            setHeaderFilterValue: vi.fn(),
            clearHeaderFilter: vi.fn(),
            setSort: vi.fn(),
            setPage: vi.fn(),
            selectRow: vi.fn(),
            deselectRow: vi.fn()
        };
        const crud = {
            findRowByKey: vi.fn(),
            updateRowFields: vi.fn(),
            deleteRow: vi.fn(),
            rollbackRow: vi.fn()
        };
        const methods = createRowMethods({ table, crud });

        expect(methods.searchRows('status', '=', 'active')).toBe(rows);
        expect(table.searchRows).toHaveBeenCalledOnce();
        expect(table.searchRows).toHaveBeenLastCalledWith('status', '=', 'active');
        expect(rows[0]).toBe(firstRow);
        expect(rows[1]).toBe(secondRow);

        expect(methods.searchRows(customFilter, params)).toBe(rows);
        expect(table.searchRows).toHaveBeenCalledTimes(2);
        expect(table.searchRows).toHaveBeenLastCalledWith(customFilter, params);
        expect(table.searchRows.mock.calls[1][0]).toBe(customFilter);
        expect(table.searchRows.mock.calls[1][1]).toBe(params);

        expect(methods.searchRows(filterGroups)).toBe(emptyRows);
        expect(table.searchRows).toHaveBeenCalledTimes(3);
        expect(table.searchRows).toHaveBeenLastCalledWith(filterGroups);
        expect(table.searchRows.mock.calls[2][0]).toBe(filterGroups);
        expect(firstRow.getData).not.toHaveBeenCalled();
        expect(secondRow.getData).not.toHaveBeenCalled();
        expect(table.getRows).not.toHaveBeenCalled();
        expect(table.getRow).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.addFilter).not.toHaveBeenCalled();
        expect(table.removeFilter).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(table.refreshFilter).not.toHaveBeenCalled();
        expect(table.setHeaderFilterValue).not.toHaveBeenCalled();
        expect(table.clearHeaderFilter).not.toHaveBeenCalled();
        expect(table.setSort).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.selectRow).not.toHaveBeenCalled();
        expect(table.deselectRow).not.toHaveBeenCalled();
        expect(crud.findRowByKey).not.toHaveBeenCalled();
        expect(crud.updateRowFields).not.toHaveBeenCalled();
        expect(crud.deleteRow).not.toHaveBeenCalled();
        expect(crud.rollbackRow).not.toHaveBeenCalled();
    });

    test('scrolls to backend and temporary AMB rows without transforming the promise', () => {
        const savedRow = { type: 'saved-row' };
        const tempRow = { type: 'temp-row' };
        const backendPromise = Promise.resolve();
        const tempPromise = Promise.resolve('scrolled');
        const table = {
            scrollToRow: vi.fn()
                .mockReturnValueOnce(backendPromise)
                .mockReturnValueOnce(tempPromise),
            setPageToRow: vi.fn(),
            setPage: vi.fn(),
            nextPage: vi.fn(),
            previousPage: vi.fn(),
            selectRow: vi.fn(),
            getData: vi.fn(),
            updateData: vi.fn()
        };
        const crud = {
            findRowByKey: vi.fn(identifier => {
                if (identifier === 15) return savedRow;
                if (identifier === 'amb-temp-1') return tempRow;

                return null;
            }),
            updateRowFields: vi.fn(),
            deleteRow: vi.fn(),
            rollbackRow: vi.fn(),
            validateRow: vi.fn()
        };
        const methods = createRowMethods({ table, crud });

        expect(methods.scrollToRow(15, 'center', false)).toBe(backendPromise);
        expect(crud.findRowByKey).toHaveBeenCalledOnce();
        expect(crud.findRowByKey).toHaveBeenLastCalledWith(15);
        expect(table.scrollToRow).toHaveBeenCalledOnce();
        expect(table.scrollToRow).toHaveBeenLastCalledWith(savedRow, 'center', false);
        expect(table.scrollToRow.mock.calls[0][0]).toBe(savedRow);
        expect(table.scrollToRow.mock.calls[0][2]).toBe(false);

        expect(methods.scrollToRow('amb-temp-1', 'nearest', true)).toBe(tempPromise);
        expect(crud.findRowByKey).toHaveBeenCalledTimes(2);
        expect(crud.findRowByKey).toHaveBeenLastCalledWith('amb-temp-1');
        expect(table.scrollToRow).toHaveBeenCalledTimes(2);
        expect(table.scrollToRow).toHaveBeenLastCalledWith(tempRow, 'nearest', true);
        expect(table.scrollToRow.mock.calls[1][0]).toBe(tempRow);
        expect(table.scrollToRow.mock.calls[1][2]).toBe(true);
        expect(table.setPageToRow).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.nextPage).not.toHaveBeenCalled();
        expect(table.previousPage).not.toHaveBeenCalled();
        expect(table.selectRow).not.toHaveBeenCalled();
        expect(table.getData).not.toHaveBeenCalled();
        expect(table.updateData).not.toHaveBeenCalled();
        expect(crud.updateRowFields).not.toHaveBeenCalled();
        expect(crud.deleteRow).not.toHaveBeenCalled();
        expect(crud.rollbackRow).not.toHaveBeenCalled();
        expect(crud.validateRow).not.toHaveBeenCalled();
    });

    test('falls back to the original lookup and preserves rejected promises', () => {
        const rowComponent = {
            type: 'row-component',
            select: vi.fn(),
            scrollTo: vi.fn(),
            pageTo: vi.fn()
        };
        const domLookup = { nodeType: 1 };
        const rowPromise = Promise.resolve();
        const lookupPromise = Promise.resolve();
        const error = new Error('row scroll failed');
        const rejectedPromise = Promise.reject(error);

        rejectedPromise.catch(() => {});

        const table = {
            scrollToRow: vi.fn()
                .mockReturnValueOnce(rowPromise)
                .mockReturnValueOnce(lookupPromise)
                .mockReturnValueOnce(rejectedPromise),
            setPageToRow: vi.fn(),
            setPage: vi.fn(),
            selectRow: vi.fn(),
            deselectRow: vi.fn(),
            getRows: vi.fn(),
            getRow: vi.fn(),
            setFilter: vi.fn(),
            setSort: vi.fn()
        };
        const crud = {
            findRowByKey: vi.fn(() => null),
            updateRowFields: vi.fn(),
            deleteRow: vi.fn(),
            rollbackRow: vi.fn()
        };
        const methods = createRowMethods({ table, crud });

        expect(methods.scrollToRow(rowComponent, 'bottom', false)).toBe(rowPromise);
        expect(crud.findRowByKey).toHaveBeenCalledOnce();
        expect(crud.findRowByKey).toHaveBeenLastCalledWith(rowComponent);
        expect(table.scrollToRow).toHaveBeenCalledOnce();
        expect(table.scrollToRow).toHaveBeenLastCalledWith(rowComponent, 'bottom', false);
        expect(table.scrollToRow.mock.calls[0][0]).toBe(rowComponent);
        expect(table.scrollToRow.mock.calls[0][2]).toBe(false);

        expect(methods.scrollToRow(domLookup, 'top')).toBe(lookupPromise);
        expect(crud.findRowByKey).toHaveBeenCalledTimes(2);
        expect(crud.findRowByKey).toHaveBeenLastCalledWith(domLookup);
        expect(table.scrollToRow).toHaveBeenCalledTimes(2);
        expect(table.scrollToRow).toHaveBeenLastCalledWith(domLookup, 'top');
        expect(table.scrollToRow.mock.calls[1][0]).toBe(domLookup);

        expect(methods.scrollToRow('missing-row')).toBe(rejectedPromise);
        expect(crud.findRowByKey).toHaveBeenCalledTimes(3);
        expect(crud.findRowByKey).toHaveBeenLastCalledWith('missing-row');
        expect(table.scrollToRow).toHaveBeenCalledTimes(3);
        expect(table.scrollToRow).toHaveBeenLastCalledWith('missing-row');
        expect(rowComponent.select).not.toHaveBeenCalled();
        expect(rowComponent.scrollTo).not.toHaveBeenCalled();
        expect(rowComponent.pageTo).not.toHaveBeenCalled();
        expect(table.setPageToRow).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.selectRow).not.toHaveBeenCalled();
        expect(table.deselectRow).not.toHaveBeenCalled();
        expect(table.getRows).not.toHaveBeenCalled();
        expect(table.getRow).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.setSort).not.toHaveBeenCalled();
        expect(crud.updateRowFields).not.toHaveBeenCalled();
        expect(crud.deleteRow).not.toHaveBeenCalled();
        expect(crud.rollbackRow).not.toHaveBeenCalled();
    });
});
