/**
 * Normalize autocomplete editor options.
 *
 * @param {object} [options] - Autocomplete options.
 * @param {boolean} [options.allowEmpty=true] - Allow saving an empty string.
 * @param {boolean} [options.allowCustomValue=false] - Allow values not present in the suggestions.
 * @param {'commitRaw'|'cancel'} [options.invalidBehavior='commitRaw'] - Behavior for typed values without a match.
 * @param {boolean} [options.trimInput=true] - Trim selected and typed text on commit and comparison.
 * @param {number} [options.maxOptions=10] - Maximum matching suggestions shown.
 * @param {number} [options.dropdownWidth=420] - Preferred floating suggestion width in pixels.
 * @param {boolean} [options.caseSensitive=false] - Whether matching preserves case.
 * @param {boolean} [options.commitMatchedValue=true] - Commit the canonical list value when typed text matches.
 * @returns {object} Normalized autocomplete options.
 */
export const normalizeAutocompleteOptions = (options = {}) => {
    const normalizedOptions = {
        allowEmpty: true,
        allowCustomValue: false,
        invalidBehavior: 'commitRaw',
        trimInput: true,
        maxOptions: 10,
        dropdownWidth: 420,
        caseSensitive: false,
        commitMatchedValue: true,
        ...options
    };
    const maxOptions = Number(normalizedOptions.maxOptions);

    normalizedOptions.maxOptions = Number.isFinite(maxOptions) && maxOptions > 0
        ? Math.floor(maxOptions)
        : 10;
    normalizedOptions.caseSensitive = normalizedOptions.caseSensitive === true;
    normalizedOptions.commitMatchedValue = normalizedOptions.commitMatchedValue !== false;

    return normalizedOptions;
};

/**
 * Normalize user input according to autocomplete commit rules.
 *
 * @param {*} value - Input value.
 * @param {object} [options] - Autocomplete options.
 * @returns {string} Normalized input.
 */
export const normalizeAutocompleteInput = (value, options = {}) => {
    const normalizedOptions = normalizeAutocompleteOptions(options);
    const stringValue = value === null || value === undefined
        ? ''
        : String(value);

    return normalizedOptions.trimInput ? stringValue.trim() : stringValue;
};

/**
 * Convert a suggestion source to the plain string list used by autocomplete.
 *
 * @param {Array<string>} values - Suggested values.
 * @returns {string[]} String suggestions.
 */
export const getAutocompleteSuggestionValues = values => {
    if (!Array.isArray(values)) return [];

    return values
        .filter(value => value !== null && value !== undefined)
        .map(value => String(value));
};

/**
 * Normalize a value only for autocomplete comparisons.
 *
 * @param {*} value - Value to compare.
 * @param {object} [options] - Autocomplete options.
 * @returns {string} Comparable value.
 */
export const normalizeAutocompleteComparableValue = (value, options = {}) => {
    const normalizedOptions = normalizeAutocompleteOptions(options);
    const normalizedValue = normalizeAutocompleteInput(value, normalizedOptions);

    return normalizedOptions.caseSensitive
        ? normalizedValue
        : normalizedValue.toLowerCase();
};

/**
 * Find the first canonical suggestion whose prefix matches the typed value.
 *
 * @param {Array<string>} values - Suggested values.
 * @param {*} typedValue - Current typed value.
 * @param {object} [options] - Autocomplete options.
 * @returns {string|null} Canonical suggestion value, or `null`.
 */
export const findAutocompleteMatch = (values, typedValue, options = {}) => {
    const normalizedOptions = normalizeAutocompleteOptions(options);
    const normalizedTypedValue = normalizeAutocompleteInput(typedValue, normalizedOptions);

    if (normalizedTypedValue === '') return null;

    const comparableTypedValue = normalizeAutocompleteComparableValue(
        normalizedTypedValue,
        normalizedOptions
    );

    return getAutocompleteSuggestionValues(values).find(value => {
        return normalizeAutocompleteComparableValue(value, normalizedOptions)
            .startsWith(comparableTypedValue);
    }) || null;
};

/**
 * Builds the configuration used by the internal autocomplete suggestion widget.
 *
 * @private
 * @internal
 * @param {Array<string>} values - Suggested values.
 * @param {object} [options] - Autocomplete options.
 * @returns {object} Internal suggestion-widget configuration.
 */
export const createAutocompleteWidgetOptions = (values, options = {}) => {
    const normalizedOptions = normalizeAutocompleteOptions(options);

    return {
        list: getAutocompleteSuggestionValues(values),
        minChars: 0,
        maxItems: normalizedOptions.maxOptions,
        autoFirst: false,
        sort: false,
        tabSelect: false,
        filter(text, input) {
            const suggestionValue = text && text.value !== undefined
                ? text.value
                : text;

            if (normalizeAutocompleteInput(input, normalizedOptions) === '') {
                return true;
            }

            return normalizeAutocompleteComparableValue(
                suggestionValue,
                normalizedOptions
            ).startsWith(
                normalizeAutocompleteComparableValue(input, normalizedOptions)
            );
        }
    };
};

export const getAutocompleteCursorPosition = value => {
    return String(value ?? '').length;
};

export const getAutocompleteKeyAction = key => {
    if (key === 'ArrowDown' || key === 'ArrowUp') {
        return {
            action: 'suggestions',
            preventDefault: true,
            stopPropagation: true
        };
    }

    if (key === 'Enter') {
        return {
            action: 'commit',
            preventDefault: true
        };
    }

    if (key === 'Tab') {
        return {
            action: 'commit',
            preventDefault: false
        };
    }

    if (key === 'Escape') {
        return {
            action: 'cancel',
            preventDefault: true,
            stopPropagation: true
        };
    }

    return {
        action: 'native',
        preventDefault: false
    };
};

/**
 * Resolve the value/action used when an autocomplete editor closes.
 *
 * Selected or highlighted suggestions win first. When `commitMatchedValue` is
 * enabled, typed exact/prefix matches resolve to the canonical list value
 * before custom-value and invalid behavior are considered.
 *
 * @param {object} params - Commit params.
 * @param {*} params.selectedValue - Explicitly selected or highlighted value.
 * @param {*} params.typedValue - Current input value.
 * @param {Array<string>} [params.values=[]] - Canonical suggestion list.
 * @param {object} [params.options] - Autocomplete options.
 * @returns {{action: 'success', value: string}|{action: 'cancel'}} Commit result.
 */
export const resolveAutocompleteCommit = ({
    selectedValue,
    typedValue,
    values = [],
    options = {}
}) => {
    const normalizedOptions = normalizeAutocompleteOptions(options);
    const selected = normalizeAutocompleteInput(selectedValue, normalizedOptions);
    const typed = normalizeAutocompleteInput(typedValue, normalizedOptions);

    if (selected !== '') {
        return {
            action: 'success',
            value: selected
        };
    }

    if (typed !== '' && normalizedOptions.commitMatchedValue) {
        const matchedValue = findAutocompleteMatch(values, typed, normalizedOptions);

        if (matchedValue !== null) {
            return {
                action: 'success',
                value: normalizeAutocompleteInput(matchedValue, normalizedOptions)
            };
        }
    }

    if (typed !== '') {
        if (normalizedOptions.allowCustomValue || normalizedOptions.invalidBehavior === 'commitRaw') {
            return {
                action: 'success',
                value: typed
            };
        }

        return { action: 'cancel' };
    }

    if (normalizedOptions.allowEmpty) {
        return {
            action: 'success',
            value: ''
        };
    }

    return normalizedOptions.invalidBehavior === 'commitRaw'
        ? { action: 'success', value: '' }
        : { action: 'cancel' };
};
