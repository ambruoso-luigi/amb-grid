import { describe, expect, test, vi } from 'vitest';

import { createExportMethods } from '../src/lib/table/controller/export-methods.js';

describe('AMB table controller export method group', () => {
    test('exposes exactly the flat export controller methods', () => {
        const methods = createExportMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'download',
            'downloadToTab',
            'getHtml',
            'print'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('returns generated HTML without building or mutating grid state', () => {
        const config = { columnGroups: false };
        const html = '<table><tbody><tr><td>A</td></tr></tbody></table>';
        const table = {
            getHtml: vi.fn()
                .mockReturnValueOnce(html)
                .mockReturnValueOnce('')
                .mockReturnValueOnce(html),
            getData: vi.fn(),
            download: vi.fn(),
            print: vi.fn(),
            setFilter: vi.fn(),
            setSort: vi.fn(),
            setPage: vi.fn(),
            createElement: vi.fn()
        };
        const methods = createExportMethods({ table });

        expect(methods.getHtml()).toBe(html);
        expect(table.getHtml).toHaveBeenCalledOnce();
        expect(table.getHtml).toHaveBeenLastCalledWith();

        expect(methods.getHtml('active')).toBe('');
        expect(table.getHtml).toHaveBeenCalledTimes(2);
        expect(table.getHtml).toHaveBeenLastCalledWith('active');

        expect(methods.getHtml('visible', true, config)).toBe(html);
        expect(table.getHtml).toHaveBeenCalledTimes(3);
        expect(table.getHtml).toHaveBeenLastCalledWith('visible', true, config);
        expect(table.getHtml.mock.calls[2][2]).toBe(config);
        expect(table.getData).not.toHaveBeenCalled();
        expect(table.download).not.toHaveBeenCalled();
        expect(table.print).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.setSort).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.createElement).not.toHaveBeenCalled();
    });

    test('delegates downloads without preparing output manually', () => {
        const customDownloader = vi.fn();
        const options = { sheetName: 'Data' };
        const downloadResult = { started: true };
        const table = {
            download: vi.fn()
                .mockReturnValueOnce(downloadResult)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(downloadResult),
            getHtml: vi.fn(),
            getData: vi.fn(),
            createBlob: vi.fn(),
            createObjectURL: vi.fn()
        };
        const methods = createExportMethods({ table });

        expect(methods.download('csv', 'data.csv')).toBe(downloadResult);
        expect(table.download).toHaveBeenCalledOnce();
        expect(table.download).toHaveBeenLastCalledWith('csv', 'data.csv');

        expect(methods.download('xlsx', 'data.xlsx', options)).toBeUndefined();
        expect(table.download).toHaveBeenCalledTimes(2);
        expect(table.download).toHaveBeenLastCalledWith('xlsx', 'data.xlsx', options);
        expect(table.download.mock.calls[1][2]).toBe(options);

        expect(methods.download(customDownloader, 'data.custom', options)).toBe(downloadResult);
        expect(table.download).toHaveBeenCalledTimes(3);
        expect(table.download).toHaveBeenLastCalledWith(customDownloader, 'data.custom', options);
        expect(table.download.mock.calls[2][0]).toBe(customDownloader);
        expect(table.download.mock.calls[2][2]).toBe(options);
        expect(table.getHtml).not.toHaveBeenCalled();
        expect(table.getData).not.toHaveBeenCalled();
        expect(table.createBlob).not.toHaveBeenCalled();
        expect(table.createObjectURL).not.toHaveBeenCalled();
    });

    test('delegates download-to-tab without opening tabs directly', () => {
        const originalWindow = globalThis.window;
        const options = { title: 'Report' };
        const result = { opened: true };
        const table = {
            downloadToTab: vi.fn(() => result),
            download: vi.fn(),
            getData: vi.fn()
        };
        const methods = createExportMethods({ table });

        globalThis.window = { open: vi.fn() };

        try {
            expect(methods.downloadToTab('pdf', 'report.pdf', options)).toBe(result);
            expect(table.downloadToTab).toHaveBeenCalledOnce();
            expect(table.downloadToTab).toHaveBeenCalledWith('pdf', 'report.pdf', options);
            expect(table.downloadToTab.mock.calls[0][2]).toBe(options);
            expect(table.download).not.toHaveBeenCalled();
            expect(table.getData).not.toHaveBeenCalled();
            expect(globalThis.window.open).not.toHaveBeenCalled();
        } finally {
            globalThis.window = originalWindow;
        }
    });

    test('delegates printing without generating HTML or printing directly', () => {
        const originalWindow = globalThis.window;
        const result = { printed: true };
        const table = {
            print: vi.fn()
                .mockReturnValueOnce(result)
                .mockReturnValueOnce(undefined),
            getHtml: vi.fn(),
            getData: vi.fn(),
            setFilter: vi.fn(),
            setPage: vi.fn(),
            selectRow: vi.fn()
        };
        const methods = createExportMethods({ table });

        globalThis.window = { print: vi.fn() };

        try {
            expect(methods.print()).toBe(result);
            expect(table.print).toHaveBeenCalledOnce();
            expect(table.print).toHaveBeenLastCalledWith();

            expect(methods.print(false, true)).toBeUndefined();
            expect(table.print).toHaveBeenCalledTimes(2);
            expect(table.print).toHaveBeenLastCalledWith(false, true);
            expect(table.getHtml).not.toHaveBeenCalled();
            expect(table.getData).not.toHaveBeenCalled();
            expect(table.setFilter).not.toHaveBeenCalled();
            expect(table.setPage).not.toHaveBeenCalled();
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(globalThis.window.print).not.toHaveBeenCalled();
        } finally {
            globalThis.window = originalWindow;
        }
    });
});
