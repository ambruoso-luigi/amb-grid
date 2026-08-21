import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { checkbox as createCheckboxEditor } from '../src/lib/editors/checkbox-editor.js';
import { prepareCheckboxColumns } from '../src/lib/table/table-factory.js';

const createTarget = ({
    editorTarget = false,
    field = 'requiresInspection'
} = {}) => {
    const cellElement = {
        getAttribute: name => (name === 'tabulator-field' ? field : null)
    };

    return {
        closest: vi.fn(selector => {
            if (selector === '.amb-checkbox-editor') {
                return editorTarget ? {} : null;
            }

            if (selector === '.tabulator-cell') {
                return cellElement;
            }

            return null;
        })
    };
};

const createMouseEvent = (
    target = createTarget(),
    { onDefaultAction } = {}
) => {
    let defaultPrevented = false;

    return {
        button: 0,
        target,
        preventDefault: vi.fn(() => {
            defaultPrevented = true;
        }),
        stopPropagation: vi.fn(),
        stopImmediatePropagation: vi.fn(),
        isDefaultPrevented: () => defaultPrevented,
        runDefaultAction: () => {
            if (!defaultPrevented) {
                onDefaultAction?.();
            }
        }
    };
};

const createCell = ({
    field = 'requiresInspection',
    state = 'clean',
    value = false
} = {}) => ({
    getField: () => field,
    getRow: () => ({
        getData: () => ({
            _state: state
        })
    }),
    getValue: vi.fn(() => value),
    setValue: vi.fn(nextValue => {
        value = nextValue;
    })
});

describe('AMB checkbox column cell toggle', () => {
    const originalDocument = globalThis.document;
    let clickHandler;

    beforeEach(() => {
        clickHandler = null;
        globalThis.document = {
            addEventListener: vi.fn((type, handler) => {
                if (type === 'click') {
                    clickHandler = handler;
                }
            }),
            removeEventListener: vi.fn()
        };
    });

    afterEach(() => {
        globalThis.document = originalDocument;
        vi.restoreAllMocks();
    });

    test('adds whole-cell mouse toggle only to AMB cbox columns', () => {
        const [plainColumn, checkboxColumn] = prepareCheckboxColumns([
            {
                field: 'name',
                editor: () => {}
            },
            {
                field: 'requiresInspection',
                editor: createCheckboxEditor()
            }
        ]);

        expect(plainColumn.cellMouseDown).toBeUndefined();
        expect(checkboxColumn.cellMouseDown).toEqual(expect.any(Function));
    });

    test('clicking the cbox cell toggles every time and records the final value through Tabulator', () => {
        const [column] = prepareCheckboxColumns([
            {
                field: 'requiresInspection',
                editor: createCheckboxEditor()
            }
        ]);
        const cell = createCell({ value: false });

        column.cellMouseDown(createMouseEvent(), cell);
        column.cellMouseDown(createMouseEvent(), cell);
        column.cellMouseDown(createMouseEvent(), cell);

        expect(cell.setValue).toHaveBeenNthCalledWith(1, true, true);
        expect(cell.setValue).toHaveBeenNthCalledWith(2, false, true);
        expect(cell.setValue).toHaveBeenNthCalledWith(3, true, true);
    });

    test('uses custom cbox checked and unchecked values', () => {
        const [column] = prepareCheckboxColumns([
            {
                field: 'approved',
                editor: createCheckboxEditor({
                    checkedValue: 'Y',
                    uncheckedValue: 'N'
                })
            }
        ]);
        const cell = createCell({
            field: 'approved',
            value: 'N'
        });

        column.cellMouseDown(createMouseEvent(createTarget({ field: 'approved' })), cell);
        column.cellMouseDown(createMouseEvent(createTarget({ field: 'approved' })), cell);

        expect(cell.setValue).toHaveBeenNthCalledWith(1, 'Y', true);
        expect(cell.setValue).toHaveBeenNthCalledWith(2, 'N', true);
    });

    test('preserves the cell mousedown lifecycle and suppresses only the follow-up click', () => {
        const [column] = prepareCheckboxColumns([
            {
                field: 'requiresInspection',
                editor: createCheckboxEditor()
            }
        ]);
        const cell = createCell();
        const mouseDownEvent = createMouseEvent();

        column.cellMouseDown(mouseDownEvent, cell);

        expect(mouseDownEvent.preventDefault).not.toHaveBeenCalled();
        expect(mouseDownEvent.stopPropagation).not.toHaveBeenCalled();
        expect(mouseDownEvent.stopImmediatePropagation).not.toHaveBeenCalled();
        expect(globalThis.document.addEventListener).toHaveBeenCalledWith(
            'click',
            expect.any(Function),
            true
        );

        const clickEvent = createMouseEvent();

        clickHandler(clickEvent);

        expect(globalThis.document.removeEventListener).toHaveBeenCalledWith(
            'click',
            clickHandler,
            true
        );
        expect(clickEvent.preventDefault).toHaveBeenCalledOnce();
        expect(clickEvent.stopPropagation).toHaveBeenCalledOnce();
        expect(clickEvent.stopImmediatePropagation).toHaveBeenCalledOnce();
    });

    test('allows the clicked checkbox cell to become the active focused cell', () => {
        const [column] = prepareCheckboxColumns([
            {
                field: 'requiresInspection',
                editor: createCheckboxEditor()
            }
        ]);
        const previousCell = { id: 'previous' };
        const checkboxCell = createCell();
        let activeCell = previousCell;
        const mouseDownEvent = createMouseEvent(createTarget(), {
            onDefaultAction: () => {
                activeCell = checkboxCell;
            }
        });

        column.cellMouseDown(mouseDownEvent, checkboxCell);
        mouseDownEvent.runDefaultAction();

        expect(checkboxCell.setValue).toHaveBeenCalledWith(true, true);
        expect(mouseDownEvent.isDefaultPrevented()).toBe(false);
        expect(activeCell).toBe(checkboxCell);
    });

    test('does not toggle while the real cbox editor target is handling the click', () => {
        const originalCellMouseDown = vi.fn();
        const [column] = prepareCheckboxColumns([
            {
                field: 'requiresInspection',
                editor: createCheckboxEditor(),
                cellMouseDown: originalCellMouseDown
            }
        ]);
        const cell = createCell();
        const event = createMouseEvent(createTarget({ editorTarget: true }));

        column.cellMouseDown(event, cell);

        expect(cell.setValue).not.toHaveBeenCalled();
        expect(originalCellMouseDown).toHaveBeenCalledWith(event, cell);
    });

    test('does not toggle deleted rows', () => {
        const [column] = prepareCheckboxColumns(
            [
                {
                    field: 'requiresInspection',
                    editor: createCheckboxEditor()
                }
            ],
            () => ({
                options: {
                    stateField: '_state'
                }
            })
        );
        const cell = createCell({ state: 'deleted' });

        column.cellMouseDown(createMouseEvent(), cell);

        expect(cell.setValue).not.toHaveBeenCalled();
    });
});
