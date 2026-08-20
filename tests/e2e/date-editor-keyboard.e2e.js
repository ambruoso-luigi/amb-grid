import { expect, test } from '@playwright/test';

const TABLE = '#dates-table';

const cell = (page, field, rowIndex = 0) => {
    const row = rowIndex === 0
        ? page.locator(`${TABLE} .tabulator-row:first-child`)
        : page.locator(`${TABLE} .tabulator-row`).nth(rowIndex);

    return row.locator(`.tabulator-cell[tabulator-field="${field}"]`);
};

const state = page => page.evaluate(() => {
    const read = (field, rowIndex = 0) => {
        const row = rowIndex === 0
            ? document.querySelector('#dates-table .tabulator-row:first-child')
            : document.querySelectorAll('#dates-table .tabulator-row')[rowIndex];
        const target = row?.querySelector(`.tabulator-cell[tabulator-field="${field}"]`);
        const editor = target?.querySelector(
            'input, textarea, select, [contenteditable="true"]'
        );

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
        nextRowEvent: read('eventName', 1),
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

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Tab');

    await expect.poll(() => state(page)).toMatchObject({
        pickerOnly: { editing: false, editor: false },
        pickerOpen: false,
        nextRowEvent: { editing: true, editor: true }
    });
    expect((await cell(page, 'pickerOnlyDate').innerText())).toContain('15-06-2026');
});

test('picker-only keyboard selection restores focus before Shift+Tab', async ({ page }) => {
    const compact = cell(page, 'compactDate');
    await compact.focus();
    await expect(compact).toHaveClass(/tabulator-editing/);
    await compact.locator('input').focus();
    await page.keyboard.press('Tab');
    await expect.poll(() => state(page)).toMatchObject({
        pickerOnly: { editing: true, editor: true },
        pickerOpen: true
    });

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(page.locator('.datepicker.active')).toHaveCount(0);
    const selected = await state(page);
    expect(selected.pickerOnly.value).not.toBe('15-06-2026');
    expect(selected.pickerOnly.editing).toBe(false);

    await page.keyboard.press('Shift+Tab');
    await expect.poll(() => state(page)).toMatchObject({
        compact: { editing: true, editor: true },
        pickerOnly: { editing: false, editor: false },
        activeField: 'compactDate',
        pickerOpen: false
    });
});

test('picker-only mouse selection restores focus before Tab', async ({ page }) => {
    const compact = cell(page, 'compactDate');
    await compact.focus();
    await expect(compact).toHaveClass(/tabulator-editing/);
    await compact.locator('input').focus();
    await page.keyboard.press('Tab');
    await expect.poll(() => state(page)).toMatchObject({
        pickerOnly: { editing: true, editor: true },
        pickerOpen: true
    });

    const selectableDate = page.locator('.datepicker.active .datepicker-cell:not(.disabled)').first();
    await selectableDate.click();
    await expect(page.locator('.datepicker.active')).toHaveCount(0);
    await expect.poll(() => state(page)).toMatchObject({
        pickerOnly: { editing: false, editor: false },
        activeField: 'pickerOnlyDate',
        pickerOpen: false
    });

    await page.keyboard.press('Tab');
    await expect.poll(() => state(page)).toMatchObject({
        nextRowEvent: { editing: true, editor: true },
        pickerOpen: false
    });
});
