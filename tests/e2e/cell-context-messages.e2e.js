import { expect, test } from '@playwright/test';

const table = page => page.locator('#inventory-table');
const row = (page, code) => table(page).locator('.tabulator-row').filter({ hasText: code });
const cell = (page, code, field) => row(page, code)
    .locator(`.tabulator-cell[tabulator-field="${field}"]`);
const message = page => page.locator('.teh-floating-message');
const messageBody = page => message(page).locator('.teh-floating-message__body');
const hasFocusIndicator = target => target.evaluate(element => {
    const style = getComputedStyle(element);

    return style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0;
});
const expectFocusIndicator = async target => {
    await expect.poll(() => hasFocusIndicator(target)).toBe(true);
};
const reactRow = (page, code) => page.locator('.react-demo-grid .tabulator-row').filter({ hasText: code });
const reactCell = (page, code, field) => reactRow(page, code)
    .locator(`.tabulator-cell[tabulator-field="${field}"]`);

test.describe('contextual cell messages and large-text focus', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/#getting-started-javascript');
        await expect(table(page)).toBeVisible();
        await expect(row(page, 'PRD-A001')).toBeVisible();
    });

    test('keyboard focus overrides a stale lookup hover and real mouse movement retakes ownership', async ({ page }) => {
        const firstStatus = cell(page, 'PRD-A001', 'status');

        await firstStatus.hover();
        await expect(message(page)).toHaveClass(/teh-floating-message--visible/);
        await expect(message(page).locator('.teh-floating-message__title')).toHaveText('Description');
        const firstDescription = await messageBody(page).textContent();

        await firstStatus.click();
        await page.keyboard.press('Alt+ArrowDown');
        await expect(cell(page, 'PRD-AB02', 'status')).toHaveClass(/tabulator-editing/);
        await expect(cell(page, 'PRD-AB02', 'status').locator('.amb-lookup-editor__input')).toBeFocused();
        await page.evaluate(() => new Promise(resolve => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        }));
        await page.keyboard.press('Alt+ArrowDown');
        await expect(cell(page, 'PRD-A003', 'status')).toHaveClass(/tabulator-editing/);
        await expect(message(page)).toHaveClass(/teh-floating-message--visible/);
        await expect(messageBody(page)).not.toHaveText(firstDescription);
        const keyboardDescription = await messageBody(page).textContent();

        await cell(page, 'PRD-B004', 'status').hover();
        await expect(messageBody(page)).not.toHaveText(keyboardDescription);
    });

    test('keeps the lookup hover delay from the first movement within a status cell', async ({ page }) => {
        const status = cell(page, 'PRD-A001', 'status');

        await status.hover();
        const box = await status.boundingBox();
        expect(box).not.toBeNull();

        for (let step = 0; step < 6; step += 1) {
            await page.mouse.move(box.x + 12 + step, box.y + box.height / 2);
            await page.waitForTimeout(85);
        }

        await expect(message(page)).toHaveClass(/teh-floating-message--visible/, { timeout: 100 });
        await expect(message(page).locator('.teh-floating-message__title')).toHaveText('Description');
    });

    test('large-text focus, dialog trap, save and cancel preserve the focus-first contract', async ({ page }) => {
        const notes = cell(page, 'PRD-AB02', 'notes');

        await notes.scrollIntoViewIfNeeded();
        await notes.click();
        await expect(notes).toBeFocused();
        await expectFocusIndicator(notes);
        await expect(notes).not.toHaveClass(/tabulator-editing/);
        await expect(page.locator('.amb-large-text-editor')).toHaveCount(0);
        await expect(message(page)).toHaveClass(/teh-floating-message--visible/);
        const originalText = await messageBody(page).textContent();

        await page.keyboard.press('Enter');
        const dialog = page.locator('.amb-large-text-editor');
        const textarea = dialog.locator('.amb-large-text-editor__textarea');
        const cancel = dialog.getByRole('button', { name: 'Cancel' });
        const save = dialog.getByRole('button', { name: 'Save' });
        await expect(dialog).toBeVisible();
        await expect(textarea).toBeFocused();
        await expect.poll(() => hasFocusIndicator(notes)).toBe(false);
        await expect(message(page)).not.toHaveClass(/teh-floating-message--visible/);

        await page.keyboard.press('Tab');
        await expect(cancel).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(save).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(textarea).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(save).toBeFocused();

        await textarea.fill('Updated contextual note');
        await save.click();
        await expect(dialog).toHaveCount(0);
        await expect(notes).toBeFocused();
        await expectFocusIndicator(notes);
        await expect(notes).not.toHaveClass(/tabulator-editing/);
        await expect(messageBody(page)).toHaveText('Updated contextual note');

        await page.keyboard.press('Enter');
        await expect(textarea).toBeFocused();
        await textarea.fill('Discarded note');
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(notes).toBeFocused();
        await expectFocusIndicator(notes);
        await expect(messageBody(page)).toHaveText('Updated contextual note');
        await expect(messageBody(page)).not.toHaveText(originalText);
    });

    test('focus indicator coexists with error and modified cell styling', async ({ page }) => {
        const notes = cell(page, 'PRD-AB02', 'notes');

        await notes.scrollIntoViewIfNeeded();
        await notes.click();
        await expectFocusIndicator(notes);

        await notes.evaluate(element => element.setAttribute('data-cell-error', 'true'));
        await expectFocusIndicator(notes);
        await expect.poll(() => notes.evaluate(element => (
            getComputedStyle(element).boxShadow !== 'none'
        ))).toBe(true);

        await notes.evaluate(element => {
            element.removeAttribute('data-cell-error');
            element.setAttribute('data-cell-state', 'modified');
        });
        await expectFocusIndicator(notes);
        await expect.poll(() => notes.evaluate(element => (
            getComputedStyle(element).backgroundColor !== 'rgba(0, 0, 0, 0)'
        ))).toBe(true);
    });
});

test.describe('React contextual lookup messages', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/#getting-started-react');
        await expect(reactRow(page, 'ITM-1001')).toBeVisible();
    });

    test('shows stable descriptions for pointer movement, row changes and keyboard focus', async ({ page }) => {
        const active = reactCell(page, 'ITM-1001', 'status');

        await active.hover();
        await expect(message(page)).toHaveClass(/teh-floating-message--visible/);
        await expect(messageBody(page)).toHaveText('Active');

        const box = await active.boundingBox();
        expect(box).not.toBeNull();
        for (let step = 0; step < 6; step += 1) {
            await page.mouse.move(box.x + 12 + step, box.y + box.height / 2);
            await page.waitForTimeout(85);
        }
        await expect(message(page)).toHaveClass(/teh-floating-message--visible/, { timeout: 100 });
        await expect(messageBody(page)).toHaveText('Active');

        await reactCell(page, 'ITM-1003', 'status').hover();
        await expect(messageBody(page)).toHaveText('Review required');
        await reactCell(page, 'ITM-1005', 'status').hover();
        await expect(messageBody(page)).toHaveText('On hold');

        await active.focus();
        await expect(active).toBeFocused();
        await expect(message(page)).toHaveClass(/teh-floating-message--visible/);
        await expect(messageBody(page)).toHaveText('Active');
    });
});
