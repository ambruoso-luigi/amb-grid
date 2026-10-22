import { expect, test } from '@playwright/test';

const assets = ['landscape-01.jpg', 'landscape-02.jpg', 'large-01.jpg', 'panorama-01.jpg', 'portrait-01.jpg', 'portrait-02.jpg', 'square-01.jpg'];
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

test('photographs, fixture counts and other technical grids render correctly', async ({ page, request }, testInfo) => {
    await load(page);
    for (const name of assets) {
        const response = await request.get(`/test/images/${name}`);
        expect(response.status()).toBe(200);
        expect(await page.evaluate(src => new Promise(resolve => {
            const image = new Image();
            image.onload = () => resolve(image.naturalWidth > 0 && image.naturalHeight > 0);
            image.onerror = () => resolve(false);
            image.src = src;
        }), `/test/images/${name}`)).toBe(true);
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
    await expect(row(page, 7).locator('img')).toHaveAttribute('src', '/test/images/portrait-02.jpg');
    await trigger(page, 7).click();
    await expect(viewer(page).locator('.viewer-canvas img')).toHaveAttribute('src', '/test/images/large-01.jpg');
    await close(page);
    await trigger(page, 2).click();
    await expect(viewer(page).getByRole('status')).toContainText('Orizzontale · 1200 × 800');
    await expect(viewer(page).locator('.viewer-canvas img')).toHaveAttribute('alt', 'Tazza di caffè su un tavolo');
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
    await expect(viewer(page).locator('.viewer-canvas img')).toHaveAttribute('alt', 'Gatto <img src=x onerror="window.__imageLabUnsafe=true"> & "occhi"');
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
    await page.locator('#image-lab-update').evaluate(button => button.click());
    await expect(page.locator('#image-lab-status')).toContainText('Riga 01 aggiornata');
    await expect(row(page, 1).locator('img')).toHaveAttribute('src', '/test/images/panorama-01.jpg');
    await expect(viewer(page)).toHaveCount(1);
    await close(page);
    await expect(page.locator('#image-formatter-test-table')).toBeFocused();
    await page.getByRole('button', { name: 'Restore original data', exact: true }).click();
    await expect(row(page, 1).locator('img')).toHaveAttribute('src', '/test/images/landscape-01.jpg');
    await expect(page.locator('#image-lab-status')).toContainText('Fixture originali ripristinate');
    await trigger(page, 3).click();
    await page.locator('#image-lab-destroy').evaluate(button => button.click());
    await expect(viewer(page)).toHaveCount(0);
    await expect(page.locator('.amb-image-viewer-source, .amb-image-preview')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Update data', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Restore grid A', exact: true }).click();
    await expect(trigger(page, 1)).toHaveCount(1);
    await trigger(page, 1).click();
    await page.locator('#image-lab-recreate').evaluate(button => button.click());
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
    await page.locator('#image-lab-destroy').evaluate(button => button.click());
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
