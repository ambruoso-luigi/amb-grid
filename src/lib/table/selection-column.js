const CHECKED_KEYS = new Set(['1', 'y', 'Y', 's', 'S']);
const UNCHECKED_KEYS = new Set(['0', 'n', 'N']);

const SELECTION_INPUT_SELECTOR = '.amb-selection-column__input';

const isNativeSelectionCheckboxTarget = target => {
    if (!target || typeof target.closest !== 'function') return false;

    return Boolean(target.closest(SELECTION_INPUT_SELECTOR));
};

const isRowSelected = row => {
    return Boolean(row && typeof row.isSelected === 'function' && row.isSelected());
};

const setRowSelected = (row, selected) => {
    if (!row) return false;

    if (selected) {
        if (typeof row.select !== 'function') return false;

        row.select();
        return true;
    }

    if (typeof row.deselect !== 'function') return false;

    row.deselect();
    return true;
};

const toggleRowSelection = row => {
    if (!row) return false;

    if (typeof row.toggleSelect === 'function') {
        row.toggleSelect();
        return true;
    }

    return setRowSelected(row, !isRowSelected(row));
};

const stopSelectionKey = event => {
    if (!event) return;

    if (typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    if (typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }
};

const syncRowSelectionInput = row => {
    const rowElement = row && typeof row.getElement === 'function'
        ? row.getElement()
        : null;
    const input = rowElement && typeof rowElement.querySelector === 'function'
        ? rowElement.querySelector(SELECTION_INPUT_SELECTOR)
        : null;

    if (!input) return;

    input.checked = isRowSelected(row);
};

const handleSelectionInputKeydown = (event, row) => {
    const key = event && event.key;
    let handled = false;

    if (key === 'Enter') {
        handled = toggleRowSelection(row);
    } else if (key === ' ' && !isNativeSelectionCheckboxTarget(event.target)) {
        handled = toggleRowSelection(row);
    } else if (CHECKED_KEYS.has(key)) {
        handled = setRowSelected(row, true);
    } else if (UNCHECKED_KEYS.has(key)) {
        handled = setRowSelected(row, false);
    }

    if (handled) {
        syncRowSelectionInput(row);
        stopSelectionKey(event);
    }
};

const createSelectionFormatter = () => (cell, _formatterParams, onRendered) => {
    const input = document.createElement('input');
    const row = cell && typeof cell.getRow === 'function' ? cell.getRow() : null;

    input.type = 'checkbox';
    input.className = 'amb-selection-column__input';
    input.checked = isRowSelected(row);
    input.setAttribute('aria-label', 'Select Row');

    input.addEventListener('click', event => {
        event.stopPropagation();
    });
    input.addEventListener('change', () => {
        setRowSelected(row, input.checked);
        syncRowSelectionInput(row);
    });
    input.addEventListener('keydown', event => {
        handleSelectionInputKeydown(event, row);
    });

    if (typeof onRendered === 'function') {
        onRendered(() => {
            syncRowSelectionInput(row);
        });
    }

    return input;
};

const syncSelectionInputs = table => {
    if (!table || typeof table.getRows !== 'function') return;

    table.getRows('visible').forEach(syncRowSelectionInput);
};

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
            formatter: createSelectionFormatter()
        },
        selectableRows: isMultiple ? true : 1,
        bind(table) {
            if (!table || typeof table.on !== 'function') return () => {};

            const sync = () => syncSelectionInputs(table);

            table.on('rowSelectionChanged', sync);
            table.on('dataProcessed', sync);
            table.on('pageLoaded', sync);

            return () => {
                if (typeof table.off !== 'function') return;

                table.off('rowSelectionChanged', sync);
                table.off('dataProcessed', sync);
                table.off('pageLoaded', sync);
            };
        }
    };
};
