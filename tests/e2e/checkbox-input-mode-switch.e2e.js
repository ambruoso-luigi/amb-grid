import { expect, test } from '@playwright/test';

const openInventoryTestPage = async page => {
    await page.goto('/test/');
    await expect(page.locator('#inventory-test-table .tabulator-row').first()).toBeVisible();
};

const firstInventoryRow = page => page.locator('#inventory-test-table .tabulator-row').first();

const checkboxCell = page => firstInventoryRow(page).locator(
    '.tabulator-cell[tabulator-field="requiresInspection"]'
);

const checkboxInput = page => checkboxCell(page).locator('.amb-checkbox-editor__input');

const notesCell = page => firstInventoryRow(page).locator('.tabulator-cell[tabulator-field="notes"]');

const readCheckboxState = page => checkboxCell(page).evaluate(cell => {
    const text = cell.textContent.trim();

    return text;
});

const isFocusedInsideInventoryGrid = page => page.evaluate(() => {
    const active = document.activeElement;
    const grid = document.querySelector('#inventory-test-table');

    return Boolean(active && grid && grid.contains(active));
});

test.describe('checkbox input mode switch regression', () => {
    test('mouse -> Space toggles the same checkbox twice', async ({ page }) => {
        await openInventoryTestPage(page);

        const cell = checkboxCell(page);
        const initialState = await readCheckboxState(page);
        const initialScrollY = await page.evaluate(() => window.scrollY);

        await cell.click();
        const afterMouseState = await readCheckboxState(page);

        expect(afterMouseState).not.toBe(initialState);

        await page.keyboard.press('Space');

        await expect.poll(() => readCheckboxState(page)).toBe(initialState);
        expect(await isFocusedInsideInventoryGrid(page)).toBe(true);
        expect(await page.evaluate(() => window.scrollY)).toBe(initialScrollY);
        await expect(notesCell(page).locator('.amb-checkbox-editor__input, textarea, input')).toHaveCount(0);
        await expect(page.locator('#inventory-test-table .tabulator-cell.tabulator-editing')).toHaveCount(0);
    });

    test('Tab -> checkbox -> mouse toggles the current checkbox before the next Tab', async ({ page }) => {
        await openInventoryTestPage(page);

        const row = firstInventoryRow(page);
        const itemCodeCell = row.locator('.tabulator-cell[tabulator-field="itemCode"]');
        const itemCodeInput = itemCodeCell.locator('input');
        const cell = checkboxCell(page);
        const input = checkboxInput(page);
        const initialState = await readCheckboxState(page);

        await itemCodeCell.click();
        await expect(itemCodeInput).toBeFocused();

        const fieldsAfterItemCode = [
            'productName',
            'warehouse',
            'stockQuantity',
            'unitPrice',
            'lastCheckDate',
            'status',
            'requiresInspection'
        ];

        for (const field of fieldsAfterItemCode) {
            await page.keyboard.press('Tab');
            await expect(row.locator(`.tabulator-cell[tabulator-field="${field}"]`))
                .toHaveClass(/tabulator-editing/);
        }

        await expect(input).toBeVisible();
        await expect(input).toBeFocused();

        await cell.click();

        await expect.poll(() => readCheckboxState(page)).not.toBe(initialState);
        await expect(notesCell(page).locator('textarea, input, .amb-checkbox-editor__input')).toHaveCount(0);
        await expect(notesCell(page)).not.toHaveClass(/tabulator-editing/);

        await page.keyboard.press('Tab');

        await expect(notesCell(page)).toHaveClass(/tabulator-editing/);
        await expect(notesCell(page).locator('textarea, input')).toBeVisible();
    });
});
