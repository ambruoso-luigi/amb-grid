import { expect, test } from '@playwright/test';
import { openEditorFromNavigation } from './helpers/focus-diagnostics.js';

const tutorial = page => page.locator('#feature-example .demo-action-tutorial');
const action = (page, name) => page.locator(`#feature-example [data-action="${name}"]`);
const control = (page, name) => tutorial(page).locator(`[data-tutorial-action="${name}"]`);
const cell = (page, id, field) => page.locator('#crud-row-states-table .tabulator-row')
    .filter({ has: page.locator('[tabulator-field="id"]', { hasText: id }) }).locator(`[tabulator-field="${field}"]`);
const step = (page, id) => expect(tutorial(page)).toHaveAttribute('data-tutorial-step', id);
const select = async (page, id, field, value) => {
    const target = cell(page, id, field);
    await openEditorFromNavigation(page, target, `${id} ${field}`, '#crud-row-states-table', 'input');
    await page.locator('.tabulator-edit-list-item').filter({ hasText: new RegExp(`^${value}$`) }).click();
    await expect(target).not.toHaveClass(/tabulator-editing/);
};
const editText = async (page, id, value) => {
    const input = await openEditorFromNavigation(page, cell(page, id, 'description'), `${id} description`, '#crud-row-states-table');
    await input.fill(value);
    await input.press('Enter');
};
const closeReport = async page => {
    const dialog = page.getByRole('dialog', { name: /^(CRUD & Row States report|Report CRUD & Row States)$/ });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
};
const prepareAndReport = async page => {
    await action(page, 'state-prepare').click();
    await step(page, 'open-report');
    await action(page, 'state-report').click();
    await step(page, 'commit-restricted');
    await closeReport(page);
};
const reachSave = async page => {
    await prepareAndReport(page);
    await select(page, 'REC-002', 'type', 'Restricted');
    await step(page, 'backend-rejected');
};

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('amb-grid-demo-language', 'en'));
    await page.goto('/src/demo/index.html#feature-examples');
    await expect(page.locator('#crud-row-states-table .tabulator-row')).toHaveCount(9);
    await step(page, 'prepare-states');
});

for (const [locale, correction] of [['en', 'type'], ['en', 'department'], ['it', 'type'], ['it', 'department']]) {
    test(`completes all five verified steps in ${locale} through ${correction} correction`, async ({ page }) => {
        if (locale === 'it') await page.locator('[data-language-toggle]').click();
        await expect(tutorial(page).locator('.demo-action-tutorial__title')).toHaveText(locale === 'it' ? 'Prova CRUD & Row States' : 'Try CRUD & Row States');
        await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText(locale === 'it' ? '1 di 5' : '1 of 5');
        await expect(tutorial(page).locator('ol li')).toHaveCount(5);
        await reachSave(page);
        await expect(cell(page, 'REC-002', 'type')).toBeFocused();
        await expect(cell(page, 'REC-002', '_ambErrorCount')).toHaveText('0');
        await action(page, 'save').click();
        await step(page, 'save-corrected');
        const feedback = page.locator('#feature-example .amb-feedback-region__message');
        await expect(feedback).toContainText(locale === 'it' ? 'Salvataggio parziale. Il backend simulato ha rifiutato il record REC-002' : 'Partial save. The simulated backend rejected record REC-002');
        await expect(cell(page, 'REC-002', 'type')).toHaveAttribute('data-cell-error', 'true');
        await expect(cell(page, 'REC-005', '_state')).toHaveText('saved');
        await expect(cell(page, 'REC-010', '_state')).toHaveText('saved');
        await select(page, 'REC-002', correction, correction === 'type' ? 'Request' : 'Compliance');
        await step(page, 'save-corrected');
        await expect(cell(page, 'REC-002', '_ambErrorCount')).toHaveText('0');
        await expect(cell(page, 'REC-002', '_state')).toHaveText('modified');
        await action(page, 'save').click();
        await step(page, 'complete');
        await expect(tutorial(page).locator('[aria-live="polite"]')).toHaveText(locale === 'it' ? 'Tutorial completato. Hai provato stati, report, errore backend e salvataggio.' : 'Tutorial complete. You explored row states, reports, backend rejection and saving.');
        await expect(cell(page, 'REC-002', '_state')).toHaveText('saved');
        await expect(feedback).toContainText(locale === 'it' ? 'Righe salvate: 1.' : 'Saved rows: 1.');
        await action(page, 'payload').click();
        const payloadDialog = page.getByRole('dialog', { name: locale === 'it' ? 'Payload di salvataggio' : 'Save payload', exact: true });
        const payload = JSON.parse(await payloadDialog.locator('.demo-report-dialog__json').textContent());
        expect(payload.hasChanges).toBe(false);
        await payloadDialog.getByRole('button', { name: 'Close', exact: true }).click();
        await control(page, 'restart').click();
        await step(page, 'prepare-states');
        await expect(cell(page, 'REC-002', '_state')).toHaveText('saved');
    });
}

test('ignores unrelated actions, cancelled edits, wrong fields and cancelled saving', async ({ page }) => {
    await action(page, 'state-report').click();
    await step(page, 'prepare-states');
    await closeReport(page);
    await prepareAndReport(page);
    await select(page, 'REC-004', 'type', 'Restricted');
    await step(page, 'commit-restricted');
    await editText(page, 'REC-002', 'Contract review changed outside tutorial');
    await step(page, 'commit-restricted');
    await select(page, 'REC-002', 'department', 'Compliance');
    await select(page, 'REC-002', 'type', 'Restricted');
    await step(page, 'commit-restricted');
    await select(page, 'REC-002', 'type', 'Contract');
    await select(page, 'REC-002', 'department', 'Operations');
    const input = await openEditorFromNavigation(page, cell(page, 'REC-002', 'type'), 'Cancelled Type', '#crud-row-states-table', 'input');
    await page.keyboard.press('ArrowDown');
    await input.press('Escape');
    await expect(cell(page, 'REC-002', 'type')).toHaveText('Contract');
    await step(page, 'commit-restricted');
    await select(page, 'REC-002', 'type', 'Request');
    await step(page, 'commit-restricted');
    await select(page, 'REC-002', 'type', 'Restricted');
    await step(page, 'backend-rejected');
    await editText(page, 'REC-004', '');
    await action(page, 'save').click();
    await expect(page.getByRole('button', { name: 'Save valid rows', exact: true })).toBeVisible();
    await step(page, 'backend-rejected');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await step(page, 'backend-rejected');
    await expect(cell(page, 'REC-002', '_ambErrorCount')).toHaveText('0');
});

test('frontend failure and return to the clean baseline do not count as successful tutorial saves', async ({ page }) => {
    await reachSave(page);
    await editText(page, 'REC-002', '');
    await action(page, 'save').click();
    await page.getByRole('button', { name: 'Save valid rows', exact: true }).click();
    await step(page, 'backend-rejected');
    await expect(cell(page, 'REC-002', 'description')).toHaveAttribute('data-cell-error', 'true');
    await editText(page, 'REC-002', 'Contract review in progress');
    await action(page, 'save').click();
    await step(page, 'save-corrected');
    await select(page, 'REC-002', 'type', 'Contract');
    await expect(cell(page, 'REC-002', '_state')).toHaveText('clean');
    await action(page, 'save').click();
    await step(page, 'save-corrected');
    await expect(page.getByText('There are no changes to save.', { exact: true })).toBeVisible();
    await control(page, 'restart').click();
    await step(page, 'prepare-states');
    await expect(cell(page, 'REC-005', '_state')).toHaveText('saved');
    await action(page, 'state-prepare').click();
    await step(page, 'open-report');
});

test('skip, reopen, language changes and remount preserve normal grid use without duplicate progress', async ({ page }) => {
    await action(page, 'state-prepare').click();
    await step(page, 'open-report');
    await control(page, 'skip').click();
    await expect(tutorial(page).locator('.demo-action-tutorial__bar')).toBeHidden();
    await editText(page, 'REC-002', 'Preserve user changes');
    await action(page, 'state-report').click();
    await step(page, 'open-report');
    await closeReport(page);
    await control(page, 'reopen').click();
    await step(page, 'open-report');
    await page.locator('[data-language-toggle]').click();
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('2 di 5');
    await expect(tutorial(page).locator('[aria-live="polite"]')).toContainText('Apri "Report"');
    await expect(control(page, 'skip')).toHaveText('Salta tutorial');
    await control(page, 'restart').click();
    await expect(cell(page, 'REC-002', 'description')).toHaveText('Preserve user changes');
    await step(page, 'prepare-states');
    await page.locator('[data-example="validation"]').click();
    await expect(tutorial(page)).toHaveCount(0);
    await page.locator('[data-example="crud-row-states"]').click();
    await expect(tutorial(page)).toHaveCount(1);
    await step(page, 'prepare-states');
    await action(page, 'state-prepare').click();
    await step(page, 'open-report');
    await action(page, 'state-report').click();
    await step(page, 'commit-restricted');
    const dialog = page.getByRole('dialog', { name: 'Report CRUD & Row States', exact: true });
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.locator('.demo-report-dialog')).toHaveCount(1);
});

test('does not advance for a backend rejection belonging to another record', async ({ page }) => {
    await reachSave(page);
    await select(page, 'REC-002', 'type', 'Request');
    await select(page, 'REC-006', 'type', 'Restricted');
    await action(page, 'save').click();
    await expect(cell(page, 'REC-006', 'type')).toHaveAttribute('data-cell-error', 'true');
    await expect(cell(page, 'REC-002', '_state')).toHaveText('saved');
    await step(page, 'backend-rejected');
    await action(page, 'reload').click();
    await expect(page.locator('#crud-row-states-table .tabulator-row')).toHaveCount(9);
    await expect(cell(page, 'REC-002', 'type')).toHaveText('Contract');
    await control(page, 'restart').click();
    await step(page, 'prepare-states');
    await action(page, 'state-prepare').click();
    await step(page, 'open-report');
});

test('keeps keyboard navigation local when hiding and reopening the tutorial', async ({ page }) => {
    await control(page, 'restart').focus();
    await page.keyboard.press('Tab');
    await expect(control(page, 'skip')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(control(page, 'restart')).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(control(page, 'reopen')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(control(page, 'restart')).toBeFocused();
    await step(page, 'prepare-states');
    await page.keyboard.press('Tab');
    await expect(control(page, 'skip')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(action(page, 'add')).toBeFocused();
});

for (const width of [1440, 850, 768, 390]) {
    test(`fits above the toolbar at ${width}px and preserves keyboard access`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await tutorial(page).scrollIntoViewIfNeeded();
        const dimensions = await tutorial(page).evaluate(element => ({
            height: element.getBoundingClientRect().height,
            bottom: element.getBoundingClientRect().bottom,
            toolbarTop: document.querySelector('#feature-example .amb-toolbar').getBoundingClientRect().top,
            pageWidth: document.documentElement.scrollWidth,
            viewport: innerWidth
        }));
        expect(dimensions.height).toBeLessThan(width > 850 ? 110 : 180);
        expect(dimensions.bottom).toBeLessThanOrEqual(dimensions.toolbarTop);
        expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewport);
        await control(page, 'restart').focus();
        await page.keyboard.press('Tab');
        await expect(control(page, 'skip')).toBeFocused();
        expect(await control(page, 'skip').evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
        await page.keyboard.press('Tab');
        await expect(action(page, 'add')).toBeFocused();
    });
}
