import { expect, test } from '@playwright/test';

const measureLayout = page => page.evaluate(() => {
    const root = document.querySelector('#inventory-table');
    const holder = root.querySelector('.tabulator-tableholder');
    const table = root.querySelector('.tabulator-table');
    const rows = Array.from(holder.querySelectorAll('.tabulator-row'));
    const lastRow = rows.at(-1);
    const cell = lastRow.querySelector('.tabulator-cell[tabulator-field="warehouse"]');
    const input = cell.querySelector('.amb-autocomplete-editor');
    const dropdown = document.querySelector('.amb-autocomplete-dropdown');
    const wrapper = cell.querySelector('.awesomplete');
    const rect = element => {
        if (!element) return null;

        const value = element.getBoundingClientRect();

        return {
            top: value.top,
            bottom: value.bottom,
            left: value.left,
            right: value.right,
            width: value.width,
            height: value.height
        };
    };

    return {
        rowHeight: rect(lastRow).height,
        cellHeight: rect(cell).height,
        holderClientHeight: holder.clientHeight,
        holderScrollHeight: holder.scrollHeight,
        holderClientWidth: holder.clientWidth,
        holderScrollWidth: holder.scrollWidth,
        tableHeight: rect(table).height,
        rootHeight: rect(root).height,
        verticalOverflow: holder.scrollHeight > holder.clientHeight,
        horizontalOverflow: holder.scrollWidth > holder.clientWidth,
        dropdown: dropdown
            ? {
                parentIsBody: dropdown.parentElement === document.body,
                position: getComputedStyle(dropdown).position,
                rect: rect(dropdown)
            }
            : null,
        wrapper: rect(wrapper),
        input: rect(input),
        cell: rect(cell),
        lastRow: rect(lastRow)
    };
});

test.describe('autocomplete last-row layout', () => {
    test('keeps the floating Warehouse dropdown out of the grid layout', async ({ page }) => {
        await page.goto('/#getting-started-javascript');

        const table = page.locator('#inventory-table');
        const lastRow = table.locator('.tabulator-tableholder .tabulator-row')
            .filter({ hasText: 'PRD-H010' });
        const warehouse = lastRow.locator('.tabulator-cell[tabulator-field="warehouse"]');

        await expect(table).toBeVisible();
        await expect(lastRow).toBeVisible();
        await expect(warehouse).toBeVisible();

        const before = await measureLayout(page);

        await warehouse.dblclick();
        const input = warehouse.locator('input.amb-autocomplete-editor');

        await expect(input).toBeVisible();
        await expect(input).toBeFocused();
        await input.fill('');

        const dropdown = page.locator('.amb-autocomplete-dropdown');

        await expect(dropdown).toBeVisible();

        const after = await measureLayout(page);

        console.info('autocomplete last-row layout', { before, after });
        expect(after.dropdown).toMatchObject({
            parentIsBody: true,
            position: 'fixed'
        });
        expect(after.rowHeight - before.rowHeight).toBeLessThanOrEqual(1);
        expect(after.holderScrollHeight - before.holderScrollHeight).toBeLessThanOrEqual(1);
        expect(after.verticalOverflow).toBe(before.verticalOverflow);
        expect(after.horizontalOverflow).toBe(before.horizontalOverflow);

        await page.keyboard.press('Escape');
        await expect(input).toHaveCount(0);
        await expect(dropdown).toHaveCount(0);

        const closed = await measureLayout(page);

        expect(closed.rowHeight - before.rowHeight).toBeLessThanOrEqual(1);
        expect(closed.holderScrollHeight - before.holderScrollHeight).toBeLessThanOrEqual(1);
        expect(closed.verticalOverflow).toBe(before.verticalOverflow);
        expect(closed.horizontalOverflow).toBe(before.horizontalOverflow);
    });
});
