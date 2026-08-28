const coordinators = new WeakMap();

export const registerPageNavigationCoordinator = (table, coordinator) => {
    if (table && coordinator) coordinators.set(table, coordinator);

    return () => {
        if (table && coordinators.get(table) === coordinator) {
            coordinators.delete(table);
        }
    };
};

export const getPageNavigationCoordinator = table => (
    table ? coordinators.get(table) || null : null
);

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
