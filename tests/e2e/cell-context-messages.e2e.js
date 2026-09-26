import { expect, test } from '@playwright/test';

const table = page => page.locator('#inventory-table');
const row = (page, code) => table(page).locator('.tabulator-row').filter({ hasText: code });
const cell = (page, code, field) => row(page, code)
    .locator(`.tabulator-cell[tabulator-field="${field}"]`);
const message = page => page.locator('.teh-floating-message');
const messageBody = page => message(page).locator('.teh-floating-message__body');
const hasFocusIndicator = target => target.evaluate(element => {
    const style = getComputedStyle(element);

    return style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0;
});
const expectFocusIndicator = async target => {
    await expect.poll(() => hasFocusIndicator(target)).toBe(true);
};
const reactRow = (page, code) => page.locator('.react-demo-grid .tabulator-row').filter({ hasText: code });
const reactCell = (page, code, field) => reactRow(page, code)
    .locator(`.tabulator-cell[tabulator-field="${field}"]`);
const waitForReactDemoReady = async page => {
    const shell = page.locator('.react-demo-grid-shell');

    await expect(shell).toBeVisible();
    await expect(shell).toHaveAttribute('aria-busy', 'false');
    await expect(reactRow(page, 'ITM-1002')).toBeVisible();
    await expect(reactCell(page, 'ITM-1002', 'status')).toBeVisible();
};

test.describe('contextual cell messages and large-text focus', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/#getting-started-javascript');
        await expect(table(page)).toBeVisible();
        await expect(row(page, 'PRD-A001')).toBeVisible();
    });

    test('keyboard focus overrides a stale lookup hover and real mouse movement retakes ownership', async ({ page }) => {
        const firstStatus = cell(page, 'PRD-A001', 'status');

        await firstStatus.hover();
        await expect(message(page)).toHaveClass(/teh-floating-message--visible/);
        await expect(message(page).locator('.teh-floating-message__title')).toHaveText('Description');
        const firstDescription = await messageBody(page).textContent();

        await firstStatus.click();
        await page.keyboard.press('ArrowDown');
        await expect(cell(page, 'PRD-AB02', 'status')).toBeFocused();
        await expect(cell(page, 'PRD-AB02', 'status')).not.toHaveClass(/tabulator-editing/);
        await page.evaluate(() => new Promise(resolve => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        }));
        await page.keyboard.press('ArrowDown');
        await expect(cell(page, 'PRD-A003', 'status')).toBeFocused();
        await expect(cell(page, 'PRD-A003', 'status')).not.toHaveClass(/tabulator-editing/);
        await expect(message(page)).toHaveClass(/teh-floating-message--visible/);
        await expect(messageBody(page)).not.toHaveText(firstDescription);
        const keyboardDescription = await messageBody(page).textContent();

        await cell(page, 'PRD-B004', 'status').hover();
        await expect(messageBody(page)).not.toHaveText(keyboardDescription);
    });

    test('keeps the lookup hover delay from the first movement within a status cell', async ({ page }) => {
        const status = cell(page, 'PRD-A001', 'status');

        await status.hover();
        const box = await status.boundingBox();
        expect(box).not.toBeNull();

        for (let step = 0; step < 6; step += 1) {
            await page.mouse.move(box.x + 12 + step, box.y + box.height / 2);
            await page.waitForTimeout(85);
        }

        await expect(message(page)).toHaveClass(/teh-floating-message--visible/, { timeout: 100 });
        await expect(message(page).locator('.teh-floating-message__title')).toHaveText('Description');
    });

    test('large-text focus, dialog trap, save and cancel preserve the focus-first contract', async ({ page }) => {
        const notes = cell(page, 'PRD-AB02', 'notes');

        await notes.scrollIntoViewIfNeeded();
        await notes.click();
        await expect(notes).toBeFocused();
        await expectFocusIndicator(notes);
        await expect(notes).not.toHaveClass(/tabulator-editing/);
        await expect(page.locator('.amb-large-text-editor')).toHaveCount(0);
        await expect(message(page)).toHaveClass(/teh-floating-message--visible/);
        const originalText = await messageBody(page).textContent();

        await page.keyboard.press('Enter');
        const dialog = page.locator('.amb-large-text-editor');
        const textarea = dialog.locator('.amb-large-text-editor__textarea');
        const cancel = dialog.getByRole('button', { name: 'Cancel' });
        const save = dialog.getByRole('button', { name: 'Save' });
        await expect(dialog).toBeVisible();
        await expect(textarea).toBeFocused();
        await expect.poll(() => hasFocusIndicator(notes)).toBe(false);
        await expect(message(page)).not.toHaveClass(/teh-floating-message--visible/);

        await page.keyboard.press('Tab');
        await expect(cancel).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(save).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(textarea).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(save).toBeFocused();

        await textarea.fill('Updated contextual note');
        await save.click();
        await expect(dialog).toHaveCount(0);
        await expect(notes).toBeFocused();
        await expectFocusIndicator(notes);
        await expect(notes).not.toHaveClass(/tabulator-editing/);
        await expect(messageBody(page)).toHaveText('Updated contextual note');

        await page.keyboard.press('Enter');
        await expect(textarea).toBeFocused();
        await textarea.fill('Discarded note');
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(notes).toBeFocused();
        await expectFocusIndicator(notes);
        await expect(messageBody(page)).toHaveText('Updated contextual note');
        await expect(messageBody(page)).not.toHaveText(originalText);
    });

    test('focus indicator coexists with error and modified cell styling', async ({ page }) => {
        const notes = cell(page, 'PRD-AB02', 'notes');

        await notes.scrollIntoViewIfNeeded();
        await notes.click();
        await expectFocusIndicator(notes);

        await notes.evaluate(element => element.setAttribute('data-cell-error', 'true'));
        await expectFocusIndicator(notes);
        await expect.poll(() => notes.evaluate(element => (
            getComputedStyle(element).boxShadow !== 'none'
        ))).toBe(true);

        await notes.evaluate(element => {
            element.removeAttribute('data-cell-error');
            element.setAttribute('data-cell-state', 'modified');
        });
        await expectFocusIndicator(notes);
        await expect.poll(() => notes.evaluate(element => (
            getComputedStyle(element).backgroundColor !== 'rgba(0, 0, 0, 0)'
        ))).toBe(true);
    });
});

test.describe('React supplier lookup messages and status select', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/#getting-started-react');
        await waitForReactDemoReady(page);
    });

    test('shows stable supplier descriptions and keeps Status outside the lookup system', async ({ page }) => {
        const active = reactCell(page, 'ITM-1001', 'supplierCode');

        await expect(page.locator('body')).toHaveClass(/amb-react-demo-active/);
        await active.hover();
        await expect(message(page)).toHaveClass(/teh-floating-message--visible/);
        await expect(messageBody(page)).toContainText('Adriatica Components · Ancona');
        await expect(message(page).locator('.teh-floating-message__title')).toBeHidden();

        const box = await active.boundingBox();
        expect(box).not.toBeNull();
        for (let step = 0; step < 6; step += 1) {
            await page.mouse.move(box.x + 12 + step, box.y + box.height / 2);
            await page.waitForTimeout(85);
        }
        await expect(message(page)).toHaveClass(/teh-floating-message--visible/, { timeout: 100 });
        await expect(messageBody(page)).toContainText('Adriatica Components · Ancona');

        await reactCell(page, 'ITM-1003', 'supplierCode').hover();
        await expect(messageBody(page)).toContainText('Lombarda Industrial · Milano');
        await reactCell(page, 'ITM-1005', 'supplierCode').hover();
        await expect(messageBody(page)).toContainText('Roma Handling Systems · Roma');

        await active.focus();
        await expect(active).toBeFocused();
        await expect(message(page)).toHaveClass(/teh-floating-message--visible/);
        await expect(messageBody(page)).toContainText('Adriatica Components · Ancona');

        const status = reactCell(page, 'ITM-1001', 'status');
        await expect(status).not.toHaveAttribute('data-lookup-field');
        await status.hover();
        await expect(message(page)).not.toHaveClass(/teh-floating-message--visible/);
        await status.click();
        await expect(status).toBeFocused();
        await expect(status).not.toHaveClass(/tabulator-editing/);
        await expect(status.locator('select.amb-cell-editor--select')).toHaveCount(0);
        await status.dblclick();
        await expect(status.locator('select.amb-cell-editor--select')).toBeVisible();
        await expect(status.locator('select.amb-cell-editor--select')).toBeFocused();
        await expect(status.locator('.amb-lookup-editor__input')).toHaveCount(0);
    });

    test('maps a supplier dialog selection into the row and restores it through rollback', async ({ page }) => {
        const initialSupplier = reactCell(page, 'ITM-1001', 'supplierCode');
        const editedRow = reactRow(page, 'ITM-1002');
        const supplier = reactCell(page, 'ITM-1002', 'supplierCode');

        await initialSupplier.click();
        await page.keyboard.press('ArrowDown');
        await expect(supplier).toBeFocused();
        await expect(supplier).not.toHaveClass(/tabulator-editing/);
        await page.keyboard.press('F2');

        const dialog = page.locator('.amb-lookup-dialog');
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('columnheader', { name: 'Code' })).toBeVisible();
        await expect(dialog.getByRole('columnheader', { name: 'Supplier' })).toBeVisible();
        await expect(dialog.getByRole('columnheader', { name: 'City' })).toBeVisible();
        await expect(dialog.getByRole('columnheader', { name: 'Category' })).toBeVisible();
        const search = dialog.locator('.amb-lookup-dialog__search');
        await search.fill('SUP-003');
        await expect(dialog.locator('tbody tr')).toContainText('Lombarda Industrial');
        await search.fill('lomb');
        await expect(dialog.locator('tbody tr')).toContainText('Lombarda Industrial');
        await search.fill('milano');
        await expect(dialog.locator('tbody tr')).toContainText('Lombarda Industrial');
        await dialog.locator('tbody tr').filter({ hasText: 'SUP-003' }).click();
        await dialog.locator('.amb-lookup-dialog__button--primary').click();
        await page.keyboard.press('Escape');

        await expect(supplier).toContainText('Lombarda Industrial');
        await expect(supplier).toContainText('SUP-003 · Milano');
        await expect(editedRow.locator('.amb-row-action-button--rollback')).toBeVisible();

        await editedRow.locator('.amb-row-action-button--rollback').click();
        await expect(supplier).toContainText('Emilia Tech Supplies');
        await expect(supplier).toContainText('SUP-002 · Bologna');

        const status = reactCell(page, 'ITM-1002', 'status');
        await status.dblclick();
        await status.locator('select.amb-cell-editor--select').selectOption('HOLD');
        await expect(status.locator('.inventory-status')).toHaveAttribute('data-status', 'hold');
        await expect(editedRow.locator('.amb-row-action-button--rollback')).toBeVisible();
        await editedRow.locator('.amb-row-action-button--rollback').click();
        await expect(status.locator('.inventory-status')).toHaveAttribute('data-status', 'active');
    });

    test('updates React-owned copy without losing a pending grid change', async ({ page }) => {
        const row = reactRow(page, 'ITM-1002');
        const status = reactCell(page, 'ITM-1002', 'status');

        await status.dblclick();
        const editor = status.locator('select.amb-cell-editor--select');
        await expect(status).toHaveClass(/tabulator-editing/);
        await expect(editor).toBeVisible();
        await expect(editor).toBeFocused();
        await editor.selectOption('HOLD');
        await expect(row.locator('.amb-row-action-button--rollback')).toBeVisible();

        await page.locator('.react-demo-language__label').filter({ hasText: 'EN' }).click();
        await expect(page.locator('.react-demo-language__label').filter({ hasText: 'EN' }))
            .toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByRole('heading', { name: 'Inventory Operations' })).toBeVisible();
        await page.locator('.react-table-guide__trigger').click();
        await expect(page.locator('.react-table-guide__column-list')).toContainText(
            'Search a supplier by code, name, or city'
        );
        await expect(row.locator('.amb-row-action-button--rollback')).toBeVisible();
        await expect(status.locator('.inventory-status')).toHaveAttribute('data-status', 'hold');

        await page.locator('.react-demo-language__label').filter({ hasText: 'IT' }).click();
        await expect(page.getByRole('heading', { name: 'Operazioni inventario' })).toBeVisible();
        await expect(page.locator('.react-table-guide__column-list')).toContainText('Fornitore');
        await expect(row.locator('.amb-row-action-button--rollback')).toBeVisible();
        await expect(status.locator('.inventory-status')).toHaveAttribute('data-status', 'hold');
    });
});
