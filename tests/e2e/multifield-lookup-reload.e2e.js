import { expect, test } from '@playwright/test';

const table = page => page.locator('#municipality-table');
const firstRow = page => table(page).locator('.tabulator-row').first();
const municipalityCell = page => firstRow(page).locator(
    '.tabulator-cell[tabulator-field="municipality"]'
);
const provinceCell = page => firstRow(page).locator(
    '.tabulator-cell[tabulator-field="province"]'
);

test.describe('multifield lookup reload', () => {
    test('reload restores the clean municipality baseline after an invalid edit', async ({ page }) => {
        await page.goto('/src/demo/index.html#feature-examples');
        await page.locator('[data-example="multifield-lookup"]').click();

        const row = firstRow(page);
        const municipality = municipalityCell(page);
        const province = provinceCell(page);
        await expect(row).toBeVisible();
        await expect(municipality).toContainText('Nocera Inferiore');
        await expect(province).toContainText('SA');

        await municipality.dblclick({ delay: 100 });
        const editor = municipality.locator('input.amb-lookup-editor__input');
        await expect(editor).toBeFocused();
        await editor.fill('Unknown municipality');
        await page.keyboard.press('Enter');

        await expect(municipality).toHaveAttribute('data-cell-error', 'true');

        await page.getByRole('button', { name: 'Reload' }).click();

        await expect(municipality).toContainText('Nocera Inferiore');
        await expect(province).toContainText('SA');
        await expect(municipality).not.toHaveAttribute('data-cell-error', 'true');
        await expect(row).not.toHaveAttribute('data-row-error', 'true');
        await expect(row).not.toHaveAttribute('data-has-cell-error', 'true');
        await expect(row).toHaveAttribute('data-state', 'clean');
    });
});
