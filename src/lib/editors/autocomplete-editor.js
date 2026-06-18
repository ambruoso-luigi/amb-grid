import {
    filterAutocompleteItems,
    getAutocompleteCursorPosition,
    getAutocompleteKeyAction,
    normalizeAutocompleteItems,
    normalizeAutocompleteOptions,
    resolveAutocompleteCommit
} from './autocomplete-editor-utils.js';
import { getInitialValue, getLookupOptionValue } from './shared.js';

/**
 * Native text editor that suggests values from a list while the user types.
 *
 * @param {Array<string>|object} values - Suggested strings. A source object
 * with a `load` function remains supported for compatibility.
 * @param {object} [options] - Autocomplete options.
 * @param {boolean} [options.allowEmpty=true] - Allow saving an empty string.
 * @param {boolean} [options.allowCustomValue=false] - Allow values not present in the suggestions.
 * @param {'commitRaw'|'cancel'} [options.invalidBehavior='commitRaw'] - Behavior for typed values without a selected suggestion.
 * @param {boolean} [options.trimInput=true] - Trim selected and typed text on commit.
 * @param {number} [options.maxOptions=10] - Maximum matching options shown.
 * @param {number} [options.dropdownWidth=420] - Dropdown width in pixels.
 * @param {string} [options.placeholder] - Native input placeholder.
 * @param {string} [options.valueField] - Stored value field override.
 * @param {string} [options.labelField] - Display label field override.
 * @param {object} [options.context] - Context passed to a compatible custom source.
 * @returns {Function} Tabulator editor.
 */
export function autocomplete(values, options = {}) {
    const normalizedOptions = normalizeAutocompleteOptions(options);
    const valueField = values && values.valueField
        ? values.valueField
        : normalizedOptions.valueField || 'value';
    const labelField = values && values.labelField
        ? values.labelField
        : normalizedOptions.labelField || 'label';
    const staticItems = Array.isArray(values)
        ? normalizeAutocompleteItems(values, valueField, labelField)
        : null;

    return (cell, onRendered, success, cancel) => {
        const input = document.createElement('input');
        const dropdown = document.createElement('div');
        const initialValue = getInitialValue(cell);
        const row = cell.getRow && cell.getRow();
        const rowData = row && row.getData ? row.getData() : undefined;
        const field = cell.getField && cell.getField();
        let suggestions = [];
        let activeIndex = -1;
        let closed = false;
        let blurTimeout = null;
        let loadToken = 0;

        input.type = 'text';
        input.value = initialValue;
        input.className = 'amb-autocomplete-editor';
        input.autocomplete = 'off';
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-expanded', 'false');

        if (normalizedOptions.placeholder) {
            input.placeholder = normalizedOptions.placeholder;
        }

        dropdown.className = 'amb-autocomplete-dropdown';
        dropdown.setAttribute('role', 'listbox');
        dropdown.hidden = true;

        const positionDropdown = () => {
            if (dropdown.hidden) return;

            const rect = input.getBoundingClientRect();
            const width = normalizedOptions.dropdownWidth || rect.width;

            dropdown.style.left = `${rect.left + window.scrollX}px`;
            dropdown.style.top = `${rect.bottom + window.scrollY}px`;
            dropdown.style.width = `${Math.max(width, rect.width)}px`;
        };

        const hideDropdown = () => {
            dropdown.hidden = true;
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
        };

        const updateActiveSuggestion = () => {
            dropdown.querySelectorAll('.amb-autocomplete-option').forEach((option, index) => {
                const isActive = index === activeIndex;

                option.classList.toggle('is-active', isActive);
                option.setAttribute('aria-selected', String(isActive));

                if (isActive) {
                    input.setAttribute('aria-activedescendant', option.id);
                    option.scrollIntoView({ block: 'nearest' });
                }
            });

            if (activeIndex < 0) {
                input.removeAttribute('aria-activedescendant');
            }
        };

        const cleanup = () => {
            if (blurTimeout) {
                window.clearTimeout(blurTimeout);
                blurTimeout = null;
            }

            window.removeEventListener('resize', positionDropdown);
            window.removeEventListener('scroll', positionDropdown, true);
            dropdown.remove();
        };

        const closeWithSuccess = value => {
            if (closed) return;

            closed = true;
            cleanup();
            success(value);
        };

        const closeWithCancel = () => {
            if (closed) return;

            closed = true;
            cleanup();
            cancel();
        };

        const getSuggestionValue = item => getLookupOptionValue(item, valueField);

        const getExactSuggestionValue = typedValue => {
            const normalizedTypedValue = String(typedValue).trim().toLowerCase();
            const exactItem = (staticItems || suggestions).find(item => {
                const value = String(item[valueField] ?? '').trim().toLowerCase();
                const label = String(item[labelField] ?? '').trim().toLowerCase();

                return value === normalizedTypedValue || label === normalizedTypedValue;
            });

            return exactItem ? getSuggestionValue(exactItem) : '';
        };

        const commit = selectedValue => {
            const result = resolveAutocompleteCommit({
                selectedValue: selectedValue || getExactSuggestionValue(input.value),
                typedValue: input.value,
                options: normalizedOptions
            });

            if (result.action === 'cancel') {
                closeWithCancel();
                return;
            }

            closeWithSuccess(result.value);
        };

        const selectSuggestion = index => {
            const item = suggestions[index];

            if (!item) {
                commit();
                return;
            }

            const value = getSuggestionValue(item);

            input.value = value;
            commit(value);
        };

        const renderSuggestions = items => {
            suggestions = items;
            activeIndex = -1;
            dropdown.replaceChildren();

            items.forEach((item, index) => {
                const option = document.createElement('div');

                option.id = `amb-autocomplete-option-${Math.random().toString(36).slice(2)}`;
                option.className = 'amb-autocomplete-option';
                option.textContent = String(item[labelField] ?? item[valueField] ?? '');
                option.setAttribute('role', 'option');
                option.setAttribute('aria-selected', 'false');
                option.addEventListener('mousedown', event => {
                    event.preventDefault();
                });
                option.addEventListener('mouseenter', () => {
                    activeIndex = index;
                    updateActiveSuggestion();
                });
                option.addEventListener('click', () => {
                    selectSuggestion(index);
                });
                dropdown.append(option);
            });

            if (items.length === 0) {
                hideDropdown();
                return;
            }

            dropdown.hidden = false;
            input.setAttribute('aria-expanded', 'true');
            positionDropdown();
        };

        const loadSuggestions = async query => {
            if (staticItems) {
                return filterAutocompleteItems(
                    staticItems,
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

            return filterAutocompleteItems(
                items,
                query,
                normalizedOptions.maxOptions,
                valueField,
                labelField
            );
        };

        const refreshSuggestions = async () => {
            const token = loadToken + 1;

            loadToken = token;

            try {
                const items = await loadSuggestions(input.value);

                if (closed || token !== loadToken) return;

                renderSuggestions(items);
            } catch {
                if (!closed && token === loadToken) {
                    renderSuggestions([]);
                }
            }
        };

        input.addEventListener('input', refreshSuggestions);
        input.addEventListener('keydown', event => {
            const action = getAutocompleteKeyAction({
                key: event.key,
                activeIndex,
                suggestionCount: suggestions.length
            });

            if (action.preventDefault) {
                event.preventDefault();
            }

            if (action.action === 'navigate') {
                activeIndex = action.activeIndex;
                updateActiveSuggestion();
                return;
            }

            if (action.action === 'commitSuggestion') {
                selectSuggestion(action.activeIndex);
                return;
            }

            if (action.action === 'commitInput') {
                commit();
                return;
            }

            if (action.action === 'cancel') {
                closeWithCancel();
            }
        });
        input.addEventListener('blur', () => {
            blurTimeout = window.setTimeout(() => {
                if (!closed) {
                    commit();
                }
            }, 0);
        });

        document.body.append(dropdown);
        window.addEventListener('resize', positionDropdown);
        window.addEventListener('scroll', positionDropdown, true);

        onRendered(() => {
            input.focus();

            const cursorPosition = getAutocompleteCursorPosition(input.value);

            input.setSelectionRange(cursorPosition, cursorPosition);
            refreshSuggestions();
        });

        return input;
    };
}
