import { expect, test } from '@playwright/test';
import { openEditorFromNavigation } from './helpers/focus-diagnostics.js';

const tutorial = page => page.locator('#feature-example .demo-action-tutorial');
const action = (page, name) => page.locator(`#feature-example [data-action="${name}"]`);
const control = (page, name) => tutorial(page).locator(`[data-tutorial-action="${name}"]`);
const row = (page, id) => page.locator('#crud-row-states-table .tabulator-row')
    .filter({ has: page.locator('[tabulator-field="id"]', { hasText: new RegExp(`^${id}$`) }) });
const cell = (page, id, field) => row(page, id).locator(`[tabulator-field="${field}"]`);
const feedback = page => page.locator('#feature-example .amb-feedback-region__message');
const reportDialog = page => page.getByRole('dialog', { name: /^(CRUD & Row States report|Report CRUD & Row States)$/ });
const reportReturnFocus = new WeakMap();
const pageErrors = new WeakMap();
const step = async (page, id, microAction = 0) => {
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', id);
    if (id !== 'complete') await expect(tutorial(page)).toHaveAttribute('data-tutorial-action-index', String(microAction));
};
const restarted = async page => {
    await expect(tutorial(page)).toHaveAttribute('data-resetting', 'false');
    await step(page, 'edit-record');
    await expect(page.locator('#crud-row-states-table .tabulator-row')).toHaveCount(9);
    await expect(cell(page, 'REC-001', 'type')).toHaveText('Request');
    await expect(cell(page, 'REC-004', 'description')).toHaveText('Compliance evidence requires review');
};
const select = async (page, id, field, value) => {
    const target = cell(page, id, field);
    await openEditorFromNavigation(page, target, `${id} ${field}`, '#crud-row-states-table', 'input');
    await page.locator('.tabulator-edit-list-item').filter({ hasText: new RegExp(`^${value}$`) }).click();
    await expect(target).not.toHaveClass(/tabulator-editing/);
};
const editText = async (page, id, value, key = 'Enter') => {
    const input = await openEditorFromNavigation(page, cell(page, id, 'description'), `${id} description`, '#crud-row-states-table');
    await input.fill(value);
    await input.press(key);
};
const confirmRow = async (page, id, name, confirm = true) => {
    await row(page, id).locator(`[data-action="${name}"]`).click();
    const dialog = page.locator('.teh-confirm-dialog--visible');
    await expect(dialog).toBeVisible();
    await dialog.locator(confirm ? '.teh-confirm-dialog__button--confirm' : '.teh-confirm-dialog__button--cancel').click();
    await expect(dialog).toHaveCount(0);
};
const confirmPartial = async (page, confirm = true) => {
    const dialog = page.locator('.teh-confirm-dialog--visible');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.teh-confirm-dialog__title')).toHaveText(/^(Save valid rows\?|Salvare le righe valide\?)$/);
    const confirmButton = dialog.locator('.teh-confirm-dialog__button--confirm');
    const cancelButton = dialog.locator('.teh-confirm-dialog__button--cancel');
    await expect(confirmButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
    await (confirm ? confirmButton : cancelButton).click();
    await expect(dialog).toHaveCount(0);
};
const readReport = async page => {
    await reportReturnFocus.get(page)?.dispose();
    reportReturnFocus.set(page, await page.evaluateHandle(() => document.querySelector('#crud-row-states-table .tabulator-editing')
        ? document.querySelector('#feature-example [data-action="state-report"]') : document.activeElement));
    await action(page, 'state-report').click();
    const dialog = reportDialog(page);
    await expect(dialog).toBeVisible();
    return JSON.parse(await dialog.locator('.demo-report-dialog__json').textContent());
};
const closeReport = async page => {
    const trigger = action(page, 'state-report');
    await expect(reportDialog(page)).toBeVisible();
    await expect(tutorial(page)).toHaveAttribute('data-feedback', 'false');
    await expect.poll(() => trigger.evaluate(async element => {
        const before = element.getBoundingClientRect();
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const after = element.getBoundingClientRect();
        return before.x === after.x && before.y === after.y && before.width === after.width && before.height === after.height;
    })).toBe(true);
    await expect(trigger).toBeInViewport();
    const triggerPosition = await trigger.boundingBox();
    await expect(reportDialog(page).getByRole('button', { name: 'Close', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(reportDialog(page)).toBeHidden();
    const returnFocus = reportReturnFocus.get(page);
    expect(returnFocus).toBeTruthy();
    await expect.poll(() => page.evaluate(element => !element.isConnected || document.activeElement === element, returnFocus)).toBe(true);
    await returnFocus.dispose();
    reportReturnFocus.delete(page);
    await expect(trigger).toBeInViewport();
    await expect.poll(() => trigger.boundingBox()).toEqual(triggerPosition);
};
const reachFrontendError = async page => {
    await select(page, 'REC-001', 'type', 'Procedure');
    await step(page, 'add-record');
    await expect(action(page, 'add')).toHaveClass(/demo-crud-tutorial-target/);
    await action(page, 'add').click();
    await expect(action(page, 'add')).not.toHaveAttribute('aria-busy', 'true');
    await step(page, 'delete-record');
    await expect(row(page, 'REC-003').locator('[data-action="delete"]')).toHaveClass(/demo-crud-tutorial-target/);
    const added = (await readReport(page)).rows.find(item => item.state === 'new');
    expect(added).toMatchObject({ id: null, hasErrors: false });
    expect(added.tempId).toBeTruthy();
    await expect(page.locator('.demo-crud-temp-id')).toHaveAttribute('data-demo-temp-id', added.tempId);
    await expect(page.locator('.demo-crud-temp-id code')).toHaveText(added.tempId);
    await closeReport(page);
    await confirmRow(page, 'REC-003', 'delete');
    await step(page, 'frontend-report');
    await expect(cell(page, 'REC-004', 'description')).toHaveClass(/demo-crud-tutorial-target/);
    await editText(page, 'REC-004', '');
    await step(page, 'frontend-report', 1);
    await expect(action(page, 'state-report')).toHaveClass(/demo-crud-tutorial-target/);
    return added.tempId;
};
const reachPartialSave = async page => {
    const tempId = await reachFrontendError(page);
    const report = await readReport(page);
    expect(report.rows.find(item => item.id === 'REC-004')).toMatchObject({ state: 'modified', hasErrors: true });
    expect(report.errors.cells).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'REC-004', field: 'description' })]));
    await step(page, 'partial-save');
    await closeReport(page);
    await expect(action(page, 'save')).toHaveClass(/demo-crud-tutorial-target/);
    return tempId;
};
const reachBackendError = async page => {
    await reachPartialSave(page);
    await action(page, 'save').click();
    await step(page, 'partial-save', 1);
    await confirmPartial(page);
    await step(page, 'rollback-record');
    await confirmRow(page, 'REC-004', 'rollback');
    await step(page, 'backend-error');
};

test.beforeEach(async ({ page }) => {
    const errors = [];
    pageErrors.set(page, errors);
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('amb-grid-demo-language', 'en'));
    await page.goto('/src/demo/index.html#feature-examples');
    await expect(page.locator('#crud-row-states-table .tabulator-row')).toHaveCount(9);
    await step(page, 'edit-record');
});

test('Row advances once only after a valid new row with its real Temp ID exists', async ({ page }) => {
    await select(page, 'REC-001', 'type', 'Procedure');
    await step(page, 'add-record');
    const beforeAdd = await readReport(page);
    expect(beforeAdd.rows).toHaveLength(9);
    expect(beforeAdd.rows.some(item => item.state === 'new')).toBe(false);
    await closeReport(page);
    await step(page, 'add-record');
    await action(page, 'add').click();
    await expect(action(page, 'add')).not.toHaveAttribute('aria-busy', 'true');
    await step(page, 'delete-record');
    await expect(page.locator('#crud-row-states-table .tabulator-row')).toHaveCount(10);
    await expect(action(page, 'add')).not.toHaveClass(/demo-crud-tutorial-target/);
    await expect(row(page, 'REC-003').locator('[data-action="delete"]')).toHaveClass(/demo-crud-tutorial-target/);
    const report = await readReport(page);
    const additions = report.rows.filter(item => item.state === 'new');
    expect(additions).toHaveLength(1);
    expect(additions[0]).toMatchObject({ id: null, hasErrors: false, isValid: true });
    expect(additions[0].tempId).toBeTruthy();
    await expect(page.locator('.demo-crud-temp-id')).toHaveAttribute('data-demo-temp-id', additions[0].tempId);
    await closeReport(page);
    const addedRow = page.locator('#crud-row-states-table .tabulator-row').filter({ has: page.locator('.demo-crud-temp-id') });
    const input = await openEditorFromNavigation(page, addedRow.locator('[tabulator-field="description"]'), 'New row after lifecycle completion', '#crud-row-states-table');
    await input.fill('New valid vendor assessment');
    await input.press('Enter');
    await step(page, 'delete-record');
    const updatedReport = await readReport(page);
    expect(updatedReport.rows).toHaveLength(10);
    expect(updatedReport.rows.filter(item => item.state === 'new')).toEqual([
        expect.objectContaining({ tempId: additions[0].tempId, hasErrors: false })
    ]);
    await closeReport(page);
    await step(page, 'delete-record');
    expect(pageErrors.get(page)).toEqual([]);
});

for (const locale of ['en', 'it']) {
    test(`completes eight verified phases and ordered micro-actions in ${locale}`, async ({ page }) => {
        if (locale === 'it') await page.locator('[data-language-toggle]').click();
        await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText(locale === 'it' ? '1 di 8' : '1 of 8');
        await expect(tutorial(page).locator('ol li')).toHaveCount(8);
        await expect(cell(page, 'REC-001', 'type')).toHaveClass(/demo-crud-tutorial-target/);
        const tempId = await reachPartialSave(page);
        await expect(cell(page, 'REC-001', '_state')).toHaveText('modified');
        await expect(cell(page, 'REC-003', '_state')).toHaveText('deleted');
        await expect(cell(page, 'REC-004', '_ambErrorCount')).toHaveText('1');
        await action(page, 'save').click();
        await step(page, 'partial-save', 1);
        await expect(page.locator('.teh-confirm-dialog--visible .teh-confirm-dialog__button--confirm')).toHaveClass(/demo-crud-tutorial-target/);
        await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText(locale === 'it' ? '5 di 8' : '5 of 8');
        await confirmPartial(page);
        await step(page, 'rollback-record');
        await expect(cell(page, 'REC-001', '_state')).toHaveText('saved');
        await expect(cell(page, 'REC-010', '_state')).toHaveText('saved');
        await expect(cell(page, 'REC-010', 'id')).toHaveText('REC-010');
        await expect(page.locator('.demo-crud-temp-id')).toHaveCount(0);
        await expect(row(page, 'REC-003')).toHaveCount(0);
        await expect(cell(page, 'REC-004', '_state')).toHaveText('modified');
        await expect(cell(page, 'REC-004', 'description')).toHaveAttribute('data-cell-error', 'true');
        const savedReport = await readReport(page);
        expect(savedReport.rows.find(item => item.id === 'REC-010')).toMatchObject({ state: 'saved', hasErrors: false });
        expect(savedReport.rows.some(item => item.tempId === tempId && item.state === 'new')).toBe(false);
        expect(savedReport.changedRows.map(item => item.id)).toEqual(['REC-004']);
        await closeReport(page);
        await confirmRow(page, 'REC-004', 'rollback');
        await step(page, 'backend-error');
        await expect(cell(page, 'REC-004', 'description')).toHaveText('Compliance evidence requires review');
        await expect(cell(page, 'REC-004', '_ambErrorCount')).toHaveText('0');
        await expect(cell(page, 'REC-004', '_state')).toHaveText('clean');
        await select(page, 'REC-001', 'type', 'Restricted');
        await step(page, 'backend-error', 1);
        await expect(action(page, 'save')).toHaveClass(/demo-crud-tutorial-target/);
        await expect(cell(page, 'REC-001', 'department')).toHaveText('Operations');
        await expect(cell(page, 'REC-001', '_ambErrorCount')).toHaveText('0');
        await expect(cell(page, 'REC-001', 'type')).not.toHaveAttribute('data-cell-error');
        await action(page, 'save').click();
        await step(page, 'correct-save');
        await expect(cell(page, 'REC-001', 'type')).toHaveClass(/demo-crud-tutorial-target/);
        await expect(feedback(page)).toContainText(locale === 'it' ? 'ha rifiutato il record REC-001' : 'rejected record REC-001');
        await expect(cell(page, 'REC-001', 'type')).toHaveAttribute('data-cell-error', 'true');
        await expect(cell(page, 'REC-001', '_ambErrorCount')).toHaveText('1');
        await expect(cell(page, 'REC-001', '_state')).toHaveText('modified');
        await select(page, 'REC-001', 'type', 'Procedure');
        await step(page, 'correct-save', 1);
        await expect(cell(page, 'REC-001', '_ambErrorCount')).toHaveText('0');
        await expect(cell(page, 'REC-001', '_state')).toHaveText('clean');
        await action(page, 'save').click();
        await step(page, 'complete');
        await expect(tutorial(page)).toHaveAttribute('data-feedback', 'false');
        await expect(tutorial(page).locator('[aria-live="polite"]')).toContainText(locale === 'it' ? 'Tutorial completato.' : 'Tutorial complete.');
        await expect(cell(page, 'REC-001', '_state')).toHaveText('saved');
        await expect(page.locator('.demo-crud-tutorial-target')).toHaveCount(0);
        await expect(feedback(page)).toContainText(locale === 'it' ? 'Righe salvate: 1.' : 'Saved rows: 1.');
        const finalReport = await readReport(page);
        expect(finalReport.hasChanges).toBe(false);
        expect(finalReport.hasErrors).toBe(false);
        await closeReport(page);
        await control(page, 'restart').click();
        await restarted(page);
        await expect(cell(page, 'REC-003', '_state')).toHaveText('clean');
        const resetReport = await readReport(page);
        expect(resetReport.hasChanges).toBe(false);
        expect(resetReport.hasErrors).toBe(false);
        expect(resetReport.rows.every(item => item.state === 'clean' && !item.tempId)).toBe(true);
        await closeReport(page);
    });
}

test('ignores wrong records, cancelled edits and cancelled row actions', async ({ page }) => {
    await readReport(page);
    await step(page, 'edit-record');
    await closeReport(page);
    await select(page, 'REC-002', 'type', 'Procedure');
    await step(page, 'edit-record');
    await editText(page, 'REC-001', 'Unrelated description edit');
    await step(page, 'edit-record');
    const input = await openEditorFromNavigation(page, cell(page, 'REC-001', 'type'), 'Cancelled Type', '#crud-row-states-table', 'input');
    await page.keyboard.press('ArrowDown');
    await input.press('Escape');
    await step(page, 'edit-record');
    await select(page, 'REC-001', 'type', 'Procedure');
    await action(page, 'add').click();
    await step(page, 'delete-record');
    await confirmRow(page, 'REC-003', 'delete', false);
    await step(page, 'delete-record');
    await expect(cell(page, 'REC-003', '_state')).toHaveText('clean');
    await confirmRow(page, 'REC-009', 'delete');
    await step(page, 'delete-record');
    await confirmRow(page, 'REC-003', 'delete');
    await editText(page, 'REC-004', '', 'Escape');
    await step(page, 'frontend-report');
    await editText(page, 'REC-005', '');
    await readReport(page);
    await step(page, 'frontend-report');
    await closeReport(page);
});

test('cancelled partial saving does not save rows or skip the confirmation micro-action', async ({ page }) => {
    await reachPartialSave(page);
    await action(page, 'save').click();
    await step(page, 'partial-save', 1);
    await confirmPartial(page, false);
    await expect(action(page, 'save')).toHaveClass(/demo-crud-tutorial-target/);
    await step(page, 'partial-save', 1);
    await expect(cell(page, 'REC-001', '_state')).toHaveText('modified');
    await expect(cell(page, 'REC-003', '_state')).toHaveText('deleted');
    await expect(row(page, 'REC-010')).toHaveCount(0);
    await action(page, 'save').click();
    await confirmPartial(page);
    await step(page, 'rollback-record');
    await confirmRow(page, 'REC-004', 'rollback', false);
    await step(page, 'rollback-record');
    await expect(cell(page, 'REC-004', '_ambErrorCount')).toHaveText('1');
    await confirmRow(page, 'REC-004', 'rollback');
    await step(page, 'backend-error');
});

test('restart after a partial save restores the baseline and restarts backend ID assignment', async ({ page }) => {
    await reachPartialSave(page);
    await action(page, 'save').click();
    await confirmPartial(page);
    await step(page, 'rollback-record');
    await expect(row(page, 'REC-004').locator('[data-action="rollback"]')).toHaveClass(/demo-crud-tutorial-target/);
    await readReport(page);
    await control(page, 'restart').evaluate(button => button.click());
    await restarted(page);
    await expect(reportDialog(page)).toBeHidden();
    await expect(page.locator('.demo-crud-temp-id')).toHaveCount(0);
    await expect(feedback(page)).toHaveText('');
    await expect(feedback(page)).toBeHidden();
    const report = await readReport(page);
    expect(report.rows.map(item => item.id)).toEqual(Array.from({ length: 9 }, (_, index) => `REC-${String(index + 1).padStart(3, '0')}`));
    expect(report.rows.every(item => item.state === 'clean' && !item.hasErrors && !item.hasChanges)).toBe(true);
    expect(report.hasErrors).toBe(false);
    await closeReport(page);
    await reachPartialSave(page);
    await action(page, 'save').click();
    await confirmPartial(page);
    await step(page, 'rollback-record');
    await expect(cell(page, 'REC-010', '_state')).toHaveText('saved');
    await expect(row(page, 'REC-011')).toHaveCount(0);
});

test('restart closes a pending partial confirmation and prevents the old save from completing', async ({ page }) => {
    await reachPartialSave(page);
    await action(page, 'save').click();
    await step(page, 'partial-save', 1);
    const confirm = page.locator('.teh-confirm-dialog--visible .teh-confirm-dialog__button--confirm');
    await expect(confirm).toHaveClass(/demo-crud-tutorial-target/);
    await control(page, 'restart').evaluate(button => button.click());
    await restarted(page);
    await expect(page.locator('.teh-confirm-dialog--visible')).toHaveCount(0);
    await expect(page.locator('.demo-crud-tutorial-target')).toHaveCount(1);
    await expect(cell(page, 'REC-001', 'type')).toHaveClass(/demo-crud-tutorial-target/);
    await expect(row(page, 'REC-010')).toHaveCount(0);
    const report = await readReport(page);
    expect(report.hasChanges).toBe(false);
    expect(report.hasErrors).toBe(false);
    await closeReport(page);
    await expect(feedback(page)).toHaveText('');
    await expect(feedback(page)).toBeHidden();
});

test('a rejection for another record and saving before the correction do not finish the tutorial', async ({ page }) => {
    await reachBackendError(page);
    await select(page, 'REC-006', 'type', 'Restricted');
    await action(page, 'save').click();
    await step(page, 'backend-error');
    await select(page, 'REC-001', 'department', 'Compliance');
    await select(page, 'REC-001', 'type', 'Restricted');
    await step(page, 'backend-error');
    await select(page, 'REC-001', 'type', 'Request');
    await select(page, 'REC-001', 'department', 'Operations');
    await select(page, 'REC-001', 'type', 'Restricted');
    await step(page, 'backend-error', 1);
    await action(page, 'save').click();
    await step(page, 'correct-save');
    await action(page, 'save').click();
    await step(page, 'correct-save');
    await select(page, 'REC-002', 'type', 'Procedure');
    await step(page, 'correct-save');
});

test('prepare states stays outside the tutorial and generates no frontend errors', async ({ page }) => {
    await action(page, 'state-prepare').click();
    await expect(action(page, 'state-prepare')).not.toHaveAttribute('aria-busy', 'true');
    await step(page, 'edit-record');
    const report = await readReport(page);
    expect(report.hasErrors).toBe(false);
    expect(['clean', 'new', 'modified', 'deleted'].every(state => report.rows.some(item => item.state === state))).toBe(true);
    await closeReport(page);
});

test('skip, language changes and remount preserve normal use and the current micro-action', async ({ page }) => {
    await reachFrontendError(page);
    await control(page, 'skip').click();
    await expect(page.locator('.demo-crud-tutorial-target')).toHaveCount(0);
    await editText(page, 'REC-002', 'Preserve user changes');
    const skippedReport = await readReport(page);
    expect(skippedReport.rows.filter(item => item.state === 'new')).toHaveLength(1);
    expect(skippedReport.rows.find(item => item.id === 'REC-003').state).toBe('deleted');
    expect(skippedReport.errors.cells).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'REC-004', field: 'description' })]));
    await step(page, 'frontend-report', 1);
    await closeReport(page);
    await control(page, 'reopen').click();
    await expect(action(page, 'state-report')).toHaveClass(/demo-crud-tutorial-target/);
    await expect(cell(page, 'REC-002', 'description')).toHaveText('Preserve user changes');
    await expect(cell(page, 'REC-004', '_ambErrorCount')).toHaveText('1');
    await expect(page.locator('.demo-crud-temp-id')).toHaveCount(1);
    await page.locator('[data-language-toggle]').click();
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('4 di 8');
    await expect(tutorial(page).locator('[aria-live="polite"]')).toContainText('Apri Report');
    await control(page, 'restart').click();
    await restarted(page);
    await expect(cell(page, 'REC-002', 'description')).toHaveText('Contract review in progress');
    await page.locator('[data-example="validation"]').click();
    await expect(page.locator('#validation-table')).toBeVisible();
    await expect(tutorial(page)).toHaveCount(1);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'create-anomalies');
    await expect(page.locator('.demo-crud-tutorial-target')).toHaveCount(0);
    await page.locator('[data-example="crud-row-states"]').click();
    await expect(tutorial(page)).toHaveCount(1);
    await step(page, 'edit-record');
    await expect(cell(page, 'REC-001', 'type')).toHaveText('Request');
    await readReport(page);
    await closeReport(page);
    await expect(page.locator('.demo-report-dialog')).toHaveCount(1);
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
    await step(page, 'edit-record');
    await page.keyboard.press('Tab');
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
        expect(dimensions.height).toBeLessThan(width > 850 ? 130 : 230);
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
