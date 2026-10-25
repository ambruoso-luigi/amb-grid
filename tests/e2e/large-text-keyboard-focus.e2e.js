import { expect, test } from '@playwright/test';

const table = page => page.locator('#inventory-test-table');
const firstRow = page => table(page).locator('.tabulator-row').first();
const cell = (page, field) => firstRow(page).locator(
    `.tabulator-cell[tabulator-field="${field}"]`
);

const expectNotesFocused = async page => {
    const notes = cell(page, 'notes');

    await expect(notes).toBeFocused();
    await expect(notes).not.toHaveClass(/tabulator-editing/);
    await expect(page.locator('.amb-large-text-editor')).toHaveCount(0);
};

const installConsultationGrid = async (page, readOnly = true) => {
    await page.goto('/test/');
    await expect(firstRow(page)).toBeVisible();
    await page.evaluate(async readOnly => {
        const { AMB } = await import('/src/index.js');
        const host = document.createElement('div');
        host.id = 'large-text-consultation';
        document.body.prepend(host);
        const state = window.__largeTextConsultation = { edits: 0, cancellations: 0 };
        state.grid = AMB.table({
            selector: host,
            toolbar: false,
            floatingMessages: false,
            data: [{ id: 1, notes: 'Original notes\nText available for selection and copying.' }],
            columns: [{ field: 'notes', editor: AMB.editors.largeText({ readOnly, closeText: 'Chiudi' }) }]
        });
        state.grid.on('cellEdited', () => { state.edits += 1; });
        state.grid.on('cellEditCancelled', () => { state.cancellations += 1; });
        await new Promise(resolve => {
            const built = () => { state.grid.off('tableBuilt', built); resolve(); };
            state.grid.on('tableBuilt', built);
        });
    }, readOnly);
    return page.locator('#large-text-consultation .tabulator-cell[tabulator-field="notes"]');
};

test.describe('large-text keyboard focus regression', () => {
    test('single click focuses Notes while double click keeps its primary dialog activation', async ({ page }) => {
        await page.goto('/test/');
        await expect(firstRow(page)).toBeVisible();

        const notes = cell(page, 'notes');
        await notes.click();
        await expectNotesFocused(page);

        await notes.dblclick({ delay: 100 });
        const dialog = page.locator('.amb-large-text-editor');
        await expect(dialog).toBeVisible();
        await expect(dialog.locator('.amb-large-text-editor__textarea')).toBeFocused();
    });

    test('readonly consultation opens by double click or Enter and closes without changing data or CRUD state', async ({ page }) => {
        const notes = await installConsultationGrid(page);
        const original = await page.evaluate(() => ({
            data: window.__largeTextConsultation.grid.getData(),
            changes: window.__largeTextConsultation.grid.getChanges()
        }));
        const dialog = page.locator('.amb-large-text-editor');
        await notes.click();
        await expect(notes).toBeFocused();
        await expect(notes).not.toHaveClass(/tabulator-editing/);
        await expect(dialog).toHaveCount(0);
        await notes.dblclick();
        const textarea = dialog.locator('textarea');
        await expect(textarea).toBeFocused();
        await expect(textarea).toHaveValue(original.data[0].notes);
        await expect(textarea).toHaveJSProperty('readOnly', true);
        await expect(textarea).toBeEnabled();
        await expect(dialog.getByRole('button')).toHaveCount(1);
        await expect(dialog.getByRole('button', { name: 'Chiudi', exact: true })).toBeVisible();
        await textarea.press('ControlOrMeta+A');
        expect(await textarea.evaluate(element => element.value.slice(element.selectionStart, element.selectionEnd)))
            .toBe(original.data[0].notes);
        await textarea.press('x');
        await expect(textarea).toHaveValue(original.data[0].notes);
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(notes).toBeFocused();
        await expect(notes).not.toHaveClass(/tabulator-editing/);
        await page.keyboard.press('Enter');
        await expect(textarea).toBeFocused();
        await dialog.getByRole('button', { name: 'Chiudi', exact: true }).click();
        await expect(dialog).toHaveCount(0);
        await expect(notes).toBeFocused();
        await expect(notes).not.toHaveClass(/tabulator-editing/);
        expect(await page.evaluate(() => ({
            data: window.__largeTextConsultation.grid.getData(),
            changes: window.__largeTextConsultation.grid.getChanges(),
            edits: window.__largeTextConsultation.edits,
            cancellations: window.__largeTextConsultation.cancellations
        }))).toEqual({ ...original, edits: 0, cancellations: 2 });
        await page.evaluate(() => window.__largeTextConsultation.grid.destroy());
    });

    test('destroy removes an open Large Text dialog in readonly and normal modes without committing or restoring stale focus', async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        for (const readOnly of [true, false]) {
            const notes = await installConsultationGrid(page, readOnly);
            await notes.dblclick();
            const dialog = page.locator('.amb-large-text-editor');
            await expect(dialog.locator('textarea')).toBeFocused();
            if (!readOnly) await dialog.locator('textarea').fill('Uncommitted edit');
            await page.evaluate(() => {
                const state = window.__largeTextConsultation;
                state.focusAfterDestroy = 0;
                document.querySelector('#large-text-consultation').addEventListener('focusin', () => {
                    state.focusAfterDestroy += 1;
                });
                state.grid.destroy();
            });
            await expect(dialog).toHaveCount(0);
            await expect(page.locator('#large-text-consultation .tabulator-cell')).toHaveCount(0);
            expect(await page.evaluate(async () => {
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                const state = window.__largeTextConsultation;
                return { edits: state.edits, cancellations: state.cancellations, focusAfterDestroy: state.focusAfterDestroy };
            })).toEqual({ edits: 0, cancellations: 1, focusAfterDestroy: 0 });
        }
        expect(errors).toEqual([]);
    });
});
