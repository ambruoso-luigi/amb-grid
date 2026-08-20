import { expect, test } from '@playwright/test';

const TABLE = '#dates-table';

const cell = (page, field) => page.locator(
    `${TABLE} .tabulator-row:first-child .tabulator-cell[tabulator-field="${field}"]`
);

const state = page => page.evaluate(() => {
    const read = field => {
        const target = document.querySelector(
            `#dates-table .tabulator-row:first-child .tabulator-cell[tabulator-field="${field}"]`
        );
        const editor = target?.querySelector('.amb-date-editor, .amb-date-editor-picker-anchor');

        return {
            editing: Boolean(target?.classList.contains('tabulator-editing')),
            editor: Boolean(editor),
            button: Boolean(target?.querySelector('.amb-date-editor-picker-button')),
            value: editor?.value || target?.textContent?.trim() || null
        };
    };

    return {
        compact: read('compactDate'),
        picker: read('pickerDate'),
        pickerOnly: read('pickerOnlyDate'),
        iso: read('isoDate'),
        activeField: document.activeElement?.closest('.tabulator-cell')?.getAttribute('tabulator-field') || null,
        pickerOpen: Boolean(document.querySelector('.datepicker.active'))
    };
});

const openDatesDemo = async page => {
    await page.goto('/src/demo/index.html#feature-examples');
    const languageChanged = page.evaluate(() => new Promise(resolve => {
        window.addEventListener('amb-demo-language-change', resolve, { once: true });
    }));
    await page.locator('[data-example="dates"]').click();
    await languageChanged;
    await expect(page.locator(`${TABLE}.tabulator`)).toBeVisible();
    await page.evaluate(() => new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
};

test.beforeEach(async ({ page }) => {
    await openDatesDemo(page);
});

test('Tab enters picker-only without reusing the entry keydown', async ({ page }) => {
    const compact = cell(page, 'compactDate');
    await compact.focus();
    await expect(compact).toHaveClass(/tabulator-editing/);
    await compact.locator('input').focus();

    await page.keyboard.press('Tab');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));

    await expect.poll(() => state(page)).toMatchObject({
        pickerOnly: {
            editing: true,
            editor: true,
            button: false
        },
        pickerOpen: true
    });

    const entered = await state(page);
    expect(entered.pickerOnly.value).toBe('15-06-2026');

    await cell(page, 'pickerOnlyDate').locator('.amb-date-editor-picker-anchor').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Tab');

    await expect.poll(() => state(page)).toMatchObject({
        pickerOnly: { editing: false, editor: false },
        pickerOpen: false,
        iso: { editing: true, editor: true }
    });
    expect((await cell(page, 'pickerOnlyDate').innerText())).toContain('15-06-2026');
});

test('picker-only Enter selects, and later Tab navigation remains reusable', async ({ page }) => {
    const compact = cell(page, 'compactDate');
    await compact.focus();
    await expect(compact).toHaveClass(/tabulator-editing/);
    await compact.locator('input').focus();
    await page.keyboard.press('Tab');
    await expect.poll(() => state(page)).toMatchObject({
        pickerOnly: { editing: true, editor: true },
        pickerOpen: true
    });

    await cell(page, 'pickerOnlyDate').locator('.amb-date-editor-picker-anchor').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(page.locator('.datepicker.active')).toHaveCount(0);
    const selected = await state(page);
    expect(selected.pickerOnly.value).not.toBe('15-06-2026');
    expect(selected.pickerOnly.editing).toBe(false);

    await page.keyboard.press('Shift+Tab');
    await expect.poll(() => state(page)).toMatchObject({
        compact: { editing: true, editor: true }
    });
});
