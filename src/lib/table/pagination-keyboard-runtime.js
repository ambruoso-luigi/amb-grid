import {
    focusCellWithoutEditing,
    isEditableCandidate
} from '../editors/shared.js';

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

    const activeTransitions = new Set();

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

        activeTransitions.forEach(cleanupTransition => cleanupTransition());

        const pageBefore = paginationMethods.getPage();
        let settled = false;
        let changeStarted = false;
        let focusRestored = false;
        let change;

        const cleanup = () => {
            if (settled) return;

            settled = true;
            activeTransitions.delete(cleanup);
            table?.off?.('renderComplete', tryRestoreFocus);
        };

        const tryRestoreFocus = () => {
            const pageAfter = paginationMethods.getPage();

            if (!changeStarted) return;

            if (pageAfter === pageBefore) {
                cleanup();
                return;
            }

            if (typeof table.getRows !== 'function') {
                cleanup();
                return;
            }

            if (focusRestored && globalThis.document?.activeElement?.closest?.(
                tableElement.id ? `#${tableElement.id}` : '.tabulator'
            )) return;

            const rows = table.getRows('visible') || [];

            for (const row of rows) {
                const cells = typeof row?.getCells === 'function'
                    ? row.getCells()
                    : [];

                for (const cell of cells) {
                    if (
                        isEditableCandidate(cell)
                        && focusCellWithoutEditing(cell)
                    ) {
                        focusRestored = true;
                        return;
                    }
                }
            }
        };

        table?.on?.('renderComplete', tryRestoreFocus);
        activeTransitions.add(cleanup);
        changeStarted = true;
        change = event.key === 'PageUp'
            ? paginationMethods.previousPage()
            : paginationMethods.nextPage();
        Promise.resolve(change).then(() => {
            tryRestoreFocus();
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
        tableElement.addEventListener('keydown', handleKeydown);
    }
    table?.on?.('renderComplete', decoratePager);
    decoratePager();

    return {
        destroy() {
            activeTransitions.forEach(cleanupTransition => cleanupTransition());
            if (listenerAttached) {
                tableElement.removeEventListener('keydown', handleKeydown);
            }
            table?.off?.('renderComplete', decoratePager);
        }
    };
};
