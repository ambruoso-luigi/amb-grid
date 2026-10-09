import { expect, test } from '@playwright/test';

const table = page => page.locator('#row-states-table');
const row = (page, id) => table(page).locator('.tabulator-row').filter({ hasText: id });
const cell = (page, id, field) => row(page, id).locator(`.tabulator-cell[tabulator-field="${field}"]`);

test.describe('Row States lifecycle', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/src/demo/index.html#feature-examples');
        await expect(table(page)).toBeVisible();
    });

    test('keeps error messages in the floating message and opens partial save confirmation', async ({ page }) => {
        await page.getByRole('button', { name: 'Show states' }).click();
        const invalidType = cell(page, 'REC-004', 'type');
        await expect(invalidType).toHaveAttribute('data-cell-error', 'true');
        await expect(invalidType).not.toHaveAttribute('title');
        await invalidType.hover();
        await expect(page.locator('.teh-floating-message--visible')).toHaveCount(1);

        await page.getByRole('button', { name: 'Save' }).click();
        await expect(page.getByText('Some rows contain errors and will not be saved.')).toBeVisible();
        await expect(page.getByText('Row 4: type')).toBeVisible();
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(row(page, 'REC-002')).toContainText('modified');
    });
});
