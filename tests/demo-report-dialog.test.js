import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const readSource = relativePath => {
    return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
};

describe('demo report dialog integration', () => {
    test('opens on Report and switches between Report and JSON views', () => {
        const source = readSource('../src/demo/utils/demo-report-dialog.js');

        expect(source).toContain("reportButton.textContent = 'Report'");
        expect(source).toContain("jsonButton.textContent = 'JSON'");
        expect(source).toContain("const showReport = () => setView('report')");
        expect(source).toContain("const showJson = () => setView('json')");
        expect(source).toContain("setView('report');");
        expect(source).toContain('report.hidden = !showReport');
        expect(source).toContain('json.hidden = showReport');
        expect(source).toContain('JSON.stringify(jsonData, null, 2)');
        expect(source).toContain("panel.setAttribute('role', 'dialog')");
        expect(source).toContain("panel.setAttribute('aria-modal', 'true')");
        expect(source).not.toContain('Summary');
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

        const saveHandler = source.slice(source.indexOf('async function handleSave()'));

        expect(saveHandler).not.toContain('reportDialog.open');
        expect(saveHandler).toContain("message: 'Save cancelled.'");
    });

    test('uses the same Report/JSON dialog in Validation', () => {
        const source = readSource('../src/demo/validation.js');

        expect(source).toContain(
            "import { createDemoReportDialog } from './utils/demo-report-dialog.js'"
        );
        expect(source).not.toContain('const createReportDialog');
        expect(source).not.toContain('validation-report-dialog__tabs');
        expect(source).not.toContain("textContent = 'Summary'");
        expect(source).not.toContain('Summary');
    });

    test('keeps report dialog styling in demo CSS only', () => {
        const demoCss = readSource('../src/demo/demo.css');
        const libraryCss = readSource('../src/amb-grid.css');

        expect(demoCss).toContain('.demo-report-dialog__report');
        expect(demoCss).toContain('.demo-report-dialog__json');
        expect(demoCss).toContain('.demo-report-dialog__tab.is-active');
        expect(demoCss).toContain('.demo-report-dialog__report[hidden]');
        expect(libraryCss).not.toContain('.demo-report-dialog');
    });

    test('preserves AMB row parity and restores the previous zebra color', () => {
        const libraryCss = readSource('../src/amb-grid.css');

        expect(libraryCss).toContain('--amb-row-clean-alt-bg: #f7f8fa');
        expect(libraryCss).toContain('[data-amb-row-parity="odd"]');
        expect(libraryCss).toContain('[data-amb-row-parity="even"]');
        expect(libraryCss).not.toContain('.tabulator-row-even');
        expect(libraryCss).not.toContain('.tabulator-row-odd');
        expect(libraryCss).not.toMatch(/nth-child\s*\(/);
    });
});
