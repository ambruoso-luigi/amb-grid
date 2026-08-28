import {
    isEditableCandidate,
    navigateToCandidate
} from '../editors/shared.js';

/**
 * Adds keyboard shortcuts to a table's pagination controls and connects the
 * normal editor navigation to the adjacent local pagination page.
 *
 * @param {object} context - Runtime dependencies.
 * @param {HTMLElement|null} context.tableElement - AMB table root element.
 * @param {object} context.table - Internal table event source.
 * @param {object} context.paginationMethods - Public pagination method path.
 * @param {boolean} context.enabled - Whether pagination is enabled.
 * @returns {{destroy: Function}} Owned runtime lifecycle.
 * @private
 * @internal
 */
export const createPaginationKeyboardRuntime = ({
    tableElement,
    table,
    paginationMethods,
    enabled
}) => {
    if (!tableElement || !enabled) return { destroy() {} };

    let transitionInProgress = false;

    const getVisibleRows = () => (
        typeof table.getRows === 'function'
            ? table.getRows('visible') || []
            : []
    );

    const getVisibleCells = () => getVisibleRows().flatMap(row => (
        typeof row?.getCells === 'function' ? row.getCells() : []
    ));

    const getEditingCell = () => {
        const editingElement = tableElement.querySelector?.(
            '.tabulator-cell.tabulator-editing'
        );

        if (!editingElement) return null;

        return getVisibleCells().find(cell => (
            typeof cell?.getElement === 'function'
            && cell.getElement() === editingElement
        )) || null;
    };

    const hasEditableCandidateInDirection = (cell, direction) => {
        const rows = getVisibleRows();
        const row = cell?.getRow?.();
        const rowIndex = rows.indexOf(row);
        const cells = row?.getCells?.() || [];
        const cellIndex = cells.indexOf(cell);

        if (rowIndex === -1 || cellIndex === -1) return false;

        if (direction === 'next') {
            for (let index = cellIndex + 1; index < cells.length; index += 1) {
                if (isEditableCandidate(cells[index])) return true;
            }

            for (let index = rowIndex + 1; index < rows.length; index += 1) {
                if (rows[index].getCells?.().some(isEditableCandidate)) return true;
            }
        } else {
            for (let index = cellIndex - 1; index >= 0; index -= 1) {
                if (isEditableCandidate(cells[index])) return true;
            }

            for (let index = rowIndex - 1; index >= 0; index -= 1) {
                if (rows[index].getCells?.().some(isEditableCandidate)) return true;
            }
        }

        return false;
    };

    const openPageDestination = direction => {
        const rows = getVisibleRows();
        const orderedRows = direction === 'prev' ? rows.slice().reverse() : rows;

        for (const row of orderedRows) {
            const cells = typeof row?.getCells === 'function'
                ? row.getCells()
                : [];
            const orderedCells = direction === 'prev' ? cells.slice().reverse() : cells;

            for (const cell of orderedCells) {
                if (navigateToCandidate(cell)) return true;
            }
        }

        return false;
    };

    const closeActiveEditor = () => {
        const activeElement = globalThis.document?.activeElement;
        const editingElement = tableElement.querySelector?.('.tabulator-editing');

        if (
            activeElement
            && typeof tableElement.contains === 'function'
            && tableElement.contains(activeElement)
            && (
                activeElement.closest?.('.tabulator-editing')
                || editingElement
            )
            && typeof activeElement.blur === 'function'
        ) {
            activeElement.blur();
        }

        return !tableElement.querySelector?.('.tabulator-editing');
    };

    const startPageTransition = (event, destination) => {
        const pageBefore = paginationMethods.getPage();
        const pageMax = paginationMethods.getPageMax();
        const pageDirection = event.key === 'PageUp' || destination === 'prev'
            ? 'prev'
            : 'next';

        if (
            (pageDirection === 'prev' && pageBefore <= 1)
            || (pageDirection === 'next' && pageBefore >= pageMax)
            || transitionInProgress
        ) return;

        if (!closeActiveEditor()) return;

        transitionInProgress = true;
        let transitionFinished = false;
        let pageActivationDone = false;
        let pageLoadedListener;

        const finishTransition = () => {
            if (transitionFinished) return;

            transitionFinished = true;
            table?.off?.('pageLoaded', pageLoadedListener);
            transitionInProgress = false;
        };

        const activatePage = () => {
            if (pageActivationDone) return false;

            pageActivationDone = true;
            return openPageDestination(destination || pageDirection);
        };

        pageLoadedListener = () => {
            try {
                if (paginationMethods.getPage() !== pageBefore) {
                    activatePage();
                }
            } catch {
                // The transition must still be released when an editor
                // cannot be activated after the page has rendered.
            } finally {
                finishTransition();
            }
        };

        table?.on?.('pageLoaded', pageLoadedListener);

        let change;

        try {
            change = pageDirection === 'prev'
                ? paginationMethods.previousPage()
                : paginationMethods.nextPage();
        } catch (error) {
            finishTransition();
            throw error;
        }

        Promise.resolve(change).then(() => {
            if (transitionFinished) return;

            if (paginationMethods.getPage() !== pageBefore) {
                try {
                    activatePage();
                } catch {
                    // The transition must still be released when an editor
                    // cannot be activated after the page has rendered.
                } finally {
                    finishTransition();
                }
                return;
            }

            finishTransition();
        }, finishTransition);
    };

    const handleKeydown = event => {
        const isInsideTable = event.target === tableElement
            || (typeof tableElement.contains === 'function' && tableElement.contains(event.target));

        if (!isInsideTable) return;

        const isPageShortcut = event.altKey
            && (event.key === 'PageUp' || event.key === 'PageDown');
        const isTabBoundary = event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey;

        if (!isPageShortcut && !isTabBoundary) return;

        if (isPageShortcut) {
            event.preventDefault();
            event.stopPropagation?.();
            event.stopImmediatePropagation?.();
            startPageTransition(event, 'first');
            return;
        }

        const editingCell = getEditingCell();
        const direction = event.shiftKey ? 'prev' : 'next';

        if (!editingCell || hasEditableCandidateInDirection(editingCell, direction)) return;

        const page = paginationMethods.getPage();
        const pageMax = paginationMethods.getPageMax();
        const canChangePage = direction === 'prev' ? page > 1 : page < pageMax;

        if (!canChangePage) return;

        event.preventDefault();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
        startPageTransition(
            { ...event, key: direction === 'prev' ? 'PageUp' : 'PageDown' },
            direction
        );
    };

    const decoratePager = () => {
        if (typeof tableElement.querySelector !== 'function') return;

        const previous = tableElement.querySelector('.tabulator-page[data-page="prev"]');
        const next = tableElement.querySelector('.tabulator-page[data-page="next"]');

        if (previous) {
            previous.title = 'Previous page (Alt+PageUp)';
            previous.setAttribute('aria-keyshortcuts', 'Alt+PageUp');
        }

        if (next) {
            next.title = 'Next page (Alt+PageDown)';
            next.setAttribute('aria-keyshortcuts', 'Alt+PageDown');
        }
    };

    const listenerAttached = typeof tableElement.addEventListener === 'function';

    if (listenerAttached) tableElement.addEventListener('keydown', handleKeydown, true);
    table?.on?.('renderComplete', decoratePager);
    decoratePager();

    return {
        destroy() {
            if (listenerAttached) tableElement.removeEventListener('keydown', handleKeydown, true);
            table?.off?.('renderComplete', decoratePager);
        }
    };
};
