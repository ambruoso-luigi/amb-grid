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
