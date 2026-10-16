import type { Instrument } from './portfolio.models';
import { normalizeQuantity } from './portfolio-calculations';

export interface PositionIdentity {
  readonly id: string;
  readonly instrumentId: string;
}

/** The fixed holdings retain their persistent position ID when an instrument changes. */
export function positionKey(row: PositionIdentity): string {
  return row.id;
}

/** Matches the simulated catalog across ticker, name, category and optional ISIN. */
export function filterInstruments(catalog: readonly Instrument[], query: string): Instrument[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [...catalog];
  return catalog.filter((instrument) => [
    instrument.ticker, instrument.name, instrument.category, instrument.isin,
  ].some((value) => value?.toLocaleLowerCase().includes(needle)));
}

/** Omits instruments held by other rows while keeping the current holding available. */
export function availableInstruments(
  catalog: readonly Instrument[], rows: readonly PositionIdentity[], currentKey: string, query: string,
): Instrument[] {
  const occupied = new Set(rows.filter((row) => positionKey(row) !== currentKey).map((row) => row.instrumentId));
  return filterInstruments(catalog, query).filter((instrument) => !occupied.has(instrument.id));
}

/** Rechecks a selection at commit time independently of the lookup's visible results. */
export function isDuplicateInstrument(
  rows: readonly PositionIdentity[], instrumentId: string, currentKey: string,
): boolean {
  return rows.some((row) => positionKey(row) !== currentKey && row.instrumentId === instrumentId);
}

export interface ReplacementPosition extends PositionIdentity {
  readonly quantity: number;
  readonly averageCost: number;
}

/** Builds one CRUD patch only after uniqueness is checked against the latest holdings. */
export function instrumentSelectionPatch(
  rows: readonly ReplacementPosition[], currentKey: string, instrument: Instrument, currentPrice: number,
): { instrumentId: string; instrument: string; ticker: string; type: Instrument['category']; quantity: number; averageCost: number } | null {
  const current = rows.find((row) => positionKey(row) === currentKey);
  if (!current || isDuplicateInstrument(rows, instrument.id, currentKey)) return null;
  const unchanged = current.instrumentId === instrument.id;
  return {
    instrumentId: instrument.id,
    instrument: instrument.name,
    ticker: instrument.ticker,
    type: instrument.category,
    quantity: unchanged ? current.quantity : normalizeQuantity(current.quantity, instrument.category),
    averageCost: unchanged ? current.averageCost : currentPrice,
  };
}
