import { navigateToCandidate } from '../editors/shared.js';

export const createPaginationKeyboardRuntime = ({
    tableElement,
    table,
    paginationMethods,
    enabled
}) => {
    if (!tableElement || !enabled) return { destroy() {} };

    let transitionInProgress = false;

    const openFirstRenderedEditableCell = () => {
        const rowElements = Array.from(
            tableElement.querySelectorAll?.('.tabulator-row') || []
        );

        for (const rowElement of rowElements) {
            const row = typeof table.getRow === 'function'
                ? table.getRow(rowElement)
                : null;

            if (!row || typeof row.getCells !== 'function') continue;

            for (const cell of row.getCells()) {
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

    const startPageTransition = event => {
        const pageBefore = paginationMethods.getPage();
        const pageMax = paginationMethods.getPageMax();
        const pageDirection = event.key === 'PageUp' ? 'prev' : 'next';

        if (
            (pageDirection === 'prev' && pageBefore <= 1)
            || (pageDirection === 'next' && pageBefore >= pageMax)
            || transitionInProgress
        ) return;

        if (!closeActiveEditor()) return;

        transitionInProgress = true;
        let change;

        try {
            change = pageDirection === 'prev'
                ? paginationMethods.previousPage()
                : paginationMethods.nextPage();
        } catch (error) {
            transitionInProgress = false;
            throw error;
        }

        Promise.resolve(change)
            .then(() => {
                if (paginationMethods.getPage() !== pageBefore) {
                    try {
                        openFirstRenderedEditableCell();
                    } catch {
                        // A failed editor activation must not lock pagination.
                    }
                }
            })
            .finally(() => {
                transitionInProgress = false;
            });
    };

    const handleKeydown = event => {
        const isInsideTable = event.target === tableElement
            || (typeof tableElement.contains === 'function' && tableElement.contains(event.target));
        const isPageShortcut = event.altKey
            && (event.key === 'PageUp' || event.key === 'PageDown');

        if (!isInsideTable || !isPageShortcut) return;

        event.preventDefault();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
        startPageTransition(event);
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
