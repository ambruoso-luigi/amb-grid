import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const source = readFileSync(
    new URL('../src/demo/dates.js', import.meta.url),
    'utf8'
);

describe('Public Dates demo integration', () => {
    test('uses the shared public-demo structure and standard Validate toolbar action', () => {
        expect(source).toContain("import { createDemoColumnGuide } from './utils/demo-column-guide.js'");
        expect(source).toContain("summaryKey: 'examples.dates.detailsTitle'");
        expect(source).toContain('class="demo-table-workbench"');
        expect(source).toContain('class="demo-business-grid demo-business-grid--viewport"');
        expect(source).toContain("buttons: ['validate']");
        expect(source).toContain('onValidate: handleValidateDates');
        expect(source).toContain("validateLabel.dataset.i18n = 'examples.dates.validate'");
        expect(source).not.toContain("id: 'validate-dates'");
        expect(source).not.toContain("height: '320px'");
    });

    test('keeps five real date configurations, including both datepicker modes', () => {
        expect(source.match(/AMB\.date\.createConfig\(/g)).toHaveLength(5);
        expect(source).toContain("format: 'dd/mm/yyyy'");
        expect(source).toContain("format: 'iso'");
        expect(source).toContain("format: 'legacy'");
        expect(source).toContain("format: 'dd-mm-yyyy'");
        expect(source).toContain("mode: 'manualWithPickerButton'");
        expect(source).toContain("mode: 'pickerOnly'");
        expect(source.match(/AMB\.editors\.date\(/g)).toHaveLength(5);
        expect(source.match(/AMB\.formatters\.date\(/g)).toHaveLength(5);
        expect(source).toContain("const minDate = '2025-01-01'");
        expect(source).toContain("const maxDate = '2027-12-31'");
    });

    test('starts with ten valid populated rows', () => {
        const data = source.match(/const dateData = \[([\s\S]*?)\n\];/)[1];

        expect(data.match(/\{ id: \d+/g)).toHaveLength(10);
        expect(data).not.toContain("manualDate: ''");
        expect(data).not.toContain("pickerDate: ''");
        expect(data).not.toContain("isoDate: ''");
        expect(data).not.toContain("compactDate: ''");
        expect(data).not.toContain("pickerOnlyDate: ''");
    });

    test('opens the shared bilingual report dialog instead of fixed output', () => {
        expect(source).toContain(
            "import { createDemoReportDialog } from './utils/demo-report-dialog.js'"
        );
        expect(source).toContain("title: reportCopy[getLanguage()].title");
        expect(source).toContain('reportText: buildDateReport(result)');
        expect(source).toContain('jsonData: result');
        expect(source).not.toContain('id="dates-output"');
    });
});
