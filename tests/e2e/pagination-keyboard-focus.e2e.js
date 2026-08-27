import { expect, test } from '@playwright/test';

const table = page => page.locator('#inventory-table');
const firstRow = page => table(page).locator('.tabulator-row').first();
const cell = (page, field) => firstRow(page).locator(`.tabulator-cell[tabulator-field="${field}"]`);

const waitForPage = async (page, pageNumber) => {
    await expect.poll(() => table(page).locator('.tabulator-page.active').textContent())
        .toBe(String(pageNumber));
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

test.describe('keyboard pagination focus', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/#getting-started-javascript');
        await expect(table(page)).toBeVisible();
        await expect(firstRow(page)).toBeVisible();
        await expect(table(page).locator('.tabulator-page[data-page="2"]')).toBeVisible();
    });

    test('keeps a real Item code editor through repeated forward and backward shortcuts', async ({ page }) => {
        await cell(page, 'itemCode').dblclick({ delay: 100 });
        await expectItemCodeEditor(page);

        await page.keyboard.press('Alt+PageDown');
        await waitForPage(page, 2);
        await expectItemCodeEditor(page);

        await page.keyboard.press('Alt+PageDown');
        await waitForPage(page, 3);
        await expectItemCodeEditor(page);

        await page.keyboard.press('Alt+PageUp');
        await waitForPage(page, 2);
        await expectItemCodeEditor(page);

        await page.keyboard.press('Alt+PageUp');
        await waitForPage(page, 1);
        await expectItemCodeEditor(page);

        await page.keyboard.type('X');
        await expect(cell(page, 'itemCode').locator('input.amb-cell-editor')).toHaveValue(/X/);
        await page.keyboard.press('Escape');
    });

    test('closes Warehouse naturally before keyboard pagination and cleans it up', async ({ page }) => {
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
