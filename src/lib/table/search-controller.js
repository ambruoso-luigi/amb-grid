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
        caseSensitive: false,
        wholeWord: false,
        ...search,
        filters: {
            enabled: false,
            ...(search.filters || {})
        }
    };
};

const escapeRegExp = value => {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const matchesSearchValue = (value, query, options = {}) => {
    const normalizedOptions = {
        caseSensitive: false,
        wholeWord: false,
        ...options
    };
    const source = String(value ?? '');
    const searchQuery = String(query ?? '').trim();

    if (!searchQuery) return true;

    if (normalizedOptions.wholeWord) {
        const flags = normalizedOptions.caseSensitive ? 'u' : 'iu';
        const pattern = `(^|[^\\p{L}\\p{N}_])${escapeRegExp(searchQuery)}`
            + `(?=$|[^\\p{L}\\p{N}_])`;

        return new RegExp(pattern, flags).test(source);
    }

    if (normalizedOptions.caseSensitive) {
        return source.includes(searchQuery);
    }

    return source.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase());
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

export const createSearchToolbar = (selector, searchOptions, mountElement = null) => {
    const tableElement = getTableElement(selector);

    if (!mountElement && (!tableElement || !tableElement.parentNode)) return null;

    const toolbar = document.createElement('div');
    const input = document.createElement('input');
    const filtersButton = document.createElement('button');
    const filtersIcon = document.createElement('span');
    const filtersCount = document.createElement('span');

    toolbar.className = mountElement
        ? 'amb-search-toolbar amb-search-toolbar--integrated'
        : 'amb-search-toolbar';
    input.className = 'amb-search-toolbar__input amb-toolbar__search-input';
    input.type = 'search';
    input.placeholder = searchOptions.placeholder;

    filtersButton.className = 'amb-search-toolbar__filters-button amb-toolbar__filters-button';
    filtersButton.type = 'button';
    filtersButton.title = 'Filters';
    filtersButton.setAttribute('aria-label', 'Filters');
    filtersIcon.className = 'amb-toolbar__button-icon';
    filtersIcon.setAttribute('aria-hidden', 'true');
    filtersIcon.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M4 5h16l-6 7v5l-4 2v-7z"></path>
        </svg>
    `;
    filtersCount.className = 'amb-toolbar__filters-count';
    filtersCount.hidden = true;
    filtersButton.append(filtersIcon, filtersCount);

    toolbar.appendChild(input);

    if (searchOptions.filters.enabled) {
        toolbar.appendChild(filtersButton);
    }

    if (mountElement) {
        mountElement.appendChild(toolbar);
    } else {
        tableElement.parentNode.insertBefore(toolbar, tableElement);
    }

    return {
        toolbar,
        input,
        filtersButton: searchOptions.filters.enabled ? filtersButton : null,
        filtersCount: searchOptions.filters.enabled ? filtersCount : null
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
    floatingMessage,
    showFilterStatus = true,
    mountElement
}) => {
    const searchOptions = normalizeSearchOptions(search);

    if (!searchOptions.enabled) {
        return null;
    }

    const availableColumns = collectSearchColumns(columns);
    const toolbar = createSearchToolbar(selector, searchOptions, mountElement);
    const dialog = new SearchFiltersDialog();
    const allFields = availableColumns.map(column => column.field);
    const searchState = {
        query: '',
        selectedFields: [...allFields],
        caseSensitive: searchOptions.caseSensitive === true,
        wholeWord: searchOptions.wholeWord === true
    };
    const searchFilter = data => {
        const query = searchState.query.trim();
        const fields = searchState.selectedFields;

        if (!query) return true;

        return fields.some(field => {
            return getSearchableValues(data, field).some(value => {
                return matchesSearchValue(value, query, searchState);
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
        const restricted = count < allFields.length;

        if (toolbar.filtersCount) {
            toolbar.filtersCount.textContent = String(count);
            toolbar.filtersCount.hidden = !restricted;
        }
        toolbar.filtersButton.classList?.toggle(
            'amb-toolbar__filters-button--active',
            restricted || searchState.caseSensitive || searchState.wholeWord
        );
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

        searchState.selectedFields = nextFields.length
            ? [...new Set(nextFields)]
            : [...allFields];
        updateFiltersButton();
        applySearch();
    };

    const setSearchOptions = options => {
        if (options && options.caseSensitive !== undefined) {
            searchState.caseSensitive = options.caseSensitive === true;
        }

        if (options && options.wholeWord !== undefined) {
            searchState.wholeWord = options.wholeWord === true;
        }

        updateFiltersButton();
        applySearch();
    };

    const showFiltersMessage = () => {
        if (!toolbar || !toolbar.filtersButton) return;

        const selectedColumns = getSelectedColumns();
        const restricted = selectedColumns.length < availableColumns.length;
        const optionMessages = [
            searchState.caseSensitive ? '- Case sensitive' : '',
            searchState.wholeWord ? '- Whole word' : ''
        ].filter(Boolean);

        if (!restricted && !optionMessages.length) {
            floatingMessage.scheduleShow(toolbar.filtersButton, {
                type: 'info',
                title: 'Filters',
                message: 'Searching all columns'
            });
            return;
        }

        floatingMessage.scheduleShow(toolbar.filtersButton, {
            type: 'info',
            title: 'Filters active',
            message: [
                ...(restricted
                    ? [
                        'Searching only in:',
                        ...selectedColumns.map(column => `- ${column.title}`)
                    ]
                    : ['Searching all columns']),
                ...optionMessages
            ].join('\n')
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
            caseSensitive: searchState.caseSensitive,
            wholeWord: searchState.wholeWord,
            selectAllText: 'Select All',
            clearAllText: 'Clear All',
            applyText: 'Apply',
            cancelText: 'Cancel'
        });

        if (result && result.applied) {
            setSearchFields(result.selectedFields || []);
            setSearchOptions({
                caseSensitive: result.caseSensitive,
                wholeWord: result.wholeWord
            });
        }
    };

    const handleInput = event => {
        setSearchQuery(event.target.value);
    };

    if (toolbar) {
        toolbar.input.addEventListener('input', handleInput);

        if (toolbar.filtersButton) {
            toolbar.filtersButton.addEventListener('click', openFiltersDialog);

            if (showFilterStatus !== false) {
                toolbar.filtersButton.addEventListener('mouseover', showFiltersMessage);
                toolbar.filtersButton.addEventListener('mouseout', hideFiltersMessage);
            }
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
                selectedFields: [...searchState.selectedFields],
                caseSensitive: searchState.caseSensitive,
                wholeWord: searchState.wholeWord
            };
        },
        setSearchFields,
        setSearchOptions,
        destroy() {
            if (filterActive) {
                table.removeFilter(searchFilter);
                filterActive = false;
            }

            if (toolbar) {
                toolbar.input.removeEventListener('input', handleInput);

                if (toolbar.filtersButton) {
                    toolbar.filtersButton.removeEventListener('click', openFiltersDialog);

                    if (showFilterStatus !== false) {
                        toolbar.filtersButton.removeEventListener('mouseover', showFiltersMessage);
                        toolbar.filtersButton.removeEventListener('mouseout', hideFiltersMessage);
                    }
                }

                toolbar.toolbar.remove();
            }

            dialog.destroy();
            floatingMessage.hide();
        }
    };
};
