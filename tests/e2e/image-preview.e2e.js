import { expect, test } from '@playwright/test';

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#dce8f2"/><circle cx="200" cy="150" r="80" fill="#557a9b"/></svg>';
const overlay = page => page.locator('.amb-image-preview');
const image = (page, grid, row = 0) => page.locator(`#img03-${grid} .amb-image--previewable`).nth(row);

const install = async (page, { delayOriginal = 0 } = {}) => {
    const requests = [];
    await page.route('**/__img03__/**', async route => {
        const name = new URL(route.request().url()).pathname.split('/').at(-1);
        requests.push(name);
        if (name === 'original.svg' && delayOriginal) {
            await new Promise(resolve => setTimeout(resolve, delayOriginal));
        }
        return route.fulfill({ status: name === 'broken.svg' ? 404 : 200, contentType: 'image/svg+xml', body: name === 'broken.svg' ? '' : SVG });
    });
    await page.goto('/test/');
    await page.evaluate(async () => {
        const { AMB } = await import('/src/index.js');
        for (const id of ['a', 'b']) {
            const host = document.createElement('div');
            host.id = `img03-${id}`;
            document.body.append(host);
        }
        const value = (src, caption) => ({ src: `/__img03__/${src}`, thumbnail: '/__img03__/thumb.svg', alt: '<b>technical</b>', caption });
        const a = AMB.table({
            selector: '#img03-a',
            data: [
                { id: 1, images: [value('original.svg', '<script>caption</script>'), value('second.svg', '')], disabled: value('original.svg', '') },
                { id: 2, images: [value('broken.svg', 'Fallback')], disabled: value('original.svg', '') }
            ],
            columns: [
                { title: 'ID', field: 'id' },
                { title: 'Images', field: 'images', formatter: AMB.formatters.image() },
                { title: 'No preview', field: 'disabled', formatter: AMB.formatters.image({ preview: false }) }
            ]
        });
        const b = AMB.table({
            selector: '#img03-b',
            data: [{ id: 3, images: [value('second.svg', 'Second grid')] }],
            columns: [{ title: 'ID', field: 'id' }, { title: 'Images', field: 'images', formatter: AMB.formatters.image() }]
        });
        window.__img03 = { a, b };
    });
    await expect(page.locator('#img03-a .amb-image--previewable')).toHaveCount(2);
    await expect(page.locator('#img03-b .amb-image--previewable')).toHaveCount(1);
    return requests;
};

test('hover delay, cancellation, keyboard, scroll, resize and touch', async ({ page }) => {
    const requests = await install(page);
    const first = image(page, 'a');
    const disabled = page.locator('#img03-a .amb-image:not(.amb-image--previewable)').first();
    expect(requests).not.toContain('original.svg');

    await first.hover();
    await expect(overlay(page)).toHaveCount(0);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    await expect(overlay(page)).toHaveCount(0);
    expect(requests).not.toContain('original.svg');

    await first.hover();
    await expect(overlay(page)).toHaveCount(1);
    await expect(overlay(page).locator('img')).toHaveAttribute('src', '/__img03__/original.svg');
    await expect(overlay(page).locator('.amb-image-preview__caption')).toHaveText('<script>caption</script>');
    expect(await overlay(page).locator('script').count()).toBe(0);
    expect(requests.filter(name => name === 'original.svg')).toHaveLength(1);
    expect(requests).not.toContain('second.svg');
    await first.evaluate(root => {
        const thumbnail = root.querySelector('img');
        const badge = root.querySelector('.amb-image-count');
        thumbnail.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, pointerType: 'mouse', relatedTarget: badge }));
        badge.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse', relatedTarget: thumbnail }));
    });
    await expect(overlay(page)).toHaveCount(1);

    await page.evaluate(() => document.dispatchEvent(new Event('scroll', { bubbles: true })));
    await expect(overlay(page)).toHaveCount(0);
    await first.focus();
    await expect(overlay(page)).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(overlay(page)).toHaveCount(0);
    await page.mouse.move(0, 0);
    await first.hover();
    await expect(overlay(page)).toHaveCount(1);
    await page.setViewportSize({ width: 900, height: 600 });
    await expect(overlay(page)).toHaveCount(0);
    await first.evaluate(element => { element.blur(); element.focus(); });
    await expect(overlay(page)).toHaveCount(1);
    await page.locator('#selection-mode').focus();
    await expect(overlay(page)).toHaveCount(0);

    await page.evaluate(() => document.activeElement.blur());
    await page.mouse.move(0, 0);
    await disabled.hover();
    await page.waitForTimeout(300);
    await expect(overlay(page)).toHaveCount(0);
    await first.evaluate(element => element.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'touch' })));
    await page.waitForTimeout(300);
    await expect(overlay(page)).toHaveCount(0);
});

test('fallback, rerender, removed target and independent grid destruction', async ({ page }) => {
    const requests = await install(page);
    const broken = image(page, 'a', 1);
    await broken.hover();
    await expect(overlay(page)).toHaveCount(1);
    await expect(overlay(page).locator('img')).toHaveAttribute('src', '/__img03__/thumb.svg');
    expect(requests).toContain('broken.svg');

    await page.evaluate(() => window.__img03.a.table.redraw(true));
    await expect(overlay(page)).toHaveCount(0);
    const fresh = image(page, 'a');
    await fresh.hover();
    await expect(overlay(page)).toHaveCount(1);
    await fresh.evaluate(element => element.remove());
    await expect(overlay(page)).toHaveCount(0);

    await image(page, 'b').hover();
    await expect(overlay(page).locator('.amb-image-preview__caption')).toHaveText('Second grid');
    await page.evaluate(() => window.__img03.a.destroy());
    await page.mouse.move(0, 0);
    await image(page, 'b').hover();
    await expect(overlay(page)).toHaveCount(1);
    await page.evaluate(() => window.__img03.b.destroy());
    await expect(overlay(page)).toHaveCount(0);
    await expect(page.locator('.amb-image-preview')).toHaveCount(0);
});

test('late image response cannot restore a closed preview', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await install(page, { delayOriginal: 600 });
    await page.evaluate(() => {
        const records = new Set();
        for (const target of [document, window]) {
            const original = target.addEventListener;
            target.addEventListener = function (type, callback, options) {
                if (['scroll', 'resize', 'focusin', 'keydown'].includes(type) && options?.signal) {
                    const record = { type, callback };
                    records.add(record);
                    options.signal.addEventListener('abort', () => records.delete(record), { once: true });
                }
                return original.call(this, type, callback, options);
            };
        }
        window.__img03ListenerCount = () => records.size;
    });
    await image(page, 'a').hover();
    await expect(overlay(page)).toHaveCount(1);
    expect(await page.evaluate(() => window.__img03ListenerCount())).toBeGreaterThan(0);
    await page.mouse.move(0, 0);
    await expect(overlay(page)).toHaveCount(0);
    await page.waitForTimeout(700);
    await expect(overlay(page)).toHaveCount(0);
    expect(await page.evaluate(() => window.__img03ListenerCount())).toBe(0);
    expect(errors).toEqual([]);
    await page.evaluate(() => { window.__img03.a.destroy(); window.__img03.b.destroy(); });
    expect(await page.evaluate(() => window.__img03ListenerCount())).toBe(0);
});
