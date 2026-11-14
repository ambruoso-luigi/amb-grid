import { expect, test } from '@playwright/test';

const table = page => page.locator('#validation-table');
const tutorial = page => page.locator('#feature-example .demo-action-tutorial');
const openValidation = async page => {
    await page.goto('/src/demo/index.html#feature-examples');
    await page.locator('[data-example="validation"]').click();
    await expect(table(page).locator('.tabulator-row')).toHaveCount(11);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'immediate-validation');
};
test('uses the requested card order and remounts Validation without duplicate tutorials', async ({ page }) => {
    await openValidation(page);
    expect(await page.locator('[data-example]').evaluateAll(buttons => buttons.map(button => button.dataset.example))).toEqual([
        'crud-row-states', 'validation', 'autocomplete', 'multifield-lookup',
        'image-preview-viewer', 'column-calculations', 'dates', 'parsers'
    ]);
    await expect(tutorial(page)).toHaveCount(1);
    await page.locator('[data-example="image-preview-viewer"]').click();
    await expect(page.locator('#image-preview-viewer-table')).toBeVisible();
    await page.locator('[data-example="validation"]').click();
    await expect(tutorial(page)).toHaveCount(1);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'immediate-validation');
});
