import { expect, test } from '@playwright/test';

const grid = page => page.locator('#image-preview-viewer-table');
const viewer = page => page.getByRole('dialog', { name: 'Raccolta immagini' });
const status = page => viewer(page).locator('.amb-image-viewer-status');
const row = (page, id) => grid(page).locator('.tabulator-row').filter({
    has: page.locator('[tabulator-field="id"]', { hasText: id })
});
const image = (page, id) => row(page, id).locator('[tabulator-field="images"] button.amb-image--viewable');
const tutorial = page => page.locator('#feature-example .demo-action-tutorial');
const launch = page => page.locator('#feature-example [data-action="tutorial-launch"]');
const openExample = async page => {
    await page.goto('/src/demo/index.html#feature-examples');
    await page.locator('[data-example="image-preview-viewer"]').click();
    await expect(grid(page).locator('.tabulator-row')).toHaveCount(3);
};
const galleries = [
    { id: 'CITY-001', badge: '+3', count: 4, subject: 'Grandi città del mondo',
        captions: ['New York — Dal Brooklyn Bridge Park', 'Tokyo — Nel cuore di Shibuya',
            'Hong Kong — Nel vivace quartiere di Mong Kok', 'Osaka — Nel cuore di Dotonbori'] },
    { id: 'SEA-001', badge: '+4', count: 5, subject: 'Mare e vacanze italiane',
        captions: ['Cala Brandinchi — Conosciuta', 'Fiordo di Furore — Un angolo spettacolare',
            'Rotonda a Mare — Simbolo di Senigallia', 'Le Due Sorelle — Davanti alla costa',
            'Atrani — Un piccolo gioiello'] },
    { id: 'RETRO-001', badge: '+3', count: 4, subject: "Oggetti vintage anni '80",
        captions: ['Italia — Una rilettura', "Sony Walkman — Negli anni '80",
            'Commodore 64 — Il computer che ha portato', 'Motorola DynaTAC 8000X — Nel 1983'] }
];

test('shows three readonly collections with thirteen captions and bounded galleries', async ({ page }) => {
    await openExample(page);
    await expect(page.locator('#feature-example .tabulator')).toHaveCount(1);
    await expect(grid(page).locator('.tabulator-col')).toHaveCount(4);
    expect(await grid(page).locator('.tabulator-col[tabulator-field]').evaluateAll(columns => columns.map(column => column.getAttribute('tabulator-field'))))
        .toEqual(['id', 'subject', 'images', 'description']);
    await expect(grid(page).locator('button.amb-image--viewable')).toHaveCount(3);
    await expect(grid(page).locator('.tabulator-editing')).toHaveCount(0);
    await expect(launch(page)).toBeVisible();
    await expect(tutorial(page)).toBeHidden();
    for (const gallery of galleries) {
        await expect(row(page, gallery.id)).toContainText(gallery.subject);
        await expect(image(page, gallery.id).locator('.amb-image-count')).toHaveText(gallery.badge);
    }
    const holder = grid(page).locator('.tabulator-tableholder');
    expect(await holder.evaluate(element => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
    await image(page, 'CITY-001').hover();
    await expect(page.locator('.amb-image-preview')).toBeVisible();
    await expect(page.locator('.amb-image-preview img')).toHaveJSProperty('naturalWidth', 1916);
    for (const gallery of galleries) {
        await image(page, gallery.id).click();
        for (const [index, caption] of gallery.captions.entries()) {
            await expect(status(page)).toContainText('Immagine ' + (index + 1) + ' di ' + gallery.count);
            await expect(status(page)).toContainText(caption);
            if (index < gallery.count - 1) await page.keyboard.press('ArrowRight');
        }
        await page.keyboard.press('ArrowRight');
        await expect(status(page)).toContainText('Immagine ' + gallery.count + ' di ' + gallery.count);
        await page.keyboard.press('Escape');
        await expect(viewer(page)).toHaveCount(0);
    }
    await expect.poll(() => page.evaluate(() => {
        const table = document.querySelector('#image-preview-viewer-table');
        return table === document.activeElement || table.contains(document.activeElement);
    })).toBe(true);
    await image(page, 'RETRO-001').focus();
    await page.keyboard.press('Enter');
    await expect(status(page)).toContainText('Immagine 1 di 4');
    await page.keyboard.press('Escape');
});

test('advances only after New York then Tokyo and the Fiordo di Furore', async ({ page }) => {
    await openExample(page);
    await launch(page).click();
    await expect(tutorial(page)).toBeVisible();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('1 di 2');
    await expect(tutorial(page).locator('.demo-action-tutorial__progress li')).toHaveCount(2);
    await expect(tutorial(page).locator('.demo-action-tutorial__instruction')).toContainText('Grandi città del mondo');
    await expect(image(page, 'CITY-001')).toHaveClass(/demo-crud-tutorial-target--rays/);
    await image(page, 'SEA-001').click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');
    await image(page, 'CITY-001').click();
    await page.keyboard.press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');
    await image(page, 'CITY-001').click();
    await expect(status(page)).toContainText('New York — Dal Brooklyn Bridge Park');
    await page.keyboard.press('ArrowRight');
    await expect(status(page)).toContainText('Tokyo — Nel cuore di Shibuya');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');
    await page.keyboard.press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-portrait');
    await expect(image(page, 'SEA-001')).toHaveClass(/demo-crud-tutorial-target--rays/);
    await expect(image(page, 'CITY-001')).not.toHaveClass(/demo-crud-tutorial-target--pulse/);
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('2 of 2');
    await expect(tutorial(page).locator('.demo-action-tutorial__instruction')).toContainText('Fiordo di Furore');
    await expect(row(page, 'SEA-001')).toContainText('Italian seaside and holidays');
    await image(page, 'RETRO-001').click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-portrait');
    await image(page, 'SEA-001').click();
    await page.keyboard.press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-portrait');
    await image(page, 'SEA-001').click();
    await page.keyboard.press('ArrowRight');
    await expect(status(page)).toContainText('Fiordo di Furore — A spectacular corner of the Amalfi Coast');
    await expect(viewer(page).locator('.viewer-canvas img')).toHaveJSProperty('naturalWidth', 1122);
    await expect(viewer(page).locator('.viewer-canvas img')).toHaveJSProperty('naturalHeight', 1402);
    await page.keyboard.press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'complete');
    await expect(tutorial(page).locator('.demo-action-tutorial__instruction')).toContainText('New York and Tokyo');
    await tutorial(page).locator('[data-tutorial-action="open-guide"]').click();
    await expect(tutorial(page)).toBeHidden();
    await expect(page.locator('#feature-example details.demo-disclosure')).toHaveAttribute('open');
    await expect(launch(page)).toBeVisible();
});

test('supports close, reopen, restart and cleanup across examples', async ({ page }) => {
    await openExample(page);
    await launch(page).click();
    await tutorial(page).locator('[data-tutorial-action="skip"]').click();
    await expect(tutorial(page)).toBeHidden();
    await image(page, 'CITY-001').click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');
    await launch(page).click();
    await expect(tutorial(page)).toBeVisible();
    await tutorial(page).locator('[data-tutorial-action="restart"]').click();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');
    await page.locator('[data-example="validation"]').click();
    await expect(page.locator('#validation-table')).toBeVisible();
    await expect(page.locator('#feature-example .demo-action-tutorial')).toHaveCount(1);
    await expect(page.locator('.amb-image-preview, .amb-image-viewer-source')).toHaveCount(0);
    await page.locator('[data-example="image-preview-viewer"]').click();
    await expect(grid(page).locator('.tabulator-row')).toHaveCount(3);
    await expect(tutorial(page)).toBeHidden();
    await image(page, 'CITY-001').click();
    await expect(viewer(page)).toBeVisible();
    await page.evaluate(() => document.querySelector('[data-example="validation"]').click());
    await expect(viewer(page)).toHaveCount(0);
    await expect(page.locator('.amb-image-preview, .amb-image-viewer-source')).toHaveCount(0);
    await expect(grid(page)).toHaveCount(0);
});

test('updates collection text and later viewer captions after a language change', async ({ page }) => {
    await openExample(page);
    const trigger = page.locator('#feature-example [data-action="demo-command-guide"]');
    await trigger.click();
    const guide = page.locator('#feature-example .demo-command-guide');
    await expect(guide).toBeVisible();
    await expect(guide.getByRole('tab')).toHaveCount(2);
    await expect(guide).toContainText('Immagini e viewer');
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(guide).toContainText('Images and viewer');
    await expect(row(page, 'CITY-001')).toContainText('Great cities of the world');
    await expect(row(page, 'CITY-001')).toContainText('Skylines, metropolises');
    await expect(grid(page).locator('.tabulator-col[tabulator-field="description"]')).toContainText('Description');
    await expect(image(page, 'CITY-001').locator('img')).toHaveAttribute('alt', 'Brooklyn Bridge and the Manhattan skyline');
    await trigger.click();
    await image(page, 'CITY-001').click();
    await expect(status(page)).toContainText('New York — From Brooklyn Bridge Park');
    await page.keyboard.press('ArrowRight');
    await expect(status(page)).toContainText('Tokyo — In the heart of Shibuya');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Italiano', exact: true }).click();
    await expect(row(page, 'SEA-001')).toContainText('Mare e vacanze italiane');
    await image(page, 'SEA-001').click();
    await page.keyboard.press('ArrowRight');
    await expect(status(page)).toContainText('Fiordo di Furore — Un angolo spettacolare');
    await page.keyboard.press('Escape');
});

test('retains native zoom and mouse pan', async ({ page }) => {
    await openExample(page);
    await image(page, 'CITY-001').click();
    await expect(viewer(page)).toBeVisible();
    const ratio = () => page.evaluate(() => document.querySelector('.amb-image-viewer-source')?.viewer?.imageData?.ratio);
    const initial = await ratio();
    await viewer(page).locator('.viewer-toolbar [data-viewer-action="zoom-in"]').click();
    await expect.poll(ratio).toBeGreaterThan(initial);
    await viewer(page).locator('.viewer-toolbar [data-viewer-action="one-to-one"]').click();
    const canvasImage = viewer(page).locator('.viewer-canvas img');
    const before = await page.evaluate(() => document.querySelector('.amb-image-viewer-source').viewer.imageData.x);
    const box = await canvasImage.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    const after = await page.evaluate(() => document.querySelector('.amb-image-viewer-source').viewer.imageData.x);
    expect(after).not.toBeCloseTo(before, 0);
    await page.keyboard.press('Escape');
});

for (const width of [1440, 768, 390]) {
    test('keeps the photo table and viewer usable at ' + width + 'px', async ({ page }) => {
        await page.setViewportSize({ width, height: 820 });
        await openExample(page);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        const holder = grid(page).locator('.tabulator-tableholder');
        if (width === 390) expect(await holder.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
        const thumbnail = image(page, 'CITY-001').locator('img');
        await expect(thumbnail).toHaveJSProperty('naturalWidth', 1916);
        expect(await thumbnail.evaluate(element => getComputedStyle(element).objectFit)).toBe('contain');
        await image(page, 'CITY-001').click();
        await expect(viewer(page)).toBeVisible();
        const box = await viewer(page).boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(-1);
        expect(box.y).toBeGreaterThanOrEqual(-1);
        expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
        expect(box.y + box.height).toBeLessThanOrEqual(821);
        await page.keyboard.press('Escape');
    });
}
