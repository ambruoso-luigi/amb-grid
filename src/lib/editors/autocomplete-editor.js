import Awesomplete from 'awesomplete';
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
        let blurTimeout = null;

        input.type = 'text';
        input.value = getInitialValue(cell);
        input.className = 'amb-autocomplete-editor';

        if (normalizedOptions.placeholder) {
            input.placeholder = normalizedOptions.placeholder;
        }

        const cleanup = () => {
            if (blurTimeout) {
                window.clearTimeout(blurTimeout);
                blurTimeout = null;
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

        const handleBlur = () => {
            blurTimeout = window.setTimeout(() => {
                if (!closed) {
                    commit();
                }
            }, 0);
        };

        input.addEventListener('awesomplete-selectcomplete', event => {
            const selectedValue = event.text && event.text.value !== undefined
                ? String(event.text.value)
                : input.value;

            input.value = selectedValue;
            commit(selectedValue);
        });

        onRendered(() => {
            awesomplete = new Awesomplete(
                input,
                getAwesompleteOptions(suggestionValues, normalizedOptions)
            );
            input.addEventListener('keydown', handleKeydown);
            input.addEventListener('blur', handleBlur);
            input.focus();

            const cursorPosition = getAutocompleteCursorPosition(input.value);

            input.setSelectionRange(cursorPosition, cursorPosition);
            awesomplete.evaluate();
        });

        return input;
    };
}
