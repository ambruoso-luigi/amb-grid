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
        await expect(page.locator('[data-example]')).toHaveCount(7);
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
});
