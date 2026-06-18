import TomSelect from 'tom-select';
import {
    filterAutocompleteItems,
    normalizeAutocompleteItems,
    normalizeAutocompleteOptions,
    resolveAutocompleteCommit
} from './autocomplete-editor-utils.js';
import { createLookupOption, createSelectOption, getInitialValue, getLookupOptionValue } from './shared.js';

    /**
     * Text editor that suggests values from a list while the user types.
     *
     * @param {Array<string>|object} values - Suggested strings. A source object
     * with a `load` function remains supported for compatibility.
     * @param {object} [options] - Autocomplete options.
     * @param {boolean} [options.allowEmpty=true] - Allow saving an empty string.
     * @param {boolean} [options.allowCustomValue=false] - Allow values not present in the suggestions.
     * @param {'commitRaw'|'cancel'} [options.invalidBehavior='commitRaw'] - Behavior for typed values without a selected suggestion.
     * @param {number} [options.maxOptions=10] - Maximum matching options shown.
     * @param {number} [options.dropdownWidth=420] - Dropdown width in pixels.
     * @param {string} [options.valueField] - Stored value field override.
     * @param {string} [options.labelField] - Display label field override.
     * @param {object} [options.context] - Context passed to a compatible custom source.
     * @param {Function} [options.renderOption] - Custom Tom Select option renderer.
     * @param {Function} [options.renderItem] - Custom Tom Select selected item renderer.
     * @returns {Function} Tabulator editor.
     *
     * String values are normalized internally for Tom Select. The text selected
     * or typed by the user is the value stored in the cell.
     */
export function autocomplete(values, options = {}) {
        const normalizedOptions = normalizeAutocompleteOptions(options);
        const valueField = values && values.valueField
            ? values.valueField
            : normalizedOptions.valueField || 'value';
        const labelField = values && values.labelField
            ? values.labelField
            : normalizedOptions.labelField || 'label';
        const renderDefaultOption = (item, escape) => {
            return `<div class="amb-autocomplete-option">${escape(item[labelField] ?? '')}</div>`;
        };
        const renderDefaultItem = (item, escape) => {
            return `<div class="amb-autocomplete-item">${escape(item[labelField] ?? item[valueField] ?? '')}</div>`;
        };

        return (cell, onRendered, success, cancel) => {
            const select = document.createElement('select');
            const initialValue = getInitialValue(cell);
            const row = cell.getRow && cell.getRow();
            const rowData = row && row.getData ? row.getData() : undefined;
            const field = cell.getField && cell.getField();
            let tomSelect = null;
            let closed = false;
            let initializing = false;
            let blurTimeout = null;
            let lastTypedValue = '';

            const destroyTomSelect = () => {
                if (blurTimeout) {
                    window.clearTimeout(blurTimeout);
                    blurTimeout = null;
                }

                if (tomSelect) {
                    tomSelect.destroy();
                    tomSelect = null;
                }
            };

            const closeWithSuccess = value => {
                if (closed) return;

                closed = true;
                success(value);
                destroyTomSelect();
            };

            const closeWithCancel = () => {
                if (closed) return;

                closed = true;
                cancel();
                destroyTomSelect();
            };

            const commitCurrentValue = typedValue => {
                const result = resolveAutocompleteCommit({
                    selectedValue: tomSelect ? tomSelect.getValue() : '',
                    typedValue: typedValue !== undefined
                        ? typedValue
                        : lastTypedValue,
                    options: normalizedOptions
                });

                if (result.action === 'cancel') {
                    closeWithCancel();
                    return;
                }

                closeWithSuccess(result.value);
            };

            const loadSuggestions = async query => {
                if (Array.isArray(values)) {
                    return filterAutocompleteItems(
                        values,
                        query,
                        normalizedOptions.maxOptions,
                        valueField,
                        labelField
                    );
                }

                if (!values || typeof values.load !== 'function') {
                    return [];
                }

                const items = await values.load({
                    query,
                    rowData,
                    field,
                    context: normalizedOptions.context || {}
                });

                return normalizeAutocompleteItems(items, valueField, labelField)
                    .slice(0, normalizedOptions.maxOptions);
            };

            const setValueSilently = value => {
                initializing = true;

                try {
                    tomSelect.setValue(value, true);
                } finally {
                    initializing = false;
                }
            };

            const addRawOption = value => {
                tomSelect.addOption(createLookupOption(value, value, valueField, labelField));
                setValueSilently(value);
            };

            if (normalizedOptions.allowEmpty) {
                select.appendChild(createSelectOption({
                    value: '',
                    label: ''
                }));
            }

            const loadInitialOptionsAndValue = async () => {
                if (!tomSelect || closed) return;

                try {
                    const items = await loadSuggestions('');

                    if (closed || !tomSelect) return;

                    tomSelect.addOptions(items);

                    if (initialValue) {
                        const matchedItem = items.find(item => getLookupOptionValue(item, valueField) === initialValue);

                        if (!matchedItem) {
                            tomSelect.addOption(createLookupOption(
                                initialValue,
                                initialValue,
                                valueField,
                                labelField
                            ));
                        }

                        setValueSilently(initialValue);
                    }

                    tomSelect.refreshOptions(false);
                    tomSelect.open();
                    tomSelect.focus();
                } catch {
                    if (!closed && tomSelect && initialValue) {
                        addRawOption(initialValue);
                        tomSelect.refreshOptions(false);
                        tomSelect.open();
                        tomSelect.focus();
                    }
                }
            };

            onRendered(() => {
                tomSelect = new TomSelect(select, {
                    valueField,
                    labelField,
                    searchField: [labelField, valueField],
                    placeholder: normalizedOptions.placeholder,
                    maxOptions: normalizedOptions.maxOptions,
                    create: normalizedOptions.allowCustomValue
                        ? input => createLookupOption(input, input, valueField, labelField)
                        : false,
                    persist: false,
                    closeAfterSelect: true,
                    openOnFocus: true,
                    dropdownParent: 'body',
                    load: async (query, callback) => {
                        try {
                            callback(await loadSuggestions(query));
                        } catch {
                            callback([]);
                        }
                    },
                    render: {
                        option: normalizedOptions.renderOption || renderDefaultOption,
                        item: normalizedOptions.renderItem || renderDefaultItem
                    },
                    onChange: value => {
                        if (initializing || closed) return;

                        if (value === '' && normalizedOptions.allowEmpty) {
                            closeWithSuccess('');
                            return;
                        }

                        if (value !== '') {
                            closeWithSuccess(value);
                        }
                    },
                    onBlur: () => {
                        blurTimeout = window.setTimeout(() => {
                            if (closed) return;

                            commitCurrentValue();
                        }, 200);
                    }
                });

                if (normalizedOptions.dropdownWidth && tomSelect.dropdown) {
                    tomSelect.dropdown.style.width = `${normalizedOptions.dropdownWidth}px`;
                }

                tomSelect.control_input.addEventListener('input', event => {
                    lastTypedValue = event.target.value;
                });
                tomSelect.control_input.addEventListener('keydown', event => {
                    if (event.key === 'Enter') {
                        const typedValue = tomSelect.control_input.value;

                        lastTypedValue = typedValue;
                        window.setTimeout(() => {
                            if (!closed) {
                                commitCurrentValue(typedValue);
                            }
                        }, 0);
                        return;
                    }

                    if (event.key === 'Escape') {
                        closeWithCancel();
                    }
                });
                loadInitialOptionsAndValue();
            });

            select.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    closeWithCancel();
                }
            });

            return select;
        };
}
