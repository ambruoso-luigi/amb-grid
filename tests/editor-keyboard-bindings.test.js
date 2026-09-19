import { afterEach, describe, expect, test, vi } from 'vitest';
import {
    getKeyboardNavigationContext,
    normalizeKeyboardNavigationOptions,
    registerKeyboardNavigationContext
} from '../src/lib/table/keyboard-bindings.js';
import { handleEditorCommitCancelKeydown } from '../src/lib/editors/shared.js';

const event = (key, modifiers = {}) => ({
    key,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    stopImmediatePropagation: vi.fn(),
    ...modifiers
});
const cellFor = table => ({
    getTable: () => table,
    getRow: () => 'row',
    getColumn: () => 'column',
    getElement: () => ({ focus: vi.fn(), addEventListener() {}, removeEventListener() {} })
});
const invoke = (cell, input, onCommit = vi.fn(), onCancel = vi.fn()) => ({
    handled: handleEditorCommitCancelKeydown({ cell, event: input, onCommit, onCancel }), onCommit, onCancel
});

describe('editor keyboard binding context', () => {
    const cleanups = [];
    afterEach(() => { cleanups.splice(0).forEach(cleanup => cleanup()); vi.restoreAllMocks(); });
    const register = (table, options) => cleanups.push(registerKeyboardNavigationContext(table, {
        keyboardNavigationOptions: normalizeKeyboardNavigationOptions(options), getGrid: () => 'grid'
    }));

    test('uses exact per-table custom bindings and leaves nonmatching events untouched', () => {
        const tableA = {}; const tableB = {}; const cellA = cellFor(tableA); const cellB = cellFor(tableB);
        register(tableA, { bindings: { commit: 'Ctrl+Enter', cancel: 'Alt+Escape' } });
        register(tableB, { bindings: { commit: 'Alt+Enter' } });
        const plain = event('Enter');
        expect(invoke(cellA, plain).handled).toBe(false);
        expect(plain.preventDefault).not.toHaveBeenCalled();
        expect(invoke(cellA, event('Enter', { ctrlKey: true })).onCommit).toHaveBeenCalledOnce();
        expect(invoke(cellA, event('Escape')).handled).toBe(false);
        expect(invoke(cellA, event('Escape', { altKey: true })).onCancel).toHaveBeenCalledOnce();
        expect(invoke(cellB, event('Enter', { ctrlKey: true })).handled).toBe(false);
        expect(invoke(cellB, event('Enter', { altKey: true })).onCommit).toHaveBeenCalledOnce();
    });

    test('falls back after no registration or cleanup', () => {
        const table = {}; const cell = cellFor(table);
        expect(invoke(cell, event('Enter')).onCommit).toHaveBeenCalledOnce();
        const cleanup = registerKeyboardNavigationContext(table, { keyboardNavigationOptions: normalizeKeyboardNavigationOptions({ bindings: { commit: 'Ctrl+Enter' } }) });
        cleanup();
        expect(invoke(cell, event('Enter')).onCommit).toHaveBeenCalledOnce();
    });

    test('shouldHandle vetoes editing actions without touching the event', () => {
        const shouldHandle = vi.fn(() => false); const table = {}; const cell = cellFor(table);
        register(table, { shouldHandle }); const input = event('Enter'); const result = invoke(cell, input);
        expect(result.handled).toBe(false); expect(result.onCommit).not.toHaveBeenCalled();
        expect(input.preventDefault).not.toHaveBeenCalled();
        expect(shouldHandle).toHaveBeenCalledWith(expect.objectContaining({ action: 'commit', state: 'editing', cell, row: 'row', column: 'column', grid: 'grid', event: input }));
    });

    test('disabled navigation keeps legacy actions and ignores its hook', () => {
        const shouldHandle = vi.fn(() => false); const table = {}; const cell = cellFor(table);
        register(table, { enabled: false, shouldHandle, bindings: { commit: 'Ctrl+Enter', cancel: 'Alt+Escape' } });
        expect(invoke(cell, event('Enter')).onCommit).toHaveBeenCalledOnce();
        expect(invoke(cell, event('Escape')).onCancel).toHaveBeenCalledOnce();
        expect(invoke(cell, event('Enter', { ctrlKey: true })).handled).toBe(false);
        expect(shouldHandle).not.toHaveBeenCalled();
    });

    test('cleanup removes the internal context', () => {
        const table = {}; const cleanup = registerKeyboardNavigationContext(table, {});
        expect(getKeyboardNavigationContext(table)).toBeDefined(); cleanup();
        expect(getKeyboardNavigationContext(table)).toBeUndefined();
    });
});
