import { expect, test } from '@playwright/test';

const table = page => page.locator('#inventory-test-table');
const firstRow = page => table(page).locator('.tabulator-row').first();
const cell = (page, field) => firstRow(page).locator(
    `.tabulator-cell[tabulator-field="${field}"]`
);

const focusCheckboxEditor = async page => {
    const itemCode = cell(page, 'itemCode');

    await itemCode.click();
    await expect(itemCode.locator('input')).toBeFocused();

    for (const field of [
        'productName', 'warehouse', 'stockQuantity', 'unitPrice',
        'lastCheckDate', 'status', 'requiresInspection'
    ]) {
        await page.keyboard.press('Tab');
        await expect(cell(page, field)).toHaveClass(/tabulator-editing/);
    }

    await expect(cell(page, 'requiresInspection').locator('.amb-checkbox-editor__input'))
        .toBeFocused();
};

const expectNotesFocused = async page => {
    const notes = cell(page, 'notes');

    await expect(notes).toBeFocused();
    await expect(notes).not.toHaveClass(/tabulator-editing/);
    await expect(page.locator('.amb-large-text-editor')).toHaveCount(0);
};

test.describe('large-text keyboard focus regression', () => {
    test('Tab and Shift+Tab focus Notes without opening its dialog; Enter opens and restores focus', async ({ page }) => {
        await page.goto('/test/');
        await expect(firstRow(page)).toBeVisible();

        await focusCheckboxEditor(page);
        await page.keyboard.press('Tab');
        await expectNotesFocused(page);

        await page.keyboard.press('Enter');
        const dialog = page.locator('.amb-large-text-editor');
        await expect(dialog).toBeVisible();
        await expect(dialog.locator('.amb-large-text-editor__textarea')).toBeFocused();

        await page.keyboard.press('Escape');
        await expectNotesFocused(page);

        await page.keyboard.press('Tab');
        await expect(page.locator('.amb-large-text-editor')).toHaveCount(0);
        await page.keyboard.press('Shift+Tab');
        await expectNotesFocused(page);

        await page.keyboard.press('Enter');
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: 'Cancel' }).click();
        await expectNotesFocused(page);
    });
});
