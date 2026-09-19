import { expect, test } from '@playwright/test';

const table = page => page.locator('#inventory-table');
const rowByCode = (page, code) => table(page).locator('.tabulator-row').filter({ hasText: code });
const rowCell = (page, code, field) => rowByCode(page, code)
    .locator(`.tabulator-cell[tabulator-field="${field}"]`);
const currentPage = page => table(page).locator('.tabulator-page.active').textContent()
    .then(value => Number(value));
const expectFocusIndicator = target => expect.poll(() => target.evaluate(element => {
    const style = getComputedStyle(element);
    return style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0;
})).toBe(true);

const focusNavigationCell = async target => {
    await target.evaluate(element => {
        const blockEditFocus = event => event.stopImmediatePropagation();
        element.addEventListener('focus', blockEditFocus, true);
        element.focus({ preventScroll: true });
        element.removeEventListener('focus', blockEditFocus, true);
    });
    await expect(target).toBeFocused();
    await expect(target).not.toHaveClass(/tabulator-editing/);
};

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
        await focusNavigationCell(start);
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
        await focusNavigationCell(last);
        await page.keyboard.press('ArrowRight');
        await expectNavigationFocus(last);
    });

    test('crosses adjacent pages vertically while preserving focus-only navigation', async ({ page }) => {
        const first = rowCell(page, 'PRD-A001', 'itemCode');
        const last = rowCell(page, 'PRD-H010', 'itemCode');
        await focusNavigationCell(first);
        await page.keyboard.press('ArrowUp');
        await expectNavigationFocus(first);
        await expect(await currentPage(page)).toBe(1);
        await focusNavigationCell(last);
        await page.keyboard.press('ArrowDown');
        await expect(await currentPage(page)).toBe(2);
        const nextFirst = rowCell(page, 'PRD-I011', 'itemCode');
        await expectNavigationFocus(nextFirst);
        await page.keyboard.press('ArrowUp');
        await expect(await currentPage(page)).toBe(1);
        await expectNavigationFocus(last);
    });

    test('Enter opens an editor while editor arrows stay in the input', async ({ page }) => {
        const start = rowCell(page, 'PRD-AB02', 'itemCode');
        const target = rowCell(page, 'PRD-AB02', 'productName');
        const below = rowCell(page, 'PRD-A003', 'productName');
        await focusNavigationCell(start);
        await page.keyboard.press('ArrowRight');
        await expectNavigationFocus(target);
        await page.keyboard.press('Enter');
        const input = target.locator('input.amb-cell-editor');
        await expect(target).toHaveClass(/tabulator-editing/);
        await expect(input).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(input).toBeFocused();
        await expect(target).toHaveClass(/tabulator-editing/);
        await page.keyboard.press('ArrowRight');
        await expect(input).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(input).toBeFocused();
        await expect(target).toHaveClass(/tabulator-editing/);
        await expect(below).not.toHaveClass(/tabulator-editing/);
        await page.keyboard.press('ArrowUp');
        await expect(input).toBeFocused();
        await expect(target).toHaveClass(/tabulator-editing/);
    });

    test('commits a text editor with Enter and restores navigation focus to its source cell', async ({ page }) => {
        const target = rowCell(page, 'PRD-AB02', 'productName');
        const adjacent = rowCell(page, 'PRD-AB02', 'warehouse');
        await focusNavigationCell(target);
        await page.keyboard.press('Enter');
        const input = target.locator('input.amb-cell-editor');
        await expect(input).toBeFocused();
        await input.fill('Keyboard commit test');
        await page.keyboard.press('Enter');
        await expectNavigationFocus(target);
        await expect(target).toContainText('Keyboard commit test');
        await expect(adjacent).not.toBeFocused();
        await expectFocusIndicator(target);
    });

    test('cancels a text editor with Escape and restores navigation focus to its source cell', async ({ page }) => {
        const target = rowCell(page, 'PRD-AB02', 'productName');
        const original = await target.textContent();
        await focusNavigationCell(target);
        await page.keyboard.press('Enter');
        const input = target.locator('input.amb-cell-editor');
        await input.fill('DO NOT SAVE THIS');
        await page.keyboard.press('Escape');
        await expectNavigationFocus(target);
        await expect(target).toContainText(original || '');
        await expect(target).not.toContainText('DO NOT SAVE THIS');
        await expectFocusIndicator(target);
    });

    test('keeps autocomplete ArrowDown in its dropdown', async ({ page }) => {
        const warehouse = rowCell(page, 'PRD-AB02', 'warehouse');
        await warehouse.dblclick({ delay: 100 });
        const input = warehouse.locator('input.amb-autocomplete-editor');
        await expect(input).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(input).toBeFocused();
        await expect(page.getByRole('listbox', { name: 'Results List' })
            .getByRole('option', { selected: true })).toHaveCount(1);
        await expect(warehouse).toHaveClass(/tabulator-editing/);
    });

    test('moves large text without opening its dialog and keeps its page boundary', async ({ page }) => {
        const notes = rowCell(page, 'PRD-AB02', 'notes');
        const nextNotes = rowCell(page, 'PRD-A003', 'notes');
        await focusNavigationCell(notes);
        await page.keyboard.press('ArrowDown');
        await expectNavigationFocus(nextNotes);
        await expectFocusIndicator(nextNotes);
        await expect(page.locator('.amb-large-text-editor')).toHaveCount(0);
        await page.keyboard.press('ArrowUp');
        await expectNavigationFocus(notes);
        const lastNotes = rowCell(page, 'PRD-H010', 'notes');
        await focusNavigationCell(lastNotes);
        await page.keyboard.press('ArrowDown');
        await expectNavigationFocus(lastNotes);
        await expect(await currentPage(page)).toBe(1);
        await expect(page.locator('.amb-large-text-editor')).toHaveCount(0);
    });

    test('does not use Alt+Arrow as a default directional binding', async ({ page }) => {
        const target = rowCell(page, 'PRD-AB02', 'itemCode');
        const previous = rowCell(page, 'PRD-A001', 'itemCode');
        const next = rowCell(page, 'PRD-A003', 'itemCode');
        await focusNavigationCell(target);
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
        await focusNavigationCell(title);

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
