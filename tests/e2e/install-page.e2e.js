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
    await expect(standalone.locator('pre').nth(1)).toContainText('AMB.table');
    await expect(standalone.locator('.demo-guide-mode-note')).toBeVisible();
    const bundle = standalone.locator('.installation-bundle');
    const download = bundle.getByRole('link', { name: 'Download standalone bundle →' });
    await expect(download).toBeVisible();
    await expect(download).toHaveClass(/demo-button--primary/);
    await expect(download).toHaveAttribute('href', /releases\/download\/v0\.6\.0\/amb-grid-legacy-0\.6\.0\.zip$/);
    await expect(bundle).toContainText('amb-grid-legacy-0.6.0.zip');
    await expect(bundle).toContainText('GitHub Release v0.6.0');
    await expect(bundle.getByRole('link', { name: 'View all releases on GitHub →' })).toHaveAttribute('href', 'https://github.com/ambruoso-luigi/amb-grid/releases');
    await expect(bundle).toContainText('Extract the ZIP into ./vendor/');
    await expect(bundle.getByRole('heading', { name: 'ZIP contents' })).toBeVisible();
    await expect(bundle.locator('pre')).toHaveText('amb-grid/\n├── amb-grid.umd.js\n├── amb-grid.css\n├── README.md\n├── LICENSE\n└── VERSION.txt');
    await expect(page.locator('.installation-page a[href*="amb-grid-legacy-0.7.0.zip"]')).toHaveCount(0);

    const verification = page.locator('.installation-verification');
    await expect(verification.getByRole('heading', { name: 'Verify the installation' })).toBeVisible();
    await expect(verification.locator('pre').first()).toContainText('<div id="grid"></div>');
    await expect(verification.locator('pre').last()).toContainText('AMB.table');
    await expect(verification.locator('pre').last()).not.toContainText('AMB.editors');
    await expect(verification.locator('pre').last()).not.toContainText('AMB.formatters');
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

test('shows the Italian ZIP instructions and verification container', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('amb-grid-demo-language', 'it'));
    await page.goto('/install/');
    const standalone = page.locator('#standalone');
    await expect(standalone.getByRole('link', { name: 'Scarica bundle standalone →' })).toBeVisible();
    await expect(standalone.getByRole('link', { name: 'Vedi tutte le release su GitHub →' })).toBeVisible();
    await expect(standalone.getByRole('heading', { name: 'Contenuto ZIP' })).toBeVisible();
    await expect(standalone.locator('.installation-asset-placement')).toContainText('Estrai lo ZIP nella cartella ./vendor/');
    await expect(page.locator('.installation-verification pre').first()).toContainText('<div id="grid"></div>');
});
