import { expect, test } from '@playwright/test';

test('shows the English installation flow and its links', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('amb-grid-demo-language', 'en'));
    await page.goto('/install/');
    const hero = page.locator('.installation-hero');
    await expect(page.locator('#site-navbar')).toBeVisible();
    await expect(hero.locator('.demo-brand__logo')).toBeVisible();
    await expect(hero.getByRole('heading', { name: 'Install AMB Grid' })).toBeVisible();
    await expect(hero.locator('.demo-hero__text')).toContainText('Use npm in modern projects');
    await expect(hero.getByRole('link', { name: 'npm / ESM' })).toHaveAttribute('href', '#npm');
    await expect(hero.getByRole('link', { name: 'Download standalone bundle' })).toHaveAttribute('href', '#standalone');
    await expect(page.locator('.installation-video-preview')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=2qhXHt0Upps');
    expect(await page.locator('.installation-page').evaluate(element => getComputedStyle(element).paddingLeft)).toBe('0px');
    expect(await page.locator('.installation-page').evaluate(element => getComputedStyle(element).paddingRight)).toBe('0px');

    await expect(page.getByText('Two modes, one API')).toBeVisible();
    await expect(page.getByText('AMB Grid is framework-agnostic.', { exact: false })).toBeVisible();
    const panel = page.locator('.installation-modes__panel');
    await expect(panel).toBeVisible();
    await expect(panel.locator(':scope > *')).toHaveCount(5);
    await expect(panel.locator(':scope > .installation-modes__intro')).toContainText('Two modes, one API');
    const intro = panel.locator('.installation-modes__intro');
    expect(Number.parseFloat(await intro.locator('.demo-kicker').evaluate(element => getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
    expect(Number.parseFloat(await intro.locator('.demo-note').evaluate(element => getComputedStyle(element).maxWidth))).toBeGreaterThanOrEqual(950);
    await expect(panel.locator(':scope > .installation-mode')).toHaveCount(2);
    await expect(panel.locator(':scope > .installation-mode').nth(0)).toHaveAttribute('id', 'npm');
    await expect(panel.locator(':scope > .installation-mode').nth(1)).toHaveAttribute('id', 'standalone');
    await expect(panel.locator(':scope > .installation-verification')).toHaveCount(1);
    await expect(panel.locator(':scope > .installation-next')).toHaveCount(1);
    await expect(page.locator('.installation-modes .demo-guide-mode-card')).toHaveCount(0);
    const modern = page.locator('#npm');
    const standalone = page.locator('#standalone');
    await expect(page.locator('.installation-mode__number')).toHaveCount(0);
    expect(await modern.evaluate((element, other) => element.compareDocumentPosition(document.querySelector(other)) & Node.DOCUMENT_POSITION_FOLLOWING, '#standalone')).toBeTruthy();
    expect(await panel.evaluate(element => getComputedStyle(element).boxShadow)).not.toBe('none');
    expect(await modern.evaluate(element => getComputedStyle(element).boxShadow)).toBe('none');
    expect(await standalone.evaluate(element => getComputedStyle(element).boxShadow)).toBe('none');
    for (const section of [panel.locator('.installation-verification'), panel.locator('.installation-next')]) {
        expect(await section.evaluate(element => getComputedStyle(element).boxShadow)).toBe('none');
    }
    await expect(modern.getByRole('heading', { name: 'Modern JavaScript / npm' })).toBeVisible();
    await expect(standalone.getByRole('heading', { name: 'Browser / standalone' })).toBeVisible();
    await expect(modern.locator('.installation-section-header .demo-guide-mode-card__icon svg')).toBeVisible();
    await expect(standalone.locator('.installation-section-header .demo-guide-mode-card__icon svg')).toBeVisible();
    await expect(modern.locator('.installation-section-header .demo-guide-badge')).toHaveText('npm + ESM');
    await expect(standalone.locator('.installation-section-header .demo-guide-badge')).toHaveText('Standalone');
    for (const section of [modern, standalone]) {
        expect(await section.locator('.installation-mode__content').evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length)).toBe(2);
    }
    await expect(modern.locator(':scope > .installation-section-description')).toContainText('The natural choice');
    await expect(standalone.locator(':scope > .installation-section-description')).toContainText('For browser pages');
    await expect(modern.locator('.installation-code-group')).toHaveCount(2);
    await expect(modern.locator('.installation-code-group').nth(0).locator('.demo-guide-code-label')).toHaveText('Install');
    await expect(modern.locator('.installation-code-group').nth(1).locator('.demo-guide-code-label')).toHaveText('Import');
    await expect(standalone.locator('.installation-mode__content--standalone > .installation-bundle')).toHaveCount(1);
    await expect(standalone.locator('.installation-mode__content--standalone > .installation-mode__details')).toHaveCount(1);
    for (const label of await page.locator('.installation-page .demo-guide-code-label').all()) {
        const style = await label.evaluate(element => {
            const computed = getComputedStyle(element);
            return { background: computed.backgroundColor, radius: computed.borderRadius, fontSize: Number.parseFloat(computed.fontSize) };
        });
        expect(style.background).toBe('rgba(0, 0, 0, 0)');
        expect(style.radius).toBe('0px');
        expect(style.fontSize).toBeGreaterThanOrEqual(13);
    }
    await expect(modern.locator('pre').first()).toContainText('npm install amb-grid');
    await expect(modern.locator('pre').last()).toContainText("import { AMB } from 'amb-grid'");
    await expect(modern.locator('pre').last()).toContainText("import 'amb-grid/style.css'");
    await expect(modern.locator('pre .syntax-keyword').first()).toBeVisible();
    await expect(standalone.locator('.installation-mode__details pre').first()).toContainText('amb-grid.css');
    await expect(standalone.locator('.installation-mode__details pre').first()).toContainText('amb-grid.umd.js');
    await expect(standalone.locator('.installation-mode__details pre').last()).toContainText('AMB.table');
    await expect(standalone.locator('.installation-mode__details pre .syntax-tag').first()).toBeVisible();
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
    expect(Number.parseFloat(await bundle.locator('pre').evaluate(element => getComputedStyle(element).fontSize))).toBeLessThanOrEqual(13);
    await expect(page.locator('.installation-page a[href*="amb-grid-legacy-0.7.0.zip"]')).toHaveCount(0);

    const verification = page.locator('.installation-verification');
    await expect(verification.getByRole('heading', { name: 'Verify the installation' })).toBeVisible();
    await expect(verification.locator('.installation-section-header .demo-guide-mode-card__icon svg')).toBeVisible();
    await expect(verification.locator('.installation-section-header .demo-guide-badge')).toHaveText('Both modes');
    await expect(verification).toContainText('After loading AMB Grid');
    await expect(verification).toContainText('component lifecycle.');
    await expect(verification.locator(':scope > .installation-section-description')).toBeVisible();
    expect(await verification.locator('.installation-verification__layout').evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length)).toBe(2);
    await expect(verification.locator('.installation-verification__copy .demo-guide-code-label')).toHaveText('HTML');
    await expect(verification.locator('.installation-verification__example .demo-guide-code-label')).toHaveText('JavaScript');
    await expect(verification.locator('pre').first()).toContainText('<div id="grid"></div>');
    await expect(verification.locator('pre').last()).toContainText('AMB.table');
    await expect(verification.locator('pre .syntax-api').first()).toBeVisible();
    await expect(verification.locator('pre').last()).not.toContainText('AMB.editors');
    await expect(verification.locator('pre').last()).not.toContainText('AMB.formatters');
    await expect(verification.getByRole('link', { name: 'Continue with the JavaScript guide →' })).toHaveAttribute('href', '/#getting-started-javascript');
    expect(await verification.evaluate(element => Array.from(element.children).map(child => child.className))).toEqual(['installation-section-header', 'demo-note installation-section-description', 'installation-verification__layout', 'installation-guide-link']);
    await expect(page.locator('.installation-frameworks a')).toHaveCount(4);
    await expect(page.locator('.installation-frameworks a').nth(0)).toHaveAttribute('href', '/#getting-started-javascript');
    await expect(page.locator('.installation-frameworks a').nth(1)).toHaveAttribute('href', '/#getting-started-react');
    await expect(page.locator('.installation-frameworks a').nth(2)).toHaveAttribute('href', '/#framework-integrations');
    await expect(page.locator('.installation-frameworks a').nth(3)).toHaveAttribute('href', '/#framework-integrations');
    await expect(page.locator('.installation-frameworks small')).toHaveText(['Dedicated guide', 'Dedicated guide', 'Framework overview', 'Framework overview']);
    await expect(panel.locator('.installation-next').getByRole('heading', { name: 'AMB Grid is ready.' })).toBeVisible();
    await expect(panel.locator('.installation-next .demo-note')).toHaveText('You can now continue with the guide for your development environment.');
    const frameworkLinks = page.locator('.installation-frameworks a');
    const linkStyles = await frameworkLinks.evaluateAll(elements => elements.map(element => {
        const computed = getComputedStyle(element);
        return { minHeight: computed.minHeight, padding: computed.padding, radius: computed.borderRadius, fontSize: computed.fontSize };
    }));
    expect(linkStyles.every(style => JSON.stringify(style) === JSON.stringify(linkStyles[0]))).toBe(true);
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
    await expect(page.locator('.installation-verification')).toContainText('Dopo aver caricato AMB Grid');
    await expect(page.locator('.installation-verification .demo-guide-badge')).toHaveText('Entrambe le modalità');
    await expect(page.locator('.installation-next').getByRole('heading', { name: 'AMB Grid è pronta.' })).toBeVisible();
    await expect(page.locator('.installation-frameworks small')).toHaveText(['Guida dedicata', 'Guida dedicata', 'Panoramica framework', 'Panoramica framework']);
    await expect(page.locator('.installation-next .demo-note')).toHaveText('Ora puoi continuare con la guida specifica per il tuo ambiente di sviluppo.');
});

test('stacks internal columns and keeps code scrolling inside blocks on mobile', async ({ page }) => {
    await page.goto('/install/');
    const panel = page.locator('.installation-modes__panel');
    await expect(panel.locator(':scope > *')).toHaveCount(5);
    for (const width of [768, 375]) {
        await page.setViewportSize({ width, height: 812 });
        for (const selector of ['#npm .installation-mode__content', '#standalone .installation-mode__content', '.installation-verification__layout']) {
            expect(await panel.locator(selector).evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length)).toBe(1);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    }
    await expect(page.locator('#standalone .installation-bundle pre')).toBeVisible();
});
