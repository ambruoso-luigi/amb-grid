import type { AssetCategory } from './portfolio.models';

interface InstrumentIdentity {
  readonly logo?: string;
  readonly fallback?: string;
}

/** Local assets and distinctive text fallbacks are keyed by catalog ID, including lookup replacements. */
const IDENTITIES: Readonly<Record<string, InstrumentIdentity>> = Object.freeze({
  'stock-msft': { logo: 'microsoft.svg' },
  'stock-asml': { logo: 'asml.svg' },
  'stock-sap': { logo: 'sap.svg' },
  'etf-vwce': { fallback: 'VW' },
  'etf-cspx': { fallback: 'CS' },
  'etf-aggh': { fallback: 'AG' },
  'bond-italy-2030': { fallback: 'IT' },
  'bond-germany-2032': { fallback: 'DE' },
  'bond-eu-2036': { fallback: 'EU' },
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

export function instrumentIdentity(id: string, ticker: string): { logo?: string; fallback: string } {
  const identity = IDENTITIES[id];
  return {
    logo: identity?.logo ? `assets/instruments/${identity.logo}` : undefined,
    fallback: identity?.fallback ?? tickerMonogram(ticker),
  };
}
