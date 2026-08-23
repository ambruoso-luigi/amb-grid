import { expect, test } from '@playwright/test';

const openInventoryTestPage = async page => {
    await page.goto('/test/');
    await expect(page.locator('#inventory-test-table .tabulator-row').first()).toBeVisible();
};

const firstInventoryRow = page => page.locator('#inventory-test-table .tabulator-row').first();
const secondInventoryRow = page => page.locator('#inventory-test-table .tabulator-row').nth(1);
const checkboxCell = page => firstInventoryRow(page).locator(
    '.tabulator-cell[tabulator-field="requiresInspection"]'
);
const checkboxInput = page => checkboxCell(page).locator('.amb-checkbox-editor__input');
const notesCell = page => firstInventoryRow(page).locator('.tabulator-cell[tabulator-field="notes"]');
const readCheckboxState = page => checkboxCell(page).evaluate(cell => cell.textContent.trim());
const rowCheckboxCell = (row, field = 'requiresInspection') => row.locator(
    `.tabulator-cell[tabulator-field="${field}"]`
);

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

    for (const key of ['Space', 'Enter']) {
        test(`Tab -> ${key} -> mouse on checkbox B does not navigate past A`, async ({ page }) => {
            await openInventoryTestPage(page);

            await focusCheckboxViaTab(page);
            const aInput = checkboxInput(page);
            const aInitialChecked = await aInput.isChecked();

            await page.keyboard.press(key);
            await expect(aInput).toBeChecked({ checked: !aInitialChecked });
            await expect(aInput).toBeFocused();

            const bCell = rowCheckboxCell(secondInventoryRow(page));
            const bInitialState = await bCell.textContent();

            await bCell.click();

            await expect.poll(() => bCell.textContent()).not.toBe(bInitialState);
            await expect(bCell).toBeFocused();
            await expect(checkboxInput(page)).toHaveCount(0);
            await expect(page.locator('#inventory-test-table .tabulator-cell.tabulator-editing'))
                .toHaveCount(0);
            await expect(await page.evaluate(() => {
                const activeCell = document.activeElement?.closest('.tabulator-cell');

                return {
                    field: activeCell?.getAttribute('tabulator-field') || null,
                    row: activeCell?.closest('.tabulator-row')?.getAttribute('data-index') || null
                };
            })).toEqual({
                field: 'requiresInspection',
                row: await bCell.evaluate(cell => cell.closest('.tabulator-row')?.getAttribute('data-index') || null)
            });
        });
    }
});
