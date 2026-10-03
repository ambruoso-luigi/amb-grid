import { expect, test } from '@playwright/test';

test('keeps the shared navbar sticky and remounts the React demo', async ({ page }) => {
    await page.goto('/');
    const navbar = page.locator('#site-navbar');
    const demoMenu = navbar.locator('#site-navbar-demo-menu');

    await expect(navbar).toBeVisible();
    await expect(page.locator('.demo-hero__brand .demo-brand__logo')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(navbar).toBeInViewport();
    await expect.poll(() => navbar.evaluate(element => Math.round(element.getBoundingClientRect().top))).toBe(0);

    await navbar.getByRole('button', { name: /Demo/ }).click();
    await demoMenu.getByRole('link', { name: 'React' }).click();
    await expect(page.locator('.react-hero-brand img[alt="AMB Grid"]')).toBeVisible();
    await expect(page.locator('.react-demo-grid')).toBeVisible();
    await expect(navbar).toBeVisible();

    await navbar.getByRole('link', { name: 'Home' }).click();
    await expect(page.locator('.demo-hero__brand .demo-brand__logo')).toBeVisible();
    await navbar.getByRole('button', { name: /Demo/ }).click();
    await expect(navbar.getByRole('button', { name: /Demo/ })).toHaveAttribute('aria-expanded', 'true');
    await page.locator('.demo-hero').click();
    await expect(navbar.getByRole('button', { name: /Demo/ })).toHaveAttribute('aria-expanded', 'false');
    await navbar.getByRole('button', { name: /Demo/ }).click();
    await page.keyboard.press('Escape');
    await expect(navbar.getByRole('button', { name: /Demo/ })).toHaveAttribute('aria-expanded', 'false');
    await navbar.getByRole('button', { name: /Demo/ }).click();
    await demoMenu.getByRole('link', { name: 'React' }).click();
    await expect(page.locator('.react-demo-grid')).toBeVisible();
});

test('lays out the desktop navigation and dropdown without overlaps', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const navbar = page.locator('#site-navbar');
    const demoMenu = navbar.locator('#site-navbar-demo-menu');
    await expect(navbar).toBeVisible();
    await expect.poll(() => navbar.evaluate(element => {
        const inner = element.querySelector('.site-navbar__inner').getBoundingClientRect();
        const logo = element.querySelector('.demo-brand').getBoundingClientRect();
        const navigation = element.querySelector('.site-navbar__main-nav').getBoundingClientRect();
        const utilities = element.querySelector('.site-navbar__utilities').getBoundingClientRect();
        return {
            height: Math.round(inner.height),
            sameRow: [logo, navigation, utilities].every(rect => Math.abs((rect.top + rect.height / 2) - (inner.top + inner.height / 2)) < 2),
            ordered: logo.right < navigation.left && navigation.right < utilities.left,
            distributed: navigation.width > 480
        };
    })).toEqual({ height: 69, sameRow: true, ordered: true, distributed: true });
    await expect(navbar.getByRole('link', { name: 'GitHub' })).toHaveCount(1);
    await expect(navbar.getByRole('link', { name: 'GitHub' })).not.toContainText('GitHub');
    await expect(navbar.locator('.language-switch__flag')).toHaveCount(0);

    await navbar.getByRole('button', { name: /Demo/ }).click();
    const rows = demoMenu.locator(':scope > a, :scope > .site-navbar__dropdown-item');
    await expect(rows).toHaveCount(5);
    const geometry = await demoMenu.evaluate(menu => {
        const bounds = menu.getBoundingClientRect();
        return [...menu.children].map(row => {
            const icon = row.querySelector('.site-navbar__dropdown-icon').getBoundingClientRect();
            const label = row.querySelector('.site-navbar__dropdown-label').getBoundingClientRect();
            const rect = row.getBoundingClientRect();
            return { bottom: rect.bottom, height: rect.height, iconHeight: icon.height, iconRight: icon.right, labelLeft: label.left, right: rect.right };
        }).map((row, index, all) => ({ ...row, withinMenu: row.right <= bounds.right, separate: index === 0 || all[index - 1].bottom <= row.bottom - row.height }));
    });
    geometry.forEach(row => {
        expect(row.height).toBeCloseTo(40, 3);
        expect(row.iconHeight).toBeLessThanOrEqual(18);
        expect(row.iconRight).toBeLessThanOrEqual(row.labelLeft);
        expect(row.withinMenu).toBe(true);
        expect(row.separate).toBe(true);
    });

    await navbar.getByRole('button', { name: 'English' }).click();
    await navbar.getByRole('button', { name: /Demo/ }).click();
    await expect(rows).toHaveCount(5);
    await expect.poll(() => rows.evaluateAll(items => items.map(item => Math.round(item.getBoundingClientRect().height)))).toEqual([40, 40, 40, 40, 40]);
});
