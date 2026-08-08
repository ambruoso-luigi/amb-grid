const CALCULATION_ROW_SELECTORS = {
    top: '.tabulator-calcs-top',
    bottom: '.tabulator-calcs-bottom'
};
const CALCULATION_ROW_SELECTOR = Object.values(CALCULATION_ROW_SELECTORS).join(', ');
const CALCULATION_CELL_SELECTOR = '.tabulator-cell';

const decorateRow = row => {
    row.classList.add('amb-calc-row');

    Object.entries(CALCULATION_ROW_SELECTORS).forEach(([position, selector]) => {
        if (row.matches(selector)) {
            row.classList.add(`amb-calc-row--${position}`);
        }
    });

    row.querySelectorAll(CALCULATION_CELL_SELECTOR).forEach(cell => {
        cell.classList.add('amb-calc-cell');
    });
};

const decorateAddedNode = node => {
    if (!node || node.nodeType !== 1) return;

    if (node.matches(CALCULATION_ROW_SELECTOR)) {
        decorateRow(node);
    }

    node.querySelectorAll(CALCULATION_ROW_SELECTOR).forEach(decorateRow);

    const parentCalculationRow = node.closest(CALCULATION_ROW_SELECTOR);

    if (parentCalculationRow) {
        decorateRow(parentCalculationRow);
    }
};

/**
 * Creates the internal runtime that maintains AMB Grid calculation presentation classes.
 *
 * @param {Element} root - Root element of one AMB Grid instance.
 * @param {object} [options] - Internal runtime dependencies.
 * @returns {{destroy: Function}} Calculation presentation lifecycle resource.
 * @private
 * @internal
 */
export const createCalculationPresentationRuntime = (root, options = {}) => {
    const Observer = options.MutationObserver || globalThis.MutationObserver;

    if (!root || typeof Observer !== 'function') {
        return { destroy() {} };
    }

    root.querySelectorAll(CALCULATION_ROW_SELECTOR).forEach(decorateRow);

    const observer = new Observer(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(decorateAddedNode);
        });
    });

    observer.observe(root, {
        childList: true,
        subtree: true
    });

    return {
        destroy() {
            observer.disconnect();
        }
    };
};
