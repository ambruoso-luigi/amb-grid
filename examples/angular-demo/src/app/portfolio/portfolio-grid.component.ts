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
import { calculatePosition } from './portfolio-calculations';
import { INITIAL_POSITIONS, INITIAL_QUOTES } from './portfolio-seed';
import type { AssetCategory, Position, SimulatedQuote } from './portfolio.models';

interface HoldingsRow {
  id: string;
  instrument: string;
  ticker: string;
  type: AssetCategory;
  price: number;
  changePercent: number | null;
  quantity: number;
  value: number;
  profitLoss: number;
}

interface EditedCell {
  getField(): string;
  getRow(): { getData(): HoldingsRow };
}

const instrumentsById = new Map(INSTRUMENT_CATALOG.map((instrument) => [instrument.id, instrument]));
const positionsById = new Map(INITIAL_POSITIONS.map((position) => [position.id, position]));
const quotesByInstrumentId = new Map(INITIAL_QUOTES.map((quote) => [quote.instrumentId, quote]));

function positionAndQuote(id: string): { position: Position; quote: SimulatedQuote } {
  const position = positionsById.get(id);
  const quote = position && quotesByInstrumentId.get(position.instrumentId);
  if (!position || !quote) throw new Error(`Missing portfolio data for ${id}`);
  return { position, quote };
}

function initialRows(): HoldingsRow[] {
  return INITIAL_POSITIONS.map((position) => {
    const instrument = instrumentsById.get(position.instrumentId);
    if (!instrument) throw new Error(`Missing instrument ${position.instrumentId}`);
    const { quote } = positionAndQuote(position.id);
    const derived = calculatePosition(position, quote);
    return {
      id: position.id,
      instrument: instrument.name,
      ticker: instrument.ticker,
      type: instrument.category,
      price: quote.price,
      changePercent: derived.changePercent,
      quantity: position.quantity,
      value: derived.value,
      profitLoss: derived.profitLoss,
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
  private grid: ReturnType<typeof AMB.table> | null = null;

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
        { title: 'Type', field: 'type', minWidth: 92, widthGrow: 0.7 },
        { title: 'Price', field: 'price', minWidth: 118, widthGrow: 1, hozAlign: 'right', formatter: (cell: { getValue(): number }) => euro.format(cell.getValue()) },
        { title: 'Change %', field: 'changePercent', minWidth: 112, widthGrow: 0.9, hozAlign: 'right', formatter: (cell: { getValue(): number | null }) => {
          const value = cell.getValue();
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
        { title: 'Value', field: 'value', minWidth: 132, widthGrow: 1.1, hozAlign: 'right', formatter: (cell: { getValue(): number }) => euro.format(cell.getValue()) },
        { title: 'P/L', field: 'profitLoss', minWidth: 132, widthGrow: 1.1, hozAlign: 'right', formatter: (cell: { getValue(): number }) => {
          const value = cell.getValue();
          return signedValue(value, euro.format(value));
        } },
      ],
    });

    this.grid.on('cellEdited', (event: unknown) => {
      const cell = event as EditedCell;
      if (cell.getField() !== 'quantity') return;
      const row = cell.getRow().getData();
      if (!Number.isFinite(row.quantity) || row.quantity <= 0 ||
          (row.type !== 'Crypto' && !Number.isInteger(row.quantity))) return;

      const { position, quote } = positionAndQuote(row.id);
      const derived = calculatePosition({ ...position, quantity: row.quantity }, quote);
      const patch = { value: derived.value, profitLoss: derived.profitLoss };
      this.grid?.updateRow(row.id, patch);
      this.holdings.update((rows) => rows.map((held) => held.id === row.id ? { ...held, quantity: row.quantity, ...patch } : held));
    });
  }

  ngOnDestroy(): void {
    this.grid?.destroy();
    this.grid = null;
  }
}
