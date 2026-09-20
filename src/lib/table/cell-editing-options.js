const DEFAULT_OPTIONS = Object.freeze({ mouseTrigger: 'double-click' });
const VALID_MOUSE_TRIGGERS = new Set(['double-click', 'single-click']);

/**
 * Normalizes the public AMB pointer-editing configuration.
 *
 * @param {object|undefined} cellEditing - Public cell editing options.
 * @returns {{mouseTrigger: 'double-click'|'single-click'}} Normalized options.
 */
export const normalizeCellEditingOptions = cellEditing => {
    if (cellEditing === undefined) return { ...DEFAULT_OPTIONS };

    if (!cellEditing || typeof cellEditing !== 'object' || Array.isArray(cellEditing)) {
        throw new TypeError('AMB.table: `cellEditing` must be an object.');
    }

    const mouseTrigger = cellEditing.mouseTrigger === undefined
        ? DEFAULT_OPTIONS.mouseTrigger
        : cellEditing.mouseTrigger;

    if (!VALID_MOUSE_TRIGGERS.has(mouseTrigger)) {
        throw new TypeError(
            'AMB.table: `cellEditing.mouseTrigger` must be `double-click` or `single-click`.'
        );
    }

    return { mouseTrigger };
};
