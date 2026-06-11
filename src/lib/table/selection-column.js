export const createSelectionColumn = (selectionColumn = {}) => {
    const normalizedOptions = {
        enabled: false,
        mode: 'multiple',
        width: 45,
        ...selectionColumn
    };

    if (!normalizedOptions.enabled) return null;

    const isMultiple = normalizedOptions.mode !== 'single';

    return {
        column: {
            width: normalizedOptions.width,
            hozAlign: 'center',
            headerHozAlign: 'center',
            headerSort: false,
            cssClass: 'amb-selection-column',
            titleFormatter: isMultiple ? 'rowSelection' : () => '',
            titleFormatterParams: isMultiple ? { rowRange: 'active' } : undefined,
            formatter: 'rowSelection'
        },
        selectableRows: isMultiple ? true : 1
    };
};
