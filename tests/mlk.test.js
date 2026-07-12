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

const createMunicipalityLookup = () => createLookup({
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
    load: () => records
});

const createMunicipalityMlk = (options = {}) => createMultifieldLookup({
    id: 'municipality',
    lookup: createMunicipalityLookup(),
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
    ...options
});

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
