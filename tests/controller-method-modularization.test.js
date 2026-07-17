import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'vitest';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tableFactoryPath = resolve(repositoryRoot, 'src/lib/table/table-factory.js');

const readTableFactorySource = () => readFileSync(tableFactoryPath, 'utf8');

describe('AMB table controller method modularization', () => {
    test('wires the extracted selection method group into the controller composition', () => {
        const source = readTableFactorySource();

        expect(source).toContain("import { createSelectionMethods } from './controller/selection-methods.js';");
        expect(source).toContain('const selectionMethods = createSelectionMethods({ table, crud });');

        const composition = source.match(/const controllerMethods = composeControllerMethods\(([\s\S]*?)\);/);

        expect(composition).not.toBeNull();
        expect(composition[1]).toContain('dataMethods');
        expect(composition[1]).toContain('rowMethods');
        expect(composition[1]).toContain('paginationMethods');
        expect(composition[1]).toContain('selectionMethods');
        expect(composition[1]).toContain('redrawMethods');
        expect(source).not.toContain('...selectionMethods');
        expect(source).toContain('...controllerMethods');
    });

    test('wires the extracted filter method group into the controller composition', () => {
        const source = readTableFactorySource();

        expect(source).toContain("import { createFilterMethods } from './controller/filter-methods.js';");
        expect(source).toContain('const filterMethods = createFilterMethods({');
        expect(source).toContain('searchController');
        expect(source).not.toContain('const filterMethods = createFilterMethods({ table });');
        expect(source.indexOf('searchController = createSearchController({'))
            .toBeLessThan(source.indexOf('const filterMethods = createFilterMethods({'));

        const composition = source.match(/const controllerMethods = composeControllerMethods\(([\s\S]*?)\);/);

        expect(composition).not.toBeNull();
        expect(composition[1]).toContain('dataMethods');
        expect(composition[1]).toContain('rowMethods');
        expect(composition[1]).toContain('paginationMethods');
        expect(composition[1]).toContain('selectionMethods');
        expect(composition[1]).toContain('filterMethods');
        expect(composition[1]).toContain('redrawMethods');
        expect(source).not.toContain('...filterMethods');
        expect(source).toContain('...controllerMethods');
    });

    test('wires the extracted search method group after search controller creation', () => {
        const source = readTableFactorySource();

        expect(source).toContain("import { createSearchMethods } from './controller/search-methods.js';");
        expect(source).toContain('const searchMethods = createSearchMethods({ searchController });');
        expect(source.indexOf('searchController = createSearchController({'))
            .toBeLessThan(source.indexOf('const searchMethods = createSearchMethods({ searchController });'));

        const composition = source.match(/const controllerMethods = composeControllerMethods\(([\s\S]*?)\);/);

        expect(composition).not.toBeNull();
        expect(composition[1]).toContain('dataMethods');
        expect(composition[1]).toContain('rowMethods');
        expect(composition[1]).toContain('paginationMethods');
        expect(composition[1]).toContain('selectionMethods');
        expect(composition[1]).toContain('filterMethods');
        expect(composition[1]).toContain('searchMethods');
        expect(composition[1]).toContain('redrawMethods');
        expect(source).not.toContain('...searchMethods');
        expect(source).toContain('...controllerMethods');
    });

    test('does not keep inline selection method implementations in table-factory', () => {
        const source = readTableFactorySource();
        const inlineSelectionDefinitions = [
            /^\s*getSelectedRows\(\) \{/m,
            /^\s*getSelectedData\(\) \{/m,
            /^\s*getSelectedRowComponents\(\) \{/m,
            /^\s*clearSelection\(\) \{/m,
            /^\s*selectRow\(identifier\) \{/m,
            /^\s*deselectRow\(identifier\) \{/m
        ];

        inlineSelectionDefinitions.forEach(pattern => {
            expect(source).not.toMatch(pattern);
        });
    });

    test('does not keep inline header filter method implementations in table-factory', () => {
        const source = readTableFactorySource();
        const inlineFilterDefinitions = [
            /^\s*getFilters\(\.\.\.args\) \{/m,
            /^\s*addFilter\(\.\.\.args\) \{/m,
            /^\s*getHeaderFilters\(\) \{/m,
            /^\s*getHeaderFilterValue\(columnLookup\) \{/m,
            /^\s*setHeaderFilterValue\(columnLookup, value\) \{/m,
            /^\s*setHeaderFilterFocus\(columnLookup\) \{/m,
            /^\s*clearHeaderFilter\(\) \{/m,
            /^\s*refreshFilter\(\) \{/m
        ];

        inlineFilterDefinitions.forEach(pattern => {
            expect(source).not.toMatch(pattern);
        });
    });

    test('does not keep inline global search method implementations in table-factory', () => {
        const source = readTableFactorySource();
        const inlineSearchDefinitions = [
            /^\s*setSearchQuery\(query\) \{/m,
            /^\s*clearSearch\(\) \{/m,
            /^\s*getSearchState\(\) \{/m,
            /^\s*setSearchFields\(fields\) \{/m,
            /^\s*setSearchOptions\(options\) \{/m
        ];

        inlineSearchDefinitions.forEach(pattern => {
            expect(source).not.toMatch(pattern);
        });
    });
});
