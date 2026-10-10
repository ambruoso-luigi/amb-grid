import { expect, test } from '@playwright/test';

const requiredDepartmentCell = page => page.locator('#autocomplete-table .tabulator-row')
    .filter({ hasText: 'Prepare onboarding pack' })
    .locator('.tabulator-cell[tabulator-field="requiredDepartment"]');

test.describe('autocomplete live space input', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/src/demo/index.html#feature-examples');
        await page.locator('[data-example="autocomplete"]').click();
        await expect(page.locator('#autocomplete-table')).toBeVisible();
    });

    test('preserves a trailing space and continues compound suggestions', async ({ page }) => {
        const cell = requiredDepartmentCell(page);

        await cell.dblclick({ delay: 100 });
        const input = cell.locator('input.amb-autocomplete-editor');

        await expect(input).toBeFocused();
        await input.fill('');
        await input.pressSequentially('F');
        await expect(input).toHaveValue('Finance');

        await input.press('Space');
        await expect(input).toHaveValue('F ');

        await input.fill('');
        await input.pressSequentially('Human');
        await expect(input).toHaveValue('Human Resources');

        await input.press('Space');
        await expect(input).toHaveValue('Human Resources');
        await expect(input).toHaveJSProperty('selectionStart', 6);
        await expect(input).toHaveJSProperty('selectionEnd', 15);
    });
});
