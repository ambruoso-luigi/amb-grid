import fs from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
    applyMunicipalitySelection,
    createMunicipalityPatch
} from '../src/demo/multifield-lookup-config.js';

const datasetPath = new URL(
    '../src/demo/data/italian-municipalities.demo.json',
    import.meta.url
);
const municipalities = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
const demoSource = fs.readFileSync(
    new URL('../src/demo/multifield-lookup.js', import.meta.url),
    'utf8'
);
const testPageSource = fs.readFileSync(
    new URL('../src/demo/test.js', import.meta.url),
    'utf8'
);
const demoMenuSource = fs.readFileSync(
    new URL('../src/demo/main.js', import.meta.url),
    'utf8'
);
const libraryCss = fs.readFileSync(
    new URL('../src/amb-grid.css', import.meta.url),
    'utf8'
);

describe('Italian municipalities demo dataset', () => {
    test('contains a realistic, uniquely keyed municipality list', () => {
        const keys = municipalities.map(record => record.istatCode);

        expect(municipalities.length).toBeGreaterThan(7000);
        expect(new Set(keys).size).toBe(municipalities.length);
        expect(municipalities.every(record => {
            return typeof record.istatCode === 'string'
                && record.istatCode.length === 6
                && typeof record.cadastralCode === 'string'
                && typeof record.municipalityName === 'string'
                && typeof record.province === 'string'
                && typeof record.region === 'string'
                && typeof record.postalCode === 'string'
                && record.postalCode.trim() !== ''
                && /^\d{5}$/.test(record.postalCode)
                && !record.postalCode.includes(',');
        })).toBe(true);

        expect(municipalities.some(record => Array.isArray(record.postalCode))).toBe(false);
    });

    test('contains the documented Nocera Inferiore mapping', () => {
        const municipality = municipalities.find(record => {
            return record.istatCode === '065078';
        });

        expect(municipality).toEqual({
            istatCode: '065078',
            cadastralCode: 'F912',
            municipalityName: 'Nocera Inferiore',
            province: 'SA',
            region: 'CAMPANIA',
            postalCode: '84014'
        });
    });

    test('keeps the public demo reachable and free of hardcoded row rollback', () => {
        expect(demoMenuSource).toContain("import multifieldLookup from './multifield-lookup.js'");
        expect(demoMenuSource).toContain("titleKey: 'examples.multifieldLookup.title'");
        expect(demoSource).not.toContain('Rollback first row');
        expect(demoSource).not.toContain('rollbackRow(1)');
        expect(demoSource).not.toContain('AMB.editors.lookup(');
        expect(demoSource).toContain('masterColumn({');
        expect(demoSource).toContain('dependentColumn(\'province\'');
        expect(demoSource).toContain("valueField: 'municipalityName'");
        expect(demoSource).toContain("keyField: 'istatCode'");
        expect(demoSource).toContain('AMB.multifieldLookup({');
        expect(demoSource).toContain('municipalityMultifieldLookup.masterColumn({');
        expect(demoSource).toContain('autoComplete: true');
        expect(demoSource).not.toContain('LOOKUP_OPEN_DELAY');
        expect(demoSource).not.toContain('pendingLookupTimer');
        expect(demoSource).not.toContain('scheduleMunicipalityLookup');
        expect(demoSource).not.toContain('cellDblClick');
        expect(demoSource).not.toContain('lookupBusy');
        expect(demoSource).toContain('autoCompleteMinChars: 1');
        expect(demoSource).toContain('autoCompleteOnTab: true');
        expect(demoSource).toContain('query');
        expect(demoSource).toContain('filterMunicipalities');
        expect(demoSource).toContain('closeOnBackdropClick: false');
        expect(demoSource).toContain('pagination: {');
        expect(demoSource).toContain('enabled: true');
        expect(demoSource).toContain('pageSize: 100');
        expect(demoSource).toContain("controls: 'full'");
        expect(demoSource).not.toContain('initialRenderLimit: 150');
        expect(demoSource).toContain("'add'");
        expect(demoSource).toContain('onAdd: handleAddRow');
        expect(demoSource).not.toContain("label: 'Add row'");
        expect(demoSource).not.toContain('onClick: handleAddRow');
        expect(demoSource).toContain("masterField: {");
        expect(demoSource).toContain("title: 'Municipality'");
        expect(demoSource).toContain("dependentColumn('province'");
        expect(demoSource).toContain('This dataset is provided for demonstration purposes only.');
    });

    test('loads the tracked demo dataset through a Vite-managed module URL', () => {
        expect(demoSource).toContain(
            "new URL('./data/italian-municipalities.demo.json', import.meta.url)"
        );
        expect(demoSource).toContain('const response = await fetch(DATASET_URL)');
        expect(demoSource).not.toContain('import.meta.env.BASE_URL');
        expect(municipalities.length).toBeGreaterThan(7000);
    });

    test('loads the technical test page dataset through a Vite-managed module URL', () => {
        expect(testPageSource).toMatch(
            /new URL\(\s*['"]\.\/data\/italian-municipalities\.demo\.json['"]\s*,\s*import\.meta\.url\s*\)/
        );
        expect(testPageSource).not.toContain('import.meta.env.BASE_URL');
    });

    test('keeps readonly visual utilities zebra-safe by default', () => {
        expect(libraryCss).toContain('--amb-readonly-passive-marker');
        expect(libraryCss).toContain('--amb-readonly-actionable-marker');
        expect(libraryCss).toContain('--amb-readonly-actionable-hover-bg: transparent');
        expect(libraryCss).toContain('box-shadow: inset 3px 0 0 var(--amb-readonly-passive-marker)');
        expect(libraryCss).toContain('box-shadow: inset 3px 0 0 var(--amb-readonly-actionable-marker)');
        expect(libraryCss).not.toContain('--amb-readonly-passive-bg');
        expect(libraryCss).not.toContain('--amb-readonly-actionable-bg');
    });

    test('builds one complete synchronized patch from the selected record', () => {
        expect(createMunicipalityPatch({
            istatCode: '065078',
            cadastralCode: 'F912',
            municipalityName: 'Nocera Inferiore',
            province: 'SA',
            region: 'CAMPANIA',
            postalCode: '84014'
        })).toEqual({
            istatCode: '065078',
            cadastralCode: 'F912',
            municipality: 'Nocera Inferiore',
            province: 'SA',
            region: 'CAMPANIA',
            postalCode: '84014'
        });
    });

    test('applies the complete patch through CRUD and leaves canceled selections untouched', () => {
        const calls = [];
        const crud = {
            options: {
                idField: 'id',
                tempIdField: '_ambTempId',
                stateField: '_state'
            },
            updateRowFields(identifier, patch) {
                calls.push({ identifier, patch });
                return {};
            }
        };
        const rowData = {
            id: null,
            _ambTempId: 'amb-temp-7',
            _state: 'new'
        };
        const selected = {
            istatCode: '065078',
            cadastralCode: 'F912',
            municipalityName: 'Nocera Inferiore',
            province: 'SA',
            region: 'CAMPANIA',
            postalCode: '84014'
        };

        expect(applyMunicipalitySelection({
            selected: null,
            rowData,
            crud
        })).toBe(false);
        expect(calls).toEqual([]);

        expect(applyMunicipalitySelection({
            selected,
            rowData,
            crud
        })).toBe(true);
        expect(calls).toEqual([{
            identifier: 'amb-temp-7',
            patch: {
                istatCode: '065078',
                cadastralCode: 'F912',
                municipality: 'Nocera Inferiore',
                province: 'SA',
                region: 'CAMPANIA',
                postalCode: '84014'
            }
        }]);
    });
});
