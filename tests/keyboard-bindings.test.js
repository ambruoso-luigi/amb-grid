import { describe, expect, test } from 'vitest';
import {
    matchesKeyboardBinding,
    normalizeKeyboardNavigationOptions,
    parseKeyboardBinding
} from '../src/lib/table/keyboard-bindings.js';

describe('keyboard bindings', () => {
    test('uses directional defaults and exact modifiers', () => {
        const options = normalizeKeyboardNavigationOptions();
        expect(matchesKeyboardBinding({ key: 'ArrowDown' }, options.bindings.down)).toBe(true);
        expect(matchesKeyboardBinding({ key: 'ArrowDown', altKey: true }, options.bindings.down)).toBe(false);
        expect(matchesKeyboardBinding({ key: 'ArrowLeft' }, options.bindings.left)).toBe(true);
    });

    test('parses shifted and control combinations', () => {
        expect(matchesKeyboardBinding({ key: 'Tab', shiftKey: true }, parseKeyboardBinding('Shift+Tab'))).toBe(true);
        expect(matchesKeyboardBinding({ key: 'Enter', ctrlKey: true }, parseKeyboardBinding('Ctrl+Enter'))).toBe(true);
    });

    test('supports partial overrides and disabled navigation', () => {
        const options = normalizeKeyboardNavigationOptions({ enabled: false, bindings: { up: 'Alt+ArrowUp' } });
        expect(options.enabled).toBe(false);
        expect(matchesKeyboardBinding({ key: 'ArrowUp', altKey: true }, options.bindings.up)).toBe(true);
        expect(matchesKeyboardBinding({ key: 'ArrowRight' }, options.bindings.right)).toBe(true);
    });

    test('uses default commit/cancel bindings and supports partial overrides', () => {
        const defaults = normalizeKeyboardNavigationOptions();
        const custom = normalizeKeyboardNavigationOptions({
            bindings: { commit: 'Ctrl+Enter' }
        });

        expect(matchesKeyboardBinding({ key: 'Enter' }, defaults.bindings.commit)).toBe(true);
        expect(matchesKeyboardBinding({ key: 'Escape' }, defaults.bindings.cancel)).toBe(true);
        expect(matchesKeyboardBinding({ key: 'Enter' }, custom.bindings.commit)).toBe(false);
        expect(matchesKeyboardBinding({ key: 'Enter', ctrlKey: true }, custom.bindings.commit)).toBe(true);
        expect(matchesKeyboardBinding({ key: 'Escape' }, custom.bindings.cancel)).toBe(true);
    });

    test('rejects invalid bindings and callbacks', () => {
        expect(() => normalizeKeyboardNavigationOptions({ bindings: { up: '' } })).toThrow(TypeError);
        expect(() => normalizeKeyboardNavigationOptions({ shouldHandle: true })).toThrow(TypeError);
    });
});
