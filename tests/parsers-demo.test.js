import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { parsers } from '../src/lib/parsers.js';
import { parserRowCopy } from '../src/demo/example-copy.js';

const source = readFileSync(
    new URL('../src/demo/parsers.js', import.meta.url),
    'utf8'
);

describe('Public Parsers demo integration', () => {
    test('is a real compact AMB Grid with nine transformation rows', () => {
        const data = source.match(/const parserExamples = \[([\s\S]*?)\n\];/)[1];

        expect(source).toContain('demo = AMB.table({');
        expect(source).toContain("selector: '#parsers-table'");
        expect(source).toContain('toolbar: {');
        expect(source).toContain('buttons: [commandGuideToolbar.button]');
        expect(source).toContain("layout: 'fitColumns'");
        expect(source).toContain('class="demo-table-workbench"');
        expect(source).toContain('demo-business-grid--viewport');
        expect(data.match(/\{ id: \d+/g)).toHaveLength(9);
        expect(data).not.toContain('12.34,56');
    });

    test('uses only real public parser factories demonstrated by the rows', () => {
        [
            'decimalToPayload',
            'integerToPayload',
            'dateToPayload',
            'dateTimeToPayload',
            'timeToPayload',
            'booleanToPayload',
            'emptyToNull',
            'custom'
        ].forEach(name => {
            expect(source).toContain(`AMB.parsers.${name}`);
        });
    });

    test('produces the expected initial normalized values, including a real null', () => {
        expect(parsers.decimalToPayload().parse('-123.123,01')).toBe('-123123.01');
        expect(parsers.integerToPayload().parse('1.234')).toBe('1234');
        expect(parsers.dateToPayload().parse('16/06/2026')).toBe('2026-06-16');
        expect(parsers.dateToPayload().parse('20260616')).toBe('2026-06-16');
        expect(parsers.dateTimeToPayload().parse('16/06/2026 14:30')).toBe('2026-06-16 14:30:00');
        expect(parsers.timeToPayload().parse('9:05')).toBe('09:05:00');
        expect(parsers.booleanToPayload({ trueValue: 'Y', falseValue: 'N' }).parse(true)).toBe('Y');
        expect(parsers.emptyToNull().parse('   ')).toBeNull();
        expect(parsers.custom(value => String(value ?? '').trim().toUpperCase().replace(/\s+/g, '_') || null).parse('Main warehouse')).toBe('MAIN_WAREHOUSE');
        expect(source).toContain('const descriptionParser = AMB.parsers.custom(normalizeDescription)');
        expect(source).toContain("input: 'Main warehouse'");
        expect(source).toContain("parserKey: 'custom'");
        expect(source).toContain("text.toUpperCase().replace(/\\s+/g, '_')");
        expect(source).not.toMatch(/AMB\.parsers\.(trim|uppercase|removeSpaces|digitsOnly|ibanToPayload|fiscalCodeToPayload)/);
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

        expect(inputColumn).toContain('editor: textParserEditor');
        expect(inputColumn).toContain('cellClick: (event, cell) =>');
        expect(inputColumn).toContain('cellEdited: handleInputEdited');
        expect(parsedColumn).toContain('editable: false');
        expect(parsedColumn).toContain('formatter: formatParsedValue');
        expect(source).toContain('demo.updateRow(rowData.id, { parsedValue })');
        expect(source).not.toContain('demo.crud');
        expect(source).not.toContain('crud.updateRowFields');
        expect(source).toContain("output.textContent = value === null ? 'null'");
        expect(source).toContain('parsedValue: parseExampleValue(example)');
        expect(source).not.toContain('parsedValue: String(');
    });

    test('toggles Boolean rows through the shared checkbox formatter and cell click', () => {
        expect(source).toContain('const formatBooleanInput = createDemoCheckboxFormatter()');
        expect(source).toContain("editable: cell => cell.getRow().getData().id !== 7");
        expect(source).toContain("parserKey !== 'boolean'");
        expect(source).toContain('cell.setValue(!cell.getValue())');
        expect(source).not.toContain('booleanParserEditor');
        expect(source).toContain('input: true');
        expect(source).not.toContain("input: 'true'");
        expect(source).not.toContain("input: 'false'");
        expect(parsers.booleanToPayload({ trueValue: 'Y', falseValue: 'N' }).parse(true))
            .toBe('Y');
        expect(parsers.booleanToPayload({ trueValue: 'Y', falseValue: 'N' }).parse(false))
            .toBe('N');
    });

    test('uses the shared bilingual column guide and explains parser boundaries', () => {
        expect(source).toContain("import { createDemoColumnGuide } from './utils/demo-column-guide.js'");
        expect(source).toContain("summaryKey: 'examples.parsers.detailsTitle'");
        expect(source).toContain("descriptionKey: 'guides.parsers.output.description'");
        expect(source).toContain('validation and business rules remain separate responsibilities');
        expect(source).toContain("window.addEventListener('amb-demo-language-change'");
        expect(source).toContain("window.removeEventListener('amb-demo-language-change'");
    });

    test('emphasizes only the application-defined part of the custom parser description', () => {
        const descriptionFormatter = source.slice(
            source.indexOf('const formatParserDescription'),
            source.indexOf('const formatParsedValue')
        );

        expect(source).toContain("parserKey: 'custom'");
        for (const language of ['it', 'en']) {
            const [, description, emphasis] = parserRowCopy[language].custom;
            expect(emphasis).toBeTruthy();
            expect(description).toContain(emphasis);
        }
        expect(descriptionFormatter).toContain("accent.className = 'demo-text-accent'");
        expect(descriptionFormatter).toContain('document.createElement(\'span\')');
        expect(descriptionFormatter).toContain('document.createTextNode(');
        expect(descriptionFormatter).not.toContain('innerHTML');
    });

    test('keeps the parser columns readable while widening Description', () => {
        const gridColumns = source.slice(source.indexOf('columns: [', source.indexOf('demo = AMB.table({')));
        const widths = Object.fromEntries(['Type', 'Input', 'Parsed value', 'Description'].map(title => {
            const column = gridColumns.match(new RegExp(`title:\\s*'${title}'[\\s\\S]*?(?=title:\\s*'|\\n\\s*\\]\\s*\\n)`))?.[0];
            expect(column).toBeDefined();
            const min = Number(column.match(/\bminWidth:\s*(\d+)/)?.[1]);
            const grow = Number(column.match(/\bwidthGrow:\s*([\d.]+)/)?.[1]);
            expect(Number.isFinite(min) && Number.isFinite(grow)).toBe(true);
            return [title, { min, grow }];
        }));
        expect(widths.Description.min).toBeGreaterThan(widths.Input.min);
        expect(widths.Description.grow).toBeGreaterThan(widths.Input.grow);
        expect(widths.Description.grow).toBeGreaterThan(widths['Parsed value'].grow);
        expect(widths.Input.min).toBeGreaterThanOrEqual(widths.Type.min);
    });

    test('keeps the Italian parser input guide free of mojibake', () => {
        const guideCopy = readFileSync(
            new URL('../src/demo/demo-column-guide-copy.js', import.meta.url),
            'utf8'
        );

        expect(guideCopy).toContain("Valore inserito dall'utente. Nella riga Booleano utilizza una checkbox.");
        expect(guideCopy).not.toContain('dallâ€™utente');
    });
});
