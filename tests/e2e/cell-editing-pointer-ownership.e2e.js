import { expect, test } from '@playwright/test';

const table = page => page.locator('#pointer-ownership-grid');
const firstRow = page => table(page).locator('.tabulator-row').first();
const cell = (page, field) => firstRow(page).locator(`.tabulator-cell[tabulator-field="${field}"]`);
const editingInput = (page, field) => cell(page, field).locator('input.amb-cell-editor');

const openTextEditor = async page => {
    const name = cell(page, 'name');

    await name.dblclick({ delay: 100 });
    const input = editingInput(page, 'name');
    await expect(name).toHaveClass(/tabulator-editing/);
    await expect(input).toBeFocused();
    return { name, input };
};

const expectNoEditors = async page => {
    await expect(table(page).locator('.tabulator-cell.tabulator-editing')).toHaveCount(0);
};

test.describe('cell editor pointer ownership', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/tests/e2e/fixtures/cell-editing-pointer-ownership.html');
        await expect(firstRow(page)).toBeVisible();
    });

    test('default mode keeps single click as navigation and double click as editing', async ({ page }) => {
        const name = cell(page, 'name');

        await name.click();
        await expect(name).toBeFocused();
        await expect(name).not.toHaveClass(/tabulator-editing/);
        await expect(editingInput(page, 'name')).toHaveCount(0);

        await name.dblclick({ delay: 100 });
        await expect(name).toHaveClass(/tabulator-editing/);
        await expect(editingInput(page, 'name')).toBeVisible();
        await expect(editingInput(page, 'name')).toBeFocused();
    });

    test('keeps an inline text editor active when the input is clicked', async ({ page }) => {
        const { name, input } = await openTextEditor(page);

        await input.click();

        await expect(name).toHaveClass(/tabulator-editing/);
        await expect(input).toBeFocused();
        await expect(table(page).locator('input.amb-cell-editor')).toHaveCount(1);
    });

    test('keeps caret placement native inside an active text editor', async ({ page }) => {
        const { name, input } = await openTextEditor(page);
        const box = await input.boundingBox();
        expect(box).not.toBeNull();

        await input.click({ position: { x: Math.max(2, box.width * 0.2), y: box.height / 2 } });
        const left = await input.evaluate(element => ({
            start: element.selectionStart,
            end: element.selectionEnd,
            length: element.value.length
        }));
        await expect(name).toHaveClass(/tabulator-editing/);
        await expect(input).toBeFocused();

        await input.click({ position: { x: Math.max(2, box.width * 0.8), y: box.height / 2 } });
        const right = await input.evaluate(element => ({
            start: element.selectionStart,
            end: element.selectionEnd,
            length: element.value.length
        }));

        expect(left.start).toBe(left.end);
        expect(right.start).toBe(right.end);
        expect(left.start).toBeGreaterThanOrEqual(0);
        expect(right.start).toBeLessThanOrEqual(right.length);
        expect(right.start).toBeGreaterThan(left.start);
        await expect(name).toHaveClass(/tabulator-editing/);
        await expect(input).toBeFocused();
    });

    test('allows native drag text selection without leaving editing', async ({ page }) => {
        const { name, input } = await openTextEditor(page);
        const box = await input.boundingBox();
        expect(box).not.toBeNull();
        const startX = box.x + (box.width * 0.2);
        const endX = box.x + (box.width * 0.8);
        const y = box.y + (box.height / 2);

        await input.click({ position: { x: box.width * 0.2, y: box.height / 2 } });
        const startCaret = await input.evaluate(element => element.selectionStart);
        await input.click({ position: { x: box.width * 0.8, y: box.height / 2 } });
        const endCaret = await input.evaluate(element => element.selectionStart);
        expect(startCaret).toBeLessThan(endCaret);

        await page.mouse.move(startX, y);
        await page.mouse.down();
        await page.mouse.move(endX, y, { steps: 16 });
        await page.mouse.up();

        const selection = await input.evaluate(element => ({
            start: element.selectionStart,
            end: element.selectionEnd
        }));
        expect(selection.start).toBeLessThan(selection.end);
        await expect(name).toHaveClass(/tabulator-editing/);
        await expect(input).toBeVisible();
        await expect(name.locator('input.amb-cell-editor')).toHaveCount(1);
    });

    test('allows native double-click word selection without reopening the editor', async ({ page }) => {
        const { name, input } = await openTextEditor(page);
        const box = await input.boundingBox();
        expect(box).not.toBeNull();

        await input.dblclick({ position: { x: box.width * 0.7, y: box.height / 2 } });

        const selection = await input.evaluate(element => ({
            start: element.selectionStart,
            end: element.selectionEnd
        }));
        expect(selection.end).toBeGreaterThan(selection.start);
        await expect(name).toHaveClass(/tabulator-editing/);
        await expect(input).toBeVisible();
        await expect(name.locator('input.amb-cell-editor')).toHaveCount(1);
    });

    test('commits normally when pointer leaves the editing cell', async ({ page }) => {
        const { name, input } = await openTextEditor(page);
        const other = cell(page, 'other');

        await input.fill('Mario Bianchi');
        await input.click();
        await other.click();

        await expect(name).not.toHaveClass(/tabulator-editing/);
        await expect(input).toHaveCount(0);
        await expect(other).toBeFocused();
        await expect(other).not.toHaveClass(/tabulator-editing/);
        await expect(name).toContainText('Mario Bianchi');
        await expectNoEditors(page);
    });

    test('lets an external control leave the editor through the normal lifecycle', async ({ page }) => {
        const { input } = await openTextEditor(page);
        const outside = page.locator('#outside-control');

        await input.fill('Mario Outside');
        await outside.click();

        await expect(input).toHaveCount(0);
        await expect(outside).toBeFocused();
        await expect(cell(page, 'name')).toContainText('Mario Outside');
        await expectNoEditors(page);
    });

    test('keeps Escape cancellation working after an internal pointer interaction', async ({ page }) => {
        const { name, input } = await openTextEditor(page);

        await input.fill('Mario Cancelled');
        await input.click();
        await page.keyboard.press('Escape');

        await expect(name).not.toHaveClass(/tabulator-editing/);
        await expect(name).toContainText('Mario Rossi');
        await expectNoEditors(page);
    });

    test('keeps Enter commit working after an internal pointer interaction', async ({ page }) => {
        const { name, input } = await openTextEditor(page);

        await input.fill('Mario Committed');
        await input.click();
        await page.keyboard.press('Enter');

        await expect(name).toContainText('Mario Committed');
        await expectNoEditors(page);
    });

    test('keeps native input editors active on internal pointer interaction', async ({ page }) => {
        for (const field of ['quantity', 'price']) {
            const target = cell(page, field);

            await target.dblclick({ delay: 100 });
            const input = target.locator('input.amb-cell-editor');
            await expect(input).toBeFocused();
            await input.click();
            await expect(target).toHaveClass(/tabulator-editing/);
            await expect(input).toBeFocused();
            await page.keyboard.press('Escape');
        }
    });

    test('keeps select editing active through pointer interaction and commits its choice', async ({ page }) => {
        const category = cell(page, 'category');
        const select = category.locator('select.amb-cell-editor--select');

        await category.dblclick({ delay: 100 });
        await expect(select).toBeFocused();
        await expect(category).toHaveClass(/tabulator-editing/);
        await select.click();
        await expect(category).toHaveClass(/tabulator-editing/);
        await select.selectOption('C');
        await expect(category).toContainText('C');
        await expectNoEditors(page);
    });

    test('keeps complex editor pointer interactions native on the technical test page', async ({ page }) => {
        await page.goto('/test/');
        const inventory = page.locator('#inventory-test-table');
        const row = inventory.locator('.tabulator-row').first();
        await expect(row).toBeVisible();

        const warehouse = row.locator('.tabulator-cell[tabulator-field="warehouse"]');
        await warehouse.dblclick({ delay: 100 });
        const autocomplete = warehouse.locator('input.amb-autocomplete-editor');
        await expect(autocomplete).toBeFocused();
        await autocomplete.click();
        await autocomplete.fill('Mil');
        await expect(warehouse).toHaveClass(/tabulator-editing/);
        await expect(page.getByRole('listbox', { name: 'Results List' })).toBeVisible();
        await page.keyboard.press('Escape');

        const status = row.locator('.tabulator-cell[tabulator-field="status"]');
        await status.dblclick({ delay: 100 });
        const lookup = status.locator('input.amb-lookup-editor__input');
        await expect(lookup).toBeFocused();
        await lookup.click();
        await expect(status).toHaveClass(/tabulator-editing/);
        await expect(page.locator('.amb-lookup-dialog')).toHaveCount(0);
        await page.keyboard.press('Escape');

        const date = row.locator('.tabulator-cell[tabulator-field="lastCheckDate"]');
        await date.dblclick({ delay: 100 });
        const dateInput = date.locator('input.amb-date-editor');
        await expect(dateInput).toBeFocused();
        await dateInput.click();
        await expect(date).toHaveClass(/tabulator-editing/);
        await date.locator('.amb-date-editor-picker-button').click();
        await expect(page.locator('.datepicker.active')).toBeVisible();
    });
});
