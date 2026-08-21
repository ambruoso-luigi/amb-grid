import { expect, test } from '@playwright/test';

const TABLE = '#dates-table';

const dataRow = (page, rowIndex = 0) => page.locator(`${TABLE} [role="row"]`).nth(rowIndex + 1);

const tableCell = (page, columnIndex, rowIndex = 0) => dataRow(page, rowIndex)
    .locator('[role="gridcell"]')
    .nth(columnIndex);

const compactCell = page => tableCell(page, 5);

const pickerOnlyCell = page => tableCell(page, 6);

const nextRowEventCell = page => tableCell(page, 1, 1);

const pickerAnchor = page => pickerOnlyCell(page)
    .locator('.amb-date-editor-picker-anchor');

const activePicker = page => page.locator('.datepicker.active');

const enterPickerOnlyFromCompact = async page => {
    const compact = compactCell(page);
    const pickerOnly = pickerOnlyCell(page);

    await compact.click();
    await expect(compact).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(compact.locator('input')).toBeVisible();
    await expect(compact.locator('input')).toBeFocused();

    await page.keyboard.press('Tab');

    await expect(pickerOnly.locator('.amb-date-editor-picker-anchor')).toBeVisible();
    await expect(pickerAnchor(page)).toBeFocused();
    await expect(activePicker(page)).toBeVisible();
};

const openDatesDemo = async page => {
    await page.goto('/src/demo/index.html#feature-examples');
    const languageChanged = page.evaluate(() => new Promise(resolve => {
        window.addEventListener('amb-demo-language-change', resolve, { once: true });
    }));
    await page.locator('[data-example="dates"]').click();
    await languageChanged;
    await expect(page.locator(TABLE)).toBeVisible();
};

test.beforeEach(async ({ page }) => {
    await openDatesDemo(page);
});

test('keyboard navigation enters picker-only and remains stable', async ({ page }) => {
    await enterPickerOnlyFromCompact(page);

    await page.waitForTimeout(1000);

    await expect(pickerAnchor(page)).toBeVisible();
    await expect(pickerAnchor(page)).toBeFocused();
    await expect(activePicker(page)).toBeVisible();
});

test('highlighted date is not selected when leaving with Tab', async ({ page }) => {
    const pickerOnly = pickerOnlyCell(page);
    const originalValue = (await pickerOnly.textContent())?.trim();

    await enterPickerOnlyFromCompact(page);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Tab');

    await expect(activePicker(page)).toHaveCount(0);
    await expect(pickerAnchor(page)).toHaveCount(0);
    await expect(pickerOnly).toHaveText(originalValue);

    const nextEditor = nextRowEventCell(page).locator('.amb-cell-editor');

    await expect(nextEditor).toBeVisible();
    await expect(nextEditor).toBeFocused();
});

test('Enter selects the highlighted date and Shift+Tab returns backward', async ({ page }) => {
    const compact = compactCell(page);
    const pickerOnly = pickerOnlyCell(page);
    const originalValue = (await pickerOnly.textContent())?.trim();

    await enterPickerOnlyFromCompact(page);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect(activePicker(page)).toHaveCount(0);
    await expect(pickerAnchor(page)).toHaveCount(0);
    await expect(pickerOnly).not.toHaveText(originalValue);
    await expect(pickerOnly).toBeFocused();

    await page.keyboard.press('Shift+Tab');

    const compactEditor = compact.locator('input');

    await expect(compactEditor).toBeVisible();
    await expect(compactEditor).toBeFocused();
    await expect(activePicker(page)).toHaveCount(0);
});

test('mouse selection keeps keyboard navigation inside the grid flow', async ({ page }) => {
    const pickerOnly = pickerOnlyCell(page);
    const originalValue = (await pickerOnly.textContent())?.trim();

    await enterPickerOnlyFromCompact(page);

    const selectableDate = activePicker(page)
        .locator('.datepicker-cell:not(.disabled):not(.selected)')
        .first();

    await expect(selectableDate).toBeVisible();
    await selectableDate.click();

    await expect(activePicker(page)).toHaveCount(0);
    await expect(pickerAnchor(page)).toHaveCount(0);
    await expect(pickerOnly).not.toHaveText(originalValue);
    await expect(pickerOnly).toBeFocused();

    await page.keyboard.press('Tab');

    const nextEditor = nextRowEventCell(page).locator('.amb-cell-editor');

    await expect(nextEditor).toBeVisible();
    await expect(nextEditor).toBeFocused();
    await expect(activePicker(page)).toHaveCount(0);
});
