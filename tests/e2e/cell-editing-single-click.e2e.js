import { expect, test } from '@playwright/test';

test('public single-click cell editing opens the normal text editor', async ({ page }) => {
    await page.goto('/tests/e2e/fixtures/single-click-cell-editing.html');
    const cell = page.locator('.tabulator-cell[tabulator-field="title"]');

    await expect(cell).toBeVisible();
    await cell.click();

    await expect(cell).toHaveClass(/tabulator-editing/);
    await expect(cell.locator('input.amb-cell-editor')).toBeFocused();
});
