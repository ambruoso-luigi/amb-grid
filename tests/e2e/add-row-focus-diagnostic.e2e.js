import { expect, test } from '@playwright/test';

const formatReport = report => {
    return [
        `scenario: ${report.scenario}`,
        `iteration: ${report.iteration}`,
        `activeElement.tagName: ${report.activeElement.tagName}`,
        `activeElement.className: ${report.activeElement.className}`,
        `activeElement.ariaLabel: ${report.activeElement.ariaLabel}`,
        `actionButtonFocused: ${report.actionButtonFocused}`,
        `activeInsideTabulatorCell: ${report.activeInsideTabulatorCell}`,
        `activeCellField: ${report.activeCellField}`,
        `newRowsVisible: ${report.newRowsVisible}`,
        `currentPage: ${report.currentPage}`,
        `pageSize: ${report.pageSize}`,
        `newRowExists: ${report.newRowExists}`,
        `targetCellField: ${report.targetField}`,
        `targetCellExists: ${report.targetCellExists}`,
        `targetCellEditing: ${report.targetCellEditing}`,
        `targetEditorExists: ${report.targetEditorExists}`,
        `targetEditorFocused: ${report.targetEditorFocused}`,
        `targetCellContainsActiveElement: ${report.targetCellContainsActiveElement}`
    ].join('\n');
};

const collectFocusReport = async (page, {
    scenario,
    iteration,
    tableSelector,
    targetField
}) => {
    return page.evaluate(({ scenario, iteration, tableSelector, targetField }) => {
        const tableRoot = document.querySelector(tableSelector);
        const activeElement = document.activeElement;
        const actionButton = activeElement && typeof activeElement.closest === 'function'
            ? activeElement.closest('.amb-row-action-button')
            : null;
        const activeCell = activeElement && typeof activeElement.closest === 'function'
            ? activeElement.closest('.tabulator-cell')
            : null;
        const visibleNewRows = tableRoot
            ? Array.from(tableRoot.querySelectorAll('.tabulator-row[data-state="new"]'))
                .filter(row => row.offsetParent !== null)
            : [];
        const newRow = visibleNewRows[visibleNewRows.length - 1] || null;
        const targetCell = newRow
            ? newRow.querySelector(`.tabulator-cell[tabulator-field="${targetField}"]`)
            : null;
        const targetEditor = targetCell
            ? targetCell.querySelector('input, textarea, select, [contenteditable="true"]')
            : null;
        const activePage = tableRoot
            ? tableRoot.querySelector('.tabulator-page.active')
            : null;
        const pageSizeSelect = tableRoot
            ? tableRoot.querySelector('.tabulator-page-size')
            : null;

        return {
            scenario,
            iteration,
            activeElement: {
                tagName: activeElement ? activeElement.tagName : null,
                className: activeElement ? String(activeElement.className || '') : null,
                ariaLabel: activeElement ? activeElement.getAttribute('aria-label') : null
            },
            actionButtonFocused: Boolean(actionButton),
            activeInsideTabulatorCell: Boolean(activeCell),
            activeCellField: activeCell ? activeCell.getAttribute('tabulator-field') : null,
            newRowsVisible: visibleNewRows.length,
            currentPage: activePage ? activePage.textContent.trim() : null,
            pageSize: pageSizeSelect ? pageSizeSelect.value : null,
            newRowExists: Boolean(newRow),
            targetField,
            targetCellExists: Boolean(targetCell),
            targetCellEditing: Boolean(
                targetCell && targetCell.classList.contains('tabulator-editing')
            ),
            targetEditorExists: Boolean(targetEditor),
            targetEditorFocused: Boolean(targetEditor && targetEditor === activeElement),
            targetCellContainsActiveElement: Boolean(
                targetCell && activeElement && targetCell.contains(activeElement)
            )
        };
    }, { scenario, iteration, tableSelector, targetField });
};

const assertFocusReport = report => {
    const message = formatReport(report);

    expect(report.actionButtonFocused, `Focus is on the action/remove button.\n${message}`)
        .toBe(false);
    expect(report.targetCellExists, `Target cell is missing.\n${message}`)
        .toBe(true);
    expect(report.targetEditorExists, `Target cell did not open a real editor.\n${message}`)
        .toBe(true);
    expect(
        report.targetEditorFocused || report.targetCellContainsActiveElement,
        `Active element is not inside the target field editor/cell.\n${message}`
    ).toBe(true);
};

const openInventoryDemo = async page => {
    await page.goto('/src/demo/index.html#getting-started-javascript');
    await expect(page.locator('#inventory-table.tabulator')).toBeVisible();

    const pageSize = page.locator('#inventory-table .tabulator-page-size');

    if (await pageSize.count()) {
        await pageSize.selectOption('10');
        await expect(pageSize).toHaveValue('10');
    }
};

const openBasicCrudDemo = async page => {
    await page.goto('/src/demo/index.html#feature-examples');
    await expect(page.locator('#basic-table.tabulator')).toBeVisible();
};

test.describe('browser addRow focus diagnostic', () => {
    test('Gestionale Magazzino Classico keeps focus out of remove-new and inside itemCode after repeated Add row', async ({ page }) => {
        await openInventoryDemo(page);

        const addButton = page.locator('#javascript-demo .amb-toolbar__button--add');

        for (let iteration = 1; iteration <= 3; iteration += 1) {
            await addButton.click();

            const report = await collectFocusReport(page, {
                scenario: 'Gestionale Magazzino Classico paginated deleteColumn',
                iteration,
                tableSelector: '#inventory-table',
                targetField: 'itemCode'
            });

            console.info(formatReport(report));
            assertFocusReport(report);
        }
    });

    test('Basic CRUD comparison reports focus after Add row without pagination', async ({ page }) => {
        await openBasicCrudDemo(page);

        await page.locator('#feature-example .amb-toolbar__button--add').click();

        const report = await collectFocusReport(page, {
            scenario: 'Basic CRUD non-paginated deleteColumn',
            iteration: 1,
            tableSelector: '#basic-table',
            targetField: 'title'
        });

        console.info(formatReport(report));
        assertFocusReport(report);
    });
});
