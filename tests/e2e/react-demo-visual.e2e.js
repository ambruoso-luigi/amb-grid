import { expect, test } from '@playwright/test';
import { setSiteLanguage } from './helpers/site-language.js';
import { openEditorFromNavigation } from './helpers/focus-diagnostics.js';

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

test('React filters count active options and preserve them through reload', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('amb-grid-demo-language', 'it'));
    await page.goto('/#getting-started-react');
    const panel = page.locator('.react-demo-panel');
    const button = panel.getByRole('button', { name: 'Filters', exact: true });
    const badge = panel.locator('.inventory-toolbar__filter-count');
    await expect(panel.locator('.tabulator-tableholder .tabulator-row').first()).toBeVisible();
    await expect(badge).toHaveCount(0);
    const size = await button.boundingBox();
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const status = panel.locator('.inventory-filters').getByLabel('Status');
    const inspection = panel.locator('.inventory-filters').getByLabel('Inspection');
    await status.selectOption('ACTIVE');
    await expect(badge).toHaveText('1');
    await status.selectOption('HOLD');
    await expect(badge).toHaveText('1');
    await inspection.selectOption('false');
    await expect(badge).toHaveText('2');
    await expect(button).toHaveAccessibleDescription('2 filtri attivi');
    const withBadge = await button.boundingBox();
    expect(Math.abs(size.width - withBadge.width)).toBeLessThan(1);
    expect(Math.abs(size.height - withBadge.height)).toBeLessThan(1);
    await status.selectOption('');
    await expect(badge).toHaveText('1');
    await inspection.selectOption('');
    await expect(badge).toHaveCount(0);
    await panel.getByLabel('Search inventory').fill('scale');
    await expect(badge).toHaveCount(0);
    await panel.getByLabel('Search inventory').fill('');
    await status.selectOption('HOLD');
    await inspection.selectOption('true');
    await expect(badge).toHaveText('2');
    await button.click();
    await panel.getByRole('button', { name: 'Reload', exact: true }).click();
    await expect(badge).toHaveText('2');
    await expect(panel.locator('.tabulator-tableholder .tabulator-row')).toHaveCount(1);
    await button.click();
    await expect(status).toHaveValue('HOLD');
    await expect(inspection).toHaveValue('true');
});

test('React grid keeps its initial height and scrolls only its rows after insertions', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.goto('/#getting-started-react');
    const panel = page.locator('.react-demo-panel');
    const grid = panel.locator('.react-demo-grid');
    const holder = grid.locator('.tabulator-tableholder');
    const shell = panel.locator('.react-demo-grid-shell');
    const header = grid.locator('.tabulator-header');
    const footer = grid.locator('.tabulator-footer');
    const diagnostics = async label => {
        const state = await panel.evaluate(root => Object.fromEntries(Object.entries({ shell: '.react-demo-grid-shell', grid: '.react-demo-grid.tabulator', header: '.tabulator-header', holder: '.tabulator-tableholder', footer: '.tabulator-footer' }).map(([name, selector]) => {
            const element = root.querySelector(selector);
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return [name, { scrollTop: element.scrollTop, scrollLeft: element.scrollLeft, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, offsetWidth: element.offsetWidth, overflowX: style.overflowX, overflowY: style.overflowY, height: style.height, maxHeight: style.maxHeight, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } }];
        })));
        console.log(`[react-scroll ${label}] ${JSON.stringify(state)}`);
    };
    await expect(holder.locator('.tabulator-row')).toHaveCount(8);
    await expect(header).toBeVisible();
    await expect(footer).toBeVisible();
    await expect.poll(() => grid.evaluate(element => getComputedStyle(element).maxHeight)).not.toBe('none');
    await diagnostics('initial');
    const initial = await grid.boundingBox();
    const geometry = () => grid.evaluate(element => {
        const rectangle = child => {
            const { top, bottom } = child.getBoundingClientRect();
            return { top, bottom };
        };
        return { grid: rectangle(element), header: rectangle(element.querySelector('.tabulator-header')), holder: rectangle(element.querySelector('.tabulator-tableholder')), footer: rectangle(element.querySelector('.tabulator-footer')), scrollTop: element.scrollTop };
    });
    const initialGeometry = await geometry();
    const initialShell = await shell.evaluate(element => ({ top: element.scrollTop, horizontal: element.scrollWidth > element.clientWidth }));
    const initialHorizontal = await holder.evaluate(element => element.scrollWidth > element.clientWidth);
    expect(initialShell.horizontal).toBe(false);
    expect(initialHorizontal).toBe(false);
    const columnsAligned = () => grid.evaluate(element => {
        const fields = ['productName', 'stockQuantity', 'inventoryValue', 'requiresInspection'];
        return fields.every(field => {
            const selector = `[tabulator-field="${field}"]`;
            const headerCell = element.querySelector(`.tabulator-header ${selector}`)?.getBoundingClientRect();
            const rowCell = element.querySelector(`.tabulator-tableholder .tabulator-row ${selector}`)?.getBoundingClientRect();
            const calcCell = element.querySelector(`.tabulator-calcs-holder ${selector}`)?.getBoundingClientRect();
            return headerCell && rowCell && calcCell && Math.abs(headerCell.left - rowCell.left) <= 1 && Math.abs(headerCell.left - calcCell.left) <= 1 && Math.abs(headerCell.width - calcCell.width) <= 1;
        });
    });
    await expect.poll(columnsAligned).toBe(true);
    const labelStyle = await footer.locator('.inventory-summary-label strong').evaluate(element => ({ fontSize: parseFloat(getComputedStyle(element).fontSize), fontWeight: Number(getComputedStyle(element).fontWeight) }));
    expect(labelStyle.fontSize).toBeGreaterThanOrEqual(16);
    expect(labelStyle.fontWeight).toBeGreaterThanOrEqual(750);
    for (let i = 0; i < 7; i++) {
        await panel.getByRole('button', { name: 'Add product' }).click();
        if (i === 0) {
            await expect.poll(() => holder.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
            expect(await holder.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(false);
            await expect.poll(columnsAligned).toBe(true);
        }
        if (i === 0 || i === 6) await diagnostics(`insertion-${i + 1}`);
    }
    await diagnostics('focused-new-row');
    await expect.poll(() => holder.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    const expanded = await grid.boundingBox();
    expect(Math.abs(expanded.height - initial.height)).toBeLessThanOrEqual(2);
    const shellMetrics = await shell.evaluate(element => ({ top: element.scrollTop, horizontal: element.scrollWidth > element.clientWidth }));
    expect(shellMetrics).toEqual(initialShell);
    expect(await grid.evaluate(element => element.scrollTop)).toBe(0);
    expect(await holder.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(initialHorizontal);
    await expect.poll(columnsAligned).toBe(true);
    await expect(footer.locator('[tabulator-field="stockQuantity"]')).toContainText('296');
    await expect(footer.locator('[tabulator-field="inventoryValue"]')).toContainText('22.131,60');
    await expect(footer.locator('[tabulator-field="requiresInspection"]')).toContainText('4');
    const afterScroll = await holder.evaluate(element => { element.scrollTop = element.scrollHeight; return element.scrollTop; });
    await diagnostics('holder-scrolled');
    expect(afterScroll).toBeGreaterThan(0);
    const after = await geometry();
    expect(after.scrollTop).toBe(0);
    expect(await shell.evaluate(element => element.scrollTop)).toBe(0);
    expect(Math.abs((initialGeometry.header.top - initialGeometry.grid.top) - (after.header.top - after.grid.top))).toBeLessThanOrEqual(2);
    expect(Math.abs((initialGeometry.footer.top - initialGeometry.grid.top) - (after.footer.top - after.grid.top))).toBeLessThanOrEqual(2);
    expect(after.header.top).toBeGreaterThanOrEqual(after.grid.top - 1);
    expect(after.header.bottom).toBeLessThanOrEqual(after.holder.top + 1);
    expect(after.holder.bottom).toBeLessThanOrEqual(after.footer.top + 1);
    expect(after.footer.bottom).toBeLessThanOrEqual(after.grid.bottom + 1);
    const rowVisible = (code) => holder.evaluate((element, itemCode) => {
        const row = [...element.querySelectorAll('.tabulator-row')].find(item => {
            const cell = item.querySelector('[tabulator-field="itemCode"]');
            return (cell?.querySelector('input')?.value ?? cell?.textContent?.trim()) === itemCode;
        });
        if (!row) return false;
        const outer = element.getBoundingClientRect();
        const inner = row.getBoundingClientRect();
        return inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
    }, code);
    await expect.poll(() => rowVisible('ITM-1015')).toBe(true);
    await holder.evaluate(element => { element.scrollTop = 0; });
    await expect.poll(() => rowVisible('ITM-1001')).toBe(true);
    await panel.getByLabel('Search inventory').fill('pallet scale');
    await expect(holder.locator('.tabulator-row')).toHaveCount(1);
    await expect.poll(async () => (await grid.boundingBox()).height).toBeLessThan(expanded.height);
    await panel.getByLabel('Search inventory').fill('');
    await expect.poll(() => holder.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
});

test('React bottom calculations remain integrated and aligned after editing and resizing', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.addInitScript(() => localStorage.setItem('amb-grid-demo-language', 'it'));
    await page.goto('/#getting-started-react');
    const panel = page.locator('.react-demo-panel');
    const grid = panel.locator('.react-demo-grid');
    const shell = panel.locator('.react-demo-grid-shell');
    const footer = grid.locator('.tabulator-footer');
    const totals = footer.locator('.tabulator-calcs-holder');
    const row = grid.locator('.tabulator-tableholder .tabulator-row').filter({ hasText: 'ITM-1001' });
    const stock = row.locator('[tabulator-field="stockQuantity"]');
    await expect(stock).toBeVisible();
    await expect(totals.locator('[tabulator-field="stockQuantity"]')).toContainText('296');
    const appearance = await totals.evaluate(element => {
        const style = getComputedStyle(element);
        const footerStyle = getComputedStyle(element.closest('.tabulator-footer'));
        return { background: style.backgroundColor, border: style.borderTopWidth, footerBorder: footerStyle.borderTopWidth, margin: style.marginBottom };
    });
    expect(appearance).toEqual({ background: 'rgb(236, 254, 255)', border: '2px', footerBorder: '0px', margin: '0px' });
    const aligned = async () => {
        const [cell, calc] = await Promise.all([stock.boundingBox(), totals.locator('[tabulator-field="stockQuantity"]').boundingBox()]);
        return Math.abs(cell.x - calc.x) <= 2 && Math.abs(cell.width - calc.width) <= 2;
    };
    await expect.poll(aligned).toBe(true);
    const input = await openEditorFromNavigation(page, stock, 'React stock quantity', '.react-demo-grid');
    await input.fill('25');
    await input.press('Enter');
    await expect(totals.locator('[tabulator-field="stockQuantity"]')).toContainText('297');
    await expect(totals.locator('[tabulator-field="inventoryValue"]')).toContainText('22.321,50');
    await shell.evaluate(element => { element.scrollLeft = element.scrollWidth; });
    await expect.poll(aligned).toBe(true);
    const handle = grid.locator('.tabulator-header [tabulator-field="stockQuantity"] .tabulator-col-resize-handle').last();
    await handle.scrollIntoViewIfNeeded();
    const box = await handle.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2);
    await page.mouse.up();
    await expect.poll(aligned).toBe(true);
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect.poll(aligned).toBe(true);
});
