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

    test('uses click for navigation and double click or Enter for the same text editor', async ({ page }) => {
        const target = rowCell(page, 'PRD-AB02', 'productName');
        const right = rowCell(page, 'PRD-AB02', 'warehouse');

        await target.click();
        await expectNavigationFocus(target);
        await page.keyboard.press('ArrowRight');
        await expectNavigationFocus(right);

        await target.dblclick();
        await expect(target).toHaveClass(/tabulator-editing/);
        await expect(target.locator('input.amb-cell-editor')).toBeFocused();
        await page.keyboard.press('Escape');
        await expectNavigationFocus(target);

        await page.keyboard.press('Enter');
        await expect(target.locator('input.amb-cell-editor')).toBeFocused();
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

    test('keeps navigation and editing DOM state mutually exclusive through mouse close flows', async ({ page }) => {
        const source = rowCell(page, 'PRD-AB02', 'productName');
        const destination = rowCell(page, 'PRD-AB02', 'warehouse');
        const editors = table(page).locator('.tabulator-cell.tabulator-editing');

        await source.click();
        await expectNavigationFocus(source);
        await expect(editors).toHaveCount(0);
        await expect(source.locator('input.amb-cell-editor')).toHaveCount(0);

        await source.dblclick({ delay: 100 });
        const input = source.locator('input.amb-cell-editor');
        await expect(input).toBeFocused();
        await expect(editors).toHaveCount(1);

        await input.fill('Cancelled mouse value');
        await page.keyboard.press('Escape');
        await expectNavigationFocus(source);
        await expect(editors).toHaveCount(0);
        await expect(source.locator('input.amb-cell-editor')).toHaveCount(0);

        await page.keyboard.press('ArrowRight');
        await expectNavigationFocus(destination);
        await expect(editors).toHaveCount(0);

        await source.click();
        await page.keyboard.press('Enter');
        await expect(input).toBeFocused();
        await input.fill('Committed navigation value');
        await page.keyboard.press('Enter');
        await expectNavigationFocus(source);
        await expect(editors).toHaveCount(0);
        await expect(source.locator('input.amb-cell-editor')).toHaveCount(0);

        await page.keyboard.press('ArrowRight');
        await expectNavigationFocus(destination);
        await expect(editors).toHaveCount(0);
    });

    test('uses the latest pointer destination after an editor blur', async ({ page }) => {
        const source = rowCell(page, 'PRD-AB02', 'productName');
        const destination = rowCell(page, 'PRD-AB02', 'warehouse');

        await source.dblclick({ delay: 100 });
        await source.locator('input.amb-cell-editor').fill('Pointer source commit');
        await destination.click();
        await expectNavigationFocus(destination);
        await expect(source).not.toHaveClass(/tabulator-editing/);
        await expect(source).toContainText('Pointer source commit');

        await destination.dblclick({ delay: 100 });
        await expect(destination).toHaveClass(/tabulator-editing/);
        await expect(destination.locator('input.amb-autocomplete-editor')).toBeFocused();
        await expect(source).not.toHaveClass(/tabulator-editing/);
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
        const nextFirst = rowCell(page, 'PRD-A011', 'itemCode');
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
        await warehouse.click();
        await expectNavigationFocus(warehouse);
        await expect(warehouse.locator('input.amb-autocomplete-editor')).toHaveCount(0);

        await warehouse.dblclick({ delay: 100 });
        const input = warehouse.locator('input.amb-autocomplete-editor');
        await expect(input).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(input).toBeFocused();
        await expect(page.getByRole('listbox', { name: 'Results List' })
            .getByRole('option', { selected: true })).toHaveCount(1);
        await expect(warehouse).toHaveClass(/tabulator-editing/);
    });

    test('uses lookup double click for manual editing and F2 for the dialog', async ({ page }) => {
        const status = rowCell(page, 'PRD-AB02', 'status');
        const dialog = page.locator('.amb-lookup-dialog');

        await status.click();
        await expectNavigationFocus(status);
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

    test('moves large text across the page boundary without opening its dialog', async ({ page }) => {
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
        await expect(await currentPage(page)).toBe(2);
        const nextPageNotes = rowCell(page, 'PRD-A011', 'notes');
        await expectNavigationFocus(nextPageNotes);
        await expect(nextPageNotes).not.toHaveClass(/tabulator-editing/);
        await expect(page.locator('.amb-large-text-editor')).toHaveCount(0);
        await page.keyboard.press('ArrowUp');
        await expect(await currentPage(page)).toBe(1);
        await expectNavigationFocus(lastNotes);
        await expect(lastNotes).not.toHaveClass(/tabulator-editing/);
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
