import { describe, expect, test, vi } from 'vitest';

import * as publicEntry from '../src/index.js';
import { AMB as directAMB } from '../src/lib/amb.js';
import { validators } from '../src/lib/validators.js';
import { formatters } from '../src/lib/formatters.js';
import { editors } from '../src/lib/editors.js';
import { parsers } from '../src/lib/parsers.js';
import { date } from '../src/lib/date.js';
import { createLookup } from '../src/lib/lookup.js';
import {
    createMultifieldLookup
} from '../src/lib/multifield-lookup.js';
import { createTable } from '../src/lib/table/index.js';
import { ConfirmDialog } from '../src/ui/confirm-dialog.js';
import { LookupDialog } from '../src/ui/lookup-dialog.js';
import {
    SearchFiltersDialog
} from '../src/ui/search-filters-dialog.js';
import { FeedbackRegion } from '../src/ui/feedback-region.js';
import {
    PACKAGE_ENTRY_EXPORTS,
    AMB_NAMESPACE_API_COVERAGE,
    SUPPORT_NAMESPACE_MEMBERS
} from './support/amb-public-api-coverage.js';

vi.mock('vanillajs-datepicker/Datepicker', () => ({
    default: class DatepickerMock {}
}));

const directAMBMembers = {
    validators,
    formatters,
    editors,
    parsers,
    date,
    lookup: createLookup,
    multifieldLookup: createMultifieldLookup,
    LookupDialog,
    FeedbackRegion,
    ConfirmDialog,
    SearchFiltersDialog,
    table: createTable
};
const supportNamespaces = {
    validators,
    formatters,
    parsers,
    date
};
const allowedClassifications = new Set([
    'namespace',
    'factory',
    'factory-alias',
    'class'
]);

describe('AMB Grid public package API coverage', () => {
    test('matches the exact package entry-point surface and identities', () => {
        expect(Object.keys(publicEntry).sort())
            .toEqual([...PACKAGE_ENTRY_EXPORTS].sort());

        PACKAGE_ENTRY_EXPORTS.forEach(exportName => {
            expect(publicEntry[exportName]).not.toBeUndefined();
        });

        expect(publicEntry.AMB).toBe(directAMB);
        expect(publicEntry.createLookup).toBe(createLookup);
        expect(publicEntry.createMultifieldLookup)
            .toBe(createMultifieldLookup);
        expect(publicEntry.multifieldLookup)
            .toBe(createMultifieldLookup);
        expect(Object.keys(publicEntry)).not.toContain('lookup');
        expect(Object.keys(publicEntry)).not.toContain('createTable');
    });

    test('matches the exact AMB namespace surface and identities', () => {
        expect(Object.keys(directAMB).sort()).toEqual(
            AMB_NAMESPACE_API_COVERAGE
                .map(entry => entry.member)
                .sort()
        );

        AMB_NAMESPACE_API_COVERAGE.forEach(entry => {
            expect(directAMB[entry.member])
                .toBe(directAMBMembers[entry.member]);

            if (entry.packageExport !== null) {
                expect(publicEntry[entry.packageExport])
                    .toBe(directAMBMembers[entry.member]);
            }
        });

        expect(directAMB.table).toBe(createTable);
    });

    test('uses complete, valid and unique AMB namespace metadata', () => {
        const members = AMB_NAMESPACE_API_COVERAGE
            .map(entry => entry.member);
        const packageExports = AMB_NAMESPACE_API_COVERAGE
            .map(entry => entry.packageExport)
            .filter(packageExport => packageExport !== null);

        expect(AMB_NAMESPACE_API_COVERAGE).toHaveLength(12);
        expect(new Set(members).size).toBe(members.length);
        expect(new Set(packageExports).size).toBe(packageExports.length);

        AMB_NAMESPACE_API_COVERAGE.forEach(entry => {
            expect(entry.member).toEqual(expect.any(String));
            expect(entry.member.length).toBeGreaterThan(0);
            expect(entry.source).toEqual(expect.any(String));
            expect(entry.source.length).toBeGreaterThan(0);
            expect(allowedClassifications.has(entry.classification)).toBe(true);
            if (entry.packageExport === null) {
                expect(entry.packageExport).toBeNull();
            } else {
                expect(entry.packageExport).toEqual(expect.any(String));
                expect(entry.packageExport.length).toBeGreaterThan(0);
            }
            expect(entry.reason).toEqual(expect.any(String));
            expect(entry.reason.length).toBeGreaterThan(0);
        });
    });

    test('matches the exact support namespace surfaces and factory types', () => {
        Object.entries(SUPPORT_NAMESPACE_MEMBERS)
            .forEach(([namespaceName, memberNames]) => {
                expect(Object.keys(supportNamespaces[namespaceName]).sort())
                    .toEqual([...memberNames].sort());

                memberNames.forEach(memberName => {
                    expect(typeof supportNamespaces[namespaceName][memberName])
                        .toBe('function');
                });
            });
    });
});
