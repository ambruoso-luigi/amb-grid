import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { INITIAL_POSITIONS } from './portfolio-seed.ts';
import { SimulatedMarketFeed } from './simulated-market-feed.service.ts';

vi.mock('amb-grid', () => ({ AMB: { LookupDialog: class { destroy() {} } } }));

describe('SimulatedMarketFeed', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('emits after 900 ms and advances at most four unique held instruments', () => {
    const feed = new SimulatedMarketFeed();
    const ids = INITIAL_POSITIONS.slice(0, 6).map((row) => row.instrumentId);
    const before = feed.quoteFor(ids[0]).price;
    const history = [...feed.historyFor(ids[0])];
    const events = [];
    const subscription = feed.ticks(() => ['', ids[0], ids[0], ...ids.slice(1)]).subscribe((event) => events.push(event));
    vi.advanceTimersByTime(899);
    expect(events).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(events[0].instrumentIds).toEqual(ids.slice(0, 4));
    expect(feed.quoteFor(ids[0]).price).not.toBe(before);
    expect(feed.historyFor(ids[0])).toEqual([...history.slice(1), feed.quoteFor(ids[0]).price]);
    vi.advanceTimersByTime(900);
    expect(events[1].instrumentIds).toEqual([ids[4], ids[5], ids[0], ids[1]]);
    subscription.unsubscribe();
  });

  it('pauses and resumes without resetting market state or rotation', () => {
    const feed = new SimulatedMarketFeed();
    const ids = INITIAL_POSITIONS.slice(0, 6).map((row) => row.instrumentId);
    const events = [];
    const stream = feed.ticks(() => ids);
    let subscription = stream.subscribe((event) => events.push(event));
    vi.advanceTimersByTime(900);
    const pausedQuote = feed.quoteFor(ids[0]).price;
    const pausedHistory = [...feed.historyFor(ids[0])];
    subscription.unsubscribe();
    vi.advanceTimersByTime(9000);
    expect(events).toHaveLength(1);
    expect(feed.quoteFor(ids[0]).price).toBe(pausedQuote);
    expect(feed.historyFor(ids[0])).toEqual(pausedHistory);
    subscription = stream.subscribe((event) => events.push(event));
    vi.advanceTimersByTime(900);
    expect(events[1].instrumentIds).toEqual([ids[4], ids[5], ids[0], ids[1]]);
    expect(feed.quoteFor(ids[0]).price).not.toBe(pausedQuote);
    subscription.unsubscribe();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('uses the current holdings, ignores empty lists and releases its interval', () => {
    const feed = new SimulatedMarketFeed();
    const ids = INITIAL_POSITIONS.slice(0, 5).map((row) => row.instrumentId);
    let held = [];
    const events = [];
    const subscription = feed.ticks(() => held).subscribe((event) => events.push(event));
    vi.advanceTimersByTime(1800);
    expect(events).toHaveLength(0);
    held = [ids[0], ids[1]];
    vi.advanceTimersByTime(900);
    expect(events[0].instrumentIds).toEqual(held);
    held = [ids[4]];
    vi.advanceTimersByTime(900);
    expect(events[1].instrumentIds).toEqual([ids[4]]);
    subscription.unsubscribe();
    vi.advanceTimersByTime(1800);
    expect(events).toHaveLength(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps one component subscription across pause, visibility and destruction', async () => {
    const { PortfolioGridComponent } = await import('./portfolio-grid.component.ts');
    const document = { hidden: false, removeEventListener: vi.fn() };
    vi.stubGlobal('document', document);
    const feed = new SimulatedMarketFeed();
    const injector = Injector.create({ providers: [{ provide: SimulatedMarketFeed, useValue: feed }] });
    const component = runInInjectionContext(injector, () => new PortfolioGridComponent());
    const rows = INITIAL_POSITIONS.slice(0, 5);
    const grid = { getData: () => rows, recalc: vi.fn(), destroy: vi.fn() };
    component.grid = grid;
    const refresh = vi.spyOn(component, 'refreshLiveCells').mockImplementation(() => {});

    component.startFeed();
    component.startFeed();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(900);
    expect(refresh).toHaveBeenCalledTimes(4);
    expect(grid.recalc).toHaveBeenCalledTimes(1);
    document.hidden = true;
    component.onVisibilityChange();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(1800);
    expect(grid.recalc).toHaveBeenCalledTimes(1);
    component.toggleMarket(); // Paused while hidden.
    document.hidden = false;
    component.onVisibilityChange();
    expect(vi.getTimerCount()).toBe(0);
    component.toggleMarket();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(900);
    expect(grid.recalc).toHaveBeenCalledTimes(2);
    component.ngOnDestroy();
    expect(grid.destroy).toHaveBeenCalledOnce();
    expect(document.removeEventListener).toHaveBeenCalledWith('visibilitychange', component.onVisibilityChange);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(900);
    expect(grid.recalc).toHaveBeenCalledTimes(2);
  });
});
