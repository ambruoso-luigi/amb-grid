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
const selectMunicipality = async (page, name) => {
    await dialog(page).locator('.amb-lookup-dialog__search').fill(name);
    const result = dialog(page).locator('.amb-lookup-dialog__row').filter({
        has: page.locator('td:first-child', { hasText: new RegExp(`^${name}$`) })
    });
    await expect(result).toHaveCount(1);
    await result.click();
    await dialog(page).locator('.amb-lookup-dialog__button--primary').click();
    await expect(dialog(page)).toHaveCount(0);
};

test('opens the actual lookup and completes only after one selection maps multiple fields', async ({ page }) => {
    await openDemo(page);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'open-lookup');
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('1 di 2');
    await expect(tutorial(page).locator('.demo-action-tutorial__progress li')).toHaveCount(2);
    await openLookup(page, 2);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'open-lookup');
    await dialog(page).locator('.amb-lookup-dialog__search').press('Escape');
    await openLookup(page, 1);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'select-municipality');
    await dialog(page).locator('.amb-lookup-dialog__search').fill('NoMatchingMunicipality999');
    await expect(dialog(page).locator('.amb-lookup-dialog__row')).toHaveCount(0);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'select-municipality');
    await dialog(page).locator('.amb-lookup-dialog__search').press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'select-municipality');
    await openLookup(page, 1);
    await selectMunicipality(page, 'Sorrento');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'select-municipality');
    await openLookup(page, 1);
    await selectMunicipality(page, 'Salerno');
    await expect.poll(() => cell(page, 1, 'municipality').evaluate(element =>
        element.querySelector('.amb-lookup-editor__input')?.value ?? element.textContent.trim()
    )).toBe('Salerno');
    await expect(cell(page, 1, 'postalCode')).toHaveText('84121');
    await expect(cell(page, 1, 'istatCode')).toHaveText('065116');
    await expect(cell(page, 1, 'cadastralCode')).toHaveText('H703');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'complete');
    await tutorial(page).locator('[data-tutorial-action="restart"]').click();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'open-lookup');
    await expect.poll(() => cell(page, 1, 'municipality').evaluate(element =>
        element.querySelector('.amb-lookup-editor__input')?.value ?? element.textContent.trim()
    )).toBe('Salerno');
});

test('keeps language, skip and remount behavior', async ({ page }) => {
    await openDemo(page);
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('1 of 2');
    await tutorial(page).locator('[data-tutorial-action="skip"]').click();
    await openLookup(page, 1);
    await selectMunicipality(page, 'Salerno');
    await expect(cell(page, 1, 'postalCode')).toHaveText('84121');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'open-lookup');
    await tutorial(page).locator('[data-tutorial-action="reopen"]').click();
    await page.locator('[data-example="autocomplete"]').click();
    await page.locator('[data-example="multifield-lookup"]').click();
    await expect(tutorial(page)).toHaveCount(1);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'open-lookup');
});

for (const width of [1440, 768, 390]) {
    test(`keeps lookup tutorial usable at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 820 });
        await openDemo(page);
        await expect(tutorial(page).locator('.demo-action-tutorial__instruction')).toBeVisible();
        await openLookup(page, 1);
        await expect(dialog(page).locator('.amb-lookup-dialog__search')).toBeFocused();
        await dialog(page).locator('.amb-lookup-dialog__search').fill('Salerno');
        await expect(dialog(page).locator('.amb-lookup-dialog__row').filter({
            has: page.locator('td:first-child', { hasText: /^Salerno$/ })
        })).toHaveCount(1);
    });
}
