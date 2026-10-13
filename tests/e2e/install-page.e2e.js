import { expect, test } from '@playwright/test';

test('shows the English installation flow and its links', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('amb-grid-demo-language', 'en'));
    await page.goto('/install/');
    const hero = page.locator('.installation-hero');
    await expect(page.locator('#site-navbar')).toBeVisible();
    await expect(hero.locator('.demo-brand__logo')).toBeVisible();
    await expect(hero.getByRole('heading', { name: 'Install AMB Grid' })).toBeVisible();
    await expect(page.locator('.installation-video-preview')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=2qhXHt0Upps');
    expect(await page.locator('.installation-page').evaluate(element => getComputedStyle(element).paddingLeft)).toBe('0px');
    expect(await page.locator('.installation-page').evaluate(element => getComputedStyle(element).paddingRight)).toBe('0px');

    await expect(page.getByText('Two modes, one API')).toBeVisible();
    const modern = page.locator('#npm');
    const standalone = page.locator('#standalone');
    await expect(modern.getByRole('heading', { name: 'Modern JavaScript / npm' })).toBeVisible();
    await expect(standalone.getByRole('heading', { name: 'Browser / standalone' })).toBeVisible();
    await expect(modern.locator('pre').first()).toContainText('npm install amb-grid');
    await expect(modern.locator('pre').last()).toContainText("import { AMB } from 'amb-grid'");
    await expect(modern.locator('pre').last()).toContainText("import 'amb-grid/style.css'");
    await expect(standalone.locator('pre').first()).toContainText('amb-grid.css');
    await expect(standalone.locator('pre').first()).toContainText('amb-grid.umd.js');
    await expect(standalone.locator('pre').last()).toContainText('AMB.table');
    await expect(standalone.locator('.demo-guide-mode-note')).toBeVisible();
    await expect(standalone.getByRole('link', { name: 'Download standalone bundle →' })).toHaveAttribute('href', /releases\/download\/v0\.7\.0\/amb-grid-legacy-0\.7\.0\.zip$/);
    await expect(standalone.locator('.installation-bundle')).toContainText('GitHub Release v0.7.0');
    await expect(standalone.locator('.installation-bundle')).toContainText('VERSION.txt');

    const verification = page.locator('.installation-verification');
    await expect(verification.getByRole('heading', { name: 'Verify the installation' })).toBeVisible();
    await expect(verification.locator('code')).toContainText('AMB.table');
    await expect(verification.locator('code')).not.toContainText('AMB.editors');
    await expect(verification.locator('code')).not.toContainText('AMB.formatters');
    await expect(verification.getByRole('link', { name: 'Continue with the JavaScript guide →' })).toHaveAttribute('href', '/#getting-started-javascript');
    await expect(page.locator('.installation-frameworks a')).toHaveCount(4);
    await expect(page.getByText('Package not yet published on npm.')).toHaveCount(0);
    await expect(page.locator('.installation-page').getByText('coming soon')).toHaveCount(0);

    await hero.getByRole('link', { name: 'npm / ESM' }).click();
    await expect(modern).toBeInViewport();
    await page.locator('#site-navbar .demo-brand').click();
    await expect(page).toHaveURL(/\/#top$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
