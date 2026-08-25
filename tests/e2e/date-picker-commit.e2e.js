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
const previousCell = page => eventCell(page);
const nextCell = page => pickerRow(page).locator('.tabulator-cell[tabulator-field="isoDate"]');

const openPicker = async page => {
    const cell = pickerCell(page);

    await cell.dblclick();
    const input = page.locator('input.amb-date-editor').last();
    await expect(input).toBeVisible();
    const initialValue = await input.inputValue();
    await page.locator('.amb-date-editor-picker-button').last().click({ force: true });
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
