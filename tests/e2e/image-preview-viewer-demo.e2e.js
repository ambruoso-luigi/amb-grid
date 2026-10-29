import { expect, test } from '@playwright/test';

const grid = page => page.locator('#image-preview-viewer-table');
const viewer = page => page.getByRole('dialog', { name: 'Raccolta immagini' });
const row = (page, id) => grid(page).locator('.tabulator-row').filter({
    has: page.locator('[tabulator-field="id"]', { hasText: id })
});
const image = (page, id) => row(page, id).locator('[tabulator-field="images"] button.amb-image--viewable');
const tutorial = page => page.locator('#feature-example .demo-action-tutorial');
const openExample = async page => {
    await page.goto('/src/demo/index.html#feature-examples');
    await page.locator('[data-example="image-preview-viewer"]').click();
    await expect(grid(page).locator('.tabulator-row')).toHaveCount(7);
};

test('shows one read-only photo grid with previews and bounded galleries', async ({ page }) => {
    await openExample(page);
    await expect(page.locator('#feature-example .tabulator')).toHaveCount(1);
    await expect(grid(page).locator('.tabulator-col')).toHaveCount(4);
    await expect(grid(page).locator('button.amb-image--viewable')).toHaveCount(7);
    await expect(grid(page).locator('.tabulator-editing')).toHaveCount(0);
    await expect(page.locator('#feature-example [data-action]')).toHaveCount(1);
    await expect(page.locator('#feature-example details.demo-disclosure')).not.toHaveAttribute('open');
    await expect(row(page, 'TRV-001')).toContainText('Orizzonti alpini');
    await expect(row(page, 'CITY-003')).toContainText('Passeggiata nel borgo');
    await expect(image(page, 'TRV-001').locator('.amb-image-count')).toHaveText('+2');
    await image(page, 'TRV-001').hover();
    await expect(page.locator('.amb-image-preview')).toBeVisible();
    await expect(page.locator('.amb-image-preview img')).toHaveJSProperty('naturalWidth', 1600);
    await image(page, 'TRV-001').click();
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 1 di 3');
    await page.keyboard.press('ArrowRight');
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 2 di 3');
    await page.keyboard.press('ArrowRight');
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 3 di 3');
    await page.keyboard.press('ArrowRight');
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 3 di 3');
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => {
        const table = document.querySelector('#image-preview-viewer-table');
        return table === document.activeElement || table.contains(document.activeElement);
    })).toBe(true);
    await image(page, 'CITY-001').focus();
    await page.keyboard.press('Enter');
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 1 di 2');
    await page.keyboard.press('ArrowRight');
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 2 di 2');
    await page.keyboard.press('Escape');
    await expect(grid(page).locator('.tabulator-row')).toHaveCount(7);
});

test('advances only after a verified gallery change and viewer closure', async ({ page }) => {
    await openExample(page);
    await expect(tutorial(page)).toBeVisible();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('1 di 2');
    await expect(tutorial(page).locator('.demo-action-tutorial__progress li')).toHaveCount(2);
    await expect(tutorial(page).locator('.demo-action-tutorial__instruction')).toContainText('Orizzonti alpini');

    await image(page, 'TRV-003').click();
    await page.keyboard.press('ArrowRight');
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 2 di 2');
    await page.keyboard.press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');

    await image(page, 'TRV-001').click();
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 1 di 3');
    await page.keyboard.press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');

    await image(page, 'TRV-001').click();
    await page.keyboard.press('ArrowRight');
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 2 di 3');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');
    await page.keyboard.press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-portrait');
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('2 di 2');

    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-portrait');
    await expect(tutorial(page).locator('.demo-action-tutorial__counter')).toHaveText('2 of 2');
    await expect(tutorial(page).locator('.demo-action-tutorial__instruction')).toContainText('Nature and Villages');
    await image(page, 'CITY-003').click();
    await page.keyboard.press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-portrait');
    await image(page, 'TRV-002').click();
    await expect(viewer(page).locator('.viewer-canvas img')).toHaveJSProperty('naturalWidth', 800);
    await expect(viewer(page).locator('.viewer-canvas img')).toHaveJSProperty('naturalHeight', 1200);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-portrait');
    await page.keyboard.press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'complete');
    await expect(tutorial(page).locator('.demo-action-tutorial__instruction')).toHaveText('Tutorial complete. You explored galleries and photos with different aspect ratios.');
    await tutorial(page).locator('[data-tutorial-action="restart"]').click();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');
    await image(page, 'TRV-001').click();
    await page.keyboard.press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');
});

test('supports skip, reopen, restart, cleanup and viewer reuse', async ({ page }) => {
    await openExample(page);
    await tutorial(page).locator('[data-tutorial-action="skip"]').click();
    await expect(tutorial(page).locator('.demo-action-tutorial__bar')).toBeHidden();
    await image(page, 'TRV-001').click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');
    await tutorial(page).locator('[data-tutorial-action="reopen"]').click();
    await expect(tutorial(page).locator('.demo-action-tutorial__bar')).toBeVisible();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');
    await tutorial(page).locator('[data-tutorial-action="restart"]').click();
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');

    await page.evaluate(() => document.querySelector('[data-example="validation"]').click());
    await expect(page.locator('#validation-table')).toBeVisible();
    await expect(tutorial(page)).toHaveCount(1);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'create-anomalies');
    await page.locator('[data-example="image-preview-viewer"]').click();
    await expect(tutorial(page)).toHaveCount(1);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');
    await image(page, 'TRV-001').click();
    await expect(viewer(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
    await expect(tutorial(page)).toHaveAttribute('data-tutorial-step', 'explore-gallery');
});

test('uses the shared readonly command guide in Italian and English and cleans up on remount', async ({ page }) => {
    await openExample(page);
    const trigger = page.locator('#feature-example [data-action="demo-command-guide"]');
    await expect(trigger).toBeVisible();
    await trigger.click();
    const guide = page.locator('#feature-example .demo-command-guide');
    await expect(guide).toBeVisible();
    await expect(guide.getByRole('tab')).toHaveCount(2);
    await expect(guide).toContainText('Immagini e viewer');
    await expect(guide).not.toContainText('Modifica');
    await expect(guide).not.toContainText('Checkbox');
    await expect(guide).not.toContainText('Lookup');
    await guide.getByRole('tab', { name: 'Immagini e viewer' }).click();
    await expect(guide).toContainText('Chiude il visualizzatore');
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(guide).toContainText('Images and viewer');
    await expect(guide).toContainText('Closes the viewer');
    await expect(guide).not.toContainText('Editing');
    await expect(row(page, 'CITY-001')).toContainText('Skyline and bridges');
    await expect(row(page, 'CITY-001')).toContainText('City panorama');
    await expect(grid(page).locator('.tabulator-col[tabulator-field="description"]')).toContainText('Description');
    await expect(image(page, 'TRV-001').locator('img')).toHaveAttribute('alt', 'Alpine lake and snow-covered mountains');
    await trigger.click();
    await expect(guide).not.toBeVisible();
    await image(page, 'CITY-001').click();
    await expect(viewer(page)).toBeVisible();
    await page.evaluate(() => document.querySelector('[data-example="validation"]').click());
    await expect(viewer(page)).toHaveCount(0);
    await expect(page.locator('.amb-image-preview, .amb-image-viewer-source')).toHaveCount(0);
    await expect(page.locator('#feature-example .demo-command-guide')).toHaveCount(0);
    await expect(grid(page)).toHaveCount(0);
    await page.locator('[data-example="image-preview-viewer"]').click();
    await expect(grid(page).locator('.tabulator-row')).toHaveCount(7);
    await expect(page.locator('#feature-example .tabulator')).toHaveCount(1);
    await image(page, 'TRV-002').click();
    await expect(viewer(page).getByRole('status')).toContainText('Immagine 1 di 2');
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
    test(`keeps the photo table and viewer usable at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 820 });
        await openExample(page);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        const holder = grid(page).locator('.tabulator-tableholder');
        if (width === 390) expect(await holder.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
        const thumbnail = image(page, 'TRV-001').locator('img');
        await expect(thumbnail).toHaveJSProperty('naturalWidth', 320);
        expect(await thumbnail.evaluate(element => getComputedStyle(element).objectFit)).toBe('contain');
        const photoWidth = await thumbnail.evaluate(element => {
            const photo = element.getBoundingClientRect();
            const table = element.closest('.demo-image-grid').getBoundingClientRect();
            return Math.min(photo.right, table.right) - Math.max(photo.left, table.left);
        });
        expect(photoWidth).toBeGreaterThan(90);
        await image(page, 'TRV-001').click();
        await expect(viewer(page)).toBeVisible();
        const box = await viewer(page).boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(-1);
        expect(box.y).toBeGreaterThanOrEqual(-1);
        expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
        expect(box.y + box.height).toBeLessThanOrEqual(821);
        await page.keyboard.press('Escape');
    });
}
