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
    return (columns || [])
        .filter(column => column && column.field)
        .map(column => ({
            field: column.field,
            title: column.title || column.field,
            selected: column.selected !== false
        }));
};

export class SearchFiltersDialog {
    constructor() {
        this.overlay = null;
        this.resolve = null;
        this.options = null;
        this.checkboxes = [];
        this.keydownHandler = null;
    }

    open(options = {}) {
        if (this.resolve) {
            this.close({ applied: false });
        }

        this.options = {
            title: 'Search Filters',
            columns: [],
            selectAllText: 'Select All',
            clearAllText: 'Clear All',
            applyText: 'Apply',
            cancelText: 'Cancel',
            ...options
        };
        this.options.columns = normalizeColumns(this.options.columns);

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
        this.checkboxes = [];
    }

    getSelectedFields() {
        return this.checkboxes
            .filter(input => input.checked)
            .map(input => input.value);
    }

    setAll(checked) {
        this.checkboxes.forEach(input => {
            input.checked = checked;
        });
    }

    render() {
        const overlay = createElement('div', 'amb-search-filters-dialog');
        const panel = createElement('div', 'amb-search-filters-dialog__panel');
        const header = createElement('div', 'amb-search-filters-dialog__header');
        const title = createElement('h2', 'amb-search-filters-dialog__title', this.options.title);
        const body = createElement('div', 'amb-search-filters-dialog__body');
        const bulkActions = createElement('div', 'amb-search-filters-dialog__bulk-actions');
        const selectAllButton = createElement('button', 'amb-search-filters-dialog__button', this.options.selectAllText);
        const clearAllButton = createElement('button', 'amb-search-filters-dialog__button', this.options.clearAllText);
        const list = createElement('div', 'amb-search-filters-dialog__list');
        const footer = createElement('div', 'amb-search-filters-dialog__footer');
        const cancelButton = createElement('button', 'amb-search-filters-dialog__button', this.options.cancelText);
        const applyButton = createElement('button', 'amb-search-filters-dialog__button amb-search-filters-dialog__button--primary', this.options.applyText);

        selectAllButton.type = 'button';
        clearAllButton.type = 'button';
        cancelButton.type = 'button';
        applyButton.type = 'button';

        header.appendChild(title);
        bulkActions.append(selectAllButton, clearAllButton);
        body.append(bulkActions, list);
        footer.append(cancelButton, applyButton);
        panel.append(header, body, footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.checkboxes = this.options.columns.map(column => {
            const item = createElement('label', 'amb-search-filters-dialog__item');
            const input = createElement('input', 'amb-search-filters-dialog__checkbox');
            const label = createElement('span', 'amb-search-filters-dialog__label', column.title);

            input.type = 'checkbox';
            input.value = column.field;
            input.checked = column.selected;

            item.append(input, label);
            list.appendChild(item);

            return input;
        });

        overlay.addEventListener('mousedown', event => {
            if (event.target === overlay) {
                this.close({ applied: false });
            }
        });
        selectAllButton.addEventListener('click', () => this.setAll(true));
        clearAllButton.addEventListener('click', () => this.setAll(false));
        cancelButton.addEventListener('click', () => this.close({ applied: false }));
        applyButton.addEventListener('click', () => {
            this.close({
                applied: true,
                selectedFields: this.getSelectedFields()
            });
        });
        this.keydownHandler = event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.close({ applied: false });
            }
        };
        document.addEventListener('keydown', this.keydownHandler);

        const firstCheckbox = this.checkboxes[0];

        if (firstCheckbox) {
            firstCheckbox.focus();
        } else {
            applyButton.focus();
        }
    }
}
