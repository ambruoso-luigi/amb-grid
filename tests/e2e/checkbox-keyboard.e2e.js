import { expect, test } from '@playwright/test';

const TABLE = '#inventory-test-table';
const CHECKBOX_FIELD = 'requiresInspection';

const checkboxCell = page => page.locator(
    `${TABLE} .tabulator-row:not(.tabulator-calcs) .tabulator-cell[tabulator-field="${CHECKBOX_FIELD}"]`
).first();

const openTestPage = async page => {
    await page.goto('/test/');
    await expect(page.locator(`${TABLE}.tabulator`)).toBeVisible();
};

test('checkbox cell click opens the same editor and keeps keyboard flow local', async ({ page }) => {
    await openTestPage(page);

    const cell = checkboxCell(page);
    await expect(cell).toContainText('☑');
    const initialChecked = true;

    await cell.click();

    const editorInput = cell.locator('.amb-checkbox-editor__input');

    await expect(editorInput).toBeVisible();
    await expect(editorInput).toBeFocused();
    await expect(editorInput).toBeChecked({ checked: !initialChecked });
    await expect(page.locator(`${TABLE} .tabulator-cell.tabulator-editing`)).toHaveCount(1);
    await expect(page.locator(`${TABLE} .tabulator-cell.tabulator-editing`)).toHaveAttribute(
        'tabulator-field',
        CHECKBOX_FIELD
    );

    await page.keyboard.press('Enter');

    await expect(cell.locator('.amb-checkbox-editor__input')).toHaveCount(0);
    await expect(page.locator(`${TABLE} .tabulator-cell.tabulator-editing`)).toHaveCount(0);
    await expect(cell).toContainText(initialChecked ? '☐' : '☑');
    await expect(page.locator(
        '.tabulator-row .tabulator-cell[tabulator-field="requiresInspection"]'
    )).toHaveCount(10);

    await cell.click();
    await expect(cell.locator('.amb-checkbox-editor__input')).toBeFocused();
    await expect(cell.locator('.amb-checkbox-editor__input')).toBeChecked({
        checked: initialChecked
    });
    await page.keyboard.press('Space');
    await expect(cell.locator('.amb-checkbox-editor__input')).toBeChecked({
        checked: !initialChecked
    });
    await expect(cell.locator('.amb-checkbox-editor__input')).toBeFocused();

    await page.keyboard.press('Tab');

    await expect(page.locator(`${TABLE} .tabulator-cell.tabulator-editing`)).toHaveCount(1);
    await expect(page.locator(`${TABLE} .tabulator-cell.tabulator-editing`)).not.toHaveAttribute(
        'tabulator-field',
        CHECKBOX_FIELD
    );
    await expect(page.locator('.amb-large-text-editor__textarea')).toBeFocused();
});
