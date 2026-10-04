import { expect, test } from '@playwright/test';

test('React Status: keyboard navigation, commit and cancel', async ({ page }) => {
    await page.goto('/#getting-started-react');
    const shell = page.locator('.react-demo-grid-shell');
    const row = page.locator('.react-demo-grid .tabulator-row').filter({ hasText: 'ITM-1001' }).first();
    const column = field => row.locator(`.tabulator-cell[tabulator-field="${field}"]`);
    const status = column('status');
    const statusVisual = status.locator('.inventory-status');

    await expect(row).toBeVisible();
    await expect(shell).toHaveAttribute('aria-busy', 'false');
    await column('itemCode').click();
    await column('itemCode').press('ArrowRight');
    while (!await status.evaluate(element => document.activeElement === element)) await page.keyboard.press('ArrowRight');

    await page.keyboard.press('Enter');
    const list = page.locator('.tabulator-edit-list');
    await expect(list).toBeVisible();
    await expect(list.locator('.tabulator-edit-list-item')).toHaveCount(3);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(statusVisual).toHaveAttribute('data-status', 'review');
    await expect(status).toBeFocused();
    await expect(status).not.toHaveClass(/tabulator-editing/);

    await page.keyboard.press('Enter');
    await expect(list).toBeVisible();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Escape');
    await expect(statusVisual).toHaveAttribute('data-status', 'review');
    await expect(status).toBeFocused();
    await expect(status).not.toHaveClass(/tabulator-editing/);
    await page.keyboard.press('ArrowLeft');
    await expect(column('unitPrice')).toBeFocused();
});
