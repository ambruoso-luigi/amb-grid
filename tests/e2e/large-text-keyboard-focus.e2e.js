import { expect, test } from '@playwright/test';

const table = page => page.locator('#inventory-test-table');
const firstRow = page => table(page).locator('.tabulator-row').first();
const cell = (page, field) => firstRow(page).locator(
    `.tabulator-cell[tabulator-field="${field}"]`
);

const expectNotesFocused = async page => {
    const notes = cell(page, 'notes');

    await expect(notes).toBeFocused();
    await expect(notes).not.toHaveClass(/tabulator-editing/);
    await expect(page.locator('.amb-large-text-editor')).toHaveCount(0);
};

test.describe('large-text keyboard focus regression', () => {
    test('single click focuses Notes while double click keeps its primary dialog activation', async ({ page }) => {
        await page.goto('/test/');
        await expect(firstRow(page)).toBeVisible();

        const notes = cell(page, 'notes');
        await notes.click();
        await expectNotesFocused(page);

        await notes.dblclick({ delay: 100 });
        const dialog = page.locator('.amb-large-text-editor');
        await expect(dialog).toBeVisible();
        await expect(dialog.locator('.amb-large-text-editor__textarea')).toBeFocused();
    });
});
