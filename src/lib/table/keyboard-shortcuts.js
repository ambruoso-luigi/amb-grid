export const GRID_SHORTCUTS = Object.freeze({
    previousPage: Object.freeze({ key: 'PageUp', altKey: true, label: 'Alt+PageUp' }),
    nextPage: Object.freeze({ key: 'PageDown', altKey: true, label: 'Alt+PageDown' })
});

export const matchesShortcut = (event, shortcut) => (
    event?.key === shortcut.key
    && Boolean(event.altKey) === shortcut.altKey
    && !event.ctrlKey
    && !event.metaKey
);
