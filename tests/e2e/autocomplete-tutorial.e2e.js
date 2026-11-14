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
const launchTutorial = async (page, label = 'Avvia tutorial') => {
    const launch = page.locator('#feature-example [data-action="tutorial-launch"]');
    await expect(launch).toBeVisible();
    await expect(launch).toHaveText(label);
    await expect(tutorial(page)).toBeHidden();
    await launch.click();
    await expect(tutorial(page)).toBeVisible();
    await expect(launch).toBeHidden();
};
const openEditor = async (page, id, field) => {
    const target = cell(page, id, field);
    return openEditorFromNavigation(page, target, 'autocomplete tutorial', '#autocomplete-table', 'input.amb-autocomplete-editor');
};

test('keeps language, skip and remount behavior', async ({ page }) => {
    await openDemo(page);
    await launchTutorial(page);
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('1 of 4');
    await tutorial(page).locator('[data-tutorial-action="skip"]').click();
    await expect(tutorial(page)).toBeHidden();
    await launchTutorial(page, 'Resume tutorial');
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('1 of 4');
    await page.locator('[data-example="validation"]').click();
    await page.locator('[data-example="autocomplete"]').click();
    await expect(tutorial(page)).toHaveCount(1);
    await launchTutorial(page, 'Start tutorial');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'choose-optional-department');
});

for (const width of [1440, 768, 390]) {
    test(`keeps the tutorial and dropdown usable at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 820 });
        await openDemo(page);
        await launchTutorial(page);
        await expect(tutorial(page).locator('.demo-action-tutorial__instruction')).toBeVisible();
        const input = await openEditor(page, 1, 'requiredDepartment');
        await input.fill('Sec');
        await expect(page.getByRole('option', { name: 'Security' })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
}
