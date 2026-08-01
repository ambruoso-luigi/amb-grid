import { describe, expect, test, vi } from 'vitest';

import * as publicEntry from '../src/index.js';
import { editors as bridgeEditors } from '../src/lib/editors.js';
import { editors as directEditors } from '../src/lib/editors/index.js';
import { EDITOR_API_COVERAGE } from './support/editor-api-coverage.js';

vi.mock('vanillajs-datepicker/Datepicker', () => ({
    default: class DatepickerMock {}
}));

const allowedClassifications = new Set([
    'native',
    'AMB-aware',
    'internal-adapter',
    'dialog-backed'
]);
const internalEditorNames = [
    'datepicker',
    'awesomplete',
    'suggestionWidget',
    'internal'
];

describe('AMB Grid editor public API coverage', () => {
    test('preserves editor identity through every public re-export', () => {
        expect(publicEntry.editors).toBe(directEditors);
        expect(bridgeEditors).toBe(directEditors);
    });

    test('matches the exact certified editor surface and exposes factories', () => {
        const certifiedEditors = EDITOR_API_COVERAGE
            .map(entry => entry.editor)
            .sort();

        expect(Object.keys(directEditors).sort()).toEqual(certifiedEditors);

        EDITOR_API_COVERAGE.forEach(entry => {
            expect(typeof directEditors[entry.editor]).toBe('function');
        });
    });

    test('uses complete, valid and unique certification metadata', () => {
        const editorNames = EDITOR_API_COVERAGE.map(entry => entry.editor);
        const publicPaths = EDITOR_API_COVERAGE.map(entry => entry.publicPath);

        expect(EDITOR_API_COVERAGE).toHaveLength(9);
        expect(new Set(editorNames).size).toBe(editorNames.length);
        expect(new Set(publicPaths).size).toBe(publicPaths.length);

        EDITOR_API_COVERAGE.forEach(entry => {
            expect(entry.editor).toEqual(expect.any(String));
            expect(entry.editor.length).toBeGreaterThan(0);
            expect(entry.publicPath).toBe(`editors.${entry.editor}`);
            expect(entry.source).toEqual(expect.any(String));
            expect(entry.source.length).toBeGreaterThan(0);
            expect(entry.status).toBe('exposed');
            expect(allowedClassifications.has(entry.classification)).toBe(true);
            expect(entry.reason).toEqual(expect.any(String));
            expect(entry.reason.length).toBeGreaterThan(0);
        });
    });

    test('keeps internal widgets and dependency constructors outside the API', () => {
        internalEditorNames.forEach(editorName => {
            expect(Object.keys(directEditors)).not.toContain(editorName);
        });
        expect(Object.keys(publicEntry)).not.toContain('Awesomplete');
        expect(Object.keys(publicEntry)).not.toContain('Datepicker');
    });
});
