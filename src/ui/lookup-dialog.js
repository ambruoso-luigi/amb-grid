import { FeedbackRegion } from './feedback-region.js';

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
     * @param {number} [options.initialRenderLimit] - Maximum rows rendered at once. Filtering still uses the complete dataset.
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
            initialRenderLimit: null,
            noResultsText: 'No results',
            selectText: 'Select',
            cancelText: 'Cancel',
            ...options
        };
        this.options.closeOnBackdropClick = this.options.closeOnBackdropClick !== false;
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

        this.destroy();

        if (resolve) {
            resolve(value);
        }
    }

    /**
     * Remove the dialog and event listeners.
     *
     * @returns {void}
     */
    destroy() {
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
            this.keydownHandler = null;
        }

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
    }

    render() {
        const overlay = createElement('div', 'amb-lookup-dialog');
        const panel = createElement('div', 'amb-lookup-dialog__panel');
        const header = createElement('div', 'amb-lookup-dialog__header');
        const title = createElement('h2', 'amb-lookup-dialog__title', this.options.title);
        const feedback = new FeedbackRegion({ className: 'amb-dialog-feedback' });
        const body = createElement('div', 'amb-lookup-dialog__body');
        const search = createElement('input', 'amb-lookup-dialog__search');
        const tableWrap = createElement('div', 'amb-lookup-dialog__table-wrap');
        const table = createElement('table', 'amb-lookup-dialog__table');
        const footer = createElement('div', 'amb-lookup-dialog__footer');
        const cancelButton = createElement('button', 'amb-lookup-dialog__button', this.options.cancelText);
        const selectButton = createElement('button', 'amb-lookup-dialog__button amb-lookup-dialog__button--primary', this.options.selectText);

        search.type = 'search';
        search.placeholder = this.options.searchPlaceholder;
        cancelButton.type = 'button';
        selectButton.type = 'button';
        panel.style.width = `${this.options.width}px`;

        header.appendChild(title);
        tableWrap.appendChild(table);
        body.appendChild(search);
        body.appendChild(tableWrap);
        footer.appendChild(cancelButton);
        footer.appendChild(selectButton);
        panel.appendChild(header);
        panel.appendChild(feedback.element);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.feedback = feedback;
        this.table = table;
        this.search = search;
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
        this.keydownHandler = event => this.handleKeydown(event);
        document.addEventListener('keydown', this.keydownHandler);

        this.renderTable();
        search.focus();
    }

    updateSelectButton() {
        if (!this.selectButton) return;

        this.selectButton.disabled = this.selectedIndex < 0;
    }

    getRenderedData() {
        if (!this.options.initialRenderLimit) {
            return this.filteredData;
        }

        return this.filteredData.slice(0, this.options.initialRenderLimit);
    }

    updateResultsFeedback(renderedCount) {
        const totalCount = this.filteredData.length;

        if (!totalCount) {
            this.feedback?.show({
                type: 'info',
                message: this.options.noResultsText
            });
            return;
        }

        if (renderedCount < totalCount) {
            const hasQuery = Boolean(
                this.search
                && String(this.search.value || '').trim()
            );

            this.feedback?.show({
                type: 'info',
                message: hasQuery
                    ? `Showing first ${renderedCount} of ${totalCount} matching results. Refine your search to narrow the list.`
                    : `Showing first ${renderedCount} of ${totalCount} results. Search to narrow the list.`
            });
            return;
        }

        this.feedback?.clear();
    }

    renderTable() {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const tbody = document.createElement('tbody');
        const renderedData = this.getRenderedData();

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

        this.updateResultsFeedback(renderedData.length);

        renderedData.forEach((item, index) => {
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
        this.renderTable();
    }

    handleKeydown(event) {
        if (!this.overlay) return;

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
        const renderedCount = this.getRenderedData().length;

        if (!renderedCount) return;

        if (this.selectedIndex < 0) {
            this.selectedIndex = direction > 0
                ? 0
                : renderedCount - 1;
            this.updateRowSelection();
            return;
        }

        this.selectedIndex = Math.max(
            0,
            Math.min(renderedCount - 1, this.selectedIndex + direction)
        );
        this.updateRowSelection();
    }

    selectCurrent() {
        if (this.selectedIndex < 0) return;

        this.close(this.filteredData[this.selectedIndex] || null);
    }
}
