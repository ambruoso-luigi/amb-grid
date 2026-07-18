import { describe, expect, test, vi } from 'vitest';

import { createColumnMethods } from '../src/lib/table/controller/column-methods.js';

describe('AMB table controller column method group', () => {
    test('exposes exactly the flat column controller methods', () => {
        const methods = createColumnMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'getColumn',
            'getColumnDefinitions',
            'getColumns',
            'hideColumn',
            'showColumn',
            'toggleColumn'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('returns current column definitions without cloning or filtering AMB-managed columns', () => {
        const dataDefinition = { title: 'Name', field: 'name' };
        const ambDefinition = { title: '', field: '_amb_select', formatter: 'rowSelection' };
        const definitions = [ambDefinition, dataDefinition];
        const table = {
            getColumnDefinitions: vi.fn(() => definitions),
            getColumns: vi.fn(),
            getColumn: vi.fn(),
            showColumn: vi.fn(),
            hideColumn: vi.fn(),
            toggleColumn: vi.fn(),
            setFilter: vi.fn(),
            refreshFilter: vi.fn(),
            setPage: vi.fn()
        };
        const methods = createColumnMethods({ table });

        expect(methods.getColumnDefinitions()).toBe(definitions);
        expect(table.getColumnDefinitions).toHaveBeenCalledOnce();
        expect(table.getColumnDefinitions).toHaveBeenCalledWith();
        expect(definitions[0]).toBe(ambDefinition);
        expect(definitions[1]).toBe(dataDefinition);
        expect(definitions).toContain(ambDefinition);
        expect(definitions).toContain(dataDefinition);
        expect(table.getColumns).not.toHaveBeenCalled();
        expect(table.getColumn).not.toHaveBeenCalled();
        expect(table.showColumn).not.toHaveBeenCalled();
        expect(table.hideColumn).not.toHaveBeenCalled();
        expect(table.toggleColumn).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.refreshFilter).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
    });

    test('returns column components and grouped structures unchanged', () => {
        const ambComponent = { field: '_amb_actions' };
        const nameComponent = { field: 'name' };
        const flatColumns = [ambComponent, nameComponent];
        const groupComponent = {
            title: 'Person',
            columns: [nameComponent]
        };
        const groupedColumns = [ambComponent, groupComponent];
        const table = {
            getColumns: vi.fn()
                .mockReturnValueOnce(flatColumns)
                .mockReturnValueOnce(groupedColumns),
            getColumnDefinitions: vi.fn(),
            getColumn: vi.fn(),
            showColumn: vi.fn(),
            hideColumn: vi.fn(),
            toggleColumn: vi.fn(),
            setSort: vi.fn(),
            clearSort: vi.fn(),
            setFilter: vi.fn()
        };
        const methods = createColumnMethods({ table });

        expect(methods.getColumns()).toBe(flatColumns);
        expect(table.getColumns).toHaveBeenCalledOnce();
        expect(table.getColumns).toHaveBeenLastCalledWith();
        expect(flatColumns[0]).toBe(ambComponent);
        expect(flatColumns[1]).toBe(nameComponent);

        expect(methods.getColumns(true)).toBe(groupedColumns);
        expect(table.getColumns).toHaveBeenCalledTimes(2);
        expect(table.getColumns).toHaveBeenLastCalledWith(true);
        expect(groupedColumns[0]).toBe(ambComponent);
        expect(groupedColumns[1]).toBe(groupComponent);
        expect(groupedColumns[1].columns).toBe(groupComponent.columns);
        expect(groupedColumns[1].columns[0]).toBe(nameComponent);
        expect(table.getColumnDefinitions).not.toHaveBeenCalled();
        expect(table.getColumn).not.toHaveBeenCalled();
        expect(table.showColumn).not.toHaveBeenCalled();
        expect(table.hideColumn).not.toHaveBeenCalled();
        expect(table.toggleColumn).not.toHaveBeenCalled();
        expect(table.setSort).not.toHaveBeenCalled();
        expect(table.clearSort).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
    });

    test('returns one column component using lookup values unchanged', () => {
        const domLookup = { nodeType: 1, dataset: { field: 'age' } };
        const componentLookup = { type: 'component-lookup' };
        const nameComponent = { field: 'name' };
        const ageComponent = { field: 'age' };
        const table = {
            getColumn: vi.fn()
                .mockReturnValueOnce(nameComponent)
                .mockReturnValueOnce(ageComponent)
                .mockReturnValueOnce(componentLookup)
                .mockReturnValueOnce(false),
            getColumns: vi.fn(),
            getColumnDefinitions: vi.fn(),
            showColumn: vi.fn(),
            hideColumn: vi.fn(),
            toggleColumn: vi.fn(),
            findRowByKey: vi.fn(),
            setPage: vi.fn()
        };
        const methods = createColumnMethods({ table });

        expect(methods.getColumn('name')).toBe(nameComponent);
        expect(table.getColumn).toHaveBeenCalledOnce();
        expect(table.getColumn).toHaveBeenLastCalledWith('name');

        expect(methods.getColumn(domLookup)).toBe(ageComponent);
        expect(table.getColumn).toHaveBeenCalledTimes(2);
        expect(table.getColumn).toHaveBeenLastCalledWith(domLookup);
        expect(table.getColumn.mock.calls[1][0]).toBe(domLookup);

        expect(methods.getColumn(componentLookup)).toBe(componentLookup);
        expect(table.getColumn).toHaveBeenCalledTimes(3);
        expect(table.getColumn).toHaveBeenLastCalledWith(componentLookup);
        expect(table.getColumn.mock.calls[2][0]).toBe(componentLookup);

        expect(methods.getColumn('missing')).toBe(false);
        expect(table.getColumn).toHaveBeenCalledTimes(4);
        expect(table.getColumn).toHaveBeenLastCalledWith('missing');
        expect(table.getColumns).not.toHaveBeenCalled();
        expect(table.getColumnDefinitions).not.toHaveBeenCalled();
        expect(table.showColumn).not.toHaveBeenCalled();
        expect(table.hideColumn).not.toHaveBeenCalled();
        expect(table.toggleColumn).not.toHaveBeenCalled();
        expect(table.findRowByKey).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
    });

    test('shows columns by delegating one lookup unchanged', () => {
        const lookup = { type: 'column-lookup' };
        const shownResult = { shown: true };
        const table = {
            showColumn: vi.fn()
                .mockReturnValueOnce(shownResult)
                .mockReturnValueOnce(undefined),
            hideColumn: vi.fn(),
            toggleColumn: vi.fn(),
            getColumn: vi.fn(),
            redraw: vi.fn()
        };
        const methods = createColumnMethods({ table });

        expect(methods.showColumn('email')).toBe(shownResult);
        expect(table.showColumn).toHaveBeenCalledOnce();
        expect(table.showColumn).toHaveBeenLastCalledWith('email');

        expect(methods.showColumn(lookup)).toBeUndefined();
        expect(table.showColumn).toHaveBeenCalledTimes(2);
        expect(table.showColumn).toHaveBeenLastCalledWith(lookup);
        expect(table.showColumn.mock.calls[1][0]).toBe(lookup);
        expect(table.getColumn).not.toHaveBeenCalled();
        expect(table.hideColumn).not.toHaveBeenCalled();
        expect(table.toggleColumn).not.toHaveBeenCalled();
        expect(table.redraw).not.toHaveBeenCalled();
    });

    test('hides columns by delegating one lookup unchanged without side effects', () => {
        const lookup = { type: 'amb-action-column' };
        const hiddenResult = { hidden: true };
        const table = {
            hideColumn: vi.fn()
                .mockReturnValueOnce(hiddenResult)
                .mockReturnValueOnce(undefined),
            showColumn: vi.fn(),
            toggleColumn: vi.fn(),
            getColumn: vi.fn(),
            setFilter: vi.fn(),
            clearFilter: vi.fn(),
            setSort: vi.fn(),
            clearSort: vi.fn(),
            setSearchQuery: vi.fn(),
            setPage: vi.fn(),
            findRowByKey: vi.fn()
        };
        const methods = createColumnMethods({ table });

        expect(methods.hideColumn('internalCode')).toBe(hiddenResult);
        expect(table.hideColumn).toHaveBeenCalledOnce();
        expect(table.hideColumn).toHaveBeenLastCalledWith('internalCode');

        expect(methods.hideColumn(lookup)).toBeUndefined();
        expect(table.hideColumn).toHaveBeenCalledTimes(2);
        expect(table.hideColumn).toHaveBeenLastCalledWith(lookup);
        expect(table.hideColumn.mock.calls[1][0]).toBe(lookup);
        expect(table.getColumn).not.toHaveBeenCalled();
        expect(table.showColumn).not.toHaveBeenCalled();
        expect(table.toggleColumn).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(table.setSort).not.toHaveBeenCalled();
        expect(table.clearSort).not.toHaveBeenCalled();
        expect(table.setSearchQuery).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.findRowByKey).not.toHaveBeenCalled();
    });

    test('toggles columns by delegating one lookup unchanged', () => {
        const lookup = { type: 'grouped-column' };
        const toggleResult = { toggled: true };
        const table = {
            toggleColumn: vi.fn(() => toggleResult),
            showColumn: vi.fn(),
            hideColumn: vi.fn(),
            getColumn: vi.fn(),
            getColumnDefinitions: vi.fn()
        };
        const methods = createColumnMethods({ table });

        expect(methods.toggleColumn(lookup)).toBe(toggleResult);
        expect(table.toggleColumn).toHaveBeenCalledOnce();
        expect(table.toggleColumn).toHaveBeenCalledWith(lookup);
        expect(table.toggleColumn.mock.calls[0][0]).toBe(lookup);
        expect(table.showColumn).not.toHaveBeenCalled();
        expect(table.hideColumn).not.toHaveBeenCalled();
        expect(table.getColumn).not.toHaveBeenCalled();
        expect(table.getColumnDefinitions).not.toHaveBeenCalled();
    });
});
