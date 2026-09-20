import {
    focusAdjacentOutsideGrid,
    getPageNavigationCoordinator
} from '../table/page-navigation-coordinator.js';
import { getAmbColumnMetadata } from '../table/column-metadata.js';
import {
    getKeyboardNavigationContext,
    matchesKeyboardBinding,
    normalizeKeyboardNavigationOptions
} from '../table/keyboard-bindings.js';

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
    const selector = getAmbColumnMetadata(definition).focusSelector;
    const selectedTarget = selector
        && cellElement
        && typeof cellElement.querySelector === 'function'
        ? cellElement.querySelector(selector)
        : null;
    if (selector && !selectedTarget) return false;
    const focusTarget = selectedTarget || cellElement;

    if (!focusTarget || typeof focusTarget.focus !== 'function') return false;

    focusTarget.focus();
    return true;
};

/**
 * Focuses a cell while suppressing the table engine's focus-to-edit behavior.
 *
 * @param {object} cell - Cell component to focus.
 * @returns {boolean} Whether focus was requested.
 * @private
 * @internal
 */
export const focusCellWithoutEditing = cell => {
    const cellElement = cell?.getElement?.();

    if (!cellElement || typeof cellElement.focus !== 'function') return false;

    // Tabulator does not make every normal readonly cell focusable. Give only
    // those cells a programmatic target, without placing them in browser Tab
    // order or replacing a tabindex already managed by the table/control.
    const hasTabindex = typeof cellElement.hasAttribute === 'function'
        ? cellElement.hasAttribute('tabindex')
        : cellElement.getAttribute?.('tabindex') !== null
            && cellElement.getAttribute?.('tabindex') !== undefined;
    if (!hasTabindex) {
        if (typeof cellElement.setAttribute === 'function') {
            cellElement.setAttribute('tabindex', '-1');
        } else {
            cellElement.tabIndex = -1;
        }
    }

    const blockEditFocus = event => event.stopImmediatePropagation?.();

    cellElement.addEventListener?.('focus', blockEditFocus, true);
    try {
        cellElement.focus({ preventScroll: true });
    } catch {
        cellElement.focus();
    } finally {
        cellElement.removeEventListener?.('focus', blockEditFocus, true);
    }

    return true;
};

const navigationFocusRestoreVersions = new WeakMap();

const getNavigationFocusRestoreOwner = cell => {
    const table = cell?.getTable?.();

    if ((typeof table === 'object' || typeof table === 'function') && table !== null) {
        return table;
    }

    if ((typeof cell === 'object' || typeof cell === 'function') && cell !== null) {
        return cell;
    }

    const element = cell?.getElement?.();
    return (typeof element === 'object' || typeof element === 'function') && element !== null
        ? element
        : null;
};

/**
 * Cancels a pending keyboard-close focus restoration for the source grid when
 * a pointer action expresses a newer focus destination in that same grid.
 *
 * @param {object} cell - Cell component owning the pointer destination.
 * @returns {void}
 * @private
 * @internal
 */
export const cancelScheduledNavigationFocusRestore = cell => {
    const owner = getNavigationFocusRestoreOwner(cell);

    if (!owner) return;

    navigationFocusRestoreVersions.set(owner, (navigationFocusRestoreVersions.get(owner) || 0) + 1);
};

const scheduleNavigationFocusRestore = cell => {
    const owner = getNavigationFocusRestoreOwner(cell);
    const version = owner ? navigationFocusRestoreVersions.get(owner) || 0 : 0;
    const restore = () => {
        if (owner && version !== (navigationFocusRestoreVersions.get(owner) || 0)) return;

        focusCellWithoutEditing(cell);
    };
    if (typeof globalThis.requestAnimationFrame === 'function') {
        globalThis.requestAnimationFrame(restore);
        return;
    }
    Promise.resolve().then(restore);
};

/**
 * Handles the configurable keyboard close actions used by standard inline editors.
 *
 * @private
 * @internal
 */
export const handleEditorCommitCancelKeydown = ({ cell, event, onCommit, onCancel }) => {
    const table = cell?.getTable?.();
    const context = getKeyboardNavigationContext(table);
    const options = context?.keyboardNavigationOptions;
    const enabled = Boolean(context && options?.enabled !== false);
    const bindings = enabled
        ? options?.bindings
        : normalizeKeyboardNavigationOptions().bindings;

    // Sequential navigation owns Tab and Shift+Tab even if a close binding is
    // configured with the same shortcut.
    if (
        matchesKeyboardBinding(event, bindings.next)
        || matchesKeyboardBinding(event, bindings.previous)
    ) return false;

    const action = ['commit', 'cancel'].find(candidate => (
        matchesKeyboardBinding(event, bindings[candidate])
    ));
    if (!action) return false;

    if (enabled && options?.shouldHandle?.({
        action,
        event,
        state: 'editing',
        cell,
        row: cell?.getRow?.(),
        column: cell?.getColumn?.(),
        grid: context.getGrid?.()
    }) === false) return false;

    event.preventDefault?.();
    event.stopPropagation?.();
    event.stopImmediatePropagation?.();
    if (action === 'commit') onCommit();
    else onCancel();
    scheduleNavigationFocusRestore(cell);
    return true;
};

/** Keeps spatial keys inside an editor without cancelling their native behavior. */
export const containEditorSpatialNavigation = event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return false;

    event.stopPropagation?.();
    return true;
};

/** Focuses a spatial keyboard-navigation destination without opening an editor. */
export const focusNavigationCandidate = candidate => {
    const definition = getCellDefinition(candidate);
    if (!definition || !columnIsVisible(candidate?.getColumn?.())) return false;
    const metadata = getAmbColumnMetadata(definition);
    return metadata.interactive ? focusInteractiveCandidate(candidate, definition) : focusCellWithoutEditing(candidate);
};

export const isEditableCandidate = candidate => {
    if (!candidate) return false;

    const column = candidate.getColumn && candidate.getColumn();
    const definition = getCellDefinition(candidate);

    if (!columnIsVisible(column)) return false;
    if (!definition) return false;
    if (definition.editable === false) return false;
    if (typeof definition.editable === 'function') {
        if (definition.editable(candidate) === false) return false;
    }

    const metadata = getAmbColumnMetadata(definition);

    return Boolean(
        metadata.interactive
            ? definition.editor || metadata.focusSelector
            : definition.editor && typeof candidate.edit === 'function'
    );
};

export const navigateToCandidate = candidate => {
    if (!isEditableCandidate(candidate)) return false;

    const definition = getCellDefinition(candidate);

    const metadata = getAmbColumnMetadata(definition);

    if (metadata.keyboardFocusOnly === true) {
        return focusCellWithoutEditing(candidate);
    }

    if (metadata.interactive) {
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
        const coordinator = getPageNavigationCoordinator(table);

        if (canChangePage && coordinator) {
            coordinator.transitionPage({
                direction,
                destination: direction === 'prev' ? 'last' : 'first'
            });
            return;
        }

        const grid = cell?.getElement?.()?.closest?.('.tabulator');

        if (!focusAdjacentOutsideGrid(grid, direction)) {
            globalThis.document?.activeElement?.blur?.();
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
