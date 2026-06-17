import { describe, expect, test } from 'vitest';
import {
    normalizeDateInputChange,
    parseDateEditorValue
} from '../src/lib/editors/date-editor-utils.js';

describe('date editor input normalization', () => {
    test('auto-inserts separators only for linear digit typing', () => {
        expect(normalizeDateInputChange({
            value: '20072026',
            format: 'dd/mm/yyyy',
            selectionStart: 8,
            inputType: 'insertText'
        })).toEqual({
            value: '20/07/2026',
            selectionStart: 10
        });

        expect(normalizeDateInputChange({
            value: '20260605',
            format: 'yyyy-mm-dd',
            selectionStart: 8,
            inputType: 'insertText'
        })).toEqual({
            value: '2026-06-05',
            selectionStart: 10
        });
    });

    test('continues auto-formatting after auto-inserted separators', () => {
        expect(normalizeDateInputChange({
            value: '20/072',
            format: 'dd/mm/yyyy',
            selectionStart: 6,
            inputType: 'insertText'
        })).toEqual({
            value: '20/07/2',
            selectionStart: 7
        });

        expect(normalizeDateInputChange({
            value: '2026-060',
            format: 'yyyy-mm-dd',
            selectionStart: 8,
            inputType: 'insertText'
        })).toEqual({
            value: '2026-06-0',
            selectionStart: 9
        });
    });

    test('preserves manually typed separators', () => {
        expect(normalizeDateInputChange({
            value: '20/7/2026',
            format: 'dd/mm/yyyy',
            selectionStart: 9,
            inputType: 'insertText'
        })).toEqual({
            value: '20/7/2026',
            selectionStart: 9
        });

        expect(normalizeDateInputChange({
            value: '2026-06-5',
            format: 'yyyy-mm-dd',
            selectionStart: 9,
            inputType: 'insertText'
        })).toEqual({
            value: '2026-06-5',
            selectionStart: 9
        });
    });

    test('does not auto-format deletion or middle edits', () => {
        expect(normalizeDateInputChange({
            value: '',
            format: 'dd/mm/yyyy',
            selectionStart: 0,
            inputType: 'deleteContentBackward'
        })).toEqual({
            value: '',
            selectionStart: 0
        });

        expect(normalizeDateInputChange({
            value: '20072026',
            format: 'dd/mm/yyyy',
            selectionStart: 4,
            inputType: 'insertText'
        })).toEqual({
            value: '20072026',
            selectionStart: 4
        });
    });

    test('keeps compact dates strict and unseparated', () => {
        expect(normalizeDateInputChange({
            value: '2026720',
            format: 'yyyymmdd',
            selectionStart: 7,
            inputType: 'insertText'
        })).toEqual({
            value: '2026720',
            selectionStart: 7
        });
    });
});

describe('date editor commit behavior', () => {
    test('commits invalid raw values by default', () => {
        expect(parseDateEditorValue('31/02/2026', {
            format: 'dd/mm/yyyy'
        })).toEqual({
            action: 'success',
            value: '31/02/2026'
        });
    });

    test('can cancel invalid values', () => {
        expect(parseDateEditorValue('31/02/2026', {
            format: 'dd/mm/yyyy',
            invalidBehavior: 'cancel'
        })).toEqual({
            action: 'cancel'
        });
    });

    test('normalizes valid values on commit', () => {
        expect(parseDateEditorValue('20/7/2026', {
            format: 'dd/mm/yyyy'
        })).toEqual({
            action: 'success',
            value: '20/07/2026'
        });
    });
});
