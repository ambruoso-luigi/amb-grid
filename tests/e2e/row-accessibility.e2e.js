import { expect, test } from '@playwright/test';

const openBasicCrudDemo = async page => {
    await page.goto('/src/demo/index.html#feature-examples');
    await expect(page.locator('#basic-table.tabulator')).toBeVisible();
};

const openInventoryDemo = async page => {
    await page.goto('/src/demo/index.html#getting-started-javascript');
    await expect(page.locator('#inventory-table.tabulator')).toBeVisible();
    await expect(page.locator('#inventory-table .tabulator-row .amb-row-action-button--delete').first()).toBeVisible();
};

const openValidationDemo = async page => {
    await page.goto('/src/demo/index.html#feature-examples');
    await page.locator('[data-example="validation"]').click();
    await expect(page.locator('#validation-table.tabulator')).toBeVisible();
};

const selectedRowCount = page => {
    return page.locator('#basic-table .tabulator-row.tabulator-selected').count();
};

const getActiveGridFocus = page => {
    return page.evaluate(() => {
        const active = document.activeElement;
        const cell = active && typeof active.closest === 'function'
            ? active.closest('.tabulator-cell')
            : null;
        const actionButton = active && typeof active.closest === 'function'
            ? active.closest('.amb-row-action-button')
            : null;

        return {
            tagName: active ? active.tagName : null,
            className: active ? String(active.className) : null,
            field: cell ? cell.getAttribute('tabulator-field') : null,
            ariaLabel: active ? active.getAttribute('aria-label') : null,
            action: actionButton ? actionButton.dataset.action : null
        };
    });
};

test.describe('row controls accessibility', () => {
    test('Basic CRUD row selection supports pointer selection', async ({ page }) => {
        await openBasicCrudDemo(page);
        const firstSelection = page.locator('#basic-table .tabulator-row .amb-selection-column input[aria-label="Select Row"]').first();

        await firstSelection.click();
        await expect.poll(() => selectedRowCount(page)).toBe(1);
    });

    test('main demo row actions activate delete and rollback without confirmation', async ({ page }) => {
        await openInventoryDemo(page);

        const firstRow = page.locator('#inventory-table .tabulator-row').first();
        const deleteButton = firstRow.locator('.amb-row-action-button--delete');

        await expect(deleteButton).toBeVisible();
        await expect(deleteButton).toBeEnabled();
        await deleteButton.focus();
        await expect(deleteButton).toBeFocused();
        await expect(deleteButton).toHaveAttribute('aria-label', 'Delete product');
        await expect(deleteButton).toHaveAttribute('title', 'Delete product');

        await deleteButton.focus();
        await page.keyboard.press('Enter');
        await expect(firstRow).toHaveAttribute('data-state', 'deleted');
        await expect(page.locator('.teh-confirm-dialog--visible')).toHaveCount(0);

        const rollbackButton = firstRow.locator('.amb-row-action-button--rollback');

        await expect(rollbackButton).toBeVisible();
        await expect(rollbackButton).toBeEnabled();
        await expect(rollbackButton).toBeFocused();
        await expect(rollbackButton).toHaveAttribute('aria-label', 'Rollback product changes');
        await expect(rollbackButton).toHaveAttribute('title', 'Rollback product changes');

        await page.keyboard.press('Space');
        await expect(firstRow).toHaveAttribute('data-state', 'clean');
        await expect(page.locator('.teh-confirm-dialog--visible')).toHaveCount(0);

        await expect(deleteButton).toBeVisible();
    });

    test('main demo confirms removal of a new row', async ({ page }) => {
        await openInventoryDemo(page);

        await page.locator('#javascript-demo .amb-toolbar__button--add').click();
        const newRow = page.locator('#inventory-table .tabulator-row[data-state="new"]');
        const removeNewButton = newRow.locator('.amb-row-action-button--remove-new');
        const itemCodeEditor = newRow.locator('.tabulator-cell[tabulator-field="itemCode"] input.amb-cell-editor');

        await expect(newRow).toBeVisible();
        await expect(removeNewButton).toBeVisible();
        await expect(itemCodeEditor).toBeVisible();
        await expect(itemCodeEditor).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(itemCodeEditor).toHaveCount(0);
        await page.keyboard.press('ArrowLeft');
        await expect(removeNewButton).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.locator('.teh-confirm-dialog--visible')).toBeVisible();
        await page.locator('.teh-confirm-dialog__button--cancel').click();
        await expect(newRow).toBeVisible();
        await expect(newRow).toHaveAttribute('data-state', 'new');
        await expect(removeNewButton).toBeFocused();
        await page.keyboard.press('Space');
        await expect(page.locator('.teh-confirm-dialog--visible')).toBeVisible();
        await page.locator('.teh-confirm-dialog__button--confirm').click();
        await expect(newRow).toHaveCount(0);
    });

    test('main demo row action exits to Item code with native Tab navigation', async ({ page }) => {
        await openInventoryDemo(page);

        const deleteButtonSelector = '#inventory-table .tabulator-row:first-child .amb-row-action-button--delete';
        const deleteButton = page.locator(deleteButtonSelector);
        const firstRow = page.locator('#inventory-table .tabulator-row').first();

        await deleteButton.focus();

        const actionFocus = await getActiveGridFocus(page);

        await expect(deleteButton).toBeFocused();
        expect(actionFocus.action).toBe('delete');
        expect(actionFocus.field).toBeNull();

        await page.keyboard.press('Tab');

        const afterActionFocus = await getActiveGridFocus(page);

        expect(afterActionFocus.className).not.toContain('amb-row-action-button');
        expect(afterActionFocus.tagName).toBe('INPUT');
        expect(afterActionFocus.field).toBe('itemCode');

    });

    test('main demo data cbox still supports whole-cell mouse editing', async ({ page }) => {
        await openInventoryDemo(page);

        const cboxCell = page.locator('#inventory-table .tabulator-row:first-child .tabulator-cell[tabulator-field="requiresInspection"]');

        await cboxCell.click({ position: { x: 4, y: 4 } });
        await expect(cboxCell.locator('.demo-inspection-visual')).not.toHaveClass(/is-checked/);

        await cboxCell.click({ position: { x: 4, y: 4 } });
        await expect(cboxCell.locator('.demo-inspection-visual')).toHaveClass(/is-checked/);
    });

    test('validation row actions stay skipped while clean and become reachable after anomalies', async ({ page }) => {
        await openValidationDemo(page);

        const table = page.locator('#validation-table');
        const rows = table.locator('.tabulator-row');
        const firstRow = rows.nth(0);
        const secondRow = rows.filter({ hasText: 'Beacon' });

        await expect(rows).toHaveCount(11);
        await expect(table.locator('.amb-row-action-button')).toHaveCount(0);

        await page.getByTitle('Create intentional validation errors').click();
        await expect(firstRow).toHaveAttribute('data-state', 'clean');
        await expect(firstRow.locator('.amb-row-action-button')).toHaveCount(0);
        await expect(secondRow).toHaveAttribute('data-state', 'modified');
        await expect(table.locator('.amb-row-action-button--rollback')).toHaveCount(10);

        const rollbackRow = secondRow;
        const rollback = rollbackRow.locator('.amb-row-action-button--rollback');

        await rollback.focus();
        await expect(rollback).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect.poll(() => page.evaluate(() => {
            return !document.activeElement?.matches('.amb-row-actions');
        })).toBe(true);
        await rollback.focus();
        await page.keyboard.press('Tab');
        await expect.poll(() => page.evaluate(() => {
            return !document.activeElement?.matches('.amb-row-actions');
        })).toBe(true);
        await rollback.focus();
        await rollback.click();
        await expect(page.locator('.teh-confirm-dialog--visible')).toBeVisible();
        await page.locator('.teh-confirm-dialog__button--confirm').click();
        await expect(rollbackRow).toHaveAttribute('data-state', 'clean');
        await expect(rollbackRow.locator('.amb-row-action-button')).toHaveCount(0);
        await expect.poll(() => page.evaluate(() => {
            const active = document.activeElement;

            return Boolean(active && active !== document.body && !active.matches('.amb-row-actions'));
        })).toBe(true);
    });
});
