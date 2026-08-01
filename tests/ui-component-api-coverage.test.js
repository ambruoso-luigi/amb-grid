import { describe, expect, test, vi } from 'vitest';

import * as publicEntry from '../src/index.js';
import { ConfirmDialog } from '../src/ui/confirm-dialog.js';
import { LookupDialog } from '../src/ui/lookup-dialog.js';
import { SearchFiltersDialog } from '../src/ui/search-filters-dialog.js';
import { FeedbackRegion } from '../src/ui/feedback-region.js';
import {
    UI_COMPONENT_API_COVERAGE
} from './support/ui-component-api-coverage.js';

vi.mock('vanillajs-datepicker/Datepicker', () => ({
    default: class DatepickerMock {}
}));

const directComponents = {
    ConfirmDialog,
    LookupDialog,
    SearchFiltersDialog,
    FeedbackRegion
};
const allowedClassifications = new Set([
    'promise-dialog',
    'status-region'
]);
const internalClassNames = [
    'FloatingMessage',
    'FocusTrap',
    'Datepicker',
    'Awesomplete'
];

describe('AMB Grid public UI component API coverage', () => {
    test('exports the direct component constructors', () => {
        UI_COMPONENT_API_COVERAGE.forEach(entry => {
            expect(publicEntry[entry.publicExport])
                .toBe(directComponents[entry.component]);
            expect(typeof directComponents[entry.component]).toBe('function');
        });
    });

    test('exposes every intentional public method on its prototype', () => {
        UI_COMPONENT_API_COVERAGE.forEach(entry => {
            entry.publicMethods.forEach(methodName => {
                expect(
                    typeof directComponents[entry.component].prototype[methodName]
                ).toBe('function');
            });
        });
    });

    test('uses complete, valid and unique certification metadata', () => {
        const componentNames = UI_COMPONENT_API_COVERAGE
            .map(entry => entry.component);
        const publicExports = UI_COMPONENT_API_COVERAGE
            .map(entry => entry.publicExport);

        expect(UI_COMPONENT_API_COVERAGE).toHaveLength(4);
        expect(new Set(componentNames).size).toBe(componentNames.length);
        expect(new Set(publicExports).size).toBe(publicExports.length);

        UI_COMPONENT_API_COVERAGE.forEach(entry => {
            expect(entry.component).toEqual(expect.any(String));
            expect(entry.component.length).toBeGreaterThan(0);
            expect(entry.publicExport).toBe(entry.component);
            expect(entry.source).toEqual(expect.any(String));
            expect(entry.source.length).toBeGreaterThan(0);
            expect(entry.status).toBe('exposed');
            expect(allowedClassifications.has(entry.classification)).toBe(true);
            expect(Array.isArray(entry.publicMethods)).toBe(true);
            expect(entry.publicMethods.length).toBeGreaterThan(0);
            expect(new Set(entry.publicMethods).size)
                .toBe(entry.publicMethods.length);
            entry.publicMethods.forEach(methodName => {
                expect(methodName).toEqual(expect.any(String));
                expect(methodName.length).toBeGreaterThan(0);
            });
            expect(entry.reason).toEqual(expect.any(String));
            expect(entry.reason.length).toBeGreaterThan(0);
        });
    });

    test('keeps internal UI classes outside the public entry point', () => {
        internalClassNames.forEach(className => {
            expect(Object.keys(publicEntry)).not.toContain(className);
        });
    });
});
