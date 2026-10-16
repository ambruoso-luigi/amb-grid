import type { AssetCategory, DerivedPosition, Position, SimulatedQuote } from './portfolio.models';

function nonNegativeFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a finite, non-negative number`);
  }
  return value;
}

function positiveFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a finite, positive number`);
  }
  return value;
}

function finiteResult(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} exceeds the supported numeric range`);
  }
  return value;
}

/** Percentage points; a zero previous close has no defined percentage change. */
export function calculateChangePercent(price: number, previousClose: number): number | null {
  nonNegativeFinite(price, 'Price');
  nonNegativeFinite(previousClose, 'Previous close');
  if (previousClose === 0) return null;
  return finiteResult(((price - previousClose) / previousClose) * 100, 'Change %');
}

export function calculatePosition(position: Position, quote: SimulatedQuote): DerivedPosition {
  if (position.instrumentId !== quote.instrumentId) {
    throw new Error(`Quote ${quote.instrumentId} does not match position ${position.id}`);
  }

  const quantity = positiveFinite(position.quantity, 'Quantity');
  const price = nonNegativeFinite(quote.price, 'Price');
  const averageCost = nonNegativeFinite(position.averageCost, 'Average cost');
  const changePercent = calculateChangePercent(price, quote.previousClose);

  return Object.freeze({
    positionId: position.id,
    instrumentId: position.instrumentId,
    value: finiteResult(quantity * price, 'Value'),
    profitLoss: finiteResult(quantity * (price - averageCost), 'P/L'),
    changePercent,
  });
}

export function calculatePortfolioValue(positions: readonly DerivedPosition[]): number {
  return positions.reduce(
    (total, position) => finiteResult(total + nonNegativeFinite(position.value, 'Value'), 'Portfolio value'),
    0,
  );
}

/** Preserves fractional crypto units and rounds up to a positive whole unit for other categories. */
export function normalizeQuantity(value: number, category: AssetCategory): number {
  positiveFinite(value, 'Quantity');
  return category === 'Crypto' ? value : Math.max(1, Math.ceil(value));
}

export interface PortfolioTotals {
  readonly cost: number;
  readonly value: number;
  readonly profitLoss: number;
  readonly returnPercent: number;
}

/** Aggregates current simulated quotes; zero cost has a neutral zero percent return. */
export function calculatePortfolioTotals(
  positions: readonly Position[], quoteFor: (instrumentId: string) => SimulatedQuote,
): PortfolioTotals {
  let cost = 0;
  let value = 0;
  for (const position of positions) {
    const units = positiveFinite(position.quantity, 'Quantity');
    cost = finiteResult(cost + units * nonNegativeFinite(position.averageCost, 'Average cost'), 'Portfolio cost');
    const quote = quoteFor(position.instrumentId);
    if (quote.instrumentId !== position.instrumentId) throw new Error(`Quote mismatch for ${position.id}`);
    value = finiteResult(value + units * nonNegativeFinite(quote.price, 'Price'), 'Portfolio value');
  }
  const profitLoss = finiteResult(value - cost, 'Portfolio P/L');
  return { cost, value, profitLoss, returnPercent: cost === 0 ? 0 : finiteResult(profitLoss / cost * 100, 'Portfolio return') };
}
