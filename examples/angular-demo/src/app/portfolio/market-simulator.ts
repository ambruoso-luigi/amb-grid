import type { AssetCategory, Instrument, SimulatedQuote } from './portfolio.models';

export const TIMELINE_CAPACITY = 32;
export const MARKET_BANDS: Readonly<Record<AssetCategory, number>> = Object.freeze({
  Stock: 0.07,
  ETF: 0.05,
  Bond: 0.02,
  Crypto: 0.15,
});

const STEP_SIZE: Readonly<Record<AssetCategory, number>> = Object.freeze({
  Stock: 0.0028,
  ETF: 0.0018,
  Bond: 0.00065,
  Crypto: 0.006,
});

const ASML_ID = 'stock-asml';
const ASML_OSCILLATION = 0.008;
const ASML_PHASE_STEP = 0.8;
const ASML_REVERSION = 0.25;

/** Deterministic xorshift32; a zero seed is replaced to avoid its fixed point. */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = (seed >>> 0) || 0x9e3779b9;
  }

  next(): number {
    let value = this.state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0;
    return this.state / 0x100000000;
  }
}

interface MarketEntry {
  readonly category: AssetCategory;
  quote: SimulatedQuote;
  history: number[];
  tick: number;
}

/** In-memory simulated EUR market. No grid or Angular dependency. */
export class MarketSimulator {
  private readonly random: SeededRandom;
  private readonly entries = new Map<string, MarketEntry>();

  constructor(instruments: readonly Instrument[], quotes: readonly SimulatedQuote[], seed = 0x18a6b4) {
    this.random = new SeededRandom(seed);
    const categoryById = new Map(instruments.map((instrument) => [instrument.id, instrument.category]));
    for (const quote of quotes) {
      const category = categoryById.get(quote.instrumentId);
      if (!category || !Number.isFinite(quote.price) || quote.price < 0 ||
          !Number.isFinite(quote.previousClose) || quote.previousClose <= 0) {
        throw new RangeError(`Invalid simulated quote for ${quote.instrumentId}`);
      }

      const history = [quote.price];
      let earlier = quote.price;
      for (let index = 1; index < TIMELINE_CAPACITY; index += 1) {
        earlier = this.walk(earlier, quote.previousClose, category, quote.instrumentId, -index);
        history.unshift(earlier);
      }
      this.entries.set(quote.instrumentId, {
        category,
        quote: { ...quote },
        history,
        tick: 0,
      });
    }
  }

  quoteFor(instrumentId: string): SimulatedQuote {
    const entry = this.entries.get(instrumentId);
    if (!entry) throw new Error(`Unknown instrument ${instrumentId}`);
    return entry.quote;
  }

  historyFor(instrumentId: string): readonly number[] {
    const entry = this.entries.get(instrumentId);
    if (!entry) throw new Error(`Unknown instrument ${instrumentId}`);
    return entry.history;
  }

  advance(instrumentIds: readonly string[]): void {
    for (const instrumentId of instrumentIds) {
      const entry = this.entries.get(instrumentId);
      if (!entry) throw new Error(`Unknown instrument ${instrumentId}`);
      entry.tick += 1;
      const price = this.walk(entry.quote.price, entry.quote.previousClose, entry.category, instrumentId, entry.tick);
      entry.quote = { ...entry.quote, price };
      entry.history.push(price);
      if (entry.history.length > TIMELINE_CAPACITY) entry.history.shift();
    }
  }

  private walk(price: number, previousClose: number, category: AssetCategory, instrumentId: string, tick: number): number {
    const band = MARKET_BANDS[category];
    const noise = (this.random.next() * 2 - 1) * previousClose * STEP_SIZE[category];
    const reversion = instrumentId === ASML_ID
      ? (previousClose * (1 + ASML_OSCILLATION * Math.sin(tick * ASML_PHASE_STEP)) - price) * ASML_REVERSION
      : (previousClose - price) * 0.035;
    const lower = Math.max(0, previousClose * (1 - band));
    const upper = previousClose * (1 + band);
    return Math.min(upper, Math.max(lower, price + noise + reversion));
  }
}
