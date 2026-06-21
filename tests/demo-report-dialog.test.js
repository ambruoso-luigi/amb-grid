import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const readSource = relativePath => {
    return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
};

describe('demo report dialog integration', () => {
    test('renders Report before JSON in one demo-only dialog', () => {
        const source = readSource('../src/demo/utils/demo-report-dialog.js');
        const reportAppend = source.indexOf(
            'reportSection.append(reportTitle, report);'
        );
        const jsonAppend = source.indexOf(
            'jsonSection.append(jsonTitle, json);'
        );
        const contentAppend = source.indexOf(
            'content.append(reportSection, jsonSection);'
        );

        expect(reportAppend).toBeGreaterThan(-1);
        expect(jsonAppend).toBeGreaterThan(reportAppend);
        expect(contentAppend).toBeGreaterThan(jsonAppend);
        expect(source).toContain("reportTitle.textContent = 'Report'");
        expect(source).toContain("jsonTitle.textContent = 'JSON'");
        expect(source).toContain('JSON.stringify(jsonData, null, 2)');
        expect(source).toContain("panel.setAttribute('role', 'dialog')");
        expect(source).toContain("panel.setAttribute('aria-modal', 'true')");
    });

    test('uses the shared dialog for Basic CRUD show actions', () => {
        const source = readSource('../src/demo/basic-crud.js');

        expect(source).toContain(
            "import { createDemoReportDialog } from './utils/demo-report-dialog.js'"
        );
        expect(source).not.toContain('id="basic-output"');
        expect(source).not.toContain('output.textContent = JSON.stringify');
        expect(source).toContain("title: 'Save payload'");
        expect(source).toContain("title: 'Basic CRUD report'");
        expect(source).toContain("title: 'Selected rows'");
    });

    test('uses the same dialog in Validation without Summary or JSON tabs', () => {
        const source = readSource('../src/demo/validation.js');

        expect(source).toContain(
            "import { createDemoReportDialog } from './utils/demo-report-dialog.js'"
        );
        expect(source).not.toContain('const createReportDialog');
        expect(source).not.toContain('validation-report-dialog__tabs');
        expect(source).not.toContain("textContent = 'Summary'");
        expect(source).not.toContain("}, 'json')");
    });

    test('keeps report dialog styling in demo CSS only', () => {
        const demoCss = readSource('../src/demo/demo.css');
        const libraryCss = readSource('../src/amb-grid.css');

        expect(demoCss).toContain('.demo-report-dialog__report');
        expect(demoCss).toContain('.demo-report-dialog__json');
        expect(libraryCss).not.toContain('.demo-report-dialog');
    });
});
