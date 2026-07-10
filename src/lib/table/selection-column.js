import { navigateEditableCellAfterClose } from '../editors/shared.js';

const CHECKED_KEYS = new Set(['1', 'y', 'Y', 's', 'S']);
const UNCHECKED_KEYS = new Set(['0', 'n', 'N']);

const SELECTION_INPUT_SELECTOR = '.amb-selection-column__input';

const isRowSelected = row => {
    return Boolean(row && typeof row.isSelected === 'function' && row.isSelected());
};

const clearTableSelection = row => {
    const table = row && typeof row.getTable === 'function'
        ? row.getTable()
        : null;

    if (table && typeof table.deselectRow === 'function') {
        table.deselectRow();
    }
};

const setRowSelected = (row, selected, isMultiple = true) => {
    if (!row) return false;

    if (selected) {
        if (typeof row.select !== 'function') return false;

        if (!isMultiple) {
            clearTableSelection(row);
        }

        row.select();
        return true;
    }

    if (typeof row.deselect !== 'function') return false;

    row.deselect();
    return true;
};

const toggleRowSelection = (row, isMultiple = true) => {
    if (!row) return false;

    if (typeof row.toggleSelect === 'function') {
        if (!isMultiple && !isRowSelected(row)) {
            clearTableSelection(row);
        }

        row.toggleSelect();
        return true;
    }

    return setRowSelected(row, !isRowSelected(row), isMultiple);
};

const stopSelectionKey = event => {
    if (!event) return;

    if (typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    if (typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }

    if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
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

const handleSelectionInputKeydown = (event, row, cell, isMultiple, closeEditor) => {
    const key = event && event.key;
    let handled = false;

    if (key === 'Tab') {
        stopSelectionKey(event);
        if (typeof closeEditor === 'function') {
            closeEditor();
        }
        navigateEditableCellAfterClose(cell, event.shiftKey ? 'prev' : 'next');
        return;
    }

    if (key === 'Enter') {
        handled = toggleRowSelection(row, isMultiple);
    } else if (key === ' ') {
        handled = toggleRowSelection(row, isMultiple);
    } else if (CHECKED_KEYS.has(key)) {
        handled = setRowSelected(row, true, isMultiple);
    } else if (UNCHECKED_KEYS.has(key)) {
        handled = setRowSelected(row, false, isMultiple);
    }

    if (handled) {
        syncRowSelectionInput(row);
        stopSelectionKey(event);
    }
};

const createSelectionInput = (cell, isMultiple, closeEditor) => {
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
        setRowSelected(row, input.checked, isMultiple);
        syncRowSelectionInput(row);
    });
    input.addEventListener('keydown', event => {
        handleSelectionInputKeydown(event, row, cell, isMultiple, closeEditor);
    });

    return input;
};

const createSelectionFormatter = isMultiple => (cell, _formatterParams, onRendered) => {
    const input = createSelectionInput(cell, isMultiple);
    const row = cell && typeof cell.getRow === 'function' ? cell.getRow() : null;

    if (typeof onRendered === 'function') {
        onRendered(() => {
            syncRowSelectionInput(row);
        });
    }

    return input;
};

const createSelectionEditor = isMultiple => (cell, onRendered, _success, cancel) => {
    let closed = false;
    const closeEditor = () => {
        if (closed) return;

        closed = true;
        cancel();
    };
    const input = createSelectionInput(cell, isMultiple, closeEditor);

    onRendered(() => {
        input.focus();
    });

    input.addEventListener('blur', closeEditor);

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
            _ambInteractive: true,
            _ambFocusSelector: SELECTION_INPUT_SELECTOR,
            editor: createSelectionEditor(isMultiple),
            titleFormatter: isMultiple ? 'rowSelection' : () => '',
            titleFormatterParams: isMultiple ? { rowRange: 'active' } : undefined,
            formatter: createSelectionFormatter(isMultiple)
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
