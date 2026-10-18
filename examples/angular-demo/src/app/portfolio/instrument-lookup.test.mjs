import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'vitest';
import { INSTRUMENT_CATALOG } from './instrument-catalog.ts';
import { availableInstruments, filterInstruments, isDuplicateInstrument, positionKey } from './instrument-lookup.ts';
import { categoryClass, instrumentIdentity, tickerMonogram } from './instrument-identity.ts';

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

test('instrument identity maps local marks, bond flags and reliable fallbacks', () => {
  assert.equal(tickerMonogram('EU36-SIM'), 'EU');
  assert.equal(categoryClass('Bond'), 'is-bond');
  assert.equal(categoryClass(''), 'is-unselected');
  assert.deepEqual(instrumentIdentity('stock-aapl', 'AAPL'), {
    logo: 'assets/instruments/apple.svg', fallback: 'AA', wide: false, flag: false, fundTicker: undefined,
  });
  assert.equal(instrumentIdentity('stock-nvda', 'NVDA').logo, 'assets/instruments/nvidia.svg');
  assert.equal(instrumentIdentity('etf-vwce', 'VWCE').logo, 'assets/instruments/vanguard.svg');
  assert.equal(instrumentIdentity('etf-vuaa', 'VUAA').logo, 'assets/instruments/vanguard.svg');
  assert.deepEqual(instrumentIdentity('etf-cspx', 'CSPX'), {
    logo: 'assets/instruments/ishares.png', fallback: 'CS', wide: true, flag: false, fundTicker: 'CSPX',
  });
  assert.equal(instrumentIdentity('etf-aggh', 'AGGH').logo, 'assets/instruments/ishares.png');
  assert.equal(instrumentIdentity('bond-italy-2030', 'IT30-SIM').logo, 'assets/instruments/flag-it.svg');
  assert.equal(instrumentIdentity('bond-germany-2032', 'DE32-SIM').logo, 'assets/instruments/flag-de.svg');
  assert.deepEqual(instrumentIdentity('bond-eu-2036', 'EU36-SIM'), {
    logo: 'assets/instruments/flag-eu.svg', fallback: 'EU', wide: false, flag: true, fundTicker: undefined,
  });
  for (const [id, flag] of [
    ['bond-italy-2035', 'it'], ['bond-france-2031', 'fr'], ['bond-spain-2033', 'es'],
    ['bond-us-2034', 'us'], ['bond-netherlands-2030', 'nl'],
    ['bond-eib-2032', 'eu'], ['bond-enel-2031', 'it'],
  ]) {
    assert.equal(instrumentIdentity(id, 'BOND').logo, `assets/instruments/flag-${flag}.svg`);
  }
  assert.deepEqual(instrumentIdentity('etf-xgle', 'XGLE'), { logo: undefined, fallback: 'XG', wide: false, flag: false, fundTicker: undefined });
  assert.deepEqual(instrumentIdentity('crypto-avax', 'AVAX'), { logo: undefined, fallback: 'AV', wide: false, flag: false, fundTicker: undefined });
  assert.equal(instrumentIdentity('stock-googl', 'GOOGL').logo, 'assets/instruments/google.svg');
  assert.equal(instrumentIdentity('stock-jpm', 'JPM').logo, 'assets/instruments/jpmorgan.svg');
  assert.equal(instrumentIdentity('crypto-xrp', 'XRP').logo, 'assets/instruments/xrp.svg');
  assert.deepEqual(instrumentIdentity('unknown', 'TEST'), { logo: undefined, fallback: 'TE', wide: false, flag: false, fundTicker: undefined });
});

test('all 50 catalog identities use existing local assets or documented fallbacks', () => {
  assert.equal(INSTRUMENT_CATALOG.length, 50);
  const fallbacks = [];
  for (const instrument of INSTRUMENT_CATALOG) {
    const identity = instrumentIdentity(instrument.id, instrument.ticker);
    assert.ok(identity.fallback, instrument.id);
    if (!identity.logo) {
      fallbacks.push(instrument.id);
      continue;
    }
    assert.match(identity.logo, /^assets\/instruments\/[a-z0-9-]+\.(?:svg|png)$/);
    const asset = new URL(`../../${identity.logo}`, import.meta.url);
    assert.ok(existsSync(asset), `${instrument.id}: ${asset.pathname}`);
    if (identity.logo.endsWith('.svg')) {
      const svg = readFileSync(asset, 'utf8');
      assert.match(svg, /<svg\b/);
      assert.doesNotMatch(svg, /<(?:script|foreignObject)\b|(?:href|src)=["']https?:/i);
    }
  }
  assert.deepEqual(fallbacks, ['etf-xgle', 'crypto-avax']);
});
