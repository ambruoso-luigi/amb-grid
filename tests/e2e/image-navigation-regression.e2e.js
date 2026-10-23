import { expect, test } from '@playwright/test';

const grid = page => page.locator('#img11-grid');
const row = (page, index) => grid(page).locator('.tabulator-row').nth(index);
const cell = (page, index, field) => row(page, index).locator(`[tabulator-field="${field}"]`);
const image = (page, index) => cell(page, index, 'images').locator('.amb-image--viewable');
const viewer = page => page.getByRole('dialog', { name: 'Raccolta immagini' });

const install = async (page, mixed, options = {}) => {
    await page.route('**/__img11__/**', route => route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="480" height="320" fill="#557a9b"/></svg>'
    }));
    await page.goto('/test/');
    await expect(page.locator('#image-secondary-test-table .tabulator-row')).toHaveCount(2);
    await page.evaluate(async ({ mixed, options }) => {
        const { AMB } = await import('/src/index.js');
        const section = document.createElement('section');
        section.innerHTML = '<button id="img11-before">Before grid</button><div id="img11-grid"></div><button id="img11-after">After grid</button>';
        document.body.append(section);
        const photo = { src: '/__img11__/one.svg', alt: 'Technical photograph' };
        const mount = () => {
            window.__img11.grid?.destroy();
            window.__img11.grid = AMB.table({
                selector: '#img11-grid',
                toolbar: false,
                selectionColumn: { enabled: true, mode: 'multiple' },
                ...(options.keyboardNavigation ? { keyboardNavigation: options.keyboardNavigation } : {}),
                ...(options.pagination ? { pagination: true, paginationSize: 2 } : {}),
                data: [
                    { id: 1, name: 'One', locked: 'Locked', images: [photo, { ...photo, src: '/__img11__/two.svg' }] },
                    { id: 2, name: 'Two', locked: 'Locked', images: null },
                    { id: 3, name: 'Three', locked: 'Locked', images: photo }
                ],
                columns: [
                    { title: 'Passive ID', field: 'id', cellClick: () => { window.__img11.clicks += 1; } },
                    ...(options.wide ? Array.from({ length: 40 }, (_, index) => ({ title: `Readonly ${index}`, field: `readonly${index}`, width: 100 })) : []),
                    { title: 'Name', field: 'name', ...(mixed ? { editor: AMB.editors.text() } : {}) },
                    { title: 'Explicit readonly', field: 'locked', editable: false, ...(mixed ? { editor: AMB.editors.text() } : {}) },
                    ...(options.extended ? [
                        { title: 'Callback readonly', field: 'callbackLocked', editor: AMB.editors.text(), editable: () => window.__img11.allowDynamic === true },
                        { title: 'Hidden', field: 'hidden', visible: false, editor: AMB.editors.text() }
                    ] : []),
                    { title: 'Images', field: 'images', formatter: AMB.formatters.image() },
                    ...(options.extended ? [{ title: 'Controls', field: 'controls', formatter: () => {
                        const host = document.createElement('span');
                        const link = document.createElement('a');
                        link.href = '#img11-after';
                        link.textContent = 'Native link';
                        const button = document.createElement('button');
                        button.textContent = 'Native button';
                        button.addEventListener('click', () => { window.__img11.buttonClicks += 1; });
                        host.append(link, button);
                        return host;
                    } }] : [])
                ]
            });
        };
        window.__img11 = { mount, clicks: 0, buttonClicks: 0 };
        if (options.wide) document.querySelector('#img11-grid').style.width = '340px';
        mount();
    }, { mixed, options });
    await expect(grid(page).locator('.tabulator-row')).toHaveCount(options.pagination ? 2 : 3);
    await page.goto('/test/#img11-before');
    await expect(page.locator('#img11-before')).toBeFocused();
};

const tabIntoGrid = async page => {
    const target = row(page, 0).locator('.amb-selection-column');
    for (let attempt = 0; attempt < 12; attempt += 1) {
        await page.keyboard.press('Tab');
        if (await target.evaluate(element => element === document.activeElement)) return;
    }
    await expect(target).toBeFocused();
};

const expectNavigationFocus = async target => {
    await expect(target).toBeFocused();
    await expect.poll(() => target.evaluate(async element => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return element.isConnected && element === document.activeElement;
    })).toBe(true);
    await expect(target).not.toHaveClass(/tabulator-editing/);
    expect(await target.evaluate(element => {
        const style = getComputedStyle(element);
        return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
    })).toBe(true);
};

for (const field of ['id', 'description', 'testCase']) {
    test(`fresh readonly click on ${field} starts image grid navigation before opening the viewer`, async ({ page }) => {
        await page.goto('/test/');
        await expect(page.locator('#image-secondary-test-table .tabulator-row')).toHaveCount(2);
        const a = page.locator('#image-formatter-test-table');
        const first = a.locator('.tabulator-row').first();
        const start = first.locator(`[tabulator-field="${field}"]`);
        await start.click();
        await expectNavigationFocus(start);
        if (field === 'id') {
            await page.keyboard.press('Tab');
            await expectNavigationFocus(first.locator('[tabulator-field="description"]'));
            await page.keyboard.press('Shift+Tab');
            await expectNavigationFocus(start);
        }
        await page.keyboard.press('Enter');
        await expect(viewer(page)).toHaveCount(0);
        if (field === 'testCase') {
            await page.keyboard.press('ArrowLeft');
            await expectNavigationFocus(first.locator('[tabulator-field="imageCount"]'));
            await page.keyboard.press('ArrowLeft');
        } else {
            await page.keyboard.press('ArrowRight');
            if (field === 'id') {
                await expectNavigationFocus(first.locator('[tabulator-field="description"]'));
                await page.keyboard.press('ArrowRight');
            }
        }
        const trigger = first.locator('.amb-image--viewable');
        await expect(trigger).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(a.locator('.tabulator-row').nth(1).locator('.amb-image--viewable')).toBeFocused();
        await page.keyboard.press('ArrowUp');
        await expect(trigger).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(viewer(page)).toHaveCount(1);
        await page.keyboard.press('Escape');
        await expect(trigger).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expectNavigationFocus(first.locator('[tabulator-field="description"]'));
        await start.click();
        await expectNavigationFocus(start);
        await expect(a.locator('.tabulator-selected, .tabulator-editing')).toHaveCount(0);
        await expect(page.locator('#image-secondary-test-table .tabulator-selected')).toHaveCount(0);
        const b = page.locator('#image-secondary-test-table .tabulator-row').first();
        await b.locator('[tabulator-field="description"]').click();
        await expectNavigationFocus(b.locator('[tabulator-field="description"]'));
        await page.keyboard.press('Tab');
        await expect(b.locator('.amb-image--viewable')).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expectNavigationFocus(b.locator('[tabulator-field="description"]'));
        await page.keyboard.press('ArrowRight');
        await expect(b.locator('.amb-image--viewable')).toBeFocused();
    });
}

test('mixed readonly click, editable:false and editable callbacks separate navigation from editing', async ({ page }) => {
    await install(page, true, { extended: true });
    await cell(page, 0, 'id').click();
    await expectNavigationFocus(cell(page, 0, 'id'));
    expect(await page.evaluate(() => window.__img11.clicks)).toBe(1);
    await page.keyboard.press('Enter');
    await expect(grid(page).locator('.tabulator-editing')).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
    await expectNavigationFocus(cell(page, 0, 'name'));
    await page.keyboard.press('Enter');
    const editor = cell(page, 0, 'name').locator('input');
    await expect(editor).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(editor).toBeFocused();
    await page.keyboard.press('Escape');
    await expectNavigationFocus(cell(page, 0, 'name'));
    for (const field of ['locked', 'callbackLocked']) {
        await cell(page, 0, field).click();
        await expectNavigationFocus(cell(page, 0, field));
        await page.keyboard.press('Enter');
        await page.keyboard.press('F2');
        await expect(grid(page).locator('.tabulator-editing')).toHaveCount(0);
        await page.keyboard.press('ArrowDown');
        await expectNavigationFocus(cell(page, 1, field));
        await page.keyboard.press('ArrowUp');
        await expectNavigationFocus(cell(page, 0, field));
    }
    await page.keyboard.press('ArrowRight');
    await expect(image(page, 0)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expectNavigationFocus(cell(page, 0, 'callbackLocked'));
    // Navigation Tab retains readonly destinations without activating editors.
    await page.keyboard.press('Shift+Tab');
    await expectNavigationFocus(cell(page, 0, 'locked'));
    await page.keyboard.press('Shift+Tab');
    await expectNavigationFocus(cell(page, 0, 'name'));
    await cell(page, 0, 'name').dblclick();
    await expect(cell(page, 0, 'name').locator('input')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(cell(page, 0, 'name')).toHaveText('One');
    await expect(grid(page).locator('.tabulator-selected')).toHaveCount(0);
});

test('readonly formatted links and buttons retain their native pointer activation', async ({ page }) => {
    await install(page, true, { extended: true });
    const button = cell(page, 0, 'controls').getByRole('button');
    await button.click();
    await expect(button).toBeFocused();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(button).toBeFocused();
    expect(await page.evaluate(() => window.__img11.buttonClicks)).toBe(1);
    await cell(page, 0, 'controls').getByRole('link').click();
    await expect(page.locator('#img11-after')).toBeFocused();
    await expect(grid(page).locator('.tabulator-selected, .tabulator-editing')).toHaveCount(0);
});

test('custom spatial bindings traverse readonly cells while default arrow bindings remain untouched', async ({ page }) => {
    await install(page, true, { keyboardNavigation: { bindings: {
        right: 'Ctrl+ArrowRight', left: 'Ctrl+ArrowLeft', down: 'Ctrl+ArrowDown', up: 'Ctrl+ArrowUp'
    } } });
    await cell(page, 0, 'id').click();
    await expectNavigationFocus(cell(page, 0, 'id'));
    await page.keyboard.press('ArrowRight');
    await expect(cell(page, 0, 'id')).toBeFocused();
    await page.keyboard.press('Control+ArrowRight');
    await expectNavigationFocus(cell(page, 0, 'name'));
    await page.keyboard.press('Control+ArrowRight');
    await expectNavigationFocus(cell(page, 0, 'locked'));
    await page.keyboard.press('Control+ArrowDown');
    await expectNavigationFocus(cell(page, 1, 'locked'));
    await page.keyboard.press('Control+ArrowUp');
    await expectNavigationFocus(cell(page, 0, 'locked'));
});

test('disabled keyboard navigation preserves native image activation without spatial movement', async ({ page }) => {
    await install(page, true, { keyboardNavigation: { enabled: false } });
    await image(page, 0).click();
    await expect(viewer(page)).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(image(page, 0)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(image(page, 0)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(viewer(page)).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(grid(page).locator('.tabulator-selected, .tabulator-editing')).toHaveCount(0);
});

test('readonly navigation preserves its column across pages and remains usable after data updates', async ({ page }) => {
    await install(page, true, { pagination: true });
    await cell(page, 1, 'id').click();
    await expectNavigationFocus(cell(page, 1, 'id'));
    await page.keyboard.press('ArrowDown');
    await expect(cell(page, 0, 'id')).toHaveText('3');
    await expectNavigationFocus(cell(page, 0, 'id'));
    await page.keyboard.press('ArrowUp');
    await expect(cell(page, 1, 'id')).toHaveText('2');
    await expectNavigationFocus(cell(page, 1, 'id'));
    await page.evaluate(() => window.__img11.grid.updateData([{ id: 2, name: 'Updated' }]));
    await expect(cell(page, 1, 'name')).toHaveText('Updated');
    await expectNavigationFocus(cell(page, 1, 'id'));
    await page.keyboard.press('ArrowRight');
    await expectNavigationFocus(cell(page, 1, 'name'));
    await expect(grid(page).locator('.tabulator-selected')).toHaveCount(0);
});

test('many readonly columns remain navigable and reveal focus with horizontal scrolling', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await install(page, true, { wide: true });
    await cell(page, 0, 'id').click();
    await expectNavigationFocus(cell(page, 0, 'id'));
    for (let index = 0; index < 40; index += 1) {
        await page.keyboard.press('ArrowRight');
        await expectNavigationFocus(cell(page, 0, `readonly${index}`));
    }
    const last = cell(page, 0, 'readonly39');
    const box = await last.boundingBox();
    const holder = await grid(page).locator('.tabulator-tableholder').boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(holder.x);
    expect(box.x + box.width).toBeLessThanOrEqual(holder.x + holder.width + 1);
    await page.keyboard.press('ArrowDown');
    await expectNavigationFocus(cell(page, 1, 'readonly39'));
    await page.screenshot({ path: testInfo.outputPath('readonly-horizontal-focus.png') });
    await expect(grid(page).locator('.tabulator-editing, .tabulator-selected')).toHaveCount(0);
});

for (const mixed of [false, true]) {
    test(`managed column respects sequential row order and external boundaries (${mixed ? 'mixed' : 'readonly'})`, async ({ page }) => {
        await install(page, mixed);
        await tabIntoGrid(page);
        await page.keyboard.press('Shift+Tab');
        await expect(page.locator('#img11-before')).toBeFocused();
        await tabIntoGrid(page);
        await page.keyboard.press('ArrowDown');
        await expect(row(page, 1).locator('.amb-selection-column__input')).toBeFocused();
        await page.keyboard.press('Space');
        await page.keyboard.press('Tab');
        const destination = cell(page, 1, 'id');
        await expect(destination).toBeFocused();
        await expect(destination).not.toHaveClass(/tabulator-editing/);
        await page.keyboard.press('ArrowLeft');
        await expect(row(page, 1).locator('.amb-selection-column__input')).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(image(page, 0)).toBeFocused();
        await expect(row(page, 1)).toHaveClass(/tabulator-selected/);
        await expect(grid(page).locator('.tabulator-selected')).toHaveCount(1);
        await expect(viewer(page)).toHaveCount(0);
    });
}

test('mixed image controls preserve native activation, placeholders, focus and recreation', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await install(page, true);
    await tabIntoGrid(page);
    await page.keyboard.press('ArrowRight');
    await expect(cell(page, 0, 'id')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(cell(page, 0, 'name')).toBeFocused();
    await expect(grid(page).locator('.tabulator-editing')).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
    await expect(cell(page, 0, 'locked')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(grid(page).locator('.tabulator-editing')).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
    await expect(image(page, 0)).toBeFocused();
    for (const key of ['Enter', 'Space']) {
        await page.keyboard.press(key);
        await expect(viewer(page)).toHaveCount(1);
        await page.keyboard.press('ArrowRight');
        await expect(viewer(page).getByRole('status')).toContainText('Immagine 2 di 2');
        await page.keyboard.press('Escape');
        await expect(viewer(page)).toHaveCount(0);
        await expect(image(page, 0)).toBeFocused();
    }
    await page.keyboard.press('ArrowDown');
    await expect(cell(page, 1, 'images')).toBeFocused();
    for (const key of ['Enter', 'Space']) await page.keyboard.press(key);
    await expect(viewer(page)).toHaveCount(0);
    await expect(grid(page).locator('.tabulator-editing')).toHaveCount(0);
    await page.keyboard.press('ArrowDown');
    await expect(image(page, 2)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(cell(page, 1, 'images')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(image(page, 0)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(viewer(page)).toHaveCount(1);
    await page.evaluate(() => window.__img11.grid.destroy());
    await expect(viewer(page)).toHaveCount(0);
    await expect(page.locator('.amb-image-viewer-source')).toHaveCount(0);
    await page.evaluate(() => window.__img11.mount());
    await expect(grid(page).locator('.tabulator-row')).toHaveCount(3);
    await page.goto('/test/#img11-before');
    await tabIntoGrid(page);
    for (let index = 0; index < 4; index += 1) await page.keyboard.press('ArrowRight');
    await expect(image(page, 0)).toBeFocused();
    await expect(grid(page).locator('.tabulator-selected')).toHaveCount(0);
    await page.goto('/test/#img11-after');
    await expect(page.locator('#img11-after')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(image(page, 2)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#img11-after')).toBeFocused();
    expect(errors).toEqual([]);
});

test('sequential modes cross pages, skip readonly editing destinations and leave both grid boundaries', async ({ page }) => {
    await install(page, true, { pagination: true, extended: true });
    await cell(page, 1, 'locked').click();
    await expectNavigationFocus(cell(page, 1, 'locked'));
    await page.keyboard.press('Tab');
    await expectNavigationFocus(cell(page, 1, 'callbackLocked'));
    await page.keyboard.press('Tab');
    await expectNavigationFocus(cell(page, 1, 'images'));
    await page.keyboard.press('Tab');
    await expectNavigationFocus(cell(page, 1, 'controls'));
    await page.keyboard.press('Tab');
    await expect(cell(page, 0, 'id')).toHaveText('3');
    await expectNavigationFocus(cell(page, 0, 'id'));
    await page.keyboard.press('Shift+Tab');
    await expect(cell(page, 1, 'id')).toHaveText('2');
    await expectNavigationFocus(cell(page, 1, 'controls'));

    await cell(page, 1, 'name').click();
    await page.keyboard.press('Enter');
    await cell(page, 1, 'name').locator('input').fill('Two committed');
    await page.keyboard.press('Tab');
    await expect(cell(page, 0, 'name').locator('input')).toHaveValue('Three');
    await expect(cell(page, 0, 'name').locator('input')).toBeFocused();
    await expect(grid(page).locator('.tabulator-cell.tabulator-editing')).toHaveCount(1);
    await page.keyboard.press('Shift+Tab');
    await expect(cell(page, 1, 'name').locator('input')).toHaveValue('Two committed');
    await expect(cell(page, 1, 'name').locator('input')).toBeFocused();
    await page.keyboard.press('Escape');
    await expectNavigationFocus(cell(page, 1, 'name'));

    await cell(page, 0, 'id').click();
    await expectNavigationFocus(cell(page, 0, 'id'));
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#img11-before')).toBeFocused();
    await tabIntoGrid(page);
    await page.keyboard.press('Tab');
    await expectNavigationFocus(cell(page, 0, 'id'));
    await page.keyboard.press('Tab');
    await expectNavigationFocus(cell(page, 0, 'name'));
    await page.keyboard.press('Enter');
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#img11-before')).toBeFocused();
    await expect(grid(page).locator('.tabulator-cell.tabulator-editing')).toHaveCount(0);
    await cell(page, 1, 'name').click();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(cell(page, 0, 'name').locator('input')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#img11-after')).toBeFocused();
    await expect(grid(page).locator('.tabulator-selected')).toHaveCount(0);
});

test('custom sequential bindings preserve Navigation and use current editable callbacks in Editing', async ({ page }) => {
    await install(page, true, { extended: true, keyboardNavigation: { bindings: { next: 'Ctrl+ArrowRight', previous: 'Ctrl+ArrowLeft' } } });
    await cell(page, 0, 'name').click();
    await page.keyboard.press('Control+ArrowRight');
    await expectNavigationFocus(cell(page, 0, 'locked'));
    await page.keyboard.press('Control+ArrowRight');
    await expectNavigationFocus(cell(page, 0, 'callbackLocked'));
    await page.keyboard.press('Enter');
    await expect(grid(page).locator('.tabulator-cell.tabulator-editing')).toHaveCount(0);
    await page.evaluate(() => { window.__img11.allowDynamic = true; });
    await page.keyboard.press('Enter');
    await expect(cell(page, 0, 'callbackLocked').locator('input')).toBeFocused();
    await page.keyboard.press('Control+ArrowLeft');
    await expect(cell(page, 0, 'name').locator('input')).toBeFocused();
    await page.keyboard.press('Control+ArrowRight');
    await expect(cell(page, 0, 'callbackLocked').locator('input')).toBeFocused();
    await page.keyboard.press('Escape');
    await expectNavigationFocus(cell(page, 0, 'callbackLocked'));
    await page.evaluate(() => { window.__img11.allowDynamic = false; });
    await cell(page, 0, 'name').click();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Control+ArrowRight');
    await expect(cell(page, 1, 'name').locator('input')).toBeFocused();
    await expect(grid(page).locator('.tabulator-cell.tabulator-editing')).toHaveCount(1);
});
