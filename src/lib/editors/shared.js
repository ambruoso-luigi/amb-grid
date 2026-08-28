export const getInitialValue = cell => {
    const value = cell.getValue();

    if (value === null || value === undefined) return '';

    return String(value);
};

const columnIsVisible = column => {
    if (column && typeof column.isVisible === 'function') {
        return column.isVisible() !== false;
    }

    const definition = column
        && typeof column.getDefinition === 'function'
        ? column.getDefinition()
        : null;

    return !definition || definition.visible !== false;
};

const getCellDefinition = cell => {
    const column = cell && cell.getColumn && cell.getColumn();

    return column && typeof column.getDefinition === 'function'
        ? column.getDefinition()
        : null;
};

const focusInteractiveCandidate = (candidate, definition) => {
    const cellElement = candidate
        && typeof candidate.getElement === 'function'
        ? candidate.getElement()
        : null;
    const selector = definition && (
        definition._ambFocusSelector
        || definition._ambInteractiveSelector
    );
    const selectedTarget = selector
        && cellElement
        && typeof cellElement.querySelector === 'function'
        ? cellElement.querySelector(selector)
        : null;
    const focusTarget = selectedTarget || cellElement;

    if (!focusTarget || typeof focusTarget.focus !== 'function') return false;

    focusTarget.focus();
    return true;
};

const isEditableCandidate = candidate => {
    if (!candidate) return false;

    const column = candidate.getColumn && candidate.getColumn();
    const definition = getCellDefinition(candidate);

    if (!columnIsVisible(column)) return false;
    if (!definition) return false;
    if (definition.editable === false) return false;
    if (typeof definition.editable === 'function') {
        if (definition.editable(candidate) === false) return false;
    }

    return Boolean(
        definition._ambInteractive
            ? definition.editor || definition._ambFocusSelector || definition._ambInteractiveSelector
            : definition.editor && typeof candidate.edit === 'function'
    );
};

export const navigateToCandidate = candidate => {
    if (!isEditableCandidate(candidate)) return false;

    const definition = getCellDefinition(candidate);

    if (definition._ambInteractive) {
        if (definition.editor && typeof candidate.edit === 'function') {
            return candidate.edit() !== false;
        }

        return focusInteractiveCandidate(candidate, definition);
    }

    return candidate.edit() !== false;
};

export const navigateEditableCellAfterClose = (cell, direction = 'next') => {
    globalThis.setTimeout(() => {
        const row = cell && cell.getRow && cell.getRow();
        const cells = row && typeof row.getCells === 'function'
            ? row.getCells()
            : [];
        const currentIndex = cells.indexOf(cell);
        const step = direction === 'prev' ? -1 : 1;

        if (currentIndex !== -1) {
            for (
                let index = currentIndex + step;
                index >= 0 && index < cells.length;
                index += step
            ) {
                const candidate = cells[index];

                if (navigateToCandidate(candidate)) return;
            }
        }

        const navigate = direction === 'prev' ? cell?.navigatePrev : cell?.navigateNext;

        if (typeof navigate === 'function' && navigate.call(cell)) return;

        const table = cell && cell.getTable && cell.getTable();
        const tableNavigate = direction === 'prev'
            ? table?.navigatePrev
            : table?.navigateNext;

        if (typeof tableNavigate === 'function' && tableNavigate.call(table)) return;

        const currentPage = table && typeof table.getPage === 'function'
            ? table.getPage()
            : false;
        const pageMax = table && typeof table.getPageMax === 'function'
            ? table.getPageMax()
            : false;
        const canChangePage = direction === 'prev'
            ? currentPage > 1
            : currentPage < pageMax;

        const openPageDestination = () => {
            const rows = table.getRows('visible') || [];
            const orderedRows = direction === 'prev' ? rows.slice().reverse() : rows;

            for (const destinationRow of orderedRows) {
                const cells = destinationRow?.getCells?.() || [];
                const orderedCells = direction === 'prev' ? cells.slice().reverse() : cells;

                for (const destinationCell of orderedCells) {
                    if (navigateToCandidate(destinationCell)) return true;
                }
            }

            return false;
        };

        if (canChangePage) {
            const change = direction === 'prev'
                ? table.previousPage?.()
                : table.nextPage?.();

            Promise.resolve(change).then(() => {
                if (table.getPage() !== currentPage) openPageDestination();
            });
            return;
        }

        const grid = cell?.getElement?.()?.closest?.('.tabulator');
        const documentElement = globalThis.document;
        const focusableSelector = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(',');
        const focusableElements = grid && documentElement?.querySelectorAll
            ? Array.from(documentElement.querySelectorAll(focusableSelector))
                .filter(element => !grid.contains(element))
            : [];
        const gridPosition = element => {
            if (!grid || typeof grid.compareDocumentPosition !== 'function') return false;

            const position = direction === 'prev'
                ? globalThis.Node?.DOCUMENT_POSITION_PRECEDING || 2
                : globalThis.Node?.DOCUMENT_POSITION_FOLLOWING || 4;
            return Boolean(grid.compareDocumentPosition(element) & position);
        };
        const outsideElements = focusableElements.filter(gridPosition);
        const target = direction === 'prev'
            ? outsideElements[outsideElements.length - 1]
            : outsideElements[0];

        if (target && typeof target.focus === 'function') {
            target.focus();
            return;
        }

        globalThis.document?.activeElement?.blur?.();

    }, 0);
};

export const focusInput = (input, onRendered, options = {}) => {
    onRendered(() => {
        const cursorPosition = input.value.length;

        input.focus();

        if (options.selectOnFocus === true) {
            input.select();
            return;
        }

        input.setSelectionRange(cursorPosition, cursorPosition);
    });
};

export const createSelectOption = ({ value, label }) => {
    const option = document.createElement('option');

    option.value = value;
    option.textContent = label;

    return option;
};

export const normalizeSelectOption = (option, options) => {
    if (typeof option === 'string') {
        return {
            value: option,
            label: option
        };
    }

    const value = option && option[options.valueField];
    const label = option && option[options.labelField];

    return {
        value: value === null || value === undefined ? '' : String(value),
        label: label === null || label === undefined ? String(value ?? '') : String(label)
    };
};

export const getLookupOptionValue = (item, valueField) => {
    const value = item && item[valueField];

    return value === null || value === undefined ? '' : String(value);
};

export const createLookupOption = (value, label, valueField, labelField) => {
    return {
        [valueField]: value,
        [labelField]: label
    };
};

export const toCssSize = value => {
    if (typeof value === 'number') return `${value}px`;
    if (value === null || value === undefined || value === '') return '';

    return String(value);
};
