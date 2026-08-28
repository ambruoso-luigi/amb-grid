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

const expectFocusOutsideGrid = async page => {
    await expect.poll(() => page.evaluate(() => Boolean(
        document.activeElement
        && document.activeElement !== document.body
        && !document.activeElement.closest('#inventory-table')
        && !document.activeElement.closest('.amb-large-text-editor')
    ))).toBe(true);
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
        await cell(page, 'itemCode').dblclick({ delay: 100 });
        await expectItemCodeEditor(page);
        await page.keyboard.press('Shift+Tab');
        await expectFocusOutsideGrid(page);

        await cell(page, 'itemCode').dblclick({ delay: 100 });
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
});
