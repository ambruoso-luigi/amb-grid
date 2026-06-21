import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const source = readFileSync(
    new URL('../src/demo/dates.js', import.meta.url),
    'utf8'
);

describe('Dates demo integration', () => {
    test('uses a closed disclosure and a custom validation toolbar action', () => {
        expect(source).toContain(
            '<summary class="demo-disclosure__summary">Supported behavior</summary>'
        );
        expect(source).not.toContain('<details class="demo-disclosure" open>');
        expect(source).toContain("id: 'validate-dates'");
        expect(source).toContain("label: 'Validate dates'");
        expect(source).not.toContain('id="action-validate-dates"');
    });

    test('opens the shared report dialog instead of writing fixed output', () => {
        expect(source).toContain(
            "import { createDemoReportDialog } from './utils/demo-report-dialog.js'"
        );
        expect(source).toContain("title: 'Date validation report'");
        expect(source).toContain('reportText: buildDateReport(result)');
        expect(source).toContain('jsonData: result');
        expect(source).not.toContain('id="dates-output"');
        expect(source).not.toContain('output.textContent');
    });
});
