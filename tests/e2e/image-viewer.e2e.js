import { expect, test } from '@playwright/test';

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="480" height="320" fill="#dce8f2"/><path d="M0 320L240 30L480 320" fill="#557a9b"/></svg>';
const viewer = page => page.locator('.viewer-container');
const source = page => page.locator('.amb-image-viewer-source');

const install = async page => {
    await page.route('**/__img04__/**', route => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: SVG }));
    await page.goto('/test/');
    await page.evaluate(async () => {
        const { AMB } = await import('/src/index.js');
        for (const suffix of ['a', 'b']) {
            const host = document.createElement('div');
            host.id = `img04-${suffix}`;
            document.body.append(host);
        }
        const item = number => ({
            src: `/__img04__/original-${number}.svg`,
            thumbnail: `/__img04__/thumb-${number}.svg`,
            alt: `Technical image ${number}`,
            caption: `Caption ${number}`
        });
        const a = AMB.table({
            selector: '#img04-a',
            data: [
                { id: 1, images: item(1), disabled: item(1), noPreview: item(1) },
                { id: 2, images: [item(1), { src: 'javascript:alert(1)' }, item(2), item(3), item(4)], disabled: item(2), noPreview: item(2) }
            ],
            columns: [
                { title: 'ID', field: 'id' },
                { title: 'Images', field: 'images', formatter: AMB.formatters.image() },
                { title: 'No viewer', field: 'disabled', formatter: AMB.formatters.image({ viewer: false }) },
                { title: 'No preview', field: 'noPreview', formatter: AMB.formatters.image({ preview: false }) }
            ]
        });
        const b = AMB.table({
            selector: '#img04-b',
            data: [{ id: 3, images: item(5) }],
            columns: [{ title: 'ID', field: 'id' }, { title: 'Images', field: 'images', formatter: AMB.formatters.image() }]
        });
        window.__img04 = { a, b };
    });
    await expect(page.locator('#img04-a button.amb-image--viewable')).toHaveCount(4);
    await expect(page.locator('#img04-b button.amb-image--viewable')).toHaveCount(1);
};

test('single image, four-image gallery, navigation and native keyboard activation', async ({ page }) => {
    await install(page);
    const trigger = page.locator('#img04-a .tabulator-row').first().locator('button.amb-image--viewable').first();
    await trigger.scrollIntoViewIfNeeded();
    await expect.poll(async () => {
        await trigger.focus();
        await page.waitForTimeout(50);
        return trigger.evaluate(element => document.activeElement === element);
    }).toBe(true);
    await page.keyboard.press('Enter');
    await expect(viewer(page)).toHaveCount(1);
    await expect(source(page)).toHaveCount(1);
    await expect(viewer(page).locator('.viewer-list li')).toHaveCount(1);
    await expect(viewer(page).locator('.amb-image-viewer-status')).toHaveText('Immagine 1 di 1 — Caption 1');
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
    await expect(source(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.press('Space');
    await expect(viewer(page)).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);

    const gallery = page.locator('#img04-a .tabulator-row').nth(1).locator('button.amb-image--viewable').first();
    await gallery.click();
    await expect(viewer(page)).toHaveCount(1);
    await expect(viewer(page).locator('.viewer-list li')).toHaveCount(4);
    await expect(source(page).locator('img').first()).toHaveAttribute('src', '/__img04__/thumb-1.svg');
    await expect(source(page).locator('img').first()).toHaveAttribute('data-original', '/__img04__/original-1.svg');
    await viewer(page).locator('.viewer-toolbar [data-viewer-action="next"]').click();
    await expect(viewer(page).locator('.amb-image-viewer-status')).toHaveText('Immagine 2 di 4 — Caption 2');
    await viewer(page).locator('.viewer-list li').nth(3).click();
    await expect(viewer(page).locator('.amb-image-viewer-status')).toHaveText('Immagine 4 di 4 — Caption 4');
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
});

test('viewer option, preview coexistence, multiple grids and destroy cleanup', async ({ page }) => {
    await install(page);
    const disabled = page.locator('#img04-a .tabulator-row').first().locator('.amb-image').nth(1);
    await disabled.click();
    await expect(viewer(page)).toHaveCount(0);
    await disabled.hover();
    await expect(page.locator('.amb-image-preview')).toHaveCount(1);
    await page.mouse.move(0, 0);
    await expect(page.locator('.amb-image-preview')).toHaveCount(0);

    const noPreview = page.locator('#img04-a .tabulator-row').first().locator('button.amb-image--viewable').nth(1);
    await noPreview.hover();
    await page.waitForTimeout(300);
    await expect(page.locator('.amb-image-preview')).toHaveCount(0);
    await noPreview.click();
    await expect(viewer(page)).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);

    const a = page.locator('#img04-a .tabulator-row').first().locator('button.amb-image--viewable').first();
    await a.hover();
    await expect(page.locator('.amb-image-preview')).toHaveCount(1);
    await a.click();
    await expect(page.locator('.amb-image-preview')).toHaveCount(0);
    await expect(viewer(page)).toHaveCount(1);

    await page.evaluate(() => document.querySelector('#img04-b button.amb-image--viewable').click());
    await expect(viewer(page)).toHaveCount(1);
    await expect(viewer(page).locator('.amb-image-viewer-status')).toHaveText('Immagine 1 di 1 — Caption 5');
    await page.evaluate(() => window.__img04.b.destroy());
    await expect(viewer(page)).toHaveCount(0);
    await expect(source(page)).toHaveCount(0);
    await page.evaluate(() => window.__img04.a.destroy());
    await expect(page.locator('.amb-image-preview')).toHaveCount(0);
});

test('repeated opening and removed trigger restore focus to the owning grid', async ({ page }) => {
    await install(page);
    const trigger = page.locator('#img04-a .tabulator-row').first().locator('button.amb-image--viewable').first();
    for (let attempt = 0; attempt < 3; attempt += 1) {
        await trigger.click();
        await expect(viewer(page)).toHaveCount(1);
        await page.keyboard.press('Escape');
        await expect(viewer(page)).toHaveCount(0);
        await expect(source(page)).toHaveCount(0);
    }
    await trigger.click();
    await expect(viewer(page)).toHaveCount(1);
    await trigger.evaluate(element => element.remove());
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
    await expect(page.locator('#img04-a')).toBeFocused();
});

test('dialog semantics, focus cycle, keyboard navigation and controls', async ({ page }) => {
    await install(page);
    const trigger = page.locator('#img04-a .tabulator-row').nth(1).locator('button.amb-image--viewable').first();
    await trigger.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
        window.__img04.openings = 0;
        document.querySelector('#img04-a').addEventListener('click', event => {
            if (event.target.closest('.amb-image--viewable')) window.__img04.openings += 1;
        });
    });
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(viewer(page)).toHaveCount(1);
    expect(await page.evaluate(() => window.__img04.openings)).toBe(1);
    await expect(viewer(page)).toHaveAttribute('role', 'dialog');
    await expect(viewer(page)).toHaveAttribute('aria-modal', 'true');
    await expect(viewer(page)).toHaveAttribute('aria-label', 'Raccolta immagini');
    await expect(viewer(page).locator('.viewer-button')).toBeFocused();
    await expect(viewer(page).locator('.viewer-button')).toHaveAttribute('aria-label', 'Chiudi immagini');
    for (const [action, name] of Object.entries({
        'zoom-in': 'Ingrandisci', 'zoom-out': 'Riduci', 'one-to-one': 'Dimensione naturale / iniziale',
        reset: 'Fit / Reset', prev: 'Precedente', next: 'Successiva'
    })) {
        await expect(viewer(page).locator(`.viewer-toolbar [data-viewer-action="${action}"]`)).toHaveAttribute('aria-label', name);
    }
    await expect(viewer(page).locator('.viewer-toolbar [data-viewer-action="prev"]')).toHaveAttribute('aria-disabled', 'true');
    await expect(viewer(page).locator('.amb-image-viewer-status')).toHaveAttribute('role', 'status');
    for (const key of ['Tab', 'Shift+Tab']) {
        for (let index = 0; index < 16; index += 1) {
            await page.keyboard.press(key);
            expect(await page.evaluate(() => document.querySelector('.viewer-container').contains(document.activeElement))).toBe(true);
        }
    }
    for (const selector of ['.viewer-zoom-in', '.viewer-list li']) {
        const control = viewer(page).locator(selector).first();
        await control.focus();
        expect(await control.evaluate(element => getComputedStyle(element).outlineWidth)).toBe('3px');
    }
    const zoom = viewer(page).locator('.viewer-toolbar [data-viewer-action="zoom-in"]');
    await expect(zoom).toHaveAttribute('aria-label', 'Ingrandisci');
    await page.evaluate(() => {
        window.__img04.zoomClicks = 0;
        document.querySelector('.viewer-toolbar [data-viewer-action="zoom-in"]')
            .addEventListener('click', () => { window.__img04.zoomClicks += 1; });
    });
    await zoom.focus();
    const widthBeforeZoom = await viewer(page).locator('.viewer-canvas img').evaluate(element => element.getBoundingClientRect().width);
    await page.keyboard.press('Enter');
    const widthAfterEnter = await viewer(page).locator('.viewer-canvas img').evaluate(element => element.getBoundingClientRect().width);
    await page.keyboard.press('Space');
    const widthAfterSpace = await viewer(page).locator('.viewer-canvas img').evaluate(element => element.getBoundingClientRect().width);
    expect(await page.evaluate(() => window.__img04.zoomClicks)).toBe(1);
    expect(widthAfterEnter).toBeGreaterThan(widthBeforeZoom);
    expect(widthAfterSpace).toBeGreaterThan(widthAfterEnter);
    await page.keyboard.press('ArrowRight');
    await expect(viewer(page).locator('.amb-image-viewer-status')).toHaveText(/Immagine 2 di 4.*Caption 2/);
    expect(await page.evaluate(() => document.querySelector('.viewer-container').contains(document.activeElement))).toBe(true);
    await page.keyboard.press('ArrowLeft');
    await expect(viewer(page).locator('.amb-image-viewer-status')).toHaveText(/Immagine 1 di 4.*Caption 1/);
    const thumbs = viewer(page).locator('.viewer-list li');
    await thumbs.nth(2).focus();
    await page.keyboard.press('Enter');
    await expect(thumbs.nth(2)).toHaveAttribute('aria-current', 'true');
    await thumbs.nth(3).focus();
    await page.keyboard.press('Space');
    await expect(thumbs.nth(3)).toHaveAttribute('aria-current', 'true');
    await expect(viewer(page).locator('.viewer-list')).toHaveAttribute('aria-label', 'Miniature delle immagini');
    await expect(viewer(page).locator('.viewer-list li[aria-selected]')).toHaveCount(0);
    await expect(viewer(page).locator('.viewer-toolbar [data-viewer-action="next"]')).toHaveAttribute('aria-disabled', 'true');
    await expect(viewer(page).locator('.viewer-canvas img')).toHaveAttribute('alt', 'Technical image 4');
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Space');
    await expect(viewer(page)).toHaveCount(1);
    expect(await page.evaluate(() => window.__img04.openings)).toBe(2);
    await page.keyboard.press('Escape');
});

test('cell rerender keeps viewer stable and restores focus to grid; caption remains text', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await install(page);
    const trigger = page.locator('#img04-a .tabulator-row').nth(1).locator('button.amb-image--viewable').first();
    const oldTrigger = await trigger.elementHandle();
    await trigger.click();
    await expect(viewer(page)).toHaveCount(1);
    await page.evaluate(async () => {
        await window.__img04.a.table.updateData([{
            id: 2,
            images: { src: '/__img04__/original-4.svg', thumbnail: '/__img04__/thumb-4.svg', alt: 'Technical image 4', caption: '<script>caption</script>' }
        }]);
        window.__img04.a.table.redraw(true);
    });
    expect(await oldTrigger.evaluate(element => element.isConnected)).toBe(false);
    await expect(viewer(page)).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
    await expect(page.locator('#img04-a')).toBeFocused();
    await page.locator('#img04-a .tabulator-row').nth(1).locator('button.amb-image--viewable').first().click();
    await expect(viewer(page).locator('.amb-image-viewer-status')).toHaveText(/Immagine 1 di 1.*<script>caption<\/script>/);
    await expect(viewer(page).locator('script')).toHaveCount(0);
    await page.evaluate(() => window.__img04.a.destroy());
    await expect(viewer(page)).toHaveCount(0);
    await expect(source(page)).toHaveCount(0);
    expect(errors).toEqual([]);
});

test('pending hover preview stays closed during viewer and works again afterward', async ({ page }) => {
    await install(page);
    const trigger = page.locator('#img04-a .tabulator-row').first().locator('button.amb-image--viewable').first();
    await trigger.hover();
    await trigger.click();
    await expect(viewer(page)).toHaveCount(1);
    await page.waitForTimeout(350);
    await expect(page.locator('.amb-image-preview')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
    await page.mouse.move(0, 0);
    await trigger.hover();
    await expect(page.locator('.amb-image-preview')).toHaveCount(1);
});

test('Lookup in front owns Escape and returns focus to viewer before it closes', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await install(page);
    const trigger = page.locator('#img04-a .tabulator-row').first().locator('button.amb-image--viewable').first();
    await page.evaluate(() => document.querySelector('#img04-a').addEventListener('click', event => {
        if (event.target.closest('.amb-image--viewable')) window.__img04.clickedTrigger = event.target.closest('.amb-image--viewable');
    }, { capture: true }));
    await trigger.click();
    await expect(viewer(page)).toHaveCount(1);
    await page.evaluate(async () => {
        const { LookupDialog } = await import('/src/ui/lookup-dialog.js');
        window.__img04.lookup = new LookupDialog();
        void window.__img04.lookup.open({ title: 'Technical lookup', columns: [{ field: 'name', title: 'Name' }], data: [{ id: 1, name: 'One' }] });
    });
    const lookup = page.locator('.amb-lookup-dialog');
    await expect(lookup).toBeVisible();
    await expect(lookup.locator('.amb-lookup-dialog__search')).toBeFocused();
    for (const key of ['Tab', 'Shift+Tab']) {
        for (let index = 0; index < 8; index += 1) {
            await page.keyboard.press(key);
            expect(await page.evaluate(() => document.querySelector('.amb-lookup-dialog').contains(document.activeElement))).toBe(true);
        }
    }
    await expect(viewer(page)).toHaveAttribute('aria-hidden', 'true');
    await expect(viewer(page)).not.toHaveAttribute('aria-modal');
    expect(await page.evaluate(() => {
        const photo = document.querySelector('.viewer-container');
        const lookup = document.querySelector('.amb-lookup-dialog');
        return Number(getComputedStyle(photo).zIndex) < Number(getComputedStyle(lookup).zIndex);
    })).toBe(true);
    await page.keyboard.press('Escape');
    await expect(lookup).toHaveCount(0);
    await expect(viewer(page)).toHaveCount(1);
    await expect(viewer(page).locator('.viewer-button')).toBeFocused();
    await expect(viewer(page)).toHaveAttribute('aria-modal', 'true');
    await expect(viewer(page)).not.toHaveAttribute('aria-hidden');
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
    expect(await page.evaluate(() => {
        const clicked = window.__img04.clickedTrigger;
        return document.activeElement === (clicked.isConnected ? clicked : document.querySelector('#img04-a'));
    })).toBe(true);
    expect(errors).toEqual([]);
});

test('destroy releases temporary document and window listeners', async ({ page }) => {
    await install(page);
    await page.evaluate(() => {
        const add = EventTarget.prototype.addEventListener;
        const remove = EventTarget.prototype.removeEventListener;
        const active = [];
        const release = (target, type, callback) => {
            const index = active.findIndex(entry => entry.target === target && entry.type === type && entry.callback === callback);
            if (index >= 0) active.splice(index, 1);
        };
        EventTarget.prototype.addEventListener = function (type, callback, options) {
            if (this === document || this === window) {
                active.push({ target: this, type, callback });
                options?.signal?.addEventListener('abort', () => release(this, type, callback), { once: true });
            }
            return add.call(this, type, callback, options);
        };
        EventTarget.prototype.removeEventListener = function (type, callback, options) {
            release(this, type, callback);
            return remove.call(this, type, callback, options);
        };
        window.__img04.activeListenerCount = () => active.length;
    });
    await page.locator('#img04-a .tabulator-row').first().locator('button.amb-image--viewable').nth(1).click();
    await expect(viewer(page)).toHaveCount(1);
    expect(await page.evaluate(() => window.__img04.activeListenerCount())).toBeGreaterThan(0);
    await page.evaluate(() => window.__img04.a.destroy());
    await expect(viewer(page)).toHaveCount(0);
    await expect(source(page)).toHaveCount(0);
    expect(await page.evaluate(() => window.__img04.activeListenerCount())).toBe(0);
});

test('switching grids preserves the new owner when the old grid is destroyed', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await install(page);
    const inertBefore = await page.evaluate(() => [
        document.querySelector('#img04-a').inert,
        document.querySelector('#img04-b').inert
    ]);
    await page.locator('#img04-a button.amb-image--viewable').first().click();
    const firstId = await viewer(page).getAttribute('id');
    await page.evaluate(() => document.querySelector('#img04-b button.amb-image--viewable').click());
    await expect(viewer(page)).toHaveCount(1);
    await expect(source(page)).toHaveCount(1);
    await expect(viewer(page)).not.toHaveAttribute('id', firstId);
    await expect(viewer(page).locator('.amb-image-viewer-status')).toContainText('Caption 5');
    await expect(viewer(page).locator('.viewer-button')).toBeFocused();
    await page.evaluate(() => window.__img04.a.destroy());
    await expect(viewer(page)).toHaveCount(1);
    await expect(viewer(page).locator('.amb-image-viewer-status')).toContainText('Caption 5');
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
    await expect(source(page)).toHaveCount(0);
    await expect(page.locator('#img04-b button.amb-image--viewable')).toBeFocused();
    expect(await page.evaluate(() => [
        document.querySelector('#img04-a').inert,
        document.querySelector('#img04-b').inert
    ])).toEqual(inertBefore);
    expect(errors).toEqual([]);
});

test('a late image error cannot replace the status of the next photograph', async ({ page }) => {
    await install(page);
    const gallery = page.locator('#img04-a .tabulator-row').nth(1).locator('button.amb-image--viewable').first();
    await gallery.click();
    await expect(viewer(page).locator('.amb-image-viewer-status')).toContainText('Caption 1');
    await page.evaluate(() => { window.__img04.oldImage = document.querySelector('.viewer-canvas img'); });
    await viewer(page).locator('.viewer-toolbar [data-viewer-action="next"]').click();
    await expect(viewer(page).locator('.amb-image-viewer-status')).toContainText('Caption 2');
    await page.evaluate(() => window.__img04.oldImage.dispatchEvent(new Event('error')));
    await expect(viewer(page).locator('.amb-image-viewer-status')).toContainText('Caption 2');
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
});

test('rapid close and reopen ignores events from the disposed session', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await install(page);
    const trigger = page.locator('#img04-a .tabulator-row').nth(1).locator('button.amb-image--viewable').first();
    await trigger.click();
    await expect(viewer(page)).toHaveCount(1);
    await page.evaluate(() => { window.__img04.oldImage = document.querySelector('.viewer-canvas img'); });
    await viewer(page).locator('.viewer-toolbar [data-viewer-action="next"]').click();
    await viewer(page).locator('.viewer-toolbar [data-viewer-action="zoom-in"]').click();
    await page.evaluate(() => {
        document.querySelector('.viewer-button').click();
        document.querySelector('#img04-b button.amb-image--viewable').click();
        window.__img04.oldImage.dispatchEvent(new Event('load'));
        window.__img04.oldImage.dispatchEvent(new Event('error'));
    });
    await expect(viewer(page)).toHaveCount(1);
    await expect(source(page)).toHaveCount(1);
    await expect(viewer(page).locator('.amb-image-viewer-status')).toContainText('Caption 5');
    await expect(page.locator('.amb-image-preview')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
    await expect(source(page)).toHaveCount(0);
    await page.evaluate(() => window.__img04.b.destroy());
    await expect(page.locator('.amb-image-preview')).toHaveCount(0);
    expect(errors).toEqual([]);
});
