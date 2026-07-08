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

    test('main demo table navigation reaches row action buttons from editable cells', async ({ page }) => {
        await openInventoryDemo(page);

        const firstRow = page.locator('#inventory-table .tabulator-row').first();
        const productNameCell = firstRow.locator('.tabulator-cell[tabulator-field="productName"]');
        const itemCodeCell = firstRow.locator('.tabulator-cell[tabulator-field="itemCode"]');

        await productNameCell.click();
        await expect(productNameCell.locator('input.amb-cell-editor')).toBeFocused();
        await productNameCell.locator('input.amb-cell-editor').fill('Keyboard reachable product');
        await page.keyboard.press('Enter');
        await expect(firstRow).toHaveAttribute('data-state', 'modified');

        await itemCodeCell.click();
        await expect(itemCodeCell.locator('input.amb-cell-editor')).toBeFocused();
        await page.keyboard.press('Shift+Tab');

        const modifiedRollbackButton = firstRow.locator('.amb-row-action-button--rollback');

        await expect(modifiedRollbackButton).toBeFocused();
        await expect(modifiedRollbackButton).not.toHaveAttribute('tabindex', '-1');
        await expect(modifiedRollbackButton).toHaveAttribute('type', 'button');
        await expect(modifiedRollbackButton).toHaveAttribute('aria-label', 'Rollback product changes');

        await page.keyboard.press('Enter');
        await expect(page.locator('.teh-confirm-dialog--visible')).toBeVisible();
        await page.locator('.teh-confirm-dialog__button--confirm').press('Enter');
        await expect(firstRow).toHaveAttribute('data-state', 'clean');

        await page.locator('#javascript-demo .amb-toolbar__button--add').click();

        const newRow = page.locator('#inventory-table .tabulator-row[data-state="new"]').last();
        const newItemCodeCell = newRow.locator('.tabulator-cell[tabulator-field="itemCode"]');

        await expect(newItemCodeCell.locator('input.amb-cell-editor')).toBeFocused();
        await newItemCodeCell.locator('input.amb-cell-editor').fill('PRD-Z999');
        await page.keyboard.press('Shift+Tab');

        const removeNewButton = newRow.locator('.amb-row-action-button--remove-new');

        await expect(removeNewButton).toBeFocused();
        await expect(removeNewButton).not.toHaveAttribute('tabindex', '-1');
        await expect(removeNewButton).toHaveAttribute('type', 'button');
        await expect(removeNewButton).toHaveAttribute('aria-label', 'Remove new product');

        await page.keyboard.press('Enter');
        await expect(page.locator('.teh-confirm-dialog--visible')).toBeVisible();
        await page.locator('.teh-confirm-dialog__button--confirm').press('Enter');
        await expect(page.locator('#inventory-table .tabulator-row[data-state="new"]')).toHaveCount(0);
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
