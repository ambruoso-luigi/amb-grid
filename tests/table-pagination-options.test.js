import fs from 'node:fs';
import { describe, expect, test } from 'vitest';
import { normalizePaginationOptions } from '../src/lib/table/table-factory.js';

describe('AMB.table pagination option wrapper', () => {
    test('keeps Tabulator-style pagination true compatible', () => {
        const options = normalizePaginationOptions({
            pagination: true,
            paginationMode: 'local',
            paginationSize: 5,
            paginationSizeSelector: [5, 10, 25]
        });

        expect(options).toEqual({
            pagination: true,
            paginationMode: 'local',
            paginationSize: 5,
            paginationSizeSelector: [5, 10, 25]
        });
    });

    test('keeps Tabulator-style pagination false compatible', () => {
        const options = normalizePaginationOptions({
            pagination: false,
            paginationMode: 'local',
            paginationSize: 5
        });

        expect(options).toEqual({
            pagination: false,
            paginationMode: 'local',
            paginationSize: 5
        });
    });

    test('translates AMB object-style pagination to Tabulator options', () => {
        const options = normalizePaginationOptions({
            pagination: {
                enabled: true,
                mode: 'local',
                pageSize: 10,
                pageSizeSelector: [10, 25, 50]
            }
        });

        expect(options).toEqual({
            pagination: true,
            paginationMode: 'local',
            paginationSize: 10,
            paginationSizeSelector: [10, 25, 50]
        });
    });

    test('translates AMB object-style pagination disabled state', () => {
        const options = normalizePaginationOptions({
            pagination: {
                enabled: false
            }
        });

        expect(options.pagination).toBe(false);
    });

    test('maps pageSize, pageSizeSelector, and mode independently', () => {
        const options = normalizePaginationOptions({
            pagination: {
                enabled: true,
                mode: 'remote',
                pageSize: 25,
                pageSizeSelector: [25, 50, 100]
            }
        });

        expect(options.pagination).toBe(true);
        expect(options.paginationMode).toBe('remote');
        expect(options.paginationSize).toBe(25);
        expect(options.paginationSizeSelector).toEqual([25, 50, 100]);
    });

    test('uses sensible defaults when AMB object-style pagination is enabled', () => {
        const options = normalizePaginationOptions({
            pagination: {
                enabled: true
            }
        });

        expect(options.pagination).toBe(true);
        expect(options.paginationMode).toBe('local');
        expect(options.paginationSize).toBe(10);
        expect(options).not.toHaveProperty('paginationSizeSelector');
    });

    test('AMB object-style pagination takes priority over equivalent Tabulator options', () => {
        const options = normalizePaginationOptions({
            pagination: {
                enabled: true,
                mode: 'local',
                pageSize: 25,
                pageSizeSelector: [25, 50]
            },
            paginationMode: 'remote',
            paginationSize: 5,
            paginationSizeSelector: [5, 10]
        });

        expect(options.pagination).toBe(true);
        expect(options.paginationMode).toBe('local');
        expect(options.paginationSize).toBe(25);
        expect(options.paginationSizeSelector).toEqual([25, 50]);
    });

    test('passes unrelated Tabulator and AMB options through without mutation', () => {
        const data = [{ id: 1, name: 'Alpha' }];
        const columns = [{ field: 'name', title: 'Name' }];
        const sourceOptions = {
            data,
            columns,
            toolbar: { buttons: ['add', 'save'] },
            ajaxURL: '/inventory',
            layout: 'fitColumns',
            pagination: {
                enabled: true,
                pageSize: 15
            }
        };

        const options = normalizePaginationOptions(sourceOptions);

        expect(options.data).toBe(data);
        expect(options.columns).toBe(columns);
        expect(options.toolbar).toBe(sourceOptions.toolbar);
        expect(options.ajaxURL).toBe('/inventory');
        expect(options.layout).toBe('fitColumns');
        expect(options.pagination).toBe(true);
        expect(options.paginationSize).toBe(15);
        expect(sourceOptions.pagination).toEqual({
            enabled: true,
            pageSize: 15
        });
    });

    test('library CSS contains base Tabulator pagination styling', () => {
        const css = fs.readFileSync(
            new URL('../src/amb-grid.css', import.meta.url),
            'utf8'
        );

        expect(css).toContain('.tabulator .tabulator-footer');
        expect(css).toContain('.tabulator .tabulator-footer .tabulator-page');
        expect(css).toContain('.tabulator .tabulator-footer .tabulator-page-size');
        expect(css).toContain('.tabulator .tabulator-footer .tabulator-page.active');
        expect(css).toContain('.tabulator .tabulator-footer .tabulator-page:focus-visible');
    });
});
