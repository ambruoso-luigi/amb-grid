import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'vitest';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tableFactoryPath = resolve(repositoryRoot, 'src/lib/table/table-factory.js');

const readTableFactorySource = () => readFileSync(tableFactoryPath, 'utf8');

describe('AMB table controller method modularization', () => {
    test('wires the extracted column method group into the controller composition', () => {
        const source = readTableFactorySource();

        expect(source).toContain("import { createColumnMethods } from './controller/column-methods.js';");
        expect(source).toContain('const columnMethods = createColumnMethods({ table });');

        const composition = source.match(/const controllerMethods = composeControllerMethods\(([\s\S]*?)\);/);

        expect(composition).not.toBeNull();
        expect(composition[1]).toContain('columnMethods');
        expect(composition[1]).toContain('dataMethods');
        expect(composition[1]).toContain('redrawMethods');
        expect(source).not.toContain('...columnMethods');
        expect(source).toContain('...controllerMethods');
        expect(source).not.toContain('column-visibility-methods.js');
    });

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

    test('wires the extracted sort method group into the controller composition', () => {
        const source = readTableFactorySource();

        expect(source).toContain("import { createSortMethods } from './controller/sort-methods.js';");
        expect(source).toContain('const sortMethods = createSortMethods({ table });');

        const composition = source.match(/const controllerMethods = composeControllerMethods\(([\s\S]*?)\);/);

        expect(composition).not.toBeNull();
        expect(composition[1]).toContain('sortMethods');
        expect(source).not.toContain('...sortMethods');
        expect(source).toContain('...controllerMethods');
    });

    test('wires the extracted export method group into the controller composition', () => {
        const source = readTableFactorySource();

        expect(source).toContain("import { createExportMethods } from './controller/export-methods.js';");
        expect(source).toContain('const exportMethods = createExportMethods({ table });');

        const composition = source.match(/const controllerMethods = composeControllerMethods\(([\s\S]*?)\);/);

        expect(composition).not.toBeNull();
        expect(composition[1]).toContain('exportMethods');
        expect(composition[1]).toContain('redrawMethods');
        expect(source).not.toContain('...exportMethods');
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
            /^\s*deselectRow\(identifier\) \{/m,
            /^\s*scrollToRow\(identifier,\s*\.\.\.args\) \{/m
        ];

        inlineSelectionDefinitions.forEach(pattern => {
            expect(source).not.toMatch(pattern);
        });
    });

    test('does not keep inline data method implementations in table-factory', () => {
        const source = readTableFactorySource();
        const inlineDataDefinitions = [
            /^\s*getData\(\.\.\.args\) \{/m,
            /^\s*getDataCount\(\.\.\.args\) \{/m,
            /^\s*searchData\(\.\.\.args\) \{/m
        ];

        inlineDataDefinitions.forEach(pattern => {
            expect(source).not.toMatch(pattern);
        });
    });

    test('does not keep inline header filter method implementations in table-factory', () => {
        const source = readTableFactorySource();
        const inlineFilterDefinitions = [
            /^\s*getFilters\(\.\.\.args\) \{/m,
            /^\s*addFilter\(\.\.\.args\) \{/m,
            /^\s*setFilter\(\.\.\.args\) \{/m,
            /^\s*removeFilter\(\.\.\.args\) \{/m,
            /^\s*clearFilter\(\.\.\.args\) \{/m,
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

    test('does not keep inline sorting method implementations in table-factory', () => {
        const source = readTableFactorySource();
        const inlineSortDefinitions = [
            /^\s*getSorters\(\) \{/m,
            /^\s*setSort\(\.\.\.args\) \{/m,
            /^\s*clearSort\(\) \{/m
        ];

        inlineSortDefinitions.forEach(pattern => {
            expect(source).not.toMatch(pattern);
        });
    });

    test('does not keep inline export method implementations in table-factory', () => {
        const source = readTableFactorySource();
        const inlineExportDefinitions = [
            /^\s*getHtml\(\.\.\.args\) \{/m,
            /^\s*copyToClipboard\(\.\.\.args\) \{/m,
            /^\s*download\(\.\.\.args\) \{/m,
            /^\s*downloadToTab\(\.\.\.args\) \{/m,
            /^\s*print\(\.\.\.args\) \{/m
        ];

        inlineExportDefinitions.forEach(pattern => {
            expect(source).not.toMatch(pattern);
        });
    });

    test('does not keep inline row method implementations in table-factory', () => {
        const source = readTableFactorySource();
        const inlineRowDefinitions = [
            /^\s*getRows\(\.\.\.args\) \{/m,
            /^\s*getRow\(identifier\) \{/m,
            /^\s*getRowPosition\(identifier,\s*\.\.\.args\) \{/m,
            /^\s*getRowFromPosition\(\.\.\.args\) \{/m,
            /^\s*scrollToRow\(identifier,\s*\.\.\.args\) \{/m,
            /^\s*searchRows\(\.\.\.args\) \{/m
        ];

        inlineRowDefinitions.forEach(pattern => {
            expect(source).not.toMatch(pattern);
        });
    });

    test('does not keep inline column method implementations in table-factory', () => {
        const source = readTableFactorySource();
        const inlineColumnDefinitions = [
            /^\s*getColumnDefinitions\(\) \{/m,
            /^\s*getColumns\(\.\.\.args\) \{/m,
            /^\s*getColumn\(columnLookup\) \{/m,
            /^\s*showColumn\(columnLookup\) \{/m,
            /^\s*hideColumn\(columnLookup\) \{/m,
            /^\s*toggleColumn\(columnLookup\) \{/m,
            /^\s*scrollToColumn\(\.\.\.args\) \{/m,
            /^\s*moveColumn\(\.\.\.args\) \{/m
        ];

        inlineColumnDefinitions.forEach(pattern => {
            expect(source).not.toMatch(pattern);
        });
    });

    test('keeps simple column visibility methods in the column method module', () => {
        const columnMethodsPath = resolve(repositoryRoot, 'src/lib/table/controller/column-methods.js');
        const source = readFileSync(columnMethodsPath, 'utf8');

        expect(source).toMatch(/showColumn\(columnLookup\) \{\s*return table\.showColumn\(columnLookup\);/);
        expect(source).toMatch(/hideColumn\(columnLookup\) \{\s*return table\.hideColumn\(columnLookup\);/);
        expect(source).toMatch(/toggleColumn\(columnLookup\) \{\s*return table\.toggleColumn\(columnLookup\);/);
        expect(source).toMatch(/scrollToColumn\(\.\.\.args\) \{\s*return table\.scrollToColumn\(\.\.\.args\);/);
        expect(source).toMatch(/moveColumn\(\.\.\.args\) \{\s*return table\.moveColumn\(\.\.\.args\);/);
        expect(source).not.toContain('column-navigation-methods.js');
        expect(source).not.toContain('column-move-methods.js');
        expect(source).not.toContain('const column = table.getColumn(columnLookup)');
        expect(source).not.toContain('setColumns(');
        expect(source).not.toContain('.move(');
        expect(source).not.toContain('.show()');
        expect(source).not.toContain('.hide()');
    });

    test('keeps row scrolling in the row method module', () => {
        const rowMethodsPath = resolve(repositoryRoot, 'src/lib/table/controller/row-methods.js');
        const source = readFileSync(rowMethodsPath, 'utf8');
        const tableFactorySource = readTableFactorySource();

        expect(source).toMatch(/scrollToRow\(identifier,\s*\.\.\.args\) \{\s*const ambRow = crud\.findRowByKey\(identifier\);\s*return table\.scrollToRow\(ambRow \|\| identifier, \.\.\.args\);/);
        expect(tableFactorySource).not.toContain('row-navigation-methods.js');
        expect(tableFactorySource).not.toContain('...rowMethods');
        expect(tableFactorySource).toContain('rowMethods');
        expect(tableFactorySource).toContain('...controllerMethods');
    });

    test('keeps one-off query search methods in data and row method modules', () => {
        const dataMethodsPath = resolve(repositoryRoot, 'src/lib/table/controller/data-methods.js');
        const rowMethodsPath = resolve(repositoryRoot, 'src/lib/table/controller/row-methods.js');
        const dataSource = readFileSync(dataMethodsPath, 'utf8');
        const rowSource = readFileSync(rowMethodsPath, 'utf8');
        const tableFactorySource = readTableFactorySource();
        const searchRowsMethod = rowSource.match(/searchRows\(\.\.\.args\) \{([\s\S]*?)\n    \},/);

        expect(dataSource).toMatch(/searchData\(\.\.\.args\) \{\s*return table\.searchData\(\.\.\.args\);/);
        expect(rowSource).toMatch(/searchRows\(\.\.\.args\) \{\s*return table\.searchRows\(\.\.\.args\);/);
        expect(searchRowsMethod).not.toBeNull();
        expect(searchRowsMethod[1]).not.toContain('crud.findRowByKey');
        expect(tableFactorySource).not.toContain('query-methods.js');
        expect(tableFactorySource).not.toContain('...dataMethods');
        expect(tableFactorySource).not.toContain('...rowMethods');
        expect(tableFactorySource).toContain('dataMethods');
        expect(tableFactorySource).toContain('rowMethods');
        expect(tableFactorySource).toContain('...controllerMethods');
    });

    test('keeps export methods in one export method module', () => {
        const controllerDir = resolve(repositoryRoot, 'src/lib/table/controller');
        const source = readFileSync(resolve(controllerDir, 'export-methods.js'), 'utf8');
        const tableFactorySource = readTableFactorySource();
        const controllerModules = readdirSync(controllerDir);

        expect(source).toMatch(/getHtml\(\.\.\.args\) \{\s*return table\.getHtml\(\.\.\.args\);/);
        expect(source).toMatch(/copyToClipboard\(\.\.\.args\) \{\s*return table\.copyToClipboard\(\.\.\.args\);/);
        expect(source).toMatch(/download\(\.\.\.args\) \{\s*return table\.download\(\.\.\.args\);/);
        expect(source).toMatch(/downloadToTab\(\.\.\.args\) \{\s*return table\.downloadToTab\(\.\.\.args\);/);
        expect(source).toMatch(/print\(\.\.\.args\) \{\s*return table\.print\(\.\.\.args\);/);
        expect(tableFactorySource).not.toContain('...exportMethods');
        expect(tableFactorySource).toContain('exportMethods');
        expect(tableFactorySource).toContain('...controllerMethods');
        expect(controllerModules).toContain('export-methods.js');
        expect(controllerModules).not.toContain('clipboard-methods.js');
        expect(controllerModules).not.toContain('download-methods.js');
        expect(controllerModules).not.toContain('html-methods.js');
        expect(controllerModules).not.toContain('print-methods.js');
        expect(controllerModules).not.toContain('output-methods.js');
    });
});
