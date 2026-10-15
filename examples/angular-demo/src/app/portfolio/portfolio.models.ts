export type AssetCategory = 'Stock' | 'ETF' | 'Bond' | 'Crypto';

export interface Instrument {
  readonly id: string;
  readonly ticker: string;
  readonly name: string;
  readonly category: AssetCategory;
  /** Simulated EUR price; for bonds, EUR per EUR 100 nominal lot. */
  readonly initialPrice: number;
  readonly isin?: string;
}

export interface Position {
  readonly id: string;
  readonly instrumentId: Instrument['id'];
  /** Units held, or EUR 100 nominal lots for bonds. */
  readonly quantity: number;
  readonly averageCost: number;
}

export interface SimulatedQuote {
  readonly instrumentId: Instrument['id'];
  readonly price: number;
  readonly previousClose: number;
}

export interface DerivedPosition {
  readonly positionId: Position['id'];
  readonly instrumentId: Instrument['id'];
  readonly value: number;
  readonly profitLoss: number;
  /** Percentage points; null when previousClose is zero. */
  readonly changePercent: number | null;
}
