import assert from 'node:assert/strict';
import { test } from 'vitest';
import { INSTRUMENT_CATALOG } from './instrument-catalog.ts';
import { availableInstruments, instrumentSelectionPatch, isDuplicateInstrument } from './instrument-lookup.ts';
import { MarketSimulator } from './market-simulator.ts';
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
