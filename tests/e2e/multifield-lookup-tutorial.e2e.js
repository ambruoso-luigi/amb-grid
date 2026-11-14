import { expect, test } from '@playwright/test';

const table = page => page.locator('#municipality-table');
const tutorial = page => page.locator('#feature-example .demo-action-tutorial');
const cell = (page, id, field) => table(page).locator('.tabulator-row').nth(id - 1)
    .locator(`[tabulator-field="${field}"]`);
const dialog = page => page.locator('.amb-lookup-dialog');
const openDemo = async page => {
    await page.goto('/src/demo/index.html#feature-examples');
    await page.locator('[data-example="multifield-lookup"]').click();
    await expect(table(page)).toBeVisible();
    await expect(page.locator('[data-municipality-lookup-status]')).toBeHidden();
};
const openLookup = async (page, id = 1) => {
    const target = cell(page, id, 'municipality');
    const input = target.locator('.amb-lookup-editor__input');
    if (await input.count() === 0) {
        await target.scrollIntoViewIfNeeded();
        await target.dblclick({ delay: 100 });
    }
    await expect(input).toBeFocused();
    await page.keyboard.press('F2');
    await expect(dialog(page)).toBeVisible();
};
const selectWithKeyboard = async (page, name) => {
    const search = dialog(page).locator('.amb-lookup-dialog__search');
    await search.fill(name);
    await expect(dialog(page).locator('.amb-lookup-dialog__row')).toHaveCount(1);
    await search.press('ArrowDown');
    await search.press('Enter');
    await expect(dialog(page)).toHaveCount(0);
};

test('F2 lookup advances only after a different municipality is selected', async ({ page }) => {
    await openDemo(page);
    await page.locator('#feature-example [data-action="tutorial-launch"]').click();
    await expect(tutorial(page)).toBeVisible();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'search-by-postal-code');
    await openLookup(page);
    await dialog(page).locator('.amb-lookup-dialog__search').press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'search-by-postal-code');
    await openLookup(page);
    await selectWithKeyboard(page, 'Nocera Inferiore');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'search-by-postal-code');
    await openLookup(page);
    await selectWithKeyboard(page, 'Salerno');
    await expect(cell(page, 1, 'postalCode')).toHaveText('84121');
    await expect(cell(page, 1, 'istatCode')).toHaveText('065116');
    await expect(cell(page, 1, 'cadastralCode')).toHaveText('H703');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'inline-autocomplete');
});
