import assert from 'node:assert/strict';
import { test } from 'vitest';
import { filterInstruments, isDuplicateInstrument, positionKey } from './instrument-lookup.ts';
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

test('duplicate check distinguishes the position ID from the instrument ID', () => {
  const rows = [
    { id: 'position-1', instrumentId: 'stock-apple' },
    { id: null, _ambTempId: 'temporary-1', instrumentId: '' },
  ];
  assert.equal(positionKey(rows[1]), 'temporary-1');
  assert.equal(isDuplicateInstrument(rows, 'stock-apple', 'temporary-1'), true);
  assert.equal(isDuplicateInstrument(rows, 'stock-apple', 'position-1'), false);
  assert.equal(isDuplicateInstrument(rows, 'crypto-ada', 'temporary-1'), false);
});

test('icon fallback uses a local monogram and category; remote icons are explicitly mapped', () => {
  assert.equal(tickerMonogram('EU36-SIM'), 'EU');
  assert.equal(categoryClass('Bond'), 'is-bond');
  assert.equal(INSTRUMENT_FAVICONS['stock-aapl'], 'https://www.apple.com/favicon.ico');
  assert.equal(INSTRUMENT_FAVICONS['bond-eu'], undefined);
});
