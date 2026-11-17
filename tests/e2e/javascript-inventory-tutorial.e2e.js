import { expect, test } from '@playwright/test';
import { enterNavigationWithClick, openEditorFromNavigation } from './helpers/focus-diagnostics.js';

test('inventory tutorial preserves unsaved changes until confirmed and resets on close and restart', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('amb-grid-demo-language', 'it'));
    await page.goto('/src/demo/index.html#getting-started-javascript');

    const demo = page.locator('#javascript-demo');
    const grid = demo.locator('#inventory-table.tabulator');
    const launch = demo.locator('[data-action="tutorial-launch"]');
    const guide = demo.locator('.demo-disclosure--technical > summary');
    const tutorial = demo.locator('#javascript-inventory-tutorial');
    const confirmation = page.locator('.teh-confirm-dialog--visible');
    const row = grid.locator('.tabulator-row').filter({
        has: page.locator('.tabulator-cell[tabulator-field="itemCode"]', { hasText: 'PRD-A001' })
    });
    const productName = row.locator('.tabulator-cell[tabulator-field="productName"]');

    await expect(grid).toBeVisible();
    await expect(launch).toBeVisible();
    await expect(launch).toHaveText('Avvia tutorial');
    await expect(guide).toBeVisible();
    await expect(guide).toContainText('Guida tecnica demo');
    await expect(tutorial).toBeHidden();
    expect(await demo.locator('.demo-app-shell').evaluate(shell => {
        const children = [...shell.children];
        return children.indexOf(shell.querySelector('[data-action="tutorial-launch"]'))
            < children.indexOf(shell.querySelector('.demo-disclosure--technical'));
    })).toBe(true);

    await expect(row).toHaveAttribute('data-state', 'clean');
    const originalName = (await productName.textContent()).trim();
    expect(originalName).not.toBe('');
    const editName = async value => {
        const input = await openEditorFromNavigation(page, productName, 'Product name', '#inventory-table');
        await input.fill(value);
        await input.press('Enter');
        await expect(input).toHaveCount(0);
        await expect(productName).toHaveText(value);
        await expect(row).toHaveAttribute('data-state', 'modified');
    };
    const expectReady = async () => {
        await expect(tutorial).toBeVisible();
        await expect(tutorial).toHaveAttribute('data-tutorial-step', 'keyboard-edit');
        await expect(tutorial).toHaveAttribute('data-resetting', 'false');
        await expect(tutorial).toHaveAttribute('aria-busy', 'false');
        await expect(productName).toHaveText(originalName);
        await expect(row).toHaveAttribute('data-state', 'clean');
    };
    const expectClosedAndReset = async () => {
        await expect(tutorial).toBeHidden();
        await expect(launch).toBeVisible();
        await expect(launch).toBeEnabled();
        await expect(launch).toHaveAttribute('aria-busy', 'false');
        await expect(productName).toHaveText(originalName);
        await expect(row).toHaveAttribute('data-state', 'clean');
        await expect(confirmation).toHaveCount(0);
    };

    await editName('Prodotto modificato prima del tutorial');
    await launch.click();
    await expect(confirmation).toBeVisible();
    await expect(confirmation.locator('.teh-confirm-dialog__title')).toHaveText('Avviare il tutorial?');
    await expect(confirmation).toHaveClass(/demo-crud-partial-save-dialog/);
    await expect(confirmation.locator('.demo-crud-partial-save-dialog__details-heading')).toContainText('Modifiche che verranno annullate');
    await confirmation.getByRole('button', { name: 'Annulla' }).click();
    await expect(confirmation).toHaveCount(0);
    await expect(productName).toHaveText('Prodotto modificato prima del tutorial');
    await expect(row).toHaveAttribute('data-state', 'modified');
    await expect(tutorial).toBeHidden();

    await launch.click();
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole('button', { name: 'Avvia tutorial' }).click();
    await expectReady();

    await editName('Prodotto modificato durante il tutorial');
    await tutorial.locator('[data-tutorial-action="skip"]').click();
    await expectClosedAndReset();

    await launch.click();
    await expectReady();
    await editName('Prodotto modificato prima del riavvio');
    await tutorial.locator('[data-tutorial-action="restart"]').click();
    await expectReady();
    await expect(tutorial.locator('[data-tutorial-action="restart"]')).toBeEnabled();
    await demo.locator('[data-action="show-report"]').click();
    const reportDialog = page.getByRole('dialog', { name: 'Report stato righe', exact: true });
    await expect(reportDialog).toBeVisible();
    const reportData = JSON.parse(await reportDialog.locator('.demo-report-dialog__json').textContent());
    expect(reportData.report.hasChanges).toBe(false);
    expect(reportData.report.hasErrors).toBe(false);
    await reportDialog.getByRole('button', { name: 'Close', exact: true }).click();

    await tutorial.locator('[data-tutorial-action="skip"]').click();
    await expectClosedAndReset();
    await launch.click();
    await expectReady();
    await expect(tutorial.locator('.demo-action-tutorial__counter')).toHaveText('1 di 10');
    await expect(tutorial.locator('.demo-action-tutorial__progress > li')).toHaveCount(10);
});

test('inventory tutorial reaches and completes the F2 lookup through real interactions', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('amb-grid-demo-language', 'it'));
    await page.goto('/src/demo/index.html#getting-started-javascript');
    const demo = page.locator('#javascript-demo');
    const grid = demo.locator('#inventory-table.tabulator');
    const tutorial = demo.locator('#javascript-inventory-tutorial');
    const row = grid.locator('.tabulator-row').filter({ has: page.locator('.tabulator-cell[tabulator-field="itemCode"]', { hasText: 'PRD-A001' }) });
    const cell = field => row.locator(`.tabulator-cell[tabulator-field="${field}"]`);
    const step = async (id, actionIndex = '0') => {
        await expect(tutorial).toHaveAttribute('data-tutorial-step', id);
        await expect(tutorial).toHaveAttribute('data-tutorial-action-index', actionIndex);
    };
    await expect(grid).toBeVisible();
    await demo.locator('[data-action="tutorial-launch"]').click();
    await expect(tutorial).toHaveAttribute('data-resetting', 'false');
    await step('keyboard-edit');
    await enterNavigationWithClick(page, cell('warehouse'), 'Tutorial arrow start', '#inventory-table');
    await page.keyboard.press('ArrowRight');
    await step('keyboard-edit', '1');
    await page.keyboard.press('Enter');
    const stockInput = cell('stockQuantity').locator('input');
    await expect(stockInput).toBeVisible();
    const originalStock = Number(await stockInput.inputValue());
    await stockInput.fill(String(originalStock + 1));
    await stockInput.press('Enter');
    await step('tab');

    const quantity = await openEditorFromNavigation(page, cell('stockQuantity'), 'Tutorial stock', '#inventory-table');
    await quantity.fill(String(originalStock + 2));
    await quantity.press('Tab');
    await step('escape');
    const price = cell('unitPrice').locator('input');
    await expect(price).toBeFocused();
    await price.fill('987.65');
    await step('escape', '1');
    await price.press('Escape');
    await step('pages');
    await expect(cell('stockQuantity')).toContainText(String(originalStock + 2));
    await enterNavigationWithClick(page, cell('productName'), 'Tutorial pagination', '#inventory-table');
    await page.keyboard.press('Alt+PageDown');
    await step('pages', '1');
    await page.keyboard.press('Alt+PageUp');
    await step('direct-lookup');

    const statusInput = await openEditorFromNavigation(page, cell('status'), 'Tutorial direct status', '#inventory-table', '.amb-lookup-editor__input');
    const oldStatus = await statusInput.inputValue();
    const newStatus = oldStatus === 'AB03' ? 'A085' : 'AB03';
    await statusInput.fill(newStatus);
    await statusInput.press('Enter');
    await expect(cell('status')).toHaveText(newStatus);
    await step('dialog-lookup');

    const otherRow = grid.locator('.tabulator-row').nth(1);
    const otherStatus = otherRow.locator('.tabulator-cell[tabulator-field="status"]');
    await enterNavigationWithClick(page, otherStatus, 'Tutorial F2 status', '#inventory-table');
    await page.keyboard.press('F2');
    const dialog = page.locator('.amb-lookup-dialog');
    await expect(dialog).toBeVisible();
    await step('dialog-lookup', '1');
    await dialog.locator('.amb-lookup-dialog__search').fill('A085');
    await step('dialog-lookup', '2');
    const result = dialog.locator('.amb-lookup-dialog__row').filter({ hasText: 'A085' });
    await expect(result).toBeVisible();
    await result.click();
    await dialog.locator('.amb-lookup-dialog__button--primary').click();
    await expect(dialog).toHaveCount(0);
    await step('date-picker');
    await expect.poll(() => otherStatus.evaluate(element => {
        const input = element.querySelector('.amb-lookup-editor__input');
        return input ? input.value : element.textContent.trim();
    })).toBe('A085');
    const reopenedInput = otherStatus.locator('.amb-lookup-editor__input');
    if (await reopenedInput.count()) await reopenedInput.press('Enter');
    await expect(otherStatus).not.toHaveClass(/tabulator-editing/);
    await expect(otherStatus).toHaveText('A085');
});

test('adding a product displays its new row on the first page and opens Product name', async ({ page }) => {
    await page.goto('/src/demo/index.html#getting-started-javascript');
    const demo = page.locator('#javascript-demo');
    const grid = demo.locator('#inventory-table.tabulator');
    await expect(grid).toBeVisible();
    await grid.locator('.tabulator-page[data-page="next"]').click();
    await demo.locator('[data-action="add"]').click();
    const firstRow = grid.locator('.tabulator-row').first();
    await expect(firstRow).toHaveAttribute('data-state', 'new');
    await expect(firstRow.locator('.tabulator-cell[tabulator-field="itemCode"]')).toHaveText(/^PRD-[A-Z0-9]{4}$/);
    await expect(firstRow.locator('.tabulator-cell[tabulator-field="productName"] input')).toBeFocused();
    await expect(grid.locator('.tabulator-page[data-page="1"]')).toHaveClass(/active/);
});
