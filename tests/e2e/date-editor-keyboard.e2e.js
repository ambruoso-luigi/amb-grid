import { expect, test } from '@playwright/test';

const TABLE = '#dates-table';

const cell = (page, field, rowIndex = 0) => {
    const row = rowIndex === 0
        ? page.locator(`${TABLE} .tabulator-row:first-child`)
        : page.locator(`${TABLE} .tabulator-row`).nth(rowIndex);

    return row.locator(`.tabulator-cell[tabulator-field="${field}"]`);
};

const picker = page => page.locator('.datepicker.active');

const pickerAnchor = page => cell(page, 'pickerOnlyDate')
    .locator('.amb-date-editor-picker-anchor');

const pickerValue = page => cell(page, 'pickerOnlyDate')
    .locator('.amb-date-editor-picker-anchor')
    .inputValue();

const enterPickerOnlyFromCompact = async page => {
    const compact = cell(page, 'compactDate');
    const pickerOnly = cell(page, 'pickerOnlyDate');

    await compact.click();
    await expect(compact).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(compact).toHaveClass(/tabulator-editing/);
    await expect(compact.locator('input')).toBeFocused();

    await page.keyboard.press('Tab');

    await expect(pickerOnly).toHaveClass(/tabulator-editing/);
    await expect(pickerAnchor(page)).toBeAttached();
    await expect(pickerAnchor(page)).toBeFocused();
    await expect(picker(page)).toBeVisible();

    return { compact, pickerOnly };
};

const openDatesDemo = async page => {
    await page.goto('/src/demo/index.html#feature-examples');
    const languageChanged = page.evaluate(() => new Promise(resolve => {
        window.addEventListener('amb-demo-language-change', resolve, { once: true });
    }));
    await page.locator('[data-example="dates"]').click();
    await languageChanged;
    await expect(page.locator(`${TABLE}.tabulator`)).toBeVisible();
};

test.beforeEach(async ({ page }) => {
    await openDatesDemo(page);
});

test('click Compact date then Tab enters and stabilizes picker-only', async ({ page }) => {
    const { pickerOnly } = await enterPickerOnlyFromCompact(page);

    await page.waitForTimeout(750);

    await expect(pickerOnly).toHaveClass(/tabulator-editing/);
    await expect(pickerAnchor(page)).toBeAttached();
    await expect(pickerAnchor(page)).toBeFocused();
    await expect(picker(page)).toBeVisible();
});

test('picker-only arrows highlight without selection and Tab advances', async ({ page }) => {
    const { pickerOnly } = await enterPickerOnlyFromCompact(page);
    const originalValue = await pickerValue(page);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Tab');

    const nextEvent = cell(page, 'eventName', 1);
    await expect(pickerOnly).not.toHaveClass(/tabulator-editing/);
    await expect(picker(page)).toHaveCount(0);
    await expect(nextEvent).toHaveClass(/tabulator-editing/);
    await expect(nextEvent.locator('.amb-cell-editor')).toBeAttached();
    await expect(nextEvent.locator('.amb-cell-editor')).toBeFocused();
    await expect(pickerOnly).toContainText(originalValue);
});

test('picker-only arrows and Enter commit, then Shift+Tab returns to Compact date', async ({ page }) => {
    const { compact, pickerOnly } = await enterPickerOnlyFromCompact(page);
    const originalValue = await pickerValue(page);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect(picker(page)).toHaveCount(0);
    await expect(pickerOnly).not.toHaveClass(/tabulator-editing/);
    await expect(pickerOnly).not.toContainText(originalValue);
    await expect(pickerOnly).toBeFocused();

    await page.keyboard.press('Shift+Tab');

    await expect(compact).toHaveClass(/tabulator-editing/);
    await expect(compact.locator('input')).toBeAttached();
    await expect(compact.locator('input')).toBeFocused();
    await expect(pickerOnly).not.toHaveClass(/tabulator-editing/);
    await expect(picker(page)).toHaveCount(0);
});

test('picker-only mouse selection commits and Tab advances to the next row', async ({ page }) => {
    const { pickerOnly } = await enterPickerOnlyFromCompact(page);
    const originalValue = await pickerValue(page);
    const selectableDate = picker(page).locator('.datepicker-cell:not(.disabled)').first();

    await expect(selectableDate).toBeVisible();
    await selectableDate.click();

    await expect(picker(page)).toHaveCount(0);
    await expect(pickerOnly).not.toHaveClass(/tabulator-editing/);
    await expect(pickerOnly).toBeFocused();
    await expect(pickerOnly).not.toContainText(originalValue);

    await page.keyboard.press('Tab');

    const nextEvent = cell(page, 'eventName', 1);
    await expect(nextEvent).toHaveClass(/tabulator-editing/);
    await expect(nextEvent.locator('.amb-cell-editor')).toBeAttached();
    await expect(nextEvent.locator('.amb-cell-editor')).toBeFocused();
    await expect(picker(page)).toHaveCount(0);
});
