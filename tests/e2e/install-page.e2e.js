import { expect, test } from '@playwright/test';

test('shows the English installation hero and preserves language navigation', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('amb-grid-demo-language', 'en'));
    await page.goto('/install/');
    await expect(page.locator('#site-navbar')).toBeVisible();
    await expect(page.locator('.installation-hero')).toBeVisible();
    await expect(page.locator('.installation-hero .demo-brand__logo')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Install AMB Grid' })).toBeVisible();
    await expect(page.getByText('INSTALLATION & DOWNLOAD', { exact: true })).toHaveCount(0);
    await expect(page.locator('.installation-hero').getByRole('link', { name: 'npm / ESM' })).toBeVisible();
    await expect(page.locator('.installation-hero').getByRole('link', { name: 'Download standalone bundle' })).toBeVisible();
    await expect(page.locator('.installation-video-preview')).toHaveCount(1);
    await expect(page.locator('.installation-video-preview')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=2qhXHt0Upps');
    expect(await page.locator('.installation-video-preview').evaluate(element => element.tagName)).toBe('A');
    await expect(page.getByText('Standalone / ZIP', { exact: true })).toBeVisible();
    await page.locator('.installation-hero').getByRole('link', { name: 'npm / ESM' }).click();
    await expect(page.locator('#npm')).toBeVisible();
    await expect(page.getByText('Package not yet published on npm.', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Standalone installation' })).toBeVisible();
    await page.locator('#site-navbar .demo-brand').click();
    await expect(page).toHaveURL(/\/#top$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
