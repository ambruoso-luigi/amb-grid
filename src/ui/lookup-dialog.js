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
    return (columns || []).filter(column => column && column.field);
};

const getCellValue = (item, field) => {
    const value = item && item[field];

    if (value === null || value === undefined) return '';

    return String(value);
};

export class LookupDialog {
    constructor() {
        this.overlay = null;
        this.resolve = null;
        this.options = null;
        this.selectedIndex = -1;
        this.filteredData = [];
        this.keydownHandler = null;
    }

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
            noResultsText: 'No results',
            selectText: 'Select',
            cancelText: 'Cancel',
            ...options
        };
        this.options.columns = normalizeColumns(this.options.columns);
        this.filteredData = [...(this.options.data || [])];
        this.selectedIndex = this.filteredData.length ? 0 : -1;

        this.render();

        return new Promise(resolve => {
            this.resolve = resolve;
        });
    }

    close(value) {
        const resolve = this.resolve;

        this.destroy();

        if (resolve) {
            resolve(value);
        }
    }

    destroy() {
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
            this.keydownHandler = null;
        }

        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
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
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.table = table;
        this.search = search;
        this.selectButton = selectButton;

        overlay.addEventListener('mousedown', event => {
            if (event.target === overlay) {
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

    renderTable() {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const tbody = document.createElement('tbody');

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

        this.filteredData.forEach((item, index) => {
            const row = document.createElement('tr');

            row.className = index === this.selectedIndex
                ? 'amb-lookup-dialog__row amb-lookup-dialog__row--selected'
                : 'amb-lookup-dialog__row';
            row.dataset.rowIndex = String(index);

            this.options.columns.forEach(column => {
                const td = document.createElement('td');

                td.textContent = getCellValue(item, column.field);
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

            return this.options.columns.some(column => {
                return getCellValue(item, column.field).toLowerCase().includes(normalizedQuery);
            });
        });
        this.selectedIndex = this.filteredData.length ? 0 : -1;
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
        if (!this.filteredData.length) return;

        this.selectedIndex = Math.max(
            0,
            Math.min(this.filteredData.length - 1, this.selectedIndex + direction)
        );
        this.updateRowSelection();
    }

    selectCurrent() {
        if (this.selectedIndex < 0) return;

        this.close(this.filteredData[this.selectedIndex] || null);
    }
}
