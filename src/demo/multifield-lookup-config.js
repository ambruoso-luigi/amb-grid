export const MUNICIPALITY_LOOKUP_COLUMNS = [
    { field: 'municipalityName', title: 'Municipality', visible: true },
    { field: 'province', title: 'Province', visible: true, width: 110 },
    { field: 'region', title: 'Region', visible: true },
    { field: 'postalCode', title: 'Postal Code', visible: true, width: 160 },
    { field: 'istatCode', title: 'ISTAT Code', visible: false },
    { field: 'cadastralCode', title: 'Cadastral Code', visible: false }
];

export const MUNICIPALITY_MAP_TO_ROW = {
    istatCode: 'istatCode',
    cadastralCode: 'cadastralCode',
    municipality: 'municipalityName',
    province: 'province',
    region: 'region',
    postalCode: 'postalCode'
};

export const createMunicipalityPatch = selected => {
    return Object.fromEntries(
        Object.entries(MUNICIPALITY_MAP_TO_ROW).map(([rowField, recordField]) => {
            return [rowField, selected[recordField]];
        })
    );
};

export const applyMunicipalitySelection = ({ selected, rowData, crud }) => {
    if (!selected || !rowData || !crud) return false;
    if (rowData[crud.options.stateField] === 'deleted') return false;

    const id = rowData[crud.options.idField];
    const identifier = id !== null && id !== undefined && id !== ''
        ? id
        : rowData[crud.options.tempIdField];

    if (identifier === null || identifier === undefined || identifier === '') {
        return false;
    }

    return Boolean(
        crud.updateRowFields(identifier, createMunicipalityPatch(selected))
    );
};
