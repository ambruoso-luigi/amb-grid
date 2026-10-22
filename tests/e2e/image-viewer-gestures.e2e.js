import { expect, test } from '@playwright/test';

const viewer = page => page.locator('.viewer-container');
const install = async page => {
    await page.route('**/__img05__/**', route => {
        const portrait = route.request().url().includes('portrait');
        const width = portrait ? 600 : 1600;
        const height = portrait ? 1200 : 900;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#dce8f2"/><path d="M0 ${height}L${width / 2} 0L${width} ${height}" fill="#557a9b"/></svg>`;
        return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg });
    });
    await page.goto('/test/');
    await page.evaluate(async () => {
        const { AMB } = await import('/src/index.js');
        const host = document.createElement('div');
        host.id = 'img05-grid';
        document.body.append(host);
        const image = name => ({ src: `/__img05__/${name}.svg`, alt: name, caption: name });
        window.__img05 = AMB.table({
            selector: '#img05-grid',
            data: [{ id: 1, images: [image('landscape-1'), image('portrait-2'), image('landscape-3')] }],
            columns: [{ title: 'Images', field: 'images', formatter: AMB.formatters.image({ preview: false }) }]
        });
    });
    await page.locator('#img05-grid button.amb-image--viewable').click();
    await expect(viewer(page)).toHaveCount(1);
    await expect(viewer(page).locator('.viewer-canvas img')).toHaveCount(1);
};

const state = page => page.evaluate(() => {
    const active = document.querySelector('.amb-image-viewer-source').viewer;
    return { index: active.index, image: { ...active.imageData }, initial: { ...active.initialImageData }, viewport: { ...active.viewerData } };
});

const expectBounded = current => {
    for (const [position, size, extent] of [['x', 'width', 'width'], ['y', 'height', 'height']]) {
        if (current.image[size] <= current.viewport[extent]) {
            expect(current.image[position]).toBeCloseTo(
                current.initial[position] + (current.initial[size] - current.image[size]) / 2,
                1
            );
        } else {
            expect(current.image[position]).toBeLessThanOrEqual(0.5);
            expect(current.image[position] + current.image[size]).toBeGreaterThanOrEqual(current.viewport[extent] - 0.5);
        }
    }
};

const swipe = async (cdp, distance) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 1000, y: 350, id: 0 }] });
    for (let offset = 40; offset <= Math.abs(distance); offset += 40) {
        await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: 1000 + Math.sign(distance) * offset, y: 350, id: 0 }]
        });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};

test('zoom, reset and bounded pan keep landscape and portrait reachable', async ({ page }) => {
    await install(page);
    const initial = await state(page);
    await viewer(page).locator('.viewer-toolbar [data-viewer-action="zoom-in"]').click();
    const zoomed = await state(page);
    expect(zoomed.image.ratio).toBeGreaterThan(initial.image.ratio);
    await page.evaluate(() => {
        const active = document.querySelector('.amb-image-viewer-source').viewer;
        active.zoomTo(active.imageData.ratio * 3);
        active.moveTo(10000, 10000);
    });
    const moved = await state(page);
    expectBounded(moved);
    await viewer(page).locator('.viewer-toolbar [data-viewer-action="reset"]').click();
    const reset = await state(page);
    expect(reset.image.ratio).toBeCloseTo(initial.image.ratio, 4);
    await viewer(page).locator('.viewer-toolbar [data-viewer-action="next"]').click();
    await expect(viewer(page).locator('.amb-image-viewer-status')).toContainText('portrait-2');
    const portrait = await state(page);
    expect(portrait.index).toBe(1);
    await page.evaluate(() => {
        const active = document.querySelector('.amb-image-viewer-source').viewer;
        active.zoomTo(active.imageData.ratio * 3);
        active.moveTo(-10000, -10000);
    });
    const movedPortrait = await state(page);
    expectBounded(movedPortrait);
});

test('wheel zoom, mouse pan and viewport resize keep the image reachable', async ({ page }) => {
    await install(page);
    const initial = await state(page);
    const image = viewer(page).locator('.viewer-canvas img');
    await image.hover();
    await page.mouse.wheel(0, -250);
    await expect.poll(async () => (await state(page)).image.ratio).toBeGreaterThan(initial.image.ratio);
    await page.evaluate(() => {
        const active = document.querySelector('.amb-image-viewer-source').viewer;
        active.zoomTo(active.imageData.ratio * 3);
    });
    const beforePan = await state(page);
    const box = await image.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 80, { steps: 8 });
    await page.mouse.up();
    const afterPan = await state(page);
    expect(afterPan.image.x).not.toBeCloseTo(beforePan.image.x, 0);
    expectBounded(afterPan);
    await viewer(page).locator('.viewer-toolbar [data-viewer-action="reset"]').click();
    const reset = await state(page);
    expect(reset.image.ratio).toBeCloseTo(initial.image.ratio, 4);
    expectBounded(reset);
    await page.evaluate(() => {
        const active = document.querySelector('.amb-image-viewer-source').viewer;
        active.zoomTo(active.imageData.ratio * 3);
    });
    await page.setViewportSize({ width: 900, height: 600 });
    await expect.poll(async () => (await state(page)).viewport.width).toBe(900);
    expectBounded(await state(page));
    await page.evaluate(() => document.querySelector('.amb-image-viewer-source').viewer.zoomTo(0));
    const minimum = await state(page);
    expect(minimum.image.ratio).toBe(0.01);
    expectBounded(minimum);
    await page.evaluate(() => document.querySelector('.amb-image-viewer-source').viewer.zoomTo(1000));
    const maximum = await state(page);
    expect(maximum.image.ratio).toBe(100);
    expectBounded(maximum);
});

test('simulated swipe, pinch and cancel preserve gallery navigation and cleanup', async ({ page }) => {
    await install(page);
    const cdp = await page.context().newCDPSession(page);
    try {
        const imageBox = await viewer(page).locator('.viewer-canvas img').boundingBox();
        const tapX = imageBox.x + imageBox.width / 2;
        const tapY = imageBox.y + imageBox.height / 2;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tapX, y: tapY, id: 0 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await expect(viewer(page)).toHaveCount(1);
        await page.evaluate(() => {
            const active = document.querySelector('.amb-image-viewer-source').viewer;
            active.zoomTo(active.initialImageData.ratio * 1.1);
        });
        await swipe(cdp, -800);
        expect((await state(page)).index).toBe(0);
        expectBounded(await state(page));
        await viewer(page).locator('.viewer-toolbar [data-viewer-action="reset"]').click();
        await swipe(cdp, -40);
        expect((await state(page)).index).toBe(0);
        await swipe(cdp, -400);
        expect((await state(page)).index).toBe(0);
        expectBounded(await state(page));
        await swipe(cdp, -800);
        await expect(viewer(page).locator('.amb-image-viewer-status')).toContainText('portrait-2');
        await expect(viewer(page).locator('.viewer-list li[aria-current="true"]')).toHaveAttribute('data-index', '1');
        await page.evaluate(() => {
            const active = document.querySelector('.amb-image-viewer-source').viewer;
            active.zoomTo(active.imageData.ratio * 3);
        });
        const beforePan = await state(page);
        await swipe(cdp, -800);
        const afterPan = await state(page);
        expect(afterPan.index).toBe(1);
        expectBounded(afterPan);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 550, y: 550, id: 0 }] });
        for (let y = 510; y >= 190; y -= 40) {
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 550, y, id: 0 }] });
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        expect((await state(page)).image.y).not.toBeCloseTo(beforePan.image.y, 0);
        expectBounded(await state(page));
        const beforePinch = afterPan.image.ratio;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 550, y: 350, id: 0 }, { x: 650, y: 350, id: 1 }] });
        for (let offset = 20; offset <= 100; offset += 20) {
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 550 - offset, y: 350, id: 0 }, { x: 650 + offset, y: 350, id: 1 }] });
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        expect((await state(page)).image.ratio).toBeGreaterThan(beforePinch);
        expectBounded(await state(page));
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 700, y: 350, id: 0 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
        await viewer(page).locator('.viewer-toolbar [data-viewer-action="next"]').click();
        await expect(viewer(page).locator('.amb-image-viewer-status')).toContainText('landscape-3');
        await swipe(cdp, -800);
        expect((await state(page)).index).toBe(2);
        expectBounded(await state(page));
        await page.evaluate(() => document.querySelector('.amb-image-viewer-source').viewer.view(0));
        await expect(viewer(page).locator('.amb-image-viewer-status')).toContainText('landscape-1');
        await swipe(cdp, 800);
        expect((await state(page)).index).toBe(0);
        expectBounded(await state(page));
        await page.keyboard.press('Escape');
        await expect(viewer(page)).toHaveCount(0);
        await page.locator('#img05-grid button.amb-image--viewable').click();
        await expect(viewer(page)).toHaveCount(1);
        await page.evaluate(() => window.__img05.destroy());
        await expect(viewer(page)).toHaveCount(0);
        await expect(page.locator('.amb-image-viewer-source')).toHaveCount(0);
        await page.evaluate(async () => {
            const { AMB } = await import('/src/index.js');
            const host = document.createElement('div');
            host.id = 'img05-single';
            document.body.append(host);
            window.__img05single = AMB.table({
                selector: '#img05-single',
                data: [{ id: 1, image: { src: '/__img05__/landscape-1.svg', alt: 'single' } }],
                columns: [{ title: 'Image', field: 'image', formatter: AMB.formatters.image({ preview: false }) }]
            });
        });
        await page.locator('#img05-single button.amb-image--viewable').click();
        await expect(viewer(page)).toHaveCount(1);
        await swipe(cdp, -800);
        expect((await state(page)).index).toBe(0);
        await expect(viewer(page).locator('.amb-image-viewer-status')).toContainText('Immagine 1 di 1');
        await page.evaluate(() => window.__img05single.destroy());
        await expect(viewer(page)).toHaveCount(0);
    } finally {
        await cdp.detach();
    }
});

test('a second intentional touch after immediate reopen still activates the toolbar', async ({ page }) => {
    await install(page);
    const cdp = await page.context().newCDPSession(page);
    try {
        const originalId = await viewer(page).getAttribute('id');
        await page.evaluate(() => {
            document.addEventListener('pointerup', event => {
                if (!event.target.closest('.viewer-container')) return;
                window.__img05.handoffAt = performance.now();
                document.querySelector('#img05-grid button.amb-image--viewable').click();
            }, { once: true });
        });
        const canvas = await viewer(page).locator('.viewer-canvas').boundingBox();
        const x = canvas.x + canvas.width - 30;
        const y = canvas.y + canvas.height / 2;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 0 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await expect.poll(() => viewer(page).getAttribute('id')).not.toBe(originalId);
        await expect(viewer(page)).toHaveCount(1);
        const before = await state(page);
        const zoom = await viewer(page).locator('.viewer-toolbar [data-viewer-action="zoom-in"]').boundingBox();
        const tapX = zoom.x + zoom.width / 2;
        const tapY = zoom.y + zoom.height / 2;
        const elapsed = await page.evaluate(() => performance.now() - window.__img05.handoffAt);
        expect(elapsed).toBeLessThan(350);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tapX, y: tapY, id: 0 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await expect.poll(async () => (await state(page)).image.ratio).toBeGreaterThan(before.image.ratio);
        await expect(viewer(page)).toHaveCount(1);
    } finally {
        await cdp.detach();
    }
});
