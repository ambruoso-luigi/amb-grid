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
        await expect(guide.locator('.demo-guide-next h3')).toHaveText(language === 'it' ? 'Prossimi passi' : 'Next steps');
        await expect(guide.locator('.demo-guide-next .demo-guide-step__number')).toHaveCount(0);
        await expect(guide.getByText(language === 'it' ? 'Devi ancora installare AMB Grid?' : 'Need to install AMB Grid first?')).toBeVisible();
        await expect(guide.getByRole('link', { name: language === 'it' ? 'Vai alla pagina Installazione →' : 'Go to the Installation page →' })).toHaveAttribute('href', '/install/');
        await expect(steps.nth(2).locator('code')).toContainText('AMB.table');
        await expect(steps.nth(3).locator('code')).toContainText('getSavePayload');
        await expect(steps.nth(3).locator('code')).toContainText('payload.changes');
        await expect(page.locator('#javascript-integration')).toHaveCount(0);
        await expect(page.locator('.demo-guide-mode-card')).toHaveCount(0);
        await expect(guide).not.toContainText('npm install');
        await expect(guide).not.toContainText("'amb-grid/style.css'");
        await guide.getByRole('link', { name: language === 'it' ? 'Vai alla pagina Installazione →' : 'Go to the Installation page →' }).click();
        await expect(page).toHaveURL(/\/install\/$/);
        await expect(page.locator('.installation-hero h1')).toHaveText(language === 'it' ? 'Installa AMB Grid' : 'Install AMB Grid');
    });
}
