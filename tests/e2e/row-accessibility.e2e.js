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

const focusInventoryItemCodeEditorFromCell = async page => {
    const itemCodeCell = page.locator('#inventory-table .tabulator-row:first-child .tabulator-cell[tabulator-field="itemCode"]');

    await itemCodeCell.click();
    await page.keyboard.press('F2');
    await expect.poll(async () => {
        const focus = await getActiveGridFocus(page);

        return `${focus.tagName}:${focus.field}`;
    }).toBe('INPUT:itemCode');
};

const tabToFocusedAction = async (page, selector) => {
    for (let index = 0; index < 20; index += 1) {
        const focus = await getActiveGridFocus(page);

        if (focus.action && await page.locator(selector).evaluate(element => element === document.activeElement)) {
            return focus;
        }

        await page.keyboard.press('Tab');
    }

    await expect(page.locator(selector)).toBeFocused();
    return getActiveGridFocus(page);
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

    test('main demo row action is reachable from internal cell Tab navigation', async ({ page }) => {
        await openInventoryDemo(page);

        const deleteButtonSelector = '#inventory-table .tabulator-row:first-child .amb-row-action-button--delete';
        const deleteButton = page.locator(deleteButtonSelector);
        const firstRow = page.locator('#inventory-table .tabulator-row').first();

        await focusInventoryItemCodeEditorFromCell(page);

        const actionFocus = await tabToFocusedAction(page, deleteButtonSelector);

        await expect(deleteButton).toBeFocused();
        expect(actionFocus.action).toBe('delete');
        expect(actionFocus.field).toBe('_demoRowActions');

        await page.keyboard.press('Shift+Tab');

        const previousFocus = await getActiveGridFocus(page);

        expect(previousFocus.field).toBe('requiresInspection');
        expect(previousFocus.className).toContain('amb-checkbox-editor__input');

        await page.keyboard.press('Tab');
        await expect(deleteButton).toBeFocused();

        await page.keyboard.press('Tab');

        const afterActionFocus = await getActiveGridFocus(page);

        expect(afterActionFocus.className).not.toContain('amb-row-action-button');
        expect(afterActionFocus.tagName).toBe('TEXTAREA');

        await deleteButton.focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('.teh-confirm-dialog--visible')).toBeVisible();
        await page.locator('.teh-confirm-dialog__button--confirm').press('Enter');
        await expect(firstRow).toHaveAttribute('data-state', 'deleted');
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
