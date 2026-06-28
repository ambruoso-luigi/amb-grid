import { describe, expect, test, vi } from 'vitest';
import { date as createDateEditor } from '../src/lib/editors/date-editor.js';
import {
    decimal as createDecimalEditor,
    integer as createIntegerEditor
} from '../src/lib/editors/number-editors.js';
import { formatters } from '../src/lib/formatters.js';
import { applyDefaultColumnAlignments } from '../src/lib/table/table-factory.js';

vi.mock('vanillajs-datepicker/Datepicker', () => ({
    default: class DatepickerMock {}
}));

describe('AMB default column alignments', () => {
    test('columns with AMB integer editors align right by default', () => {
        const [column] = applyDefaultColumnAlignments([
            { field: 'quantity', editor: createIntegerEditor() }
        ]);

        expect(column.hozAlign).toBe('right');
    });

    test('columns with AMB decimal editors align right by default', () => {
        const [column] = applyDefaultColumnAlignments([
            { field: 'amount', editor: createDecimalEditor() }
        ]);

        expect(column.hozAlign).toBe('right');
    });

    test.each([
        ['integer', formatters.integer()],
        ['decimal', formatters.decimal()],
        ['currency', formatters.currency()],
        ['percent', formatters.percent()],
        ['percentFromRatio', formatters.percentFromRatio(3)]
    ])('columns with AMB %s formatters align right by default', (_name, formatter) => {
        const [column] = applyDefaultColumnAlignments([
            { field: 'value', formatter }
        ]);

        expect(column.hozAlign).toBe('right');
    });

    test('columns with AMB date editors align center by default', () => {
        const [column] = applyDefaultColumnAlignments([
            { field: 'checkDate', editor: createDateEditor() }
        ]);

        expect(column.hozAlign).toBe('center');
    });

    test('columns with AMB date formatters align center by default', () => {
        const [column] = applyDefaultColumnAlignments([
            { field: 'createdAt', formatter: formatters.date() }
        ]);

        expect(column.hozAlign).toBe('center');
    });

    test('numeric columns keep explicit user hozAlign values', () => {
        const [column] = applyDefaultColumnAlignments([
            {
                field: 'quantity',
                editor: createIntegerEditor(),
                hozAlign: 'left'
            }
        ]);

        expect(column.hozAlign).toBe('left');
    });

    test('date columns keep explicit user hozAlign values', () => {
        const [column] = applyDefaultColumnAlignments([
            {
                field: 'checkDate',
                formatter: formatters.date(),
                hozAlign: 'right'
            }
        ]);

        expect(column.hozAlign).toBe('right');
    });

    test('plain columns do not receive automatic hozAlign', () => {
        const [column] = applyDefaultColumnAlignments([
            { field: 'name', editor: () => {} }
        ]);

        expect(column).not.toHaveProperty('hozAlign');
    });

    test('nested columns receive default alignments recursively', () => {
        const [group] = applyDefaultColumnAlignments([
            {
                title: 'Metrics',
                columns: [
                    { field: 'ratio', formatter: formatters.percentFromRatio(3) },
                    { field: 'label', formatter: formatters.text() },
                    { field: 'date', editor: createDateEditor() }
                ]
            }
        ]);

        expect(group).not.toHaveProperty('hozAlign');
        expect(group.columns[0].hozAlign).toBe('right');
        expect(group.columns[1]).not.toHaveProperty('hozAlign');
        expect(group.columns[2].hozAlign).toBe('center');
    });
});
