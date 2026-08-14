import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { parsers } from '../src/lib/parsers.js';

const source = readFileSync(
    new URL('../src/demo/parsers.js', import.meta.url),
    'utf8'
);

describe('Public Parsers demo integration', () => {
    test('is a real compact AMB Grid with ten transformation rows', () => {
        const data = source.match(/const parserExamples = \[([\s\S]*?)\n\];/)[1];

        expect(source).toContain('const demo = AMB.table({');
        expect(source).toContain("selector: '#parsers-table'");
        expect(source).toContain('toolbar: false');
        expect(source).toContain("layout: 'fitColumns'");
        expect(source).toContain('class="demo-table-workbench"');
        expect(source).toContain('demo-business-grid--viewport');
        expect(data.match(/\{ id: \d+/g)).toHaveLength(10);
        expect(data).not.toContain('12.34,56');
    });

    test('uses only real public parser factories demonstrated by the rows', () => {
        [
            'decimalToPayload',
            'integerToPayload',
            'dateToPayload',
            'dateTimeToPayload',
            'ibanToPayload',
            'fiscalCodeToPayload',
            'digitsOnly',
            'emptyToNull',
            'trim'
        ].forEach(name => {
            expect(source).toContain(`AMB.parsers.${name}()`);
        });
    });

    test('produces the expected initial normalized values, including a real null', () => {
        expect(parsers.decimalToPayload().parse('-123.123,01')).toBe('-123123.01');
        expect(parsers.integerToPayload().parse('1.234')).toBe('1234');
        expect(parsers.dateToPayload().parse('16/06/2026')).toBe('2026-06-16');
        expect(parsers.dateToPayload().parse('20260616')).toBe('2026-06-16');
        expect(parsers.dateTimeToPayload().parse('16/06/2026 14:30')).toBe('2026-06-16 14:30:00');
        expect(parsers.ibanToPayload().parse('it60 x054 2811 1010 0000 0123 456'))
            .toBe('IT60X0542811101000000123456');
        expect(parsers.fiscalCodeToPayload().parse('rss mra 80a01 h501u'))
            .toBe('RSSMRA80A01H501U');
        expect(parsers.digitsOnly().parse('Tel. 071-123456')).toBe('071123456');
        expect(parsers.emptyToNull().parse('   ')).toBeNull();
        expect(parsers.trim().parse('  payload note  ')).toBe('payload note');
    });

    test('updates a readonly Parsed value from editable Input without stringifying null', () => {
        const inputColumn = source.slice(
            source.indexOf("title: 'Input', field: 'input'"),
            source.indexOf("title: 'Parsed value', field: 'parsedValue'")
        );
        const parsedColumn = source.slice(
            source.indexOf("title: 'Parsed value', field: 'parsedValue'"),
            source.indexOf("title: 'Description', field: 'description'")
        );

        expect(inputColumn).toContain('editor: AMB.editors.text');
        expect(inputColumn).toContain('cellEdited: handleInputEdited');
        expect(parsedColumn).toContain('editable: false');
        expect(parsedColumn).toContain('formatter: formatParsedValue');
        expect(source).toContain('demo.crud.updateRowFields(rowData.id, { parsedValue })');
        expect(source).toContain("output.textContent = value === null ? 'null'");
        expect(source).toContain('parsedValue: parseExampleValue(example)');
        expect(source).not.toContain('parsedValue: String(');
    });

    test('uses the shared bilingual column guide and explains parser boundaries', () => {
        expect(source).toContain("import { createDemoColumnGuide } from './utils/demo-column-guide.js'");
        expect(source).toContain("summaryKey: 'examples.parsers.detailsTitle'");
        expect(source).toContain("descriptionKey: 'guides.parsers.output.description'");
        expect(source).toContain('they do not replace validation or business rules');
        expect(source).toContain("window.addEventListener('amb-demo-language-change'");
        expect(source).toContain("window.removeEventListener('amb-demo-language-change'");
    });
});
