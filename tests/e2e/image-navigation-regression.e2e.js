import { expect, test } from '@playwright/test';

const grid = page => page.locator('#img11-grid');
const row = (page, index) => grid(page).locator('.tabulator-row').nth(index);
const cell = (page, index, field) => row(page, index).locator(`[tabulator-field="${field}"]`);
const image = (page, index) => cell(page, index, 'images').locator('.amb-image--viewable');
const viewer = page => page.getByRole('dialog', { name: 'Raccolta immagini' });

const install = async (page, mixed) => {
    await page.route('**/__img11__/**', route => route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="480" height="320" fill="#557a9b"/></svg>'
    }));
    await page.goto('/test/');
    await expect(page.locator('#image-secondary-test-table .tabulator-row')).toHaveCount(2);
    await page.evaluate(async mixed => {
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
                data: [
                    { id: 1, name: 'One', locked: 'Locked', images: [photo, { ...photo, src: '/__img11__/two.svg' }] },
                    { id: 2, name: 'Two', locked: 'Locked', images: null },
                    { id: 3, name: 'Three', locked: 'Locked', images: photo }
                ],
                columns: [
                    { title: 'Passive ID', field: 'id' },
                    { title: 'Name', field: 'name', ...(mixed ? { editor: AMB.editors.text() } : {}) },
                    { title: 'Explicit readonly', field: 'locked', editable: false, ...(mixed ? { editor: AMB.editors.text() } : {}) },
                    { title: 'Images', field: 'images', formatter: AMB.formatters.image() }
                ]
            });
        };
        window.__img11 = { mount };
        mount();
    }, mixed);
    await expect(grid(page).locator('.tabulator-row')).toHaveCount(3);
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
        const destination = cell(page, 1, mixed ? 'name' : 'id');
        if (mixed) {
            await expect(destination).toHaveClass(/tabulator-editing/);
            await page.keyboard.press('Escape');
        }
        await expect(destination).toBeFocused();
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
    await expect(cell(page, 0, 'name')).toBeFocused();
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
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
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
