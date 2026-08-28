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

export const createPaginationKeyboardRuntime = ({
    tableElement,
    table,
    paginationMethods,
    enabled
}) => {
    if (!tableElement || !enabled) return { destroy() {} };

    let transitionInProgress = false;
    let activeFinalizer = null;
    let destroyed = false;

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

    const activateRenderedCandidate = async (destination, allowRenderRecovery) => {
        for (const row of getRenderedRows(destination)) {
            const cells = row.getCells();
            const candidates = destination === 'last' ? cells.slice().reverse() : cells;

            for (const candidate of candidates) {
                const result = navigateToCandidate(candidate);
                const activeImmediately = isCandidateActuallyActive(candidate);
                if (!result) continue;

                await Promise.resolve();
                await nextFrame();
                await nextFrame();

                if (isCandidateActuallyActive(candidate)) return true;
                if (activeImmediately && allowRenderRecovery) {
                    // A partial final page can realign its virtual rows after
                    // the first edit. Reacquire the replaced component once.
                    return activateRenderedCandidate(destination, false);
                }
            }
        }

        return false;
    };

    const activateDestination = async destination => {
        const destinationRow = destination === 'last'
            ? getLastPageRow() || getRenderedRows(destination)[0]
            : getRenderedRows(destination)[0];
        const tableHolder = tableElement.querySelector?.('.tabulator-tableholder');

        if (typeof destinationRow?.scrollTo === 'function') {
            const scrollBefore = tableHolder?.scrollTop;
            let resolveScrollRender;
            const scrollRender = new Promise(resolve => { resolveScrollRender = resolve; });
            const handleScrollRender = () => resolveScrollRender();

            table.on?.('renderComplete', handleScrollRender);

            try {
                await destinationRow.scrollTo(destination === 'last' ? 'bottom' : 'top', true);

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

    const closeActiveEditor = () => {
        const activeElement = globalThis.document?.activeElement;
        const editingElement = tableElement.querySelector?.('.tabulator-editing');

        if (
            activeElement
            && tableElement.contains?.(activeElement)
            && (activeElement.closest?.('.tabulator-editing') || editingElement)
            && typeof activeElement.blur === 'function'
        ) {
            activeElement.blur();
        }

        return !tableElement.querySelector?.('.tabulator-editing');
    };

    const transitionPage = ({ direction, destination }) => {
        const pageBefore = paginationMethods.getPage();
        const pageMax = paginationMethods.getPageMax();
        const canChangePage = direction === 'prev'
            ? pageBefore > 1
            : pageBefore < pageMax;

        if (!canChangePage || transitionInProgress || destroyed) {
            return Promise.resolve(false);
        }

        if (!closeActiveEditor()) return Promise.resolve(false);

        transitionInProgress = true;
        let pagePromiseResolved = false;
        let renderCompletedForNewPage = false;
        let activationStarted = false;
        let settled = false;
        let resolveTransition;

        const transition = new Promise(resolve => { resolveTransition = resolve; });
        const finalize = result => {
            if (settled) return;

            settled = true;
            table.off?.('renderComplete', handleRenderComplete);
            transitionInProgress = false;
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

        return transition;
    };

    const unregisterCoordinator = registerPageNavigationCoordinator(table, { transitionPage });

    const handleKeydown = event => {
        const isInsideTable = event.target === tableElement
            || tableElement.contains?.(event.target);
        const previous = matchesShortcut(event, GRID_SHORTCUTS.previousPage);
        const next = matchesShortcut(event, GRID_SHORTCUTS.nextPage);
        const isTab = event.key === 'Tab'
            && !event.altKey
            && !event.ctrlKey
            && !event.metaKey;

        if (!isInsideTable || (!previous && !next && !isTab)) return;

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

            if (closeActiveEditor()) {
                const grid = editingElement?.closest?.('.tabulator') || tableElement;
                if (!focusAdjacentOutsideGrid(grid, direction)) {
                    globalThis.document?.activeElement?.blur?.();
                }
            }
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
        destroy() {
            destroyed = true;
            activeFinalizer?.();
            unregisterCoordinator();
            if (listenerAttached) tableElement.removeEventListener('keydown', handleKeydown, true);
            table.off?.('renderComplete', decoratePager);
        }
    };
};
