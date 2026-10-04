import { expect, test } from '@playwright/test';
import { reportFocusDiagnostics } from './helpers/focus-diagnostics.js';

const firstInventoryRow = page => page
    .locator('.react-demo-grid .tabulator-row')
    .filter({ hasText: 'ITM-1001' })
    .first();

const cell = (page, field) => firstInventoryRow(page)
    .locator(`.tabulator-cell[tabulator-field="${field}"]`);

test('React Status select remains open while browsing and restores focus after closing', async ({ page }) => {
    await page.goto('/#getting-started-react');
    await expect(firstInventoryRow(page)).toBeVisible();
    await expect(page.locator('.react-demo-grid-shell')).toHaveAttribute('aria-busy', 'false');

    const itemCode = cell(page, 'itemCode');
    const status = cell(page, 'status');

    await expect(itemCode).toBeVisible();
    await expect.poll(() => itemCode.evaluate(element => element.isConnected)).toBe(true);
    try {
        await itemCode.click();
        await expect(itemCode).toBeFocused();
    } catch (error) {
        await reportFocusDiagnostics(page, itemCode, 'React Status item-code click failed', '.react-demo-grid');
        throw error;
    }
    for (let step = 0; step < 5; step += 1) {
        await page.keyboard.press('ArrowRight');
    }
    await expect(status).toBeFocused();

    await page.keyboard.press('Enter');
    const select = status.locator('select.amb-cell-editor--select');
    await expect(select).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(status).toHaveClass(/tabulator-editing/);
    await expect(select).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(status).toContainText('REVIEW');
    await expect(status).toBeFocused();
    await expect(status).not.toHaveClass(/tabulator-editing/);

    await page.keyboard.press('Enter');
    await expect(select).toBeFocused();
    await page.keyboard.press('Escape');
    if (await select.count()) {
        await expect(select).toBeFocused();
        await page.keyboard.press('Escape');
    }
    await expect(status).not.toHaveClass(/tabulator-editing/);
    await expect(status).toContainText('REVIEW');
    await expect(status).toBeFocused();
});
