import assert from 'node:assert/strict';
import { test } from 'vitest';
import { INSTRUMENT_CATALOG } from './instrument-catalog.ts';
import { availableInstruments, instrumentSelectionPatch, isDuplicateInstrument } from './instrument-lookup.ts';
import { MARKET_BANDS, MarketSimulator, TIMELINE_CAPACITY } from './market-simulator.ts';
import { calculatePortfolioTotals, normalizeQuantity } from './portfolio-calculations.ts';
import { INITIAL_POSITIONS, INITIAL_QUOTES } from './portfolio-seed.ts';

test('fixed holdings and catalog support exclusive selection', () => {
  assert.equal(INITIAL_POSITIONS.length, 14);
  assert.equal(INSTRUMENT_CATALOG.length, 50);
  const current = INITIAL_POSITIONS[0];
  const other = INITIAL_POSITIONS[1];
  const available = availableInstruments(INSTRUMENT_CATALOG, INITIAL_POSITIONS, current.id, '');
  assert.equal(available.some(({ id }) => id === current.instrumentId), true);
  assert.equal(available.some(({ id }) => id === other.instrumentId), false);
  assert.equal(isDuplicateInstrument(INITIAL_POSITIONS, other.instrumentId, current.id), true);
});

test('quantity conversion preserves crypto fractions and normalizes whole-unit categories', () => {
  assert.equal(normalizeQuantity(0.075, 'Crypto'), 0.075);
  assert.equal(normalizeQuantity(0.075, 'Stock'), 1);
  assert.equal(normalizeQuantity(8.4, 'Bond'), 9);
  assert.throws(() => normalizeQuantity(0, 'ETF'), RangeError);
});

test('replacement patch keeps the position ID, refreshes cost, and rejects duplicates without changing prior data', () => {
  const rows = [
    { id: 'first', instrumentId: 'crypto-btc', quantity: 0.075, averageCost: 50000 },
    { id: 'second', instrumentId: 'stock-aapl', quantity: 16, averageCost: 171.2 },
  ];
  const before = structuredClone(rows);
  const occupied = INSTRUMENT_CATALOG.find(({ id }) => id === 'stock-aapl');
  const free = INSTRUMENT_CATALOG.find(({ id }) => id === 'stock-msft');
  assert.equal(instrumentSelectionPatch(rows, 'first', occupied, 200), null);
  assert.deepEqual(rows, before);
  assert.deepEqual(instrumentSelectionPatch(rows, 'first', free, 420), {
    instrumentId: 'stock-msft', instrument: free.name, ticker: free.ticker, type: 'Stock',
    quantity: 1, averageCost: 420,
  });
  const same = INSTRUMENT_CATALOG.find(({ id }) => id === 'crypto-btc');
  assert.equal(instrumentSelectionPatch(rows, 'first', same, 90000).averageCost, 50000);
});

test('portfolio totals use current prices, weighted cost and neutral zero-cost return', () => {
  const positions = [
    { id: 'a', instrumentId: 'a', quantity: 2, averageCost: 10 },
    { id: 'b', instrumentId: 'b', quantity: 3, averageCost: 20 },
  ];
  const quotes = new Map([['a', { instrumentId: 'a', price: 12 }], ['b', { instrumentId: 'b', price: 18 }]]);
  const quoteFor = (id) => quotes.get(id);
  assert.deepEqual(calculatePortfolioTotals(positions, quoteFor), {
    cost: 80, value: 78, profitLoss: -2, returnPercent: -2.5,
  });
  positions[0].quantity = 4;
  assert.equal(calculatePortfolioTotals(positions, quoteFor).value, 102);
  quotes.set('a', { instrumentId: 'a', price: 10 });
  assert.equal(calculatePortfolioTotals(positions, quoteFor).value, 94);
  assert.deepEqual(calculatePortfolioTotals([{ id: 'c', instrumentId: 'a', quantity: 1, averageCost: 0 }], quoteFor), {
    cost: 0, value: 10, profitLoss: 10, returnPercent: 0,
  });
});

test('market ticks change totals without changing position data', () => {
  const market = new MarketSimulator(INSTRUMENT_CATALOG, INITIAL_QUOTES);
  const before = structuredClone(INITIAL_POSITIONS);
  const first = calculatePortfolioTotals(INITIAL_POSITIONS, (id) => market.quoteFor(id));
  market.advance([INITIAL_POSITIONS[0].instrumentId]);
  const next = calculatePortfolioTotals(INITIAL_POSITIONS, (id) => market.quoteFor(id));
  assert.notEqual(next.value, first.value);
  assert.deepEqual(INITIAL_POSITIONS, before);
});

test('ASML crosses previous close more often while other instruments keep their seeded path', () => {
  const seed = 0x18a6b4;
  const asmlId = 'stock-asml';
  const controlId = 'stock-asml-control';
  const ids = INITIAL_POSITIONS.map(({ instrumentId }) => instrumentId);
  const otherIds = ids.filter((id) => id !== asmlId);
  const controlIds = ids.map((id) => id === asmlId ? controlId : id);
  const controlCatalog = INSTRUMENT_CATALOG.map((instrument) => instrument.id === asmlId
    ? { ...instrument, id: controlId } : instrument);
  const controlQuotes = INITIAL_QUOTES.map((quote) => quote.instrumentId === asmlId
    ? { ...quote, instrumentId: controlId } : quote);
  const market = new MarketSimulator(INSTRUMENT_CATALOG, INITIAL_QUOTES, seed);
  const repeat = new MarketSimulator(INSTRUMENT_CATALOG, INITIAL_QUOTES, seed);
  const stockControl = new MarketSimulator(controlCatalog, controlQuotes, seed);
  const previousClose = market.quoteFor(asmlId).previousClose;
  let asmlCrossings = 0;
  let controlCrossings = 0;
  let asmlSign = Math.sign(market.quoteFor(asmlId).price - previousClose);
  let controlSign = asmlSign;
  let lastPrice = market.quoteFor(asmlId).price;

  for (let tick = 0; tick < 128; tick += 1) {
    market.advance(ids);
    repeat.advance(ids);
    stockControl.advance(controlIds);
    const price = market.quoteFor(asmlId).price;
    const controlPrice = stockControl.quoteFor(controlId).price;
    const nextSign = Math.sign(price - previousClose);
    const nextControlSign = Math.sign(controlPrice - previousClose);
    if (nextSign !== asmlSign) asmlCrossings += 1;
    if (nextControlSign !== controlSign) controlCrossings += 1;
    asmlSign = nextSign;
    controlSign = nextControlSign;
    assert.equal(price, repeat.quoteFor(asmlId).price);
    assert.ok(Number.isFinite(price) && price > 0);
    assert.ok(Math.abs(price - previousClose) <= previousClose * MARKET_BANDS.Stock);
    assert.ok(Math.abs(price - lastPrice) <= previousClose * 0.01);
    lastPrice = price;
    for (const id of otherIds) {
      assert.equal(market.quoteFor(id).price, stockControl.quoteFor(id).price);
    }
  }

  assert.ok(asmlCrossings >= 25);
  assert.ok(asmlCrossings >= controlCrossings + 8);
  const history = market.historyFor(asmlId);
  assert.equal(history.length, TIMELINE_CAPACITY);
  assert.equal(history.at(-1), market.quoteFor(asmlId).price);
  assert.ok(history.some((price) => price > previousClose));
  assert.ok(history.some((price) => price < previousClose));
  assert.deepEqual(history, repeat.historyFor(asmlId));
  for (const id of otherIds) {
    assert.deepEqual(market.historyFor(id), stockControl.historyFor(id));
  }
});

test('ASML ticks flow through portfolio totals without changing cost', () => {
  const market = new MarketSimulator(INSTRUMENT_CATALOG, INITIAL_QUOTES);
  const position = INITIAL_POSITIONS.find(({ instrumentId }) => instrumentId === 'stock-asml');
  const beforePrice = market.quoteFor(position.instrumentId).price;
  const before = calculatePortfolioTotals(INITIAL_POSITIONS, (id) => market.quoteFor(id));
  market.advance([position.instrumentId]);
  const afterPrice = market.quoteFor(position.instrumentId).price;
  const after = calculatePortfolioTotals(INITIAL_POSITIONS, (id) => market.quoteFor(id));
  const expectedChange = position.quantity * (afterPrice - beforePrice);
  assert.equal(after.cost, before.cost);
  assert.ok(Math.abs((after.value - before.value) - expectedChange) < 1e-8);
  assert.ok(Math.abs((after.profitLoss - before.profitLoss) - expectedChange) < 1e-8);
});
