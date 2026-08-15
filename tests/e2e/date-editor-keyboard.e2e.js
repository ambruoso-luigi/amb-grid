import { expect, test } from '@playwright/test';

const TABLE = '#dates-table';

const dateCell = (page, field) => {
    return page.locator(`${TABLE} .tabulator-row`)
        .first()
        .locator(`.tabulator-cell[tabulator-field="${field}"]`);
};

const watchEditorOpen = (page, field) => page.evaluate(fieldName => {
    window.__ambDateEditorOpened = false;

    const cellSelector = `.tabulator-cell[tabulator-field="${fieldName}"]`;
    const originalFocus = HTMLElement.prototype.focus;

    HTMLElement.prototype.focus = function (...args) {
        const isExpectedEditor = this.closest && this.closest(cellSelector);

        if (isExpectedEditor) {
            window.__ambDateEditorOpened = true;
            HTMLElement.prototype.focus = originalFocus;
        }

        return originalFocus.apply(this, args);
    };
}, field);

const editorWasOpened = page => page.evaluate(() => window.__ambDateEditorOpened);

const openPickerDateEditor = async page => {
    const cell = dateCell(page, 'pickerDate');

    await cell.evaluate(element => {
        element.focus();

        const pickerButton = element.querySelector('.amb-date-editor-picker-button');

        if (!pickerButton) throw new Error('Date picker button was not mounted');
        pickerButton.click();
    });
    await expect(page.locator('.datepicker.active')).toBeVisible();
};

test.beforeEach(async ({ page }) => {
    await page.goto('/src/demo/index.html#feature-examples');
    const exampleLoaded = page.evaluate(() => new Promise(resolve => {
        window.addEventListener('amb-demo-language-change', resolve, { once: true });
    }));

    await page.locator('[data-example="dates"]').click();
    await exampleLoaded;
    await expect(page.locator(`${TABLE}.tabulator`)).toBeVisible();
    await page.evaluate(() => new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
});

test('open datepicker Tab and Shift+Tab commit and navigate across editable cells', async ({ page }) => {
    await openPickerDateEditor(page);
    await watchEditorOpen(page, 'isoDate');
    await page.keyboard.press('Tab');

    await expect(page.locator('.datepicker.active')).toHaveCount(0);
    await expect.poll(() => editorWasOpened(page)).toBe(true);

    await openPickerDateEditor(page);
    await watchEditorOpen(page, 'manualDate');
    await page.keyboard.press('Shift+Tab');

    await expect(page.locator('.datepicker.active')).toHaveCount(0);
    await expect.poll(() => editorWasOpened(page)).toBe(true);
});
