import { Injectable } from '@angular/core';
import { filter, interval, map, type Observable } from 'rxjs';
import { INSTRUMENT_CATALOG } from './instrument-catalog';
import { MarketSimulator } from './market-simulator';
import { INITIAL_QUOTES } from './portfolio-seed';

export interface MarketTickEvent {
  readonly instrumentIds: readonly string[];
}

/** Local RxJS feed; it does not open a network connection. */
@Injectable()
export class SimulatedMarketFeed {
  private readonly market = new MarketSimulator(INSTRUMENT_CATALOG, INITIAL_QUOTES);
  private cursor = 0;

  quoteFor(instrumentId: string) {
    return this.market.quoteFor(instrumentId);
  }

  historyFor(instrumentId: string): readonly number[] {
    return this.market.historyFor(instrumentId);
  }

  ticks(heldInstrumentIds: () => readonly string[]): Observable<MarketTickEvent> {
    return interval(900).pipe(
      map((): MarketTickEvent | null => {
        const ids = [...new Set(heldInstrumentIds().filter((id) => id.trim().length > 0))];
        if (ids.length === 0) return null;
        const instrumentIds = Array.from({ length: Math.min(4, ids.length) }, (_, index) =>
          ids[(this.cursor + index) % ids.length]!,
        );
        this.cursor = (this.cursor + instrumentIds.length) % ids.length;
        this.market.advance(instrumentIds);
        return { instrumentIds };
      }),
      filter((event): event is MarketTickEvent => event !== null),
    );
  }
}
