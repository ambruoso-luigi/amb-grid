import { describe, expect, test, vi } from 'vitest';
import { createLookup } from '../src/lib/lookup.js';
import { lookup as createLookupEditor } from '../src/lib/editors/lookup-editor.js';
import { getLookupMetadata, setLookupMetadata } from '../src/lib/lookup-metadata.js';
import {
    bindLookupMetadataInitialization,
    collectLookupColumns,
    initializeLookupMetadataForRows,
    prepareLookupColumns
} from '../src/lib/table/table-factory.js';
import {
    createLargeTextBinder,
    createLookupDescriptionBinder
} from '../src/lib/table/hover-binders.js';

class ElementMock {
    constructor(className = '') {
        this.className = className;
        this.children = [];
        this.dataset = {};
        this.listeners = new Map();
        this.parentNode = null;
        this.value = '';
        this.textContent = '';
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    append(...children) {
        children.forEach(child => this.appendChild(child));
    }

    addEventListener(type, listener) {
        this.listeners.set(type, listener);
    }

    removeEventListener(type, listener) {
        if (this.listeners.get(type) === listener) {
            this.listeners.delete(type);
        }
    }

    setAttribute(name, value) {
        this[name] = value;
    }

    focus() {}

    select() {}

    setSelectionRange(start, end) {
        this.selectionStart = start;
        this.selectionEnd = end;
    }

    contains(element) {
        if (element === this) return true;

        return this.children.some(child => child.contains?.(element));
    }

    closest(selector) {
        let element = this;

        while (element) {
            if (
                selector === '.tabulator-cell[data-lookup-field]'
                && String(element.className || '').split(/\s+/).includes('tabulator-cell')
                && element.dataset.lookupField !== undefined
            ) {
                return element;
            }

            if (
                selector === '.tabulator-cell[data-large-text-field]'
                && String(element.className || '').split(/\s+/).includes('tabulator-cell')
                && element.dataset.largeTextField !== undefined
            ) {
                return element;
            }

            if (
                selector === '.tabulator-row'
                && String(element.className || '').split(/\s+/).includes('tabulator-row')
            ) {
                return element;
            }

            element = element.parentNode;
        }

        return null;
    }

    async dispatch(type, event = {}) {
        const listener = this.listeners.get(type);
        const dispatchedEvent = {
            type,
            target: this,
            preventDefault() {},
            stopPropagation() {},
            ...event
        };

        if (listener) {
            await listener(dispatchedEvent);
        }

        return dispatchedEvent;
    }
}

const statuses = [
    { code: 'A001', description: 'Available for standard warehouse picking' },
    { code: 'B120', description: 'Reserved for internal maintenance order' }
];

const createStatusLookup = loadFn => createLookup({
    valueField: 'code',
    labelField: 'description',
    load: loadFn || (({ query }) => {
        return statuses.filter(status => status.code === query);
    })
});

const createLookupColumn = (lookupSource = createStatusLookup(), options = {}) => {
    return {
        field: 'status',
        editor: createLookupEditor(lookupSource),
        ...options
    };
};

const collectPreparedLookupColumns = columns => {
    return collectLookupColumns(prepareLookupColumns(columns));
};

const createRow = (rowData, rowElement = new ElementMock('tabulator-row')) => ({
    getData: () => rowData,
    getElement: () => rowElement
});

const createTableForHover = (row, tableElement = new ElementMock('tabulator')) => ({
    element: tableElement,
    getRows: () => [row]
});

describe('lookup metadata initialization', () => {
    test('initializes lookup description metadata for prefilled rows without opening the editor', async () => {
        const rowData = { status: 'A001' };
        const lookupColumns = collectPreparedLookupColumns([
            createLookupColumn()
        ]);

        await initializeLookupMetadataForRows([createRow(rowData)], lookupColumns);

        expect(getLookupMetadata(rowData, 'status').current).toEqual({
            value: 'A001',
            description: 'Available for standard warehouse picking'
        });
    });

    test('marks rendered lookup cells with data-lookup-field', () => {
        const [column] = prepareLookupColumns([
            createLookupColumn()
        ]);
        const cellElement = new ElementMock('tabulator-cell');
        const output = column.formatter({
            getElement: () => cellElement,
            getField: () => 'status',
            getValue: () => 'A001'
        });

        expect(cellElement.dataset.lookupField).toBe('status');
        expect(output).toBe('A001');
    });

    test('lookup hover binder reads initial description metadata', async () => {
        const rowData = { status: 'A001' };
        const rowElement = new ElementMock('tabulator-row');
        const cellElement = new ElementMock('tabulator-cell');
        const tableElement = new ElementMock('tabulator');
        const floatingMessage = {
            scheduleShow: vi.fn(),
            hide: vi.fn()
        };

        rowElement.appendChild(cellElement);
        cellElement.dataset.lookupField = 'status';
        setLookupMetadata(
            rowData,
            'status',
            'A001',
            'Available for standard warehouse picking',
            { setInitial: true }
        );

        createLookupDescriptionBinder(
            createTableForHover(createRow(rowData, rowElement), tableElement),
            floatingMessage
        );
        await tableElement.dispatch('mouseover', { target: cellElement });

        expect(floatingMessage.scheduleShow).toHaveBeenCalledWith(
            cellElement,
            expect.objectContaining({
                title: 'Description',
                message: 'Available for standard warehouse picking'
            })
        );
    });

    test('deduplicates repeated lookup values across rows', async () => {
        const loadFn = vi.fn(({ query }) => {
            return statuses.filter(status => status.code === query);
        });
        const lookupColumns = collectPreparedLookupColumns([
            createLookupColumn(createStatusLookup(loadFn))
        ]);
        const firstRow = { status: 'A001' };
        const secondRow = { status: 'A001' };

        await initializeLookupMetadataForRows([
            createRow(firstRow),
            createRow(secondRow)
        ], lookupColumns);

        expect(loadFn).toHaveBeenCalledTimes(1);
        expect(getLookupMetadata(firstRow, 'status').current.description)
            .toBe('Available for standard warehouse picking');
        expect(getLookupMetadata(secondRow, 'status').current.description)
            .toBe('Available for standard warehouse picking');
    });

    test('stores empty description for missing lookup values without marking row errors', async () => {
        const rowData = { status: 'MISS' };
        const lookupColumns = collectPreparedLookupColumns([
            createLookupColumn(createStatusLookup(() => []))
        ]);

        await initializeLookupMetadataForRows([createRow(rowData)], lookupColumns);

        expect(getLookupMetadata(rowData, 'status').current).toEqual({
            value: 'MISS',
            description: ''
        });
        expect(rowData).not.toHaveProperty('_ambCellErrors');
        expect(rowData).not.toHaveProperty('cellErrors');
    });

    test('lookup editor still updates current metadata after a manual cell edit', async () => {
        const originalDocument = globalThis.document;
        const rowData = { status: 'A001' };
        const row = {
            getData: () => rowData,
            update: patch => Object.assign(rowData, patch)
        };
        const cellElement = new ElementMock('tabulator-cell');
        const cell = {
            getValue: () => rowData.status,
            getField: () => 'status',
            getRow: () => row,
            getElement: () => cellElement
        };
        const editor = createLookupEditor(createStatusLookup(), {
            validateOnBlur: false
        });

        globalThis.document = {
            createElement: () => new ElementMock()
        };

        try {
            const container = editor(
                cell,
                callback => callback(),
                value => {
                    rowData.status = value;
                },
                () => {}
            );
            const input = container.children[0];

            input.value = 'B120';
            await input.dispatch('keydown', { key: 'Enter' });

            expect(rowData.status).toBe('B120');
            expect(cellElement.dataset.lookupField).toBe('status');
            expect(getLookupMetadata(rowData, 'status').current).toEqual({
                value: 'B120',
                description: 'Reserved for internal maintenance order'
            });
        } finally {
            globalThis.document = originalDocument;
        }
    });

    test('preserves custom lookup formatters while adding the lookup cell marker', () => {
        const customFormatter = vi.fn(() => '<strong>A001</strong>');
        const [column] = prepareLookupColumns([
            createLookupColumn(createStatusLookup(), {
                formatter: customFormatter
            })
        ]);
        const cellElement = new ElementMock('tabulator-cell');
        const cell = {
            getElement: () => cellElement,
            getField: () => 'status',
            getValue: () => 'A001'
        };

        expect(column.formatter(cell, { custom: true }, 'rendered'))
            .toBe('<strong>A001</strong>');
        expect(customFormatter).toHaveBeenCalledWith(cell, { custom: true }, 'rendered');
        expect(cellElement.dataset.lookupField).toBe('status');
    });

    test('initializes lookup metadata again after dataLoaded from setData or reload', async () => {
        const lookupColumns = collectPreparedLookupColumns([
            createLookupColumn()
        ]);
        const handlers = new Map();
        let currentRows = [createRow({ status: 'A001' })];
        const table = {
            getRows: () => currentRows,
            on: (eventName, handler) => handlers.set(eventName, handler),
            off: vi.fn()
        };

        const unsubscribe = bindLookupMetadataInitialization(table, lookupColumns);
        await new Promise(resolve => setTimeout(resolve, 0));

        const reloadedRow = { status: 'B120' };

        currentRows = [createRow(reloadedRow)];
        handlers.get('dataLoaded')();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(getLookupMetadata(reloadedRow, 'status').current).toEqual({
            value: 'B120',
            description: 'Reserved for internal maintenance order'
        });

        unsubscribe();
        expect(table.off).toHaveBeenCalledWith('tableBuilt', expect.any(Function));
        expect(table.off).toHaveBeenCalledWith('dataLoaded', expect.any(Function));
    });

    test('does not add lookup formatters to non-lookup columns', () => {
        const plainColumn = { field: 'name' };
        const [column] = prepareLookupColumns([plainColumn]);

        expect(column).not.toHaveProperty('formatter');
    });

    test('large text hover binder still reads data-large-text-field cells', async () => {
        const rowData = { notes: 'Long operational note for the warehouse team.' };
        const rowElement = new ElementMock('tabulator-row');
        const cellElement = new ElementMock('tabulator-cell');
        const tableElement = new ElementMock('tabulator');
        const floatingMessage = {
            scheduleShow: vi.fn(),
            hide: vi.fn()
        };

        rowElement.appendChild(cellElement);
        cellElement.dataset.largeTextField = 'notes';

        createLargeTextBinder(
            createTableForHover(createRow(rowData, rowElement), tableElement),
            floatingMessage
        );
        await tableElement.dispatch('mouseover', { target: cellElement });

        expect(floatingMessage.scheduleShow).toHaveBeenCalledWith(
            cellElement,
            expect.objectContaining({
                title: 'Text',
                message: 'Long operational note for the warehouse team.'
            })
        );
    });
});
