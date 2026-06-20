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

/**
 * Modal dialog used to choose which fields the AMB.table search toolbar scans.
 */
export class SearchFiltersDialog {
    /**
     * Create a search filters dialog instance.
     */
    constructor() {
        this.overlay = null;
        this.resolve = null;
        this.options = null;
        this.checkboxes = [];
        this.caseSensitiveInput = null;
        this.wholeWordInput = null;
        this.keydownHandler = null;
    }

    /**
     * Open the dialog.
     *
     * @param {object} [options] - Dialog options.
     * @param {string} [options.title='Search Filters'] - Dialog title.
     * @param {object[]} [options.columns=[]] - Searchable columns.
     * @param {string} options.columns[].field - Field name returned when selected.
     * @param {string} [options.columns[].title] - User-facing label.
     * @param {boolean} [options.columns[].selected=true] - Initial selected state.
     * @param {string} [options.selectAllText='Select All'] - Select-all button text.
     * @param {string} [options.clearAllText='Clear All'] - Clear-all button text.
     * @param {string} [options.applyText='Apply'] - Apply button text.
     * @param {string} [options.cancelText='Cancel'] - Cancel button text.
     * @param {boolean} [options.caseSensitive=false] - Initial case-sensitive state.
     * @param {boolean} [options.wholeWord=false] - Initial whole-word state.
     * @returns {Promise<object>} Dialog result with selected fields and search options.
     */
    open(options = {}) {
        if (this.resolve) {
            this.close({ applied: false });
        }

        this.options = {
            title: 'Search Filters',
            columns: [],
            searchInText: 'Search in:',
            caseSensitive: false,
            wholeWord: false,
            caseSensitiveText: 'Case sensitive',
            wholeWordText: 'Whole word',
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

    /**
     * Close the dialog and resolve the pending promise.
     *
     * @param {object} value - Result object.
     * @param {boolean} value.applied - Whether filters were applied.
     * @param {string[]} [value.selectedFields] - Selected field names when applied.
     * @param {boolean} [value.caseSensitive] - Applied case-sensitive state.
     * @param {boolean} [value.wholeWord] - Applied whole-word state.
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

        this.resolve = null;
        this.options = null;
        this.checkboxes = [];
        this.caseSensitiveInput = null;
        this.wholeWordInput = null;
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
        const searchInLabel = createElement(
            'div',
            'amb-search-filters-dialog__section-label',
            this.options.searchInText
        );
        const bulkActions = createElement('div', 'amb-search-filters-dialog__bulk-actions');
        const selectAllButton = createElement('button', 'amb-search-filters-dialog__button', this.options.selectAllText);
        const clearAllButton = createElement('button', 'amb-search-filters-dialog__button', this.options.clearAllText);
        const list = createElement('div', 'amb-search-filters-dialog__list');
        const optionsGroup = createElement('div', 'amb-search-filters-dialog__options');
        const caseSensitiveOption = createElement('label', 'amb-search-filters-dialog__option');
        const caseSensitiveInput = createElement('input', 'amb-search-filters-dialog__checkbox');
        const caseSensitiveLabel = createElement(
            'span',
            'amb-search-filters-dialog__label',
            this.options.caseSensitiveText
        );
        const wholeWordOption = createElement('label', 'amb-search-filters-dialog__option');
        const wholeWordInput = createElement('input', 'amb-search-filters-dialog__checkbox');
        const wholeWordLabel = createElement(
            'span',
            'amb-search-filters-dialog__label',
            this.options.wholeWordText
        );
        const footer = createElement('div', 'amb-search-filters-dialog__footer');
        const cancelButton = createElement('button', 'amb-search-filters-dialog__button', this.options.cancelText);
        const applyButton = createElement('button', 'amb-search-filters-dialog__button amb-search-filters-dialog__button--primary', this.options.applyText);

        selectAllButton.type = 'button';
        clearAllButton.type = 'button';
        cancelButton.type = 'button';
        applyButton.type = 'button';
        caseSensitiveInput.type = 'checkbox';
        caseSensitiveInput.checked = this.options.caseSensitive === true;
        wholeWordInput.type = 'checkbox';
        wholeWordInput.checked = this.options.wholeWord === true;

        header.appendChild(title);
        bulkActions.append(selectAllButton, clearAllButton);
        caseSensitiveOption.append(caseSensitiveInput, caseSensitiveLabel);
        wholeWordOption.append(wholeWordInput, wholeWordLabel);
        optionsGroup.append(caseSensitiveOption, wholeWordOption);
        body.append(searchInLabel, bulkActions, list, optionsGroup);
        footer.append(cancelButton, applyButton);
        panel.append(header, body, footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.caseSensitiveInput = caseSensitiveInput;
        this.wholeWordInput = wholeWordInput;
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
                selectedFields: this.getSelectedFields(),
                caseSensitive: caseSensitiveInput.checked,
                wholeWord: wholeWordInput.checked
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
