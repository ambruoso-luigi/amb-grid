import { expect, test } from '@playwright/test';

const table = page => page.locator('#inventory-table');
const firstRow = page => table(page).locator('.tabulator-row').first();
const cell = (page, field) => firstRow(page).locator(`.tabulator-cell[tabulator-field="${field}"]`);
const rowByCode = (page, code) => table(page).locator('.tabulator-row').filter({ hasText: code });
const rowCell = (page, code, field) => rowByCode(page, code)
    .locator(`.tabulator-cell[tabulator-field="${field}"]`);
const currentPage = page => table(page).locator('.tabulator-page.active').textContent()
    .then(value => Number(value));

const waitForPage = async (page, pageNumber) => {
    await expect.poll(() => currentPage(page)).toBe(pageNumber);
};

const expectItemCodeEditor = async page => {
    const itemCode = cell(page, 'itemCode');
    const editor = itemCode.locator('input.amb-cell-editor');

    await expect(itemCode).toHaveClass(/tabulator-editing/);
    await expect(editor).toBeVisible();
    await expect(table(page).locator('.tabulator-cell.tabulator-editing')).toHaveCount(1);
    await expect.poll(() => page.evaluate(() => Boolean(
        document.activeElement?.matches('input.amb-cell-editor')
        && document.activeElement.closest('.tabulator-cell[tabulator-field="itemCode"]')
    ))).toBe(true);
};

const moveAndCheck = async (page, key, expectedPage) => {
    await page.keyboard.press(key);
    await waitForPage(page, expectedPage);
    await expectItemCodeEditor(page);
};

const expectFocusOutsideGrid = async page => {
    await expect.poll(() => page.evaluate(() => Boolean(
        document.activeElement
        && document.activeElement !== document.body
        && !document.activeElement.closest('#inventory-table')
        && !document.activeElement.closest('.amb-large-text-editor')
    ))).toBe(true);
};

const expectFieldEditor = async (page, code, field) => {
    const target = rowCell(page, code, field);

    await expect(target).toHaveClass(/tabulator-editing/);
    await expect(table(page).locator('.tabulator-cell.tabulator-editing')).toHaveCount(1);
    await expect.poll(() => page.evaluate(expectedField => (
        document.activeElement?.closest('.tabulator-cell')?.getAttribute('tabulator-field')
    ), field)).toBe(field);
};

const expectLookupEditor = async (page, code) => {
    const target = rowCell(page, code, 'status');

    await expectFieldEditor(page, code, 'status');
    await expect(target.locator('.amb-lookup-editor__input')).toBeFocused();
    await expect(target.locator('.amb-lookup-editor__button')).toBeVisible();
};

test.describe('keyboard pagination focus', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/#getting-started-javascript');
        await expect(table(page)).toBeVisible();
        await expect(firstRow(page)).toBeVisible();
        await expect(table(page).locator('.tabulator-page[data-page="2"]')).toBeVisible();
    });

    test('navigates 9 to 10 to 11 and back with the first editor active', async ({ page }) => {
        await cell(page, 'itemCode').dblclick({ delay: 100 });
        await expectItemCodeEditor(page);

        for (let pageNumber = 2; pageNumber <= 9; pageNumber += 1) {
            await moveAndCheck(page, 'Alt+PageDown', pageNumber);
        }

        await moveAndCheck(page, 'Alt+PageDown', 10);
        await moveAndCheck(page, 'Alt+PageDown', 11);
        await expect(table(page).locator('.tabulator-row')).toHaveCount(1);

        for (let attempt = 0; attempt < 3; attempt += 1) {
            await page.keyboard.press('Alt+PageDown');
            await waitForPage(page, 11);
            await expectItemCodeEditor(page);
        }

        await moveAndCheck(page, 'Alt+PageUp', 10);
        await moveAndCheck(page, 'Alt+PageUp', 9);
    });

    test('closes Warehouse naturally before keyboard pagination', async ({ page }) => {
        const warehouse = cell(page, 'warehouse');

        await warehouse.dblclick({ delay: 100 });
        await expect(page.locator('input.amb-autocomplete-editor')).toBeVisible();
        await expect(warehouse).toHaveClass(/amb-autocomplete-cell--editing/);
        await expect(table(page).locator('.tabulator-cell.tabulator-editing')).toHaveCount(1);

        await page.keyboard.press('Alt+PageDown');
        await waitForPage(page, 2);
        await expect(page.locator('.amb-autocomplete-cell--editing')).toHaveCount(0);
        await expectItemCodeEditor(page);

        await page.keyboard.press('Alt+PageUp');
        await waitForPage(page, 1);
        await expect(page.locator('.amb-autocomplete-cell--editing')).toHaveCount(0);
        await expectItemCodeEditor(page);
        await page.keyboard.press('Escape');

        await warehouse.dblclick({ delay: 100 });
        await expect(page.locator('input.amb-autocomplete-editor')).toBeVisible();
        await page.keyboard.press('Tab');
        await expect(warehouse).not.toHaveClass(/amb-autocomplete-cell--editing/);
        await expect(table(page).locator('.tabulator-cell.tabulator-editing')).toHaveCount(1);

        await cell(page, 'notes').click();
        await expect(warehouse).not.toHaveClass(/amb-autocomplete-cell--editing/);
    });

    test('moves Tab and Shift+Tab symmetrically across pages', async ({ page }) => {
        const tableHolder = table(page).locator('.tabulator-tableholder');

        await tableHolder.hover();
        await page.mouse.wheel(0, 10000);
        await expect(table(page).locator('.tabulator-row').filter({ hasText: 'PRD-H010' })).toBeVisible();

        const lastNotes = table(page)
            .locator('.tabulator-row')
            .filter({ hasText: 'PRD-H010' })
            .locator('.tabulator-cell[tabulator-field="notes"]');

        await lastNotes.dblclick({ delay: 100 });
        await expect(page.locator('.amb-large-text-editor__textarea')).toBeFocused();
        await page.keyboard.press('Tab');
        await waitForPage(page, 2);
        await expectItemCodeEditor(page);

        await page.keyboard.press('Shift+Tab');
        await waitForPage(page, 1);
        await expect(table(page).locator('.tabulator-row').last().locator(
            '.tabulator-cell[tabulator-field="notes"].tabulator-editing'
        )).toHaveCount(1);
        await expect(page.locator('.amb-large-text-editor__textarea')).toBeFocused();
    });

    test('exits the grid at both absolute Tab boundaries', async ({ page }) => {
        const firstItemCode = cell(page, 'itemCode');
        await firstItemCode.click();
        await firstItemCode.dblclick({ delay: 100 });
        await expectItemCodeEditor(page);
        await page.keyboard.press('Shift+Tab');
        await expectFocusOutsideGrid(page);

        await firstItemCode.click();
        await firstItemCode.dblclick({ delay: 100 });
        await expectItemCodeEditor(page);
        for (let pageNumber = 2; pageNumber <= 11; pageNumber += 1) {
            await moveAndCheck(page, 'Alt+PageDown', pageNumber);
        }

        const finalNotes = table(page)
            .locator('.tabulator-row')
            .last()
            .locator('.tabulator-cell[tabulator-field="notes"]');
        await finalNotes.dblclick({ delay: 100 });
        await expect(page.locator('.amb-large-text-editor__textarea')).toBeFocused();
        await page.keyboard.press('Tab');
        await waitForPage(page, 11);
        await expectFocusOutsideGrid(page);
    });

    test('moves vertically in the same column and preserves autocomplete arrows', async ({ page }) => {
        const row2Stock = rowCell(page, 'PRD-AB02', 'stockQuantity');

        await row2Stock.click();
        await row2Stock.dblclick();
        await expectFieldEditor(page, 'PRD-AB02', 'stockQuantity');
        await page.keyboard.press('Alt+ArrowDown');
        await expectFieldEditor(page, 'PRD-A003', 'stockQuantity');
        await page.keyboard.press('Alt+ArrowUp');
        await expectFieldEditor(page, 'PRD-AB02', 'stockQuantity');

        const row2Warehouse = rowCell(page, 'PRD-AB02', 'warehouse');
        await row2Warehouse.click();
        await row2Warehouse.dblclick({ delay: 100 });
        await expect(page.locator('input.amb-autocomplete-editor')).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole('listbox', { name: 'Results List' })
            .getByRole('option', { selected: true })).toHaveCount(1);

        await page.keyboard.press('Alt+ArrowDown');
        await expect(rowCell(page, 'PRD-AB02', 'warehouse')).not.toHaveClass(/amb-autocomplete-cell--editing/);
        await expectFieldEditor(page, 'PRD-A003', 'warehouse');
        await page.keyboard.press('Alt+ArrowUp');
        await expectFieldEditor(page, 'PRD-AB02', 'warehouse');
    });

    test('waits for lookup lifecycle during same-page vertical navigation', async ({ page }) => {
        const row2Status = rowCell(page, 'PRD-AB02', 'status');

        await row2Status.click();
        await row2Status.dblclick();
        await expectLookupEditor(page, 'PRD-AB02');

        await page.keyboard.press('Alt+ArrowDown');
        await expect(row2Status).not.toHaveClass(/tabulator-editing/);
        await expectLookupEditor(page, 'PRD-A003');

        await page.keyboard.press('Enter');
        const dialog = page.locator('.amb-lookup-dialog');
        await expect(dialog).toBeVisible();
        await dialog.locator('.amb-lookup-dialog__footer .amb-lookup-dialog__button').first().click();
        await expect(dialog).toHaveCount(0);

        await page.keyboard.press('Alt+ArrowUp');
        await expectLookupEditor(page, 'PRD-AB02');
    });

    test('waits for lookup lifecycle across pages and page shortcuts', async ({ page }) => {
        const tableHolder = table(page).locator('.tabulator-tableholder');

        await tableHolder.hover();
        await page.mouse.wheel(0, 10000);
        await expect(rowByCode(page, 'PRD-H010')).toBeVisible();
        const lastStatus = rowCell(page, 'PRD-H010', 'status');
        await lastStatus.click();
        await lastStatus.dblclick();
        await expectLookupEditor(page, 'PRD-H010');

        await page.keyboard.press('Alt+ArrowDown');
        await waitForPage(page, 2);
        await expectLookupEditor(page, 'PRD-A011');

        await page.keyboard.press('Alt+ArrowUp');
        await waitForPage(page, 1);
        await expectLookupEditor(page, 'PRD-H010');

        await page.keyboard.press('Alt+PageDown');
        await waitForPage(page, 2);
        await expect(page.locator('.amb-lookup-editor')).toHaveCount(0);
        await expectItemCodeEditor(page);

        await page.keyboard.press('Alt+PageUp');
        await waitForPage(page, 1);
        await expect(page.locator('.amb-lookup-editor')).toHaveCount(0);
        await expectItemCodeEditor(page);
    });

    test('crosses adjacent pages vertically while preserving the field', async ({ page }) => {
        const tableHolder = table(page).locator('.tabulator-tableholder');

        await tableHolder.hover();
        await page.mouse.wheel(0, 10000);
        await expect(rowByCode(page, 'PRD-H010')).toBeVisible();
        const lastStock = rowCell(page, 'PRD-H010', 'stockQuantity');
        await lastStock.click();
        await lastStock.dblclick();
        await expectFieldEditor(page, 'PRD-H010', 'stockQuantity');

        await page.keyboard.press('Alt+ArrowDown');
        await waitForPage(page, 2);
        await expectFieldEditor(page, 'PRD-A011', 'stockQuantity');

        await page.keyboard.press('Alt+ArrowUp');
        await waitForPage(page, 1);
        await expectFieldEditor(page, 'PRD-H010', 'stockQuantity');
    });

    test('keeps vertical navigation stable on the partial final page and boundaries', async ({ page }) => {
        const firstStock = rowCell(page, 'PRD-A001', 'stockQuantity');
        await firstStock.click();
        await firstStock.dblclick();
        await expectFieldEditor(page, 'PRD-A001', 'stockQuantity');
        await page.keyboard.press('Alt+ArrowUp');
        await waitForPage(page, 1);
        await expectFieldEditor(page, 'PRD-A001', 'stockQuantity');

        await page.keyboard.press('Escape');
        const firstItemCode = cell(page, 'itemCode');
        await firstItemCode.click();
        await firstItemCode.dblclick({ delay: 100 });
        await expectItemCodeEditor(page);
        for (let pageNumber = 2; pageNumber <= 10; pageNumber += 1) {
            await moveAndCheck(page, 'Alt+PageDown', pageNumber);
        }

        const tableHolder = table(page).locator('.tabulator-tableholder');
        await page.keyboard.press('Escape');
        await tableHolder.hover();
        await page.mouse.wheel(0, 10000);
        await expect(rowByCode(page, 'PRD-H100')).toBeVisible();
        const lastStock = rowCell(page, 'PRD-H100', 'stockQuantity');
        await lastStock.click();
        await lastStock.dblclick();
        await expectFieldEditor(page, 'PRD-H100', 'stockQuantity');

        await page.keyboard.press('Alt+ArrowDown');
        await waitForPage(page, 11);
        await expectFieldEditor(page, 'PRD-A101', 'stockQuantity');
        await page.keyboard.press('Alt+ArrowDown');
        await waitForPage(page, 11);
        await expectFieldEditor(page, 'PRD-A101', 'stockQuantity');

        await page.keyboard.press('Alt+ArrowUp');
        await waitForPage(page, 10);
        await expectFieldEditor(page, 'PRD-H100', 'stockQuantity');
    });
});
