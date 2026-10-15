import type { DerivedPosition, Position, SimulatedQuote } from './portfolio.models';

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
