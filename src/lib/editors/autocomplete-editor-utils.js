export const normalizeAutocompleteOptions = (options = {}) => {
    const normalizedOptions = {
        allowEmpty: true,
        allowCustomValue: false,
        invalidBehavior: 'commitRaw',
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

export const normalizeAutocompleteItem = (item, valueField = 'value', labelField = 'label') => {
    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
        const value = String(item);

        return {
            [valueField]: value,
            [labelField]: value
        };
    }

    return item;
};

export const normalizeAutocompleteItems = (items, valueField = 'value', labelField = 'label') => {
    if (!Array.isArray(items)) return [];

    return items
        .map(item => normalizeAutocompleteItem(item, valueField, labelField))
        .filter(item => item && typeof item === 'object');
};

export const filterAutocompleteItems = (
    items,
    query,
    maxOptions,
    valueField = 'value',
    labelField = 'label'
) => {
    const normalizedQuery = String(query || '').trim().toLowerCase();
    const normalizedItems = normalizeAutocompleteItems(items, valueField, labelField);
    const matches = normalizedQuery === ''
        ? normalizedItems
        : normalizedItems.filter(item => {
            const value = String(item[valueField] ?? '').toLowerCase();
            const label = String(item[labelField] ?? '').toLowerCase();

            return value.includes(normalizedQuery) || label.includes(normalizedQuery);
        });

    return matches.slice(0, maxOptions);
};

export const resolveAutocompleteCommit = ({
    selectedValue,
    typedValue,
    options = {}
}) => {
    const normalizedOptions = normalizeAutocompleteOptions(options);
    const selected = selectedValue === null || selectedValue === undefined
        ? ''
        : String(selectedValue);
    const typed = typedValue === null || typedValue === undefined
        ? ''
        : String(typedValue);

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
