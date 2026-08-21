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

const createMouseEvent = (target = createTarget()) => ({
    button: 0,
    target,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    stopImmediatePropagation: vi.fn()
});

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

    test('suppresses the follow-up click on the same cbox cell to avoid double toggle', () => {
        const [column] = prepareCheckboxColumns([
            {
                field: 'requiresInspection',
                editor: createCheckboxEditor()
            }
        ]);
        const cell = createCell();
        const mouseDownEvent = createMouseEvent();

        column.cellMouseDown(mouseDownEvent, cell);

        expect(mouseDownEvent.preventDefault).toHaveBeenCalledOnce();
        expect(mouseDownEvent.stopPropagation).toHaveBeenCalledOnce();
        expect(mouseDownEvent.stopImmediatePropagation).toHaveBeenCalledOnce();
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
