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
import { categoryClass, instrumentIdentity } from './instrument-identity';
import { availableInstruments, instrumentSelectionPatch, isDuplicateInstrument, positionKey } from './instrument-lookup';
import { MarketSimulator, TIMELINE_CAPACITY } from './market-simulator';
import { calculateChangePercent, calculatePortfolioTotals, calculatePosition } from './portfolio-calculations';
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

type LiveField = 'timeline' | 'price' | 'value' | 'profitLoss';
type CategoryFilter = AssetCategory | null;
const LIVE_FIELDS: readonly LiveField[] = ['timeline', 'price', 'value', 'profitLoss'];
const CATEGORY_FILTERS: readonly { label: string; value: CategoryFilter }[] = [
  { label: 'Tutti', value: null },
  { label: 'Azioni', value: 'Stock' },
  { label: 'ETF', value: 'ETF' },
  { label: 'Obbligazioni', value: 'Bond' },
  { label: 'Crypto', value: 'Crypto' },
];

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

// The installed TypeScript Intl declarations still type useGrouping as boolean.
const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' as unknown as boolean });
const quantity = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 8 });
const percent = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' });

function displayedAtTwoDecimals(value: number): number {
  return Math.abs(value) < 0.005 ? 0 : value;
}

function formatEuro(value: number): string {
  return euro.format(displayedAtTwoDecimals(value));
}

function formatPercent(value: number): string {
  return `${percent.format(displayedAtTwoDecimals(value))}%`;
}

function movementClass(value: number | null): string {
  const displayed = value === null ? 0 : displayedAtTwoDecimals(value);
  return displayed === 0 ? 'is-neutral' : displayed > 0 ? 'is-positive' : 'is-negative';
}

function paintProfitLoss(content: HTMLElement, derived: ReturnType<typeof calculatePosition>): void {
  if (!content.classList.contains('portfolio-grid__profit-loss')) {
    content.className = 'portfolio-grid__profit-loss';
    const amount = document.createElement('span');
    amount.className = 'portfolio-grid__profit-amount';
    const pill = document.createElement('span');
    pill.className = 'portfolio-grid__daily-change';
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 16 16');
    icon.setAttribute('aria-hidden', 'true');
    icon.append(document.createElementNS('http://www.w3.org/2000/svg', 'path'));
    const percentage = document.createElement('span');
    percentage.className = 'portfolio-grid__daily-change-value';
    pill.append(icon, percentage);
    content.replaceChildren(pill, amount);
  }

  const amount = content.querySelector<HTMLElement>('.portfolio-grid__profit-amount')!;
  const pill = content.querySelector<HTMLElement>('.portfolio-grid__daily-change')!;
  const icon = pill.querySelector<SVGPathElement>('path')!;
  const percentage = pill.querySelector<HTMLElement>('.portfolio-grid__daily-change-value')!;
  amount.textContent = `${displayedAtTwoDecimals(derived.profitLoss) > 0 ? '+' : ''}${formatEuro(derived.profitLoss)}`;
  const change = derived.changePercent;
  const direction = movementClass(change);
  pill.className = `portfolio-grid__daily-change ${direction}`;
  percentage.textContent = change === null ? '—' : formatPercent(change);
  pill.setAttribute('aria-label', `Variazione giornaliera ${change === null ? 'non disponibile' : formatPercent(change)}`);
  icon.setAttribute('d', direction === 'is-positive'
    ? 'M2 11 6 7 9 9 14 4 M10 4h4v4'
    : direction === 'is-negative' ? 'M2 5 6 9 9 7 14 12 M10 12h4V8' : '');
}

function profitSummary(cell: { getValue(): ReturnType<typeof calculatePortfolioTotals> }): HTMLElement {
  const totals = cell.getValue();
  const summary = document.createElement('span');
  summary.className = `amb-calc-content portfolio-grid__top-summary portfolio-grid__top-summary--profit ${
    movementClass(totals.profitLoss)
  }`;
  const label = document.createElement('span');
  label.className = 'amb-calc-label';
  label.textContent = 'P/L TOTALE';
  const amount = document.createElement('span');
  amount.className = 'amb-calc-value';
  amount.textContent = `${displayedAtTwoDecimals(totals.profitLoss) > 0 ? '+' : ''}${formatEuro(totals.profitLoss)}`;
  const result = document.createElement('span');
  result.className = 'portfolio-grid__top-return';
  result.textContent = formatPercent(totals.returnPercent);
  summary.append(label, amount, result);
  return summary;
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
  const identity = instrumentIdentity(row.instrumentId, row.ticker);
  icon.textContent = identity.fallback;
  if (identity.wide) icon.classList.add('is-wide');
  if (identity.flag) icon.classList.add('is-flag');
  if (identity.fundTicker) icon.classList.add('is-ishares');
  if (identity.logo) {
    const image = document.createElement('img');
    image.alt = '';
    image.onload = () => {
      image.onload = image.onerror = null;
      icon.append(image);
      if (identity.fundTicker) {
        const badge = document.createElement('span');
        badge.className = 'portfolio-grid__fund-ticker';
        badge.textContent = identity.fundTicker;
        icon.append(badge);
      }
      icon.classList.add('has-image');
    };
    image.onerror = () => { image.onload = image.onerror = null; };
    image.src = identity.logo;
  }

  const text = document.createElement('span');
  text.className = 'portfolio-grid__instrument-text';
  const name = document.createElement('strong');
  name.textContent = row.instrument;
  const meta = document.createElement('span');
  meta.className = 'portfolio-grid__instrument-meta';
  const ticker = document.createElement('small');
  ticker.textContent = row.ticker;
  meta.append(ticker);
  const subtitle = instrumentsById.get(row.instrumentId)?.subtitle;
  if (subtitle) {
    const separator = document.createElement('span');
    separator.className = 'portfolio-grid__instrument-separator';
    separator.textContent = '·';
    const detail = document.createElement('span');
    detail.className = 'portfolio-grid__instrument-subtitle';
    detail.textContent = subtitle;
    meta.append(separator, detail);
  }
  text.append(name, meta);
  wrapper.append(icon, text);
  return wrapper;
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
  readonly searchQuery = signal('');
  readonly categoryFilter = signal<CategoryFilter>(null);
  readonly visibleCount = signal(INITIAL_POSITIONS.length);
  readonly totalCount = signal(INITIAL_POSITIONS.length);
  readonly categoryFilters = CATEGORY_FILTERS;
  private readonly market = new MarketSimulator(INSTRUMENT_CATALOG, INITIAL_QUOTES);
  private readonly lookupDialog = new AMB.LookupDialog();
  private grid: ReturnType<typeof AMB.table> | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private cursor = 0;
  private activeLookupKey: string | null = null;
  private readonly pendingIdentityFormats = new Set<string>();
  private filterInstalled = false;
  private readonly matchesFilters = (data: object): boolean => {
    const row = data as HoldingsRow;
    const category = this.categoryFilter();
    const query = this.searchQuery().trim().toLocaleLowerCase();
    return (category === null || row.type === category)
      && (!query || [row.instrument, row.ticker, row.type].some((value) => value.toLocaleLowerCase().includes(query)));
  };
  private readonly onVisibilityChange = () => {
    if (document.hidden) this.stopTimer();
    else this.startTimer();
  };

  private quoteFor(row: HoldingsRow) {
    return this.market.quoteFor(row.instrumentId);
  }

  setSearch(query: string): void {
    this.searchQuery.set(query);
    this.applyFilters();
  }

  setCategory(category: CategoryFilter): void {
    this.categoryFilter.set(category);
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.categoryFilter.set(null);
    this.applyFilters();
  }

  private updateCounts(): void {
    if (!this.grid) return;
    this.totalCount.set(this.grid.getData().length);
    this.visibleCount.set(this.grid.getDataCount('active'));
  }

  private refreshVisibleRows(): void {
    if (!this.grid) return;
    for (const row of this.grid.getData('active') as HoldingsRow[]) {
      const key = positionKey(row);
      if (this.pendingIdentityFormats.has(key)) {
        this.grid.reformatRow(key);
        this.pendingIdentityFormats.delete(key);
      }
      this.refreshLiveCells(row);
    }
  }

  private applyFilters(): void {
    if (!this.grid) return;
    if (!this.searchQuery().trim() && this.categoryFilter() === null) {
      if (this.filterInstalled) this.grid.clearFilter();
      this.filterInstalled = false;
    } else if (this.filterInstalled) {
      this.grid.refreshFilter();
    } else {
      this.grid.setFilter(this.matchesFilters);
      this.filterInstalled = true;
    }
    this.updateCounts();
    this.refreshVisibleRows();
  }

  private derivedFor(row: HoldingsRow) {
    const id = positionKey(row);
    if (!id) throw new Error('Position has no AMB Grid identifier');
    return calculatePosition({
      id, instrumentId: row.instrumentId, quantity: row.quantity, averageCost: row.averageCost,
    }, this.quoteFor(row));
  }

  private liveCell(row: HoldingsRow, field: LiveField): HTMLElement {
    const content = document.createElement('span');
    content.dataset['portfolioLive'] = field;
    this.paintLiveCell(content, row, field);
    return content;
  }

  private paintLiveCell(content: HTMLElement, row: HoldingsRow, field: LiveField): void {
    if (!row.instrumentId) {
      content.textContent = '—';
      content.className = '';
      return;
    }
    if (field === 'timeline') {
      this.paintTimeline(content, row);
      return;
    }
    if (field === 'price') {
      content.textContent = formatEuro(this.quoteFor(row).price);
      return;
    }
    const derived = this.derivedFor(row);
    if (field === 'value') {
      content.textContent = formatEuro(derived.value);
      return;
    }
    paintProfitLoss(content, derived);
  }

  private paintTimeline(content: HTMLElement, row: HoldingsRow): void {
    const namespace = 'http://www.w3.org/2000/svg';
    let svg = content.querySelector('svg');
    if (!svg) {
      content.textContent = '';
      svg = document.createElementNS(namespace, 'svg');
      svg.setAttribute('viewBox', '0 0 200 36');
      svg.setAttribute('role', 'img');
      content.append(svg);
    }
    const history = this.market.historyFor(row.instrumentId);
    const previousClose = this.quoteFor(row).previousClose;
    const low = Math.min(...history);
    const high = Math.max(...history);
    const spread = Math.max(high - low, previousClose * 0.001);
    const base = low - spread * 0.15;
    const scale = spread * 1.3;
    svg.setAttribute('class', 'portfolio-grid__timeline');
    svg.setAttribute('aria-label', `${row.ticker}: andamento simulato degli ultimi ${history.length} campioni`);
    while (svg.children.length < history.length) svg.append(document.createElementNS(namespace, 'rect'));
    while (svg.children.length > history.length) svg.lastElementChild?.remove();
    history.forEach((price, index) => {
      const bar = svg.children[index]!;
      const height = Math.max(3, Math.min(34, ((price - base) / scale) * 34));
      const direction = movementClass(calculateChangePercent(price, previousClose));
      bar.setAttribute('class', index === history.length - 1 ? `${direction} is-latest` : direction);
      bar.setAttribute('x', String(index * (200 / TIMELINE_CAPACITY)));
      bar.setAttribute('y', String(36 - height));
      bar.setAttribute('width', '4.5');
      bar.setAttribute('height', String(height));
      bar.setAttribute('rx', '1');
    });
  }

  private refreshLiveCells(row: HoldingsRow): void {
    if (!this.grid) return;
    const key = positionKey(row);
    if (!key) return;
    for (const field of LIVE_FIELDS) {
      const cell = this.grid.getCellElement(key, field) as Element | false;
      if (!cell) continue;
      const content = cell.querySelector<HTMLElement>(`[data-portfolio-live="${field}"]`);
      if (content) this.paintLiveCell(content, row, field);
    }
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
      load: ({ query, rowData }: { query: string; rowData?: object }) => {
        const key = this.activeLookupKey ?? (rowData && 'id' in rowData && typeof rowData.id === 'string' ? rowData.id : '');
        return availableInstruments(INSTRUMENT_CATALOG, this.grid?.getData() as HoldingsRow[] ?? initialRows(), key, query);
      },
    });
    const multifield = AMB.multifieldLookup({
      id: 'portfolio-instrument', lookup,
      clearDependentsOnInvalidMaster: false,
      clearDependentsOnEmptyMaster: false,
      masterField: {
        field: 'instrument', from: 'name', title: 'Instrument', required: true,
        autocomplete: true, dialog: true,
      },
      dependentFields: [
        { field: 'instrumentId', from: 'id', title: 'Instrument ID', visibleInGrid: false, visibleInLookup: false, searchable: false, required: true },
        { field: 'ticker', from: 'ticker', title: 'Ticker', visibleInGrid: false, visibleInLookup: true, searchable: true, required: true },
        { field: 'type', from: 'category', title: 'Type', visibleInGrid: true, visibleInLookup: true, searchable: true, required: true },
      ],
    });
    const instrumentColumn = multifield.masterColumn({
      minWidth: 275, widthGrow: 2.4,
      dialog: instrumentDialog,
      formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => instrumentCell(cell.getRow().getData()),
      editorOptions: {
        dialogTitle: 'Select a portfolio instrument',
        searchPlaceholder: 'Search name, ticker, category or ISIN...',
        autoComplete: true,
        showDescription: false,
        search: { fields: ['ticker', 'name', 'category', 'isin'] },
        dialogOptions: { destroyOnClose: true, pagination: { enabled: false } },
        applyRecord: (cell, _patch, record) => {
          if (!this.grid) return null;
          const instrument = record as Instrument;
          const row = cell.getRow().getData() as HoldingsRow;
          const key = positionKey(row);
          const selection = instrumentSelectionPatch(
            this.grid.getData() as HoldingsRow[], key, instrument, this.market.quoteFor(instrument.id).price,
          );
          if (!selection) {
            this.lookupError.set(`${instrument.name} is already in the portfolio. Choose another instrument.`);
            return null;
          }
          this.lookupError.set('');
          queueMicrotask(() => {
            if (!this.grid) return;
            const current = (this.grid.getData() as HoldingsRow[]).find((item) => positionKey(item) === key);
            if (current?.instrumentId !== instrument.id) return;
            if (this.filterInstalled) {
              this.pendingIdentityFormats.add(key);
              this.grid.refreshFilter();
            }
            this.updateCounts();
            this.refreshVisibleRows();
            this.grid.recalc();
            this.activeLookupKey = null;
          });
          return selection;
        },
      },
    });
    const initialHoldings = initialRows();
    const allHoldings = () => (this.grid?.getData() as HoldingsRow[] | undefined) ?? initialHoldings;
    const portfolioTotals = () => calculatePortfolioTotals(allHoldings(), (id) => this.market.quoteFor(id));
    this.grid = AMB.table({
      selector: this.gridHost.nativeElement,
      data: initialHoldings,
      index: 'id',
      layout: 'fitColumns',
      toolbar: false,
      rowActionColumn: { enabled: false },
      columns: [
        { ...instrumentColumn,
          topCalc: () => allHoldings().length,
          topCalcFormatter: AMB.formatters.calculation({
            label: 'POSIZIONI', className: 'portfolio-grid__top-summary portfolio-grid__top-summary--count',
          }),
        },
        multifield.dependentColumn('instrumentId') as Record<string, unknown>,
        multifield.dependentColumn('ticker') as Record<string, unknown>,
        {
          title: 'Timeline', field: 'timeline', minWidth: 220, widthGrow: 1.6, headerSort: false,
          formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => this.liveCell(cell.getRow().getData(), 'timeline'),
        },
        multifield.dependentColumn('type', {
          minWidth: 92, widthGrow: 0.7,
          formatter: (cell: { getValue(): AssetCategory | '' }) => {
            const type = cell.getValue();
            return type ? `<span class="portfolio-grid__type ${categoryClass(type)}">${type}</span>` : '—';
          },
        }) as Record<string, unknown>,
        { title: 'Price', field: 'price', minWidth: 118, widthGrow: 1, hozAlign: 'right', headerSort: false,
          formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => this.liveCell(cell.getRow().getData(), 'price') },
        {
          title: 'Quantity', field: 'quantity', minWidth: 112, widthGrow: 0.9, hozAlign: 'right',
          editor: (cell: EditedCell, onRendered: (callback: () => void) => void, success: (value: number) => void, cancel: () => void) => {
            const isCrypto = cell.getRow().getData().type === 'Crypto';
            const quantityEditor = isCrypto
              ? AMB.editors.decimal({ decimalDigits: 8, integerDigits: 10, allowEmpty: false, min: Number.MIN_VALUE })
              : AMB.editors.integer({ maxLength: 10, allowEmpty: false, min: 1, max: 9999999999 });
            const input = quantityEditor(cell, onRendered, (value: unknown) => {
              if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 ||
                  (!isCrypto && (!Number.isInteger(value) || !/^\d{1,10}$/.test(input.value)))) {
                cancel();
                return;
              }
              success(value);
            }, cancel) as HTMLInputElement;
            if (!isCrypto) {
              input.addEventListener('input', (event) => {
                if (!/^\d{0,10}$/.test(input.value)) event.stopImmediatePropagation();
              }, { capture: true });
            }
            return input;
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
          topCalc: () => portfolioTotals().value,
          topCalcFormatter: AMB.formatters.calculation({
            label: 'VALORE TOTALE', className: 'portfolio-grid__top-summary portfolio-grid__top-summary--value',
            formatValue: (value: number) => formatEuro(value),
          }),
          formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => this.liveCell(cell.getRow().getData(), 'value') },
        { title: 'P/L · Δ giorno', field: 'profitLoss', minWidth: 210, widthGrow: 1.6, hozAlign: 'right', headerSort: false,
          topCalc: () => portfolioTotals(),
          topCalcFormatter: profitSummary,
          formatter: (cell: { getRow(): { getData(): HoldingsRow } }) => this.liveCell(cell.getRow().getData(), 'profitLoss') },
      ],
    });

    this.grid.on('cellEditing', (event: unknown) => {
      const cell = event as EditedCell;
      if (cell.getField() === 'instrument') this.activeLookupKey = positionKey(cell.getRow().getData());
    });
    this.grid.on('cellEdited', (event: unknown) => {
      const cell = event as EditedCell;
      if (cell.getField() === 'quantity') {
        const row = cell.getRow().getData();
        this.refreshLiveCells(row);
        this.grid?.recalc();
      }
      if (cell.getField() === 'instrument') this.activeLookupKey = null;
    });
    this.grid.on('cellEditCancelled', (event: unknown) => {
      const cell = event as EditedCell;
      if (cell.getField() === 'instrument') this.activeLookupKey = null;
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
      if (nextIds.includes(row.instrumentId)) this.refreshLiveCells(row);
    }
    this.grid.recalc();
  }

  /** Releases the timer, document listener, lookup dialog and AMB-owned grid DOM. */
  ngOnDestroy(): void {
    this.stopTimer();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.pendingIdentityFormats.clear();
    this.activeLookupKey = null;
    this.lookupDialog.destroy();
    this.grid?.destroy();
    this.grid = null;
  }
}
