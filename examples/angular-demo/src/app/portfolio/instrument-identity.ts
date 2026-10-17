import type { AssetCategory } from './portfolio.models';

interface InstrumentIdentity {
  readonly logo?: string;
  readonly fallback?: string;
  readonly wide?: boolean;
}

/** Local assets and distinctive text fallbacks are keyed by catalog ID, including lookup replacements. */
const IDENTITIES: Readonly<Record<string, InstrumentIdentity>> = Object.freeze({
  'stock-aapl': { logo: 'apple.svg' },
  'stock-msft': { logo: 'microsoft.svg' },
  'stock-nvda': { logo: 'nvidia.svg' },
  'stock-amzn': { logo: 'amazon.svg', wide: true },
  'stock-googl': { logo: 'google.svg' },
  'stock-meta': { logo: 'meta.svg', wide: true },
  'stock-tsla': { logo: 'tesla.svg' },
  'stock-jpm': { logo: 'jpmorgan.svg', wide: true },
  'stock-jnj': { logo: 'jnj.svg', wide: true },
  'stock-pg': { logo: 'pg.svg' },
  'stock-ko': { logo: 'cocacola.svg', wide: true },
  'stock-v': { logo: 'visa.svg', wide: true },
  'stock-ma': { logo: 'mastercard.svg', wide: true },
  'stock-asml': { logo: 'asml.svg' },
  'stock-sap': { logo: 'sap.svg' },
  'stock-nesn': { logo: 'nestle.svg', wide: true },
  'stock-mc': { logo: 'lvmh.svg', wide: true },
  'stock-enel': { logo: 'enel.png', wide: true },
  'etf-vwce': { logo: 'vanguard.svg', fallback: 'VW', wide: true },
  'etf-vuaa': { logo: 'vanguard.svg', wide: true },
  'etf-vagf': { logo: 'vanguard.svg', wide: true },
  'etf-cspx': { logo: 'ishares.png', fallback: 'CS', wide: true },
  'etf-aggh': { logo: 'ishares.png', fallback: 'AG', wide: true },
  'etf-iwda': { logo: 'ishares.png', wide: true },
  'etf-eunl': { logo: 'ishares.png', wide: true },
  'etf-eimi': { logo: 'ishares.png', wide: true },
  'etf-iema': { logo: 'ishares.png', wide: true },
  'etf-igla': { logo: 'ishares.png', wide: true },
  'etf-iprp': { logo: 'ishares.png', wide: true },
  'etf-xgle': { fallback: 'XG' },
  'bond-italy-2030': { logo: 'flag-it.svg', fallback: 'IT' },
  'bond-italy-2035': { logo: 'flag-it.svg', fallback: 'IT' },
  'bond-germany-2032': { logo: 'flag-de.svg', fallback: 'DE' },
  'bond-france-2031': { logo: 'flag-fr.svg', fallback: 'FR' },
  'bond-spain-2033': { logo: 'flag-es.svg', fallback: 'ES' },
  'bond-us-2034': { logo: 'flag-us.svg', fallback: 'US' },
  'bond-netherlands-2030': { logo: 'flag-nl.svg', fallback: 'NL' },
  'bond-eu-2036': { logo: 'flag-eu.svg', fallback: 'EU' },
  'bond-eib-2032': { logo: 'flag-eu.svg', fallback: 'EU' },
  'bond-enel-2031': { logo: 'flag-it.svg', fallback: 'IT' },
  'crypto-btc': { logo: 'bitcoin.svg', fallback: '₿' },
  'crypto-eth': { logo: 'ethereum.svg', fallback: 'Ξ' },
  'crypto-sol': { logo: 'solana.svg', fallback: 'SOL' },
  'crypto-ada': { logo: 'cardano.svg' },
  'crypto-xrp': { logo: 'xrp.svg' },
  'crypto-dot': { logo: 'polkadot.svg' },
  'crypto-avax': { fallback: 'AV' },
  'crypto-link': { logo: 'chainlink.svg' },
  'crypto-ltc': { logo: 'litecoin.svg' },
  'crypto-bch': { logo: 'bitcoincash.svg' },
});

export function tickerMonogram(ticker: string): string {
  return ticker.replace(/[^A-Z0-9]/gi, '').slice(0, 2).toUpperCase() || '—';
}

export function categoryClass(category: AssetCategory | ''): string {
  return category ? `is-${category.toLowerCase()}` : 'is-unselected';
}

export function instrumentIdentity(id: string, ticker: string): { logo?: string; fallback: string; wide: boolean } {
  const identity = IDENTITIES[id];
  return {
    logo: identity?.logo ? `assets/instruments/${identity.logo}` : undefined,
    fallback: identity?.fallback ?? tickerMonogram(ticker),
    wide: identity?.wide ?? false,
  };
}
