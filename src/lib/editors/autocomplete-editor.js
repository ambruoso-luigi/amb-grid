import Awesomplete from 'awesomplete';
import 'awesomplete/awesomplete.css';
import {
    getAutocompleteCursorPosition,
    getAutocompleteKeyAction,
    getAutocompleteSuggestionValues,
    getAwesompleteOptions,
    normalizeAutocompleteOptions,
    resolveAutocompleteCommit
} from './autocomplete-editor-utils.js';
import { getInitialValue } from './shared.js';

/**
 * Native text editor with suggestions from a simple string list.
 *
 * Awesomplete provides lightweight suggestion display and keyboard navigation.
 * AMB Grid owns the text value, commit rules, validation, CRUD state, and
 * lifecycle cleanup. Suggestions have no separate hidden associated data, and
 * this editor does not perform remote lookup or asynchronous validation.
 *
 * @param {Array<string>} values - Suggested text values.
 * @param {object} [options] - Autocomplete options.
 * @param {boolean} [options.allowEmpty=true] - Allow saving an empty string.
 * @param {boolean} [options.allowCustomValue=false] - Allow values not present in the suggestions.
 * @param {'commitRaw'|'cancel'} [options.invalidBehavior='commitRaw'] - Behavior for typed values without a selected suggestion.
 * @param {boolean} [options.trimInput=true] - Trim selected and typed text on commit.
 * @param {number} [options.maxOptions=10] - Maximum matching suggestions shown through Awesomplete `maxItems`.
 * @param {string} [options.placeholder] - Native input placeholder.
 * @returns {Function} Tabulator editor.
 */
export function autocomplete(values, options = {}) {
    const normalizedOptions = normalizeAutocompleteOptions(options);
    const suggestionValues = getAutocompleteSuggestionValues(values);

    return (cell, onRendered, success, cancel) => {
        const input = document.createElement('input');
        let awesomplete = null;
        let closed = false;
        let cellElement = null;
        let highlightedValue = '';

        input.type = 'text';
        input.value = getInitialValue(cell);
        input.className = 'amb-autocomplete-editor';

        if (normalizedOptions.placeholder) {
            input.placeholder = normalizedOptions.placeholder;
        }

        const cleanup = () => {
            document.removeEventListener('mousedown', handleDocumentMouseDown, true);
            input.removeEventListener('keydown', handleKeydown, true);
            input.removeEventListener('blur', handleBlur);
            input.removeEventListener('input', handleInput);
            input.removeEventListener('awesomplete-highlight', handleHighlight);
            input.removeEventListener('awesomplete-selectcomplete', handleSelectComplete);

            if (cellElement) {
                cellElement.classList.remove('amb-autocomplete-cell--editing');
                cellElement = null;
            }

            if (awesomplete) {
                awesomplete.destroy();
                awesomplete = null;
            }
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

        const getSuggestionValue = suggestion => {
            if (suggestion === null || suggestion === undefined) return '';

            return suggestion.value !== undefined
                ? String(suggestion.value)
                : String(suggestion);
        };

        const getHighlightedValue = () => {
            if (
                awesomplete
                && awesomplete.selected
                && awesomplete.index >= 0
                && awesomplete.suggestions
            ) {
                return getSuggestionValue(
                    awesomplete.suggestions[awesomplete.index]
                );
            }

            return highlightedValue;
        };

        const commit = selectedValue => {
            const result = resolveAutocompleteCommit({
                selectedValue: selectedValue === undefined
                    ? getHighlightedValue()
                    : selectedValue,
                typedValue: input.value,
                options: normalizedOptions
            });

            if (result.action === 'cancel') {
                closeWithCancel();
                return;
            }

            closeWithSuccess(result.value);
        };

        const handleKeydown = event => {
            if (closed) return;

            const action = getAutocompleteKeyAction(event.key);

            if (action.preventDefault) {
                event.preventDefault();
            }

            if (action.stopPropagation) {
                event.stopPropagation();

                if (typeof event.stopImmediatePropagation === 'function') {
                    event.stopImmediatePropagation();
                }
            }

            if (action.action === 'suggestions') {
                if (!awesomplete.opened) {
                    awesomplete.evaluate();
                }

                if (event.key === 'ArrowDown') {
                    awesomplete.next();
                } else {
                    awesomplete.previous();
                }

                return;
            }

            if (action.action === 'commit') {
                commit();
                return;
            }

            if (action.action === 'cancel') {
                closeWithCancel();
            }
        };

        const handleDocumentMouseDown = event => {
            if (closed) return;

            const editorContainer = awesomplete && awesomplete.container;

            if (
                event.target === input
                || (editorContainer && editorContainer.contains(event.target))
            ) {
                return;
            }

            commit();
        };

        const handleBlur = () => {
            commit();
        };

        const handleInput = () => {
            highlightedValue = '';
        };

        const handleHighlight = event => {
            highlightedValue = getSuggestionValue(event.text);
        };

        const handleSelectComplete = event => {
            const selectedValue = getSuggestionValue(event.text) || input.value;

            input.value = selectedValue;
            commit(selectedValue);
        };

        input.addEventListener('input', handleInput);
        input.addEventListener('awesomplete-highlight', handleHighlight);
        input.addEventListener('awesomplete-selectcomplete', handleSelectComplete);

        onRendered(() => {
            awesomplete = new Awesomplete(
                input,
                getAwesompleteOptions(suggestionValues, normalizedOptions)
            );
            input.addEventListener('keydown', handleKeydown, true);
            input.addEventListener('blur', handleBlur);
            document.addEventListener('mousedown', handleDocumentMouseDown, true);

            cellElement = typeof cell.getElement === 'function'
                ? cell.getElement()
                : null;

            if (cellElement) {
                cellElement.classList.add('amb-autocomplete-cell--editing');
            }

            input.focus();

            const cursorPosition = getAutocompleteCursorPosition(input.value);

            input.setSelectionRange(cursorPosition, cursorPosition);
            awesomplete.evaluate();
        });

        return input;
    };
}
