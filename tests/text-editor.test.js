import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { text as createTextEditor } from '../src/lib/editors/text-editor.js';

const createElement = () => {
    const listeners = new Map();

    return {
        value: '',
        selectionStart: 0,
        selectionEnd: 0,
        selectionDirection: 'none',
        setSelectionRangeCalls: [],
        addEventListener(type, listener) {
            listeners.set(type, listener);
        },
        dispatch(type, event = {}) {
            return listeners.get(type)?.(event);
        },
        focus() {},
        select() {},
        setSelectionRange(start, end, direction = 'none') {
            this.selectionStart = start;
            this.selectionEnd = end;
            this.selectionDirection = direction;
            this.setSelectionRangeCalls.push([start, end, direction]);
        }
    };
};

const createHarness = (options = {}) => {
    const editor = createTextEditor(options);
    const input = editor(
        { getValue: () => 'ABCD' },
        () => {},
        vi.fn(),
        vi.fn()
    );

    return input;
};

describe('text editor normalization', () => {
    const originalDocument = globalThis.document;

    beforeEach(() => {
        globalThis.document = { createElement };
    });

    afterEach(() => {
        globalThis.document = originalDocument;
        vi.restoreAllMocks();
    });

    test('uppercases a middle insertion without moving the caret', () => {
        const input = createHarness({ uppercase: true });

        input.value = 'ABcCD';
        input.selectionStart = 3;
        input.selectionEnd = 3;
        input.selectionDirection = 'forward';
        input.dispatch('input');

        expect(input.value).toBe('ABCCD');
        expect(input.selectionStart).toBe(3);
        expect(input.selectionEnd).toBe(3);
        expect(input.selectionDirection).toBe('forward');
        expect(input.setSelectionRangeCalls).toEqual([[3, 3, 'forward']]);
    });

    test('keeps partial selections and lowercase normalization intact', () => {
        const input = createHarness({ lowercase: true });

        input.value = 'ABcDE';
        input.selectionStart = 1;
        input.selectionEnd = 4;
        input.selectionDirection = 'backward';
        input.dispatch('input');

        expect(input.value).toBe('abcde');
        expect(input.selectionStart).toBe(1);
        expect(input.selectionEnd).toBe(4);
        expect(input.selectionDirection).toBe('backward');
    });

    test('does not reassign an already normalized value', () => {
        const input = createHarness({ uppercase: true });

        input.value = 'AB1';
        input.dispatch('input');

        expect(input.value).toBe('AB1');
        expect(input.setSelectionRangeCalls).toEqual([]);
    });
});
