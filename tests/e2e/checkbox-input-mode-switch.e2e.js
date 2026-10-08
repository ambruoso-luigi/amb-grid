import { expect, test } from '@playwright/test';

const openInventoryTestPage = async page => {
    await page.goto('/test/');
    await expect(page.locator('#inventory-test-table .tabulator-row').first()).toBeVisible();
};

const firstInventoryRow = page => page.locator('#inventory-test-table .tabulator-row').first();
const checkboxCell = page => firstInventoryRow(page).locator(
    '.tabulator-cell[tabulator-field="requiresInspection"]'
);
const notesCell = page => firstInventoryRow(page).locator('.tabulator-cell[tabulator-field="notes"]');
const readCheckboxState = page => checkboxCell(page).evaluate(cell => cell.textContent.trim());

const expectNoOtherEditor = async page => {
    await expect(notesCell(page)).not.toHaveClass(/tabulator-editing/);
    await expect(page.locator('#inventory-test-table .tabulator-cell[tabulator-field="notes"] textarea, #inventory-test-table .tabulator-cell[tabulator-field="notes"] input'))
        .toHaveCount(0);
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

    test('mouse -> checked and unchecked keys keep the same cell target', async ({ page }) => {
        await openInventoryTestPage(page);

        const cell = checkboxCell(page);

        await cell.click();
        await expect(cell).toBeFocused();

        await page.keyboard.press('1');
        const checkedState = await readCheckboxState(page);

        await page.keyboard.press('0');
        const uncheckedState = await readCheckboxState(page);

        expect(checkedState).not.toBe(uncheckedState);

        await page.keyboard.press('Y');
        await expect.poll(() => readCheckboxState(page)).toBe(checkedState);
        await page.keyboard.press('N');
        await expect.poll(() => readCheckboxState(page)).toBe(uncheckedState);
        await expect(cell).toBeFocused();
        await expectNoOtherEditor(page);

        await page.keyboard.press('Space');
        await expect.poll(() => readCheckboxState(page)).toBe(checkedState);
        await page.keyboard.press('Enter');
        await expect.poll(() => readCheckboxState(page)).toBe(uncheckedState);
        await expect(cell).toBeFocused();
        await expectNoOtherEditor(page);
    });

});
