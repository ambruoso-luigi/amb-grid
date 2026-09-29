import { expect, test } from '@playwright/test';

test('opens the installation page from home and preserves English', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Install AMB Grid|Installa AMB Grid/ }).click();
    await expect(page).toHaveURL(/\/install\/$/);
    await expect(page.locator('.demo-topbar')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Bring AMB Grid|Porta AMB Grid/ })).toBeVisible();
    await expect(page.getByText('Standalone / ZIP', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'EN' }).click();
    await expect(page.getByRole('heading', { name: 'Bring AMB Grid into your project' })).toBeVisible();
    await page.locator('.demo-topbar .demo-brand').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
