import {
    focusCellWithoutEditing,
    focusNavigationCandidate,
    isEditableCandidate,
    navigateToCandidate
} from '../editors/shared.js';
import { GRID_SHORTCUTS, matchesShortcut } from './keyboard-shortcuts.js';
import {
    matchesKeyboardBinding,
    normalizeKeyboardNavigationOptions,
    registerKeyboardNavigationContext
} from './keyboard-bindings.js';
import { getAmbColumnMetadata } from './column-metadata.js';
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

const isDataRowElement = element => {
    if (!element?.classList?.contains?.('tabulator-row')) return false;

    return !element.classList.contains('tabulator-calcs')
        && !element.classList.contains('amb-calc-row');
};

const isCandidateActuallyActive = candidate => {
    const element = candidate?.getElement?.();
    const activeElement = globalThis.document?.activeElement;
    const definition = candidate?.getColumn?.()?.getDefinition?.() || {};

    if (!element) return false;

    const metadata = getAmbColumnMetadata(definition);

    if (metadata.keyboardFocusOnly === true) {
        return activeElement === element || Boolean(element.contains?.(activeElement));
    }

    if (metadata.interactive && !definition.editor) {
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
 * Coordinates all AMB Grid keyboard navigation for a paginated grid.
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
export const createKeyboardNavigationRuntime = ({
    tableElement,
    table,
    paginationMethods,
    enabled,
    keyboardNavigation,
    getGrid = () => null
}) => {
    const paginationEnabled = enabled === true;
    const navigationOptions = keyboardNavigation || normalizeKeyboardNavigationOptions();
    const navigationEnabled = navigationOptions.enabled !== false;
    const unregisterKeyboardContext = registerKeyboardNavigationContext(table, {
        keyboardNavigationOptions: navigationOptions,
        getGrid
    });

    if (!tableElement) {
        return { destroy: unregisterKeyboardContext };
    }

    let transitionInProgress = false;
    let activeFinalizer = null;
    let destroyed = false;
    const pendingEditorCloseFinalizers = new Set();
    const pendingRenderWaitFinalizers = new Set();

    const normalizeDestination = destination => (
        typeof destination === 'string'
            ? { edge: destination, field: null }
            : { edge: destination?.edge || 'first', field: destination?.field || null }
    );

    const getRenderedRows = destination => {
        const rowElements = Array.from(
            tableElement.querySelectorAll?.('.tabulator-row') || []
        );
        const dataRowElements = rowElements.filter(isDataRowElement);
        const orderedRows = destination === 'last'
            ? dataRowElements.reverse()
            : dataRowElements;

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

            pendingRenderWaitFinalizers.add(handleScrollRender);

            try {
                table.on?.('renderComplete', handleScrollRender);
                await destinationRow.scrollTo(edge === 'last' ? 'bottom' : 'top', true);

                if (tableHolder && tableHolder.scrollTop !== scrollBefore) {
                    await scrollRender;
                }
            } finally {
                pendingRenderWaitFinalizers.delete(handleScrollRender);
                table.off?.('renderComplete', handleScrollRender);
            }
        }

        if (destroyed) return false;

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

    const isNavigationCandidate = candidate => {
        const element = candidate?.getElement?.();
        const rowElement = element?.closest?.('.tabulator-row');
        const definition = candidate?.getColumn?.()?.getDefinition?.() || {};
        const metadata = getAmbColumnMetadata(definition);
        if (!element || !isDataRowElement(rowElement)) return false;
        if (candidate?.getColumn?.()?.isVisible?.() === false || definition.visible === false) return false;
        if (metadata.interactive) {
            if (metadata.focusSelector) {
                return Boolean(element.querySelector?.(metadata.focusSelector));
            }
            return Boolean(definition.editor);
        }
        return true;
    };

    const isValidNavigationCell = candidate => {
        if (!isNavigationCandidate(candidate)) return false;
        return candidate?.getElement?.()?.closest?.('.tabulator') === tableElement;
    };

    const getEditingCell = editingElement => {
        if (!editingElement) return null;

        return getRenderedRows('first')
            .flatMap(row => row.getCells())
            .find(cell => cell.getElement?.() === editingElement) || null;
    };

    const getCellFromElement = cellElement => {
        const rowElement = cellElement?.closest?.('.tabulator-row');
        const field = cellElement?.getAttribute?.('tabulator-field');
        const row = isDataRowElement(rowElement)
            ? table.getRow?.(rowElement)
            : null;

        if (!row) return null;
        return row.getCells?.().find(cell => cell.getElement?.() === cellElement)
            || (field
                ? row.getCell?.(field) || row.getCells?.().find(cell => cell.getField?.() === field)
                : null)
            || null;
    };

    const getActiveNavigationCell = () => {
        const editingElement = tableElement.querySelector?.('.tabulator-cell.tabulator-editing');

        if (editingElement) return getEditingCell(editingElement);

        const activeElement = globalThis.document?.activeElement;
        const cellElement = activeElement?.closest?.('.tabulator-cell');

        return getCellFromElement(cellElement);
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

        if (!paginationEnabled || !canChangePage || transitionInProgress || destroyed) {
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

    const getSpatialDestination = (currentCell, direction) => {
        const row = currentCell?.getRow?.();
        const cells = row?.getCells?.() || [];
        const cellIndex = cells.indexOf(currentCell);
        if (cellIndex === -1) return null;
        if (direction === 'left' || direction === 'right') {
            const step = direction === 'left' ? -1 : 1;
            for (let index = cellIndex + step; index >= 0 && index < cells.length; index += step) {
                if (isNavigationCandidate(cells[index])) return cells[index];
            }
            return null;
        }
        const pageRows = getCurrentPageRows();
        const rowIndex = pageRows.indexOf(row);
        const targetRow = pageRows[rowIndex + (direction === 'up' ? -1 : 1)];
        if (!targetRow) return null;
        const column = currentCell.getColumn?.();
        const sameColumn = targetRow.getCells?.().find(cell => cell.getColumn?.() === column);
        if (sameColumn) return sameColumn;
        const field = currentCell.getField?.();
        return field
            ? targetRow.getCell?.(field) || targetRow.getCells?.().find(cell => cell.getField?.() === field) || null
            : null;
    };

    const navigateSpatially = (currentCell, direction) => {
        if (!currentCell || destroyed) return false;
        const context = {
            direction,
            cell: currentCell,
            row: currentCell.getRow?.(),
            column: currentCell.getColumn?.(),
            grid: getGrid()
        };
        let destination = navigationOptions.resolveNavigation?.(context);
        if (!isValidNavigationCell(destination)) destination = getSpatialDestination(currentCell, direction);
        if (!isNavigationCandidate(destination)) return true;
        focusNavigationCandidate(destination);
        return true;
    };

    const unregisterCoordinator = registerPageNavigationCoordinator(table, { transitionPage });

    const isManagedControlTarget = (event, cell, definition) => {
        const selector = getAmbColumnMetadata(definition).focusSelector;
        if (!selector) return false;
        const target = event.target;
        return Boolean(target?.matches?.(selector) || target?.closest?.(selector));
    };

    const handleKeydown = event => {
        const isInsideTable = event.target === tableElement
            || tableElement.contains?.(event.target);
        const previous = matchesShortcut(event, GRID_SHORTCUTS.previousPage);
        const next = matchesShortcut(event, GRID_SHORTCUTS.nextPage);
        const configuredAction = navigationEnabled
            ? ['up', 'down', 'left', 'right', 'edit', 'next', 'previous'].find(candidate => (
                matchesKeyboardBinding(event, navigationOptions.bindings[candidate])
            ))
            : null;
        const legacySequentialAction = !navigationEnabled
            ? ['next', 'previous'].find(candidate => (
                matchesKeyboardBinding(event, normalizeKeyboardNavigationOptions().bindings[candidate])
            ))
            : null;
        const action = configuredAction || legacySequentialAction;
        const isTab = action === 'next' || action === 'previous';

        const activeCell = getActiveNavigationCell();
        const activeDefinition = activeCell?.getColumn?.()?.getDefinition?.() || {};
        const focusOnly = getAmbColumnMetadata(activeDefinition).keyboardFocusOnly === true;
        const enter = action === 'edit';

        if (!isInsideTable || (!previous && !next && !action)) return;

        const editingElement = tableElement.querySelector?.('.tabulator-cell.tabulator-editing');
        const state = editingElement ? 'editing' : 'navigation';
        if (state === 'editing' && (
            enter
            || ['up', 'down', 'left', 'right', 'commit', 'cancel'].includes(action)
        )) return;
        if (enter && isManagedControlTarget(event, activeCell, activeDefinition)) return;

        if (configuredAction) {
            const hookContext = {
                action,
                event,
                state,
                cell: activeCell,
                row: activeCell?.getRow?.(),
                column: activeCell?.getColumn?.(),
                grid: getGrid()
            };
            if (navigationOptions.shouldHandle?.(hookContext) === false) return;
        }

        if (enter) {
            if (!activeCell || !isEditableCandidate(activeCell)) return;
            event.preventDefault();
            event.stopPropagation?.();
            event.stopImmediatePropagation?.();
            activeCell.edit?.();
            return;
        }

        if (['up', 'down', 'left', 'right'].includes(action)) {
            const handled = navigateSpatially(activeCell, action);

            if (!handled) return;

            event.preventDefault();
            event.stopPropagation?.();
            event.stopImmediatePropagation?.();
            return;
        }

        if (isTab) {
            const candidates = getRenderedRows('first')
                .flatMap(row => row.getCells())
                .filter(isEditableCandidate);
            const currentIndex = candidates.findIndex(candidate => (
                candidate === activeCell
                || candidate.getElement?.() === editingElement
                || candidate.getElement?.() === activeCell?.getElement?.()
            ));
            const direction = action === 'previous' ? 'prev' : 'next';
            const atPageBoundary = direction === 'prev'
                ? currentIndex === 0
                : currentIndex === candidates.length - 1;
            const targetCandidate = candidates[currentIndex + (direction === 'prev' ? -1 : 1)];
            const targetFocusOnly = getAmbColumnMetadata(
                targetCandidate?.getColumn?.()?.getDefinition?.()
            ).keyboardFocusOnly === true;

            if (currentIndex === -1) return;
            if ((focusOnly || targetFocusOnly) && !atPageBoundary) {
                event.preventDefault();
                event.stopPropagation?.();
                event.stopImmediatePropagation?.();
                navigateToCandidate(targetCandidate);
                return;
            }
            if (!atPageBoundary) return;

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

    const handleFocusOnlyPointerActivation = event => {
        const cellElement = event.target?.closest?.('.tabulator-cell');
        const cell = getCellFromElement(cellElement);
        const definition = cell?.getColumn?.()?.getDefinition?.() || {};
        const isMarkedLargeText = cellElement?.classList?.contains?.('amb-cell--large-text');

        if (getAmbColumnMetadata(definition).keyboardFocusOnly !== true && !isMarkedLargeText) return;

        event.preventDefault?.();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
        if (event.type === 'click') {
            // Complete focus after the pointer sequence. Preventing mousedown
            // keeps Tabulator from opening the editor, but browsers may still
            // reset focus while completing the click's default processing.
            void nextFrame().then(nextFrame).then(() => {
                if (destroyed) return;

                const currentElement = cell?.getElement?.() || cellElement;
                focusCellWithoutEditing({ getElement: () => currentElement });
            });
            return;
        }

        if (!navigateToCandidate(cell) && isMarkedLargeText) {
            // A pointer event can arrive while Tabulator is replacing a virtual
            // row and getRow(element) briefly has no component. The pipeline's
            // marker is enough to preserve focus-first behavior on that element.
            focusCellWithoutEditing({ getElement: () => cellElement });
        }
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

    if (listenerAttached) {
        tableElement.addEventListener('keydown', handleKeydown, true);
        tableElement.addEventListener('mousedown', handleFocusOnlyPointerActivation, true);
        tableElement.addEventListener('click', handleFocusOnlyPointerActivation, true);
    }
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
            for (const finalize of [...pendingRenderWaitFinalizers]) finalize();
            activeFinalizer?.();
            unregisterCoordinator();
            unregisterKeyboardContext();
            if (listenerAttached) {
                tableElement.removeEventListener('keydown', handleKeydown, true);
                tableElement.removeEventListener('mousedown', handleFocusOnlyPointerActivation, true);
                tableElement.removeEventListener('click', handleFocusOnlyPointerActivation, true);
            }
            table.off?.('renderComplete', decoratePager);
        }
    };
};
