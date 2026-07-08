import { expect, test } from '@playwright/test';

const openBasicCrudDemo = async page => {
    await page.goto('/src/demo/index.html#feature-examples');
    await expect(page.locator('#basic-table.tabulator')).toBeVisible();
};

const openInventoryDemo = async page => {
    await page.goto('/src/demo/index.html#getting-started-javascript');
    await expect(page.locator('#inventory-table.tabulator')).toBeVisible();
};

const selectedRowCount = page => {
    return page.locator('#basic-table .tabulator-row.tabulator-selected').count();
};

const focusNextActionButton = async (page, selector) => {
    for (let index = 0; index < 30; index += 1) {
        const isFocused = await page.evaluate(selector => {
            const active = document.activeElement;

            return Boolean(active && active.matches(selector));
        }, selector);

        if (isFocused) return;

        await page.keyboard.press('Tab');
    }

    await expect(page.locator(selector).first()).toBeFocused();
};

test.describe('row controls accessibility', () => {
    test('Basic CRUD row selection is focusable and supports keyboard and mouse', async ({ page }) => {
        await openBasicCrudDemo(page);

        const firstSelection = page.locator('#basic-table .tabulator-row .amb-selection-column input[aria-label="Select Row"]').first();

        await firstSelection.focus();
        await expect(firstSelection).toBeFocused();

        await page.keyboard.press('Enter');
        await expect.poll(() => selectedRowCount(page)).toBe(1);

        await page.keyboard.press('0');
        await expect.poll(() => selectedRowCount(page)).toBe(0);

        await page.keyboard.press('1');
        await expect.poll(() => selectedRowCount(page)).toBe(1);

        await page.keyboard.press('Space');
        await expect.poll(() => selectedRowCount(page)).toBe(0);

        await firstSelection.click();
        await expect.poll(() => selectedRowCount(page)).toBe(1);
    });

    test('main demo row actions are reachable by Tab and activate delete and rollback', async ({ page }) => {
        await openInventoryDemo(page);

        const deleteButtonSelector = '#inventory-table .tabulator-row:first-child .amb-row-action-button--delete';
        const rollbackButtonSelector = '#inventory-table .tabulator-row:first-child .amb-row-action-button--rollback';
        const firstRow = page.locator('#inventory-table .tabulator-row').first();

        await page.locator('#javascript-demo .amb-toolbar__button--show-report').focus();
        await focusNextActionButton(page, deleteButtonSelector);

        const deleteButton = page.locator(deleteButtonSelector);

        await expect(deleteButton).toBeFocused();
        await expect(deleteButton).toHaveAttribute('aria-label', 'Delete product');
        await expect(deleteButton).toHaveAttribute('title', 'Delete product');

        await page.keyboard.press('Enter');
        await expect(page.locator('.teh-confirm-dialog--visible')).toBeVisible();
        await page.locator('.teh-confirm-dialog__button--confirm').press('Enter');
        await expect(firstRow).toHaveAttribute('data-state', 'deleted');

        await focusNextActionButton(page, rollbackButtonSelector);

        const rollbackButton = page.locator(rollbackButtonSelector);

        await expect(rollbackButton).toBeFocused();
        await expect(rollbackButton).toHaveAttribute('aria-label', 'Rollback product changes');
        await expect(rollbackButton).toHaveAttribute('title', 'Rollback product changes');

        await page.keyboard.press('Space');
        await expect(page.locator('.teh-confirm-dialog--visible')).toBeVisible();
        await page.locator('.teh-confirm-dialog__button--confirm').press('Enter');
        await expect(firstRow).toHaveAttribute('data-state', 'clean');

        await deleteButton.click();
        await expect(page.locator('.teh-confirm-dialog--visible')).toBeVisible();
    });

    test('main demo data cbox still supports whole-cell mouse editing', async ({ page }) => {
        await openInventoryDemo(page);

        const cboxCell = page.locator('#inventory-table .tabulator-row:first-child .tabulator-cell[tabulator-field="requiresInspection"]');

        await cboxCell.click({ position: { x: 4, y: 4 } });
        await expect(cboxCell.locator('.demo-inspection-visual')).not.toHaveClass(/is-checked/);

        await cboxCell.click({ position: { x: 4, y: 4 } });
        await expect(cboxCell.locator('.demo-inspection-visual')).toHaveClass(/is-checked/);
    });
});
