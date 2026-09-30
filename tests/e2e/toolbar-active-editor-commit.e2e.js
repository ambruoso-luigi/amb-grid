import { expect, test } from '@playwright/test';

const firstCell = (page, tableSelector, field) => page
    .locator(`${tableSelector} .tabulator-row`)
    .first()
    .locator(`.tabulator-cell[tabulator-field="${field}"]`);

test.describe('toolbar active editor commit', () => {
    test('Validate uses the value still being edited in the main demo', async ({ page }) => {
        await page.goto('/src/demo/index.html#getting-started-javascript');

        const table = page.locator('#inventory-table');
        const productName = firstCell(page, '#inventory-table', 'productName');

        await expect(table).toBeVisible();
        await productName.dblclick();

        const editor = productName.locator('input.amb-cell-editor');

        await expect(editor).toBeFocused();
        await editor.fill('x');
        await page.locator('#javascript-demo .amb-toolbar__button--validate').click();

        await expect(editor).toHaveCount(0);
        await expect(productName).toContainText('x');

        const dialog = page.locator('.demo-report-dialog:not([hidden])');

        await expect(dialog).toBeVisible();
        await expect(dialog.locator('.demo-report-dialog__report'))
            .toContainText('productName');
    });

    test('Show report uses the value still being edited in the Validation demo', async ({ page }) => {
        await page.goto('/src/demo/index.html#feature-examples');
        await page.locator('[data-example="validation"]').click();

        const table = page.locator('#validation-table');
        const alias = firstCell(page, '#validation-table', 'alias');

        await expect(table).toBeVisible();
        await alias.dblclick();

        const editor = alias.locator('input.amb-cell-editor');

        await expect(editor).toBeFocused();
        await editor.fill('x');
        await page.locator('#feature-example .amb-toolbar__button--show-report').click();

        await expect(editor).toHaveCount(0);
        await expect(alias).toContainText('x');

        const dialog = page.getByRole('dialog', { name: 'Validation report' });

        await expect(dialog).toBeVisible();
        await expect(dialog.locator('.demo-report-dialog__report'))
            .toContainText('Alias must be at least 3 characters');
    });
});
