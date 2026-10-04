import { expect, test } from '@playwright/test';

test('React Status: keyboard navigation, commit and cancel', async ({ page }) => {
    await page.goto('/#getting-started-react');

    const shell = page.locator('.react-demo-grid-shell');
    const row = page.locator('.react-demo-grid .tabulator-row')
        .filter({ hasText: 'ITM-1001' })
        .first();

    const column = field => row.locator(
        `.tabulator-cell[tabulator-field="${field}"]`
    );

    await expect(row).toBeVisible();
    await expect(shell).toHaveAttribute('aria-busy', 'false');

    const itemCode = column('itemCode');
    const status = column('status');
    const statusVisual = status.locator('.inventory-status');

    await expect(itemCode).toHaveText('ITM-1001');
    await expect(statusVisual).toHaveAttribute('data-status', 'active');

    await itemCode.press('ArrowRight');
    await expect(column('productName')).toBeFocused();

    for (const field of [
        'supplierCode',
        'stockQuantity',
        'unitPrice',
        'status'
    ]) {
        await page.keyboard.press('ArrowRight');
        await expect(column(field)).toBeFocused();
    }

    await page.keyboard.press('Enter');

    const editor = status.locator('select.amb-cell-editor--select');

    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('ACTIVE');
    await expect(editor.locator('option')).toHaveCount(3);

    await editor.evaluate(select => {
        window.__ambSelectEventTrace = [];
        const record = event => {
            const active = document.activeElement;
            const cell = select.closest('.tabulator-cell');

            window.__ambSelectEventTrace.push({
                type: event.type,
                key: event.key || null,
                value: select.value,
                activeElement: {
                    tagName: active?.tagName || null,
                    className: String(active?.className || '')
                },
                editing: Boolean(cell?.classList.contains('tabulator-editing')),
                connected: select.isConnected
            });
        };

        ['keydown', 'keyup', 'input', 'change', 'blur', 'focusout'].forEach(type => {
            select.addEventListener(type, record);
        });
    });

    try {
        await page.keyboard.press('ArrowDown');
        await expect(status).toHaveClass(/tabulator-editing/);
        await expect(editor).toBeFocused();
    } catch (error) {
        const trace = await page.evaluate(() => window.__ambSelectEventTrace);

        console.error('React Status select event trace', JSON.stringify(trace));
        throw error;
    }

    await page.keyboard.press('Enter');

    await expect(editor).toHaveCount(0);
    await expect(statusVisual).toHaveAttribute('data-status', 'review');
    await expect(status).toBeFocused();
    await expect(status).not.toHaveClass(/tabulator-editing/);

    await page.keyboard.press('Enter');

    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('REVIEW');

    await page.keyboard.press('Escape');

    if (await editor.count()) {
        await expect(editor).toBeFocused();
        await page.keyboard.press('Escape');
    }

    await expect(editor).toHaveCount(0);
    await expect(statusVisual).toHaveAttribute('data-status', 'review');
    await expect(status).toBeFocused();
    await expect(status).not.toHaveClass(/tabulator-editing/);

    await page.keyboard.press('ArrowLeft');
    await expect(column('unitPrice')).toBeFocused();
});
