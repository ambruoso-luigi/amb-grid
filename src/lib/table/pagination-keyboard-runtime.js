import { navigateToCandidate } from '../editors/shared.js';

/**
 * Adds keyboard shortcuts to a table's pagination controls.
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
    if (!tableElement || !enabled) {
        return { destroy() {} };
    }

    let transitionInProgress = false;

    const handleKeydown = event => {
        const isInsideTable = event.target === tableElement
            || (typeof tableElement.contains === 'function' && tableElement.contains(event.target));

        if (
            !isInsideTable
            || !event.altKey
            || (event.key !== 'PageUp' && event.key !== 'PageDown')
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();

        const pageBefore = paginationMethods.getPage();
        const pageMax = paginationMethods.getPageMax();

        if (transitionInProgress) return;
        if (
            (event.key === 'PageUp' && pageBefore <= 1)
            || (event.key === 'PageDown' && pageBefore >= pageMax)
        ) return;

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

        if (tableElement.querySelector?.('.tabulator-editing')) return;

        transitionInProgress = true;
        let transitionFinished = false;
        let pageActivationDone = false;

        const openFirstEditableCell = () => {
            const rows = table.getRows('visible') || [];

            for (const row of rows) {
                const cells = typeof row?.getCells === 'function'
                    ? row.getCells()
                    : [];

                for (const cell of cells) {
                    if (navigateToCandidate(cell)) return true;
                }
            }

            return false;
        };

        const activatePage = () => {
            if (pageActivationDone) return false;

            pageActivationDone = true;
            return openFirstEditableCell();
        };

        const finishTransition = () => {
            if (transitionFinished) return;

            transitionFinished = true;
            table?.off?.('pageLoaded', handlePageLoaded);
            transitionInProgress = false;
        };

        const handlePageLoaded = () => {
            try {
                if (paginationMethods.getPage() !== pageBefore) {
                    activatePage();
                }
            } finally {
                finishTransition();
            }
        };

        table?.on?.('pageLoaded', handlePageLoaded);
        let change;

        try {
            change = event.key === 'PageUp'
                ? paginationMethods.previousPage()
                : paginationMethods.nextPage();
        } catch (error) {
            finishTransition();
            throw error;
        }

        Promise.resolve(change).then(() => {
            if (paginationMethods.getPage() !== pageBefore) {
                try {
                    activatePage();
                } finally {
                    finishTransition();
                }
                return;
            }

            if (transitionFinished) return;
            finishTransition();
        }, () => {
            finishTransition();
        });
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

    if (listenerAttached) {
        tableElement.addEventListener('keydown', handleKeydown, true);
    }
    table?.on?.('renderComplete', decoratePager);
    decoratePager();

    return {
        destroy() {
            if (listenerAttached) {
                tableElement.removeEventListener('keydown', handleKeydown, true);
            }
            table?.off?.('renderComplete', decoratePager);
        }
    };
};
