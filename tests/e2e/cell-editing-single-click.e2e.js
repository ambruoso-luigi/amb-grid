import { expect, test } from '@playwright/test';

test('public single-click cell editing opens the normal text editor', async ({ page }) => {
    await page.goto('/tests/e2e/fixtures/single-click-cell-editing.html');
    const cell = page.locator('.tabulator-cell[tabulator-field="title"]');

    await expect(cell).toBeVisible();
    await cell.click();

    await expect(cell).toHaveClass(/tabulator-editing/);
    await expect(cell.locator('input.amb-cell-editor')).toBeFocused();
});

test('keeps an already opened single-click editor active on internal pointer input', async ({ page }) => {
    await page.goto('/tests/e2e/fixtures/single-click-cell-editing.html');
    const cell = page.locator('.tabulator-cell[tabulator-field="title"]');
    const input = cell.locator('input.amb-cell-editor');

    await cell.click();
    await expect(input).toBeFocused();
    const box = await input.boundingBox();
    expect(box).not.toBeNull();
    await input.click({ position: { x: Math.max(2, box.width * 0.3), y: box.height / 2 } });

    const selection = await input.evaluate(element => ({
        start: element.selectionStart,
        end: element.selectionEnd
    }));
    expect(selection.start).toBe(selection.end);
    await expect(cell).toHaveClass(/tabulator-editing/);
    await expect(input).toBeFocused();
    await expect(cell.locator('input.amb-cell-editor')).toHaveCount(1);
});
