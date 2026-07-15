import fs from 'node:fs';
import { describe, expect, test } from 'vitest';

const testSource = fs.readFileSync(
    new URL('../src/demo/test.js', import.meta.url),
    'utf8'
);
const testHtml = fs.readFileSync(
    new URL('../test/index.html', import.meta.url),
    'utf8'
);

describe('technical test page', () => {
    test('uses the standard AMB selection column with switchable mode', () => {
        expect(testSource).toContain('selectionColumn: {');
        expect(testSource).toContain('enabled: true');
        expect(testSource).toContain('mode: selectionMode');
        expect(testSource).toContain("const createGrid = async (selectionMode = 'single')");
        expect(testSource).toContain("grid.getSelectedRows()");
        expect(testHtml).toContain('id="selection-mode"');
        expect(testHtml).toContain('value="multiple"');
        expect(testHtml).toContain('<option value="single" selected>');
        expect(testSource).not.toContain('amb-selection-column__input');
        expect(testSource).not.toContain("titleFormatter: 'rowSelection'");
    });

    test('does not load public demo modules or force checkbox labels', () => {
        expect(testSource).not.toContain("import './demo.css'");
        expect(testSource).not.toContain("from './full-demo.js'");
        expect(testSource).not.toContain("from './main.js'");
        expect(testSource).not.toContain("from './autocomplete.js'");
        expect(testSource).not.toContain('createDemoReportDialog');
        expect(testHtml).not.toContain('demo.css');
        expect(testSource).toContain('formatter: AMB.formatters.checkbox()');
        expect(testSource).toContain('editor: AMB.editors.checkbox()');
        expect(testSource).not.toContain("checkedLabel: 'Yes'");
        expect(testSource).not.toContain("uncheckedLabel: 'No'");
    });

    test('adds an isolated Multifield Lookup municipality baseline grid', () => {
        expect(testHtml).toContain('id="multifield-lookup-test-table"');
        expect(testHtml).toContain('Italian municipality Multifield Lookup');
        expect(testSource).toContain('const createMultifieldLookupGrid = async () => {');
        expect(testSource).toContain("selector: '#multifield-lookup-test-table'");
        expect(testSource).toContain('MUNICIPALITY_LOOKUP_COLUMNS');
        expect(testSource).toContain('AMB.multifieldLookup({');
        expect(testSource).toContain("valueField: 'municipalityName'");
        expect(testSource).toContain("field: 'municipality'");
        expect(testSource).toContain("from: 'municipalityName'");
        expect(testSource).toContain("field: 'province'");
        expect(testSource).toContain("from: 'province'");
        expect(testSource).toContain("field: 'region'");
        expect(testSource).toContain("field: 'postalCode'");
        expect(testSource).toContain("field: 'istatCode'");
        expect(testSource).toContain("visibleInLookup: false");
        expect(testSource).toContain("field: 'cadastralCode'");
        expect(testSource).toContain('municipalityMultifieldLookup.masterColumn({');
        expect(testSource).toContain("municipalityMultifieldLookup.dependentColumn('province'");
        expect(testSource).toContain('currentMultifieldLookupGrid = await createMultifieldLookupGrid();');
        expect(testSource).not.toContain('MUNICIPALITY_MAP_TO_ROW');
        expect(testSource).not.toContain('applyMunicipalitySelection');
        expect(testSource).not.toContain('createMunicipalityPatch');
        expect(testSource).not.toContain('mapToRow: MUNICIPALITY_MAP_TO_ROW');
    });

    test('places the municipality Multifield Lookup between normal text editor columns', () => {
        expect(testSource).toContain("textBefore: 'Before Nocera'");
        expect(testSource).toContain("textAfter: 'After Nocera'");
        expect(testSource).toContain("textBefore: 'Before Milano'");
        expect(testSource).toContain("textAfter: 'After Milano'");
        expect(testSource).toContain("title: 'Text before'");
        expect(testSource).toContain("field: 'textBefore'");
        expect(testSource).toContain("title: 'Text after'");
        expect(testSource).toContain("field: 'textAfter'");
        expect(
            testSource.match(/editor: AMB\.editors\.text\(\{ trim: true \}\)/g)
                .length
        ).toBeGreaterThanOrEqual(2);
        expect(testSource.indexOf("field: 'textBefore'")).toBeLessThan(
            testSource.indexOf('municipalityMultifieldLookup.masterColumn({')
        );
        expect(testSource.indexOf("municipalityMultifieldLookup.dependentColumn('cadastralCode'")).toBeLessThan(
            testSource.indexOf("field: 'textAfter'")
        );
    });

    test('enables autocomplete on both lookup editors in the technical test page', () => {
        expect(testSource).toContain('const testLookupAutoCompleteOptions = {');
        expect(testSource).toContain('autoComplete: true');
        expect(testSource).toContain('autoCompleteMinChars: 1');
        expect(testSource).toContain('autoCompleteOnTab: true');
        expect(testSource).toContain('showDescription: false');
        expect(
            testSource.match(/\.\.\.testLookupAutoCompleteOptions/g)
        ).toHaveLength(2);
    });

    test('adds an isolated autocomplete technical grid from the demo behavior', () => {
        expect(testHtml).toContain('id="autocomplete-test-table"');
        expect(testHtml).toContain('Autocomplete');
        expect(testSource).toContain('let currentAutocompleteGrid = null;');
        expect(testSource).toContain('const createAutocompleteGrid = () => {');
        expect(testSource).toContain("selector: '#autocomplete-test-table'");
        expect(testSource).toContain("currentAutocompleteGrid = createAutocompleteGrid();");
        expect(testSource).toContain("'add'");
        expect(testSource).toContain("'payload'");
        expect(testSource).toContain("'validate'");
        expect(testSource).toContain("field: 'department'");
        expect(testSource).toContain("field: 'requiredDepartment'");
        expect(testSource).toContain("field: 'tag'");
        expect(testSource).toContain("field: 'city'");
        expect(testSource).toContain('allowCustomValue: false');
        expect(testSource).toContain('allowCustomValue: true');
        expect(testSource).toContain("invalidBehavior: 'commitRaw'");
        expect(testSource).toContain('maxOptions: 5');
        expect(testSource).toContain('caseSensitive: false');
        expect(testSource).not.toContain('create-autocomplete-anomalies');
        expect(testSource).not.toContain('reset-autocomplete');
    });
});
