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
const readCheckboxState = page => checkboxCell(page).evaluate(cell => cell.textContent.trim());

const expectNoOtherEditor = async page => {
    await expect(notesCell(page)).not.toHaveClass(/tabulator-editing/);
    await expect(page.locator('#inventory-test-table .tabulator-cell[tabulator-field="notes"] textarea, #inventory-test-table .tabulator-cell[tabulator-field="notes"] input'))
        .toHaveCount(0);
};

const focusCheckboxViaTab = async page => {
    const row = firstInventoryRow(page);
    const itemCodeCell = row.locator('.tabulator-cell[tabulator-field="itemCode"]');
    const itemCodeInput = itemCodeCell.locator('input');

    await itemCodeCell.click();
    await expect(itemCodeInput).toBeFocused();

    const fieldsAfterItemCode = [
        'productName', 'warehouse', 'stockQuantity', 'unitPrice',
        'lastCheckDate', 'status', 'requiresInspection'
    ];

    for (const field of fieldsAfterItemCode) {
        await page.keyboard.press('Tab');
        await expect(row.locator(`.tabulator-cell[tabulator-field="${field}"]`))
            .toHaveClass(/tabulator-editing/);
    }

    await expect(checkboxInput(page)).toBeVisible();
    await expect(checkboxInput(page)).toBeFocused();
};

test.describe('checkbox input mode switch regression', () => {
    test('mouse only toggles once per click', async ({ page }) => {
        await openInventoryTestPage(page);

        const cell = checkboxCell(page);
        const initialState = await readCheckboxState(page);

        await cell.click();
        await expect.poll(() => readCheckboxState(page)).not.toBe(initialState);
        await cell.click();
        await expect.poll(() => readCheckboxState(page)).toBe(initialState);
        await cell.click();
        await expect.poll(() => readCheckboxState(page)).not.toBe(initialState);
    });

    test('mouse -> Space toggles the same focused cell', async ({ page }) => {
        await openInventoryTestPage(page);

        const cell = checkboxCell(page);
        const initialState = await readCheckboxState(page);

        await cell.click();
        await expect(cell).toBeFocused();
        await expect(page.locator('#inventory-test-table .tabulator-cell.tabulator-editing'))
            .toHaveCount(0);
        await expect.poll(() => readCheckboxState(page)).not.toBe(initialState);

        await page.keyboard.press('Space');

        await expect.poll(() => readCheckboxState(page)).toBe(initialState);
        await expect(cell).toBeFocused();
        await expectNoOtherEditor(page);
    });

    test('mouse -> Enter toggles the same focused cell', async ({ page }) => {
        await openInventoryTestPage(page);

        const cell = checkboxCell(page);
        const initialState = await readCheckboxState(page);

        await cell.click();
        await page.keyboard.press('Enter');

        await expect.poll(() => readCheckboxState(page)).toBe(initialState);
        await expect(cell).toBeFocused();
        await expect(page.locator('#inventory-test-table .tabulator-cell.tabulator-editing'))
            .toHaveCount(0);
        await expectNoOtherEditor(page);
    });

    test('Tab -> click input toggles and keeps the checkbox editor open', async ({ page }) => {
        await openInventoryTestPage(page);

        await focusCheckboxViaTab(page);
        const initialChecked = await checkboxInput(page).isChecked();
        await checkboxInput(page).click();

        await expect(checkboxInput(page)).toBeChecked({ checked: !initialChecked });
        await expect(checkboxInput(page)).toBeVisible();
        await expect(checkboxInput(page)).toBeFocused();
        await expect(checkboxCell(page)).toHaveClass(/tabulator-editing/);
        await expectNoOtherEditor(page);
    });

    test('Tab -> click empty checkbox cell toggles and keeps focus there', async ({ page }) => {
        await openInventoryTestPage(page);

        const cell = checkboxCell(page);
        await focusCheckboxViaTab(page);
        const initialChecked = await checkboxInput(page).isChecked();
        const box = await cell.boundingBox();

        await cell.click({
            position: {
                x: Math.max(1, (box?.width || 20) - 5),
                y: Math.max(1, (box?.height || 20) / 2)
            }
        });

        await expect(checkboxInput(page)).toBeChecked({ checked: !initialChecked });
        await expect(checkboxInput(page)).toBeVisible();
        await expect(checkboxInput(page)).toBeFocused();
        await expect(checkboxCell(page)).toHaveClass(/tabulator-editing/);
        await expectNoOtherEditor(page);
    });

    test('Tab -> Enter toggles without leaving the checkbox editor', async ({ page }) => {
        await openInventoryTestPage(page);

        await focusCheckboxViaTab(page);
        const initialChecked = await checkboxInput(page).isChecked();
        await page.keyboard.press('Enter');

        await expect(checkboxInput(page)).toBeChecked({ checked: !initialChecked });
        await expect(checkboxInput(page)).toBeVisible();
        await expect(checkboxInput(page)).toBeFocused();
        await expect(checkboxCell(page)).toHaveClass(/tabulator-editing/);
        await expectNoOtherEditor(page);
    });
});
