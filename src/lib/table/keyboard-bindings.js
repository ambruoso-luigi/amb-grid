const DEFAULT_BINDINGS = Object.freeze({
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    edit: 'Enter',
    commit: 'Enter',
    cancel: 'Escape',
    next: 'Tab',
    previous: 'Shift+Tab'
});

const ACTIONS = Object.freeze(['up', 'down', 'left', 'right', 'edit', 'commit', 'cancel', 'next', 'previous']);
const keyboardContexts = new WeakMap();
const KEY_NAMES = new Set([
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab',
    'F2', 'Escape', 'Space', 'PageUp', 'PageDown'
]);
const MODIFIERS = new Map([
    ['ctrl', 'ctrlKey'], ['control', 'ctrlKey'], ['alt', 'altKey'],
    ['shift', 'shiftKey'], ['meta', 'metaKey']
]);

const normalizeKey = value => {
    if (value.toLowerCase() === 'space') return 'Space';
    return [...KEY_NAMES].find(key => key.toLowerCase() === value.toLowerCase()) || value;
};

/**
 * Parses an exact keyboard binding used by AMB Grid.
 *
 * @param {string} binding - A shortcut such as `Alt+ArrowDown`.
 * @param {string} [action] - Action name used in validation errors.
 * @returns {{key: string, ctrlKey: boolean, altKey: boolean, shiftKey: boolean, metaKey: boolean}}
 * @private
 * @internal
 */
export const parseKeyboardBinding = (binding, action = 'binding') => {
    if (typeof binding !== 'string' || !binding.trim()) {
        throw new TypeError(`AMB.table: keyboardNavigation binding \`${action}\` must be a non-empty string; received ${String(binding)}.`);
    }
    const parts = binding.split('+').map(part => part.trim()).filter(Boolean);
    const keyPart = parts.pop();
    const parsed = { key: normalizeKey(keyPart || ''), ctrlKey: false, altKey: false, shiftKey: false, metaKey: false };
    if (!keyPart || !KEY_NAMES.has(parsed.key)) {
        throw new TypeError(`AMB.table: keyboardNavigation binding \`${action}\` is invalid; received ${String(binding)}.`);
    }
    for (const modifier of parts) {
        const property = MODIFIERS.get(modifier.toLowerCase());
        if (!property) throw new TypeError(`AMB.table: keyboardNavigation binding \`${action}\` is invalid; received ${String(binding)}.`);
        parsed[property] = true;
    }
    return parsed;
};

export const matchesKeyboardBinding = (event, binding) => {
    const key = binding.key === 'Space' ? (event?.key === ' ' || event?.code === 'Space') : event?.key === binding.key;
    return Boolean(key)
        && Boolean(event?.ctrlKey) === binding.ctrlKey
        && Boolean(event?.altKey) === binding.altKey
        && Boolean(event?.shiftKey) === binding.shiftKey
        && Boolean(event?.metaKey) === binding.metaKey;
};

/**
 * @private
 * @internal
 */
export const registerKeyboardNavigationContext = (table, context) => {
    if (!table) return () => {};
    keyboardContexts.set(table, context);
    return () => keyboardContexts.delete(table);
};

/**
 * @private
 * @internal
 */
export const getKeyboardNavigationContext = table => keyboardContexts.get(table);

/** Normalizes the public AMB Grid keyboard navigation configuration. */
export const normalizeKeyboardNavigationOptions = (keyboardNavigation = undefined) => {
    if (keyboardNavigation !== undefined && (keyboardNavigation === null || typeof keyboardNavigation !== 'object' || Array.isArray(keyboardNavigation))) {
        throw new TypeError('AMB.table: `keyboardNavigation` must be an object.');
    }
    const configured = keyboardNavigation || {};
    if (configured.shouldHandle !== undefined && typeof configured.shouldHandle !== 'function') throw new TypeError('AMB.table: `keyboardNavigation.shouldHandle` must be a function.');
    if (configured.resolveNavigation !== undefined && typeof configured.resolveNavigation !== 'function') throw new TypeError('AMB.table: `keyboardNavigation.resolveNavigation` must be a function.');
    const overrides = configured.bindings || {};
    if (overrides === null || typeof overrides !== 'object' || Array.isArray(overrides)) throw new TypeError('AMB.table: `keyboardNavigation.bindings` must be an object.');
    const bindings = {};
    for (const action of ACTIONS) bindings[action] = parseKeyboardBinding(overrides[action] ?? DEFAULT_BINDINGS[action], action);
    return { enabled: configured.enabled !== false, bindings, shouldHandle: configured.shouldHandle, resolveNavigation: configured.resolveNavigation };
};

export { DEFAULT_BINDINGS, ACTIONS };
