import { expect, test } from '@playwright/test';

test('keeps the shared navbar sticky and remounts the React demo', async ({ page }) => {
    await page.goto('/');
    const navbar = page.locator('#site-navbar');

    await expect(navbar).toBeVisible();
    await expect(page.locator('.demo-hero__brand .demo-brand__logo')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(navbar).toBeInViewport();
    await expect(navbar).toHaveJSProperty('offsetTop', 0);

    await page.getByRole('button', { name: /Demo/ }).click();
    await page.getByRole('link', { name: 'React' }).click();
    await expect(page.locator('.react-hero-brand img[alt="AMB Grid"]')).toBeVisible();
    await expect(page.locator('.react-demo-grid')).toBeVisible();
    await expect(navbar).toBeVisible();

    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page.locator('.demo-hero__brand .demo-brand__logo')).toBeVisible();
    await page.getByRole('button', { name: /Demo/ }).click();
    await page.getByRole('link', { name: 'React' }).click();
    await expect(page.locator('.react-demo-grid')).toBeVisible();
});
