import fs from 'node:fs';
import { describe, expect, test, vi } from 'vitest';
import { createLookup } from '../src/lib/lookup.js';
import { createMultifieldLookup } from '../src/lib/mlk.js';

const ambSource = fs.readFileSync(
    new URL('../src/lib/amb.js', import.meta.url),
    'utf8'
);

const records = [
    {
        istatCode: '042002',
        cadastralCode: 'A271',
        municipalityName: 'Ancona',
        province: 'AN',
        region: 'MARCHE',
        postalCode: '60100'
    }
];
const milanoRecord = {
    istatCode: '015146',
    cadastralCode: 'F205',
    municipalityName: 'Milano',
    province: 'MI',
    region: 'LOMBARDIA',
    postalCode: '20121'
};

const createMunicipalityLookup = ({
    rows = records,
    load,
    ...options
} = {}) => createLookup({
    keyField: 'istatCode',
    valueField: 'municipalityName',
    labelField: 'municipalityName',
    columns: [
        { field: 'municipalityName', title: 'Municipality', visible: true },
        { field: 'province', title: 'Province', visible: true },
        { field: 'region', title: 'Region', visible: true },
        { field: 'postalCode', title: 'Postal Code', visible: true },
        { field: 'istatCode', title: 'ISTAT Code', visible: false },
        { field: 'cadastralCode', title: 'Cadastral Code', visible: false }
    ],
    ...options,
    load: load || (() => rows)
});

const createMunicipalityMlk = (options = {}) => {
    const {
        lookup = createMunicipalityLookup(),
        ...mlkOptions
    } = options;

    return createMultifieldLookup({
    id: 'municipality',
    lookup,
    masterField: {
        field: 'municipality',
        from: 'municipalityName',
        title: 'Municipality',
        required: true,
        autocomplete: true,
        dialog: true
    },
    dependentFields: [
        {
            field: 'province',
            from: 'province',
            title: 'Province',
            required: true
        },
        {
            field: 'region',
            from: 'region',
            title: 'Region',
            required: true
        },
        {
            field: 'postalCode',
            from: 'postalCode',
            title: 'Postal Code',
            required: true
        },
        {
            field: 'istatCode',
            from: 'istatCode',
            title: 'ISTAT Code',
            visibleInLookup: false,
            searchable: false,
            required: true
        },
        {
            field: 'cadastralCode',
            from: 'cadastralCode',
            title: 'Cadastral Code',
            visibleInLookup: false,
            searchable: false,
            required: true
        }
    ],
    ...mlkOptions
    });
};

const createElement = tagName => {
    const listeners = new Map();

    return {
        tagName,
        children: [],
        dataset: {},
        value: '',
        selectionStart: 0,
        selectionEnd: 0,
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
        select() {},
        setSelectionRange(start, end) {
            this.selectionStart = start;
            this.selectionEnd = end;
        }
    };
};

const flushDeferred = () => new Promise(resolve => {
    globalThis.setTimeout(resolve, 0);
});

const createMlkEditorHarness = ({
    rows = [milanoRecord],
    columnOptions = {},
    lookup = createMunicipalityLookup({ rows }),
    initialRowData = {}
} = {}) => {
    const mlk = createMunicipalityMlk({ lookup });
    const column = mlk.masterColumn({
        dialog: null,
        ...columnOptions
    });
    const rowData = {
        id: 1,
        municipality: '',
        province: '',
        region: '',
        postalCode: '',
        istatCode: '',
        cadastralCode: '',
        ...initialRowData
    };
    const cellElement = { dataset: {} };
    const applyRecord = vi.fn((_cell, patch) => {
        Object.assign(rowData, patch);
        return true;
    });
    const row = {
        getData: () => rowData,
        update: patch => Object.assign(rowData, patch),
        getCells: () => []
    };
    const cell = {
        getValue: () => rowData.municipality,
        getField: () => 'municipality',
        getRow: () => row,
        getElement: () => cellElement,
        navigateNext: vi.fn(),
        navigatePrev: vi.fn()
    };
    const success = vi.fn(value => {
        rowData.municipality = value;
    });
    const cancel = vi.fn();

    column.editor._ambSetLookupErrorHandlers({
        markInvalid() {},
        clearInvalid() {},
        applyRecord
    });

    const container = column.editor(cell, () => {}, success, cancel);

    return {
        applyRecord,
        cancel,
        cell,
        column,
        container,
        input: container.children[0],
        lookup,
        mlk,
        rowData,
        success
    };
};

describe('AMB.mlk', () => {
    test('is exposed from the public AMB namespace', () => {
        expect(ambSource).toContain("import { createMultifieldLookup } from './mlk.js'");
        expect(ambSource).toContain('mlk: createMultifieldLookup');
    });

    test('validates required configuration', () => {
        expect(() => createMultifieldLookup()).toThrow(/id/);
        expect(() => createMultifieldLookup({
            id: 'x',
            lookup: createMunicipalityLookup()
        })).toThrow(/masterField/);
        expect(() => createMultifieldLookup({
            id: 'x',
            lookup: createMunicipalityLookup(),
            masterField: { from: 'name' }
        })).toThrow(/masterField.field/);
        expect(() => createMultifieldLookup({
            id: 'x',
            lookup: createMunicipalityLookup(),
            masterField: { field: 'name' }
        })).toThrow(/masterField.from/);
        expect(() => createMultifieldLookup({
            id: 'x',
            lookup: {},
            masterField: { field: 'name', from: 'name' }
        })).toThrow(/record-based lookup/);
        expect(() => createMultifieldLookup({
            id: 'x',
            lookup: createMunicipalityLookup(),
            masterField: { field: 'name', from: 'name' },
            dependentFields: [{ from: 'province' }]
        })).toThrow(/dependentFields.field/);
        expect(() => createMultifieldLookup({
            id: 'x',
            lookup: createMunicipalityLookup(),
            masterField: { field: 'name', from: 'name' },
            dependentFields: [{ field: 'province' }]
        })).toThrow(/dependentFields.from/);
    });

    test('normalizes dependent defaults without requiring technicalFields', () => {
        const mlk = createMunicipalityMlk();

        expect(mlk.readonlyDependents).toBe(true);
        expect(mlk.clearDependentsOnEmptyMaster).toBe(true);
        expect(mlk.clearDependentsOnInvalidMaster).toBe(true);
        expect(mlk).not.toHaveProperty('technicalFields');
        expect(mlk.dependentFields[0]).toMatchObject({
            field: 'province',
            from: 'province',
            readonly: true,
            visibleInGrid: true,
            visibleInLookup: true,
            searchable: true
        });
    });

    test('creates an atomic patch using explicit from to field mapping', () => {
        const mlk = createMunicipalityMlk();

        expect(mlk.mapToRow).toEqual({
            municipality: 'municipalityName',
            province: 'province',
            region: 'region',
            postalCode: 'postalCode',
            istatCode: 'istatCode',
            cadastralCode: 'cadastralCode'
        });
        expect(mlk.createPatch(records[0])).toEqual({
            municipality: 'Ancona',
            province: 'AN',
            region: 'MARCHE',
            postalCode: '60100',
            istatCode: '042002',
            cadastralCode: 'A271'
        });
    });

    test('maps hidden lookup fields while keeping them out of dialog columns', () => {
        const mlk = createMunicipalityMlk();

        expect(mlk.lookupColumns.map(column => column.field)).toEqual([
            'municipalityName',
            'province',
            'region',
            'postalCode'
        ]);
        expect(mlk.createPatch(records[0]).istatCode).toBe('042002');
        expect(mlk.createPatch(records[0]).cadastralCode).toBe('A271');
    });

    test('creates clear patches for dependent fields', () => {
        const mlk = createMunicipalityMlk();

        expect(mlk.createClearPatch()).toEqual({
            province: '',
            region: '',
            postalCode: '',
            istatCode: '',
            cadastralCode: ''
        });
        expect(mlk.createClearPatch({ includeMaster: true })).toEqual({
            municipality: '',
            province: '',
            region: '',
            postalCode: '',
            istatCode: '',
            cadastralCode: ''
        });
    });

    test('masterColumn creates an autocomplete lookup editor with MLK mapping', () => {
        const mlk = createMunicipalityMlk();
        const column = mlk.masterColumn({
            width: 220,
            dialog: { open: vi.fn() }
        });

        expect(column.field).toBe('municipality');
        expect(column.width).toBe(220);
        expect(column.required).toBe(true);
        expect(column.editor._ambEditorType).toBe('lookup');
        expect(column.editor._ambLookupConfig.lookupInstance).toBe(mlk.lookup);
        expect(mlk.lookup.caseSensitive).toBe(false);
        expect(column.editor._ambLookupConfig.caseSensitive).toBe(false);
    });

    test('masterColumn respects a caseSensitive editor override', () => {
        const mlk = createMunicipalityMlk();
        const column = mlk.masterColumn({
            editorOptions: {
                caseSensitive: true
            }
        });

        expect(mlk.lookup.caseSensitive).toBe(false);
        expect(column.editor._ambLookupConfig.caseSensitive).toBe(true);
    });

    test('case-insensitive MLK autocomplete applies one canonical master and dependent patch', async () => {
        const originalDocument = globalThis.document;

        globalThis.document = { createElement };

        try {
            const harness = createMlkEditorHarness();

            harness.input.value = 'mila';
            await harness.input.dispatch('input', {
                inputType: 'insertText'
            });
            await Promise.resolve();
            await harness.input.dispatch('keydown', { key: 'Tab' });
            await flushDeferred();

            expect(harness.input.value).toBe('Milano');
            expect(harness.applyRecord).toHaveBeenCalledWith(
                harness.cell,
                {
                    municipality: 'Milano',
                    province: 'MI',
                    region: 'LOMBARDIA',
                    postalCode: '20121',
                    istatCode: '015146',
                    cadastralCode: 'F205'
                },
                milanoRecord
            );
            expect(harness.success).toHaveBeenCalledWith('Milano');
            expect(harness.rowData).toEqual(expect.objectContaining({
                municipality: 'Milano',
                province: 'MI',
                region: 'LOMBARDIA',
                postalCode: '20121',
                istatCode: '015146',
                cadastralCode: 'F205'
            }));
        } finally {
            globalThis.document = originalDocument;
        }
    });

    test('caseSensitive override keeps lowercase MLK input invalid and clears stale dependents', async () => {
        const originalDocument = globalThis.document;

        globalThis.document = { createElement };

        try {
            const harness = createMlkEditorHarness({
                columnOptions: {
                    editorOptions: {
                        caseSensitive: true
                    }
                },
                initialRowData: {
                    municipality: 'Milano',
                    province: 'MI',
                    region: 'LOMBARDIA',
                    postalCode: '20121',
                    istatCode: '015146',
                    cadastralCode: 'F205'
                }
            });

            harness.input.value = 'mila';
            await harness.input.dispatch('keydown', { key: 'Tab' });
            await flushDeferred();

            expect(harness.success).toHaveBeenCalledWith('mila');
            expect(harness.applyRecord).toHaveBeenCalledWith(
                harness.cell,
                {
                    province: '',
                    region: '',
                    postalCode: '',
                    istatCode: '',
                    cadastralCode: ''
                },
                null
            );
            expect(harness.rowData).toEqual(expect.objectContaining({
                municipality: 'mila',
                province: '',
                region: '',
                postalCode: '',
                istatCode: '',
                cadastralCode: ''
            }));
        } finally {
            globalThis.document = originalDocument;
        }
    });

    test('dependentColumn creates readonly derived columns and validates fields', () => {
        const mlk = createMunicipalityMlk();
        const column = mlk.dependentColumn('province', {
            width: 100,
            title: 'Provincia'
        });

        expect(column).toMatchObject({
            field: 'province',
            title: 'Provincia',
            width: 100,
            editable: false,
            editor: undefined,
            required: false
        });
        expect(column.cssClass).toContain('amb-cell--readonly-passive');
        expect(column.validator.validate('', { municipality: '' })).toBe(true);
        expect(column.validator.validate('', { municipality: 'Ancona' })).toBe(false);
        expect(column.validator.validate('AN', { municipality: 'Ancona' })).toBe(true);
        expect(() => mlk.dependentColumn('missing')).toThrow(/does not define dependent field/);
    });

    test('validates required master and required dependent values as a group', () => {
        const mlk = createMunicipalityMlk();

        expect(mlk.validateMasterValue('', {})).toBe(false);
        expect(mlk.validateMasterValue('Ancona', {
            province: 'AN',
            region: 'MARCHE',
            postalCode: '60100',
            istatCode: '042002',
            cadastralCode: 'A271'
        })).toBe(true);
        expect(mlk.validateMasterValue('Ancona', {
            province: '',
            region: 'MARCHE',
            postalCode: '60100',
            istatCode: '042002',
            cadastralCode: 'A271'
        })).toBe(false);
    });
});
