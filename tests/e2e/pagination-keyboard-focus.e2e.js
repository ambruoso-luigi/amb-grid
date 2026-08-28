import { expect, test } from '@playwright/test';

const table = page => page.locator('#inventory-table');
const firstRow = page => table(page).locator('.tabulator-row').first();
const cell = (page, field) => firstRow(page).locator(`.tabulator-cell[tabulator-field="${field}"]`);
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
});
