import { expect, test } from '@playwright/test';
import { enterNavigationWithClick, openEditorFromNavigation } from './helpers/focus-diagnostics.js';

const table = page => page.locator('#inventory-table');
const rowByCode = (page, code) => table(page).locator('.tabulator-row').filter({ hasText: code });
const rowCell = (page, code, field) => rowByCode(page, code)
    .locator(`.tabulator-cell[tabulator-field="${field}"]`);
const currentPage = page => table(page).locator('.tabulator-page.active').textContent()
    .then(value => Number(value));
const firstVisibleItemCode = page => table(page).locator('.tabulator-row').first()
    .locator('.tabulator-cell[tabulator-field="itemCode"]');
const lastVisibleItemCode = page => table(page).locator('.tabulator-row').last()
    .locator('.tabulator-cell[tabulator-field="itemCode"]');

const goToPenultimatePage = async page => {
    const last = table(page).locator('.tabulator-page[data-page="last"]');
    await expect(last).toBeVisible();
    await last.click();
    const previous = table(page).locator('.tabulator-page[data-page="prev"]');
    await previous.click();
    return currentPage(page);
};
const expectFocusIndicator = target => expect.poll(() => target.evaluate(element => {
    const style = getComputedStyle(element);
    return style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0;
})).toBe(true);

const focusNavigationCell = (page, target, label) => enterNavigationWithClick(page, target, label, '#inventory-table');

const expectNavigationFocus = async target => {
    await expect(target).toBeFocused();
    await expect(target).not.toHaveClass(/tabulator-editing/);
    await expect(target.locator('input.amb-cell-editor')).toHaveCount(0);
};

const activeCellField = page => page.evaluate(() => {
    const active = document.activeElement;
    const cell = active?.closest?.('.tabulator-cell');

    return cell?.getAttribute('tabulator-field') || null;
});

test.describe('keyboard spatial navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/#getting-started-javascript');
        await expect(table(page)).toBeVisible();
        await expect(rowByCode(page, 'PRD-A001')).toBeVisible();
    });

    test('moves directionally without editing and does not wrap horizontally', async ({ page }) => {
        const start = rowCell(page, 'PRD-AB02', 'itemCode');
        const right = rowCell(page, 'PRD-AB02', 'productName');
        const down = rowCell(page, 'PRD-A003', 'productName');
        await focusNavigationCell(page, start, 'directional start');
        await expectFocusIndicator(start);
        await page.keyboard.press('ArrowRight');
        await expectNavigationFocus(right);
        await page.keyboard.press('ArrowDown');
        await expectNavigationFocus(down);
        await page.keyboard.press('ArrowLeft');
        await expectNavigationFocus(rowCell(page, 'PRD-A003', 'itemCode'));
        await page.keyboard.press('ArrowUp');
        await expectNavigationFocus(start);
        const last = rowCell(page, 'PRD-AB02', 'notes');
        await focusNavigationCell(page, last, 'directional boundary');
        await page.keyboard.press('ArrowRight');
        await expectNavigationFocus(last);
    });

    test('commits and cancels a mouse-opened text editor back to navigation focus', async ({ page }) => {
        const target = rowCell(page, 'PRD-AB02', 'productName');
        const original = await target.textContent();

        await target.dblclick();
        const input = target.locator('input.amb-cell-editor');
        await input.fill('Mouse commit test');
        await page.keyboard.press('Enter');
        await expectNavigationFocus(target);
        await expect(target).toContainText('Mouse commit test');

        await target.dblclick();
        await input.fill('Mouse cancel test');
        await page.keyboard.press('Escape');
        await expectNavigationFocus(target);
        await expect(target).not.toContainText('Mouse cancel test');
        expect(original).not.toBeNull();
    });

    test('crosses adjacent pages vertically while preserving focus-only navigation', async ({ page }) => {
        const first = rowCell(page, 'PRD-A001', 'itemCode');
        const last = rowCell(page, 'PRD-H010', 'itemCode');
        await first.focus();
        await expect(first).toBeFocused();
        await page.keyboard.press('ArrowUp');
        await expectNavigationFocus(first);
        await expect.poll(() => currentPage(page)).toBe(1);
        await last.focus();
        await expect(last).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect.poll(() => currentPage(page)).toBe(2);
        const nextFirst = rowCell(page, 'PRD-A011', 'itemCode');
        await expectNavigationFocus(nextFirst);
        await focusNavigationCell(page, nextFirst, 'directional return from page two');
        await page.keyboard.press('ArrowUp');
        await expect.poll(() => currentPage(page)).toBe(1);
        await expectNavigationFocus(last);
    });

    test('preserves Item code focus across the final page boundary with Arrow keys', async ({ page }) => {
        const penultimate = await goToPenultimatePage(page);
        const lastItemCode = lastVisibleItemCode(page);
        await focusNavigationCell(page, lastItemCode, 'final boundary ArrowDown setup');

        await page.keyboard.press('ArrowDown');
        await expect.poll(() => currentPage(page)).toBeGreaterThan(await penultimate);
        await expectNavigationFocus(firstVisibleItemCode(page));
        await expect(table(page).locator('.tabulator-cell.tabulator-editing')).toHaveCount(0);

        await page.keyboard.press('ArrowUp');
        await expect.poll(() => currentPage(page)).toBe(penultimate);
        await expectNavigationFocus(lastVisibleItemCode(page));
        await expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false);
    });

    for (const key of ['ArrowLeft', 'ArrowUp']) {
        test(`standard text editor keeps ${key} inside the editor`, async ({ page }) => {
            const target = rowCell(page, 'PRD-AB02', 'productName');

            const input = await openEditorFromNavigation(page, target, `text editor ${key}`, '#inventory-table');
            await page.keyboard.press(key);
            await expect(input).toHaveCount(1);
            await expect(input).toBeFocused();
            await expect(target).toHaveClass(/tabulator-editing/);
            await expect(table(page).locator('.tabulator-cell.tabulator-editing')).toHaveCount(1);
        });
    }

    test('commits a text editor with Enter and restores navigation focus to its source cell', async ({ page }) => {
        const target = rowCell(page, 'PRD-AB02', 'productName');
        const adjacent = rowCell(page, 'PRD-AB02', 'warehouse');
        await focusNavigationCell(page, target, 'keyboard commit');
        await page.keyboard.press('Enter');
        const input = target.locator('input.amb-cell-editor');
        await expect(input).toBeVisible();
        await expect(input).toBeFocused();
        await input.fill('Keyboard commit test');
        await page.keyboard.press('Enter');
        await expect(input).toHaveCount(0);
        await expect(target).not.toHaveClass(/tabulator-editing/);
        await expectNavigationFocus(target);
        await expect(target).toContainText('Keyboard commit test');
        await expect(adjacent).not.toBeFocused();
    });

    test('cancels a text editor with Escape and restores navigation focus to its source cell', async ({ page }) => {
        const target = rowCell(page, 'PRD-AB02', 'productName');
        const original = await target.textContent();
        await target.press('Enter');
        const input = target.locator('input.amb-cell-editor');
        await expect(input).toBeVisible();
        await expect(input).toBeFocused();
        await input.fill('DO NOT SAVE THIS');
        await page.keyboard.press('Escape');
        await expect(input).toHaveCount(0);
        await expect(target).not.toHaveClass(/tabulator-editing/);
        await expectNavigationFocus(target);
        await expect(target).toContainText(original || '');
        await expect(target).not.toContainText('DO NOT SAVE THIS');
    });

    test('keeps autocomplete ArrowDown in its dropdown', async ({ page }) => {
        const warehouse = rowCell(page, 'PRD-AB02', 'warehouse');
        const input = await openEditorFromNavigation(page, warehouse, 'autocomplete ArrowDown', '#inventory-table', 'input.amb-autocomplete-editor');
        await page.keyboard.press('ArrowDown');
        await expect(input).toBeFocused();
        await expect(page.getByRole('listbox', { name: 'Results List' })
            .getByRole('option', { selected: true })).toHaveCount(1);
        await expect(warehouse).toHaveClass(/tabulator-editing/);
    });

    test('uses lookup double click for manual editing and F2 for the dialog', async ({ page }) => {
        const status = rowCell(page, 'PRD-AB02', 'status');
        const dialog = page.locator('.amb-lookup-dialog');

        await focusNavigationCell(page, status, 'lookup manual editing');
        await expect(status.locator('.amb-lookup-editor__input')).toHaveCount(0);
        await expect(dialog).toHaveCount(0);

        await status.dblclick({ delay: 100 });
        await expect(status.locator('.amb-lookup-editor__input')).toBeFocused();
        await expect(dialog).toHaveCount(0);
        await page.keyboard.press('Escape');
        await expectNavigationFocus(status);

        await page.keyboard.press('F2');
        await expect(dialog).toBeVisible();
    });

    test('does not use Alt+Arrow as a default directional binding', async ({ page }) => {
        const target = rowCell(page, 'PRD-AB02', 'itemCode');
        const previous = rowCell(page, 'PRD-A001', 'itemCode');
        const next = rowCell(page, 'PRD-A003', 'itemCode');
        await focusNavigationCell(page, target, 'Alt arrow');
        await page.keyboard.press('Alt+ArrowDown');
        await expect(next).not.toBeFocused();
        await expect(next).not.toHaveClass(/tabulator-editing/);
        await page.keyboard.press('Alt+ArrowUp');
        await expect(previous).not.toBeFocused();
        await expect(previous).not.toHaveClass(/tabulator-editing/);
    });

    test('skips Basic CRUD readonly cells with geometric operational focus', async ({ page }) => {
        await page.goto('/src/demo/index.html#feature-examples');
        const basicTable = page.locator('#basic-table');
        const row = basicTable.locator('.tabulator-row').first();
        const title = row.locator('.tabulator-cell[tabulator-field="title"]');
        await expect(title).toBeVisible();
        await focusNavigationCell(page, title, 'readonly cell');

        await page.keyboard.press('ArrowLeft');
        await expect.poll(async () => ['id', '_ambTempId', '_ambRowNumber', '_state']
            .includes(await activeCellField(page))).toBe(false);
        await expect.poll(() => page.evaluate(() => document.activeElement?.matches('.amb-row-action-button')))
            .toBe(true);

        await page.keyboard.press('ArrowRight');
        await expect.poll(() => activeCellField(page)).toBe('title');
        await expect(title).not.toHaveClass(/tabulator-editing/);

        await page.keyboard.press('Enter');
        await expect(title).toHaveClass(/tabulator-editing/);
        await expect(title.locator('input.amb-cell-editor')).toBeFocused();
    });
});
