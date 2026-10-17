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
  'stock-asml': { logo: 'asml.svg' },
  'stock-sap': { logo: 'sap.svg' },
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
