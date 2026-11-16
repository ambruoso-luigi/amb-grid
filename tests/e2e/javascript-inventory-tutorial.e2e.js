import { expect, test } from '@playwright/test';
import { openEditorFromNavigation } from './helpers/focus-diagnostics.js';

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
        await expect(tutorial).toHaveAttribute('data-tutorial-step', 'arrows');
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
    await expect(tutorial.locator('.demo-action-tutorial__counter')).toHaveText('1 di 9');
    await expect(tutorial.locator('.demo-action-tutorial__progress > li')).toHaveCount(9);
});
