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
 * Native text editor with suggestions provided by Awesomplete.
 *
 * Awesomplete only displays and selects suggestions. AMB Grid owns the input
 * value, commit behavior, and validation lifecycle.
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

        input.type = 'text';
        input.value = getInitialValue(cell);
        input.className = 'amb-autocomplete-editor';

        if (normalizedOptions.placeholder) {
            input.placeholder = normalizedOptions.placeholder;
        }

        const cleanup = () => {
            document.removeEventListener('mousedown', handleDocumentMouseDown, true);
            input.removeEventListener('keydown', handleKeydown);
            input.removeEventListener('blur', handleBlur);
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

        const findExactSuggestion = value => {
            const normalizedValue = String(value ?? '').trim().toLowerCase();

            return suggestionValues.find(suggestion => {
                return suggestion.trim().toLowerCase() === normalizedValue;
            }) || '';
        };

        const commit = selectedValue => {
            const result = resolveAutocompleteCommit({
                selectedValue: selectedValue || findExactSuggestion(input.value),
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

        const handleSelectComplete = event => {
            const selectedValue = event.text && event.text.value !== undefined
                ? String(event.text.value)
                : input.value;

            input.value = selectedValue;
            commit(selectedValue);
        };

        input.addEventListener('awesomplete-selectcomplete', handleSelectComplete);

        onRendered(() => {
            awesomplete = new Awesomplete(
                input,
                getAwesompleteOptions(suggestionValues, normalizedOptions)
            );
            input.addEventListener('keydown', handleKeydown);
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
