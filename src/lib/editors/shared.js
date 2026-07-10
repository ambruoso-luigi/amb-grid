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

const navigateToCandidate = candidate => {
    if (!candidate) return false;

    const column = candidate.getColumn && candidate.getColumn();
    const definition = getCellDefinition(candidate);

    if (!columnIsVisible(column)) return false;
    if (!definition) return false;
    if (definition.editable === false) return false;
    if (typeof definition.editable === 'function') {
        if (definition.editable(candidate) === false) return false;
    }

    if (definition && definition._ambInteractive) {
        if (definition.editor && typeof candidate.edit === 'function') {
            return candidate.edit() !== false;
        }

        return focusInteractiveCandidate(candidate, definition);
    }

    if (!definition || !definition.editor || typeof candidate.edit !== 'function') {
        return false;
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

        if (direction === 'prev' && cell && typeof cell.navigatePrev === 'function') {
            cell.navigatePrev();
            return;
        }

        if (direction === 'next' && cell && typeof cell.navigateNext === 'function') {
            cell.navigateNext();
            return;
        }

        const table = cell && cell.getTable && cell.getTable();

        if (direction === 'prev' && table && typeof table.navigatePrev === 'function') {
            table.navigatePrev();
            return;
        }

        if (direction === 'next' && table && typeof table.navigateNext === 'function') {
            table.navigateNext();
        }
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
