import { expect, test } from '@playwright/test';

const titles = {
    it: ['Prepara il container', 'Definisci dati e colonne', 'Crea la griglia CRUD', 'Leggi il payload'],
    en: ['Prepare the container', 'Define data and columns', 'Create the CRUD grid', 'Read the payload']
};

for (const language of ['it', 'en']) {
    test(`JavaScript getting started focuses on four API steps (${language})`, async ({ page }) => {
        await page.addInitScript(value => localStorage.setItem('amb-grid-demo-language', value), language);
        await page.goto('/#getting-started-javascript');

        const guide = page.locator('#javascript-getting-started');
        const steps = guide.locator('.demo-guide-steps > .demo-guide-step');
        await expect(page.locator('#inventory-table.tabulator')).toBeVisible();
        await expect(steps).toHaveCount(4);
        await expect(steps.locator('.demo-guide-step__number')).toHaveText(['1', '2', '3', '4']);
        await expect(steps.locator('h3')).toHaveText(titles[language]);
        await expect(guide.locator('.demo-guide-next')).toHaveCount(0);
        await expect(guide.getByText(language === 'it' ? 'Devi ancora installare AMB Grid?' : 'Need to install AMB Grid first?')).toBeVisible();
        await expect(guide.getByRole('link', { name: language === 'it' ? 'Vai alla pagina Installazione →' : 'Go to the Installation page →' })).toHaveAttribute('href', '/install/');
        await expect(steps.nth(2).locator('code')).toContainText('AMB.table');
        await expect(steps.nth(3).locator('code')).toContainText('getSavePayload');
        await expect(steps.nth(3).locator('code')).toContainText('payload.changes');
        const appCss = guide.locator('.demo-guide-app-css');
        await expect(appCss.getByRole('heading', { name: language === 'it' ? 'CSS applicativo facoltativo' : 'Optional application CSS' })).toBeVisible();
        await expect(appCss.locator('code')).toContainText('.inventory-page');
        await expect(appCss.locator('code')).toContainText('#grid');
        await expect(page.locator('#javascript-integration')).toHaveCount(0);
        await expect(page.locator('.demo-guide-mode-card')).toHaveCount(0);
        await expect(guide).not.toContainText('npm install');
        await expect(guide).not.toContainText("'amb-grid/style.css'");
        await guide.getByRole('link', { name: language === 'it' ? 'Vai alla pagina Installazione →' : 'Go to the Installation page →' }).click();
        await expect(page).toHaveURL(/\/install\/$/);
        await expect(page.locator('.installation-hero h1')).toHaveText(language === 'it' ? 'Installa AMB Grid' : 'Install AMB Grid');
    });
}

test('the technical guide expands below the heading on desktop and mobile', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#getting-started-javascript');
    const demo = page.locator('#javascript-demo');
    const heading = demo.locator('.demo-app-shell__meta h2');
    const description = demo.locator('.demo-main-description');
    const shell = demo.locator('.demo-app-shell');
    const disclosure = shell.locator(':scope > .demo-disclosure--technical');
    const summary = disclosure.locator('summary');
    const content = disclosure.locator('.demo-disclosure__content');
    const table = demo.locator('#inventory-table');
    await expect(table).toBeVisible();

    for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(heading).toBeVisible();
        await expect(disclosure).not.toHaveAttribute('open');
        await expect(summary).toBeVisible();
        const closedBox = await disclosure.boundingBox();
        const shellBox = await shell.boundingBox();
        expect(closedBox.width).toBeLessThan(shellBox.width);
        if (width > 760) {
            const headingBox = await heading.boundingBox();
            expect(closedBox.x).toBeGreaterThanOrEqual(headingBox.x + headingBox.width - 1);
        }

        await summary.focus();
        await page.keyboard.press('Enter');
        await expect(disclosure).toHaveAttribute('open', '');
        await expect(content).toBeVisible();
        await expect(heading).toBeVisible();
        const headingBox = await heading.boundingBox();
        const descriptionBox = await description.boundingBox();
        const openBox = await disclosure.boundingBox();
        const tableBox = await table.boundingBox();
        expect(openBox.y).toBeGreaterThanOrEqual(descriptionBox.y + descriptionBox.height - 1);
        expect(openBox.y).toBeGreaterThanOrEqual(headingBox.y + headingBox.height - 1);
        expect(openBox.width).toBeGreaterThanOrEqual(shellBox.width - 2);
        expect(tableBox.y).toBeGreaterThanOrEqual(openBox.y + openBox.height - 1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

        await summary.focus();
        await page.keyboard.press('Enter');
        await expect(disclosure).not.toHaveAttribute('open');
        await expect(summary).toBeVisible();
    }
});
