import { expect, test } from '@playwright/test';

const table = page => page.locator('#inventory-test-table');
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
        await page.goto('/test/');
        await page.locator('#selection-mode').selectOption('multiple');
        await expect(table(page)).toBeVisible();
        await expect(row(page, 'PRD-A001')).toBeVisible();
    });

    test('ordinary cells never select their row', async ({ page }) => {
        const id = 'PRD-A001';

        await expectUnselected(page, id);
        await cell(page, id, 'itemCode').click();
        await expectUnselected(page, id);
        await cell(page, id, 'productName').click();
        await expectUnselected(page, id);
        await cell(page, id, 'selectProbe').click();
        await expectUnselected(page, id);
    });

    test('selection checkbox toggles with Space', async ({ page }) => {
        const id = 'PRD-A001';

        await pressSelectionKey(page, id, 'Space');
        await expectSelected(page, id);
        await pressSelectionKey(page, id, 'Space');
        await expectUnselected(page, id);
    });

    for (const [selectKey, unselectKey] of [['S', 'N']]) {
        test(`selection checkbox supports ${selectKey}/${unselectKey}`, async ({ page }) => {
            const id = 'PRD-A001';

            await pressSelectionKey(page, id, selectKey);
            await expectSelected(page, id);
            await pressSelectionKey(page, id, unselectKey);
            await expectUnselected(page, id);
        });
    }

    test('selection checkbox supports Y', async ({ page }) => {
        const id = 'PRD-A001';

        await pressSelectionKey(page, id, 'Y');
        await expectSelected(page, id);
    });

    test('selection checkbox toggles with pointer clicks', async ({ page }) => {
        const id = 'PRD-A001';
        const input = selectionInput(page, id);

        await input.click();
        await expectSelected(page, id);
        await input.click();
        await expectUnselected(page, id);
    });

    test('header select-all still manages multiple selection without row clicks', async ({ page }) => {
        const headerInput = table(page).locator('.tabulator-header input[type="checkbox"]').first();

        await expect(headerInput).toBeVisible();
        await headerInput.check();
        await expect(headerInput).toBeChecked();
        await expect(row(page, 'PRD-A001')).toHaveClass(/tabulator-selected/);
        await expect(row(page, 'PRD-AB02')).toHaveClass(/tabulator-selected/);
        await headerInput.uncheck();
        await expect(headerInput).not.toBeChecked();
        await expect(row(page, 'PRD-A001')).not.toHaveClass(/tabulator-selected/);
        await expect(row(page, 'PRD-AB02')).not.toHaveClass(/tabulator-selected/);
    });
});
