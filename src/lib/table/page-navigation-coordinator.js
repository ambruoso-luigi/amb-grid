const coordinators = new WeakMap();

/**
 * Associates a table with its internal page-transition coordinator.
 * Registration is removed by the returned lifecycle cleanup function.
 *
 * @param {object} table - Runtime table component.
 * @param {{transitionPage: Function}} coordinator - Page navigation owner.
 * @returns {Function} Idempotent registration cleanup.
 * @private
 * @internal
 */
export const registerPageNavigationCoordinator = (table, coordinator) => {
    if (table && coordinator) coordinators.set(table, coordinator);

    return () => {
        if (table && coordinators.get(table) === coordinator) {
            coordinators.delete(table);
        }
    };
};

/**
 * Resolves the page coordinator registered for a runtime table.
 *
 * @param {object} table - Runtime table component.
 * @returns {{transitionPage: Function}|null} Registered coordinator.
 * @private
 * @internal
 */
export const getPageNavigationCoordinator = table => (
    table ? coordinators.get(table) || null : null
);

/**
 * Moves focus to the nearest focusable element outside a grid boundary.
 *
 * @param {HTMLElement} gridElement - Grid root element.
 * @param {'next'|'prev'} direction - Focus traversal direction.
 * @returns {boolean} Whether an external target received focus.
 * @private
 * @internal
 */
export const focusAdjacentOutsideGrid = (gridElement, direction) => {
    const documentElement = globalThis.document;

    if (!gridElement || !documentElement?.querySelectorAll) return false;

    const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    const position = direction === 'prev'
        ? globalThis.Node?.DOCUMENT_POSITION_PRECEDING || 2
        : globalThis.Node?.DOCUMENT_POSITION_FOLLOWING || 4;
    const candidates = Array.from(documentElement.querySelectorAll(selector))
        .filter(element => (
            !gridElement.contains(element)
            && Boolean(gridElement.compareDocumentPosition?.(element) & position)
        ));
    const target = direction === 'prev'
        ? candidates[candidates.length - 1]
        : candidates[0];

    if (!target || typeof target.focus !== 'function') return false;

    target.focus();
    return true;
};
