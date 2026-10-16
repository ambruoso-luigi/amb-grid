import type { AssetCategory } from './portfolio.models';

/** Explicit official-site favicons. The monogram remains visible if a request fails or is offline. */
export const INSTRUMENT_FAVICONS: Readonly<Record<string, string>> = Object.freeze({
  'stock-aapl': 'https://www.apple.com/favicon.ico',
  'stock-msft': 'https://www.microsoft.com/favicon.ico',
  'stock-nvda': 'https://www.nvidia.com/favicon.ico',
  'stock-sap': 'https://www.sap.com/favicon.ico',
  'stock-asml': 'https://www.asml.com/favicon.ico',
  'etf-vwce': 'https://www.vanguard.com/favicon.ico',
  'etf-cspx': 'https://www.ishares.com/favicon.ico',
  'etf-aggh': 'https://www.ishares.com/favicon.ico',
  'crypto-btc': 'https://bitcoin.org/favicon.png',
  'crypto-eth': 'https://ethereum.org/favicon.ico',
});

export function tickerMonogram(ticker: string): string {
  return ticker.replace(/[^A-Z0-9]/gi, '').slice(0, 2).toUpperCase() || '—';
}

export function categoryClass(category: AssetCategory | ''): string {
  return category ? `is-${category.toLowerCase()}` : 'is-unselected';
}
