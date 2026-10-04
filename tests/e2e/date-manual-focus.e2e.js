import { expect, test } from '@playwright/test';

const openDatesExample = async page => {
    await page.goto('/');
    const datesCard = page.locator('[data-example="dates"]');

    await expect(datesCard).toBeVisible();
    await datesCard.click();
    await expect(page.locator('#dates-table .tabulator-row').first()).toBeVisible();
};

const firstRow = page => page.locator('#dates-table .tabulator-row').first();
const dateCell = (page, field) => firstRow(page).locator(`.tabulator-cell[tabulator-field="${field}"]`);
const eventCell = page => dateCell(page, 'eventName');

test('manual date editors restore navigation focus after Enter and Escape', async ({ page }) => {
    await openDatesExample(page);

    const cases = [
        { field: 'manualDate', rightSteps: 1, value: '09/08/2026', temporaryValue: '10/08/2026' },
        { field: 'isoDate', rightSteps: 3, value: '2026-08-09', temporaryValue: '2026-08-10' },
        { field: 'compactDate', rightSteps: 4, value: '20260809', temporaryValue: '20260810' }
    ];

    for (const { field, rightSteps, value, temporaryValue } of cases) {
        const cell = dateCell(page, field);

        await eventCell(page).click();
        await expect(eventCell(page)).toBeFocused();
        for (let step = 0; step < rightSteps; step += 1) {
            await page.keyboard.press('ArrowRight');
        }
        await expect(cell).toBeFocused();

        await page.keyboard.press('Enter');
        const input = cell.locator('input[type="text"]');
        await expect(input).toBeFocused();
        await input.fill(value);
        await page.keyboard.press('Enter');

        await expect(cell).toBeFocused();
        await expect(cell).not.toHaveClass(/tabulator-editing/);
        await expect(cell).toContainText(value);

        await page.keyboard.press('Enter');
        await expect(input).toBeFocused();
        await input.fill(temporaryValue);
        await page.keyboard.press('Escape');

        await expect(cell).toBeFocused();
        await expect(cell).not.toHaveClass(/tabulator-editing/);
        await expect(cell).toContainText(value);
        await page.keyboard.press('ArrowRight');
        await expect(cell).not.toBeFocused();
    }
});
