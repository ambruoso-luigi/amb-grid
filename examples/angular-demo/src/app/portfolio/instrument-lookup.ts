import type { Instrument } from './portfolio.models';

export interface PositionIdentity {
  readonly id: string | null;
  readonly _ambTempId?: string;
  readonly instrumentId: string;
}

export function positionKey(row: PositionIdentity): string | null {
  return row.id || row._ambTempId || null;
}

export function filterInstruments(catalog: readonly Instrument[], query: string): Instrument[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [...catalog];
  return catalog.filter((instrument) => [
    instrument.ticker, instrument.name, instrument.category, instrument.isin,
  ].some((value) => value?.toLocaleLowerCase().includes(needle)));
}

export function isDuplicateInstrument(
  rows: readonly PositionIdentity[], instrumentId: string, currentKey: string,
): boolean {
  return rows.some((row) => positionKey(row) !== currentKey && row.instrumentId === instrumentId);
}
