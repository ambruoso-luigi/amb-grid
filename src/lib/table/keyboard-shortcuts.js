/**
 * Immutable registry of keyboard shortcuts owned by the grid rather than an
 * individual editor. Labels are reused by handlers and accessibility hints.
 *
 * @private
 * @internal
 */
export const GRID_SHORTCUTS = Object.freeze({
    previousPage: Object.freeze({ key: 'PageUp', altKey: true, label: 'Alt+PageUp' }),
    nextPage: Object.freeze({ key: 'PageDown', altKey: true, label: 'Alt+PageDown' }),
    previousRow: Object.freeze({ key: 'ArrowUp', altKey: true, label: 'Alt+ArrowUp' }),
    nextRow: Object.freeze({ key: 'ArrowDown', altKey: true, label: 'Alt+ArrowDown' })
});

/**
 * Checks whether a keyboard event exactly matches a global grid shortcut.
 * Control and Meta modifiers are rejected to preserve platform shortcuts.
 *
 * @param {KeyboardEvent|object} event - Keyboard event to inspect.
 * @param {{key: string, altKey: boolean}} shortcut - Registry entry.
 * @returns {boolean} Whether the shortcut matches.
 * @private
 * @internal
 */
export const matchesShortcut = (event, shortcut) => (
    event?.key === shortcut.key
    && Boolean(event.altKey) === shortcut.altKey
    && !event.ctrlKey
    && !event.metaKey
);
