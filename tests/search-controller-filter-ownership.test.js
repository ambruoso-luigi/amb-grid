import { describe, expect, test, vi } from 'vitest';
import { createSearchController } from '../src/lib/table/search-controller.js';

class ElementMock {
    constructor() {
        this.children = [];
        this.parentNode = null;
        this.className = '';
        this.hidden = false;
        this.value = '';
        this.listeners = {};
        this.classList = {
            toggle: vi.fn()
        };
    }

    append(...children) {
        children.forEach(child => this.appendChild(child));
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    insertBefore(child, reference) {
        child.parentNode = this;
        const index = this.children.indexOf(reference);

        if (index === -1) {
            this.children.push(child);
        } else {
            this.children.splice(index, 0, child);
        }

        return child;
    }

    setAttribute(name, value) {
        this[name] = value;
    }

    addEventListener(type, handler) {
        this.listeners[type] = handler;
    }

    removeEventListener(type) {
        delete this.listeners[type];
    }

    remove() {
        if (this.parentNode) {
            this.parentNode.children = this.parentNode.children.filter(child => child !== this);
        }
        this.parentNode = null;
    }
}

const createDocumentHarness = () => {
    const originalDocument = globalThis.document;
    const parent = new ElementMock();
    const mount = new ElementMock();

    parent.appendChild(mount);

    globalThis.document = {
        createElement: () => new ElementMock(),
        querySelector: () => mount
    };

    return {
        mount,
        restore() {
            globalThis.document = originalDocument;
        }
    };
};

const createTableMock = () => ({
    addFilter: vi.fn(),
    removeFilter: vi.fn(),
    setFilter: vi.fn(),
    clearFilter: vi.fn(),
    getFilters: vi.fn(() => [])
});

const createFloatingMessageMock = () => ({
    scheduleShow: vi.fn(),
    hide: vi.fn()
});

const createController = ({ columns, table = createTableMock() } = {}) => {
    const harness = createDocumentHarness();
    const floatingMessage = createFloatingMessageMock();
    const controller = createSearchController({
        selector: harness.mount,
        search: {
            enabled: true,
            filters: {
                enabled: true
            }
        },
        columns: columns || [
            { title: 'Name', field: 'name' },
            { title: 'City', field: 'city' }
        ],
        table,
        floatingMessage,
        showFilterStatus: true
    });

    return {
        controller,
        floatingMessage,
        harness,
        table
    };
};

const clearTableFilterMocks = table => {
    table.addFilter.mockClear();
    table.removeFilter.mockClear();
    table.setFilter.mockClear();
    table.clearFilter.mockClear();
    table.getFilters.mockClear();
};

describe('search controller filter ownership', () => {
    test('identifies only the AMB Grid global search filter by function identity', () => {
        const { controller, harness, table } = createController();

        try {
            controller.setSearchQuery('Mario');
            const searchFilter = table.addFilter.mock.calls[0][0];
            const getFiltersDefinition = {
                field: searchFilter,
                type: undefined,
                value: undefined
            };
            const functionPropertyDefinition = {
                field: 'name',
                func: searchFilter,
                value: 'Mario'
            };
            const developerFilter = data => data.active;
            const developerFunctionDefinition = {
                field: developerFilter,
                type: undefined,
                value: undefined
            };
            const normalFieldFilter = {
                field: 'active',
                type: '=',
                value: true
            };
            const before = { ...getFiltersDefinition };

            table.getFilters.mockReturnValueOnce([getFiltersDefinition]);

            expect(controller.isSearchFilter(searchFilter)).toBe(true);
            expect(controller.isSearchFilter(table.getFilters()[0])).toBe(true);
            expect(controller.isSearchFilter(functionPropertyDefinition)).toBe(true);
            expect(controller.isSearchFilter(developerFilter)).toBe(false);
            expect(controller.isSearchFilter(developerFunctionDefinition)).toBe(false);
            expect(controller.isSearchFilter(normalFieldFilter)).toBe(false);
            expect(controller.isSearchFilter(null)).toBe(false);
            expect(controller.isSearchFilter(undefined)).toBe(false);
            expect(getFiltersDefinition).toEqual(before);
        } finally {
            harness.restore();
        }
    });

    test('excludes only the AMB Grid search filter without mutating external filters or reading the table', () => {
        const { controller, harness, table } = createController();

        try {
            controller.setSearchQuery('Mario');
            const searchFilter = table.addFilter.mock.calls[0][0];
            const normalFieldFilter = {
                field: 'active',
                type: '=',
                value: true
            };
            const developerFilter = data => data.active;
            const developerFunctionFilter = {
                field: developerFilter,
                type: undefined,
                value: undefined
            };
            const searchFilterDefinition = {
                field: searchFilter,
                type: undefined,
                value: undefined
            };
            const filters = [
                normalFieldFilter,
                developerFunctionFilter,
                searchFilterDefinition
            ];
            const originalFilters = [...filters];

            clearTableFilterMocks(table);

            const externalFilters = controller.excludeSearchFilter(filters);

            expect(externalFilters).toEqual([
                normalFieldFilter,
                developerFunctionFilter
            ]);
            expect(externalFilters[0]).toBe(normalFieldFilter);
            expect(externalFilters[1]).toBe(developerFunctionFilter);
            expect(filters).toEqual(originalFilters);
            expect(filters[0]).toBe(normalFieldFilter);
            expect(filters[1]).toBe(developerFunctionFilter);
            expect(filters[2]).toBe(searchFilterDefinition);
            expect(controller.excludeSearchFilter(null)).toEqual([]);
            expect(controller.excludeSearchFilter(undefined)).toEqual([]);
            expect(controller.excludeSearchFilter('not-an-array')).toEqual([]);
            expect(table.getFilters).not.toHaveBeenCalled();
            expect(table.setFilter).not.toHaveBeenCalled();
            expect(table.addFilter).not.toHaveBeenCalled();
            expect(table.removeFilter).not.toHaveBeenCalled();
            expect(table.clearFilter).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('reapplies the current active search filter without changing search state', () => {
        const { controller, harness, table } = createController();

        try {
            controller.setSearchQuery('Mario');
            const firstSearchFilter = table.addFilter.mock.calls[0][0];

            controller.setSearchFields(['name']);
            controller.setSearchOptions({
                caseSensitive: true,
                wholeWord: true
            });

            const searchState = controller.getSearchState();

            clearTableFilterMocks(table);

            controller.reapplySearchFilter();

            expect(table.removeFilter).toHaveBeenCalledOnce();
            expect(table.removeFilter).toHaveBeenCalledWith(firstSearchFilter);
            expect(table.addFilter).toHaveBeenCalledOnce();
            expect(table.addFilter).toHaveBeenCalledWith(firstSearchFilter);
            expect(controller.getSearchState()).toEqual(searchState);
            expect(table.getFilters).not.toHaveBeenCalled();
            expect(table.setFilter).not.toHaveBeenCalled();
            expect(table.clearFilter).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('reapplySearchFilter does not add a filter when the query is empty', () => {
        const { controller, harness, table } = createController();

        try {
            const searchState = controller.getSearchState();

            clearTableFilterMocks(table);

            controller.reapplySearchFilter();

            expect(controller.getSearchState()).toEqual(searchState);
            expect(table.addFilter).not.toHaveBeenCalled();
            expect(table.removeFilter).not.toHaveBeenCalled();
            expect(table.getFilters).not.toHaveBeenCalled();
            expect(table.setFilter).not.toHaveBeenCalled();
            expect(table.clearFilter).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('keeps the existing search controller API available', () => {
        const { controller, harness, table } = createController();

        try {
            expect(typeof controller.setSearchQuery).toBe('function');
            expect(typeof controller.clearSearch).toBe('function');
            expect(typeof controller.getSearchState).toBe('function');
            expect(typeof controller.setSearchFields).toBe('function');
            expect(typeof controller.setSearchOptions).toBe('function');
            expect(typeof controller.destroy).toBe('function');
            expect(typeof controller.isSearchFilter).toBe('function');
            expect(typeof controller.excludeSearchFilter).toBe('function');
            expect(typeof controller.reapplySearchFilter).toBe('function');

            controller.setSearchQuery('Mario');
            expect(controller.getSearchState().query).toBe('Mario');

            controller.clearSearch();
            expect(controller.getSearchState().query).toBe('');

            controller.destroy();
            expect(table.removeFilter).toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });
});
