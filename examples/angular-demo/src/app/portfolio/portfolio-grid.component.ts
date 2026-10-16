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
import { categoryClass, INSTRUMENT_FAVICONS, tickerMonogram } from './instrument-identity';
import { availableInstruments, instrumentSelectionPatch, isDuplicateInstrument, positionKey } from './instrument-lookup';
import { MarketSimulator, TIMELINE_CAPACITY } from './market-simulator';
import { calculatePortfolioTotals, calculatePosition } from './portfolio-calculations';
import { INITIAL_POSITIONS, INITIAL_QUOTES } from './portfolio-seed';
import type { AssetCategory, Instrument } from './portfolio.models';

interface HoldingsRow {
  id: string;
  instrumentId: string;
  instrument: string;
  ticker: string;
  type: AssetCategory | '';
  quantity: number;
  averageCost: number;
}

interface EditedCell {
  getField(): string;
  getRow(): { getData(): HoldingsRow };
}

const instrumentsById = new Map(INSTRUMENT_CATALOG.map((instrument) => [instrument.id, instrument]));

function initialRows(): HoldingsRow[] {
  return INITIAL_POSITIONS.map((position) => {
    const instrument = instrumentsById.get(position.instrumentId);
    if (!instrument) throw new Error(`Missing instrument ${position.instrumentId}`);
    return {
      id: position.id,
      instrumentId: position.instrumentId,
      instrument: instrument.name,
      ticker: instrument.ticker,
      type: instrument.category,
      quantity: position.quantity,
      averageCost: position.averageCost,
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

function instrumentCell(row: HoldingsRow): HTMLElement {
  const wrapper = document.createElement('span');
  wrapper.className = 'portfolio-grid__instrument';
  if (!row.instrumentId) {
    wrapper.classList.add('is-empty');
    wrapper.textContent = 'Select an instrument';
    return wrapper;
  }

  const icon = document.createElement('span');
  icon.className = `portfolio-grid__instrument-icon ${categoryClass(row.type)}`;
  icon.textContent = tickerMonogram(row.ticker);
  const favicon = INSTRUMENT_FAVICONS[row.instrumentId];
  if (favicon) {
    const image = document.createElement('img');
    image.alt = '';
    image.loading = 'lazy';
    image.addEventListener('load', () => icon.classList.add('has-image'), { once: true });
    image.addEventListener('error', () => image.remove(), { once: true });
    image.src = favicon;
    icon.append(image);
  }

  const text = document.createElement('span');
  text.className = 'portfolio-grid__instrument-text';
  const name = document.createElement('strong');
  name.textContent = row.instrument;
  const ticker = document.createElement('small');
  ticker.textContent = row.ticker;
  text.append(name, ticker);
  wrapper.append(icon, text);
  return wrapper;
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

  readonly live = signal(true);
  readonly lookupError = signal('');
  private readonly market = new MarketSimulator(INSTRUMENT_CATALOG, INITIAL_QUOTES);
  private readonly lookupDialog = new AMB.LookupDialog();
  private grid: ReturnType<typeof AMB.table> | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private cursor = 0;
  private activeLookupKey: string | null = null;
  private readonly approvedSelection = new Map<string, string>();
  private readonly editingRows = new Set<string>();
  private readonly onVisibilityChange = () => {
    if (document.hidden) this.stopTimer();
    else this.startTimer();
  };

  private quoteFor(row: HoldingsRow) {
    return this.market.quoteFor(row.instrumentId);
  }

  private derivedFor(row: HoldingsRow) {
    const id = positionKey(row);
    if (!id) throw new Error('Position has no AMB Grid identifier');
    return calculatePosition({
      id, instrumentId: row.instrumentId, quantity: row.quantity, averageCost: row.averageCost,
    }, this.quoteFor(row));
  }

  /** Creates the AMB-owned table once the Angular host exists and connects the simulated market. */
  ngAfterViewInit(): void {
    const instrumentDialog = {
      open: async (options: object) => {
        const record = await this.lookupDialog.open(options) as { id: string; name: string } | null;
        const key = this.activeLookupKey;
        if (!record || !key || !this.grid) return null;
        if (isDuplicateInstrument(this.grid.getData() as HoldingsRow[], record.id, key)) {
          this.lookupError.set(`${record.name} is already in the portfolio. Choose another instrument.`);
          return null;
        }
        this.lookupError.set('');
        return record;
      },
    };
    const lookup = AMB.lookup({
      keyField: 'id', valueField: 'name', labelField: 'ticker',
      columns: [
        { field: 'ticker', title: 'Ticker', visible: true, width: 100 },
        { field: 'name', title: 'Instrument', visible: true },
        { field: 'category', title: 'Type', visible: true, width: 110 },
      ],
      search: { fields: ['ticker', 'name', 'category', 'isin'] },
      cache: { enabled: false },
      load: ({ query }: { query: string }) => availableInstruments(
        INSTRUMENT_CATALOG, this.grid?.getData() as HoldingsRow[] ?? initialRows(), this.activeLookupKey ?? '', query,
      ),
    });
    const multifield = AMB.multifieldLookup({
      id: 'portfolio-instrument', lookup,
      clearDependentsOnInvalidMaster: false,
      clearDependentsOnEmptyMaster: false,
      masterField: {
        field: 'instrument', from: 'name', title: 'Instrument', required: true,
        autocomplete: false, dialog: true,
      },
      dependentFields: [
        { field: 'instrumentId', from: 'id', title: 'Instrument ID', visibleInGrid: false, visibleInLookup: false, searchable: false, required: true },
        { field: 'ticker', from: 'ticker', title: 'Ticker', visibleInGrid: false, visibleInLookup: true, searchable: true, required: true },
        { field: 'type', from: 'category', title: 'Type', visibleInGrid: true, visibleInLookup: true, searchable: true, required: true },
      ],
    });
    const instrumentColumn = multifield.masterColumn({
      minWidth: 260, widthGrow: 2.4,
      dialog: instrumentDialog,
      formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => instrumentCell(cell.getRow().getData()),
      editorOptions: {
        dialogTitle: 'Select a portfolio instrument',
        searchPlaceholder: 'Search name, ticker, category or ISIN...',
        autoComplete: false,
        search: { fields: ['ticker', 'name', 'category', 'isin'] },
        mapToRow: { instrumentId: 'id', ticker: 'ticker', type: 'category' },
        dialogOptions: { destroyOnClose: true, pagination: { enabled: false } },
        applyRecord: (cell: EditedCell, _patch: Partial<HoldingsRow>, record: Instrument | null) => {
          if (!record || !this.grid) return null;
          const row = cell.getRow().getData();
          const key = positionKey(row);
          const selection = instrumentSelectionPatch(
            this.grid.getData() as HoldingsRow[], key, record, this.market.quoteFor(record.id).price,
          );
          if (!selection) {
            this.lookupError.set(`${record.name} is already in the portfolio. Choose another instrument.`);
            return null;
          }
          const updated = row.instrumentId === record.id
            ? cell.getRow()
            : this.grid.updateRow(key, selection);
          if (updated) {
            this.approvedSelection.set(key, record.name);
            this.lookupError.set('');
          }
          return updated;
        },
      },
    }) as Record<string, unknown>;
    const originalEditor = instrumentColumn['editor'] as (
      cell: EditedCell, onRendered: (callback: () => void) => void,
      success: (value: string) => void, cancel: () => void,
    ) => HTMLElement;
    instrumentColumn['editor'] = (
      cell: EditedCell, onRendered: (callback: () => void) => void,
      success: (value: string) => void, cancel: () => void,
    ) => originalEditor(cell, onRendered, (value) => {
      const key = positionKey(cell.getRow().getData());
      const approved = this.approvedSelection.get(key);
      this.approvedSelection.delete(key);
      if (approved === value) success(value);
      else cancel();
    }, cancel);
    this.grid = AMB.table({
      selector: this.gridHost.nativeElement,
      data: initialRows(),
      index: 'id',
      layout: 'fitColumns',
      toolbar: false,
      rowActionColumn: { enabled: false },
      columns: [
        { ...instrumentColumn,
          bottomCalc: (_values: unknown[], rows: HoldingsRow[]) => `TOTAL — ${rows.length} posizioni`,
          bottomCalcFormatter: (cell: { getValue(): string }) => cell.getValue(),
        },
        multifield.dependentColumn('instrumentId') as Record<string, unknown>,
        multifield.dependentColumn('ticker') as Record<string, unknown>,
        {
          title: 'Timeline', field: 'timeline', minWidth: 154, widthGrow: 1.2, headerSort: false,
          formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => {
            const row = cell.getRow().getData();
            return row.instrumentId
              ? timelineSvg(this.market.historyFor(row.instrumentId), row.ticker, this.quoteFor(row).previousClose)
              : '—';
          },
        },
        multifield.dependentColumn('type', {
          minWidth: 92, widthGrow: 0.7,
          formatter: (cell: { getValue(): AssetCategory | '' }) => {
            const type = cell.getValue();
            return type ? `<span class="portfolio-grid__type ${categoryClass(type)}">${type}</span>` : '—';
          },
        }) as Record<string, unknown>,
        { title: 'Price', field: 'price', minWidth: 118, widthGrow: 1, hozAlign: 'right', headerSort: false, formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => {
          const row = cell.getRow().getData();
          return row.instrumentId ? euro.format(this.quoteFor(row).price) : '—';
        } },
        { title: 'Change %', field: 'changePercent', minWidth: 112, widthGrow: 0.9, hozAlign: 'right', headerSort: false,
          bottomCalc: (_values: unknown[], rows: HoldingsRow[]) => calculatePortfolioTotals(rows, (id) => this.market.quoteFor(id)).returnPercent,
          bottomCalcFormatter: (cell: { getValue(): number }) => signedValue(cell.getValue(), `Return ${percent.format(cell.getValue())}%`),
          formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => {
          const row = cell.getRow().getData();
          if (!row.instrumentId) return '—';
          const value = this.derivedFor(row).changePercent;
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
        { title: 'Value', field: 'value', minWidth: 132, widthGrow: 1.1, hozAlign: 'right', headerSort: false,
          bottomCalc: (_values: unknown[], rows: HoldingsRow[]) => calculatePortfolioTotals(rows, (id) => this.market.quoteFor(id)).value,
          bottomCalcFormatter: (cell: { getValue(): number }) => euro.format(cell.getValue()),
          formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => {
          const row = cell.getRow().getData();
          return row.instrumentId ? euro.format(this.derivedFor(row).value) : '—';
        } },
        { title: 'P/L', field: 'profitLoss', minWidth: 132, widthGrow: 1.1, hozAlign: 'right', headerSort: false,
          bottomCalc: (_values: unknown[], rows: HoldingsRow[]) => calculatePortfolioTotals(rows, (id) => this.market.quoteFor(id)).profitLoss,
          bottomCalcFormatter: (cell: { getValue(): number }) => signedValue(cell.getValue(), euro.format(cell.getValue())),
          formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => {
          const row = cell.getRow().getData();
          if (!row.instrumentId) return '—';
          const value = this.derivedFor(row).profitLoss;
          return signedValue(value, euro.format(value));
        } },
      ],
    });

    this.grid.on('cellEditing', (event: unknown) => {
      const cell = event as EditedCell;
      if (cell.getField() === 'quantity' || cell.getField() === 'instrument') {
        const key = positionKey(cell.getRow().getData());
        if (key) this.editingRows.add(key);
        if (cell.getField() === 'instrument') this.activeLookupKey = key;
      }
    });
    this.grid.on('cellEdited', (event: unknown) => {
      const cell = event as EditedCell;
      if (cell.getField() === 'quantity' || cell.getField() === 'instrument') {
        const row = cell.getRow().getData();
        const key = positionKey(row);
        this.finishEditing(key);
        if (cell.getField() === 'instrument') this.activeLookupKey = null;
      }
    });
    this.grid.on('cellEditCancelled', (event: unknown) => {
      const cell = event as EditedCell;
      if (cell.getField() === 'quantity' || cell.getField() === 'instrument') {
        this.finishEditing(positionKey(cell.getRow().getData()));
        if (cell.getField() === 'instrument') {
          this.approvedSelection.delete(positionKey(cell.getRow().getData()));
          this.activeLookupKey = null;
        }
      }
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
    if (!this.grid) return;
    const rows = this.grid.getData() as HoldingsRow[];
    const heldInstrumentIds = [...new Set(rows.map((row) => row.instrumentId).filter(Boolean))];
    if (heldInstrumentIds.length === 0) return;
    const nextIds = Array.from({ length: Math.min(4, heldInstrumentIds.length) }, (_, index) =>
      heldInstrumentIds[(this.cursor + index) % heldInstrumentIds.length]!,
    );
    this.cursor = (this.cursor + nextIds.length) % heldInstrumentIds.length;
    this.market.advance(nextIds);
    for (const row of rows) {
      const key = positionKey(row);
      if (key && nextIds.includes(row.instrumentId) && !this.editingRows.has(key)) this.grid.reformatRow(key);
    }
    this.grid.recalc();
  }

  private finishEditing(positionId: string | null): void {
    if (!positionId) return;
    this.editingRows.delete(positionId);
    queueMicrotask(() => {
      if (this.grid && !this.editingRows.has(positionId)) {
        this.grid.reformatRow(positionId);
        this.grid.recalc();
      }
    });
  }

  /** Releases the timer, document listener, lookup dialog and AMB-owned grid DOM. */
  ngOnDestroy(): void {
    this.stopTimer();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.editingRows.clear();
    this.approvedSelection.clear();
    this.activeLookupKey = null;
    this.lookupDialog.destroy();
    this.grid?.destroy();
    this.grid = null;
  }
}
