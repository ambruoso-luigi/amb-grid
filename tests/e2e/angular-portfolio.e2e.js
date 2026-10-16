import { expect, test } from '@playwright/test';

const portfolio = page => page.locator('.portfolio-grid');
const table = page => portfolio(page).locator('.portfolio-grid__table');
const holdings = page => table(page).locator('.tabulator-tableholder .tabulator-row');
const cell = (row, field) => row.locator(`.tabulator-cell[tabulator-field="${field}"]`);
const totalCell = (page, field) => table(page).locator(`.tabulator-calcs-bottom .tabulator-cell[tabulator-field="${field}"]`);
const holding = (page, ticker) => holdings(page).filter({ has: page.locator('.portfolio-grid__instrument small', { hasText: ticker }) });
const money = text => Number(text.replace(/[^\d.,-]/g, '').replaceAll(',', ''));
const percent = text => Number(text.match(/[+-]?\d+(?:\.\d+)?/)?.[0]);
const moneyIn = async locator => money(await locator.innerText());
const near = (actual, expected, tolerance = 0.05) => expect(Math.abs(actual - expected)).toBeLessThan(tolerance);

const openPortfolio = async page => {
    const response = await page.goto('/angular/');
    expect(response?.ok()).toBe(true);
    await expect(portfolio(page).getByRole('heading', { name: 'Portfolio Holdings' })).toBeVisible();
    await expect(holdings(page)).toHaveCount(14);
};

const pauseMarket = async page => {
    const control = portfolio(page).locator('.portfolio-grid__pause');
    await expect(control).toHaveText('Pause');
    await control.click();
    await expect(control).toHaveText('Resume');
};

const openInstrumentLookup = async (page, row) => {
    const instrument = cell(row, 'instrument');
    await instrument.dblclick({ delay: 100 });
    await expect(instrument).toHaveClass(/tabulator-editing/);
    await instrument.locator('.amb-lookup-editor__button').click();
    const dialog = page.locator('.amb-lookup-dialog');
    await expect(dialog).toBeVisible();
    return dialog;
};

test('Angular portfolio renders fixed holdings, integrated totals, guide and live market', async ({ page }) => {
    await openPortfolio(page);
    await page.locator('#site-navbar .site-navbar__demo > button').click();
    await expect(page.locator('#site-navbar [data-demo-label="angular"]')).toBeVisible();
    await expect(page.locator('#site-navbar [data-demo-label="angular"]')).toHaveText('Angular');

    await expect(portfolio(page).locator('.amb-toolbar, .amb-row-action-button')).toHaveCount(0);
    await expect(portfolio(page).getByRole('button', { name: /^(Add|Delete|Save|Reload|Rollback|Payload)/i })).toHaveCount(0);
    await expect(table(page).locator('.tabulator-calcs-bottom')).toHaveCount(1);
    await expect(totalCell(page, 'instrument')).toHaveText('TOTAL — 14 posizioni');
    await expect(totalCell(page, 'value')).toHaveText(/€[\d,]+\.\d{2}/);
    await expect(totalCell(page, 'profitLoss')).toHaveText(/-?€[\d,]+\.\d{2}/);
    await expect(totalCell(page, 'changePercent')).toHaveText(/Return [+-]\d+\.\d{2}%/);

    const guide = portfolio(page).locator('.portfolio-grid__guide');
    const summary = guide.locator('summary');
    await expect(guide).not.toHaveAttribute('open', '');
    await summary.click();
    await expect(guide).toHaveAttribute('open', '');
    await summary.click();
    await expect(guide).not.toHaveAttribute('open', '');
    await summary.focus();
    await summary.press('Enter');
    await expect(guide).toHaveAttribute('open', '');
    await summary.press('Space');
    await expect(guide).not.toHaveAttribute('open', '');

    const prices = holdings(page).locator('.tabulator-cell[tabulator-field="price"]');
    const initialPrices = await prices.allTextContents();
    await expect.poll(async () => {
        const current = await prices.allTextContents();
        return current.some((price, index) => price !== initialPrices[index]);
    }).toBe(true);
    await pauseMarket(page);
    const pausedPrices = await prices.allTextContents();
    let changedWhilePaused = false;
    const pausedAt = Date.now();
    await expect.poll(async () => {
        const current = await prices.allTextContents();
        changedWhilePaused ||= current.some((price, index) => price !== pausedPrices[index]);
        return Date.now() - pausedAt >= 1200 ? (changedWhilePaused ? 'changed' : 'stable') : 'observing';
    }, { intervals: [200], timeout: 3000 }).toBe('stable');
    await expect(holding(page, 'AAPL').locator('.portfolio-grid__timeline rect')).toHaveCount(32);
    await portfolio(page).locator('.portfolio-grid__pause').click();
    await expect.poll(async () => {
        const current = await prices.allTextContents();
        return current.some((price, index) => price !== pausedPrices[index]);
    }).toBe(true);
    await expect(holdings(page)).toHaveCount(14);
});

test('Quantity edits recalculate row and weighted portfolio totals while paused', async ({ page }) => {
    await openPortfolio(page);
    await pauseMarket(page);
    const apple = holding(page, 'AAPL');
    await expect(apple).toHaveCount(1);
    await expect(cell(apple, 'quantity')).toHaveText('16');
    const priceText = await cell(apple, 'price').innerText();
    const price = money(priceText);
    const valueBefore = await moneyIn(cell(apple, 'value'));
    const profitBefore = await moneyIn(cell(apple, 'profitLoss'));
    const totalBefore = await moneyIn(totalCell(page, 'value'));
    const totalProfitBefore = await moneyIn(totalCell(page, 'profitLoss'));
    const averageCost = (valueBefore - profitBefore) / 16;

    const quantity = cell(apple, 'quantity');
    await quantity.dblclick({ delay: 100 });
    const input = quantity.locator('input');
    await expect(input).toBeVisible();
    await input.fill('17');
    await input.press('Enter');
    await expect(quantity).not.toHaveClass(/tabulator-editing/);
    await expect(quantity).toHaveText('17');
    await expect(cell(apple, 'price')).toHaveText(priceText);

    near(await moneyIn(cell(apple, 'value')), valueBefore + price);
    near(await moneyIn(totalCell(page, 'value')), totalBefore + price);
    near(await moneyIn(cell(apple, 'profitLoss')), profitBefore + price - averageCost);
    near(await moneyIn(totalCell(page, 'profitLoss')), totalProfitBefore + price - averageCost);
    const totalValue = await moneyIn(totalCell(page, 'value'));
    const totalProfit = await moneyIn(totalCell(page, 'profitLoss'));
    near(percent(await totalCell(page, 'changePercent').innerText()), totalProfit / (totalValue - totalProfit) * 100, 0.02);
    await expect(holdings(page)).toHaveCount(14);
});

test('Multifield Lookup replaces one holding, excludes duplicates and releases its old instrument', async ({ page }) => {
    await openPortfolio(page);
    await pauseMarket(page);
    const first = holdings(page).first();
    await expect(first.locator('.portfolio-grid__instrument small')).toHaveText('AAPL');
    const oldValue = await moneyIn(cell(first, 'value'));
    const oldProfit = await moneyIn(cell(first, 'profitLoss'));
    const oldPrice = await moneyIn(cell(first, 'price'));
    const totalBefore = await moneyIn(totalCell(page, 'value'));
    const totalProfitBefore = await moneyIn(totalCell(page, 'profitLoss'));

    const dialog = await openInstrumentLookup(page, first);
    const search = dialog.locator('.amb-lookup-dialog__search');
    const results = dialog.locator('.amb-lookup-dialog__row');
    await expect(results.filter({ hasText: 'AAPL' })).toHaveCount(1);
    await search.fill('MSFT');
    await expect(results).toHaveCount(0);
    await search.fill('NVDA');
    const nvidia = results.filter({ hasText: 'NVDA' });
    await expect(nvidia).toHaveCount(1);
    await nvidia.click();
    await expect(dialog.locator('.amb-lookup-dialog__button--primary')).toBeEnabled();
    await dialog.locator('.amb-lookup-dialog__button--primary').click();
    await expect(dialog).toBeHidden();

    await expect(first.locator('.portfolio-grid__instrument strong')).toHaveText('NVIDIA Corp.');
    await expect(first.locator('.portfolio-grid__instrument small')).toHaveText('NVDA');
    await expect(cell(first, 'type')).toHaveText('Stock');
    await expect(holding(page, 'AAPL')).toHaveCount(0);
    await expect(holding(page, 'MSFT')).toHaveCount(1);
    await expect(holding(page, 'NVDA')).toHaveCount(1);
    await expect(holdings(page)).toHaveCount(14);
    await expect(cell(first, 'price')).toHaveText(/€[\d,]+\.\d{2}/);
    expect(await moneyIn(cell(first, 'price'))).not.toBe(oldPrice);
    await expect(cell(first, 'timeline').locator('svg[aria-label*="NVDA"] rect')).toHaveCount(32);
    const newValue = await moneyIn(cell(first, 'value'));
    const newProfit = await moneyIn(cell(first, 'profitLoss'));
    near(newValue, 16 * await moneyIn(cell(first, 'price')), 0.1);
    near(newProfit, 0, 0.02);
    near(await moneyIn(totalCell(page, 'value')), totalBefore - oldValue + newValue);
    near(await moneyIn(totalCell(page, 'profitLoss')), totalProfitBefore - oldProfit + newProfit);

    const microsoftDialog = await openInstrumentLookup(page, holding(page, 'MSFT'));
    await microsoftDialog.locator('.amb-lookup-dialog__search').fill('AAPL');
    const releasedApple = microsoftDialog.locator('.amb-lookup-dialog__row').filter({ hasText: 'AAPL' });
    await expect(releasedApple).toHaveCount(1);
    await releasedApple.click();
    await expect(microsoftDialog.locator('.amb-lookup-dialog__button--primary')).toBeEnabled();
    await microsoftDialog.getByRole('button', { name: 'Cancel' }).click();
});
