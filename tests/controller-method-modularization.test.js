import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'vitest';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tableFactoryPath = resolve(repositoryRoot, 'src/lib/table/table-factory.js');

const readTableFactorySource = () => readFileSync(tableFactoryPath, 'utf8');

describe('AMB table controller method modularization', () => {
    test('wires the extracted alert method group into the controller composition', () => {
        const source = readTableFactorySource();
        const controllerDir = resolve(repositoryRoot, 'src/lib/table/controller');
        const alertMethodsPath = resolve(controllerDir, 'alert-methods.js');
        const alertSource = readFileSync(alertMethodsPath, 'utf8');
        const controllerModules = readdirSync(controllerDir);
        const composition = source.match(/const controllerMethods = composeControllerMethods\(([\s\S]*?)\);/);
        const inlineAlertDefinitions = [
            /^\s*alert\(\.\.\.args\) \{/m,
            /^\s*clearAlert\(\) \{/m
        ];

        expect(source).toContain("import { createAlertMethods } from './controller/alert-methods.js';");
        expect(source).toContain('const alertMethods = createAlertMethods({ table });');
        expect(composition).not.toBeNull();
        expect(composition[1]).toContain('alertMethods');
        expect(composition[1]).toContain('calculationMethods');
        expect(source).not.toContain('...alertMethods');
        expect(source).toContain('...controllerMethods');

        inlineAlertDefinitions.forEach(pattern => {
            expect(source).not.toMatch(pattern);
        });

        expect(controllerModules).toContain('alert-methods.js');
        expect(controllerModules).not.toContain('table-alert-methods.js');
        expect(controllerModules).not.toContain('clear-alert-methods.js');
        expect(controllerModules).not.toContain('modal-methods.js');
        expect(controllerModules).not.toContain('message-methods.js');
        expect(alertSource).toMatch(/createAlertMethods = \(\{ table \}\) => \(\{/);
        expect(alertSource).toMatch(/alert\(\.\.\.args\) \{\s*return table\.alert\(\.\.\.args\);/);
        expect(alertSource).toMatch(/clearAlert\(\) \{\s*return table\.clearAlert\(\);/);
        expect(alertSource).not.toContain('FloatingMessage');
        expect(alertSource).not.toContain('FeedbackRegion');
        expect(alertSource).not.toContain('ConfirmDialog');
        expect(alertSource).not.toContain('CrudHelper');
        expect(alertSource).not.toContain('window.alert');
        expect(alertSource).not.toContain('document.querySelector');
    });

    test('wires the extracted calculation method group into the controller composition', () => {
        const source = readTableFactorySource();

        expect(source).toContain("import { createCalculationMethods } from './controller/calculation-methods.js';");
        expect(source).toContain('const calculationMethods = createCalculationMethods({ table });');

        const composition = source.match(/const controllerMethods = composeControllerMethods\(([\s\S]*?)\);/);

        expect(composition).not.toBeNull();
        expect(composition[1]).toContain('calculationMethods');
        expect(composition[1]).toContain('columnMethods');
        expect(source).not.toContain('...calculationMethods');
        expect(source).toContain('...controllerMethods');
    });

    test('wires the extracted cell-state reading method group into the controller composition', () => {
        const source = readTableFactorySource();
        const controllerDir = resolve(repositoryRoot, 'src/lib/table/controller');
        const cellStateMethodsPath = resolve(controllerDir, 'cell-state-methods.js');
        const cellStateSource = readFileSync(cellStateMethodsPath, 'utf8');
        const cellStateImplementationSource = cellStateSource.replace(/\/\*\*[\s\S]*?\*\//g, '');
        const controllerModules = readdirSync(controllerDir);
        const composition = source.match(/const controllerMethods = composeControllerMethods\(([\s\S]*?)\);/);
        const inlineCellStateDefinitions = [
            /^\s*getEditedCells\(\) \{/m,
            /^\s*getInvalidCells\(\) \{/m
        ];

        expect(source).toContain("import { createCellStateMethods } from './controller/cell-state-methods.js';");
        expect(source).toContain('const cellStateMethods = createCellStateMethods({ table });');
        expect(composition).not.toBeNull();
        expect(composition[1]).toContain('calculationMethods');
        expect(composition[1]).toContain('cellStateMethods');
        expect(composition[1]).toContain('columnMethods');
        expect(source).not.toContain('...cellStateMethods');
        expect(source).toContain('...controllerMethods');

        inlineCellStateDefinitions.forEach(pattern => {
            expect(source).not.toMatch(pattern);
        });

        expect(controllerModules).toContain('cell-state-methods.js');
        expect(controllerModules).not.toContain('edited-cell-methods.js');
        expect(controllerModules).not.toContain('invalid-cell-methods.js');
        expect(controllerModules).not.toContain('editing-read-methods.js');
        expect(controllerModules).not.toContain('validation-read-methods.js');
        expect(cellStateSource).toMatch(/createCellStateMethods = \(\{ table \}\) => \(\{/);
        expect(cellStateSource).toMatch(/getEditedCells\(\) \{\s*return table\.getEditedCells\(\);/);
        expect(cellStateSource).toMatch(/getInvalidCells\(\) \{\s*return table\.getInvalidCells\(\);/);
        expect(cellStateImplementationSource).not.toContain('CrudHelper');
        expect(cellStateImplementationSource).not.toContain('_state');
        expect(cellStateImplementationSource).not.toContain('_errors');
        expect(cellStateImplementationSource).not.toContain('_ambTempId');
        expect(cellStateImplementationSource).not.toContain('clearCellEdited');
        expect(cellStateImplementationSource).not.toContain('clearCellValidation');
        expect(cellStateImplementationSource).not.toMatch(/(^|[^A-Za-z])validate\(/);
        expect(cellStateImplementationSource).not.toMatch(/(^|[^A-Za-z])getData\(/);
        expect(cellStateImplementationSource).not.toMatch(/(^|[^A-Za-z])getRows\(/);
        expect(cellStateImplementationSource).not.toMatch(/createCellStateMethods = \(\{[^}]*crud/);
        expect(cellStateImplementationSource).not.toMatch(/createCellStateMethods = \(\{[^}]*searchController/);
    });

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

    test('wires the extracted grouping method group into the controller composition', () => {
        const source = readTableFactorySource();
        const controllerDir = resolve(repositoryRoot, 'src/lib/table/controller');
        const groupingMethodsPath = resolve(controllerDir, 'grouping-methods.js');
        const groupingSource = readFileSync(groupingMethodsPath, 'utf8');
        const controllerModules = readdirSync(controllerDir);
        const composition = source.match(/const controllerMethods = composeControllerMethods\(([\s\S]*?)\);/);
        const inlineGroupingDefinitions = [
            /^\s*getGroups\(\) \{/m,
            /^\s*setGroupBy\(groupBy\) \{/m,
            /^\s*setGroupValues\(groupValues\) \{/m,
            /^\s*setGroupStartOpen\(groupStartOpen\) \{/m,
            /^\s*setGroupHeader\(groupHeader\) \{/m
        ];

        expect(source).toContain("import { createGroupingMethods } from './controller/grouping-methods.js';");
        expect(source).toContain('const groupingMethods = createGroupingMethods({ table });');
        expect(composition).not.toBeNull();
        expect(composition[1]).toContain('rowMethods');
        expect(composition[1]).toContain('groupingMethods');
        expect(composition[1]).toContain('paginationMethods');
        expect(source).not.toContain('...groupingMethods');
        expect(source).toContain('...controllerMethods');

        inlineGroupingDefinitions.forEach(pattern => {
            expect(source).not.toMatch(pattern);
        });

        expect(controllerModules).toContain('grouping-methods.js');
        expect(controllerModules).not.toContain('group-read-methods.js');
        expect(controllerModules).not.toContain('group-config-methods.js');
        expect(controllerModules).not.toContain('group-header-methods.js');
        expect(controllerModules).not.toContain('group-values-methods.js');
        expect(groupingSource).toMatch(/createGroupingMethods = \(\{ table \}\) => \(\{/);
        expect(groupingSource).toMatch(/getGroups\(\) \{\s*return table\.getGroups\(\);/);
        expect(groupingSource).toMatch(/setGroupBy\(groupBy\) \{\s*return table\.setGroupBy\(groupBy\);/);
        expect(groupingSource).toMatch(/setGroupValues\(groupValues\) \{\s*return table\.setGroupValues\(groupValues\);/);
        expect(groupingSource).toMatch(/setGroupStartOpen\(groupStartOpen\) \{\s*return table\.setGroupStartOpen\(groupStartOpen\);/);
        expect(groupingSource).toMatch(/setGroupHeader\(groupHeader\) \{\s*return table\.setGroupHeader\(groupHeader\);/);
        expect(groupingSource).not.toMatch(/createGroupingMethods = \(\{[^}]*crud/);
        expect(groupingSource).not.toMatch(/createGroupingMethods = \(\{[^}]*searchController/);
    });

    test('wires the extracted history-reading method group into the controller composition', () => {
        const source = readTableFactorySource();
        const controllerDir = resolve(repositoryRoot, 'src/lib/table/controller');
        const historyMethodsPath = resolve(controllerDir, 'history-methods.js');
        const historySource = readFileSync(historyMethodsPath, 'utf8');
        const controllerModules = readdirSync(controllerDir);
        const composition = source.match(/const controllerMethods = composeControllerMethods\(([\s\S]*?)\);/);
        const inlineHistoryDefinitions = [
            /^\s*getHistoryUndoSize\(\) \{/m,
            /^\s*getHistoryRedoSize\(\) \{/m
        ];

        expect(source).toContain("import { createHistoryMethods } from './controller/history-methods.js';");
        expect(source).toContain('const historyMethods = createHistoryMethods({ table });');
        expect(composition).not.toBeNull();
        expect(composition[1]).toContain('groupingMethods');
        expect(composition[1]).toContain('historyMethods');
        expect(composition[1]).toContain('paginationMethods');
        expect(source).not.toContain('...historyMethods');
        expect(source).toContain('...controllerMethods');

        inlineHistoryDefinitions.forEach(pattern => {
            expect(source).not.toMatch(pattern);
        });

        expect(controllerModules).toContain('history-methods.js');
        expect(controllerModules).not.toContain('history-read-methods.js');
        expect(controllerModules).not.toContain('undo-count-methods.js');
        expect(controllerModules).not.toContain('redo-count-methods.js');
        expect(controllerModules).not.toContain('interaction-history-methods.js');
        expect(historySource).toMatch(/createHistoryMethods = \(\{ table \}\) => \(\{/);
        expect(historySource).toMatch(/getHistoryUndoSize\(\) \{\s*return table\.getHistoryUndoSize\(\);/);
        expect(historySource).toMatch(/getHistoryRedoSize\(\) \{\s*return table\.getHistoryRedoSize\(\);/);
        expect(historySource).not.toContain('CrudHelper');
        expect(historySource).not.toContain('_state');
        expect(historySource).not.toContain('_errors');
        expect(historySource).not.toContain('_ambTempId');
        expect(historySource).not.toMatch(/(^|[^A-Za-z])undo\(/);
        expect(historySource).not.toMatch(/(^|[^A-Za-z])redo\(/);
        expect(historySource).not.toMatch(/(^|[^A-Za-z])clearHistory\(/);
        expect(historySource).not.toContain('table.modules');
        expect(historySource).not.toContain('table.history');
        expect(historySource).not.toMatch(/createHistoryMethods = \(\{[^}]*crud/);
        expect(historySource).not.toMatch(/createHistoryMethods = \(\{[^}]*searchController/);
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

    test('wires the extracted localization method group into the controller composition', () => {
        const source = readTableFactorySource();

        expect(source).toContain("import { createLocalizationMethods } from './controller/localization-methods.js';");
        expect(source).toContain('const localizationMethods = createLocalizationMethods({ table });');

        const composition = source.match(/const controllerMethods = composeControllerMethods\(([\s\S]*?)\);/);

        expect(composition).not.toBeNull();
        expect(composition[1]).toContain('localizationMethods');
        expect(composition[1]).toContain('redrawMethods');
        expect(source).not.toContain('...localizationMethods');
        expect(source).toContain('...controllerMethods');
    });

    test('wires the extracted layout method group into the controller composition', () => {
        const source = readTableFactorySource();
        const controllerDir = resolve(repositoryRoot, 'src/lib/table/controller');
        const layoutMethodsPath = resolve(controllerDir, 'layout-methods.js');
        const layoutSource = readFileSync(layoutMethodsPath, 'utf8');
        const controllerModules = readdirSync(controllerDir);
        const composition = source.match(/const controllerMethods = composeControllerMethods\(([\s\S]*?)\);/);
        const inlineLayoutDefinitions = [
            /^\s*setHeight\(\.\.\.args\) \{/m,
            /^\s*setMinHeight\(\.\.\.args\) \{/m,
            /^\s*setMaxHeight\(\.\.\.args\) \{/m
        ];

        expect(source).toContain("import { createLayoutMethods } from './controller/layout-methods.js';");
        expect(source).toContain('const layoutMethods = createLayoutMethods({ table });');
        expect(composition).not.toBeNull();
        expect(composition[1]).toContain('localizationMethods');
        expect(composition[1]).toContain('layoutMethods');
        expect(composition[1]).toContain('redrawMethods');
        expect(source).not.toContain('...layoutMethods');
        expect(source).toContain('...controllerMethods');

        inlineLayoutDefinitions.forEach(pattern => {
            expect(source).not.toMatch(pattern);
        });

        expect(controllerModules).toContain('layout-methods.js');
        expect(controllerModules).not.toContain('height-methods.js');
        expect(controllerModules).not.toContain('min-height-methods.js');
        expect(controllerModules).not.toContain('max-height-methods.js');
        expect(controllerModules).not.toContain('table-sizing-methods.js');
        expect(layoutSource).toMatch(/createLayoutMethods = \(\{ table \}\) => \(\{/);
        expect(layoutSource).toMatch(/setHeight\(\.\.\.args\) \{\s*return table\.setHeight\(\.\.\.args\);/);
        expect(layoutSource).toMatch(/setMinHeight\(\.\.\.args\) \{\s*return table\.setMinHeight\(\.\.\.args\);/);
        expect(layoutSource).toMatch(/setMaxHeight\(\.\.\.args\) \{\s*return table\.setMaxHeight\(\.\.\.args\);/);
        expect(layoutSource).not.toContain('style.height');
        expect(layoutSource).not.toContain('style.minHeight');
        expect(layoutSource).not.toContain('style.maxHeight');
        expect(layoutSource).not.toContain('redraw(');
        expect(layoutSource).not.toContain('ResizeObserver');
        expect(layoutSource).not.toContain('window.addEventListener');
        expect(layoutSource).not.toContain('CrudHelper');
        expect(layoutSource).not.toMatch(/createLayoutMethods = \(\{[^}]*crud/);
        expect(layoutSource).not.toMatch(/createLayoutMethods = \(\{[^}]*searchController/);
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

    test('does not keep inline calculation method implementations in table-factory', () => {
        const source = readTableFactorySource();
        const inlineCalculationDefinitions = [
            /^\s*getCalcResults\(\) \{/m,
            /^\s*recalc\(\) \{/m
        ];

        inlineCalculationDefinitions.forEach(pattern => {
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

    test('does not keep inline localization method implementations in table-factory', () => {
        const source = readTableFactorySource();
        const inlineLocalizationDefinitions = [
            /^\s*setLocale\(\.\.\.args\) \{/m,
            /^\s*getLocale\(\) \{/m,
            /^\s*getLang\(\) \{/m
        ];

        inlineLocalizationDefinitions.forEach(pattern => {
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

    test('keeps calculation methods in one calculation method module', () => {
        const controllerDir = resolve(repositoryRoot, 'src/lib/table/controller');
        const source = readFileSync(resolve(controllerDir, 'calculation-methods.js'), 'utf8');
        const tableFactorySource = readTableFactorySource();
        const controllerModules = readdirSync(controllerDir);

        expect(source).toMatch(/getCalcResults\(\) \{\s*return table\.getCalcResults\(\);/);
        expect(source).toMatch(/recalc\(\) \{\s*return table\.recalc\(\);/);
        expect(tableFactorySource).not.toContain('...calculationMethods');
        expect(tableFactorySource).toContain('calculationMethods');
        expect(tableFactorySource).toContain('...controllerMethods');
        expect(controllerModules).toContain('calculation-methods.js');
        expect(controllerModules).not.toContain('calc-results-methods.js');
        expect(controllerModules).not.toContain('recalc-methods.js');
        expect(controllerModules).not.toContain('column-calculation-read-methods.js');
    });

    test('keeps localization methods in one localization method module', () => {
        const controllerDir = resolve(repositoryRoot, 'src/lib/table/controller');
        const source = readFileSync(resolve(controllerDir, 'localization-methods.js'), 'utf8');
        const tableFactorySource = readTableFactorySource();
        const controllerModules = readdirSync(controllerDir);

        expect(source).toMatch(/setLocale\(\.\.\.args\) \{\s*return table\.setLocale\(\.\.\.args\);/);
        expect(source).toMatch(/getLocale\(\) \{\s*return table\.getLocale\(\);/);
        expect(source).toMatch(/getLang\(\) \{\s*return table\.getLang\(\);/);
        expect(tableFactorySource).not.toContain('...localizationMethods');
        expect(tableFactorySource).toContain('localizationMethods');
        expect(tableFactorySource).toContain('...controllerMethods');
        expect(controllerModules).toContain('localization-methods.js');
        expect(controllerModules).not.toContain('locale-methods.js');
        expect(controllerModules).not.toContain('language-methods.js');
        expect(controllerModules).not.toContain('set-locale-methods.js');
    });
});
