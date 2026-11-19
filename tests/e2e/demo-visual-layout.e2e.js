import { expect, test } from '@playwright/test';

for (const width of [1280, 760, 480]) {
    for (const name of ['crud-row-states', 'validation', 'autocomplete', 'multifield-lookup', 'column-calculations', 'dates']) {
        test(`${name} keeps its subtitle above the technical guide at ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await page.goto('/src/demo/index.html#feature-examples');
            await page.locator(`[data-example="${name}"]`).click();
            const demo = page.locator('#feature-example');
            const heading = demo.locator('.demo-crud-heading');
            const subtitle = heading.locator(':scope > .demo-note');
            const guide = heading.locator('.demo-disclosure--technical');
            const body = guide.locator('.demo-disclosure__body');
            const launch = demo.locator('[data-action="tutorial-launch"]');
            await expect(subtitle).toBeVisible();
            await expect(launch).not.toHaveAttribute('data-demo-tutorial-finished', '');
            await guide.locator('summary').click();
            await expect(guide).toHaveAttribute('open', '');
            await expect.poll(async () => {
                const [a, b] = await Promise.all([subtitle.boundingBox(), body.boundingBox()]);
                return Boolean(a && b && b.y >= a.y + a.height - 1 && b.height > 0);
            }).toBe(true);
            expect(await subtitle.evaluate((element, target) => Boolean(element.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING), await guide.elementHandle())).toBe(true);
        });
    }
}
