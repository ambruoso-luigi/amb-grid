import { expect, test } from '@playwright/test';

const openDatesExample = async page => {
    await page.goto('/');
    const datesCard = page.locator('[data-example="dates"]');

    await expect(datesCard).toBeVisible();
    await datesCard.click();
    await expect(page.locator('#dates-table .tabulator-row').first()).toBeVisible();
};

const pickerRow = page => page.locator('#dates-table .tabulator-row').first();
const pickerCell = page => pickerRow(page).locator('.tabulator-cell[tabulator-field="pickerDate"]');
const eventCell = page => pickerRow(page).locator('.tabulator-cell[tabulator-field="eventName"]');
const previousCell = page => pickerRow(page).locator('.tabulator-cell[tabulator-field="manualDate"]');
const nextCell = page => pickerRow(page).locator('.tabulator-cell[tabulator-field="isoDate"]');
const pickerOnlyCell = page => pickerRow(page).locator('.tabulator-cell[tabulator-field="pickerOnlyDate"]');

const openPicker = async page => {
    const cell = pickerCell(page);

    await cell.scrollIntoViewIfNeeded();
    await cell.dblclick({ delay: 100 });
    const input = page.locator('input.amb-date-editor').last();
    await expect(input).toBeVisible();
    const initialValue = await input.inputValue();
    await input.locator('xpath=..').locator('.amb-date-editor-picker-button').click();
    await expect(page.locator('.datepicker.active')).toBeVisible();

    return { cell, initialValue, input };
};

const selectDifferentDateWithMouse = async (page, input, initialValue) => {
    const days = page.locator('.datepicker.active .datepicker-cell.day:not(.disabled)');
    const dayCount = await days.count();

    await days.nth(dayCount - 1).click();
    await expect(input).toBeVisible();
    const selectedValue = await input.inputValue();

    expect(selectedValue).not.toBe(initialValue);
    return selectedValue;
};

const commitOutsideEditorAndVerify = async (page, cell, selectedValue) => {
    await eventCell(page).dblclick();
    await expect.poll(() => cell.textContent()).toContain(selectedValue);
    await cell.click();
    await expect(page.locator('input.amb-date-editor').last()).toHaveValue(selectedValue);
};

test.describe('date picker commit regression', () => {
    test('picker-only uses double click, Enter, and F2 without opening a manual input', async ({ page }) => {
        await openDatesExample(page);
        const cell = pickerOnlyCell(page);
        const picker = page.locator('.datepicker.active');

        await cell.click();
        await expect(cell).toBeFocused();
        await expect(cell).not.toHaveClass(/tabulator-editing/);
        await expect(picker).toHaveCount(0);
        await expect(cell.locator('input.amb-date-editor')).toHaveCount(0);

        await cell.dblclick({ delay: 100 });
        await expect(picker).toHaveCount(1);
        await expect(cell.locator('input.amb-date-editor')).toHaveCount(0);
        await page.keyboard.press('Escape');
        await expect(picker).toHaveCount(0);

        await cell.click();
        await page.keyboard.press('Enter');
        await expect(picker).toHaveCount(1);
        await page.keyboard.press('Escape');

        await cell.click();
        await page.keyboard.press('F2');
        await expect(picker).toHaveCount(1);
    });

    test('F2 opens the calendar from a manually focused picker date', async ({ page }) => {
        await openDatesExample(page);
        const cell = pickerCell(page);
        await cell.click();
        await expect(cell).toBeFocused();
        await expect(cell).not.toHaveClass(/tabulator-editing/);
        await expect(cell.locator('input.amb-date-editor')).toHaveCount(0);
        await expect(page.locator('.datepicker.active')).toHaveCount(0);

        await page.keyboard.press('F2');
        const input = page.locator('input.amb-date-editor').last();
        await expect(input).toBeFocused();
        await expect(input).toBeVisible();
        await expect(page.locator('.datepicker.active')).toBeVisible();
    });

    test('mouse selection commits on external blur', async ({ page }) => {
        await openDatesExample(page);
        const { cell, initialValue, input } = await openPicker(page);
        const selectedValue = await selectDifferentDateWithMouse(page, input, initialValue);

        await commitOutsideEditorAndVerify(page, cell, selectedValue);
    });

    test('Enter selection commits on external blur', async ({ page }) => {
        await openDatesExample(page);
        const { cell, initialValue, input } = await openPicker(page);

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        const selectedValue = await input.inputValue();

        expect(selectedValue).not.toBe(initialValue);
        await expect(page.locator('.datepicker.active')).toHaveCount(0);
        await commitOutsideEditorAndVerify(page, cell, selectedValue);
    });

    test('Tab commits and navigates to the next editable cell', async ({ page }) => {
        await openDatesExample(page);
        const { cell, initialValue, input } = await openPicker(page);
        const selectedValue = await selectDifferentDateWithMouse(page, input, initialValue);

        await page.keyboard.press('Tab');
        await expect(nextCell(page)).toHaveClass(/tabulator-editing/);
        await cell.click();
        await expect(page.locator('input.amb-date-editor').last()).toHaveValue(selectedValue);
    });

    test('Shift+Tab commits and navigates to the previous editable cell', async ({ page }) => {
        await openDatesExample(page);
        const { cell, initialValue, input } = await openPicker(page);
        const selectedValue = await selectDifferentDateWithMouse(page, input, initialValue);

        await page.keyboard.press('Shift+Tab');
        await expect(previousCell(page)).toHaveClass(/tabulator-editing/);
        await cell.click();
        await expect(page.locator('input.amb-date-editor').last()).toHaveValue(selectedValue);
    });
});
