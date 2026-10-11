import { expect, test } from '@playwright/test';

const table = page => page.locator('#inventory-table');
const row = (page, code) => table(page).locator('.tabulator-row').filter({ hasText: code });
const selectionInput = (page, code) => row(page, code)
    .locator('.amb-selection-column__input');
const reportDialog = page => page.locator('.demo-report-dialog');

test('main JavaScript demo reports current selection and clears it on reload', async ({ page }) => {
    await page.goto('/#getting-started-javascript');
    await expect(table(page)).toBeVisible();

    const first = row(page, 'PRD-A001');
    const second = row(page, 'PRD-AB02');
    await selectionInput(page, 'PRD-A001').click();
    await selectionInput(page, 'PRD-AB02').click();
    await expect(first).toHaveClass(/tabulator-selected/);
    await expect(second).toHaveClass(/tabulator-selected/);

    await row(page, 'PRD-A003').locator('.tabulator-cell[tabulator-field="productName"]').click();
    await expect(row(page, 'PRD-A003')).not.toHaveClass(/tabulator-selected/);

    await page.locator('[data-action="show-report"]').click();
    await expect(reportDialog(page)).toBeVisible();
    await expect(reportDialog(page)).toContainText(/(Selected rows|Righe selezionate): 2/);
    await reportDialog(page).locator('.demo-report-dialog__button').click();

    await selectionInput(page, 'PRD-A001').click();
    await expect(first).not.toHaveClass(/tabulator-selected/);
    await page.locator('[data-action="show-report"]').click();
    await expect(reportDialog(page)).toContainText(/(Selected rows|Righe selezionate): 1/);
    await reportDialog(page).locator('.demo-report-dialog__button').click();

    await page.locator('[data-action="reload"]').click();
    await expect(first).not.toHaveClass(/tabulator-selected/);
    await expect(second).not.toHaveClass(/tabulator-selected/);
});
