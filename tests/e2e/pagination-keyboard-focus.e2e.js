import { expect, test } from '@playwright/test';
import { enterNavigationWithClick, openEditorFromNavigation, reportFocusDiagnostics } from './helpers/focus-diagnostics.js';

const table = page => page.locator('#inventory-table');
const firstRow = page => table(page).locator('.tabulator-row').first();
const cell = (page, field) => firstRow(page).locator(`.tabulator-cell[tabulator-field="${field}"]`);
const rowByCode = (page, code) => table(page).locator('.tabulator-row').filter({ hasText: code });
const rowCell = (page, code, field) => rowByCode(page, code).locator(`.tabulator-cell[tabulator-field="${field}"]`);
const currentPage = page => table(page).locator('.tabulator-page.active').textContent().then(Number);
const waitForPage = (page, number) => expect.poll(() => currentPage(page)).toBe(number);
const firstItemCode = page => firstRow(page).locator('.tabulator-cell[tabulator-field="itemCode"]');

const goToLastPage = async page => {
    const pager = table(page);
    const last = pager.locator('.tabulator-page[data-page="last"]');
    await expect(last).toBeVisible();
    await last.click();
    await expect.poll(() => currentPage(page)).toBeGreaterThan(1);
};

const goToPenultimatePage = async page => {
    await goToLastPage(page);
    const previous = table(page).locator('.tabulator-page[data-page="prev"]');
    await previous.click();
    const penultimate = await currentPage(page);
    await expect(table(page).locator('.tabulator-page[data-page="next"]')).toBeVisible();
    return penultimate;
};

const expectItemCodeEditor = async page => {
    const itemCode = cell(page, 'itemCode');
    await expect(itemCode).toHaveClass(/tabulator-editing/);
    await expect(itemCode.locator('input.amb-cell-editor')).toBeFocused();
    await expect(table(page).locator('.tabulator-cell.tabulator-editing')).toHaveCount(1);
};

const expectItemCodeNavigationFocus = async page => {
    const itemCode = cell(page, 'itemCode');

    await expect(itemCode).toBeFocused();
    await expect(itemCode.locator('input.amb-cell-editor')).toHaveCount(0);
    await expect(table(page).locator('.tabulator-cell.tabulator-editing')).toHaveCount(0);
};

const moveAndCheck = async (page, key, number) => {
    await page.keyboard.press(key);
    await waitForPage(page, number);
    await expectItemCodeEditor(page);
};

const expectFocusOutsideGrid = page => expect.poll(() => page.evaluate(() => Boolean(
    document.activeElement && document.activeElement !== document.body
    && !document.activeElement.closest('#inventory-table')
    && !document.activeElement.closest('.amb-large-text-editor')
))).toBe(true);

const expectLookupEditor = async (page, code) => {
    const target = rowCell(page, code, 'status');
    await expect(target).toHaveClass(/tabulator-editing/);
    await expect(target.locator('.amb-lookup-editor__input')).toBeFocused();
};

const openStatusLookupEditor = page => openEditorFromNavigation(
    page,
    rowCell(page, 'PRD-AB02', 'status'),
    'Status lookup pagination setup',
    '#inventory-table',
    '.amb-lookup-editor__input'
);

const selectStatusDialogResult = async (page, value) => {
    await page.keyboard.press('F2');
    const dialog = page.locator('.amb-lookup-dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('tbody tr').filter({ hasText: value }).first().click();
    await dialog.locator('.amb-lookup-dialog__button--primary').click();
    await expect(dialog).toHaveCount(0);
};

test.describe('keyboard pagination focus', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/#getting-started-javascript');
        await expect(table(page)).toBeVisible();
        await expect(firstRow(page)).toBeVisible();
        await expect(table(page).locator('.tabulator-page[data-page="2"]')).toBeVisible();
    });

    test('closes autocomplete naturally before page shortcuts', async ({ page }) => {
        const warehouse = cell(page, 'warehouse');
        await openEditorFromNavigation(
            page,
            warehouse,
            'Warehouse autocomplete pagination setup',
            '#inventory-table',
            'input.amb-autocomplete-editor'
        );
        await page.keyboard.press('Alt+PageDown');
        await waitForPage(page, 2);
        await expect(page.locator('.amb-autocomplete-cell--editing')).toHaveCount(0);
        await expectItemCodeNavigationFocus(page);
        await page.keyboard.press('Alt+PageUp');
        await waitForPage(page, 1);
        await expectItemCodeNavigationFocus(page);
    });

    test('moves Tab and Shift+Tab symmetrically across pages', async ({ page }) => {
        const notes = rowCell(page, 'PRD-H010', 'notes');
        await enterNavigationWithClick(page, notes, 'Tab pagination setup', '#inventory-table');
        await page.keyboard.press('Tab');
        await waitForPage(page, 2);
        await expectItemCodeEditor(page);
        await page.keyboard.press('Shift+Tab');
        await waitForPage(page, 1);
        await expect(notes).toBeFocused();
    });

    test('Shift+Tab exits the grid at the first absolute boundary', async ({ page }) => {
        await openEditorFromNavigation(
            page,
            cell(page, 'itemCode'),
            'Shift+Tab first boundary setup',
            '#inventory-table'
        );
        await page.keyboard.press('Shift+Tab');
        await expectFocusOutsideGrid(page);
    });

    test('opens editing only after Enter following an Alt+PageDown focus change', async ({ page }) => {
        await openEditorFromNavigation(page, cell(page, 'itemCode'), 'Alt+PageDown phase A/B', '#inventory-table');
        await expectItemCodeEditor(page);
        await page.keyboard.press('Alt+PageDown');
        await waitForPage(page, 2);
        try {
            await expectItemCodeNavigationFocus(page);
        } catch (error) {
            await reportFocusDiagnostics(page, cell(page, 'itemCode'), 'Alt+PageDown phase C: page transition failed', '#inventory-table');
            throw error;
        }

        await page.keyboard.press('Enter');
        await expectItemCodeEditor(page);
    });

    test('keeps focus-only navigation across the final page boundary with Alt+Page shortcuts', async ({ page }) => {
        const penultimate = await goToPenultimatePage(page);
        const itemCode = firstItemCode(page);
        await itemCode.click();
        await expectItemCodeNavigationFocus(page);

        await page.keyboard.press('Alt+PageDown');
        await expect.poll(() => currentPage(page)).toBeGreaterThan(penultimate);
        await expectItemCodeNavigationFocus(page);
        await page.keyboard.press('Enter');
        await expectItemCodeEditor(page);
        await page.keyboard.press('Escape');
        await expectItemCodeNavigationFocus(page);

        await page.keyboard.press('Alt+PageUp');
        await waitForPage(page, penultimate);
        try {
            await expectItemCodeNavigationFocus(page);
            await expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false);
        } catch (error) {
            await reportFocusDiagnostics(page, firstItemCode(page), 'final boundary Alt+PageUp focus restore failed', '#inventory-table');
            throw error;
        }
    });

    test('preserves sequential navigation after a real lookup selection', async ({ page }) => {
        await openStatusLookupEditor(page);
        await expectLookupEditor(page, 'PRD-AB02');
        await selectStatusDialogResult(page, 'A001');
        await expectLookupEditor(page, 'PRD-AB02');
        await page.keyboard.press('Shift+Tab');
        await expect(rowCell(page, 'PRD-AB02', 'lastCheckDate')).toHaveClass(/tabulator-editing/);

        await page.keyboard.press('Escape');
        await openStatusLookupEditor(page);
        await expectLookupEditor(page, 'PRD-AB02');
        await selectStatusDialogResult(page, 'AB03');
        await expectLookupEditor(page, 'PRD-AB02');
        await page.keyboard.press('Tab');
        await expect(rowCell(page, 'PRD-AB02', 'requiresInspection')).toHaveClass(/tabulator-editing/);
    });

});
