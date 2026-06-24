import { describe, expect, test } from 'vitest';
import { createLookup } from '../src/lib/lookup.js';
import { lookup as createLookupEditor } from '../src/lib/editors/lookup-editor.js';
import { LookupDialog } from '../src/ui/lookup-dialog.js';

const columns = [
    { field: 'municipalityName', title: 'Municipality', visible: true },
    { field: 'province', title: 'Province', visible: true },
    { field: 'istatCode', title: 'ISTAT Code', visible: false }
];

class DialogElementMock {
    constructor(tagName = 'div') {
        this.tagName = tagName.toUpperCase();
        this.children = [];
        this.dataset = {};
        this.listeners = new Map();
        this.parentNode = null;
        this.style = {};
        this.value = '';
        this.hidden = false;
        this.disabled = false;
        this.removed = false;
        this._className = '';
        this._innerHTML = '';
    }

    get className() {
        return this._className;
    }

    set className(value) {
        this._className = String(value || '');
    }

    get innerHTML() {
        return this._innerHTML;
    }

    set innerHTML(value) {
        this._innerHTML = String(value || '');
        this.children = [];
    }

    append(...children) {
        children.forEach(child => this.appendChild(child));
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    addEventListener(type, listener) {
        this.listeners.set(type, listener);
    }

    setAttribute(name, value) {
        this[name] = value;
    }

    querySelectorAll(selector) {
        const matches = [];
        const className = selector.startsWith('.') ? selector.slice(1) : null;

        this.children.forEach(child => {
            if (
                className
                && child.className.split(/\s+/).includes(className)
            ) {
                matches.push(child);
            }

            matches.push(...child.querySelectorAll(selector));
        });

        return matches;
    }

    focus() {}

    remove() {
        this.removed = true;

        if (this.parentNode) {
            this.parentNode.children = this.parentNode.children.filter(child => {
                return child !== this;
            });
        }
    }

    async dispatch(type, event = {}) {
        const listener = this.listeners.get(type);
        const dispatchedEvent = {
            type,
            target: this,
            defaultPrevented: false,
            preventDefault() {
                this.defaultPrevented = true;
            },
            ...event
        };

        if (listener) {
            await listener(dispatchedEvent);
        }

        return dispatchedEvent;
    }
}

const createDialogHarness = () => {
    const originalDocument = globalThis.document;
    const body = new DialogElementMock('body');
    const listeners = new Map();

    globalThis.document = {
        body,
        createElement: tagName => new DialogElementMock(tagName),
        addEventListener: (type, listener) => listeners.set(type, listener),
        removeEventListener: (type, listener) => {
            if (listeners.get(type) === listener) {
                listeners.delete(type);
            }
        }
    };

    return {
        body,
        async dispatchDocument(type, event = {}) {
            const listener = listeners.get(type);
            const dispatchedEvent = {
                type,
                defaultPrevented: false,
                preventDefault() {
                    this.defaultPrevented = true;
                },
                ...event
            };

            if (listener) {
                await listener(dispatchedEvent);
            }

            return dispatchedEvent;
        },
        restore() {
            globalThis.document = originalDocument;
        }
    };
};

describe('record-based lookup', () => {
    test('requires a technical key and at least one visible column', () => {
        expect(() => createLookup({
            columns,
            mapToRow: { municipality: 'municipalityName' }
        })).toThrow(/keyField is required/);

        expect(() => createLookup({
            keyField: 'istatCode',
            columns: [{ field: 'istatCode', visible: false }]
        })).toThrow(/visible: true/);
    });

    test('indexes complete records by keyField', async () => {
        const records = [
            { istatCode: '065078', municipalityName: 'Nocera Inferiore', province: 'SA' }
        ];
        const lookup = createLookup({
            keyField: 'istatCode',
            columns,
            mapToRow: {
                istatCode: 'istatCode',
                municipality: 'municipalityName'
            },
            load: () => records
        });

        await lookup.load();

        expect(lookup.getByKey('065078')).toBe(records[0]);
        expect(lookup.mapToRow).toEqual({
            istatCode: 'istatCode',
            municipality: 'municipalityName'
        });
    });

    test('rejects missing and duplicate technical keys', async () => {
        const missingKeyLookup = createLookup({
            keyField: 'istatCode',
            columns,
            load: () => [{ municipalityName: 'Missing code' }]
        });
        const duplicateKeyLookup = createLookup({
            keyField: 'istatCode',
            columns,
            load: () => [
                { istatCode: '065078', municipalityName: 'First' },
                { istatCode: '065078', municipalityName: 'Second' }
            ]
        });

        await expect(missingKeyLookup.load()).rejects.toThrow(/missing keyField "istatCode"/);
        await expect(duplicateKeyLookup.load()).rejects.toThrow(/duplicate value "065078"/);
    });
});

describe('LookupDialog filtering', () => {
    test('searches only configured visible fields', () => {
        const dialog = new LookupDialog();

        dialog.options = {
            data: [
                { istatCode: '065078', municipalityName: 'Nocera Inferiore', province: 'SA' },
                { istatCode: '065116', municipalityName: 'Salerno', province: 'SA' }
            ],
            columns: columns.filter(column => column.visible),
            searchFields: ['municipalityName', 'province']
        };
        dialog.renderTable = () => {};

        dialog.filter('Nocera');
        expect(dialog.filteredData).toHaveLength(1);
        expect(dialog.filteredData[0].istatCode).toBe('065078');

        dialog.filter('065078');
        expect(dialog.filteredData).toHaveLength(0);
    });

    test('closes on backdrop by default and can keep the dialog open', async () => {
        const defaultHarness = createDialogHarness();

        try {
            const dialog = new LookupDialog();
            const resultPromise = dialog.open({
                columns: [{ field: 'title' }],
                data: [{ title: 'First' }]
            });
            const overlay = defaultHarness.body.children[0];

            await overlay.dispatch('mousedown');

            await expect(resultPromise).resolves.toBeNull();
            expect(overlay.removed).toBe(true);
        } finally {
            defaultHarness.restore();
        }

        const modalHarness = createDialogHarness();

        try {
            const dialog = new LookupDialog();
            const resultPromise = dialog.open({
                columns: [{ field: 'title' }],
                data: [{ title: 'First' }],
                closeOnBackdropClick: false
            });
            const overlay = modalHarness.body.children[0];

            await overlay.dispatch('mousedown');

            expect(overlay.removed).toBe(false);
            expect(dialog.overlay).toBe(overlay);

            dialog.close(null);
            await expect(resultPromise).resolves.toBeNull();
        } finally {
            modalHarness.restore();
        }
    });

    test('Escape and Cancel still close the dialog', async () => {
        const escapeHarness = createDialogHarness();

        try {
            const dialog = new LookupDialog();
            const resultPromise = dialog.open({
                columns: [{ field: 'title' }],
                data: [{ title: 'First' }],
                closeOnBackdropClick: false
            });
            const event = await escapeHarness.dispatchDocument('keydown', {
                key: 'Escape'
            });

            expect(event.defaultPrevented).toBe(true);
            await expect(resultPromise).resolves.toBeNull();
        } finally {
            escapeHarness.restore();
        }

        const cancelHarness = createDialogHarness();

        try {
            const dialog = new LookupDialog();
            const resultPromise = dialog.open({
                columns: [{ field: 'title' }],
                data: [{ title: 'First' }],
                closeOnBackdropClick: false
            });
            const panel = cancelHarness.body.children[0].children[0];
            const footer = panel.children[3];
            const cancelButton = footer.children[0];

            await cancelButton.dispatch('click');

            await expect(resultPromise).resolves.toBeNull();
        } finally {
            cancelHarness.restore();
        }
    });

    test('limits rendered rows while filtering the complete dataset', async () => {
        const harness = createDialogHarness();

        try {
            const dialog = new LookupDialog();
            const resultPromise = dialog.open({
                columns: [{ field: 'title', title: 'Title' }],
                data: [
                    { title: 'Alpha' },
                    { title: 'Beta' },
                    { title: 'Gamma' },
                    { title: 'Target outside initial limit' }
                ],
                initialRenderLimit: 2
            });
            const getRenderedRows = () => dialog.table.children[1].children;

            expect(dialog.filteredData).toHaveLength(4);
            expect(getRenderedRows()).toHaveLength(2);
            expect(dialog.feedback.messageElement.textContent)
                .toBe('Showing first 2 of 4 results. Search to narrow the list.');

            dialog.search.value = 'a';
            await dialog.search.dispatch('input');

            expect(dialog.filteredData).toHaveLength(4);
            expect(getRenderedRows()).toHaveLength(2);
            expect(dialog.feedback.messageElement.textContent)
                .toBe('Showing first 2 of 4 matching results. Refine your search to narrow the list.');

            dialog.search.value = 'Target';
            await dialog.search.dispatch('input');

            expect(dialog.filteredData).toEqual([
                { title: 'Target outside initial limit' }
            ]);
            expect(getRenderedRows()).toHaveLength(1);
            expect(getRenderedRows()[0].children[0].textContent)
                .toBe('Target outside initial limit');
            expect(dialog.feedback.element.hidden).toBe(true);

            dialog.close(null);
            await expect(resultPromise).resolves.toBeNull();
        } finally {
            harness.restore();
        }
    });
});

describe('multifield lookup editor', () => {
    test('maps the complete selected record and exposes only visible dialog fields', async () => {
        const originalDocument = globalThis.document;
        const createElement = () => {
            const listeners = new Map();

            return {
                children: [],
                dataset: {},
                value: '',
                appendChild(child) {
                    this.children.push(child);
                },
                addEventListener(type, listener) {
                    listeners.set(type, listener);
                },
                async dispatch(type, event = {}) {
                    return listeners.get(type)?.({
                        preventDefault() {},
                        stopPropagation() {},
                        ...event
                    });
                },
                focus() {},
                setSelectionRange() {}
            };
        };
        const record = {
            istatCode: '065078',
            municipalityName: 'Nocera Inferiore',
            province: 'SA',
            region: 'CAMPANIA',
            postalCode: '84014'
        };
        const source = createLookup({
            keyField: 'istatCode',
            valueField: 'istatCode',
            labelField: 'municipalityName',
            columns: [
                { field: 'municipalityName', visible: true },
                { field: 'province', visible: true },
                { field: 'region', visible: true },
                { field: 'postalCode', visible: true },
                { field: 'istatCode', visible: false }
            ],
            search: { fields: 'visible' },
            mapToRow: {
                istatCode: 'istatCode',
                municipality: 'municipalityName',
                province: 'province',
                region: 'region',
                postalCode: 'postalCode'
            },
            load: () => [record]
        });
        const dialog = {
            open: async options => {
                expect(options.columns.map(column => column.field))
                    .toEqual(['municipalityName', 'province', 'region', 'postalCode']);
                expect(options.searchFields)
                    .toEqual(['municipalityName', 'province', 'region', 'postalCode']);
                expect(options.columns.some(column => column.field === 'istatCode')).toBe(false);
                return record;
            }
        };
        const rowData = {
            id: 1,
            istatCode: '',
            municipality: '',
            province: '',
            region: '',
            postalCode: ''
        };
        const row = {
            getData: () => rowData,
            update: patch => Object.assign(rowData, patch)
        };
        const cell = {
            getValue: () => rowData.municipality,
            getField: () => 'municipality',
            getRow: () => row,
            getElement: () => ({ dataset: {} })
        };
        const success = value => {
            rowData.municipality = value;
        };
        const applyRecord = (targetCell, patch) => {
            expect(targetCell).toBe(cell);
            Object.assign(rowData, patch);
            return row;
        };

        globalThis.document = { createElement };

        try {
            const editor = createLookupEditor(source, { dialog });

            editor._ambSetLookupErrorHandlers({
                markInvalid() {},
                clearInvalid() {},
                applyRecord
            });

            const container = editor(cell, callback => callback(), success, () => {});

            await container.children[1].dispatch('click');

            expect(rowData).toEqual(expect.objectContaining({
                istatCode: '065078',
                municipality: 'Nocera Inferiore',
                province: 'SA',
                region: 'CAMPANIA',
                postalCode: '84014'
            }));
        } finally {
            globalThis.document = originalDocument;
        }
    });
});
