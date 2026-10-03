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
