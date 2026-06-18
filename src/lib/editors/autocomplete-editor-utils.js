export const normalizeAutocompleteOptions = (options = {}) => {
    const normalizedOptions = {
        allowEmpty: true,
        allowCustomValue: false,
        invalidBehavior: 'commitRaw',
        trimInput: true,
        maxOptions: 10,
        dropdownWidth: 420,
        ...options
    };
    const maxOptions = Number(normalizedOptions.maxOptions);

    normalizedOptions.maxOptions = Number.isFinite(maxOptions) && maxOptions > 0
        ? Math.floor(maxOptions)
        : 10;

    return normalizedOptions;
};

export const normalizeAutocompleteInput = (value, options = {}) => {
    const normalizedOptions = normalizeAutocompleteOptions(options);
    const stringValue = value === null || value === undefined
        ? ''
        : String(value);

    return normalizedOptions.trimInput ? stringValue.trim() : stringValue;
};

export const getAutocompleteSuggestionValues = values => {
    if (!Array.isArray(values)) return [];

    return values
        .filter(value => value !== null && value !== undefined)
        .map(value => String(value));
};

export const getAwesompleteOptions = (values, options = {}) => {
    const normalizedOptions = normalizeAutocompleteOptions(options);

    return {
        list: getAutocompleteSuggestionValues(values),
        minChars: 0,
        maxItems: normalizedOptions.maxOptions,
        autoFirst: false,
        sort: false,
        tabSelect: false
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

export const resolveAutocompleteCommit = ({
    selectedValue,
    typedValue,
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
