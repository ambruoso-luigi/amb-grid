import assert from 'node:assert/strict';
import { test } from 'vitest';
import { availableInstruments, filterInstruments, isDuplicateInstrument, positionKey } from './instrument-lookup.ts';
import { categoryClass, INSTRUMENT_FAVICONS, tickerMonogram } from './instrument-identity.ts';

const catalog = [
  { id: 'stock-apple', ticker: 'AAPL', name: 'Apple Inc.', category: 'Stock' },
  { id: 'bond-eu', ticker: 'EU36', name: 'European Union Bond', category: 'Bond', isin: 'TEST-ISIN-001' },
  { id: 'crypto-ada', ticker: 'ADA', name: 'Cardano', category: 'Crypto' },
];

test('multifield search matches ticker, name, category and available ISIN', () => {
  for (const query of ['aapl', 'apple', 'stock']) {
    assert.deepEqual(filterInstruments(catalog, query).map(({ id }) => id), ['stock-apple']);
  }
  assert.deepEqual(filterInstruments(catalog, 'test-isin-001').map(({ id }) => id), ['bond-eu']);
  assert.equal(filterInstruments(catalog, '  ').length, catalog.length);
});

test('availability excludes other holdings and responds to replacement without mutating the catalog', () => {
  const rows = [
    { id: 'position-1', instrumentId: 'stock-apple' },
    { id: 'position-2', instrumentId: 'bond-eu' },
  ];
  assert.equal(positionKey(rows[1]), 'position-2');
  assert.deepEqual(availableInstruments(catalog, rows, 'position-1', '').map(({ id }) => id), ['stock-apple', 'crypto-ada']);
  assert.deepEqual(availableInstruments(catalog, rows, 'position-1', 'test-isin-001'), []);
  assert.equal(isDuplicateInstrument(rows, 'bond-eu', 'position-1'), true);
  assert.equal(isDuplicateInstrument(rows, 'stock-apple', 'position-1'), false);
  rows[0].instrumentId = 'crypto-ada';
  assert.deepEqual(availableInstruments(catalog, rows, 'position-1', '').map(({ id }) => id), ['stock-apple', 'crypto-ada']);
  assert.equal(isDuplicateInstrument(rows, 'crypto-ada', 'position-1'), false);
  assert.deepEqual(availableInstruments(catalog, rows, 'position-2', '').map(({ id }) => id), ['stock-apple', 'bond-eu']);
  assert.equal(Object.hasOwn(catalog[0], 'usato'), false);
});

test('icon fallback uses a local monogram and category; remote icons are explicitly mapped', () => {
  assert.equal(tickerMonogram('EU36-SIM'), 'EU');
  assert.equal(categoryClass('Bond'), 'is-bond');
  assert.equal(INSTRUMENT_FAVICONS['stock-aapl'], 'https://www.apple.com/favicon.ico');
  assert.equal(INSTRUMENT_FAVICONS['bond-eu'], undefined);
});
