import { describe, expect, test } from 'vitest';
import { createLookup } from '../src/lib/lookup.js';
import { lookup as createLookupEditor } from '../src/lib/editors/lookup-editor.js';
import { LookupDialog } from '../src/ui/lookup-dialog.js';

const columns = [
    { field: 'municipalityName', title: 'Municipality', visible: true },
    { field: 'province', title: 'Province', visible: true },
    { field: 'istatCode', title: 'ISTAT Code', visible: false }
];

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
