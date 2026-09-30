import { expect } from '@playwright/test';

const inspectTarget = async target => {
    const count = await target.count();
    if (!count) return { exists: false, visible: false, connected: false, focused: false };
    return target.first().evaluate(element => ({
        exists: true,
        visible: Boolean(element.offsetParent),
        connected: element.isConnected,
        focused: document.activeElement === element,
        className: String(element.className || ''),
        field: element.getAttribute('tabulator-field')
    }));
};

export const reportFocusDiagnostics = async (page, target, label, tableSelector) => {
    const [targetState, pageState] = await Promise.all([
        inspectTarget(target),
        page.evaluate(selector => {
            const active = document.activeElement;
            const activeCell = active?.closest?.('.tabulator-cell');
            const table = document.querySelector(selector);
            return {
                activeElement: { tagName: active?.tagName || null, className: String(active?.className || '') },
                activeCell: { field: activeCell?.getAttribute('tabulator-field') || null, editing: Boolean(activeCell?.classList.contains('tabulator-editing')) },
                openEditors: table?.querySelectorAll('.tabulator-cell.tabulator-editing').length ?? null,
                currentPage: table?.querySelector('.tabulator-page.active')?.textContent?.trim() || null
            };
        }, tableSelector)
    ]);
    console.error(`[focus diagnostics] ${label}\n${JSON.stringify({ target: targetState, ...pageState })}`);
};

export const enterNavigationWithClick = async (page, target, label, tableSelector) => {
    const field = await target.getAttribute('tabulator-field');
    try {
        await target.click();
        await expect(target).toBeFocused();
        await expect(target).not.toHaveClass(/tabulator-editing/);
        await expect(target.locator('input.amb-cell-editor')).toHaveCount(0);
        await expect.poll(() => page.evaluate(() => document.activeElement?.closest('.tabulator-cell')?.getAttribute('tabulator-field') || null)).toBe(field);
    } catch (error) {
        await reportFocusDiagnostics(page, target, `${label}: navigation setup failed`, tableSelector);
        throw error;
    }
};

export const openEditorFromNavigation = async (page, target, label, tableSelector, inputSelector = 'input.amb-cell-editor') => {
    await enterNavigationWithClick(page, target, label, tableSelector);
    const input = target.locator(inputSelector);
    try {
        await page.keyboard.press('Enter');
        await expect(target).toHaveClass(/tabulator-editing/);
        await expect(input).toBeFocused();
    } catch (error) {
        await reportFocusDiagnostics(page, target, `${label}: editor activation failed`, tableSelector);
        throw error;
    }
    return input;
};
