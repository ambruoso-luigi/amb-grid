import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { AMB } from 'amb-grid';
import { INSTRUMENT_CATALOG } from './instrument-catalog';
import { MarketSimulator, TIMELINE_CAPACITY } from './market-simulator';
import { calculatePosition } from './portfolio-calculations';
import { INITIAL_POSITIONS, INITIAL_QUOTES } from './portfolio-seed';
import type { AssetCategory } from './portfolio.models';

interface HoldingsRow {
  id: string;
  instrument: string;
  ticker: string;
  type: AssetCategory;
  quantity: number;
}

interface EditedCell {
  getField(): string;
  getRow(): { getData(): HoldingsRow };
}

const instrumentsById = new Map(INSTRUMENT_CATALOG.map((instrument) => [instrument.id, instrument]));
const positionsById = new Map(INITIAL_POSITIONS.map((position) => [position.id, position]));
const heldInstrumentIds = INITIAL_POSITIONS.map((position) => position.instrumentId);

function initialRows(): HoldingsRow[] {
  return INITIAL_POSITIONS.map((position) => {
    const instrument = instrumentsById.get(position.instrumentId);
    if (!instrument) throw new Error(`Missing instrument ${position.instrumentId}`);
    return {
      id: position.id,
      instrument: instrument.name,
      ticker: instrument.ticker,
      type: instrument.category,
      quantity: position.quantity,
    };
  });
}

const euro = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const quantity = new Intl.NumberFormat('en-IE', { maximumFractionDigits: 8 });
const percent = new Intl.NumberFormat('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'always' });

function escaped(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character);
}

function signedValue(value: number | null, formatted: string): string {
  const className = value === null || value === 0 ? 'is-neutral' : value > 0 ? 'is-positive' : 'is-negative';
  return `<span class="portfolio-grid__movement ${className}">${formatted}</span>`;
}

function timelineSvg(history: readonly number[], ticker: string, previousClose: number): string {
  const low = Math.min(...history);
  const high = Math.max(...history);
  const spread = Math.max(high - low, previousClose * 0.001);
  const base = low - spread * 0.15;
  const scale = spread * 1.3;
  const latest = history.at(-1) ?? previousClose;
  const direction = latest >= previousClose ? 'is-positive' : 'is-negative';
  const bars = history.map((price, index) => {
    const height = Math.max(3, Math.min(34, ((price - base) / scale) * 34));
    const x = index * 4;
    return `<rect class="${index === history.length - 1 ? 'is-latest' : ''}" x="${x}" y="${36 - height}" width="2.7" height="${height}" rx="1"/>`;
  }).join('');
  return `<svg class="portfolio-grid__timeline ${direction}" viewBox="0 0 ${TIMELINE_CAPACITY * 4} 36" role="img" aria-label="${escaped(ticker)}: andamento simulato degli ultimi ${history.length} campioni">${bars}</svg>`;
}

@Component({
  selector: 'app-portfolio-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './portfolio-grid.component.html',
  styleUrl: './portfolio-grid.component.css',
})
export class PortfolioGridComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gridHost', { static: true }) private gridHost!: ElementRef<HTMLElement>;

  private readonly holdings = signal<HoldingsRow[]>(initialRows());
  readonly live = signal(true);
  private readonly market = new MarketSimulator(INSTRUMENT_CATALOG, INITIAL_QUOTES);
  private grid: ReturnType<typeof AMB.table> | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private cursor = 0;
  private readonly editingRows = new Set<string>();
  private readonly onVisibilityChange = () => {
    if (document.hidden) this.stopTimer();
    else this.startTimer();
  };

  private positionFor(row: HoldingsRow) {
    const position = positionsById.get(row.id);
    if (!position) throw new Error(`Missing position ${row.id}`);
    return position;
  }

  private quoteFor(row: HoldingsRow) {
    return this.market.quoteFor(this.positionFor(row).instrumentId);
  }

  private derivedFor(row: HoldingsRow) {
    return calculatePosition({ ...this.positionFor(row), quantity: row.quantity }, this.quoteFor(row));
  }

  ngAfterViewInit(): void {
    this.grid = AMB.table({
      selector: this.gridHost.nativeElement,
      data: this.holdings().map((row) => ({ ...row })),
      index: 'id',
      layout: 'fitColumns',
      toolbar: false,
      rowActionColumn: { enabled: false },
      columns: [
        {
          title: 'Instrument', field: 'instrument', minWidth: 230, widthGrow: 2.4,
          formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => {
            const row = cell.getRow().getData();
            return `<span class="portfolio-grid__instrument"><strong>${escaped(row.instrument)}</strong><small>${escaped(row.ticker)}</small></span>`;
          },
        },
        {
          title: 'Timeline', field: 'timeline', minWidth: 154, widthGrow: 1.2, headerSort: false,
          formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => {
            const row = cell.getRow().getData();
            const position = this.positionFor(row);
            return timelineSvg(this.market.historyFor(position.instrumentId), row.ticker, this.quoteFor(row).previousClose);
          },
        },
        { title: 'Type', field: 'type', minWidth: 92, widthGrow: 0.7 },
        { title: 'Price', field: 'price', minWidth: 118, widthGrow: 1, hozAlign: 'right', headerSort: false, formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => euro.format(this.quoteFor(cell.getRow().getData()).price) },
        { title: 'Change %', field: 'changePercent', minWidth: 112, widthGrow: 0.9, hozAlign: 'right', headerSort: false, formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => {
          const value = this.derivedFor(cell.getRow().getData()).changePercent;
          return signedValue(value, value === null ? '—' : `${percent.format(value)}%`);
        } },
        {
          title: 'Quantity', field: 'quantity', minWidth: 112, widthGrow: 0.9, hozAlign: 'right',
          editor: (cell: EditedCell, onRendered: (callback: () => void) => void, success: (value: number) => void, cancel: () => void) => {
            const decimalEditor = AMB.editors.decimal({ decimalDigits: 8, integerDigits: 10, allowEmpty: false, min: Number.MIN_VALUE });
            return decimalEditor(cell, onRendered, (value: unknown) => {
              const type = cell.getRow().getData().type;
              if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 ||
                  (type !== 'Crypto' && !Number.isInteger(value))) {
                cancel();
                return;
              }
              success(value);
            }, cancel);
          },
          required: true,
          validation: { number: true },
          validator: AMB.validators.custom('Enter a positive quantity; whole units are required except for Crypto.', (value: unknown, rowData: HoldingsRow) => {
            return typeof value === 'number' && Number.isFinite(value) && value > 0
              && (rowData.type === 'Crypto' || Number.isInteger(value));
          }),
          formatter: (cell: { getValue(): number }) => quantity.format(cell.getValue()),
          cssClass: 'portfolio-grid__editable',
        },
        { title: 'Value', field: 'value', minWidth: 132, widthGrow: 1.1, hozAlign: 'right', headerSort: false, formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => euro.format(this.derivedFor(cell.getRow().getData()).value) },
        { title: 'P/L', field: 'profitLoss', minWidth: 132, widthGrow: 1.1, hozAlign: 'right', headerSort: false, formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => {
          const value = this.derivedFor(cell.getRow().getData()).profitLoss;
          return signedValue(value, euro.format(value));
        } },
      ],
    });

    this.grid.on('cellEditing', (event: unknown) => {
      const cell = event as EditedCell;
      if (cell.getField() === 'quantity') this.editingRows.add(cell.getRow().getData().id);
    });
    this.grid.on('cellEdited', (event: unknown) => {
      const cell = event as EditedCell;
      if (cell.getField() !== 'quantity') return;
      const row = cell.getRow().getData();
      if (Number.isFinite(row.quantity) && row.quantity > 0 &&
          (row.type === 'Crypto' || Number.isInteger(row.quantity))) {
        this.holdings.update((rows) => rows.map((held) => held.id === row.id ? { ...held, quantity: row.quantity } : held));
      }
      this.finishEditing(row.id);
    });
    this.grid.on('cellEditCancelled', (event: unknown) => {
      const cell = event as EditedCell;
      if (cell.getField() === 'quantity') this.finishEditing(cell.getRow().getData().id);
    });
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.startTimer();
  }

  toggleMarket(): void {
    this.live.update((current) => !current);
    if (this.live()) this.startTimer();
    else this.stopTimer();
  }

  private startTimer(): void {
    if (this.timer || !this.grid || !this.live() || document.hidden) return;
    this.timer = setInterval(() => this.tick(), 900);
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private tick(): void {
    const nextIds = Array.from({ length: 4 }, (_, index) => {
      const id = heldInstrumentIds[(this.cursor + index) % heldInstrumentIds.length];
      if (!id) throw new Error('Portfolio has no held instruments');
      return id;
    });
    this.cursor = (this.cursor + nextIds.length) % heldInstrumentIds.length;
    this.market.advance(nextIds);
    for (const position of INITIAL_POSITIONS) {
      if (!nextIds.includes(position.instrumentId)) continue;
      if (!this.editingRows.has(position.id)) this.grid?.reformatRow(position.id);
    }
  }

  private finishEditing(positionId: string): void {
    this.editingRows.delete(positionId);
    queueMicrotask(() => {
      if (this.grid && !this.editingRows.has(positionId)) this.grid.reformatRow(positionId);
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.editingRows.clear();
    this.grid?.destroy();
    this.grid = null;
  }
}
