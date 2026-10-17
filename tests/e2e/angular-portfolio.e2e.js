import { expect, test } from '@playwright/test';

const portfolio = page => page.locator('.portfolio-grid');
const table = page => portfolio(page).locator('.portfolio-grid__table');
const holdings = page => table(page).locator('.tabulator-tableholder .tabulator-row');
const cell = (row, field) => row.locator(`.tabulator-cell[tabulator-field="${field}"]`);
const totalCell = (page, field) => table(page).locator(`.tabulator-calcs-top .tabulator-cell[tabulator-field="${field}"]`);
const holding = (page, ticker) => holdings(page).filter({ has: page.locator('.portfolio-grid__instrument small', { hasText: ticker }) });
const icon = (page, ticker) => holding(page, ticker).locator('.portfolio-grid__instrument-icon');
const floatingMessage = page => page.locator('.teh-floating-message');
const floatingBody = page => floatingMessage(page).locator('.teh-floating-message__body');
const money = text => Number(text.replace(/[^\d.,-]/g, '').replaceAll(',', ''));
const percent = text => Number(text.match(/[+-]?\d+(?:\.\d+)?/)?.[0]);
const moneyIn = async locator => money(await locator.innerText());
const totalMoneyIn = (page, field) => moneyIn(totalCell(page, field).locator('.amb-calc-value'));
const totalReturnIn = async page => percent(await totalCell(page, 'profitLoss').locator('.portfolio-grid__top-return').innerText());
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

test('Initial lookup descriptions and F2 work without opening an editor first', async ({ page }) => {
    let logoRequestFailed = false;
    await page.route('**/assets/instruments/sap.svg', async route => {
        logoRequestFailed = true;
        await route.abort();
    });
    await openPortfolio(page);
    await expect.poll(() => logoRequestFailed).toBe(true);
    await expect(icon(page, 'SAP')).toHaveText('SA');
    await expect(icon(page, 'SAP').locator('img')).toHaveCount(0);
    const apple = cell(holdings(page).first(), 'instrument');
    const microsoft = cell(holdings(page).nth(1), 'instrument');
    await apple.hover();
    await expect(floatingMessage(page)).toHaveClass(/teh-floating-message--visible/);
    await expect(floatingBody(page)).toHaveText('AAPL');
    await microsoft.hover();
    await expect(floatingBody(page)).toHaveText('MSFT');
    await apple.focus();
    await expect(apple).toBeFocused();
    await expect(floatingBody(page)).toHaveText('AAPL');

    await apple.press('F2');
    const dialog = page.locator('.amb-lookup-dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    const editor = apple.locator('.amb-lookup-editor__input');
    await expect(editor).toHaveValue('Apple Inc.');
    await editor.press('F2');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await editor.press('Escape');
    await expect(apple.locator('.portfolio-grid__instrument small')).toHaveText('AAPL');
    await expect(apple).toBeFocused();
});

test('Angular portfolio renders fixed holdings, integrated totals, guide and live market', async ({ page }) => {
    await openPortfolio(page);
    for (const ticker of ['MSFT', 'ASML', 'SAP', 'BTC', 'ETH', 'SOL']) {
        const image = icon(page, ticker).locator('img');
        await expect(image).toBeVisible();
        expect(await image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
    }
    await expect(holdings(page).locator('.portfolio-grid__instrument-icon img')).toHaveCount(6);
    await expect(icon(page, 'AAPL')).toHaveText('AA');
    await expect(icon(page, 'IT30-SIM')).toHaveText('IT');
    await expect(icon(page, 'DE32-SIM')).toHaveText('DE');
    await expect(icon(page, 'EU36-SIM')).toHaveText('EU');
    await page.locator('#site-navbar .site-navbar__demo > button').click();
    await expect(page.locator('#site-navbar [data-demo-label="angular"]')).toBeVisible();
    await expect(page.locator('#site-navbar [data-demo-label="angular"]')).toHaveText('Angular');

    await expect(portfolio(page).locator('.amb-toolbar, .amb-row-action-button')).toHaveCount(0);
    await expect(portfolio(page).getByRole('button', { name: /^(Add|Delete|Save|Reload|Rollback|Payload)/i })).toHaveCount(0);
    await expect(table(page).locator('.tabulator-calcs-top')).toHaveCount(1);
    await expect(table(page).locator('.tabulator-calcs-bottom')).toHaveCount(0);
    await expect(table(page).locator('.tabulator-header .tabulator-calcs-top')).toHaveCount(1);
    await expect(totalCell(page, 'instrument').locator('.amb-calc-label')).toHaveText('POSIZIONI');
    await expect(totalCell(page, 'instrument').locator('.amb-calc-value')).toHaveText('14');
    await expect(totalCell(page, 'value').locator('.amb-calc-label')).toHaveText('VALORE TOTALE');
    await expect(totalCell(page, 'value').locator('.amb-calc-value')).toHaveText(/€[\d,]+\.\d{2}/);
    await expect(totalCell(page, 'profitLoss').locator('.amb-calc-label')).toHaveText('P/L TOTALE');
    await expect(totalCell(page, 'profitLoss').locator('.amb-calc-value')).toHaveText(/[+-]?€[\d,]+\.\d{2}/);
    await expect(totalCell(page, 'profitLoss').locator('.portfolio-grid__top-return')).toHaveText(/[+-]?\d+\.\d{2}%/);
    await expect(totalCell(page, 'changePercent')).toBeEmpty();

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
    const apple = holding(page, 'AAPL');
    const instrument = cell(apple, 'instrument');
    await instrument.focus();
    await expect(instrument).toBeFocused();
    const focusedNode = await instrument.elementHandle();
    const before = Object.fromEntries(await Promise.all(
        ['price', 'changePercent', 'value', 'profitLoss'].map(async field => [field, await cell(apple, field).innerText()]),
    ));
    const timelineBefore = await cell(apple, 'timeline').locator('svg').getAttribute('aria-label');
    const barsBefore = await cell(apple, 'timeline').locator('rect').evaluateAll(bars => bars.map(bar => bar.getAttribute('height')));
    const rowState = await apple.getAttribute('data-state');
    await expect.poll(() => cell(apple, 'price').innerText()).not.toBe(before.price);
    for (const field of ['changePercent', 'value', 'profitLoss']) {
        await expect(cell(apple, field)).not.toHaveText(before[field]);
    }
    await expect(cell(apple, 'timeline').locator('svg')).toHaveAttribute('aria-label', timelineBefore);
    await expect(cell(apple, 'timeline').locator('rect')).toHaveCount(32);
    await expect.poll(async () => {
        const bars = await cell(apple, 'timeline').locator('rect').evaluateAll(items => items.map(item => item.getAttribute('height')));
        return bars.some((height, index) => height !== barsBefore[index]);
    }).toBe(true);
    expect(await instrument.evaluate((node, original) => node === original, focusedNode)).toBe(true);
    await expect(instrument).toBeFocused();
    expect(await apple.getAttribute('data-state')).toBe(rowState);
    await expect.poll(async () => {
        const rowValues = await holdings(page).locator('.tabulator-cell[tabulator-field="value"]').allTextContents();
        return Math.abs(await totalMoneyIn(page, 'value') - rowValues.reduce((sum, value) => sum + money(value), 0));
    }).toBeLessThan(0.2);
    await summary.focus();
    const priceOutsideGrid = await cell(apple, 'price').innerText();
    await expect.poll(() => cell(apple, 'price').innerText()).not.toBe(priceOutsideGrid);
    expect(await apple.getAttribute('data-state')).toBe(rowState);
    await pauseMarket(page);
    const pausedTotal = await totalMoneyIn(page, 'value');
    const pausedProfit = await totalMoneyIn(page, 'profitLoss');
    near(await totalReturnIn(page), pausedProfit / (pausedTotal - pausedProfit) * 100, 0.02);
    const pausedPrices = await prices.allTextContents();
    let changedWhilePaused = false;
    const pausedAt = Date.now();
    await expect.poll(async () => {
        const current = await prices.allTextContents();
        changedWhilePaused ||= current.some((price, index) => price !== pausedPrices[index]);
        return Date.now() - pausedAt >= 1200 ? (changedWhilePaused ? 'changed' : 'stable') : 'observing';
    }, { intervals: [200], timeout: 3000 }).toBe('stable');
    near(await totalMoneyIn(page, 'value'), pausedTotal);
    await expect(holding(page, 'AAPL').locator('.portfolio-grid__timeline rect')).toHaveCount(32);
    await portfolio(page).locator('.portfolio-grid__pause').click();
    await expect.poll(async () => {
        const current = await prices.allTextContents();
        return current.some((price, index) => price !== pausedPrices[index]);
    }).toBe(true);
    await expect.poll(() => totalMoneyIn(page, 'value')).not.toBe(pausedTotal);
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
    const totalBefore = await totalMoneyIn(page, 'value');
    const totalProfitBefore = await totalMoneyIn(page, 'profitLoss');
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
    await expect(apple).toHaveAttribute('data-state', 'modified');
    await page.mouse.move(0, 0);
    const cleanPeer = holdings(page).nth(2);
    const rowColor = await apple.evaluate(element => getComputedStyle(element).backgroundColor);
    expect(rowColor).toBe(await cleanPeer.evaluate(element => getComputedStyle(element).backgroundColor));
    expect(await apple.evaluate(element => getComputedStyle(element).boxShadow)).toBe('none');
    expect(await quantity.evaluate(element => getComputedStyle(element).backgroundColor))
        .toBe(await cell(cleanPeer, 'quantity').evaluate(element => getComputedStyle(element).backgroundColor));
    await quantity.evaluate(element => element.setAttribute('data-cell-error', 'true'));
    expect(await quantity.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(
        await cell(cleanPeer, 'quantity').evaluate(element => getComputedStyle(element).backgroundColor),
    );
    await quantity.evaluate(element => element.removeAttribute('data-cell-error'));
    await quantity.dblclick({ delay: 100 });
    await expect(quantity.locator('input')).toBeVisible();
    await quantity.locator('input').press('Escape');

    near(await moneyIn(cell(apple, 'value')), valueBefore + price);
    near(await totalMoneyIn(page, 'value'), totalBefore + price);
    near(await moneyIn(cell(apple, 'profitLoss')), profitBefore + price - averageCost);
    near(await totalMoneyIn(page, 'profitLoss'), totalProfitBefore + price - averageCost);
    const totalValue = await totalMoneyIn(page, 'value');
    const totalProfit = await totalMoneyIn(page, 'profitLoss');
    near(await totalReturnIn(page), totalProfit / (totalValue - totalProfit) * 100, 0.02);
    await expect(holdings(page)).toHaveCount(14);

    await portfolio(page).locator('.portfolio-grid__pause').click();
    await quantity.dblclick({ delay: 100 });
    const liveInput = quantity.locator('input');
    await expect(liveInput).toBeFocused();
    const editorNode = await liveInput.elementHandle();
    const livePrice = await cell(apple, 'price').innerText();
    await expect.poll(() => cell(apple, 'price').innerText()).not.toBe(livePrice);
    await expect(liveInput).toHaveValue(/^17(?:[,.]0+)?$/);
    await expect(liveInput).toBeFocused();
    expect(await liveInput.evaluate((node, original) => node === original, editorNode)).toBe(true);
    await liveInput.press('Escape');
    await pauseMarket(page);
});

test('Multifield Lookup replaces one holding, excludes duplicates and releases its old instrument', async ({ page }) => {
    await openPortfolio(page);
    await pauseMarket(page);
    const first = holdings(page).first();
    await expect(first.locator('.portfolio-grid__instrument small')).toHaveText('AAPL');
    await expect(icon(page, 'AAPL')).toHaveText('AA');
    const oldValue = await moneyIn(cell(first, 'value'));
    const oldProfit = await moneyIn(cell(first, 'profitLoss'));
    const oldPrice = await moneyIn(cell(first, 'price'));
    const totalBefore = await totalMoneyIn(page, 'value');
    const totalProfitBefore = await totalMoneyIn(page, 'profitLoss');

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

    const instrument = cell(first, 'instrument');
    const reopenedInput = instrument.locator('.amb-lookup-editor__input');
    await expect(reopenedInput).toBeVisible();
    await expect(reopenedInput).toHaveValue('NVIDIA Corp.');
    await expect(reopenedInput).toBeFocused();
    await reopenedInput.press('Escape');
    await expect(instrument).not.toHaveClass(/tabulator-editing/);
    await expect(first.locator('.portfolio-grid__instrument strong')).toHaveText('NVIDIA Corp.');
    await expect(first.locator('.portfolio-grid__instrument small')).toHaveText('NVDA');
    await expect(icon(page, 'NVDA')).toHaveText('NV');
    await expect(icon(page, 'NVDA').locator('img')).toHaveCount(0);
    await instrument.hover();
    await expect(floatingMessage(page)).toHaveClass(/teh-floating-message--visible/);
    await expect(floatingBody(page)).toHaveText('NVDA');
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
    near(await totalMoneyIn(page, 'value'), totalBefore - oldValue + newValue);
    near(await totalMoneyIn(page, 'profitLoss'), totalProfitBefore - oldProfit + newProfit);
    const replacementTotal = await totalMoneyIn(page, 'value');
    const replacementProfit = await totalMoneyIn(page, 'profitLoss');
    near(await totalReturnIn(page), replacementProfit / (replacementTotal - replacementProfit) * 100, 0.02);
    const modifiedState = await first.getAttribute('data-state');
    expect(modifiedState).toBe('modified');

    await portfolio(page).locator('.portfolio-grid__pause').click();
    await instrument.focus();
    await expect(instrument).toBeFocused();
    const liveTotal = await totalCell(page, 'value').innerText();
    await expect.poll(() => totalCell(page, 'value').innerText()).not.toBe(liveTotal);
    await expect(instrument).toBeFocused();
    await expect(instrument.locator('.portfolio-grid__instrument strong')).toHaveText('NVIDIA Corp.');
    await expect(instrument.locator('.portfolio-grid__instrument small')).toHaveText('NVDA');
    await expect(cell(first, 'type')).toHaveText('Stock');
    await expect(holdings(page)).toHaveCount(14);
    expect(await first.getAttribute('data-state')).toBe(modifiedState);
    await pauseMarket(page);

    const microsoft = holdings(page).nth(1);
    await expect(microsoft.locator('.portfolio-grid__instrument small')).toHaveText('MSFT');
    const microsoftDialog = await openInstrumentLookup(page, microsoft);
    await microsoftDialog.locator('.amb-lookup-dialog__search').fill('AAPL');
    const releasedApple = microsoftDialog.locator('.amb-lookup-dialog__row').filter({ hasText: 'AAPL' });
    await expect(releasedApple).toHaveCount(1);
    await releasedApple.click();
    await expect(microsoftDialog.locator('.amb-lookup-dialog__button--primary')).toBeEnabled();
    await microsoftDialog.getByRole('button', { name: 'Cancel' }).click();
});
