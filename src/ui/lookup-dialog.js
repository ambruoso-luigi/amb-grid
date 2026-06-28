import { FeedbackRegion } from './feedback-region.js';

const DEFAULT_PAGE_SIZE = 50;

const createElement = (tagName, className, text = '') => {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text) {
        element.textContent = text;
    }

    return element;
};

const normalizeColumns = columns => {
    return (columns || []).filter(column => {
        return column && column.field && column.visible !== false;
    });
};

const getCellValue = (item, field) => {
    const value = item && item[field];

    if (value === null || value === undefined) return '';

    return String(value);
};

const normalizePagination = (pagination, pageSize) => {
    const paginationOptions = pagination && typeof pagination === 'object'
        ? pagination
        : {};
    const enabled = pagination === true
        || (
            pagination
            && typeof pagination === 'object'
            && pagination.enabled !== false
        );
    const configuredPageSize = paginationOptions.pageSize ?? pageSize;
    const controls = paginationOptions.controls === 'simple'
        ? 'simple'
        : 'full';
    const alwaysVisible = paginationOptions.alwaysVisible === true
        || paginationOptions.hideWhenSinglePage === false;

    return {
        enabled: Boolean(enabled),
        pageSize: Number.isInteger(configuredPageSize) && configuredPageSize > 0
            ? configuredPageSize
            : DEFAULT_PAGE_SIZE,
        controls,
        alwaysVisible
    };
};

const getFormattedCellValue = (item, column) => {
    const value = item && item[column.field];

    if (typeof column.formatter !== 'function') {
        return getCellValue(item, column.field);
    }

    const formatted = column.formatter(value, item, column);

    if (formatted === null || formatted === undefined) return '';

    return String(formatted);
};

/**
 * Searchable modal dialog for choosing one item from a lookup result set.
 */
export class LookupDialog {
    /**
     * Create a lookup dialog instance.
     */
    constructor() {
        this.overlay = null;
        this.resolve = null;
        this.options = null;
        this.selectedIndex = -1;
        this.filteredData = [];
        this.feedback = null;
        this.keydownHandler = null;
        this.currentPage = 1;
        this.panel = null;
        this.titleElement = null;
        this.search = null;
        this.tableWrap = null;
        this.table = null;
        this.paginationElement = null;
        this.paginationSummary = null;
        this.firstPageButton = null;
        this.previousPageButton = null;
        this.nextPageButton = null;
        this.lastPageButton = null;
        this.cancelButton = null;
        this.selectButton = null;
    }

    /**
     * Open the dialog.
     *
     * @param {object} [options] - Dialog options.
     * @param {string} [options.title='Search value'] - Dialog title.
     * @param {object[]} [options.columns=[]] - Columns used for display and local filtering.
     * @param {string} options.columns[].field - Item field to display.
     * @param {string} [options.columns[].title] - Column header.
     * @param {number} [options.columns[].width] - Column width in pixels.
     * @param {object[]} [options.data=[]] - Lookup rows to display.
     * @param {string} [options.valueField='id'] - Field containing the stored value.
     * @param {string} [options.searchPlaceholder='Search...'] - Search input placeholder.
     * @param {string[]} [options.searchFields] - Fields used for local filtering. Defaults to displayed columns.
     * @param {number} [options.width=720] - Dialog panel width in pixels.
     * @param {boolean} [options.closeOnBackdropClick=true] - Close when the backdrop is pressed.
     * Pagination defaults to 50 rows per page and is shown only when the
     * filtered result count exceeds the page size. Search always filters the
     * full dataset, resets to page one, and recalculates pagination visibility.
     * Set `pagination: false`, `pagination.enabled: false`, or
     * `pagination.alwaysVisible: true` to override the automatic behavior.
     * @param {boolean|object} [options.pagination=true] - Enable client-side pagination. Search always filters the complete dataset.
     * @param {boolean} [options.pagination.enabled=true] - Enable pagination when using object configuration.
     * @param {number} [options.pagination.pageSize=50] - Rows rendered per page.
     * @param {'simple'|'full'} [options.pagination.controls='full'] - Show Previous/Next or First/Previous/Next/Last controls.
     * @param {boolean} [options.pagination.alwaysVisible=false] - Keep pagination visible even when the filtered result fits on one page.
     * @param {boolean} [options.pagination.hideWhenSinglePage=true] - Backward-compatible inverse of `alwaysVisible`.
     * @param {number} [options.pageSize=50] - Rows per page when `pagination: true`.
     * @param {boolean} [options.destroyOnClose=true] - Destroy markup on close. Set false to reuse the shell; call `destroy()` when finished so retained data can be released.
     * @param {number} [options.initialRenderLimit] - Legacy non-paginated render limit. Prefer `pagination`.
     * @param {string} [options.noResultsText='No results'] - Text shown when filtering returns no rows.
     * @param {string} [options.selectText='Select'] - Select button text.
     * @param {string} [options.cancelText='Cancel'] - Cancel button text.
     * @returns {Promise<object|null>} Selected item, or null when canceled.
     */
    open(options = {}) {
        if (this.resolve) {
            this.close(null);
        }

        this.options = {
            title: 'Search value',
            columns: [],
            data: [],
            valueField: 'id',
            searchPlaceholder: 'Search...',
            width: 720,
            closeOnBackdropClick: true,
            pagination: true,
            pageSize: DEFAULT_PAGE_SIZE,
            destroyOnClose: true,
            initialRenderLimit: null,
            noResultsText: 'No results',
            selectText: 'Select',
            cancelText: 'Cancel',
            ...options
        };
        this.options.closeOnBackdropClick = this.options.closeOnBackdropClick !== false;
        this.options.destroyOnClose = this.options.destroyOnClose !== false;
        this.options.pagination = normalizePagination(
            this.options.pagination,
            this.options.pageSize
        );
        this.options.initialRenderLimit = Number.isInteger(this.options.initialRenderLimit)
            && this.options.initialRenderLimit > 0
            ? this.options.initialRenderLimit
            : null;
        this.options.columns = normalizeColumns(this.options.columns);
        this.options.searchFields = Array.isArray(this.options.searchFields)
            ? this.options.searchFields.filter(Boolean)
            : this.options.columns.map(column => column.field);
        this.filteredData = [...(this.options.data || [])];
        this.selectedIndex = -1;
        this.currentPage = 1;

        this.render();

        return new Promise(resolve => {
            this.resolve = resolve;
        });
    }

    /**
     * Close the dialog and resolve the pending promise.
     *
     * @param {object|null} value - Value used to resolve `open`.
     * @returns {void}
     */
    close(value) {
        const resolve = this.resolve;

        if (this.options?.destroyOnClose === false) {
            this.deactivate();
        } else {
            this.destroy();
        }

        if (resolve) {
            resolve(value);
        }
    }

    deactivate() {
        this.removeKeydownHandler();

        if (this.overlay) {
            this.overlay.hidden = true;
        }

        this.resolve = null;
        this.selectedIndex = -1;
    }

    removeKeydownHandler() {
        if (!this.keydownHandler) return;

        document.removeEventListener('keydown', this.keydownHandler);
        this.keydownHandler = null;
    }

    /**
     * Remove the dialog and event listeners.
     *
     * @returns {void}
     */
    destroy() {
        this.removeKeydownHandler();

        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        if (this.feedback) {
            this.feedback.destroy();
            this.feedback = null;
        }

        this.resolve = null;
        this.options = null;
        this.filteredData = [];
        this.selectedIndex = -1;
        this.currentPage = 1;
        this.panel = null;
        this.titleElement = null;
        this.search = null;
        this.tableWrap = null;
        this.table = null;
        this.paginationElement = null;
        this.paginationSummary = null;
        this.firstPageButton = null;
        this.previousPageButton = null;
        this.nextPageButton = null;
        this.lastPageButton = null;
        this.cancelButton = null;
        this.selectButton = null;
    }

    createStructure() {
        const overlay = createElement('div', 'amb-lookup-dialog');
        const panel = createElement('div', 'amb-lookup-dialog__panel');
        const header = createElement('div', 'amb-lookup-dialog__header');
        const title = createElement('h2', 'amb-lookup-dialog__title');
        const feedback = new FeedbackRegion({ className: 'amb-dialog-feedback' });
        const body = createElement('div', 'amb-lookup-dialog__body');
        const search = createElement('input', 'amb-lookup-dialog__search');
        const tableWrap = createElement('div', 'amb-lookup-dialog__table-wrap');
        const table = createElement('table', 'amb-lookup-dialog__table');
        const pagination = createElement('div', 'amb-lookup-pagination');
        const paginationSummary = createElement('div', 'amb-lookup-pagination__summary');
        const paginationActions = createElement('div', 'amb-lookup-pagination__actions');
        const firstPageButton = createElement(
            'button',
            'amb-lookup-dialog__button amb-lookup-pagination__button amb-lookup-pagination__button--first',
            '\u00AB'
        );
        const previousPageButton = createElement(
            'button',
            'amb-lookup-dialog__button amb-lookup-pagination__button amb-lookup-pagination__button--previous',
            '\u2039'
        );
        const nextPageButton = createElement(
            'button',
            'amb-lookup-dialog__button amb-lookup-pagination__button amb-lookup-pagination__button--next',
            '\u203A'
        );
        const lastPageButton = createElement(
            'button',
            'amb-lookup-dialog__button amb-lookup-pagination__button amb-lookup-pagination__button--last',
            '\u00BB'
        );
        const footer = createElement('div', 'amb-lookup-dialog__footer');
        const cancelButton = createElement('button', 'amb-lookup-dialog__button');
        const selectButton = createElement(
            'button',
            'amb-lookup-dialog__button amb-lookup-dialog__button--primary'
        );

        search.type = 'search';
        firstPageButton.type = 'button';
        firstPageButton.setAttribute('aria-label', 'First lookup page');
        firstPageButton.title = 'First page';
        previousPageButton.type = 'button';
        previousPageButton.setAttribute('aria-label', 'Previous lookup page');
        previousPageButton.title = 'Previous page';
        nextPageButton.type = 'button';
        nextPageButton.setAttribute('aria-label', 'Next lookup page');
        nextPageButton.title = 'Next page';
        lastPageButton.type = 'button';
        lastPageButton.setAttribute('aria-label', 'Last lookup page');
        lastPageButton.title = 'Last page';
        paginationSummary.setAttribute('role', 'status');
        paginationSummary.setAttribute('aria-live', 'polite');
        cancelButton.type = 'button';
        selectButton.type = 'button';

        header.appendChild(title);
        tableWrap.appendChild(table);
        paginationActions.appendChild(firstPageButton);
        paginationActions.appendChild(previousPageButton);
        paginationActions.appendChild(nextPageButton);
        paginationActions.appendChild(lastPageButton);
        pagination.appendChild(paginationSummary);
        pagination.appendChild(paginationActions);
        body.appendChild(search);
        body.appendChild(tableWrap);
        body.appendChild(pagination);
        footer.appendChild(cancelButton);
        footer.appendChild(selectButton);
        panel.appendChild(header);
        panel.appendChild(feedback.element);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.panel = panel;
        this.titleElement = title;
        this.feedback = feedback;
        this.tableWrap = tableWrap;
        this.table = table;
        this.search = search;
        this.paginationElement = pagination;
        this.paginationSummary = paginationSummary;
        this.firstPageButton = firstPageButton;
        this.previousPageButton = previousPageButton;
        this.nextPageButton = nextPageButton;
        this.lastPageButton = lastPageButton;
        this.cancelButton = cancelButton;
        this.selectButton = selectButton;

        overlay.addEventListener('mousedown', event => {
            if (
                this.options.closeOnBackdropClick
                && event.target === overlay
            ) {
                this.close(null);
            }
        });
        cancelButton.addEventListener('click', () => this.close(null));
        selectButton.addEventListener('click', () => this.selectCurrent());
        search.addEventListener('input', () => this.filter(search.value));
        firstPageButton.addEventListener('click', () => this.goToPage(1));
        previousPageButton.addEventListener('click', () => this.changePage(-1));
        nextPageButton.addEventListener('click', () => this.changePage(1));
        lastPageButton.addEventListener('click', () => {
            this.goToPage(this.getRenderState().pageCount);
        });
    }

    render() {
        if (!this.overlay) {
            this.createStructure();
        }

        this.overlay.hidden = false;
        this.panel.style.width = `${this.options.width}px`;
        this.titleElement.textContent = this.options.title;
        this.search.placeholder = this.options.searchPlaceholder;
        this.search.value = '';
        this.cancelButton.textContent = this.options.cancelText;
        this.selectButton.textContent = this.options.selectText;
        this.paginationElement.hidden = !this.options.pagination.enabled;
        const fullPaginationControls = this.options.pagination.controls === 'full';

        this.firstPageButton.hidden = !fullPaginationControls;
        this.lastPageButton.hidden = !fullPaginationControls;

        this.renderTable();
        this.keydownHandler = event => this.handleKeydown(event);
        document.addEventListener('keydown', this.keydownHandler);
        this.search.focus();
    }

    updateSelectButton() {
        if (!this.selectButton) return;

        this.selectButton.disabled = this.selectedIndex < 0;
    }

    getRenderState() {
        const totalCount = this.filteredData.length;

        if (this.options.pagination.enabled) {
            const pageCount = Math.max(
                1,
                Math.ceil(totalCount / this.options.pagination.pageSize)
            );

            this.currentPage = Math.min(Math.max(this.currentPage, 1), pageCount);

            const startIndex = (this.currentPage - 1)
                * this.options.pagination.pageSize;
            const endIndex = Math.min(
                startIndex + this.options.pagination.pageSize,
                totalCount
            );

            return {
                data: this.filteredData.slice(startIndex, endIndex),
                startIndex,
                endIndex,
                pageCount,
                totalCount
            };
        }

        const endIndex = this.options.initialRenderLimit
            ? Math.min(this.options.initialRenderLimit, totalCount)
            : totalCount;

        return {
            data: this.filteredData.slice(0, endIndex),
            startIndex: 0,
            endIndex,
            pageCount: 1,
            totalCount
        };
    }

    updateResultsFeedback(renderState) {
        if (!renderState.totalCount) {
            this.feedback?.show({
                type: 'info',
                message: this.options.noResultsText
            });
            return;
        }

        if (
            !this.options.pagination.enabled
            && renderState.endIndex < renderState.totalCount
        ) {
            const hasQuery = Boolean(
                this.search
                && String(this.search.value || '').trim()
            );

            this.feedback?.show({
                type: 'info',
                message: hasQuery
                    ? `Showing first ${renderState.endIndex} of ${renderState.totalCount} matching results. Refine your search to narrow the list.`
                    : `Showing first ${renderState.endIndex} of ${renderState.totalCount} results. Search to narrow the list.`
            });
            return;
        }

        this.feedback?.clear();
    }

    updatePagination(renderState) {
        if (!this.options.pagination.enabled) return;

        this.paginationElement.hidden = !this.options.pagination.alwaysVisible
            && renderState.pageCount <= 1;

        const firstResult = renderState.totalCount
            ? renderState.startIndex + 1
            : 0;

        const atFirstPage = this.currentPage <= 1;
        const atLastPage = this.currentPage >= renderState.pageCount;

        this.paginationSummary.textContent = `Showing ${firstResult}-${renderState.endIndex} of ${renderState.totalCount} results | Page ${this.currentPage} of ${renderState.pageCount}`;
        this.firstPageButton.disabled = atFirstPage;
        this.previousPageButton.disabled = atFirstPage;
        this.nextPageButton.disabled = atLastPage;
        this.lastPageButton.disabled = atLastPage;
    }

    renderTable() {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const tbody = document.createElement('tbody');
        const renderState = this.getRenderState();

        this.options.columns.forEach(column => {
            const th = document.createElement('th');

            th.textContent = column.title || column.field;

            if (column.width) {
                th.style.width = `${column.width}px`;
            }

            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);

        if (!this.filteredData.length) {
            const row = document.createElement('tr');
            const td = document.createElement('td');

            row.className = 'amb-lookup-dialog__empty-row';
            td.className = 'amb-lookup-dialog__empty-cell';
            td.colSpan = Math.max(this.options.columns.length, 1);
            td.textContent = this.options.noResultsText;
            row.appendChild(td);
            tbody.appendChild(row);
        }

        this.updateResultsFeedback(renderState);
        this.updatePagination(renderState);

        renderState.data.forEach((item, offset) => {
            const index = renderState.startIndex + offset;
            const row = document.createElement('tr');

            row.className = index === this.selectedIndex
                ? 'amb-lookup-dialog__row amb-lookup-dialog__row--selected'
                : 'amb-lookup-dialog__row';
            row.dataset.rowIndex = String(index);

            this.options.columns.forEach(column => {
                const td = document.createElement('td');

                td.textContent = getFormattedCellValue(item, column);
                row.appendChild(td);
            });

            row.addEventListener('click', () => {
                this.selectedIndex = index;
                this.updateRowSelection();
            });
            row.addEventListener('dblclick', () => {
                this.selectedIndex = index;
                this.selectCurrent();
            });
            tbody.appendChild(row);
        });

        this.table.innerHTML = '';
        this.table.appendChild(thead);
        this.table.appendChild(tbody);
        this.updateSelectButton();
    }

    changePage(direction) {
        if (!this.options.pagination.enabled) return;

        this.goToPage(this.currentPage + direction);
    }

    goToPage(pageNumber) {
        if (!this.options.pagination.enabled) return;

        const renderState = this.getRenderState();
        const nextPage = Math.min(Math.max(pageNumber, 1), renderState.pageCount);

        if (nextPage === this.currentPage) return;

        this.currentPage = nextPage;
        this.selectedIndex = -1;
        this.renderTable();

        if (this.tableWrap) {
            this.tableWrap.scrollTop = 0;
        }
    }

    updateRowSelection() {
        if (!this.table) return;

        this.table.querySelectorAll('.amb-lookup-dialog__row').forEach(row => {
            const rowIndex = Number(row.dataset.rowIndex);

            row.classList.toggle(
                'amb-lookup-dialog__row--selected',
                rowIndex === this.selectedIndex
            );
        });
        this.updateSelectButton();
    }

    filter(query) {
        const normalizedQuery = String(query || '').trim().toLowerCase();

        this.filteredData = (this.options.data || []).filter(item => {
            if (!normalizedQuery) return true;

            return this.options.searchFields.some(field => {
                return getCellValue(item, field).toLowerCase().includes(normalizedQuery);
            });
        });
        this.selectedIndex = -1;
        this.currentPage = 1;
        this.renderTable();
    }

    handleKeydown(event) {
        if (!this.overlay || this.overlay.hidden) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            this.close(null);
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            this.selectCurrent();
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.moveSelection(1);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.moveSelection(-1);
        }
    }

    moveSelection(direction) {
        const renderState = this.getRenderState();
        const renderedCount = renderState.data.length;

        if (!renderedCount) return;

        if (
            this.selectedIndex < renderState.startIndex
            || this.selectedIndex >= renderState.endIndex
        ) {
            this.selectedIndex = direction > 0
                ? renderState.startIndex
                : renderState.endIndex - 1;
            this.updateRowSelection();
            return;
        }

        this.selectedIndex = Math.max(
            renderState.startIndex,
            Math.min(renderState.endIndex - 1, this.selectedIndex + direction)
        );
        this.updateRowSelection();
    }

    selectCurrent() {
        if (this.selectedIndex < 0) return;

        this.close(this.filteredData[this.selectedIndex] || null);
    }
}
