import { expect, test } from '@playwright/test';
import { INSTRUMENT_CATALOG } from '../../examples/angular-demo/src/app/portfolio/instrument-catalog.ts';
import { instrumentIdentity } from '../../examples/angular-demo/src/app/portfolio/instrument-identity.ts';

const portfolio = page => page.locator('.portfolio-grid');
const table = page => portfolio(page).locator('.portfolio-grid__table');
const holdings = page => table(page).locator('.tabulator-tableholder .tabulator-row');
const cell = (row, field) => row.locator(`.tabulator-cell[tabulator-field="${field}"]`);
const totalCell = (page, field) => table(page).locator(`.tabulator-calcs-top .tabulator-cell[tabulator-field="${field}"]`);
const holding = (page, ticker) => holdings(page).filter({ has: page.locator('.portfolio-grid__instrument small', { hasText: ticker }) });
const icon = (page, ticker) => holding(page, ticker).locator('.portfolio-grid__instrument-icon');
const expectLoadedIcon = async (page, ticker, asset) => {
    const image = icon(page, ticker).locator('img');
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('src', `assets/instruments/${asset}`);
    expect(await image.evaluate(element => element.complete && element.naturalWidth > 0
        && new URL(element.src).origin === location.origin)).toBe(true);
};
const visibleFloatingMessage = page => page.locator('.teh-floating-message--visible');
const italianNumber = text => Number(text.replace(/[^\d.,+-]/g, '').replaceAll('.', '').replace(',', '.'));
const money = text => italianNumber(text);
const percent = text => italianNumber(text.replace('%', ''));
const moneyIn = async locator => money(await locator.innerText());
const totalMoneyIn = (page, field) => moneyIn(totalCell(page, field).locator('.amb-calc-value'));
const totalReturnIn = async page => percent(await totalCell(page, 'profitLoss').locator('.portfolio-grid__top-return').innerText());
const near = (actual, expected, tolerance = 0.05) => expect(Math.abs(actual - expected)).toBeLessThan(tolerance);
const rowBackground = row => row.evaluate(element => getComputedStyle(element).backgroundColor);
const instrumentNamePositions = page => holdings(page).locator('.portfolio-grid__instrument strong')
    .evaluateAll(names => names.map(name => name.getBoundingClientRect().x));
const expectAlignedNames = async page => {
    const positions = await instrumentNamePositions(page);
    expect(positions).toHaveLength(14);
    expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(1);
};

const openPortfolio = async page => {
    const response = await page.goto('/angular/');
    expect(response?.ok()).toBe(true);
    await expect(portfolio(page).getByRole('heading', { name: 'Portfolio Holdings' })).toBeVisible();
    await expect(holdings(page)).toHaveCount(14);
};

const pauseMarket = async page => {
    const control = portfolio(page).locator('.portfolio-grid__pause');
    await expect(control).toHaveAttribute('aria-label', 'Metti in pausa le quotazioni simulate');
    await control.click();
    await expect(control).toHaveAttribute('aria-label', 'Riprendi le quotazioni simulate');
};

const searchPositions = page => portfolio(page).getByRole('searchbox', { name: 'Cerca posizioni' });
const categoryChip = (page, label) => portfolio(page).getByRole('group', { name: 'Filtra per categoria' }).getByRole('button', { name: label, exact: true });
const positionCount = page => portfolio(page).locator('.portfolio-grid__count');

const openInstrumentLookup = async (page, row) => {
    const instrument = cell(row, 'instrument');
    await instrument.dblclick({ delay: 100 });
    await expect(instrument).toHaveClass(/tabulator-editing/);
    await instrument.locator('.amb-lookup-editor__button').click();
    const dialog = page.locator('.amb-lookup-dialog');
    await expect(dialog).toBeVisible();
    return dialog;
};

const expectNvidiaIdentity = async (page, { zeroProfit = true } = {}) => {
    const nvidia = holding(page, 'NVDA');
    await expect(nvidia).toHaveCount(1);
    await expect(cell(nvidia, 'instrument').locator('strong')).toHaveText('NVIDIA Corp.');
    await expect(cell(nvidia, 'instrument').locator('small')).toHaveText('NVDA');
    await expectLoadedIcon(page, 'NVDA', 'nvidia.svg');
    await expect(cell(nvidia, 'type')).toHaveText('Stock');
    const price = await moneyIn(cell(nvidia, 'price'));
    near(await moneyIn(cell(nvidia, 'value')), 16 * price, 0.1);
    if (zeroProfit) near(await moneyIn(cell(nvidia, 'profitLoss')), 0, 0.02);
    return price;
};

for (const filtered of [false, true]) {
    test(`Instrument name autocomplete commits with Tab ${filtered ? 'under portfolio filters' : 'without filters'}`, async ({ page }) => {
        await openPortfolio(page);
        await pauseMarket(page);
        const totalBefore = await totalMoneyIn(page, 'value');
        const profitBefore = await totalMoneyIn(page, 'profitLoss');
        const oldValue = await moneyIn(cell(holding(page, 'AAPL'), 'value'));
        const oldProfit = await moneyIn(cell(holding(page, 'AAPL'), 'profitLoss'));
        if (filtered) {
            await categoryChip(page, 'Azioni').click();
            await searchPositions(page).fill('AAPL');
        }
        const instrument = cell(holdings(page).first(), 'instrument');
        await instrument.dblclick({ delay: 100 });
        const input = instrument.locator('.amb-lookup-editor__input');
        await input.fill('NVI');
        await expect(input).toHaveValue('NVIDIA Corp.');
        expect(await input.evaluate(element => [element.selectionStart, element.selectionEnd]))
            .toEqual([3, 'NVIDIA Corp.'.length]);
        await input.press('Tab');
        await expect(table(page).locator('.amb-lookup-editor__input')).toHaveCount(0);
        if (filtered) {
            await expect(holdings(page)).toHaveCount(0);
            await expect(positionCount(page)).toHaveText('Nessun risultato');
            await searchPositions(page).fill('NVDA');
        } else {
            const quantityInput = cell(holding(page, 'NVDA'), 'quantity').locator('input');
            await expect(quantityInput).toBeFocused();
            await quantityInput.press('Escape');
        }
        await expectNvidiaIdentity(page);
        await expect(holding(page, 'NVDA')).toHaveAttribute('data-state', 'modified');
        await expect(totalCell(page, 'instrument').locator('.amb-calc-value')).toHaveText('14');
        near(await totalMoneyIn(page, 'value'), totalBefore - oldValue + await moneyIn(cell(holding(page, 'NVDA'), 'value')));
        near(await totalMoneyIn(page, 'profitLoss'), profitBefore - oldProfit);
        if (!filtered) await searchPositions(page).fill('NVDA');
        await portfolio(page).getByRole('button', { name: 'Azzera filtri' }).click();
        await expect(holdings(page)).toHaveCount(14);
        await expectNvidiaIdentity(page);
        await expect(holding(page, 'MSFT')).toHaveCount(1);
    });
}

test('Instrument autocomplete excludes occupied names, preserves current values and cancels suggestions', async ({ page }) => {
    await openPortfolio(page);
    await pauseMarket(page);
    const instrument = cell(holdings(page).first(), 'instrument');
    const input = instrument.locator('.amb-lookup-editor__input');
    const totalBefore = await totalMoneyIn(page, 'value');
    await instrument.dblclick({ delay: 100 });
    await input.fill('Microso');
    await input.press('Tab');
    await expect(input).toBeHidden();
    await expect(holding(page, 'AAPL')).toHaveCount(1);
    await expect(holding(page, 'MSFT')).toHaveCount(1);
    const quantityInput = cell(holdings(page).first(), 'quantity').locator('input');
    await expect(quantityInput).toBeFocused();
    await quantityInput.press('Escape');
    await instrument.dblclick({ delay: 100 });
    await input.fill('App');
    await expect(input).toHaveValue('Apple Inc.');
    await input.press('Enter');
    await expect(input).toBeHidden();
    await instrument.dblclick({ delay: 100 });
    await input.fill('NVI');
    await expect(input).toHaveValue('NVIDIA Corp.');
    await input.press('Escape');
    await expect(input).toBeHidden();
    await expect(instrument.locator('strong')).toHaveText('Apple Inc.');
    await expectLoadedIcon(page, 'AAPL', 'apple.svg');
    await expect(holdings(page).first()).toHaveAttribute('data-state', 'clean');
    near(await totalMoneyIn(page, 'value'), totalBefore);
    await instrument.dblclick({ delay: 100 });
    await input.fill('NVDA');
    await input.press('F2');
    const dialog = page.locator('.amb-lookup-dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('.amb-lookup-dialog__search').fill('NVDA');
    await expect(dialog.locator('.amb-lookup-dialog__row').filter({ hasText: 'NVDA' })).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('NVDA');
    await input.press('Escape');
    await expect(instrument.locator('small')).toHaveText('AAPL');
    await expect(holdings(page)).toHaveCount(14);
});

test('Financial styling preserves top totals, accessible Quantity and mobile scrolling', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openPortfolio(page);
    await pauseMarket(page);
    const title = await table(page).locator('.tabulator-col[tabulator-field="instrument"] .tabulator-col-title').boundingBox();
    const totals = await table(page).locator('.tabulator-calcs-top').boundingBox();
    const firstRow = await holdings(page).first().boundingBox();
    expect(totals.y).toBeGreaterThanOrEqual(title.y + title.height);
    expect(firstRow.y).toBeGreaterThanOrEqual(totals.y + totals.height);
    await expect(table(page).locator('.tabulator-calcs-top')).toHaveCSS('background-color', 'rgb(234, 242, 248)');
    const color = locator => locator.evaluate(element => getComputedStyle(element).color);
    expect(await color(portfolio(page).locator('.portfolio-grid__movement.is-positive').first())).toBe('rgb(22, 113, 73)');
    expect(await color(portfolio(page).locator('.portfolio-grid__movement.is-negative').first())).toBe('rgb(184, 59, 75)');
    const latestBar = holding(page, 'AAPL').locator('.portfolio-grid__timeline rect.is-latest');
    await expect(latestBar).toHaveCSS('opacity', '1');
    await expect(latestBar).toHaveCSS('animation-name', 'none');
    await page.screenshot({ path: test.info().outputPath('portfolio-desktop.png'), fullPage: true });
    const quantity = cell(holding(page, 'AAPL'), 'quantity');
    await quantity.focus();
    await expect(quantity).toBeFocused();
    await expect(quantity).toHaveCSS('outline-color', 'rgb(37, 99, 166)');
    await expect(quantity).toHaveCSS('outline-width', '2px');
    await quantity.dblclick({ delay: 100 });
    await expect(quantity.locator('input')).toBeFocused();
    await expect(quantity).toHaveCSS('background-color', 'rgb(230, 239, 247)');
    await quantity.locator('input').press('Escape');
    await expect(quantity).not.toHaveClass(/tabulator-editing/);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const scroll = portfolio(page).locator('.portfolio-grid__scroll');
    expect(await scroll.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
    await scroll.evaluate(element => { element.scrollLeft = element.scrollWidth; });
    await totalCell(page, 'profitLoss').scrollIntoViewIfNeeded();
    await expect(totalCell(page, 'profitLoss')).toBeInViewport();
    await scroll.evaluate(element => { element.scrollLeft = 0; });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: test.info().outputPath('portfolio-mobile.png'), fullPage: true });
});

test('Instrument replacement keeps the full NVIDIA identity without filters', async ({ page }) => {
    await openPortfolio(page);
    await pauseMarket(page);
    const dialog = await openInstrumentLookup(page, holdings(page).first());
    await dialog.locator('.amb-lookup-dialog__search').fill('NVDA');
    await dialog.locator('.amb-lookup-dialog__row').filter({ hasText: 'NVDA' }).click();
    await dialog.locator('.amb-lookup-dialog__button--primary').click();
    await expect(dialog).toBeHidden();
    const editor = cell(holdings(page).first(), 'instrument').locator('.amb-lookup-editor__input');
    await expect(editor).toHaveValue('NVIDIA Corp.');
    await editor.press('Escape');
    await expectNvidiaIdentity(page);
    await searchPositions(page).fill('AAPL');
    await expect(holdings(page)).toHaveCount(0);
    await searchPositions(page).fill('nvidia');
    await expectNvidiaIdentity(page);
    await portfolio(page).getByRole('button', { name: 'Azzera filtri' }).click();
    await expect(holdings(page)).toHaveCount(14);
    await expectNvidiaIdentity(page);
});

test('Search and category chips combine, clear independently, and report empty results', async ({ page }) => {
    await openPortfolio(page);
    await pauseMarket(page);
    await expect(positionCount(page)).toHaveCount(0);
    await expect(categoryChip(page, 'Tutti')).toHaveAttribute('aria-pressed', 'true');
    await searchPositions(page).fill('apple');
    await expect(holdings(page)).toHaveCount(1);
    await expect(holding(page, 'AAPL')).toHaveCount(1);
    await searchPositions(page).fill('  aApL  ');
    await expect(holdings(page)).toHaveCount(1);
    await searchPositions(page).fill('ETF');
    await expect(holdings(page)).toHaveCount(3);
    await searchPositions(page).fill('Bond');
    await expect(holdings(page)).toHaveCount(4);
    await searchPositions(page).fill('BTC');
    await expect(holding(page, 'BTC')).toHaveCount(1);
    await searchPositions(page).fill('Vanguard');
    await categoryChip(page, 'ETF').click();
    await expect(categoryChip(page, 'ETF')).toHaveAttribute('aria-pressed', 'true');
    await expect(categoryChip(page, 'Tutti')).toHaveAttribute('aria-pressed', 'false');
    await expect(categoryChip(page, 'Azioni')).toHaveAttribute('aria-pressed', 'false');
    await expect(holdings(page)).toHaveCount(1);
    await expect(holding(page, 'VWCE')).toHaveCount(1);
    await expect(positionCount(page)).toHaveText('1 risultato');
    await categoryChip(page, 'Crypto').click();
    await expect(searchPositions(page)).toHaveValue('Vanguard');
    await expect(holdings(page)).toHaveCount(0);
    await expect(positionCount(page)).toHaveText('Nessun risultato');
    await expect(portfolio(page).getByRole('status')).toContainText('Nessuna posizione corrisponde alla ricerca.');
    await portfolio(page).getByRole('button', { name: 'Cancella ricerca' }).click();
    await expect(holdings(page)).toHaveCount(3);
    await expect(categoryChip(page, 'Crypto')).toHaveAttribute('aria-pressed', 'true');
    await searchPositions(page).fill('zzz-no-match');
    await portfolio(page).getByRole('button', { name: 'Azzera filtri' }).first().click();
    await expect(searchPositions(page)).toHaveValue('');
    await expect(categoryChip(page, 'Tutti')).toHaveAttribute('aria-pressed', 'true');
    await expect(holdings(page)).toHaveCount(14);
    await expect(positionCount(page)).toHaveCount(0);
    await categoryChip(page, 'Obbligazioni').click();
    await expect(holdings(page)).toHaveCount(3);
    await categoryChip(page, 'Tutti').click();
    await expect(holdings(page)).toHaveCount(14);
    await expect(portfolio(page).getByRole('button', { name: /^(Add|Delete|Save|Reload|Rollback|Payload)/i })).toHaveCount(0);
});

test('Filtered quantity edit changes global totals and preserves CRUD, tooltips and F2', async ({ page }) => {
    await openPortfolio(page);
    await pauseMarket(page);
    const totalBefore = await totalMoneyIn(page, 'value');
    const profitBefore = await totalMoneyIn(page, 'profitLoss');
    await categoryChip(page, 'Azioni').click();
    await expect(holdings(page)).toHaveCount(5);
    near(await totalMoneyIn(page, 'value'), totalBefore);
    near(await totalMoneyIn(page, 'profitLoss'), profitBefore);
    await expect(totalCell(page, 'instrument').locator('.amb-calc-value')).toHaveText('14');
    const apple = holding(page, 'AAPL');
    const price = await moneyIn(cell(apple, 'price'));
    const oldValue = await moneyIn(cell(apple, 'value'));
    const oldProfit = await moneyIn(cell(apple, 'profitLoss'));
    const quantity = cell(apple, 'quantity');
    await quantity.dblclick({ delay: 100 });
    await quantity.locator('input').fill('17');
    await quantity.locator('input').press('Enter');
    await expect(quantity).toHaveText('17');
    await expect(apple).toHaveAttribute('data-state', 'modified');
    near(await totalMoneyIn(page, 'value'), totalBefore + price);
    near(await totalMoneyIn(page, 'profitLoss'), profitBefore + oldProfit / 16);
    near(await moneyIn(cell(apple, 'value')), oldValue + price);
    await expect(totalCell(page, 'instrument').locator('.amb-calc-value')).toHaveText('14');
    await cell(apple, 'instrument').hover();
    await expect(visibleFloatingMessage(page)).toHaveCount(0);
    await cell(apple, 'instrument').focus();
    await cell(apple, 'instrument').press('F2');
    await expect(page.locator('.amb-lookup-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.amb-lookup-dialog')).toBeHidden();
    const instrument = cell(holdings(page).first(), 'instrument');
    const editor = instrument.locator('.amb-lookup-editor__input');
    await expect(editor).toBeVisible();
    await expect(editor).toBeFocused();
    await editor.press('Escape');
    await expect(instrument).not.toHaveClass(/tabulator-editing/);
    await expect(instrument.locator('.portfolio-grid__instrument small')).toHaveText('AAPL');
    await expect(cell(apple, 'quantity')).toHaveText('17');
    await expect(apple).toHaveAttribute('data-state', 'modified');
});

test('Quantity editors use integers for Stock, ETF and Bond and retain eight Crypto decimals', async ({ page }) => {
    test.setTimeout(60000);
    await openPortfolio(page);
    await pauseMarket(page);
    for (const ticker of ['AAPL', 'VWCE', 'IT30-SIM']) {
        const row = holding(page, ticker);
        const quantity = cell(row, 'quantity');
        const original = await quantity.innerText();
        const totalBefore = await totalMoneyIn(page, 'value');
        for (const invalid of ['17,5', '17,00000001', '17.5', '0']) {
            await quantity.dblclick({ delay: 100 });
            const input = quantity.locator('input');
            await expect(input).toHaveAttribute('inputmode', 'numeric');
            await expect(input).toHaveValue(/^\d+$/);
            await input.fill(invalid);
            await input.press('Enter');
            await expect(quantity).not.toHaveClass(/tabulator-editing/);
            await expect(quantity).toHaveText(original);
            await expect(row).toHaveAttribute('data-state', 'clean');
            near(await totalMoneyIn(page, 'value'), totalBefore);
        }
        await quantity.dblclick({ delay: 100 });
        await quantity.locator('input').fill('17');
        await quantity.locator('input').press('Enter');
        await expect(quantity).toHaveText('17');
        await expect(row).toHaveAttribute('data-state', 'modified');
        await quantity.dblclick({ delay: 100 });
        await expect(quantity.locator('input')).toHaveValue('17');
        await quantity.locator('input').fill('18');
        await quantity.locator('input').press('Escape');
        await expect(quantity).toHaveText('17');
    }
    const bitcoin = holding(page, 'BTC');
    const quantity = cell(bitcoin, 'quantity');
    const totalBefore = await totalMoneyIn(page, 'value');
    const oldValue = await moneyIn(cell(bitcoin, 'value'));
    await quantity.dblclick({ delay: 100 });
    await expect(quantity.locator('input')).toHaveAttribute('inputmode', 'decimal');
    await quantity.locator('input').fill('0,12345678');
    await quantity.locator('input').press('Enter');
    await expect(quantity).toHaveText('0,12345678');
    await expect(bitcoin).toHaveAttribute('data-state', 'modified');
    near(await moneyIn(cell(bitcoin, 'value')), 0.12345678 * await moneyIn(cell(bitcoin, 'price')));
    near(await totalMoneyIn(page, 'value'), totalBefore - oldValue + await moneyIn(cell(bitcoin, 'value')));
    await expect(holdings(page)).toHaveCount(14);
});

test('Replacing an instrument reevaluates filters and hidden positions receive live quotes', async ({ page }) => {
    await openPortfolio(page);
    await pauseMarket(page);
    await searchPositions(page).fill('AAPL');
    const apple = holdings(page).first();
    const dialog = await openInstrumentLookup(page, apple);
    await dialog.locator('.amb-lookup-dialog__search').fill('NVDA');
    await dialog.locator('.amb-lookup-dialog__row').filter({ hasText: 'NVDA' }).click();
    await dialog.locator('.amb-lookup-dialog__button--primary').click();
    await expect(dialog).toBeHidden();
    const editingInput = holdings(page).first().locator('.amb-lookup-editor__input');
    if (await editingInput.isVisible()) {
        await expect(editingInput).toHaveValue('NVIDIA Corp.');
        await editingInput.press('Escape');
    }
    await expect(holdings(page)).toHaveCount(0);
    await expect(positionCount(page)).toHaveText('Nessun risultato');
    await searchPositions(page).fill('NVDA');
    const initialNvidiaPrice = await expectNvidiaIdentity(page);
    await expect(holding(page, 'NVDA')).toHaveAttribute('data-state', 'modified');
    await expect(totalCell(page, 'instrument').locator('.amb-calc-value')).toHaveText('14');
    await searchPositions(page).fill('BTC');
    const oldPrice = await cell(holding(page, 'BTC'), 'price').innerText();
    await categoryChip(page, 'ETF').click();
    await expect(holdings(page)).toHaveCount(0);
    await portfolio(page).locator('.portfolio-grid__pause').click();
    await page.waitForTimeout(4000);
    await pauseMarket(page);
    await categoryChip(page, 'Tutti').click();
    await expect(holding(page, 'BTC')).toHaveCount(1);
    await expect(cell(holding(page, 'BTC'), 'price')).not.toHaveText(oldPrice);
    await expect(holding(page, 'NVDA')).toHaveCount(0);
    await portfolio(page).getByRole('button', { name: 'Azzera filtri' }).click();
    await expect(holdings(page)).toHaveCount(14);
    const currentNvidiaPrice = await expectNvidiaIdentity(page, { zeroProfit: false });
    near(await moneyIn(cell(holding(page, 'NVDA'), 'profitLoss')),
        16 * (currentNvidiaPrice - initialNvidiaPrice), 0.1);
    await expect(holding(page, 'NVDA')).toHaveAttribute('data-state', 'modified');
});

test('Initial Instrument cells omit descriptions and F2 works without opening an editor first', async ({ page }) => {
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
    await expect(apple).not.toHaveAttribute('data-lookup-field', /.+/);
    await expect(visibleFloatingMessage(page)).toHaveCount(0);
    await microsoft.hover();
    await expect(microsoft).not.toHaveAttribute('data-lookup-field', /.+/);
    await expect(visibleFloatingMessage(page)).toHaveCount(0);
    await apple.focus();
    await expect(apple).toBeFocused();
    await expect(visibleFloatingMessage(page)).toHaveCount(0);

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
    for (const [ticker, asset] of [
        ['AAPL', 'apple.svg'], ['MSFT', 'microsoft.svg'], ['ASML', 'asml.svg'],
        ['SAP', 'sap.svg'], ['ENEL', 'enel.png'], ['VWCE', 'vanguard.svg'],
        ['CSPX', 'ishares.png'], ['AGGH', 'ishares.png'], ['IT30-SIM', 'flag-it.svg'],
        ['DE32-SIM', 'flag-de.svg'], ['EU36-SIM', 'flag-eu.svg'],
        ['BTC', 'bitcoin.svg'], ['ETH', 'ethereum.svg'], ['SOL', 'solana.svg'],
    ]) {
        await expectLoadedIcon(page, ticker, asset);
    }
    await expect(holdings(page).locator('.portfolio-grid__instrument-icon img')).toHaveCount(14);
    const catalogAssets = new Set(INSTRUMENT_CATALOG.map(({ id, ticker }) => instrumentIdentity(id, ticker).logo).filter(Boolean));
    for (const asset of catalogAssets) {
        const response = await page.request.get(new URL(asset, page.url()).href);
        expect(response.ok(), asset).toBe(true);
        expect(response.headers()['content-type'], asset).toMatch(/^image\/(?:svg\+xml|png)/);
    }
    await expectAlignedNames(page);
    const wideIcon = icon(page, 'VWCE');
    expect((await wideIcon.boundingBox()).width).toBe(60);
    await expect(cell(holding(page, 'BTC'), 'quantity')).toHaveText('0,075');
    await expect(cell(holding(page, 'ETH'), 'quantity')).toHaveText('1,35');
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
    await expect(totalCell(page, 'value').locator('.amb-calc-value')).toHaveText(/\d{1,3}(?:\.\d{3})+,\d{2}\s*€/);
    await expect(cell(holding(page, 'AAPL'), 'value')).toHaveText(/^\d\.\d{3},\d{2}\s*€$/);
    await expect(totalCell(page, 'profitLoss').locator('.amb-calc-label')).toHaveText('P/L TOTALE');
    await expect(totalCell(page, 'profitLoss').locator('.amb-calc-value')).toHaveText(/[+-]?[\d.]+,\d{2}\s*€/);
    await expect(totalCell(page, 'profitLoss').locator('.portfolio-grid__top-return')).toHaveText(/[+-]?[\d.]+,\d{2}%/);
    expect((await table(page).locator('.portfolio-grid__movement, .portfolio-grid__top-return').allTextContents())
        .every(text => !text.includes('-0,00%'))).toBe(true);
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
    const rowColor = await rowBackground(apple);
    expect(rowColor).toBe(await rowBackground(cleanPeer));
    expect(await apple.evaluate(element => getComputedStyle(element).boxShadow)).toBe('none');
    await cleanPeer.hover();
    expect(await rowBackground(cleanPeer)).toBe('rgb(237, 244, 250)');
    await apple.hover();
    expect(await rowBackground(apple)).toBe('rgb(237, 244, 250)');
    expect(await rowBackground(cleanPeer)).toBe(rowColor);
    await page.mouse.move(0, 0);
    expect(await rowBackground(apple)).toBe(rowColor);
    await apple.evaluate(element => element.setAttribute('data-row-error', 'true'));
    await apple.hover();
    expect(await rowBackground(apple)).toBe('rgb(255, 240, 240)');
    expect(await apple.evaluate(element => getComputedStyle(element).boxShadow)).not.toBe('none');
    await apple.evaluate(element => element.removeAttribute('data-row-error'));
    await cleanPeer.evaluate(element => element.setAttribute('data-has-cell-error', 'true'));
    await cleanPeer.hover();
    expect(await rowBackground(cleanPeer)).toBe('rgb(255, 240, 240)');
    await cleanPeer.evaluate(element => element.removeAttribute('data-has-cell-error'));
    await page.mouse.move(0, 0);
    expect(await rowBackground(cleanPeer)).toBe(rowColor);
    await expect(apple).toHaveAttribute('data-state', 'modified');
    await expect(cleanPeer).toHaveAttribute('data-state', 'clean');
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

test('four-digit profit and loss totals keep Italian grouping for both signs', async ({ page }) => {
    await openPortfolio(page);
    await pauseMarket(page);
    const asml = holding(page, 'ASML');
    const oldProfit = await moneyIn(cell(asml, 'profitLoss'));
    const totalBefore = await totalMoneyIn(page, 'profitLoss');
    expect(oldProfit).toBeLessThan(0);
    await expect(totalCell(page, 'profitLoss').locator('.amb-calc-value')).toHaveText(/^\+\d\.\d{3},\d{2}\s*€$/);

    const units = Math.ceil((totalBefore - oldProfit + 1500) / -(oldProfit / 5));
    const quantity = cell(asml, 'quantity');
    await quantity.dblclick({ delay: 100 });
    await quantity.locator('input').fill(String(units));
    await quantity.locator('input').press('Enter');
    await expect(asml).toHaveAttribute('data-state', 'modified');
    await expect(quantity).toHaveText(String(units));
    await expect(cell(asml, 'profitLoss')).toHaveText(/^-\d\.\d{3},\d{2}\s*€$/);
    await expect(totalCell(page, 'profitLoss').locator('.amb-calc-value')).toHaveText(/^-\d\.\d{3},\d{2}\s*€$/);
    const newProfit = await moneyIn(cell(asml, 'profitLoss'));
    near(newProfit, oldProfit / 5 * units);
    near(await totalMoneyIn(page, 'profitLoss'), totalBefore - oldProfit + newProfit);
    const totalValue = await totalMoneyIn(page, 'value');
    const rowValues = await holdings(page).locator('.tabulator-cell[tabulator-field="value"]').allTextContents();
    near(totalValue, rowValues.reduce((sum, value) => sum + money(value), 0), 0.2);
});

test('Multifield Lookup replaces one holding, excludes duplicates and releases its old instrument', async ({ page }) => {
    await openPortfolio(page);
    await pauseMarket(page);
    const first = holdings(page).first();
    await expect(first.locator('.portfolio-grid__instrument small')).toHaveText('AAPL');
    await expectLoadedIcon(page, 'AAPL', 'apple.svg');
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
    await expectLoadedIcon(page, 'NVDA', 'nvidia.svg');
    await expectAlignedNames(page);
    await instrument.hover();
    await expect(instrument).not.toHaveAttribute('data-lookup-field', /.+/);
    await expect(visibleFloatingMessage(page)).toHaveCount(0);
    await expect(cell(first, 'type')).toHaveText('Stock');
    await expect(holding(page, 'AAPL')).toHaveCount(0);
    await expect(holding(page, 'MSFT')).toHaveCount(1);
    await expect(holding(page, 'NVDA')).toHaveCount(1);
    await expect(holdings(page)).toHaveCount(14);
    await expect(cell(first, 'price')).toHaveText(/\d+,\d{2}\s*€/);
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
