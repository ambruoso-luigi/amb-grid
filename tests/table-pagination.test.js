import { describe, expect, test } from 'vitest';
import { normalizePaginationOptions } from '../src/lib/table/table-factory.js';

describe('normalizePaginationOptions', () => {
    test('keeps pagination true unchanged for Tabulator-style options', () => {
        const options = normalizePaginationOptions({
            pagination: true
        });

        expect(options).toEqual({
            pagination: true,
            paginationAddRow: 'table'
        });
    });

    test('keeps pagination false unchanged for Tabulator-style options', () => {
        const options = normalizePaginationOptions({
            pagination: false
        });

        expect(options).toEqual({
            pagination: false
        });
    });

    test('uses local mode and page size 10 when object-style pagination is enabled', () => {
        const options = normalizePaginationOptions({
            pagination: {
                enabled: true
            }
        });

        expect(options.pagination).toBe(true);
        expect(options.paginationMode).toBe('local');
        expect(options.paginationSize).toBe(10);
        expect(options.paginationAddRow).toBe('table');
    });

    test('turns object-style disabled pagination into pagination false', () => {
        const options = normalizePaginationOptions({
            pagination: {
                enabled: false
            }
        });

        expect(options.pagination).toBe(false);
    });

    test('maps remote mode and custom page size to Tabulator options', () => {
        const options = normalizePaginationOptions({
            pagination: {
                enabled: true,
                mode: 'remote',
                pageSize: 25
            }
        });

        expect(options.pagination).toBe(true);
        expect(options.paginationMode).toBe('remote');
        expect(options.paginationSize).toBe(25);
        expect(options.paginationAddRow).toBe('table');
    });

    test('maps pageSizeSelector to paginationSizeSelector', () => {
        const options = normalizePaginationOptions({
            pagination: {
                enabled: true,
                pageSizeSelector: [10, 25, 50]
            }
        });

        expect(options.paginationSizeSelector).toEqual([10, 25, 50]);
    });

    test('object-style pageSize takes priority over equivalent Tabulator paginationSize', () => {
        const options = normalizePaginationOptions({
            pagination: {
                enabled: true,
                pageSize: 25
            },
            paginationSize: 5
        });

        expect(options.paginationSize).toBe(25);
    });

    test('keeps unrelated Tabulator options intact', () => {
        const options = normalizePaginationOptions({
            layout: 'fitColumns',
            height: 400,
            pagination: {
                enabled: true,
                pageSize: 25
            }
        });

        expect(options.layout).toBe('fitColumns');
        expect(options.height).toBe(400);
        expect(options.pagination).toBe(true);
        expect(options.paginationSize).toBe(25);
        expect(options.paginationAddRow).toBe('table');
    });

    test('keeps explicit Tabulator paginationAddRow override', () => {
        const options = normalizePaginationOptions({
            pagination: true,
            paginationAddRow: 'page'
        });

        expect(options.paginationAddRow).toBe('page');
    });
});
