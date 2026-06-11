import { SearchFiltersDialog } from '../../ui/search-filters-dialog.js';

export const SEARCH_EXCLUDED_FIELDS = new Set([
    '_state',
    '_ambTempId',
    '_ambRowNumber'
]);

export const normalizeSearchOptions = (search = {}) => {
    return {
        enabled: false,
        placeholder: 'Search...',
        ...search,
        filters: {
            enabled: false,
            ...(search.filters || {})
        }
    };
};

export const getTableElement = selector => {
    if (typeof selector === 'string') {
        return document.querySelector(selector);
    }

    return selector || null;
};

export const getSearchColumnTitle = column => {
    if (!column) return '';
    if (typeof column.title === 'string' && column.title.trim() !== '') return column.title;

    return column.field || '';
};

export const collectSearchColumns = (columns = []) => {
    const collectedColumns = [];

    (columns || []).forEach(column => {
        if (!column) return;

        if (column.columns) {
            collectedColumns.push(...collectSearchColumns(column.columns));
            return;
        }

        if (!column.field) return;
        if (String(column.field).startsWith('_')) return;
        if (SEARCH_EXCLUDED_FIELDS.has(column.field)) return;

        collectedColumns.push({
            field: column.field,
            title: getSearchColumnTitle(column)
        });
    });

    return collectedColumns;
};

export const createSearchToolbar = (selector, searchOptions) => {
    const tableElement = getTableElement(selector);

    if (!tableElement || !tableElement.parentNode) return null;

    const toolbar = document.createElement('div');
    const input = document.createElement('input');
    const filtersButton = document.createElement('button');

    toolbar.className = 'amb-search-toolbar';
    input.className = 'amb-search-toolbar__input';
    input.type = 'search';
    input.placeholder = searchOptions.placeholder;

    filtersButton.className = 'amb-search-toolbar__filters-button';
    filtersButton.type = 'button';
    filtersButton.textContent = 'Filters';

    toolbar.appendChild(input);

    if (searchOptions.filters.enabled) {
        toolbar.appendChild(filtersButton);
    }

    tableElement.parentNode.insertBefore(toolbar, tableElement);

    return {
        toolbar,
        input,
        filtersButton: searchOptions.filters.enabled ? filtersButton : null
    };
};

export const getSearchableValues = (data, field) => {
    const values = [];
    const value = data && data[field];
    const lookupDescription = data
        && data._ambLookup
        && data._ambLookup[field]
        && data._ambLookup[field].current
        ? data._ambLookup[field].current.description
        : '';

    if (value !== null && value !== undefined) {
        values.push(String(value));
    }

    if (lookupDescription) {
        values.push(String(lookupDescription));
    }

    return values;
};

export const createSearchController = ({
    selector,
    search,
    columns,
    table,
    floatingMessage
}) => {
    const searchOptions = normalizeSearchOptions(search);

    if (!searchOptions.enabled) {
        return null;
    }

    const availableColumns = collectSearchColumns(columns);
    const toolbar = createSearchToolbar(selector, searchOptions);
    const dialog = new SearchFiltersDialog();
    const searchState = {
        query: '',
        selectedFields: []
    };
    const searchFilter = data => {
        const query = searchState.query.trim().toLowerCase();
        const fields = searchState.selectedFields.length
            ? searchState.selectedFields
            : availableColumns.map(column => column.field);

        if (!query) return true;

        return fields.some(field => {
            return getSearchableValues(data, field).some(value => {
                return value.toLowerCase().includes(query);
            });
        });
    };
    let filterActive = false;

    const getSelectedColumns = () => {
        const selectedFields = new Set(searchState.selectedFields);

        return availableColumns.filter(column => selectedFields.has(column.field));
    };

    const updateFiltersButton = () => {
        if (!toolbar || !toolbar.filtersButton) return;

        const count = searchState.selectedFields.length;

        toolbar.filtersButton.textContent = count > 0
            ? `Filters (${count})`
            : 'Filters';
    };

    const applySearch = () => {
        const shouldFilter = searchState.query.trim() !== '';

        if (filterActive) {
            table.removeFilter(searchFilter);
            filterActive = false;
        }

        if (shouldFilter) {
            table.addFilter(searchFilter);
            filterActive = true;
        }
    };

    const setSearchQuery = query => {
        searchState.query = String(query || '');

        if (toolbar && toolbar.input && toolbar.input.value !== searchState.query) {
            toolbar.input.value = searchState.query;
        }

        applySearch();
    };

    const setSearchFields = fields => {
        const allowedFields = new Set(availableColumns.map(column => column.field));
        const nextFields = (fields || []).filter(field => allowedFields.has(field));

        searchState.selectedFields = [...new Set(nextFields)];
        updateFiltersButton();
        applySearch();
    };

    const showFiltersMessage = () => {
        if (!toolbar || !toolbar.filtersButton) return;

        const selectedColumns = getSelectedColumns();

        if (!selectedColumns.length) {
            floatingMessage.scheduleShow(toolbar.filtersButton, {
                type: 'info',
                title: 'Filters',
                message: 'Searching all available columns'
            });
            return;
        }

        floatingMessage.scheduleShow(toolbar.filtersButton, {
            type: 'info',
            title: 'Filters active',
            message: selectedColumns.map(column => `- ${column.title}`).join('\n')
        });
    };

    const hideFiltersMessage = () => {
        floatingMessage.hide();
    };

    const openFiltersDialog = async () => {
        const selectedFields = new Set(searchState.selectedFields);
        const result = await dialog.open({
            title: 'Search Filters',
            columns: availableColumns.map(column => ({
                ...column,
                selected: selectedFields.has(column.field)
            })),
            selectAllText: 'Select All',
            clearAllText: 'Clear All',
            applyText: 'Apply',
            cancelText: 'Cancel'
        });

        if (result && result.applied) {
            setSearchFields(result.selectedFields || []);
        }
    };

    const handleInput = event => {
        setSearchQuery(event.target.value);
    };

    if (toolbar) {
        toolbar.input.addEventListener('input', handleInput);

        if (toolbar.filtersButton) {
            toolbar.filtersButton.addEventListener('click', openFiltersDialog);
            toolbar.filtersButton.addEventListener('mouseover', showFiltersMessage);
            toolbar.filtersButton.addEventListener('mouseout', hideFiltersMessage);
        }
    }

    updateFiltersButton();

    return {
        setSearchQuery,
        clearSearch() {
            setSearchQuery('');
        },
        getSearchState() {
            return {
                query: searchState.query,
                selectedFields: [...searchState.selectedFields]
            };
        },
        setSearchFields,
        destroy() {
            if (filterActive) {
                table.removeFilter(searchFilter);
                filterActive = false;
            }

            if (toolbar) {
                toolbar.input.removeEventListener('input', handleInput);

                if (toolbar.filtersButton) {
                    toolbar.filtersButton.removeEventListener('click', openFiltersDialog);
                    toolbar.filtersButton.removeEventListener('mouseover', showFiltersMessage);
                    toolbar.filtersButton.removeEventListener('mouseout', hideFiltersMessage);
                }

                toolbar.toolbar.remove();
            }

            dialog.destroy();
            floatingMessage.hide();
        }
    };
};
