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
            const title = heading.locator('h2');
            const guide = heading.locator('.demo-disclosure--technical');
            const body = guide.locator('.demo-disclosure__body');
            const launch = demo.locator('[data-action="tutorial-launch"]');
            await expect(subtitle).toBeVisible();
            await expect(title).toBeVisible();
            await expect(launch).not.toHaveAttribute('data-demo-tutorial-finished', '');
            await guide.locator('summary').click();
            await expect(guide).toHaveAttribute('open', '');
            await expect.poll(async () => {
                const [t, a, b] = await Promise.all([title.boundingBox(), subtitle.boundingBox(), body.boundingBox()]);
                return Boolean(t && a && b && a.y >= t.y + t.height - 1 && b.y >= a.y + a.height - 1 && b.height > 0);
            }).toBe(true);
            expect(await subtitle.evaluate((element, target) => Boolean(element.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING), await guide.elementHandle())).toBe(true);
        });
    }

    test(`JavaScript demo keeps title, description, controls and panels in order at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/src/demo/index.html#getting-started-javascript');
        const demo = page.locator('#javascript-demo');
        const title = demo.locator('.demo-app-shell__meta h2');
        const description = demo.locator('.demo-main-description');
        const launch = demo.locator('[data-action="tutorial-launch"]');
        const guide = demo.locator('.demo-disclosure--technical');
        const summary = guide.locator('summary');
        await expect(launch).toBeVisible();
        await summary.click();
        const body = guide.locator('.demo-disclosure__body');
        await expect.poll(async () => {
            const [t, d, l, s, b] = await Promise.all([title.boundingBox(), description.boundingBox(), launch.boundingBox(), summary.boundingBox(), body.boundingBox()]);
            if (!t || !d || !l || !s || !b) return false;
            const commandsFollowTitle = width <= 760 ? l.y >= t.y + t.height - 1 : l.x >= t.x + t.width - 1;
            const ordered = width <= 600 ? s.y >= l.y + l.height - 1 : s.x >= l.x + l.width - 1;
            return commandsFollowTitle && ordered && d.y >= Math.max(t.y + t.height, l.y + l.height, s.y + s.height) - 1
                && b.y >= d.y + d.height - 1 && b.height > 0;
        }).toBe(true);
        await launch.click();
        const tutorial = demo.locator('#javascript-inventory-tutorial');
        await expect(tutorial).toBeVisible();
        expect(await summary.evaluate((element, shell) => Math.abs(element.getBoundingClientRect().right - shell.getBoundingClientRect().right
            + parseFloat(getComputedStyle(shell).paddingRight)) < 2, await demo.locator('.demo-app-shell').elementHandle())).toBe(true);
        const instruction = tutorial.locator('.demo-action-tutorial__instruction');
        const strong = instruction.locator('strong').first();
        await expect(strong).toBeVisible();
        await expect(instruction).toHaveCSS('font-size', '16px');
        await expect(instruction).toHaveCSS('font-weight', '500');
        await expect(instruction).toHaveCSS('color', 'rgb(24, 59, 99)');
        await expect(strong).toHaveCSS('font-weight', '750');
        await expect(strong).toHaveCSS('color', 'rgb(15, 39, 71)');
        await expect.poll(async () => {
            const [b, t, grid] = await Promise.all([body.boundingBox(), tutorial.boundingBox(), demo.locator('.demo-table-workbench').boundingBox()]);
            return Boolean(b && t && grid && t.y >= b.y + b.height - 1 && grid.y >= t.y + t.height - 1);
        }).toBe(true);
    });
}
