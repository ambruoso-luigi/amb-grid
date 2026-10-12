import { expect, test } from '@playwright/test';

test('shows the English installation hero and preserves language navigation', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('amb-grid-demo-language', 'en'));
    await page.goto('/install/');
    await expect(page.locator('#site-navbar')).toBeVisible();
    await expect(page.locator('.installation-hero')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bring AMB Grid into your project' })).toBeVisible();
    await expect(page.locator('.installation-hero').getByRole('link', { name: 'npm / ESM' })).toBeVisible();
    await expect(page.locator('.installation-hero').getByRole('link', { name: 'Download standalone bundle' })).toBeVisible();
    await expect(page.getByText('Installation video coming soon', { exact: true })).toBeVisible();
    await expect(page.locator('.installation-video-preview')).toHaveCount(1);
    expect(await page.locator('.installation-video-preview').evaluate(element => element.tagName)).toBe('ASIDE');
    await expect(page.getByText('Standalone / ZIP', { exact: true })).toBeVisible();
    await page.locator('#site-navbar .demo-brand').click();
    await expect(page).toHaveURL(/\/#top$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
