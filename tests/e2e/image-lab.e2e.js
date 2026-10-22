import { expect, test } from '@playwright/test';

const assets = ['landscape-01.jpg', 'landscape-02.jpg', 'large-01.jpg', 'large-01-thumb.jpg', 'panorama-01.jpg', 'portrait-01.jpg', 'portrait-02.jpg', 'square-01.jpg'];
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
    const { imageLabTestHarness } = await import('/src/demo/test.js');
    await imageLabTestHarness[action](rows);
}, { action, rows });

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
    await expect(row(page, 7).locator('img')).toHaveAttribute('src', '/test/images/large-01-thumb.jpg');
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
    const captions = ['Orizzontale', 'Verticale', 'Panorama', 'Quadrata', 'Alta risoluzione'];
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
        await programmaticGridAction(page, 'updateRows', [{ id: 14, images: { src: '/test/images/large-01.jpg', alt: 'Gatto ad alta risoluzione', caption } }]);
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
    await page.route('**/test/images/large-01-thumb.jpg', route => route.fulfill({ status: 404, body: '' }));
    await load(page);
    await row(page, 7).locator('img').scrollIntoViewIfNeeded();
    await expect(row(page, 7).locator('img')).toHaveAttribute('src', '/test/images/large-01.jpg');
    await trigger(page, 7).click();
    const image = viewer(page).locator('.viewer-canvas img');
    await expect(image).toHaveAttribute('src', '/test/images/large-01.jpg');
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
    await expect.poll(() => viewer(page).locator('.viewer-list img').evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
    await close(page);
});

test('an unavailable original can display its valid thumbnail', async ({ page }) => {
    await page.route('**/test/images/large-01.jpg', route => route.fulfill({ status: 404, body: '' }));
    await load(page);
    await trigger(page, 7).click();
    const image = viewer(page).locator('.viewer-canvas img');
    await expect(image).toHaveAttribute('src', /\/test\/images\/large-01-thumb\.jpg$/);
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
    const oldThumbnail = await viewer(page).locator('.viewer-list img').elementHandle();
    const originalSource = await oldThumbnail.evaluate(element => element.src);
    await close(page);
    await trigger(page, 3).click();
    await oldThumbnail.evaluate(element => element.dispatchEvent(new Event('error')));
    expect(await oldThumbnail.evaluate(element => element.src)).toBe(originalSource);
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 1 di 5');
    await close(page);
});
