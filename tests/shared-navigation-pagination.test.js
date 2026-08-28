import { afterEach, describe, expect, test, vi } from 'vitest';
import { navigateEditableCellAfterClose } from '../src/lib/editors/shared.js';
import { registerPageNavigationCoordinator } from '../src/lib/table/page-navigation-coordinator.js';

const flushNavigation = () => new Promise(resolve => setTimeout(resolve, 0));

const createCell = ({ row, edit = vi.fn(), navigateNext, navigatePrev, element } = {}) => ({
    getRow: () => row,
    getColumn: () => ({ isVisible: () => true, getDefinition: () => ({ editor: edit }) }),
    edit,
    navigateNext,
    navigatePrev,
    getElement: () => element || { closest: () => null }
});

afterEach(() => {
    delete globalThis.document;
    delete globalThis.Node;
});

describe('editable navigation across pagination boundaries', () => {
    test('keeps normal navigation inside the current page', async () => {
        const nextEdit = vi.fn();
        let startCell;
        const nextCell = createCell({ edit: nextEdit });
        const row = { getCells: () => [startCell, nextCell] };
        startCell = createCell({ row });

        navigateEditableCellAfterClose(startCell, 'next');
        await flushNavigation();

        expect(nextEdit).toHaveBeenCalledOnce();
    });

    test.each([
        ['next', 1, 'first'],
        ['prev', 2, 'last']
    ])('delegates %s page boundaries to one coordinator', async (direction, page, destination) => {
        let startCell;
        const row = { getCells: () => [startCell] };
        const table = {
            getPage: () => page,
            getPageMax: () => 2,
            navigateNext: vi.fn(() => false),
            navigatePrev: vi.fn(() => false)
        };
        const transitionPage = vi.fn();
        const unregister = registerPageNavigationCoordinator(table, { transitionPage });
        startCell = createCell({
            row,
            navigateNext: vi.fn(() => false),
            navigatePrev: vi.fn(() => false)
        });
        startCell.getTable = () => table;

        navigateEditableCellAfterClose(startCell, direction);
        await flushNavigation();

        expect(transitionPage).toHaveBeenCalledWith({ direction, destination });
        unregister();
    });

    test.each([
        ['next', 2, 4],
        ['prev', 1, 2]
    ])('moves focus outside at the absolute %s boundary', async (direction, page, position) => {
        const outside = { focus: vi.fn() };
        const grid = {
            contains: () => false,
            compareDocumentPosition: () => position
        };
        const element = { closest: () => grid };
        let startCell;
        const row = { getCells: () => [startCell] };
        const table = {
            getPage: () => page,
            getPageMax: () => 2,
            navigateNext: vi.fn(() => false),
            navigatePrev: vi.fn(() => false)
        };
        startCell = createCell({
            row,
            element,
            navigateNext: vi.fn(() => false),
            navigatePrev: vi.fn(() => false)
        });
        startCell.getTable = () => table;
        globalThis.document = { querySelectorAll: () => [outside], activeElement: null };
        globalThis.Node = {
            DOCUMENT_POSITION_PRECEDING: 2,
            DOCUMENT_POSITION_FOLLOWING: 4
        };

        navigateEditableCellAfterClose(startCell, direction);
        await flushNavigation();

        expect(outside.focus).toHaveBeenCalledOnce();
    });
});
