import { isEditableCandidate, navigateToCandidate } from '../editors/shared.js';
import { GRID_SHORTCUTS, matchesShortcut } from './keyboard-shortcuts.js';
import {
    focusAdjacentOutsideGrid,
    registerPageNavigationCoordinator
} from './page-navigation-coordinator.js';

const nextFrame = () => new Promise(resolve => {
    if (typeof globalThis.requestAnimationFrame === 'function') {
        globalThis.requestAnimationFrame(() => resolve());
        return;
    }

    Promise.resolve().then(resolve);
});

const isCandidateActuallyActive = candidate => {
    const element = candidate?.getElement?.();
    const activeElement = globalThis.document?.activeElement;
    const definition = candidate?.getColumn?.()?.getDefinition?.() || {};

    if (!element) return false;

    if (definition._ambInteractive && !definition.editor) {
        return activeElement === element || Boolean(element.contains?.(activeElement));
    }

    return Boolean(
        element.classList?.contains('tabulator-editing')
        && activeElement
        && activeElement !== globalThis.document?.body
        && (
            activeElement === element
            || element.contains?.(activeElement)
            || !activeElement.closest?.('.tabulator')
        )
    );
};

/**
 * Coordinates global keyboard navigation for a paginated grid.
 *
 * Page transitions wait for both the page Promise and the new-page render,
 * stabilize virtual rows, activate the requested destination, and release all
 * temporary listeners through one idempotent finalizer. `direction` is
 * `next`/`prev`; `destination` is `first`/`last` or an object containing an
 * `edge` and an exact column `field` for vertical navigation.
 *
 * @param {object} context - Runtime dependencies.
 * @param {HTMLElement} context.tableElement - Grid root element.
 * @param {object} context.table - Runtime table component.
 * @param {object} context.paginationMethods - Public pagination methods.
 * @param {boolean} context.enabled - Whether pagination navigation is active.
 * @returns {{transitionPage: Function, destroy: Function}} Runtime lifecycle.
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
    let verticalNavigationInProgress = false;
    let activeFinalizer = null;
    let destroyed = false;
    const pendingEditorCloseFinalizers = new Set();

    const normalizeDestination = destination => (
        typeof destination === 'string'
            ? { edge: destination, field: null }
            : { edge: destination?.edge || 'first', field: destination?.field || null }
    );

    const getRenderedRows = destination => {
        const rowElements = Array.from(
            tableElement.querySelectorAll?.('.tabulator-row') || []
        );
        const orderedRows = destination === 'last'
            ? rowElements.reverse()
            : rowElements;

        return orderedRows
            .map(rowElement => table.getRow?.(rowElement))
            .filter(row => row && typeof row.getCells === 'function');
    };

    const getLastPageRow = () => {
        if (typeof table.getRows !== 'function') return null;

        const rows = table.getRows('active') || [];
        const pageSize = paginationMethods.getPageSize?.();
        const page = paginationMethods.getPage();

        if (!Number.isInteger(pageSize) || pageSize <= 0 || rows.length <= pageSize) {
            return rows[rows.length - 1] || null;
        }

        const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
        return pageRows[pageRows.length - 1] || null;
    };

    const getDestinationCandidates = destination => {
        const { edge, field } = normalizeDestination(destination);
        const rows = getRenderedRows(edge);

        if (field) {
            const row = rows[0];
            const candidate = row?.getCell?.(field)
                || row?.getCells?.().find(cell => cell.getField?.() === field);
            return candidate ? [candidate] : [];
        }

        return rows.flatMap(row => {
            const cells = row.getCells();
            return edge === 'last' ? cells.slice().reverse() : cells;
        });
    };

    const activateCandidate = async candidate => {
        const result = navigateToCandidate(candidate);
        const activeImmediately = isCandidateActuallyActive(candidate);
        if (!result) return { active: false, activeImmediately };

        await Promise.resolve();
        await nextFrame();
        await nextFrame();

        return {
            active: isCandidateActuallyActive(candidate),
            activeImmediately
        };
    };

    const activateRenderedCandidate = async (destination, allowRenderRecovery) => {
        for (const candidate of getDestinationCandidates(destination)) {
            const { active, activeImmediately } = await activateCandidate(candidate);

            if (active) return true;
            if (activeImmediately && allowRenderRecovery) {
                // A partial final page can realign its virtual rows after
                // the first edit. Reacquire the replaced component once.
                return activateRenderedCandidate(destination, false);
            }
        }

        return false;
    };

    const activateDestination = async destination => {
        const { edge } = normalizeDestination(destination);
        const destinationRow = edge === 'last'
            ? getLastPageRow() || getRenderedRows(edge)[0]
            : getRenderedRows(edge)[0];
        const tableHolder = tableElement.querySelector?.('.tabulator-tableholder');

        if (typeof destinationRow?.scrollTo === 'function') {
            const scrollBefore = tableHolder?.scrollTop;
            let resolveScrollRender;
            const scrollRender = new Promise(resolve => { resolveScrollRender = resolve; });
            const handleScrollRender = () => resolveScrollRender();

            table.on?.('renderComplete', handleScrollRender);

            try {
                await destinationRow.scrollTo(edge === 'last' ? 'bottom' : 'top', true);

                if (tableHolder && tableHolder.scrollTop !== scrollBefore) {
                    await scrollRender;
                }
            } finally {
                table.off?.('renderComplete', handleScrollRender);
            }
        }

        await nextFrame();
        return activateRenderedCandidate(destination, true);
    };

    const getCurrentPageRows = () => {
        if (typeof table.getRows !== 'function') return getRenderedRows('first');

        const rows = table.getRows('active') || [];
        const pageSize = paginationMethods.getPageSize?.();
        const page = paginationMethods.getPage();

        if (!Number.isInteger(pageSize) || pageSize <= 0 || rows.length <= pageSize) {
            return rows;
        }

        return rows.slice((page - 1) * pageSize, page * pageSize);
    };

    const getEditingCell = editingElement => {
        if (!editingElement) return null;

        return getRenderedRows('first')
            .flatMap(row => row.getCells())
            .find(cell => cell.getElement?.() === editingElement) || null;
    };

    const closeActiveEditorAndWait = currentCell => {
        const activeElement = globalThis.document?.activeElement;
        const editingElement = currentCell?.getElement?.()
            || tableElement.querySelector?.('.tabulator-cell.tabulator-editing');

        if (!editingElement) return Promise.resolve(true);

        const isCurrentCellEditing = () => (
            editingElement.classList?.contains?.('tabulator-editing')
            || tableElement.querySelector?.('.tabulator-cell.tabulator-editing') === editingElement
        );
        const canBlurActiveEditor = Boolean(
            activeElement
            && tableElement.contains?.(activeElement)
            && (activeElement.closest?.('.tabulator-editing') || editingElement)
            && typeof activeElement.blur === 'function'
            && typeof table.on === 'function'
            && typeof table.off === 'function'
        );

        if (!isCurrentCellEditing()) return Promise.resolve(true);
        if (!canBlurActiveEditor) return Promise.resolve(false);

        return new Promise(resolve => {
            let settled = false;
            const cleanup = () => {
                table.off?.('cellEdited', handleEditFinished);
                table.off?.('cellEditCancelled', handleEditFinished);
                pendingEditorCloseFinalizers.delete(abort);
            };
            const finalize = result => {
                if (settled) return;

                settled = true;
                cleanup();
                resolve(result);
            };
            const isCurrentCell = eventCell => (
                eventCell === currentCell
                || eventCell?.getElement?.() === editingElement
            );
            function handleEditFinished(eventCell) {
                if (!isCurrentCell(eventCell)) return;

                finalize(!isCurrentCellEditing());
            }
            const abort = () => finalize(false);

            pendingEditorCloseFinalizers.add(abort);

            try {
                table.on('cellEdited', handleEditFinished);
                table.on('cellEditCancelled', handleEditFinished);
                activeElement.blur();
            } catch {
                finalize(false);
                return;
            }

            if (!isCurrentCellEditing()) finalize(true);
        });
    };

    /**
     * Changes one local page and activates a destination after rendering.
     * The transition is serialized and owns all temporary render listeners.
     *
     * @param {object} request - Page transition request.
     * @param {'next'|'prev'} request.direction - Adjacent page direction.
     * @param {'first'|'last'|{edge: 'first'|'last', field: string}} request.destination
     * Destination edge, optionally constrained to an exact field.
     * @returns {Promise<boolean>} Whether the destination became active.
     * @private
     * @internal
     */
    const transitionPage = ({ direction, destination }) => {
        const pageBefore = paginationMethods.getPage();
        const pageMax = paginationMethods.getPageMax();
        const canChangePage = direction === 'prev'
            ? pageBefore > 1
            : pageBefore < pageMax;

        if (!canChangePage || transitionInProgress || destroyed) {
            return Promise.resolve(false);
        }

        transitionInProgress = true;
        const editingElement = tableElement.querySelector?.('.tabulator-cell.tabulator-editing');
        const currentCell = getEditingCell(editingElement);
        const transition = (editingElement
            ? closeActiveEditorAndWait(currentCell).then(closed => (
                closed && !destroyed ? changePageAndActivate() : false
            ))
            : changePageAndActivate()
        ).finally(() => {
            transitionInProgress = false;
        });

        return transition;

        function changePageAndActivate() {
            let pagePromiseResolved = false;
            let renderCompletedForNewPage = false;
            let activationStarted = false;
            let settled = false;
            let resolveTransition;

            const pageTransition = new Promise(resolve => { resolveTransition = resolve; });
            const finalize = result => {
                if (settled) return;

                settled = true;
                table.off?.('renderComplete', handleRenderComplete);
                activeFinalizer = null;
                resolveTransition(result);
            };
            const tryActivate = () => {
                if (
                    settled
                    || activationStarted
                    || !pagePromiseResolved
                    || !renderCompletedForNewPage
                ) return;

                if (paginationMethods.getPage() === pageBefore) {
                    finalize(false);
                    return;
                }

                activationStarted = true;
                activateDestination(destination).then(finalize, () => finalize(false));
            };
            function handleRenderComplete() {
                if (paginationMethods.getPage() === pageBefore) return;

                renderCompletedForNewPage = true;
                tryActivate();
            }

            activeFinalizer = () => finalize(false);
            table.on?.('renderComplete', handleRenderComplete);

            let change;

            try {
                change = direction === 'prev'
                    ? paginationMethods.previousPage()
                    : paginationMethods.nextPage();
            } catch (error) {
                finalize(false);
                throw error;
            }

            Promise.resolve(change).then(() => {
                pagePromiseResolved = true;

                if (paginationMethods.getPage() === pageBefore) {
                    finalize(false);
                    return;
                }

                tryActivate();
            }, () => finalize(false));

            return pageTransition;
        }
    };

    const unregisterCoordinator = registerPageNavigationCoordinator(table, { transitionPage });

    const handleVerticalNavigation = direction => {
        const editingElement = tableElement.querySelector?.('.tabulator-cell.tabulator-editing');
        const currentCell = getEditingCell(editingElement);

        if (!currentCell) return false;

        const field = currentCell.getField?.();
        const currentRow = currentCell.getRow?.();
        const pageRows = getCurrentPageRows();
        const rowIndex = pageRows.indexOf(currentRow);

        if (!field || rowIndex === -1) return false;
        if (verticalNavigationInProgress) return true;

        const step = direction === 'prev' ? -1 : 1;
        const targetRow = pageRows[rowIndex + step];

        if (targetRow) {
            const targetCell = targetRow.getCell?.(field)
                || targetRow.getCells?.().find(cell => cell.getField?.() === field);

            if (!isEditableCandidate(targetCell)) return true;
            verticalNavigationInProgress = true;
            void closeActiveEditorAndWait(currentCell)
                .then(async closed => {
                    if (!closed || destroyed) return;

                    await activateCandidate(targetCell);
                })
                .finally(() => { verticalNavigationInProgress = false; });
            return true;
        }

        const page = paginationMethods.getPage();
        const pageMax = paginationMethods.getPageMax();
        const canChangePage = direction === 'prev' ? page > 1 : page < pageMax;

        if (canChangePage) {
            transitionPage({
                direction,
                destination: {
                    edge: direction === 'prev' ? 'last' : 'first',
                    field
                }
            });
        }

        return true;
    };

    const handleKeydown = event => {
        const isInsideTable = event.target === tableElement
            || tableElement.contains?.(event.target);
        const previous = matchesShortcut(event, GRID_SHORTCUTS.previousPage);
        const next = matchesShortcut(event, GRID_SHORTCUTS.nextPage);
        const verticalUp = matchesShortcut(event, GRID_SHORTCUTS.previousRow);
        const verticalDown = matchesShortcut(event, GRID_SHORTCUTS.nextRow);
        const isTab = event.key === 'Tab'
            && !event.altKey
            && !event.ctrlKey
            && !event.metaKey;

        if (!isInsideTable || (!previous && !next && !verticalUp && !verticalDown && !isTab)) return;

        if (verticalUp || verticalDown) {
            const handled = handleVerticalNavigation(verticalUp ? 'prev' : 'next');

            if (!handled) return;

            event.preventDefault();
            event.stopPropagation?.();
            event.stopImmediatePropagation?.();
            return;
        }

        if (isTab) {
            const editingElement = tableElement.querySelector?.('.tabulator-cell.tabulator-editing');
            const candidates = getRenderedRows('first')
                .flatMap(row => row.getCells())
                .filter(isEditableCandidate);
            const currentIndex = candidates.findIndex(candidate => candidate.getElement?.() === editingElement);
            const direction = event.shiftKey ? 'prev' : 'next';
            const atPageBoundary = direction === 'prev'
                ? currentIndex === 0
                : currentIndex === candidates.length - 1;

            if (currentIndex === -1 || !atPageBoundary) return;

            event.preventDefault();
            event.stopPropagation?.();
            event.stopImmediatePropagation?.();

            const page = paginationMethods.getPage();
            const pageMax = paginationMethods.getPageMax();
            const canChangePage = direction === 'prev' ? page > 1 : page < pageMax;

            if (canChangePage) {
                transitionPage({
                    direction,
                    destination: direction === 'prev' ? 'last' : 'first'
                });
                return;
            }

            void closeActiveEditorAndWait(getEditingCell(editingElement)).then(closed => {
                if (!closed || destroyed) return;

                const grid = editingElement?.closest?.('.tabulator') || tableElement;
                if (!focusAdjacentOutsideGrid(grid, direction)) {
                    globalThis.document?.activeElement?.blur?.();
                }
            });
            return;
        }

        event.preventDefault();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
        transitionPage({
            direction: previous ? 'prev' : 'next',
            destination: 'first'
        });
    };

    const decoratePager = () => {
        const previous = tableElement.querySelector?.('.tabulator-page[data-page="prev"]');
        const next = tableElement.querySelector?.('.tabulator-page[data-page="next"]');

        if (previous) {
            previous.title = `Previous page (${GRID_SHORTCUTS.previousPage.label})`;
            previous.setAttribute('aria-keyshortcuts', GRID_SHORTCUTS.previousPage.label);
        }

        if (next) {
            next.title = `Next page (${GRID_SHORTCUTS.nextPage.label})`;
            next.setAttribute('aria-keyshortcuts', GRID_SHORTCUTS.nextPage.label);
        }
    };

    const listenerAttached = typeof tableElement.addEventListener === 'function';

    if (listenerAttached) tableElement.addEventListener('keydown', handleKeydown, true);
    table.on?.('renderComplete', decoratePager);
    decoratePager();

    return {
        transitionPage,
        /**
         * Releases permanent and in-flight listeners owned by this runtime.
         *
         * @returns {void}
         * @private
         * @internal
         */
        destroy() {
            destroyed = true;
            for (const finalize of [...pendingEditorCloseFinalizers]) finalize();
            activeFinalizer?.();
            unregisterCoordinator();
            if (listenerAttached) tableElement.removeEventListener('keydown', handleKeydown, true);
            table.off?.('renderComplete', decoratePager);
        }
    };
};
