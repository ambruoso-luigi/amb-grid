import { expect, test } from '@playwright/test';
import { setSiteLanguage } from './helpers/site-language.js';

for (const width of [1440, 1280, 1024, 768, 390]) {
    test(`React inventory guide and workbench stay aligned at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.addInitScript(() => localStorage.setItem('amb-grid-demo-language', 'it'));
        await page.goto('/#getting-started-react');
        const panel = page.locator('.react-demo-panel');
        const title = panel.getByRole('heading', { name: 'Inventario interattivo' });
        const description = panel.locator('.react-demo-intro > p');
        const trigger = panel.getByRole('button', { name: 'Guida tecnica demo' });
        const content = panel.locator('#react-table-guide-content');
        const kpis = panel.locator('.inventory-kpis');
        const toolbar = panel.locator('.inventory-toolbar');
        const gridShell = panel.locator('.react-demo-grid-shell');
        const grid = panel.locator('.react-demo-grid');
        await expect(grid.locator('.tabulator-row').first()).toBeVisible();
        await expect(title).toBeVisible();
        await expect(description).toContainText('Una demo moderna');
        await expect(kpis.locator('.inventory-kpi')).toHaveCount(6);
        await expect(kpis.locator('.inventory-kpi__heading')).toHaveText(['Prodotti', 'Modificati', 'Errori', 'Pronti da salvare', 'Scorte basse', 'Sospesi']);
        const totals = grid.locator('.tabulator-calcs-holder');
        await expect(totals.locator('[tabulator-field="productName"]')).toContainText('Totali correnti');
        await expect(totals.locator('[tabulator-field="stockQuantity"]')).toContainText('296');
        await expect(totals.locator('[tabulator-field="inventoryValue"]')).toContainText('22.131,60');
        await expect(totals.locator('[tabulator-field="requiresInspection"]')).toContainText('4');
        await expect(totals.locator('.amb-calc-label')).toHaveText(['TOTALE SCORTE', 'VALORE TOTALE', 'ISPEZIONI']);
        await expect(grid.locator('.inventory-supplier small').first()).toBeVisible();
        await expect(panel.locator('.inventory-workspace__header, .react-demo-intro__kicker')).toHaveCount(0);
        await expect(panel.getByText('Operazioni inventario', { exact: true })).toHaveCount(0);
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        const gridHandle = await grid.elementHandle();
        const before = await grid.locator('.tabulator-row').count();
        await trigger.focus();
        await page.keyboard.press('Enter');
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(content.locator('.react-table-guide__column-list')).toContainText('Fornitore');
        await expect.poll(async () => {
            const [t, d, b, c, k, tools, table] = await Promise.all([
                title.boundingBox(), description.boundingBox(), trigger.boundingBox(), content.boundingBox(),
                kpis.boundingBox(), toolbar.boundingBox(), gridShell.boundingBox()
            ]);
            if (!t || !d || !b || !c || !k || !tools || !table) return false;
            const headerClear = width <= 640 ? b.y >= t.y + t.height - 1 : b.x >= t.x + t.width - 1;
            return headerClear && c.y >= d.y + d.height - 1 && k.y >= c.y + c.height - 1
                && Math.abs(c.x - k.x) <= 2 && Math.abs(k.x - tools.x) <= 2 && Math.abs(k.x - table.x) <= 2
                && Math.abs(c.width - k.width) <= 2 && Math.abs(k.width - table.width) <= 2;
        }).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        await page.keyboard.press('Enter');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(await grid.evaluate((element, original) => element === original, gridHandle)).toBe(true);
        await expect(grid.locator('.tabulator-row')).toHaveCount(before);
        await setSiteLanguage(page, 'en');
        await expect(panel.getByRole('heading', { name: 'Interactive inventory' })).toBeVisible();
        await expect(panel.getByRole('button', { name: 'Demo technical guide' })).toBeVisible();
        await expect(kpis.locator('.inventory-kpi__heading')).toHaveText(['Products', 'Modified', 'Errors', 'Ready to save', 'Low stock', 'On hold']);
        await expect(totals.locator('[tabulator-field="productName"]')).toContainText('Current totals');
        await expect(totals.locator('.amb-calc-label')).toHaveText(['TOTAL STOCK', 'TOTAL VALUE', 'INSPECTIONS']);
        await setSiteLanguage(page, 'it');
        await expect(trigger).toBeVisible();
    });
}
