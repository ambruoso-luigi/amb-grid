import {
    cancelScheduledNavigationFocusRestore,
    focusCellWithoutEditing,
    focusNavigationCandidate,
    isEditableCandidate,
    isNavigationCandidate,
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
import { invokeCellAuxiliaryAction, queueCellAuxiliaryAction } from './keyboard-auxiliary.js';
import { ROW_STATE } from '../crud-helper.js';

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

const isCandidateActuallyActive = (candidate, focusOnly = false) => {
    const element = candidate?.getElement?.();
    const activeElement = globalThis.document?.activeElement;
    const definition = candidate?.getColumn?.()?.getDefinition?.() || {};

    if (!element) return false;

    const metadata = getAmbColumnMetadata(definition);

    if (focusOnly || metadata.keyboardFocusOnly === true) {
        return activeElement === element || Boolean(element.contains?.(activeElement));
    }

    if (!definition.editor) {
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
    cellEditing = { mouseTrigger: 'double-click' },
    getGrid = () => null,
    getCrud = () => null
}) => {
    const paginationEnabled = enabled === true;
    const navigationOptions = keyboardNavigation || normalizeKeyboardNavigationOptions();
    const navigationEnabled = navigationOptions.enabled !== false;
    const unregisterKeyboardContext = registerKeyboardNavigationContext(table, {
        keyboardNavigationOptions: navigationOptions,
        getGrid,
        navigateAfterClose: (cell, direction) => moveSequentially(cell, direction, 'editing')
    });

    if (!tableElement) {
        return { destroy: unregisterKeyboardContext };
    }

    let transitionInProgress = false;
    let sequentialInProgress = false;
    let sequentialSource = null;
    let pendingSequentialMove = null;
    let verticalNavigationVersion = 0;
    let pointerNavigationVersion = 0;
    let activeFinalizer = null;
    let destroyed = false;
    const pendingEditorCloseFinalizers = new Set();

    const normalizeDestination = destination => (
        typeof destination === 'string'
            ? { edge: destination, field: null, column: null, activation: 'edit' }
            : {
                edge: destination?.edge || 'first',
                field: destination?.field || null,
                column: destination?.column || null,
                activation: destination?.activation || 'edit'
            }
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

    const isAllowedByRowState = candidate => {
        const element = candidate?.getElement?.();
        const definition = candidate?.getColumn?.()?.getDefinition?.() || {};
        const metadata = getAmbColumnMetadata(definition);
        const data = candidate?.getRow?.()?.getData?.() || {};
        const stateField = getCrud()?.options?.stateField || '_state';
        return data[stateField] !== ROW_STATE.DELETED || (
            metadata.managedColumn === 'rowAction'
            && Boolean(element?.querySelector?.('.amb-row-action-button[data-action="rollback"]'))
        );
    };

    const isAutomaticPageCandidate = candidate => !getAmbColumnMetadata(
        candidate?.getColumn?.()?.getDefinition?.() || {}
    ).managedColumn;

    const getDestinationCandidates = destination => {
        const { edge, field, column, activation } = normalizeDestination(destination);
        const rows = getRenderedRows(edge);

        if (column || field) {
            for (const row of rows) {
                const candidate = (column && row?.getCells?.().find(cell => cell.getColumn?.() === column))
                    || row?.getCell?.(field)
                    || row?.getCells?.().find(cell => cell.getField?.() === field);
                if (candidate && (activation === 'focus'
                    ? isKeyboardOperationalCandidate(candidate)
                    : isSequentialCandidate(candidate))) return [candidate];
            }
            return [];
        }

        return rows.flatMap(row => {
            const cells = row.getCells();
            return (edge === 'last' ? cells.slice().reverse() : cells)
                .filter(candidate => isAutomaticPageCandidate(candidate) && (activation === 'focus'
                    ? isKeyboardOperationalCandidate(candidate)
                    : isSequentialCandidate(candidate)));
        });
    };

    const activateCandidate = async (candidate, destination) => {
        const focusOnly = normalizeDestination(destination).activation === 'focus';
        const result = focusOnly ? focusNavigationCandidate(candidate) : navigateCandidate(candidate);
        const activeImmediately = isCandidateActuallyActive(candidate, focusOnly);
        if (!result) return { active: false, activeImmediately };

        await Promise.resolve();
        await nextFrame();
        await nextFrame();

        return {
            active: isCandidateActuallyActive(candidate, focusOnly),
            activeImmediately
        };
    };

    const activateRenderedCandidate = async (destination, allowRenderRecovery) => {
        for (const candidate of getDestinationCandidates(destination)) {
            const { active, activeImmediately } = await activateCandidate(candidate, destination);

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

        if (typeof destinationRow?.scrollTo === 'function') {
            await destinationRow.scrollTo(edge === 'last' ? 'bottom' : 'top', true);
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

    const isKeyboardOperationalCandidate = candidate => {
        const element = candidate?.getElement?.();
        const rowElement = element?.closest?.('.tabulator-row');
        const definition = candidate?.getColumn?.()?.getDefinition?.() || {};
        if (!element || !isDataRowElement(rowElement)) return false;
        if (!isAllowedByRowState(candidate)) return false;
        if (candidate?.getColumn?.()?.isVisible?.() === false || definition.visible === false) return false;
        if (getAmbColumnMetadata(definition).managedColumn) return isEditableCandidate(candidate);
        return navigationEnabled ? isNavigationCandidate(candidate) : isEditableCandidate(candidate);
    };

    const isSequentialCandidate = candidate => {
        return isKeyboardOperationalCandidate(candidate)
            && (!navigationEnabled || Boolean(candidate?.getColumn?.()?.getDefinition?.().editor))
            && isEditableCandidate(candidate);
    };

    const navigateCandidate = candidate => {
        return isEditableCandidate(candidate)
            ? navigateToCandidate(candidate)
            : isKeyboardOperationalCandidate(candidate) && focusNavigationCandidate(candidate);
    };

    const isLogicalVerticalCandidate = candidate => {
        const definition = candidate?.getColumn?.()?.getDefinition?.() || {};
        const metadata = getAmbColumnMetadata(definition);
        if (metadata.interactive || metadata.activateOnNavigationFocus) return false;
        if (!candidate?.getRow?.() || (!candidate?.getField?.() && !candidate?.getColumn?.())) return false;
        if (!isAllowedByRowState(candidate)) return false;
        if (candidate?.getColumn?.()?.isVisible?.() === false || definition.visible === false) return false;
        return isKeyboardOperationalCandidate(candidate);
    };

    const isCurrentGridCandidate = candidate => {
        const element = candidate?.getElement?.();
        const owner = element?.closest?.('.tabulator');
        return Boolean(
            element
            && element.isConnected !== false
            && tableElement.contains?.(element)
            && (!owner || owner === tableElement)
            && isKeyboardOperationalCandidate(candidate)
        );
    };

    const isValidNavigationCell = candidate => {
        if (!isKeyboardOperationalCandidate(candidate)) return false;
        return candidate?.getElement?.()?.closest?.('.tabulator') === tableElement;
    };

    const getEditingCell = editingElement => {
        if (!editingElement) return null;

        return getRenderedRows('first')
            .flatMap(row => row.getCells())
            .find(cell => cell.getElement?.() === editingElement) || null;
    };

    const getCellFromElement = cellElement => {
        if (!cellElement) return null;

        // The internal table engine exposes row components from `getRows()`,
        // but does not accept a row DOM node in `getRow()`. Resolve pointer
        // targets against those components first so a normal click can enter
        // AMB navigation state.
        const activeRows = table.getRows?.('active') || table.getRows?.() || [];
        const activeCell = activeRows
            .flatMap(row => row?.getCells?.() || [])
            .find(cell => cell.getElement?.() === cellElement);
        if (activeCell) return activeCell;

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
                table.off?.('validationFailed', handleValidationFailed);
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
            function handleValidationFailed(eventCell) {
                if (isCurrentCell(eventCell)) finalize(false);
            }
            const abort = () => finalize(false);

            pendingEditorCloseFinalizers.add(abort);

            try {
                table.on('cellEdited', handleEditFinished);
                table.on('cellEditCancelled', handleEditFinished);
                table.on('validationFailed', handleValidationFailed);
                activeElement.blur();
            } catch {
                finalize(false);
                return;
            }

            if (!isCurrentCellEditing()) finalize(true);
        });
    };

    // The source mode is captured before closing an editor. Specialized editors
    // call this same path after completing their own (possibly async) commit.
    const resumeSequentialMove = () => {
        if (destroyed || sequentialInProgress || transitionInProgress || !pendingSequentialMove) return;
        const pending = pendingSequentialMove;
        pendingSequentialMove = null;
        if (pending.version !== pointerNavigationVersion) return;
        void moveSequentially(pending.source, pending.direction, pending.mode);
    };

    const moveSequentially = async (source, direction, mode) => {
        if (destroyed) return;
        if (sequentialInProgress || transitionInProgress) {
            // Ignore repeats from the closing source. A key on the newly
            // focused destination waits for the current render finalizer.
            if (source !== sequentialSource && !(sequentialSource
                && source?.getRow?.() === sequentialSource.getRow?.()
                && source?.getField?.() === sequentialSource.getField?.())) {
                pendingSequentialMove = { source, direction, mode, version: pointerNavigationVersion };
            }
            return;
        }
        sequentialInProgress = true;
        sequentialSource = source;
        cancelScheduledNavigationFocusRestore(source);
        try {
            await performSequentialMove(source, direction, mode);
        } finally {
            sequentialInProgress = false;
            sequentialSource = null;
            resumeSequentialMove();
        }
    };

    const performSequentialMove = async (source, direction, mode) => {
        if (destroyed || transitionInProgress) return;
        const sourceRow = source?.getRow?.();
        const sourceField = source?.getField?.();
        const sourceColumn = source?.getColumn?.();
        if (mode === 'editing' && !await closeActiveEditorAndWait(source)) return;
        if (destroyed) return;

        const cells = getCurrentPageRows().flatMap(row => row.getCells());
        const origin = cells.findIndex(cell => cell === source || (
            cell.getRow?.() === sourceRow
            && (sourceField ? cell.getField?.() === sourceField : cell.getColumn?.() === sourceColumn)
        ));
        if (origin === -1) return;
        const step = direction === 'prev' ? -1 : 1;
        const canVisit = mode === 'navigation' ? isKeyboardOperationalCandidate : isSequentialCandidate;
        for (let index = origin + step; index >= 0 && index < cells.length; index += step) {
            let candidate = cells[index];
            if (!isAutomaticPageCandidate(candidate) || !canVisit(candidate)) continue;
            const row = candidate.getRow?.();
            const field = candidate.getField?.();
            if (row !== sourceRow && typeof row?.scrollTo === 'function') {
                await row.scrollTo('nearest', false);
                await nextFrame();
                if (destroyed) return;
                candidate = row.getCell?.(field) || candidate;
                if (!canVisit(candidate)) continue;
            }
            if (candidate.getElement?.()?.isConnected === false) continue;
            const activated = mode === 'navigation'
                ? focusNavigationCandidate(candidate) : navigateToCandidate(candidate);
            if (activated) return;
        }

        const pageMax = paginationMethods.getPageMax();
        while (!destroyed && paginationEnabled && (direction === 'prev'
            ? paginationMethods.getPage() > 1 : paginationMethods.getPage() < pageMax)) {
            const pageBefore = paginationMethods.getPage();
            const activated = await transitionPage({ direction, destination: {
                edge: direction === 'prev' ? 'last' : 'first',
                activation: mode === 'navigation' ? 'focus' : 'edit'
            } });
            if (activated || destroyed) return;
            if (paginationMethods.getPage() === pageBefore) break;
        }
        if (destroyed) return;
        if (!focusAdjacentOutsideGrid(tableElement, direction)) {
            globalThis.document?.activeElement?.blur?.();
        }
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
            resumeSequentialMove();
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
                if (isKeyboardOperationalCandidate(cells[index])) return cells[index];
            }
            return null;
        }
        const pageRows = getCurrentPageRows();
        const rowIndex = pageRows.indexOf(row);
        const column = currentCell.getColumn?.();
        const field = currentCell.getField?.();
        const step = direction === 'up' ? -1 : 1;
        for (let index = rowIndex + step; index >= 0 && index < pageRows.length; index += step) {
            const targetRow = pageRows[index];
            const sameColumn = targetRow.getCells?.().find(cell => cell.getColumn?.() === column)
                || (field ? targetRow.getCell?.(field) || targetRow.getCells?.().find(cell => cell.getField?.() === field) : null);
            if (isLogicalVerticalCandidate(sameColumn) || isKeyboardOperationalCandidate(sameColumn)) return sameColumn;
        }
        return null;
    };

    const focusVerticalDestination = destination => {
        const row = destination?.getRow?.();
        const column = destination?.getColumn?.();
        const field = destination?.getField?.();
        const version = ++verticalNavigationVersion;

        if (!row || (!column && !field)) return;

        Promise.resolve(row.scrollTo?.('nearest', false))
            .catch(() => undefined)
            .then(nextFrame)
            .then(() => {
                if (destroyed || version !== verticalNavigationVersion) return;

                const reacquired = row.getCell?.(field)
                    || row.getCells?.().find(cell => cell.getColumn?.() === column)
                    || row.getCells?.().find(cell => cell.getField?.() === field);

                if (!isCurrentGridCandidate(reacquired)) return;

                focusCellWithoutEditing(reacquired);
            });
    };

    const navigateSpatially = (currentCell, direction) => {
        if (!currentCell || destroyed) return false;
        if (direction === 'left' || direction === 'right') verticalNavigationVersion += 1;
        const context = {
            direction,
            cell: currentCell,
            row: currentCell.getRow?.(),
            column: currentCell.getColumn?.(),
            grid: getGrid()
        };
        let destination = navigationOptions.resolveNavigation?.(context);
        const customDestination = isValidNavigationCell(destination);
        if (!customDestination) destination = getSpatialDestination(currentCell, direction);
        const verticalDestination = !customDestination
            && (direction === 'up' || direction === 'down')
            && isLogicalVerticalCandidate(destination);
        if (!(verticalDestination || isKeyboardOperationalCandidate(destination))) {
            if (!customDestination && (direction === 'up' || direction === 'down')) {
                const pageRows = getCurrentPageRows();
                const rowIndex = pageRows.indexOf(currentCell.getRow?.());
                const atEdge = direction === 'up'
                    ? rowIndex === 0
                    : rowIndex === pageRows.length - 1;
                const page = paginationMethods.getPage();
                const pageMax = paginationMethods.getPageMax();
                const canChangePage = direction === 'up' ? page > 1 : page < pageMax;
                if (atEdge && canChangePage) {
                    void transitionPage({
                        direction: direction === 'up' ? 'prev' : 'next',
                        destination: {
                            edge: direction === 'up' ? 'last' : 'first',
                            column: currentCell.getColumn?.(),
                            field: currentCell.getField?.(),
                            activation: 'focus'
                        }
                    });
                }
            }
            return true;
        }
        if (verticalDestination) {
            focusVerticalDestination(destination);
        } else if (getAmbColumnMetadata(destination.getColumn?.().getDefinition?.()).activateOnNavigationFocus
            && isEditableCandidate(destination)) {
            if (destination.edit?.() === false) focusNavigationCandidate(destination);
        } else focusNavigationCandidate(destination);
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
            ? ['up', 'down', 'left', 'right', 'edit', 'auxiliary', 'next', 'previous'].find(candidate => (
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
        const auxiliary = action === 'auxiliary';

        if (!isInsideTable || (!previous && !next && !action)) return;
        pointerNavigationVersion += 1;

        const editingElement = tableElement.querySelector?.('.tabulator-cell.tabulator-editing');
        const state = editingElement ? 'editing' : 'navigation';
        if (state === 'editing') {
            const spatialAction = ['up', 'down', 'left', 'right'].includes(action);

            // Editors own their close keys while they are open. The checkbox is
            // the only editor that opts into spatial navigation while editing;
            // that opt-in applies to arrows only, never Enter.
            if (enter || ['commit', 'cancel'].includes(action)) return;
            if (spatialAction && !getAmbColumnMetadata(activeDefinition).spatialNavigationWhileEditing) {
                return;
            }
        }
        if (auxiliary && (getAmbColumnMetadata(activeDefinition).auxiliaryAction !== true
            || !isEditableCandidate(activeCell))) return;
        if (
            enter
            && (
                isManagedControlTarget(event, activeCell, activeDefinition)
                || getAmbColumnMetadata(activeDefinition).activateOnNavigationFocus
            )
        ) return;

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
            if (!activeCell || !activeDefinition.editor || !isEditableCandidate(activeCell)) return;
            event.preventDefault();
            event.stopPropagation?.();
            event.stopImmediatePropagation?.();
            activeCell.edit?.();
            return;
        }

        if (auxiliary) {
            if (state === 'editing') {
                if (!invokeCellAuxiliaryAction(activeCell, { event })) return;
                event.preventDefault();
                event.stopPropagation?.();
                event.stopImmediatePropagation?.();
                return;
            }
            event.preventDefault();
            event.stopPropagation?.();
            event.stopImmediatePropagation?.();
            if (state === 'navigation') {
                queueCellAuxiliaryAction(activeCell);
                activeCell.edit?.();
            }
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
            if (navigationEnabled) {
                if (!activeCell) return;
                // Lookup, autocomplete, date and checkbox editors own their
                // native Tab commit; their close helper returns here afterwards.
                if (state === 'editing' && event.key === 'Tab'
                    && activeDefinition.editor?._ambCapabilities?.ownsTab) return;
                event.preventDefault();
                event.stopPropagation?.();
                event.stopImmediatePropagation?.();
                void moveSequentially(activeCell, action === 'previous' ? 'prev' : 'next', state);
                return;
            }
            const renderedCells = getRenderedRows('first').flatMap(row => row.getCells());
            const candidates = renderedCells.filter(candidate => (
                isSequentialCandidate(candidate)
                && isAutomaticPageCandidate(candidate)
            ));
            const currentIndex = candidates.findIndex(candidate => (
                candidate === activeCell
                || candidate.getElement?.() === editingElement
                || candidate.getElement?.() === activeCell?.getElement?.()
            ));
            const activeManagedColumn = getAmbColumnMetadata(activeDefinition).managedColumn;
            const direction = action === 'previous' ? 'prev' : 'next';
            const managedOrigin = currentIndex === -1 && (Boolean(activeManagedColumn)
                || isKeyboardOperationalCandidate(activeCell));
            let managedOriginTarget = null;
            if (managedOrigin) {
                const originIndex = renderedCells.findIndex(candidate => (
                    candidate === activeCell || candidate.getElement?.() === activeCell?.getElement?.()
                ));
                if (originIndex === -1) return;
                const automaticCandidates = new Set(candidates);
                const step = direction === 'prev' ? -1 : 1;
                for (let index = originIndex + step; index >= 0 && index < renderedCells.length; index += step) {
                    if (!automaticCandidates.has(renderedCells[index])) continue;
                    managedOriginTarget = renderedCells[index];
                    break;
                }
            }
            const atPageBoundary = managedOrigin || (direction === 'prev'
                ? currentIndex === 0
                : currentIndex === candidates.length - 1);
            const targetCandidate = candidates[currentIndex + (direction === 'prev' ? -1 : 1)];
            const targetFocusOnly = getAmbColumnMetadata(
                targetCandidate?.getColumn?.()?.getDefinition?.()
            ).keyboardFocusOnly === true;

            if (managedOriginTarget) {
                event.preventDefault();
                event.stopPropagation?.();
                event.stopImmediatePropagation?.();
                navigateCandidate(managedOriginTarget);
                return;
            }
            if (currentIndex === -1 && !managedOrigin) return;
            if ((focusOnly || targetFocusOnly || !activeDefinition.editor
                || (targetCandidate && !targetCandidate.getColumn?.()?.getDefinition?.().editor)) && !atPageBoundary) {
                event.preventDefault();
                event.stopPropagation?.();
                event.stopImmediatePropagation?.();
                navigateCandidate(targetCandidate);
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
            destination: {
                edge: 'first',
                activation: 'focus'
            }
        });
    };

    const handlePointerActivation = event => {
        const pointerVersion = ++pointerNavigationVersion;
        const cellElement = event.target?.closest?.('.tabulator-cell');
        const cell = getCellFromElement(cellElement);
        if (cell) cancelScheduledNavigationFocusRestore(cell);
        if (cellElement?.classList?.contains?.('tabulator-editing')) return;
        const definition = cell?.getColumn?.()?.getDefinition?.() || {};
        const metadata = getAmbColumnMetadata(definition);
        const isMarkedLargeText = cellElement?.classList?.contains?.('amb-cell--large-text');

        if (cell && !isAllowedByRowState(cell)) return;
        if (navigationEnabled && !isEditableCandidate(cell) && isKeyboardOperationalCandidate(cell)) {
            const control = event.target?.closest?.(
                'a[href], button, input, select, textarea, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="checkbox"], [tabindex]'
            );
            if (control && control !== cellElement && cellElement.contains?.(control)) return;
            if (event.type === 'click') {
                const row = cell.getRow?.();
                const field = cellElement.getAttribute?.('tabulator-field');
                const column = cell.getColumn?.();
                const restorePointerFocus = async () => {
                    await nextFrame();
                    await nextFrame();
                    for (let attempt = 0; attempt < 2; attempt += 1) {
                        if (destroyed || pointerVersion !== pointerNavigationVersion) return;
                        // Scrolling a grid into view can recreate its cells. Keep
                        // the logical destination, rather than a detached DOM node.
                        const current = row?.getCell?.(field)
                            || row?.getCells?.().find(candidate => candidate.getColumn?.() === column)
                            || cell;
                        const element = current.getElement?.();
                        if (!element || element.isConnected === false || !isKeyboardOperationalCandidate(current)) return;
                        const active = globalThis.document?.activeElement;
                        const holder = tableElement.querySelector?.('.tabulator-tableholder');
                        if (active && active !== globalThis.document?.body && active !== holder
                            && active !== cellElement && !cellElement.contains?.(active)) return;
                        focusCellWithoutEditing(current, { preventScroll: false });
                        await nextFrame();
                        await nextFrame();
                        if (element.isConnected !== false) return;
                    }
                };
                void restorePointerFocus();
            }
            return;
        }

        const focusOnly = metadata.keyboardFocusOnly === true || isMarkedLargeText;

        if (focusOnly) {
            // Let the engine observe the second half of a double click. The
            // first click remains navigation-only; a completed double click
            // keeps the editor as the sole owner of primary activation.
            if (event.type === 'mousedown') {
                if (cell || event.detail > 1) return;

                event.preventDefault?.();
                event.stopPropagation?.();
                event.stopImmediatePropagation?.();
                return;
            }
            if (event.detail > 1) return;

            event.preventDefault?.();
            event.stopPropagation?.();
            event.stopImmediatePropagation?.();
            void nextFrame().then(nextFrame).then(() => {
                if (destroyed) return;

                const currentElement = cell?.getElement?.() || cellElement;
                if (currentElement?.classList?.contains?.('tabulator-editing')) return;

                focusCellWithoutEditing({ getElement: () => currentElement });
            });
            return;
        }

        if (
            cellEditing.mouseTrigger !== 'double-click'
            || !isEditableCandidate(cell)
            || metadata.interactive
            || metadata.focusSelector
            || metadata.activateOnNavigationFocus
        ) return;

        if (event.type === 'mousedown') {
            focusNavigationCandidate(cell);
            return;
        }

        if (event.type !== 'click') return;
        // Keep the engine's pointer sequence intact so its native double-click
        // trigger remains the single owner of editor creation.
        if (event.detail > 1) return;
        void nextFrame().then(nextFrame).then(() => {
            if (destroyed) return;
            if (cell?.getElement?.()?.classList?.contains?.('tabulator-editing')) return;
            const cellElement = cell?.getElement?.();
            const activeElement = globalThis.document?.activeElement;
            if (activeElement && activeElement !== cellElement && !cellElement?.contains?.(activeElement)) return;

            focusNavigationCandidate(cell);
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

    if (listenerAttached) {
        tableElement.addEventListener('keydown', handleKeydown, true);
        tableElement.addEventListener('mousedown', handlePointerActivation, true);
        tableElement.addEventListener('click', handlePointerActivation, true);
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
            pendingSequentialMove = null;
            for (const finalize of [...pendingEditorCloseFinalizers]) finalize();
            activeFinalizer?.();
            unregisterCoordinator();
            unregisterKeyboardContext();
            if (listenerAttached) {
                tableElement.removeEventListener('keydown', handleKeydown, true);
                tableElement.removeEventListener('mousedown', handlePointerActivation, true);
                tableElement.removeEventListener('click', handlePointerActivation, true);
            }
            table.off?.('renderComplete', decoratePager);
        }
    };
};
