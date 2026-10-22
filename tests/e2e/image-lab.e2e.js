import { expect, test } from '@playwright/test';

const assets = ['landscape-01.jpg', 'landscape-02.jpg', 'large-01.jpg', 'thumb-landscape-01.jpg', 'panorama-01.jpg', 'portrait-01.jpg', 'portrait-02.jpg', 'square-01.jpg'];
const assetSizes = [[1600, 900], [1200, 800], [4000, 2667], [320, 180], [3000, 700], [800, 1200], [700, 1100], [1000, 1000]];
const counts = [1, 1, 5, 3, 2, 1, 1, 0, 0, 0, 1, 2, 1, 1, 1];
const row = (page, id) => page.locator('#image-formatter-test-table .tabulator-row').filter({
    has: page.locator('[tabulator-field="id"]').filter({ hasText: new RegExp(`^${id}$`) })
});
const trigger = (page, id) => row(page, id).locator('button.amb-image--viewable');
const viewer = page => page.getByRole('dialog', { name: 'Raccolta immagini' });
const load = async page => {
    await page.goto('/test/');
    await expect(page.locator('#image-formatter-test-table .tabulator-row')).toHaveCount(15);
    await expect(page.locator('#image-secondary-test-table .tabulator-row')).toHaveCount(2);
    await page.evaluate(() => document.querySelector('.image-lab').addEventListener('click', event => {
        const target = event.target.closest('button.amb-image--viewable');
        if (target) window.__imageLabLastTrigger = target;
    }, true));
};
const expectRestoredFocus = async (page, owner) => {
    expect(await page.evaluate(selector => {
        const original = window.__imageLabLastTrigger;
        return document.activeElement === (original?.isConnected ? original : document.querySelector(selector));
    }, owner)).toBe(true);
};
const close = async page => {
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
};
const programmaticGridAction = (page, action, rows) => page.evaluate(async ({ action, rows }) => {
    // Reuse the module actually mounted by Vite, including its HMR timestamp.
    // Importing a second URL would initialize another pair of grids.
    const source = document.querySelector('script[type="module"][src*="/src/demo/test.js"]').src;
    const { imageLabTestHarness } = await import(source);
    await imageLabTestHarness[action](rows);
}, { action, rows });

const tabUntil = async (page, target, limit = 110) => {
    for (let index = 0; index < limit; index += 1) {
        await page.keyboard.press('Tab');
        if (await target.evaluate(element => element === document.activeElement)) return;
    }
    await expect(target).toBeFocused();
};
const imageCell = (page, id) => row(page, id).locator('[tabulator-field="images"]');
const expectKeyboardFocus = async target => {
    await expect(target).toBeFocused();
    expect(await target.evaluate(element => {
        const style = getComputedStyle(element);
        return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
    })).toBe(true);
};
const enterImageGridWithTab = async page => {
    await load(page);
    await page.goto('/test/#image-lab-recreate');
    await expect(row(page, 1)).toBeAttached();
    await expect(page.locator('#image-lab-recreate')).toBeFocused();
    await tabUntil(page, row(page, 1).locator('.amb-selection-column'));
    await page.keyboard.press('ArrowRight');
    await expect(row(page, 1).locator('[tabulator-field="id"]')).toBeFocused();
};

test.describe('keyboard-only image laboratory', () => {
    test('reaches readonly cells, selects independently and opens the gallery from real keyboard focus', async ({ page }) => {
        await enterImageGridWithTab(page);
        await page.keyboard.press('ArrowLeft');
        await expect(row(page, 1).locator('.amb-selection-column__input')).toBeFocused();
        await page.keyboard.press('Space');
        await expect(row(page, 1)).toHaveClass(/tabulator-selected/);
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await expectKeyboardFocus(row(page, 1).locator('[tabulator-field="description"]'));
        for (const key of ['Enter', 'Space']) {
            await page.keyboard.press(key);
            await expect(viewer(page)).toHaveCount(0);
            await expect(row(page, 1).locator('.tabulator-editing')).toHaveCount(0);
        }
        await page.keyboard.press('Tab');
        await expectKeyboardFocus(trigger(page, 1));
        await page.keyboard.press('ArrowDown');
        await expectKeyboardFocus(trigger(page, 2));
        await page.keyboard.press('ArrowUp');
        await expectKeyboardFocus(trigger(page, 1));
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await expectKeyboardFocus(trigger(page, 3));
        for (const key of ['Enter', 'Space']) {
            await page.keyboard.press(key);
            await expect(viewer(page)).toHaveCount(1);
            await page.keyboard.press('ArrowRight');
            await expect(viewer(page).getByRole('status')).toContainText('Immagine 2 di 5');
            expect(await viewer(page).evaluate(element => element.contains(document.activeElement))).toBe(true);
            await page.keyboard.press('ArrowLeft');
            await expect(viewer(page).getByRole('status')).toContainText('Immagine 1 di 5');
            await close(page);
            await expectKeyboardFocus(trigger(page, 3));
        }
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('Shift+Tab');
        await expect(row(page, 3).locator('[tabulator-field="id"]')).toBeFocused();
        await expect(row(page, 1)).toHaveClass(/tabulator-selected/);
        await expect(page.locator('#image-formatter-test-table .tabulator-selected')).toHaveCount(1);
        await expect(page.locator('#image-secondary-test-table .tabulator-selected')).toHaveCount(0);
        await expect(page.locator('#image-formatter-test-table .tabulator-editing')).toHaveCount(0);
    });

    test('keeps keyboard navigation local to B and releases A focus on recreation', async ({ page }) => {
        await enterImageGridWithTab(page);
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('Space');
        const b = page.locator('#image-secondary-test-table');
        const firstB = b.locator('.tabulator-row').first();
        await tabUntil(page, firstB.locator('.amb-selection-column'));
        await page.keyboard.press('ArrowRight');
        await expect(firstB.locator('[tabulator-field="description"]')).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('Space');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await expectKeyboardFocus(firstB.locator('.amb-image'));
        await page.keyboard.press('Enter');
        await close(page);
        await expect(firstB.locator('.amb-image')).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(b.locator('.tabulator-row').nth(1).locator('.amb-image')).toBeFocused();
        await expect(b.locator('.tabulator-selected')).toHaveCount(1);
        await expect(row(page, 1)).toHaveClass(/tabulator-selected/);

        // Return to the external controls with keyboard navigation only.
        for (let index = 0; index < 110; index += 1) {
            await page.keyboard.press('Shift+Tab');
            if (await page.locator('#image-lab-destroy').evaluate(element => element === document.activeElement)) break;
        }
        await expect(page.locator('#image-lab-destroy')).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.locator('#image-formatter-test-table .tabulator-row')).toHaveCount(0);
        await page.keyboard.press('Tab');
        await expect(page.locator('#image-lab-restore')).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(row(page, 1)).toBeAttached();
        await tabUntil(page, row(page, 1).locator('.amb-selection-column'));
        for (let index = 0; index < 3; index += 1) await page.keyboard.press('ArrowRight');
        await expectKeyboardFocus(trigger(page, 1));
        await page.keyboard.press('Space');
        await close(page);
        await expect(trigger(page, 1)).toBeFocused();
        await expect(page.locator('#image-formatter-test-table .tabulator-selected')).toHaveCount(0);
        await expect(b.locator('.tabulator-selected')).toHaveCount(1);
        await expect(page.locator('.amb-image-viewer-source')).toHaveCount(0);
    });

    test('handles preview-only, passive and invalid image cells without editors or false activation', async ({ page }) => {
        await load(page);
        await page.goto('/test/#image-lab-viewer');
        await expect(row(page, 1)).toBeAttached();
        await expect(page.locator('#image-lab-viewer')).toBeFocused();
        await page.keyboard.press('Space');
        await expect(page.locator('#image-lab-viewer')).not.toBeChecked();
        await tabUntil(page, row(page, 1).locator('.amb-selection-column'));
        for (let index = 0; index < 3; index += 1) await page.keyboard.press('ArrowRight');
        const preview = row(page, 1).locator('.amb-image--previewable');
        await expectKeyboardFocus(preview);
        await expect(page.locator('.amb-image-preview')).toHaveCount(1);
        for (const key of ['Enter', 'Space']) {
            await page.keyboard.press(key);
            await expect(viewer(page)).toHaveCount(0);
        }
        for (let id = 2; id <= 10; id += 1) {
            await page.keyboard.press('ArrowDown');
            await expect(id < 8 ? row(page, id).locator('.amb-image') : imageCell(page, id)).toBeFocused();
        }
        for (const key of ['Enter', 'Space']) await page.keyboard.press(key);
        await expect(viewer(page)).toHaveCount(0);
        await expect(imageCell(page, 10).locator('button, [tabindex]')).toHaveCount(0);
        await expect(page.locator('#image-formatter-test-table .tabulator-editing')).toHaveCount(0);

        for (let index = 0; index < 110; index += 1) {
            await page.keyboard.press('Shift+Tab');
            if (await page.locator('#image-lab-preview').evaluate(element => element === document.activeElement)) break;
        }
        await expect(page.locator('#image-lab-preview')).toBeFocused();
        await page.keyboard.press('Space');
        await tabUntil(page, row(page, 1).locator('.amb-selection-column'));
        for (let index = 0; index < 3; index += 1) await page.keyboard.press('ArrowRight');
        await expectKeyboardFocus(imageCell(page, 1));
        await expect(imageCell(page, 1).locator('button, [tabindex]')).toHaveCount(0);
        for (const key of ['Enter', 'Space']) await page.keyboard.press(key);
        await expect(viewer(page)).toHaveCount(0);
        await expect(page.locator('.amb-image-preview')).toHaveCount(0);
    });

    test('reveals and outlines the active thumbnail while scrolling horizontally on mobile', async ({ page }, testInfo) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await enterImageGridWithTab(page);
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await expectKeyboardFocus(trigger(page, 1));
        await expect.poll(() => trigger(page, 1).evaluate(element => {
            const box = element.getBoundingClientRect();
            const holder = element.closest('.tabulator').querySelector('.tabulator-tableholder').getBoundingClientRect();
            return box.left >= holder.left && box.right <= holder.right
                && box.left >= 0 && box.right <= innerWidth;
        })).toBe(true);
        await page.keyboard.press('ArrowDown');
        await expectKeyboardFocus(trigger(page, 2));
        await page.screenshot({ path: testInfo.outputPath('keyboard-mobile.png') });
        await page.keyboard.press('Enter');
        await close(page);
        await expectKeyboardFocus(trigger(page, 2));
    });
});

test('photographs, fixture counts and other technical grids render correctly', async ({ page, request }, testInfo) => {
    await load(page);
    for (const [index, name] of assets.entries()) {
        const response = await request.get(`/test/images/${name}`);
        expect(response.status()).toBe(200);
        expect(await page.evaluate(src => new Promise(resolve => {
            const image = new Image();
            image.onload = () => resolve([image.naturalWidth, image.naturalHeight]);
            image.onerror = () => resolve(false);
            image.src = src;
        }), `/test/images/${name}`)).toEqual(assetSizes[index]);
    }
    for (let id = 1; id <= counts.length; id += 1) {
        await expect(row(page, id).locator('[tabulator-field="imageCount"]')).toHaveText(String(counts[id - 1]));
        await expect(trigger(page, id)).toHaveCount(counts[id - 1] ? 1 : 0);
        if (counts[id - 1] > 1) await expect(row(page, id).locator('.amb-image-count')).toHaveText(`+${counts[id - 1] - 1}`);
        else await expect(row(page, id).locator('.amb-image-count')).toHaveCount(0);
        if (counts[id - 1] && id !== 11) {
            await row(page, id).locator('img').scrollIntoViewIfNeeded();
            await expect.poll(() => row(page, id).locator('img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
        }
    }
    for (const id of [8, 9, 10]) {
        await expect(row(page, id).locator('.amb-image-placeholder')).toHaveText('Nessuna immagine');
        await row(page, id).locator('.amb-image').click();
        await expect(viewer(page)).toHaveCount(0);
    }
    expect(await page.evaluate(() => window.__imageLabUnsafe)).toBeUndefined();
    for (const selector of ['#inventory-test-table', '#multifield-lookup-test-table', '#autocomplete-test-table', '#column-calculations-test-table']) {
        await expect(page.locator(`${selector} .tabulator-row`).first()).toBeAttached();
    }
    await page.locator('.image-lab').screenshot({ path: testInfo.outputPath('image-lab-desktop.png') });
});

test('single and gallery keyboard flow, metadata, navigation and distinct thumbnail', async ({ page }) => {
    await load(page);
    await trigger(page, 1).scrollIntoViewIfNeeded();
    await expect.poll(() => trigger(page, 1).evaluate(async element => {
        element.focus();
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        return element.isConnected && document.activeElement === element;
    })).toBe(true);
    await page.keyboard.press('Enter');
    await expect(viewer(page).getByRole('status')).toHaveText('Immagine 1 di 1');
    await close(page);
    await expectRestoredFocus(page, '#image-formatter-test-table');
    await trigger(page, 1).press('Space');
    await expect(viewer(page)).toHaveCount(1);
    await close(page);
    await trigger(page, 3).click();
    await expect(viewer(page).locator('.viewer-list li')).toHaveCount(5);
    for (let index = 0; index < 4; index += 1) await page.keyboard.press('ArrowRight');
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 5 di 5');
    await expect(viewer(page).getByLabel('Successiva', { exact: true })).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 5 di 5');
    await page.keyboard.press('ArrowLeft');
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 4 di 5');
    await viewer(page).getByRole('button', { name: 'Immagine 1 di 5', exact: true }).click();
    await expect(viewer(page).getByLabel('Precedente', { exact: true })).toHaveAttribute('aria-disabled', 'true');
    await close(page);
    await expect(row(page, 7).locator('img')).toHaveAttribute('src', '/test/images/thumb-landscape-01.jpg');
    await trigger(page, 7).click();
    await expect(viewer(page).locator('.viewer-canvas img')).toHaveAttribute('src', '/test/images/landscape-01.jpg');
    await close(page);
    await trigger(page, 2).click();
    await expect(viewer(page).getByRole('status')).toContainText('Girasoli · 1200 × 800');
    await expect(viewer(page).locator('.viewer-canvas img')).toHaveAttribute('alt', 'Campo di girasoli e paesaggio rurale');
    await close(page);
    for (const [id, count] of [[12, 2], [13, 1], [15, 1]]) {
        await trigger(page, id).click();
        await expect(viewer(page).locator('.viewer-list li')).toHaveCount(count);
        if (id === 13) {
            await expect(row(page, id).locator('img')).toHaveAttribute('alt', '');
            await expect(viewer(page).locator('.viewer-canvas img')).toHaveAttribute('alt', 'portrait-01.jpg');
        }
        await close(page);
    }
});

test('photograph orientations fit and high resolution supports zoom, pan and reset', async ({ page }, testInfo) => {
    await load(page);
    const image = () => viewer(page).locator('.viewer-canvas img');
    for (const [id, count] of [[4, 3], [5, 2]]) {
        await trigger(page, id).click();
        for (let index = 0; index < count; index += 1) {
            await expect.poll(() => image().evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
            const bounds = await image().boundingBox();
            expect(bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
            expect(bounds.height).toBeLessThanOrEqual(page.viewportSize().height);
            expect(bounds.x).toBeGreaterThanOrEqual(0);
            expect(bounds.y).toBeGreaterThanOrEqual(0);
            if (index < count - 1) await viewer(page).getByLabel('Successiva', { exact: true }).click();
        }
        await close(page);
    }
    await trigger(page, 6).click();
    await expect.poll(() => image().evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
    const initial = await image().boundingBox();
    await viewer(page).getByLabel('Ingrandisci', { exact: true }).click();
    await viewer(page).getByLabel('Ingrandisci', { exact: true }).click();
    const zoomed = await image().boundingBox();
    expect(zoomed.width).toBeGreaterThan(initial.width);
    await image().hover();
    await page.mouse.wheel(0, -300);
    await expect.poll(async () => (await image().boundingBox()).width).toBeGreaterThan(zoomed.width);
    for (let step = 0; step < 8 && (await image().boundingBox()).width <= page.viewportSize().width; step += 1) {
        await viewer(page).getByLabel('Ingrandisci', { exact: true }).click();
    }
    expect((await image().boundingBox()).width).toBeGreaterThan(page.viewportSize().width);
    await page.mouse.move(500, 300);
    const beforePan = await image().boundingBox();
    await page.mouse.down();
    await page.mouse.move(620, 380, { steps: 8 });
    await page.mouse.up();
    const afterPan = await image().boundingBox();
    expect(afterPan.x).not.toBe(beforePan.x);
    expect(afterPan.x + afterPan.width).toBeGreaterThan(0);
    await viewer(page).getByLabel('Riduci', { exact: true }).click();
    expect((await image().boundingBox()).width).toBeLessThan(afterPan.width);
    await viewer(page).getByLabel('Fit / Reset', { exact: true }).click();
    await expect.poll(async () => (await image().boundingBox()).width).toBeCloseTo(initial.width, 0);
    await page.screenshot({ path: testInfo.outputPath('image-lab-desktop-viewer.png') });
    await close(page);
});

test('special metadata stays text and missing original closes without unhandled errors', async ({ page, request }) => {
    const errors = [];
    const missingResponses = [];
    page.on('response', response => { if (response.url().includes('intentionally-missing')) missingResponses.push(response.status()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/test/images/intentionally-missing.jpg', route => route.continue({
        headers: { ...route.request().headers(), accept: 'image/jpeg' }
    }));
    await load(page);
    await trigger(page, 14).click();
    await expect(viewer(page).getByRole('status')).toContainText('<script>window.__imageLabUnsafe=true</script>');
    await expect(viewer(page).locator('.viewer-canvas img')).toHaveAttribute('alt', 'Mercato <img src=x onerror="window.__imageLabUnsafe=true"> & "frutta"');
    await expect(viewer(page).locator('script, [onerror]')).toHaveCount(0);
    expect(await page.evaluate(() => window.__imageLabUnsafe)).toBeUndefined();
    await close(page);
    expect((await request.get('/test/images/intentionally-missing.jpg', { headers: { Accept: 'image/jpeg' } })).status()).toBe(404);
    await expect(row(page, 11).locator('.amb-image-placeholder')).toHaveText('Immagine non disponibile');
    await trigger(page, 11).click();
    await expect(viewer(page).getByRole('status')).toContainText('originale non disponibile');
    await close(page);
    await expectRestoredFocus(page, '#image-formatter-test-table');
    expect(missingResponses).toContain(404);
    expect(errors).toEqual([]);
});

test('preview and viewer switches are independent and preserve original data', async ({ page }) => {
    await load(page);
    await page.clock.install();
    await page.getByLabel('Preview enabled', { exact: true }).uncheck();
    await expect(page.getByRole('status').filter({ hasText: 'Griglia A creata' })).toContainText('Preview disattiva');
    await trigger(page, 1).hover();
    await page.clock.runFor(1000);
    await expect(page.locator('.amb-image-preview')).toHaveCount(0);
    await trigger(page, 1).click();
    await expect(viewer(page)).toHaveCount(1);
    await close(page);
    await page.getByLabel('Preview enabled', { exact: true }).check();
    await page.getByLabel('Viewer enabled', { exact: true }).uncheck();
    const image = row(page, 1).locator('.amb-image');
    await image.hover();
    await page.clock.runFor(1000);
    await expect(page.locator('.amb-image-preview')).toHaveCount(1);
    await image.click();
    await expect(viewer(page)).toHaveCount(0);
    await page.getByLabel('Viewer enabled', { exact: true }).check();
    await expect(trigger(page, 1)).toHaveCount(1);
    await expect(page.locator('#image-formatter-test-table .tabulator-row')).toHaveCount(15);
});

test('data update, reset, destroy, restore and recreate clean up only grid A', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await load(page);
    const otherRows = await page.locator('#column-calculations-test-table .tabulator-row').count();
    await trigger(page, 1).click();
    await programmaticGridAction(page, 'update');
    await expect(page.locator('#image-lab-status')).toContainText('Riga 01 aggiornata');
    await expect(row(page, 1).locator('img')).toHaveAttribute('src', '/test/images/panorama-01.jpg');
    await expect(viewer(page)).toHaveCount(1);
    await close(page);
    await expect(page.locator('#image-formatter-test-table')).toBeFocused();
    await page.getByRole('button', { name: 'Restore original data', exact: true }).click();
    await expect(row(page, 1).locator('img')).toHaveAttribute('src', '/test/images/landscape-01.jpg');
    await expect(page.locator('#image-lab-status')).toContainText('Fixture originali ripristinate');
    await trigger(page, 3).click();
    await programmaticGridAction(page, 'destroy');
    await expect(viewer(page)).toHaveCount(0);
    await expect(page.locator('.amb-image-viewer-source, .amb-image-preview')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Update data', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Restore grid A', exact: true }).click();
    await expect(trigger(page, 1)).toHaveCount(1);
    await trigger(page, 1).click();
    await programmaticGridAction(page, 'recreate');
    await expect(viewer(page)).toHaveCount(0);
    await expect(page.locator('#image-formatter-test-table .tabulator-row')).toHaveCount(15);
    await trigger(page, 1).click();
    await expect(viewer(page)).toHaveCount(1);
    await close(page);
    await expect(page.locator('#column-calculations-test-table .tabulator-row')).toHaveCount(otherRows);
    expect(errors).toEqual([]);
});

test('grid B keeps its viewer and focus when grid A is destroyed', async ({ page }) => {
    await load(page);
    const secondary = page.locator('#image-secondary-test-table .tabulator-row').nth(1).locator('button.amb-image--viewable');
    await trigger(page, 1).click();
    await close(page);
    await secondary.click();
    await expect(viewer(page).locator('.viewer-list li')).toHaveCount(2);
    await programmaticGridAction(page, 'destroy');
    await expect(viewer(page)).toHaveCount(1);
    await page.keyboard.press('ArrowRight');
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 2 di 2');
    await close(page);
    await expectRestoredFocus(page, '#image-secondary-test-table');
    await page.getByRole('button', { name: 'Restore grid A', exact: true }).click();
    await secondary.click();
    await expect(viewer(page)).toHaveCount(1);
    await close(page);
});

test('mobile viewport keeps lab controls and viewer usable', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await load(page);
    await page.locator('.image-lab-controls').scrollIntoViewIfNeeded();
    for (const control of await page.locator('.image-lab-controls button, .image-lab-controls label').all()) {
        const bounds = await control.boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
    }
    await page.screenshot({ path: testInfo.outputPath('image-lab-mobile.png') });
    await trigger(page, 3).click();
    await expect(viewer(page)).toBeVisible();
    const toolbar = await viewer(page).locator('.viewer-toolbar').boundingBox();
    expect(toolbar.x).toBeGreaterThanOrEqual(0);
    expect(toolbar.x + toolbar.width).toBeLessThanOrEqual(390);
    await page.screenshot({ path: testInfo.outputPath('image-lab-mobile-viewer.png') });
    await close(page);
    await expectRestoredFocus(page, '#image-formatter-test-table');
});

test('zoom tooltip allows central and uncovered pan after zoom, wheel and reopen', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await load(page);
    const image = () => viewer(page).locator('.viewer-canvas img');
    const zoom = () => viewer(page).getByLabel('Ingrandisci', { exact: true }).click();
    const drag = async (x, y, dx, dy) => {
        const before = await image().boundingBox();
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + dx, y + dy, { steps: 8 });
        await page.mouse.up();
        const after = await image().boundingBox();
        return { before, after, moved: Math.hypot(after.x - before.x, after.y - before.y) };
    };
    const expectBounded = async () => {
        const box = await image().boundingBox();
        expect(box.x).toBeLessThanOrEqual(0.5);
        expect(box.y).toBeLessThanOrEqual(0.5);
        expect(box.x + box.width).toBeGreaterThanOrEqual(1439.5);
        expect(box.y + box.height).toBeGreaterThanOrEqual(899.5);
    };
    for (let session = 0; session < 2; session += 1) {
        await trigger(page, 6).click();
        await expect.poll(() => image().evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
        const fit = await image().boundingBox();
        for (let step = 0; step < 14 && (await image().boundingBox()).width < 2160; step += 1) await zoom();
        expect((await image().boundingBox()).width).toBeGreaterThan(2160);
        await zoom();
        const tooltip = viewer(page).locator('.viewer-tooltip');
        await expect(tooltip).toBeVisible();
        const hit = await page.evaluate(() => document.elementsFromPoint(720, 450).slice(0, 4).map(element => ({
            tag: element.tagName, classes: element.className,
            pointerEvents: getComputedStyle(element).pointerEvents,
            zIndex: getComputedStyle(element).zIndex
        })));
        await viewer(page).evaluate(element => {
            window.__imageLabPanTargets = [];
            element.addEventListener('pointerdown', event => window.__imageLabPanTargets.push(event.target.className), true);
        });
        const central = await drag(720, 450, 80, 50);
        const uncovered = await drag(550, 330, 80, 50);
        await testInfo.attach(`pan-hit-testing-${session}`, {
            body: JSON.stringify({ session, hit, central, uncovered,
                tooltip: await tooltip.evaluate(element => ({ pointerEvents: getComputedStyle(element).pointerEvents, zIndex: getComputedStyle(element).zIndex })),
                targets: await page.evaluate(() => window.__imageLabPanTargets) }),
            contentType: 'application/json'
        });
        await page.screenshot({ path: testInfo.outputPath(`central-pan-${session}.png`) });
        expect(uncovered.moved).toBeGreaterThan(20);
        expect(central.moved).toBeGreaterThan(20);
        expect(hit[0].tag).toBe('IMG');
        await expectBounded();
        for (let step = 0; step < 2; step += 1) {
            await zoom();
            expect((await drag(720, 450, -80, -50)).moved).toBeGreaterThan(20);
            await expectBounded();
        }
        const beforeWheel = await image().boundingBox();
        await page.mouse.move(720, 450);
        await page.mouse.wheel(0, -250);
        await expect.poll(async () => (await image().boundingBox()).width).toBeGreaterThan(beforeWheel.width);
        expect((await drag(720, 450, 100, 60)).moved).toBeGreaterThan(20);
        await drag(720, 450, 719, 449);
        await expectBounded();
        await drag(720, 450, -719, -449);
        await expectBounded();
        await viewer(page).getByLabel('Fit / Reset', { exact: true }).click();
        const reset = await image().boundingBox();
        for (const key of ['x', 'y', 'width', 'height']) expect(reset[key]).toBeCloseTo(fit[key], 0);
        await close(page);
        await expect(page.locator('.amb-image-viewer-source')).toHaveCount(0);
    }
});

test('real gallery resets zoom and position between all five photograph formats', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await load(page);
    await trigger(page, 3).click();
    const image = () => viewer(page).locator('.viewer-canvas img');
    const captions = ['Lago alpino', 'Tucano', 'Panorama urbano', 'Oggetti da viaggio', 'Mercato all’aperto'];
    const expectFit = async index => {
        await expect(viewer(page).getByRole('status')).toContainText(`Immagine ${index + 1} di 5`);
        await expect(viewer(page).getByRole('status')).toContainText(captions[index]);
        await expect(viewer(page).getByRole('button', { name: `Immagine ${index + 1} di 5`, exact: true })).toHaveAttribute('aria-current', 'true');
        await expect.poll(() => image().evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
        const box = await image().boundingBox();
        const ratio = await image().evaluate(element => element.naturalWidth / element.naturalHeight);
        expect(box.width / box.height).toBeCloseTo(ratio, 2);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(1440);
        expect(box.y + box.height).toBeLessThanOrEqual(900);
        return box;
    };
    for (let index = 0; index < 5; index += 1) {
        const fit = await expectFit(index);
        await viewer(page).getByLabel('Ingrandisci', { exact: true }).click();
        expect((await image().boundingBox()).width).toBeGreaterThan(fit.width);
        if (index < 4) await page.keyboard.press('ArrowRight');
    }
    await expect(viewer(page).getByLabel('Successiva', { exact: true })).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 5 di 5');
    await page.keyboard.press('ArrowLeft');
    await expectFit(3);
    await close(page);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    test(`viewer controls and long caption remain usable at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
        await page.setViewportSize(viewport);
        await load(page);
        const caption = 'Fotografia ad alta risoluzione: verificare dettagli, proporzioni e leggibilità senza sovrapposizioni ai comandi. '.repeat(2)
            + 'Riferimento: ' + 'ABCDEFGHIJ'.repeat(8);
        await programmaticGridAction(page, 'updateRows', [{ id: 14, images: { src: '/test/images/large-01.jpg', alt: 'Mercato all’aperto', caption } }]);
        await trigger(page, 14).click();
        await expect(viewer(page).getByRole('status')).toContainText(caption);
        await expect(viewer(page).getByLabel('Chiudi immagini', { exact: true })).toBeFocused();
        await page.keyboard.press('Tab');
        expect(await viewer(page).evaluate(element => element.contains(document.activeElement))).toBe(true);
        await page.keyboard.press('Shift+Tab');
        await page.screenshot({ path: testInfo.outputPath(`long-caption-${viewport.width}x${viewport.height}.png`) });
        const statusBox = await viewer(page).getByRole('status').boundingBox();
        expect(statusBox.x + statusBox.width).toBeLessThanOrEqual(viewport.width - 40);
        expect(await viewer(page).getByRole('status').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
        const controls = await viewer(page).locator('.viewer-toolbar [role="button"]').all();
        for (const control of controls) {
            const box = await control.boundingBox();
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.y).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
            expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
            expect(await control.evaluate(element => {
                const box = element.getBoundingClientRect();
                return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
            })).toBe(true);
        }
        await close(page);
        await expectRestoredFocus(page, '#image-formatter-test-table');
        await trigger(page, 3).click();
        await expect(viewer(page).locator('.viewer-list li')).toHaveCount(5);
        await viewer(page).getByRole('button', { name: 'Immagine 2 di 5', exact: true }).click();
        await expect(viewer(page).getByRole('status')).toContainText('Immagine 2 di 5');
        await page.screenshot({ path: testInfo.outputPath(`gallery-${viewport.width}x${viewport.height}.png`) });
        await viewer(page).getByLabel('Chiudi immagini', { exact: true }).click();
        await expect(viewer(page)).toHaveCount(0);
        await expect(page.locator('.amb-image-viewer-source')).toHaveCount(0);
    });
}

test('an unavailable thumbnail falls back to its original photograph', async ({ page }) => {
    await page.route('**/test/images/thumb-landscape-01.jpg', route => route.fulfill({ status: 404, body: '' }));
    await load(page);
    await row(page, 7).locator('img').scrollIntoViewIfNeeded();
    await expect(row(page, 7).locator('img')).toHaveAttribute('src', '/test/images/landscape-01.jpg');
    await trigger(page, 7).click();
    const image = viewer(page).locator('.viewer-canvas img');
    await expect(image).toHaveAttribute('src', '/test/images/landscape-01.jpg');
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
    await expect.poll(() => viewer(page).locator('.viewer-list img').evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
    await close(page);
});

test('an unavailable original can display its valid thumbnail', async ({ page }) => {
    await page.route('**/test/images/landscape-01.jpg', route => route.fulfill({ status: 404, body: '' }));
    await load(page);
    await trigger(page, 7).click();
    const image = viewer(page).locator('.viewer-canvas img');
    await expect(image).toHaveAttribute('src', /\/test\/images\/thumb-landscape-01\.jpg$/);
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
    const oldThumbnail = await viewer(page).locator('.viewer-list img').elementHandle();
    const originalSource = await oldThumbnail.evaluate(element => element.src);
    await close(page);
    await page.unroute('**/test/images/landscape-01.jpg');
    await trigger(page, 3).click();
    await oldThumbnail.evaluate(element => element.dispatchEvent(new Event('error')));
    expect(await oldThumbnail.evaluate(element => element.src)).toBe(originalSource);
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 1 di 5');
    await close(page);
});

test.describe('image grid selection', () => {
    const primary = page => page.locator('#image-formatter-test-table');
    const secondary = page => page.locator('#image-secondary-test-table');
    const secondaryRow = (page, index) => secondary(page).locator('.tabulator-row').nth(index);
    const checkbox = targetRow => targetRow.locator('.amb-selection-column__input');
    const selectAll = grid => grid.locator('.tabulator-header input[type="checkbox"]');
    const selectedRows = grid => grid.locator('.tabulator-row.tabulator-selected');
    const expectSelection = async (targetRow, selected) => {
        await expect(checkbox(targetRow)).toBeChecked({ checked: selected });
        if (selected) await expect(targetRow).toHaveClass(/tabulator-selected/);
        else await expect(targetRow).not.toHaveClass(/tabulator-selected/);
    };

    test('checkbox and image activation keep selection, viewer and keyboard independent', async ({ page }) => {
        await load(page);
        await expect(primary(page).locator('.tabulator-row .amb-selection-column__input')).toHaveCount(15);
        await expect(secondary(page).locator('.tabulator-row .amb-selection-column__input')).toHaveCount(2);
        await expect(selectAll(primary(page))).toHaveCount(1);
        await expect(selectAll(secondary(page))).toHaveCount(1);
        await checkbox(row(page, 1)).click();
        await expectSelection(row(page, 1), true);
        await checkbox(row(page, 2)).click();
        await expect(selectedRows(primary(page))).toHaveCount(2);
        await checkbox(row(page, 1)).click();
        await expectSelection(row(page, 1), false);
        await expect(viewer(page)).toHaveCount(0);

        await trigger(page, 1).click();
        await expect(viewer(page)).toHaveCount(1);
        await close(page);
        await expectRestoredFocus(page, '#image-formatter-test-table');
        await expectSelection(row(page, 1), false);
        await expectSelection(row(page, 2), true);
        await checkbox(row(page, 1)).press('Space');
        await expectSelection(row(page, 1), true);
        await checkbox(row(page, 1)).press('Space');
        await expectSelection(row(page, 1), false);
        await expect(viewer(page)).toHaveCount(0);
        for (const key of ['Enter', 'Space']) {
            await trigger(page, 2).press(key);
            await expect(viewer(page)).toHaveCount(1);
            await close(page);
            await expectRestoredFocus(page, '#image-formatter-test-table');
            await expectSelection(row(page, 2), true);
        }
        await checkbox(row(page, 2)).click();
        await expectSelection(row(page, 2), false);
    });

    test('Tab navigation from a selection checkbox does not change selection', async ({ page }) => {
        await enterImageGridWithTab(page);
        await page.keyboard.press('ArrowLeft');
        await expect(checkbox(row(page, 1))).toBeFocused();
        for (const [key, destination] of [
            ['Tab', row(page, 1).locator('[tabulator-field="id"]')],
            ['Shift+Tab', page.locator('#image-lab-update')]
        ]) {
            await page.keyboard.press(key);
            await expect(destination).toBeFocused();
            await expect(selectedRows(primary(page))).toHaveCount(0);
            await expect(viewer(page)).toHaveCount(0);
        }
    });

    test('select-all and multiple selections remain isolated between A and B', async ({ page }) => {
        await load(page);
        await checkbox(row(page, 1)).check();
        await checkbox(row(page, 2)).check();
        await checkbox(secondaryRow(page, 0)).check();
        await expect(selectedRows(primary(page))).toHaveCount(2);
        await expect(selectedRows(secondary(page))).toHaveCount(1);
        // The existing header action clears a partial selection before selecting all.
        await selectAll(primary(page)).click();
        await expect(selectedRows(primary(page))).toHaveCount(0);
        await selectAll(primary(page)).check();
        await expect(selectedRows(primary(page))).toHaveCount(15);
        await expect(selectedRows(secondary(page))).toHaveCount(1);
        await selectAll(secondary(page)).click();
        await expect(selectedRows(secondary(page))).toHaveCount(0);
        await selectAll(secondary(page)).check();
        await expect(selectedRows(secondary(page))).toHaveCount(2);
        await expect(selectedRows(primary(page))).toHaveCount(15);
        await selectAll(primary(page)).uncheck();
        await expect(selectedRows(primary(page))).toHaveCount(0);
        await expect(selectedRows(secondary(page))).toHaveCount(2);
        await selectAll(secondary(page)).uncheck();
        await expect(selectedRows(secondary(page))).toHaveCount(0);
        await expect(viewer(page)).toHaveCount(0);
    });

    test('selection lifecycle follows updates, data replacement and image grid remounts', async ({ page }) => {
        await load(page);
        await checkbox(row(page, 1)).check();
        await checkbox(secondaryRow(page, 0)).check();
        await page.getByRole('button', { name: 'Update data', exact: true }).click();
        await expect(page.locator('#image-lab-status')).toContainText('Riga 01 aggiornata');
        await expectSelection(row(page, 1), true);
        await page.getByRole('button', { name: 'Restore original data', exact: true }).click();
        await expect(page.locator('#image-lab-status')).toContainText('Fixture originali ripristinate');
        await expect(selectedRows(primary(page))).toHaveCount(0);
        await expectSelection(secondaryRow(page, 0), true);
        for (const name of ['Preview enabled', 'Viewer enabled']) {
            await checkbox(row(page, 1)).check();
            await page.getByLabel(name, { exact: true }).uncheck();
            await expect(selectedRows(primary(page))).toHaveCount(0);
            await expectSelection(secondaryRow(page, 0), true);
            await page.getByLabel(name, { exact: true }).check();
            await expect(primary(page).locator('.tabulator-row .amb-selection-column__input')).toHaveCount(15);
        }
        await checkbox(row(page, 1)).check();
        await checkbox(row(page, 2)).check();
        const oldSelection = await checkbox(row(page, 1)).elementHandle();
        await page.getByRole('button', { name: 'Destroy grid A', exact: true }).click();
        await expect(primary(page).locator('.tabulator-row')).toHaveCount(0);
        expect(await oldSelection.evaluate(element => element.isConnected)).toBe(false);
        await expectSelection(secondaryRow(page, 0), true);
        await secondaryRow(page, 0).locator('button.amb-image--viewable').click();
        await expect(viewer(page)).toHaveCount(1);
        await close(page);
        await expectSelection(secondaryRow(page, 0), true);
        await page.getByRole('button', { name: 'Restore grid A', exact: true }).click();
        await expect(primary(page).locator('.tabulator-row .amb-selection-column__input')).toHaveCount(15);
        await expect(selectedRows(primary(page))).toHaveCount(0);
        await expect(selectAll(primary(page))).not.toBeChecked();
        await checkbox(row(page, 1)).check();
        await page.getByRole('button', { name: 'Recreate grid A', exact: true }).click();
        await expect(selectedRows(primary(page))).toHaveCount(0);
        await expect(primary(page).locator('.tabulator-row .amb-selection-column__input')).toHaveCount(15);
        await expectSelection(secondaryRow(page, 0), true);
    });

    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
        test(`selection layout and photographs remain usable at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
            await page.setViewportSize(viewport);
            await load(page);
            await checkbox(row(page, 1)).check();
            await expectSelection(row(page, 1), true);
            await checkbox(row(page, 1)).scrollIntoViewIfNeeded();
            const inputBox = await checkbox(row(page, 1)).boundingBox();
            expect(inputBox.x).toBeGreaterThanOrEqual(0);
            expect(inputBox.x + inputBox.width).toBeLessThanOrEqual(viewport.width);
            await trigger(page, 1).click();
            await expect(viewer(page)).toHaveCount(1);
            await close(page);
            await expectSelection(row(page, 1), true);
            await checkbox(secondaryRow(page, 0)).check();
            await expectSelection(secondaryRow(page, 0), true);
            await secondaryRow(page, 0).locator('button.amb-image--viewable').click();
            await expect(viewer(page)).toHaveCount(1);
            await close(page);
            await expectSelection(secondaryRow(page, 0), true);
            await checkbox(secondaryRow(page, 0)).focus();
            await page.mouse.move(0, 0);
            await secondary(page).screenshot({ path: testInfo.outputPath(`selection-b-${viewport.width}.png`) });
            await checkbox(row(page, 1)).focus();
            await primary(page).screenshot({ path: testInfo.outputPath(`selection-a-${viewport.width}.png`) });
        });
    }
});
