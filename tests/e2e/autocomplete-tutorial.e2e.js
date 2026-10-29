import { expect, test } from '@playwright/test';
import { openEditorFromNavigation } from './helpers/focus-diagnostics.js';

const tutorial = page => page.locator('#feature-example .demo-action-tutorial');
const row = (page, id) => page.locator('#autocomplete-table .tabulator-row').filter({
    has: page.locator('[tabulator-field="id"]', { hasText: new RegExp(`^${id}$`) })
});
const cell = (page, id, field) => row(page, id).locator(`[tabulator-field="${field}"]`);
const openDemo = async page => {
    await page.goto('/src/demo/index.html#feature-examples');
    await page.locator('[data-example="autocomplete"]').click();
    await expect(page.locator('#autocomplete-table')).toBeVisible();
};
const openEditor = async (page, id, field) => {
    const target = cell(page, id, field);
    return openEditorFromNavigation(page, target, 'autocomplete tutorial', '#autocomplete-table', 'input.amb-autocomplete-editor');
};

test('advances only after suggestions, a selected strict value and a committed free value', async ({ page }) => {
    await openDemo(page);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'show-suggestions');
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('1 di 3');
    await expect(tutorial(page).locator('.demo-action-tutorial__progress li')).toHaveCount(3);

    const other = await openEditor(page, 2, 'requiredDepartment');
    await other.fill('Fin');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'show-suggestions');
    await other.press('Escape');
    const required = await openEditor(page, 1, 'requiredDepartment');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'show-suggestions');
    await required.press('Escape');
    const input = await openEditor(page, 1, 'requiredDepartment');
    await input.fill('Sec');
    await expect(page.getByRole('option', { name: 'Security' })).toBeVisible();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'choose-department');
    await input.press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'choose-department');

    const second = await openEditor(page, 1, 'requiredDepartment');
    await second.fill('Sec');
    await second.press('Enter');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'choose-department');
    await page.locator('#feature-example [data-action="reload"]').click();
    const selected = await openEditor(page, 1, 'requiredDepartment');
    await selected.fill('Sec');
    await selected.press('ArrowDown');
    await selected.press('Tab');
    await expect(cell(page, 1, 'requiredDepartment')).toHaveText('Security');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'enter-free-value');

    const wrong = await openEditor(page, 2, 'tag');
    await wrong.fill('custom-note-2');
    await wrong.press('Enter');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'enter-free-value');
    const free = await openEditor(page, 1, 'tag');
    await free.fill('launch-note');
    await free.press('Enter');
    await expect(cell(page, 1, 'tag')).toHaveText('launch-note');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'complete');
    await tutorial(page).locator('[data-tutorial-action="restart"]').click();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'show-suggestions');
    await expect(cell(page, 1, 'tag')).toHaveText('launch-note');
});

test('keeps language, skip and remount behavior', async ({ page }) => {
    await openDemo(page);
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('1 of 3');
    await tutorial(page).locator('[data-tutorial-action="skip"]').click();
    await expect(tutorial(page).locator('.demo-action-tutorial__bar')).toBeHidden();
    await tutorial(page).locator('[data-tutorial-action="reopen"]').click();
    await expect(tutorial(page).locator('.demo-action-tutorial__bar')).toBeVisible();
    await page.locator('[data-example="validation"]').click();
    await page.locator('[data-example="autocomplete"]').click();
    await expect(tutorial(page)).toHaveCount(1);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'show-suggestions');
});

for (const width of [1440, 768, 390]) {
    test(`keeps the tutorial and dropdown usable at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 820 });
        await openDemo(page);
        await expect(tutorial(page).locator('.demo-action-tutorial__instruction')).toBeVisible();
        const input = await openEditor(page, 1, 'requiredDepartment');
        await input.fill('Sec');
        await expect(page.getByRole('option', { name: 'Security' })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
}
