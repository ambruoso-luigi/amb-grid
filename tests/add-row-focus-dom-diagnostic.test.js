import { describe, expect, test } from 'vitest';

const hasUsableDom = () => {
    return Boolean(
        globalThis.document
        && globalThis.HTMLElement
        && globalThis.Node
        && typeof globalThis.document.createElement === 'function'
        && globalThis.document.body
    );
};

const formatDiagnosticReport = report => {
    return [
        `case: ${report.caseName}`,
        `activeElement.tagName: ${report.activeTagName}`,
        `activeElement.className: ${report.activeClassName}`,
        `activeElement.ariaLabel: ${report.activeAriaLabel}`,
        `activeElementInsideActionButton: ${report.activeInsideActionButton}`,
        `activeElementInsideTabulatorCell: ${report.activeInsideTabulatorCell}`,
        `activeCellField: ${report.activeCellField}`,
        `newRowExists: ${report.newRowExists}`,
        `itemCodeCellExists: ${report.itemCodeCellExists}`,
        `itemCodeCellEditing: ${report.itemCodeCellEditing}`,
        `itemCodeEditorExists: ${report.itemCodeEditorExists}`,
        `itemCodeEditorIsActiveElement: ${report.itemCodeEditorIsActiveElement}`,
        `itemCodeCellContainsActiveElement: ${report.itemCodeCellContainsActiveElement}`
    ].join('\n');
};

const createRows = count => {
    return Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        itemCode: `PRD-${String(index + 1).padStart(4, '0')}`,
        productName: `Product ${index + 1}`
    }));
};

const waitForTableBuilt = async table => {
    if (table.initialized) return;

    await new Promise(resolve => {
        table.on('tableBuilt', resolve);
    });
};

const createDiagnosticGrid = ({ AMB, pagination }) => {
    const host = document.createElement('div');
    const tableElement = document.createElement('div');

    document.body.appendChild(host);
    host.appendChild(tableElement);

    const grid = AMB.table({
        selector: tableElement,
        data: createRows(20),
        layout: 'fitColumns',
        pagination,
        paginationMode: 'local',
        paginationSize: 10,
        deleteColumn: {
            enabled: true,
            labels: {
                removeNew: 'Remove new row'
            }
        },
        toolbar: false,
        columns: [
            {
                title: 'Item code',
                field: 'itemCode',
                editor: AMB.editors.text()
            },
            {
                title: 'Product name',
                field: 'productName',
                editor: AMB.editors.text()
            }
        ]
    });

    return { grid, host };
};

const findNewRowElement = host => {
    return host.querySelector('.tabulator-row[data-state="new"]')
        || host.querySelector('.tabulator-row');
};

const collectFocusReport = ({ caseName, host }) => {
    const activeElement = document.activeElement;
    const actionButton = activeElement && typeof activeElement.closest === 'function'
        ? activeElement.closest('.amb-row-action-button')
        : null;
    const activeCell = activeElement && typeof activeElement.closest === 'function'
        ? activeElement.closest('.tabulator-cell')
        : null;
    const newRow = findNewRowElement(host);
    const itemCodeCell = newRow
        ? newRow.querySelector('.tabulator-cell[tabulator-field="itemCode"]')
        : null;
    const itemCodeEditor = itemCodeCell
        ? itemCodeCell.querySelector('input, textarea, select, [contenteditable="true"]')
        : null;

    return {
        caseName,
        activeTagName: activeElement ? activeElement.tagName : null,
        activeClassName: activeElement ? String(activeElement.className || '') : null,
        activeAriaLabel: activeElement ? activeElement.getAttribute('aria-label') : null,
        activeInsideActionButton: Boolean(actionButton),
        activeInsideTabulatorCell: Boolean(activeCell),
        activeCellField: activeCell ? activeCell.getAttribute('tabulator-field') : null,
        newRowExists: Boolean(newRow),
        itemCodeCellExists: Boolean(itemCodeCell),
        itemCodeCellEditing: Boolean(
            itemCodeCell && itemCodeCell.classList.contains('tabulator-editing')
        ),
        itemCodeEditorExists: Boolean(itemCodeEditor),
        itemCodeEditorIsActiveElement: Boolean(itemCodeEditor && itemCodeEditor === activeElement),
        itemCodeCellContainsActiveElement: Boolean(
            itemCodeCell && activeElement && itemCodeCell.contains(activeElement)
        )
    };
};

const assertFocusDiagnostic = report => {
    const formattedReport = formatDiagnosticReport(report);

    expect(
        report.activeInsideActionButton,
        `Focus landed on the action/remove button.\n${formattedReport}`
    ).toBe(false);
    expect(
        report.itemCodeEditorExists,
        `The itemCode cell did not open a real editor.\n${formattedReport}`
    ).toBe(true);
    expect(
        report.itemCodeEditorIsActiveElement || report.itemCodeCellContainsActiveElement,
        `The active element is not inside the itemCode editor/cell.\n${formattedReport}`
    ).toBe(true);
};

describe('diagnostic addRow DOM focus', () => {
    test('reports when a real DOM-backed Tabulator integration cannot run', () => {
        if (hasUsableDom()) {
            expect(hasUsableDom()).toBe(true);
            return;
        }

        console.warn([
            'addRow focus DOM diagnostic skipped:',
            'Vitest is running in the default Node environment, so document/HTMLElement/Node are not available.',
            'This repository does not currently install or configure jsdom/happy-dom.',
            'Without a browser-like DOM, Tabulator cannot render real rows/editors and document.activeElement cannot verify the reported focus bug.'
        ].join('\n'));

        expect(hasUsableDom()).toBe(false);
    });

    const describeWithDom = hasUsableDom() ? describe : describe.skip;

    describeWithDom('real Tabulator focus behavior', () => {
        test('diagnoses addRow focus with pagination and deleteColumn', async () => {
            const { AMB } = await import('../src/lib/amb.js');
            const { grid, host } = createDiagnosticGrid({ AMB, pagination: true });

            try {
                await waitForTableBuilt(grid.table);
                await grid.crud.addRow({
                    id: null,
                    itemCode: '',
                    productName: ''
                });

                const report = collectFocusReport({
                    caseName: 'paginated-delete-column',
                    host
                });

                assertFocusDiagnostic(report);
            } finally {
                grid.destroy();
                host.remove();
            }
        });

        test('diagnoses addRow focus without pagination for comparison', async () => {
            const { AMB } = await import('../src/lib/amb.js');
            const { grid, host } = createDiagnosticGrid({ AMB, pagination: false });

            try {
                await waitForTableBuilt(grid.table);
                await grid.crud.addRow({
                    id: null,
                    itemCode: '',
                    productName: ''
                });

                const report = collectFocusReport({
                    caseName: 'non-paginated-delete-column',
                    host
                });

                assertFocusDiagnostic(report);
            } finally {
                grid.destroy();
                host.remove();
            }
        });
    });
});
