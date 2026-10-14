import { expect, test } from '@playwright/test';

const table = page => page.locator('#row-states-table');
const row = (page, id) => table(page).locator('.tabulator-row').filter({ hasText: id });
const cell = (page, id, field) => row(page, id).locator(`.tabulator-cell[tabulator-field="${field}"]`);

test.describe('Row States lifecycle', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/src/demo/index.html#feature-examples');
        await expect(table(page)).toBeVisible();
    });

    test('shows the requested states, Description error, report, and partial save confirmation', async ({ page }) => {
        await page.locator('[data-action="state-show-states"]').click();
        await expect(cell(page, 'REC-001', '_state')).toHaveText('clean');
        await expect(cell(page, 'REC-002', 'type')).toHaveText('Procedure');
        await expect(cell(page, 'REC-002', 'description')).toHaveText('Contract review in progress');
        await expect(cell(page, 'REC-002', '_state')).toHaveText('modified');
        await expect(cell(page, 'REC-002', '_ambErrorCount')).toHaveText('0');
        await expect(cell(page, 'REC-003', '_state')).toHaveText('deleted');
        await expect(cell(page, 'REC-004', 'type')).toHaveText('Compliance');
        const invalidDescription = cell(page, 'REC-004', 'description');
        await expect(invalidDescription).toHaveText('');
        await expect(invalidDescription).toHaveAttribute('data-cell-error', 'true');
        await expect(invalidDescription).not.toHaveAttribute('title');
        await expect(cell(page, 'REC-004', 'type')).not.toHaveAttribute('data-cell-error', 'true');
        await expect(cell(page, 'REC-004', '_ambErrorCount')).toHaveText('1');

        await page.locator('[data-action="state-report"]').click();
        const report = page.getByRole('dialog', { name: 'Row states report' });
        await expect(report).toBeVisible();
        await expect(report.locator('.demo-report-dialog__report')).toContainText('Rows with errors: 1');
        await expect(report.locator('.demo-report-dialog__report')).toContainText('Cell errors: 1');
        await expect(report.locator('.demo-report-dialog__report')).toContainText('Row 4: 1 error');
        await report.locator('.demo-report-dialog__button').click();

        await page.getByRole('button', { name: 'Save' }).click();
        await expect(page.getByText('Some rows contain errors and will not be saved.')).toBeVisible();
        await expect(page.getByText('Row 4: description')).toBeVisible();
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(row(page, 'REC-002')).toContainText('modified');
    });

    test('reproduces the Description error manually after Reload without Show states', async ({ page }) => {
        await page.locator('#feature-example [data-action="reload"]').click();
        await expect(page.getByText('Clean baseline reloaded.')).toBeVisible();
        const description = cell(page, 'REC-004', 'description');
        await expect(description).toHaveText('Compliance evidence requires review');
        await description.click({ position: { x: 40, y: 10 } });
        await description.press('Enter');
        const editor = description.locator('input.amb-cell-editor');
        await expect(editor).toBeFocused();
        await editor.fill('');
        await page.getByRole('button', { name: 'Save' }).click();

        await expect(editor).toHaveCount(0);
        await expect(description).toHaveText('');
        await expect(description).toHaveAttribute('data-cell-error', 'true');
        await expect(cell(page, 'REC-004', '_ambErrorCount')).toHaveText('1');
        await expect(page.getByText('There are no valid changes to save. Correct the rows with errors first.')).toBeVisible();
    });
});
