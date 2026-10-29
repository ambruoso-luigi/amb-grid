import { expect, test } from '@playwright/test';

const table = page => page.locator('#validation-table');
const tutorial = page => page.locator('#feature-example .demo-action-tutorial');
const action = (page, name) => page.locator(`#feature-example [data-action="${name}"]`);
const row = (page, id) => table(page).locator('.tabulator-row').filter({
    has: page.locator('[tabulator-field="id"]', { hasText: new RegExp(`^${id}$`) })
});
const cell = (page, id, field) => row(page, id).locator(`[tabulator-field="${field}"]`);
const report = page => page.getByRole('dialog', { name: 'Validation report' });
const closeReport = async page => report(page).getByRole('button', { name: 'Close' }).click();
const openValidation = async page => {
    await page.goto('/src/demo/index.html#feature-examples');
    await page.locator('[data-example="validation"]').click();
    await expect(table(page).locator('.tabulator-row')).toHaveCount(11);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'create-anomalies');
};
const edit = async (page, id, field, value, key = 'Enter') => {
    const target = cell(page, id, field);
    await target.dblclick();
    const input = target.locator('input.amb-cell-editor');
    await expect(input).toBeFocused();
    await input.fill(value);
    await input.press(key);
    await expect(input).toHaveCount(0);
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
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'create-anomalies');
});

test('advances through real anomalies, an error report and a confirmed correction', async ({ page }) => {
    await openValidation(page);
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('1 di 3');
    await expect(tutorial(page).locator('.demo-action-tutorial__progress li')).toHaveCount(3);
    await action(page, 'show-report').click();
    await expect(report(page)).toBeVisible();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'create-anomalies');
    await closeReport(page);

    await action(page, 'create-anomalies').click();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'inspect-report');
    await expect(cell(page, 4, 'email')).toHaveAttribute('data-cell-error', 'true');
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('2 di 3');
    await action(page, 'reload').click();
    await expect(cell(page, 4, 'email')).not.toHaveAttribute('data-cell-error', 'true');
    await action(page, 'show-report').click();
    await expect(report(page)).toBeVisible();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'inspect-report');
    await closeReport(page);
    await action(page, 'create-anomalies').click();
    await expect(cell(page, 4, 'email')).toHaveAttribute('data-cell-error', 'true');
    await action(page, 'show-report').click();
    await expect(report(page)).toBeVisible();
    const reportData = JSON.parse(await report(page).locator('.demo-report-dialog__json').textContent());
    expect(reportData.stateReport.errors.cells.length).toBeGreaterThan(0);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'correct-value');
    await closeReport(page);
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('3 di 3');

    await edit(page, 4, 'email', 'delta@example.test', 'Escape');
    await expect(cell(page, 4, 'email')).toHaveAttribute('data-cell-error', 'true');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'correct-value');
    await edit(page, 1, 'alias', 'AtlasX');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'correct-value');
    await edit(page, 4, 'email', 'delta@example.test');
    await expect(cell(page, 4, 'email')).not.toHaveAttribute('data-cell-error', 'true');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'complete');
    await expect(tutorial(page).locator('.demo-action-tutorial__instruction')).toContainText('Tutorial completato.');
    await tutorial(page).locator('[data-tutorial-action="restart"]').click();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'create-anomalies');
    await expect(cell(page, 4, 'email')).not.toHaveAttribute('data-cell-error', 'true');
    await action(page, 'create-anomalies').click();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'inspect-report');
    await tutorial(page).locator('[data-tutorial-action="restart"]').click();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'create-anomalies');
    await action(page, 'create-anomalies').click();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'create-anomalies');
});

test('keeps step and grid state across language, skip and reopen', async ({ page }) => {
    await openValidation(page);
    await action(page, 'create-anomalies').click();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'inspect-report');
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('2 of 3');
    await expect(tutorial(page).locator('.demo-action-tutorial__instruction')).toContainText('Open the validation report');
    await tutorial(page).locator('[data-tutorial-action="skip"]').click();
    await expect(tutorial(page).locator('.demo-action-tutorial__bar')).toBeHidden();
    await action(page, 'show-report').click();
    await expect(report(page)).toBeVisible();
    await closeReport(page);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'inspect-report');
    await tutorial(page).locator('[data-tutorial-action="reopen"]').click();
    await expect(tutorial(page).locator('.demo-action-tutorial__bar')).toBeVisible();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'inspect-report');
    await action(page, 'show-report').click();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'correct-value');
    await closeReport(page);
    await expect(cell(page, 4, 'email')).toHaveAttribute('data-cell-error', 'true');
});

for (const width of [1440, 768, 390]) {
    test(`keeps the Validation tutorial usable at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 820 });
        await openValidation(page);
        await expect(tutorial(page).locator('.demo-action-tutorial__instruction')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        await tutorial(page).locator('[data-tutorial-action="skip"]').focus();
        await page.keyboard.press('Enter');
        await expect(tutorial(page).locator('[data-tutorial-action="reopen"]')).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(tutorial(page).locator('[data-tutorial-action="restart"]')).toBeFocused();
        await expect(table(page)).toBeVisible();
    });
}
