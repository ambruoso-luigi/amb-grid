import { expect, test } from '@playwright/test';

const table = page => page.locator('#inventory-table');
const firstRow = page => table(page).locator('.tabulator-row').first();
const cell = (page, field) => firstRow(page).locator(`.tabulator-cell[tabulator-field="${field}"]`);
const rowByCode = (page, code) => table(page).locator('.tabulator-row').filter({ hasText: code });
const rowCell = (page, code, field) => rowByCode(page, code).locator(`.tabulator-cell[tabulator-field="${field}"]`);
const currentPage = page => table(page).locator('.tabulator-page.active').textContent().then(Number);
const waitForPage = (page, number) => expect.poll(() => currentPage(page)).toBe(number);

const expectItemCodeEditor = async page => {
    const itemCode = cell(page, 'itemCode');
    await expect(itemCode).toHaveClass(/tabulator-editing/);
    await expect(itemCode.locator('input.amb-cell-editor')).toBeFocused();
    await expect(table(page).locator('.tabulator-cell.tabulator-editing')).toHaveCount(1);
};

const moveAndCheck = async (page, key, number) => {
    await page.keyboard.press(key);
    await waitForPage(page, number);
    await expectItemCodeEditor(page);
};

const expectFocusOutsideGrid = page => expect.poll(() => page.evaluate(() => Boolean(
    document.activeElement && document.activeElement !== document.body
    && !document.activeElement.closest('#inventory-table')
    && !document.activeElement.closest('.amb-large-text-editor')
))).toBe(true);

const expectLookupEditor = async (page, code) => {
    const target = rowCell(page, code, 'status');
    await expect(target).toHaveClass(/tabulator-editing/);
    await expect(target.locator('.amb-lookup-editor__input')).toBeFocused();
};

const selectStatusDialogResult = async (page, value) => {
    await page.keyboard.press('F2');
    const dialog = page.locator('.amb-lookup-dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('tbody tr').filter({ hasText: value }).first().click();
    await dialog.locator('.amb-lookup-dialog__button--primary').click();
    await expect(dialog).toHaveCount(0);
};

test.describe('keyboard pagination focus', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/#getting-started-javascript');
        await expect(table(page)).toBeVisible();
        await expect(firstRow(page)).toBeVisible();
        await expect(table(page).locator('.tabulator-page[data-page="2"]')).toBeVisible();
    });

    test('navigates 9 to 10 to 11 and back with the first editor active', async ({ page }) => {
        await cell(page, 'itemCode').click();
        await cell(page, 'itemCode').dblclick({ delay: 100 });
        await expectItemCodeEditor(page);
        for (let number = 2; number <= 11; number += 1) await moveAndCheck(page, 'Alt+PageDown', number);
        await expect(table(page).locator('.tabulator-row')).toHaveCount(1);
        await moveAndCheck(page, 'Alt+PageUp', 10);
        await moveAndCheck(page, 'Alt+PageUp', 9);
    });

    test('closes autocomplete naturally before page shortcuts', async ({ page }) => {
        const warehouse = cell(page, 'warehouse');
        await warehouse.click();
        await warehouse.dblclick({ delay: 100 });
        await expect(warehouse.locator('input.amb-autocomplete-editor')).toBeFocused();
        await page.keyboard.press('Alt+PageDown');
        await waitForPage(page, 2);
        await expect(page.locator('.amb-autocomplete-cell--editing')).toHaveCount(0);
        await expectItemCodeEditor(page);
        await page.keyboard.press('Alt+PageUp');
        await waitForPage(page, 1);
        await expectItemCodeEditor(page);
    });

    test('moves Tab and Shift+Tab symmetrically across pages', async ({ page }) => {
        const notes = rowCell(page, 'PRD-H010', 'notes');
        await notes.click();
        await page.keyboard.press('Tab');
        await waitForPage(page, 2);
        await expectItemCodeEditor(page);
        await page.keyboard.press('Shift+Tab');
        await waitForPage(page, 1);
        await expect(notes).toBeFocused();
    });

    test('Shift+Tab exits the grid at the first absolute boundary', async ({ page }) => {
        await cell(page, 'itemCode').click();
        await cell(page, 'itemCode').dblclick({ delay: 100 });
        await expectItemCodeEditor(page);
        await page.keyboard.press('Shift+Tab');
        await expectFocusOutsideGrid(page);
    });

    test('Tab exits the grid at the last absolute boundary', async ({ page }) => {
        await cell(page, 'itemCode').click();
        await cell(page, 'itemCode').dblclick({ delay: 100 });
        await expectItemCodeEditor(page);
        for (let number = 2; number <= 11; number += 1) await moveAndCheck(page, 'Alt+PageDown', number);
        const notes = cell(page, 'notes');
        await notes.click();
        await expect(notes).toBeFocused();
        await expect(notes).not.toHaveClass(/tabulator-editing/);
        await page.keyboard.press('Tab');
        await expectFocusOutsideGrid(page);
    });

    test('restores lookup editing after selecting the current dialog value again', async ({ page }) => {
        const status = rowCell(page, 'PRD-AB02', 'status');
        await status.click();
        await status.dblclick({ delay: 100 });
        await expectLookupEditor(page, 'PRD-AB02');
        const currentValue = await status.locator('.amb-lookup-editor__input').inputValue();

        await selectStatusDialogResult(page, currentValue);
        await expectLookupEditor(page, 'PRD-AB02');
        await expect(status.locator('.amb-lookup-editor__input')).toHaveValue(currentValue);
        await expect(table(page).locator('.tabulator-cell.tabulator-editing')).toHaveCount(1);

        await page.keyboard.press('F2');
        const dialog = page.locator('.amb-lookup-dialog');
        await expect(dialog).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expectLookupEditor(page, 'PRD-AB02');
    });

    test('preserves sequential navigation after a real lookup selection', async ({ page }) => {
        const status = rowCell(page, 'PRD-AB02', 'status');
        await status.click();
        await status.dblclick({ delay: 100 });
        await expectLookupEditor(page, 'PRD-AB02');
        await selectStatusDialogResult(page, 'A001');
        await expectLookupEditor(page, 'PRD-AB02');
        await page.keyboard.press('Shift+Tab');
        await expect(rowCell(page, 'PRD-AB02', 'lastCheckDate')).toHaveClass(/tabulator-editing/);

        await page.keyboard.press('Escape');
        await status.click();
        await status.dblclick({ delay: 100 });
        await expectLookupEditor(page, 'PRD-AB02');
        await selectStatusDialogResult(page, 'AB03');
        await expectLookupEditor(page, 'PRD-AB02');
        await page.keyboard.press('Tab');
        await expect(rowCell(page, 'PRD-AB02', 'requiresInspection')).toHaveClass(/tabulator-editing/);
    });

    test('waits for lookup lifecycle across page shortcuts', async ({ page }) => {
        const status = rowCell(page, 'PRD-AB02', 'status');
        await status.click();
        await status.dblclick({ delay: 100 });
        await expectLookupEditor(page, 'PRD-AB02');
        await page.keyboard.press('Alt+PageDown');
        await waitForPage(page, 2);
        await expect(page.locator('.amb-lookup-editor')).toHaveCount(0);
        await expectItemCodeEditor(page);
        await page.keyboard.press('Alt+PageUp');
        await waitForPage(page, 1);
        await expectItemCodeEditor(page);
    });
});
