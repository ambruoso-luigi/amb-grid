import { describe, expect, test, vi } from 'vitest';

import { createLocalizationMethods } from '../src/lib/table/controller/localization-methods.js';

describe('AMB table controller localization method group', () => {
    test('exposes exactly the flat localization controller methods', () => {
        const methods = createLocalizationMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'getLang',
            'getLocale',
            'setLocale'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('sets locale by delegating arguments unchanged without added side effects', () => {
        const result = { localized: true };
        const table = {
            setLocale: vi.fn()
                .mockReturnValueOnce(result)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(result)
                .mockReturnValueOnce(undefined),
            getLocale: vi.fn(),
            getLang: vi.fn(),
            redraw: vi.fn(),
            setData: vi.fn(),
            replaceData: vi.fn(),
            updateData: vi.fn(),
            setFilter: vi.fn(),
            clearFilter: vi.fn(),
            refreshFilter: vi.fn(),
            setPage: vi.fn(),
            setPageSize: vi.fn(),
            selectRow: vi.fn(),
            deselectRow: vi.fn()
        };
        const methods = createLocalizationMethods({ table });

        expect(methods.setLocale('it-it')).toBe(result);
        expect(table.setLocale).toHaveBeenCalledOnce();
        expect(table.setLocale).toHaveBeenLastCalledWith('it-it');

        expect(methods.setLocale('it')).toBeUndefined();
        expect(table.setLocale).toHaveBeenCalledTimes(2);
        expect(table.setLocale).toHaveBeenLastCalledWith('it');

        expect(methods.setLocale('')).toBe(result);
        expect(table.setLocale).toHaveBeenCalledTimes(3);
        expect(table.setLocale).toHaveBeenLastCalledWith('');
        expect(table.setLocale.mock.calls[2][0]).toBe('');

        expect(methods.setLocale(true)).toBeUndefined();
        expect(table.setLocale).toHaveBeenCalledTimes(4);
        expect(table.setLocale).toHaveBeenLastCalledWith(true);
        expect(table.setLocale.mock.calls[3][0]).toBe(true);
        expect(table.getLocale).not.toHaveBeenCalled();
        expect(table.getLang).not.toHaveBeenCalled();
        expect(table.redraw).not.toHaveBeenCalled();
        expect(table.setData).not.toHaveBeenCalled();
        expect(table.replaceData).not.toHaveBeenCalled();
        expect(table.updateData).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(table.refreshFilter).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.setPageSize).not.toHaveBeenCalled();
        expect(table.selectRow).not.toHaveBeenCalled();
        expect(table.deselectRow).not.toHaveBeenCalled();
    });

    test('returns the current locale without reading browser or option state', () => {
        const table = {
            options: {
                locale: 'initial'
            },
            getLocale: vi.fn()
                .mockReturnValueOnce('it-it')
                .mockReturnValueOnce(''),
            setLocale: vi.fn(),
            getLang: vi.fn()
        };
        const methods = createLocalizationMethods({ table });

        expect(methods.getLocale()).toBe('it-it');
        expect(table.getLocale).toHaveBeenCalledOnce();
        expect(table.getLocale).toHaveBeenLastCalledWith();

        table.options.locale = 'changed';
        expect(methods.getLocale()).toBe('');
        expect(table.getLocale).toHaveBeenCalledTimes(2);
        expect(table.getLocale).toHaveBeenLastCalledWith();
        expect(table.setLocale).not.toHaveBeenCalled();
        expect(table.getLang).not.toHaveBeenCalled();
    });

    test('returns the current language object without cloning or filtering properties', () => {
        const pagination = {
            first: 'Prima',
            last: 'Ultima'
        };
        const lang = {
            columns: {
                name: 'Nome'
            },
            pagination,
            custom: {
                applicationName: 'Gestionale'
            },
            formatter: () => 'ok'
        };
        const table = {
            getLang: vi.fn(() => lang),
            getLocale: vi.fn(),
            setLocale: vi.fn(),
            getSavePayload: vi.fn()
        };
        const methods = createLocalizationMethods({ table });
        const returned = methods.getLang();

        expect(returned).toBe(lang);
        expect(returned.pagination).toBe(pagination);
        expect(returned.custom).toBe(lang.custom);
        expect(returned.formatter).toBe(lang.formatter);
        expect(returned.columns).toBe(lang.columns);
        expect(returned.custom.applicationName).toBe('Gestionale');
        expect(table.getLang).toHaveBeenCalledOnce();
        expect(table.getLang).toHaveBeenCalledWith();
        expect(table.getLocale).not.toHaveBeenCalled();
        expect(table.setLocale).not.toHaveBeenCalled();
        expect(table.getSavePayload).not.toHaveBeenCalled();
    });
});
