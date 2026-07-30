export const LOOKUP_METADATA_FIELD = '_ambLookup';

const createEmptyMetadata = () => ({
    initial: null,
    current: null
});

export const ensureLookupMetadata = (rowData, field) => {
    if (!rowData || !field) return createEmptyMetadata();

    if (!rowData[LOOKUP_METADATA_FIELD]) {
        rowData[LOOKUP_METADATA_FIELD] = {};
    }

    if (!rowData[LOOKUP_METADATA_FIELD][field]) {
        rowData[LOOKUP_METADATA_FIELD][field] = createEmptyMetadata();
    }

    return rowData[LOOKUP_METADATA_FIELD][field];
};

export const getLookupMetadata = (rowData, field) => {
    if (!rowData || !field || !rowData[LOOKUP_METADATA_FIELD]) return null;

    return rowData[LOOKUP_METADATA_FIELD][field] || null;
};

export const removeLookupMetadata = (rowData, field) => {
    const allMetadata = rowData && rowData[LOOKUP_METADATA_FIELD];

    if (!allMetadata || !field) return false;
    if (!Object.prototype.hasOwnProperty.call(allMetadata, field)) return false;

    delete allMetadata[field];

    if (Object.keys(allMetadata).length === 0) {
        delete rowData[LOOKUP_METADATA_FIELD];
    }

    return true;
};

export const setLookupMetadata = (rowData, field, value, description, options = {}) => {
    const metadata = ensureLookupMetadata(rowData, field);
    const entry = {
        value: value === null || value === undefined ? '' : String(value),
        description: description === null || description === undefined ? '' : String(description)
    };

    if (!metadata.initial || options.setInitial === true) {
        metadata.initial = { ...entry };
    }

    metadata.current = { ...entry };

    return metadata;
};

export const rollbackLookupMetadata = rowData => {
    const allMetadata = rowData && rowData[LOOKUP_METADATA_FIELD];

    if (!allMetadata) return null;

    Object.keys(allMetadata).forEach(field => {
        const metadata = allMetadata[field];

        if (!metadata || !metadata.initial) return;

        metadata.current = { ...metadata.initial };
    });

    return allMetadata;
};
