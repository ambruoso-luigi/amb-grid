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
        const handlePageLoaded = () => {
            table?.off?.('pageLoaded', handlePageLoaded);

            if (paginationMethods.getPage() !== pageBefore) {
                const rows = table.getRows('visible') || [];
                let editorOpened = false;

                for (const row of rows) {
                    const cells = typeof row?.getCells === 'function'
                        ? row.getCells()
                        : [];

                    for (const cell of cells) {
                        if (navigateToCandidate(cell)) {
                            editorOpened = true;
                            break;
                        }
                    }

                    if (editorOpened) break;
                }
            }

            transitionInProgress = false;
        };

        table?.on?.('pageLoaded', handlePageLoaded);
        const change = event.key === 'PageUp'
            ? paginationMethods.previousPage()
            : paginationMethods.nextPage();
        Promise.resolve(change).then(() => {
            if (paginationMethods.getPage() === pageBefore) {
                table?.off?.('pageLoaded', handlePageLoaded);
                transitionInProgress = false;
            }
        }, () => {
            table?.off?.('pageLoaded', handlePageLoaded);
            transitionInProgress = false;
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
