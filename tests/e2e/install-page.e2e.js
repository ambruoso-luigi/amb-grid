import { expect, test } from '@playwright/test';

test('opens the installation page from home and preserves English', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /^Installation$|^Installazione$/ }).click();
    await expect(page).toHaveURL(/\/install\/$/);
    await expect(page.locator('#site-navbar')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Bring AMB Grid|Porta AMB Grid/ })).toBeVisible();
    await expect(page.getByText('Standalone / ZIP', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.getByRole('heading', { name: 'Bring AMB Grid into your project' })).toBeVisible();
    await page.locator('#site-navbar .demo-brand').click();
    await expect(page).toHaveURL(/\/#top$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
