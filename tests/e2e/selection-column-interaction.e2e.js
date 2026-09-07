import { expect, test } from '@playwright/test';

const table = page => page.locator('#basic-table');
const row = (page, id) => table(page).locator('.tabulator-row').filter({ hasText: id });
const cell = (page, id, field) => row(page, id)
    .locator(`.tabulator-cell[tabulator-field="${field}"]`);
const selectionInput = (page, id) => row(page, id)
    .locator('.amb-selection-column__input');

const expectUnselected = async (page, id) => {
    await expect(row(page, id)).not.toHaveClass(/tabulator-selected/);
    await expect(selectionInput(page, id)).not.toBeChecked();
};

const expectSelected = async (page, id) => {
    await expect(row(page, id)).toHaveClass(/tabulator-selected/);
    await expect(selectionInput(page, id)).toBeChecked();
};

const pressSelectionKey = async (page, id, key) => {
    await selectionInput(page, id).focus();
    await page.keyboard.press(key);
};

test.describe('managed selection column interaction', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/src/demo/index.html#feature-examples');
        await expect(table(page)).toBeVisible();
        await expect(row(page, 'NT-001')).toBeVisible();
    });

    test('ordinary cells and the data checkbox never select their row', async ({ page }) => {
        const id = 'NT-001';

        await expectUnselected(page, id);
        await cell(page, id, 'title').click();
        await expectUnselected(page, id);
        await cell(page, id, 'tag').click();
        await expectUnselected(page, id);
        await cell(page, id, 'archived').click({ position: { x: 4, y: 4 } });
        await expectUnselected(page, id);

        await cell(page, id, 'archived').press('Space');
        await expectUnselected(page, id);
        await cell(page, id, 'archived').press('Enter');
        await expectUnselected(page, id);
    });

    test('selection checkbox is the exclusive keyboard and pointer selection control', async ({ page }) => {
        const id = 'NT-001';
        const input = selectionInput(page, id);

        await pressSelectionKey(page, id, 'Space');
        await expectSelected(page, id);
        await pressSelectionKey(page, id, 'Space');
        await expectUnselected(page, id);

        await pressSelectionKey(page, id, '1');
        await expectSelected(page, id);
        await pressSelectionKey(page, id, '0');
        await expectUnselected(page, id);
        await pressSelectionKey(page, id, 'S');
        await expectSelected(page, id);
        await pressSelectionKey(page, id, 'N');
        await expectUnselected(page, id);
        await pressSelectionKey(page, id, 'Y');
        await expectSelected(page, id);
        await pressSelectionKey(page, id, 'Enter');
        await expectUnselected(page, id);

        await input.click();
        await expectSelected(page, id);
        await input.click();
        await expectUnselected(page, id);
    });

    test('header select-all still manages multiple selection without row clicks', async ({ page }) => {
        const headerInput = table(page).locator('.tabulator-header input[type="checkbox"]').first();

        await expect(headerInput).toBeVisible();
        await headerInput.click();
        await expect(row(page, 'NT-001')).toHaveClass(/tabulator-selected/);
        await expect(row(page, 'NT-002')).toHaveClass(/tabulator-selected/);
        await headerInput.click();
        await expectUnselected(page, 'NT-001');
        await expectUnselected(page, 'NT-002');
    });
});
