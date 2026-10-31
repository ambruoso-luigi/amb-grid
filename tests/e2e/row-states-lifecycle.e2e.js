import { expect, test } from '@playwright/test';
import { openEditorFromNavigation } from './helpers/focus-diagnostics.js';

const table = page => page.locator('#crud-row-states-table');
const row = (page, id) => table(page).locator('.tabulator-row').filter({ has: page.locator('[tabulator-field="id"]', { hasText: id }) });
const cell = (page, id, field) => row(page, id).locator(`.tabulator-cell[tabulator-field="${field}"]`);
const action = (page, name) => page.locator(`#feature-example [data-action="${name}"]`);
const editText = async (page, id, field, value) => {
    const input = await openEditorFromNavigation(page, cell(page, id, field), `${id} ${field}`, '#crud-row-states-table');
    await input.fill(value);
    await input.press('Enter');
};
const selectCell = async (page, target, value) => {
    await openEditorFromNavigation(page, target, `Select ${value}`, '#crud-row-states-table', 'input');
    const options = page.locator('.tabulator-edit-list-item');
    await (value ? options.filter({ hasText: new RegExp(`^${value}$`) }) : options.first()).click();
    await expect(target).not.toHaveClass(/tabulator-editing/);
};
const selectValue = (page, id, field, value) => selectCell(page, cell(page, id, field), value);
const feedback = page => page.locator('#feature-example .amb-feedback-region__message');
const addRecord = async (page, description) => {
    await action(page, 'add').click();
    await expect(action(page, 'add')).not.toHaveAttribute('aria-busy', 'true');
    const input = page.locator('#crud-row-states-table input.amb-cell-editor');
    await expect(input).toBeFocused();
    await input.fill(description);
    await input.press('Enter');
    await expect(input).toHaveCount(0);
    return table(page).locator('.tabulator-row').filter({ hasText: description });
};
const readDialog = async (page, name) => {
    const dialog = page.getByRole('dialog', { name, exact: true });
    await expect(dialog).toBeVisible();
    const data = JSON.parse(await dialog.locator('.demo-report-dialog__json').textContent());
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    return data;
};
const prepare = async page => {
    await action(page, 'state-prepare').click();
    await expect(action(page, 'state-prepare')).not.toHaveAttribute('aria-busy', 'true');
    await expect(cell(page, 'REC-005', '_state')).toHaveText('modified');
};

test.describe('CRUD & Row States lifecycle', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('amb-grid-demo-language', 'en'));
        await page.goto('/src/demo/index.html#feature-examples');
        await expect(table(page)).toBeVisible();
        await expect(table(page).locator('.tabulator-row')).toHaveCount(9);
    });

    test('prepares repeatable valid states, separates report from payload and saves backend IDs', async ({ page }) => {
        await expect(page.locator('[data-example]')).toHaveCount(8);
        await expect(page.locator('#feature-example details.demo-disclosure')).not.toHaveAttribute('open');
        for (let iteration = 0; iteration < 2; iteration += 1) {
            await prepare(page);
            await expect(table(page).locator('.tabulator-row')).toHaveCount(10);
            await expect(cell(page, 'REC-001', '_state')).toHaveText('clean');
            await expect(cell(page, 'REC-002', 'department')).toHaveText('Operations');
            await expect(cell(page, 'REC-002', 'type')).toHaveText('Contract');
            await expect(cell(page, 'REC-003', '_state')).toHaveText('deleted');
            await expect(table(page).locator('.tabulator-cell[data-cell-error="true"]')).toHaveCount(0);
        }
        await action(page, 'state-report').click();
        const report = await readDialog(page, 'CRUD & Row States report');
        expect(report.rows.filter(row => row.state === 'new')).toHaveLength(1);
        expect(report.rows.find(row => row.state === 'new').tempId).toBeTruthy();
        expect(report.rows.every(row => Number.isInteger(row.rowNumber))).toBe(true);
        expect(report.errorRowsCount).toBe(0);
        await action(page, 'payload').click();
        const payload = await readDialog(page, 'Save payload');
        expect(payload.changes.inserted).toHaveLength(1);
        expect(payload.changes.updated).toHaveLength(1);
        expect(payload.changes.deleted).toHaveLength(1);
        await action(page, 'save').click();
        await expect(cell(page, 'REC-010', '_state')).toHaveText('saved');
        await expect(cell(page, 'REC-005', '_state')).toHaveText('saved');
        await expect(row(page, 'REC-003')).toHaveCount(0);
        await action(page, 'payload').click();
        expect((await readDialog(page, 'Save payload')).hasChanges).toBe(false);
        await action(page, 'reload').click();
        await expect(table(page).locator('.tabulator-row')).toHaveCount(9);
        await expect(cell(page, 'REC-005', 'tag')).toHaveText('supplier');
        await expect(cell(page, 'REC-003', '_state')).toHaveText('clean');
    });

    test('keeps invalid changes through cancelled and confirmed partial saves and supports rollback', async ({ page }) => {
        await prepare(page);
        await editText(page, 'REC-004', 'description', '');
        await action(page, 'save').click();
        await expect(page.getByText('Some rows contain errors and will not be saved.')).toBeVisible();
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        await expect(cell(page, 'REC-005', '_state')).toHaveText('modified');
        await expect(cell(page, 'REC-004', '_ambErrorCount')).toHaveText('1');
        await expect(cell(page, 'REC-004', 'description')).not.toHaveAttribute('title');
        await action(page, 'save').click();
        await page.getByRole('button', { name: 'Save valid rows', exact: true }).click();
        await expect(cell(page, 'REC-010', '_state')).toHaveText('saved');
        await expect(cell(page, 'REC-004', 'description')).toHaveAttribute('data-cell-error', 'true');
        await row(page, 'REC-004').locator('[data-action="rollback"]').click();
        await page.getByRole('button', { name: 'Confirm', exact: true }).click();
        await expect(cell(page, 'REC-004', 'description')).toHaveText('Compliance evidence requires review');
        await expect(cell(page, 'REC-004', '_ambErrorCount')).toHaveText('0');
    });

    test('preserves Restricted backend rejection, checkbox values, search and remount cleanup', async ({ page }) => {
        await openEditorFromNavigation(page, cell(page, 'REC-002', 'type'), 'Restricted selection', '#crud-row-states-table', 'input');
        await page.locator('.tabulator-edit-list-item').filter({ hasText: /^Restricted$/ }).click();
        await expect(cell(page, 'REC-002', 'type')).toHaveText('Restricted');
        await expect(cell(page, 'REC-002', '_ambErrorCount')).toHaveText('0');
        await action(page, 'save').click();
        await expect(cell(page, 'REC-002', 'type')).toHaveAttribute('data-cell-error', 'true');
        await expect(row(page, 'REC-002')).toHaveAttribute('data-demo-server-error', 'true');
        await expect(cell(page, 'REC-002', '_state')).toHaveText('modified');
        await row(page, 'REC-002').locator('[data-action="rollback"]').click();
        await page.getByRole('button', { name: 'Confirm', exact: true }).click();
        await expect(cell(page, 'REC-002', '_ambErrorCount')).toHaveText('0');
        await expect(row(page, 'REC-002')).not.toHaveAttribute('data-demo-server-error');
        await cell(page, 'REC-001', 'archived').click();
        await expect(cell(page, 'REC-001', 'archived').locator('.demo-inspection-visual')).toHaveClass(/is-checked/);
        await action(page, 'payload').click();
        expect((await readDialog(page, 'Save payload')).changes.updated[0].after.archived).toBe('Y');
        const search = page.locator('#feature-example .amb-toolbar__search-input');
        await search.fill('Supplier onboarding');
        await expect(table(page).locator('.tabulator-row')).toHaveCount(1);
        await search.fill('');
        await page.locator('[data-example="validation"]').click();
        await expect(table(page)).toHaveCount(0);
        await expect(page.locator('.demo-report-dialog')).toHaveCount(1);
        await page.locator('[data-example="crud-row-states"]').click();
        await expect(cell(page, 'REC-002', 'type')).toHaveText('Contract');
        await expect(table(page).locator('.tabulator-row')).toHaveCount(9);
        await expect(page.locator('.demo-report-dialog')).toHaveCount(1);
    });

    test('settles the active Description edit before rejecting an entirely invalid save', async ({ page }) => {
        const description = cell(page, 'REC-004', 'description');
        const input = await openEditorFromNavigation(page, description, 'Description before Save', '#crud-row-states-table');
        await input.fill('');
        await action(page, 'save').click();
        await expect(input).toHaveCount(0);
        await expect(description).toHaveAttribute('data-cell-error', 'true');
        await expect(cell(page, 'REC-004', '_ambErrorCount')).toHaveText('1');
        await expect(page.getByText('There are no valid changes to save. Correct the rows with errors first.')).toBeVisible();
        await action(page, 'state-report').click();
        const report = await readDialog(page, 'CRUD & Row States report');
        expect(report.errorRowsCount).toBe(1);
        expect(report.errors.cells[0].field).toBe('description');
    });

    test('switches Italian and English labels and keeps mobile scrolling inside the grid', async ({ page }) => {
        await page.locator('[data-language-toggle]').click();
        await expect(action(page, 'state-prepare')).toHaveText('Prepara stati');
        await expect(table(page).locator('.tabulator-col[tabulator-field="department"] .tabulator-col-title')).toHaveText('Reparto');
        await action(page, 'reload').click();
        await expect(page.getByText('Dati iniziali puliti ripristinati.')).toBeVisible();
        await page.setViewportSize({ width: 390, height: 844 });
        const dimensions = await table(page).evaluate(element => {
            const holder = element.querySelector('.tabulator-tableholder');
            return { scroll: holder.scrollWidth, width: holder.clientWidth, page: document.documentElement.scrollWidth, viewport: innerWidth };
        });
        expect(dimensions.scroll).toBeGreaterThan(dimensions.width);
        expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
    });

    for (const correction of ['type', 'department']) {
        test(`retries a partially rejected record after correcting ${correction}`, async ({ page }) => {
            await editText(page, 'REC-002', 'description', 'Revised contract review');
            await selectValue(page, 'REC-002', 'type', 'Restricted');
            await expect(cell(page, 'REC-002', '_state')).toHaveText('modified');
            await expect(cell(page, 'REC-002', '_ambErrorCount')).toHaveText('0');
            await expect(cell(page, 'REC-002', 'type')).not.toHaveAttribute('data-cell-error');
            await expect(row(page, 'REC-002')).not.toHaveAttribute('data-demo-server-error');
            await editText(page, 'REC-001', 'description', 'Approved revised service request');
            await action(page, 'save').click();
            await expect(page.getByText('Partial save. The simulated backend rejected record REC-002: Restricted is only allowed for the Compliance department.', { exact: false })).toBeVisible();
            await expect(cell(page, 'REC-001', '_state')).toHaveText('saved');
            await expect(cell(page, 'REC-002', '_state')).toHaveText('modified');
            await expect(cell(page, 'REC-002', '_ambErrorCount')).toHaveText('1');
            await expect(row(page, 'REC-002')).toHaveAttribute('data-demo-server-error', 'true');
            await action(page, 'state-report').click();
            const rejectedReport = await readDialog(page, 'CRUD & Row States report');
            expect(rejectedReport.changedRows.map(row => row.id)).toEqual(['REC-002']);
            expect(rejectedReport.errors.cells[0]).toMatchObject({ id: 'REC-002', field: 'type' });
            await action(page, 'payload').click();
            const rejectedPayload = await readDialog(page, 'Save payload');
            expect(rejectedPayload.hasChanges).toBe(true);
            expect(rejectedPayload.hasInvalidChanges).toBe(true);
            expect(rejectedPayload.changes.updated).toHaveLength(0);
            await selectValue(page, 'REC-002', correction, correction === 'type' ? 'Contract' : 'Compliance');
            await expect(cell(page, 'REC-002', '_ambErrorCount')).toHaveText('0');
            await expect(row(page, 'REC-002')).not.toHaveAttribute('data-demo-server-error');
            await expect(cell(page, 'REC-002', '_state')).toHaveText('modified');
            await expect(cell(page, 'REC-002', 'description')).toHaveText('Revised contract review');
            await action(page, 'payload').click();
            const correctedPayload = await readDialog(page, 'Save payload');
            expect(correctedPayload.changes.updated[0].after).toMatchObject({
                id: 'REC-002', type: correction === 'type' ? 'Contract' : 'Restricted',
                department: correction === 'type' ? 'Operations' : 'Compliance'
            });
            await action(page, 'save').click();
            await expect(cell(page, 'REC-002', '_state')).toHaveText('saved');
            await action(page, 'state-report').click();
            const savedReport = await readDialog(page, 'CRUD & Row States report');
            expect(savedReport.errorRowsCount).toBe(0);
            expect(savedReport.hasChanges).toBe(false);
        });
    }

    test('a rejected row returned to its saved baseline stays clean and is omitted from later saves', async ({ page }) => {
        await selectValue(page, 'REC-001', 'type', 'Procedure');
        await action(page, 'save').click();
        await expect(cell(page, 'REC-001', '_state')).toHaveText('saved');

        await selectValue(page, 'REC-001', 'type', 'Restricted');
        await action(page, 'save').click();
        await expect(cell(page, 'REC-001', '_ambErrorCount')).toHaveText('1');
        await selectValue(page, 'REC-001', 'type', 'Procedure');
        await expect(cell(page, 'REC-001', '_state')).toHaveText('clean');
        await expect(cell(page, 'REC-001', '_ambErrorCount')).toHaveText('0');
        await expect(row(page, 'REC-001')).not.toHaveAttribute('data-demo-server-error');
        const payload = await readDialog(page, 'Save payload');
        expect(payload.hasValidChanges).toBe(false);
        expect(payload.changes.updated).toHaveLength(0);
        await action(page, 'save').click();
        await expect(feedback(page)).toHaveText('There are no changes to save.');
        await expect(cell(page, 'REC-001', '_state')).toHaveText('clean');

        await selectValue(page, 'REC-002', 'department', 'Compliance');
        await action(page, 'save').click();
        await expect(feedback(page)).toContainText('Saved rows: 1.');
        await expect(cell(page, 'REC-001', '_state')).toHaveText('clean');
        await expect(cell(page, 'REC-002', '_state')).toHaveText('saved');
        const report = await readDialog(page, 'CRUD & Row States report');
        expect(report.rows.find(item => item.id === 'REC-001')).toMatchObject({ state: 'clean', hasErrors: false });
        expect(report.rows.find(item => item.id === 'REC-002')).toMatchObject({ state: 'saved', hasErrors: false });
    });

    test('accepts Restricted and Contract in Compliance without a prior backend error', async ({ page }) => {
        await selectValue(page, 'REC-004', 'type', 'Restricted');
        await selectValue(page, 'REC-008', 'type', 'Contract');
        await expect(cell(page, 'REC-004', '_ambErrorCount')).toHaveText('0');
        await action(page, 'save').click();
        for (const id of ['REC-004', 'REC-008']) {
            await expect(cell(page, id, '_state')).toHaveText('saved');
            await expect(cell(page, id, '_ambErrorCount')).toHaveText('0');
            await expect(row(page, id)).not.toHaveAttribute('data-demo-server-error');
        }
    });

    for (const locale of ['it', 'en']) {
        test(`explains a wholly rejected save in ${locale} without claiming partial success`, async ({ page }) => {
            if (locale === 'it') await page.locator('[data-language-toggle]').click();
            await selectValue(page, 'REC-002', 'type', 'Restricted');
            await action(page, 'save').click();
            const message = locale === 'it'
                ? 'Salvataggio non eseguito. Il backend simulato ha rifiutato il record REC-002: il tipo Restricted è consentito soltanto al reparto Compliance.'
                : 'Save not completed. The simulated backend rejected record REC-002: Restricted is only allowed for the Compliance department.';
            await expect(page.getByText(message, { exact: false })).toBeVisible();
            await expect(cell(page, 'REC-002', '_ambErrorCount')).toHaveText('1');
            await editText(page, 'REC-001', 'description', 'Accepted service request revision');
            await action(page, 'save').click();
            const partialMessage = locale === 'it'
                ? 'Salvataggio parziale. Il backend simulato ha rifiutato il record REC-002: il tipo Restricted è consentito soltanto al reparto Compliance.'
                : 'Partial save. The simulated backend rejected record REC-002: Restricted is only allowed for the Compliance department.';
            await expect(feedback(page)).toContainText(partialMessage);
            await expect(cell(page, 'REC-001', '_state')).toHaveText('saved');
        });
    }

    test('keeps frontend errors and other rejected rows when Department corrects the backend rule', async ({ page }) => {
        await selectValue(page, 'REC-002', 'type', 'Restricted');
        await selectValue(page, 'REC-006', 'type', 'Restricted');
        await action(page, 'save').click();
        await expect(cell(page, 'REC-006', '_ambErrorCount')).toHaveText('1');
        await editText(page, 'REC-002', 'description', '');
        await selectValue(page, 'REC-002', 'department', 'Compliance');
        await expect(cell(page, 'REC-002', 'type')).not.toHaveAttribute('data-cell-error');
        await expect(cell(page, 'REC-002', 'description')).toHaveAttribute('data-cell-error', 'true');
        await expect(cell(page, 'REC-002', '_ambErrorCount')).toHaveText('1');
        await expect(row(page, 'REC-002')).not.toHaveAttribute('data-demo-server-error');
        await expect(cell(page, 'REC-006', 'type')).toHaveAttribute('data-cell-error', 'true');
        await expect(row(page, 'REC-006')).toHaveAttribute('data-demo-server-error', 'true');
        await selectValue(page, 'REC-006', 'type', '');
        await selectValue(page, 'REC-006', 'department', 'Compliance');
        await expect(cell(page, 'REC-006', 'type')).toHaveAttribute('data-cell-error', 'true');
        await expect(cell(page, 'REC-006', '_ambErrorCount')).toHaveText('1');
    });

    test('assigns IDs only to accepted new records and identifies multiple rejections', async ({ page }) => {
        const rejectedNew = await addRecord(page, 'Restricted vendor review');
        await selectCell(page, rejectedNew.locator('[tabulator-field="type"]'), 'Restricted');
        await addRecord(page, 'Accepted vendor review');
        await selectValue(page, 'REC-002', 'type', 'Restricted');
        await action(page, 'save').click();
        await expect(cell(page, 'REC-010', 'description')).toHaveText('Accepted vendor review');
        await expect(cell(page, 'REC-010', '_state')).toHaveText('saved');
        const rejectedId = rejectedNew.locator('[tabulator-field="id"]');
        const temporaryId = rejectedId.locator('.demo-crud-temp-id');
        await expect(temporaryId).toBeVisible();
        await expect(rejectedNew.locator('[tabulator-field="_state"]')).toHaveText('new');
        await action(page, 'state-report').click();
        const report = await readDialog(page, 'CRUD & Row States report');
        expect(report.errorRowsCount).toBe(2);
        const pendingNew = report.changedRows.find(row => row.state === 'new');
        expect(pendingNew.id).toBeFalsy();
        expect(pendingNew.tempId).toBeTruthy();
        await expect(temporaryId).toHaveAttribute('data-demo-temp-id', pendingNew.tempId);
        await expect(temporaryId.locator('code')).toHaveText(pendingNew.tempId);
        expect(pendingNew.after.id).toBeFalsy();
        await expect(rejectedId).not.toContainText(/REC-\d+/);
        expect(report.changedRows.find(row => row.id === 'REC-002').state).toBe('modified');
        await expect(feedback(page)).toContainText('Partial save. The simulated backend rejected records');
        await expect(feedback(page)).toContainText('REC-002');
        await expect(feedback(page)).toContainText(pendingNew.tempId);
    });
});
