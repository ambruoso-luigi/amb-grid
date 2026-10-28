import { expect, test } from '@playwright/test';
import { enterNavigationWithClick, reportFocusDiagnostics } from './helpers/focus-diagnostics.js';

const openInventoryDemo = async (page, { publicEntry = false } = {}) => {
    await page.goto(publicEntry ? '/#getting-started-javascript' : '/src/demo/index.html#getting-started-javascript');
    await expect(page.locator('#inventory-table.tabulator')).toBeVisible();
    await expect(page.locator('#inventory-table .tabulator-row .amb-row-action-button--delete').first()).toBeVisible();
};

const openValidationDemo = async page => {
    await page.goto('/src/demo/index.html#feature-examples');
    await page.locator('[data-example="validation"]').click();
    await expect(page.locator('#validation-table.tabulator')).toBeVisible();
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
    test('main demo row actions activate delete and rollback without confirmation', async ({ page }) => {
        await openInventoryDemo(page, { publicEntry: true });

        const firstRow = page.locator('#inventory-table .tabulator-row')
            .filter({ hasText: 'PRD-A001' });
        const itemCode = firstRow.locator('.tabulator-cell[tabulator-field="itemCode"]');
        const deleteButton = firstRow.locator('.amb-row-action-button--delete');

        await enterNavigationWithClick(page, itemCode, 'Delete row action setup', '#inventory-table');
        await page.keyboard.press('ArrowLeft');
        await expect(deleteButton).toBeVisible();
        await expect(deleteButton).toBeEnabled();
        await expect(deleteButton).toBeFocused();
        await expect(deleteButton).toHaveAttribute('aria-label', 'Delete product');
        await expect(deleteButton).toHaveAttribute('title', 'Delete product');

        await page.keyboard.press('Enter');
        await expect(firstRow).toHaveAttribute('data-state', 'deleted');
        await expect(page.locator('.teh-confirm-dialog--visible')).toHaveCount(0);

        const rollbackButton = firstRow.locator('.amb-row-action-button--rollback');

        await expect(rollbackButton).toBeVisible();
        await expect(rollbackButton).toBeEnabled();
        await expect(rollbackButton).toHaveAttribute('aria-label', 'Rollback product changes');
        await expect(rollbackButton).toHaveAttribute('title', 'Rollback product changes');

        await page.keyboard.press('Space');
        await expect(firstRow).toHaveAttribute('data-state', 'clean');
        await expect(page.locator('.teh-confirm-dialog--visible')).toHaveCount(0);

        await expect(deleteButton).toBeVisible();
    });

    test('main demo confirms removal of a new row', async ({ page }) => {
        await openInventoryDemo(page, { publicEntry: true });

        const addButton = page.locator('#javascript-demo .amb-toolbar__button--add');
        await addButton.click();
        const newRow = page.locator('#inventory-table .tabulator-row[data-state="new"]');
        const itemCode = newRow.locator('[tabulator-field="itemCode"]');
        const removeNewButton = newRow.locator('.amb-row-action-button--remove-new');

        try {
            await expect(newRow).toBeVisible();
            await expect(addButton).not.toHaveAttribute('aria-busy', 'true');
            await expect(itemCode.locator('input.amb-cell-editor')).toBeFocused();
            await page.keyboard.press('Escape');
            await expect(itemCode).toBeFocused();
            await expect(newRow.locator('.tabulator-editing')).toHaveCount(0);
            await page.keyboard.press('ArrowLeft');
            await expect(removeNewButton).toBeVisible();
            await expect(removeNewButton).toBeEnabled();
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
            await expect.poll(() => getActiveGridFocus(page)).toMatchObject({ action: 'delete' });
        } catch (error) {
            await reportFocusDiagnostics(page, removeNewButton, 'New row confirmation failed', '#inventory-table');
            throw error;
        }
    });

    test('main demo row action exits to Item code with native Tab navigation', async ({ page }) => {
        await openInventoryDemo(page);

        const firstRow = page.locator('#inventory-table .tabulator-row').first();
        const itemCode = firstRow.locator('.tabulator-cell[tabulator-field="itemCode"]');
        const deleteButton = firstRow.locator('.amb-row-action-button--delete');
        const originalItemCode = await itemCode.textContent();
        const expectItemCodeNavigation = async () => {
            await expect(itemCode).toBeFocused();
            await expect(itemCode).not.toHaveClass(/tabulator-editing/);
            await expect(itemCode.locator('input')).toHaveCount(0);
            expect(await itemCode.evaluate(element => ({
                isActiveCell: document.activeElement === element,
                field: document.activeElement?.getAttribute('tabulator-field'),
                editing: element.classList.contains('tabulator-editing')
            }))).toEqual({ isActiveCell: true, field: 'itemCode', editing: false });
        };

        await expect(firstRow).toHaveAttribute('data-state', 'clean');
        await enterNavigationWithClick(page, itemCode, 'Row action Tab navigation setup', '#inventory-table');
        await page.keyboard.press('ArrowLeft');

        const actionFocus = await getActiveGridFocus(page);

        await expect(deleteButton).toBeFocused();
        await expect(deleteButton).toBeEnabled();
        expect(actionFocus.action).toBe('delete');
        expect(actionFocus.field).toBeNull();

        await page.keyboard.press('Tab');

        await expectItemCodeNavigation();
        const afterActionFocus = await getActiveGridFocus(page);
        expect(afterActionFocus.className).not.toContain('amb-row-action-button');
        expect(afterActionFocus.field).toBe('itemCode');

        await page.keyboard.press('Enter');
        const editor = itemCode.locator('input.amb-cell-editor');
        await expect(itemCode).toHaveClass(/tabulator-editing/);
        await expect(editor).toBeFocused();
        expect(await getActiveGridFocus(page)).toMatchObject({ tagName: 'INPUT', field: 'itemCode', action: null });

        await page.keyboard.press('Escape');
        await expectItemCodeNavigation();
        await expect(itemCode).toHaveText(originalItemCode);
        await expect(firstRow).toHaveAttribute('data-state', 'clean');
        await expect(deleteButton).toBeVisible();
        await expect(firstRow.locator('.amb-row-action-button--rollback')).toHaveCount(0);
        await expect(page.locator('.teh-confirm-dialog--visible')).toHaveCount(0);
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
        const secondRow = rows.filter({
            has: page.locator('.tabulator-cell[tabulator-field="email"]').filter({ hasText: /^beacon@example\.test$/ })
        });

        await expect(rows).toHaveCount(11);
        await expect(table.locator('.amb-row-action-button')).toHaveCount(0);

        await page.getByTitle('Create intentional validation errors').click();
        await expect(firstRow).toHaveAttribute('data-state', 'clean');
        await expect(firstRow.locator('.amb-row-action-button')).toHaveCount(0);
        await expect(secondRow).toHaveAttribute('data-state', 'modified');
        await expect(table.locator('.amb-row-action-button--rollback')).toHaveCount(10);

        const rollbackRow = secondRow;
        const rollback = rollbackRow.locator('.amb-row-action-button--rollback');
        const idCell = rollbackRow.locator('.tabulator-cell[tabulator-field="id"]');
        const previousRowLastCell = firstRow.locator('.tabulator-cell[tabulator-field="documentNumber"]');

        await expect(rollbackRow.locator('.tabulator-cell[tabulator-field="id"]')).toHaveText('2');
        await enterNavigationWithClick(page, idCell, 'Validation Rollback keyboard setup', '#validation-table');
        await page.keyboard.press('ArrowLeft');
        await expect(rollback).toBeFocused();
        expect(await getActiveGridFocus(page)).toMatchObject({ tagName: 'BUTTON', action: 'rollback' });
        await page.keyboard.press('Tab');
        await expect(idCell).toBeFocused();
        await expect(idCell).not.toHaveClass(/tabulator-editing/);
        expect(await getActiveGridFocus(page)).toMatchObject({ field: 'id', action: null });

        await page.keyboard.press('ArrowLeft');
        await expect(rollback).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(previousRowLastCell).toBeFocused();
        await expect(previousRowLastCell).not.toHaveClass(/tabulator-editing/);
        expect(await getActiveGridFocus(page)).toMatchObject({ field: 'documentNumber', action: null });

        await page.keyboard.press('Tab');
        await expect(idCell).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(rollback).toBeFocused();
        await page.keyboard.press('Enter');
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
