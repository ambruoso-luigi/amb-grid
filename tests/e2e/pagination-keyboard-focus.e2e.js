import { expect, test } from '@playwright/test';

const table = page => page.locator('#inventory-table');
const firstRow = page => table(page).locator('.tabulator-row').first();
const cell = (page, field) => firstRow(page).locator(`.tabulator-cell[tabulator-field="${field}"]`);

const waitForPage = async (page, pageNumber) => {
    await expect.poll(() => table(page).locator('.tabulator-page.active').textContent())
        .toBe(String(pageNumber));
};

const focusFirstEditableCell = async page => {
    const target = cell(page, 'itemCode');

    await expect(target).toBeVisible();
    await expect.poll(() => page.evaluate(() => Boolean(
        document.activeElement?.closest('#inventory-table')
    ))).toBe(true);
};

test.describe('keyboard pagination focus', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/#getting-started-javascript');
        await expect(table(page)).toBeVisible();
        await expect(firstRow(page)).toBeVisible();
        await expect(table(page).locator('.tabulator-page[data-page="2"]')).toBeVisible();
    });

    test('moves focus to the first editable cell and supports repeated forward/backward shortcuts', async ({ page }) => {
        await table(page).locator('.tabulator-tableholder').focus();
        await page.keyboard.press('Alt+PageDown');
        await waitForPage(page, 2);
        await focusFirstEditableCell(page);
        await expect(table(page).locator('.tabulator-editing')).toHaveCount(0);

        await table(page).locator('.tabulator-tableholder').focus();
        await page.keyboard.press('Alt+PageUp');
        await waitForPage(page, 1);

        await table(page).locator('.tabulator-tableholder').focus();
        await page.keyboard.press('Alt+PageDown');
        await waitForPage(page, 2);

        await table(page).locator('.tabulator-tableholder').focus();
        await page.keyboard.press('Alt+PageUp');
        await waitForPage(page, 1);
        await expect(table(page).locator('.tabulator-editing')).toHaveCount(0);
    });

    test('leaves Warehouse autocomplete editing cleanly around pagination shortcuts', async ({ page }) => {
        const warehouse = cell(page, 'warehouse');

        await warehouse.dblclick({ delay: 100 });
        await expect(page.locator('input.amb-autocomplete-editor')).toBeVisible();
        await page.keyboard.press('Escape');

        await table(page).locator('.tabulator-tableholder').focus();
        await page.keyboard.press('Alt+PageDown');
        await waitForPage(page, 2);
        await focusFirstEditableCell(page);
        await expect(table(page).locator('.tabulator-editing')).toHaveCount(0);

        await table(page).locator('.tabulator-tableholder').focus();
        await page.keyboard.press('Alt+PageUp');
        await waitForPage(page, 1);

        await expect(table(page).locator('.tabulator-editing')).toHaveCount(0);
    });
});
