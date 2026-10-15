import { INSTRUMENT_CATALOG } from './instrument-catalog';
import type { Position, SimulatedQuote } from './portfolio.models';

/** Deterministic, entirely simulated EUR quotes for every catalog instrument. */
export const INITIAL_QUOTES: readonly SimulatedQuote[] = Object.freeze(
  INSTRUMENT_CATALOG.map((instrument, index) => Object.freeze({
    instrumentId: instrument.id,
    price: instrument.initialPrice,
    previousClose: instrument.initialPrice * (1 + ((index % 7) - 3) * 0.004),
  })),
);

const positions = [
  { id: 'pos-001', instrumentId: 'stock-aapl', quantity: 16, averageCost: 171.20 },
  { id: 'pos-002', instrumentId: 'stock-msft', quantity: 12, averageCost: 375.00 },
  { id: 'pos-003', instrumentId: 'stock-asml', quantity: 5, averageCost: 710.00 },
  { id: 'pos-004', instrumentId: 'stock-sap', quantity: 20, averageCost: 183.75 },
  { id: 'pos-005', instrumentId: 'stock-enel', quantity: 200, averageCost: 6.31 },
  { id: 'pos-006', instrumentId: 'etf-vwce', quantity: 30, averageCost: 113.40 },
  { id: 'pos-007', instrumentId: 'etf-cspx', quantity: 7, averageCost: 501.20 },
  { id: 'pos-008', instrumentId: 'etf-aggh', quantity: 400, averageCost: 5.08 },
  { id: 'pos-009', instrumentId: 'bond-italy-2030', quantity: 25, averageCost: 96.80 },
  { id: 'pos-010', instrumentId: 'bond-germany-2032', quantity: 18, averageCost: 99.40 },
  { id: 'pos-011', instrumentId: 'bond-eu-2036', quantity: 20, averageCost: 97.25 },
  { id: 'pos-012', instrumentId: 'crypto-btc', quantity: 0.075, averageCost: 51800.00 },
  { id: 'pos-013', instrumentId: 'crypto-eth', quantity: 1.35, averageCost: 2610.00 },
  { id: 'pos-014', instrumentId: 'crypto-sol', quantity: 8.4, averageCost: 128.50 },
] satisfies readonly Position[];

/** Initial clean baseline; no CRUD state is stored in portfolio data. */
export const INITIAL_POSITIONS: readonly Position[] = Object.freeze(
  positions.map((position) => Object.freeze(position)),
);
