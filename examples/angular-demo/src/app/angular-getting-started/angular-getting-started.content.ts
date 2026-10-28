// Static documentation only: none of these excerpts are executed.
export const snippets = {
  lifecycle: `@ViewChild('gridHost', { static: true })
private gridHost!: ElementRef<HTMLElement>;
private grid: ReturnType<typeof AMB.table> | null = null;

ngAfterViewInit(): void {
  const initialHoldings = initialRows();
  this.grid = AMB.table({
    selector: this.gridHost.nativeElement,
    data: initialHoldings, index: 'id', layout: 'fitColumns',
    toolbar: false, rowActionColumn: { enabled: false },
    columns: [{
      title: 'Price', field: 'price', minWidth: 118, widthGrow: 1,
      hozAlign: 'right', headerHozAlign: 'right', headerSort: false,
      formatter: (cell: { getRow(): { getData(): HoldingsRow } }) =>
        this.liveCell(cell.getRow().getData(), 'price'),
    }],
  });
}`,
  cleanup: `ngOnDestroy(): void {
  this.stopTimer();
  document.removeEventListener('visibilitychange', this.onVisibilityChange);
  this.pendingIdentityFormats.clear();
  this.activeLookupKey = null;
  this.lookupDialog.destroy();
  this.grid?.destroy();
  this.grid = null;
}`,
  lookup: `const lookup = AMB.lookup({
  keyField: 'id', valueField: 'name', labelField: 'ticker',
  columns: [
    { field: 'ticker', title: 'Ticker', visible: true, width: 100 },
    { field: 'name', title: 'Instrument', visible: true },
    { field: 'category', title: 'Type', visible: true, width: 110 },
  ],
  search: { fields: ['ticker', 'name', 'category', 'isin'] },
  cache: { enabled: false },
  load: ({ query, rowData }: { query: string; rowData?: object }) => {
    const key = this.activeLookupKey ??
      (rowData && 'id' in rowData && typeof rowData.id === 'string' ? rowData.id : '');
    return availableInstruments(INSTRUMENT_CATALOG,
      this.grid?.getData() as HoldingsRow[] ?? initialRows(), key, query);
  },
});`,
  multifield: `const multifield = AMB.multifieldLookup({
  id: 'portfolio-instrument', lookup,
  clearDependentsOnInvalidMaster: false,
  clearDependentsOnEmptyMaster: false,
  masterField: {
    field: 'instrument', from: 'name', title: 'Instrument', required: true,
    autocomplete: true, dialog: true,
  },
  dependentFields: [
    { field: 'instrumentId', from: 'id', title: 'Instrument ID',
      visibleInGrid: false, visibleInLookup: false, searchable: false, required: true },
    { field: 'ticker', from: 'ticker', title: 'Ticker',
      visibleInGrid: false, visibleInLookup: true, searchable: true, required: true },
    { field: 'type', from: 'category', title: 'Type',
      visibleInGrid: true, visibleInLookup: true, searchable: true, required: true },
  ],
});`,
  quantity: `const isCrypto = cell.getRow().getData().type === 'Crypto';
const quantityEditor = isCrypto
  ? AMB.editors.decimal({ decimalDigits: 8, integerDigits: 10,
      allowEmpty: false, min: Number.MIN_VALUE })
  : AMB.editors.integer({ maxLength: 10, allowEmpty: false,
      min: 1, max: 9999999999 });`,
  tick: `private tick(): void {
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
}`,
  refresh: `private refreshLiveCells(row: HoldingsRow): void {
  if (!this.grid) return;
  const key = positionKey(row);
  if (!key) return;
  for (const field of LIVE_FIELDS) {
    const cell = this.grid.getCellElement(key, field) as Element | false;
    if (!cell) continue;
    const content = cell.querySelector<HTMLElement>(\`[data-portfolio-live="\${field}"]\`);
    if (content) this.paintLiveCell(content, row, field);
  }
}`,
  totals: `const allHoldings = () =>
  (this.grid?.getData() as HoldingsRow[] | undefined) ?? initialHoldings;
const portfolioTotals = () =>
  calculatePortfolioTotals(allHoldings(), (id) => this.market.quoteFor(id));

const valueSummary = {
  topCalc: () => portfolioTotals().value,
  topCalcFormatter: AMB.formatters.calculation({
    label: 'VALORE TOTALE',
    className: 'portfolio-grid__top-summary portfolio-grid__top-summary--value',
    formatValue: (value: number) => formatEuro(value),
  }),
};
const profitLossSummary = {
  topCalc: () => portfolioTotals(),
  topCalcFormatter: profitSummary,
};`,
} as const;

export const copy = {
  it: {
    title: 'Inizia con AMB Grid in Angular',
    intro: 'La demo Live Multi-Asset Portfolio mostra come integrare AMB Grid in Angular, utilizzare lookup ed editing selettivo e aggiornare formatter, Timeline e totali attraverso quotazioni generate localmente che simulano il comportamento di un feed WebSocket.',
    installPrompt: 'Devi ancora installare AMB Grid?',
    installLink: 'Vai alla pagina Installazione →',
    codeLabel: 'Codice TypeScript',
    steps: [
      {
        title: 'Inizializza AMB Grid nel lifecycle Angular',
        description: 'Angular possiede il contenitore DOM collegato a #gridHost. @ViewChild e ElementRef lo rendono disponibile in ngAfterViewInit; AMB.table crea la griglia al suo interno. Angular coordina il componente, AMB Grid gestisce la tabella.',
        note: 'Estratti parziali di PortfolioGridComponent, con la sola colonna Price. Import, helper e sottoscrizioni sono omessi. Il cleanup completo ferma il timer, rimuove il listener, distrugge il lookup e la griglia.',
      },
      {
        title: 'Modifica soltanto i campi necessari',
        description: 'Solo Instrument e Quantity hanno un editor. AMB.lookup ricerca nel catalogo locale escludendo gli strumenti già presenti in altre posizioni; AMB.multifieldLookup collega il nome a instrumentId, ticker e type. La colonna Instrument nasce da multifield.masterColumn(), le dipendenti da multifield.dependentColumn(). Price, Timeline, Value e P/L sono consultabili senza editor.',
        note: 'Estratti di ngAfterViewInit e dell’editor Quantity. La callback applyRecord, omessa, usa instrumentSelectionPatch per verificare i duplicati e aggiornare i campi collegati, quantità e costo medio. Callback e validator completi richiedono quantità finite e positive. Le 14 posizioni restano fisse.',
      },
      {
        title: 'Aggiorna i dati con un feed simulato',
        description: 'Il feed è una simulazione locale in memoria: riproduce aggiornamenti push simili a WebSocket, senza connessione o server WebSocket, backend finanziario o quotazioni reali. Il timer applicativo chiama tick ogni 900 ms quando Live è attivo e la pagina è visibile. MarketSimulator.advance genera prezzi e aggiorna lo storico; vengono ridipinte soltanto le celle degli strumenti interessati, senza ricreare la tabella.',
        note: 'tick, refreshLiveCells e paintLiveCell sono metodi applicativi; getData(), getCellElement() e recalc() sono API pubbliche AMB Grid. LIVE_FIELDS seleziona timeline, price, value e profitLoss. paintLiveCell delega a paintTimeline il disegno SVG dei 32 campioni locali; i formatter creano il contenuto iniziale tramite liveCell.',
      },
      {
        title: 'Aggiorna i calcoli aggregati',
        description: 'L’helper applicativo calculatePortfolioTotals calcola valore, P/L e rendimento sul costo usando tutte le 14 posizioni, anche con filtri attivi. AMB Grid esegue topCalc; AMB.formatters.calculation presenta il valore totale. Il P/L usa il formatter applicativo profitSummary. recalc aggiorna i totali dopo ogni tick e dopo l’editing della quantità; anche la selezione di uno strumento richiede un ricalcolo.',
        note: 'valueSummary e profitLossSummary nominano le proprietà dei totali nelle colonne Value e P/L. initialHoldings e i formatter sono definiti nel componente. Il tick precedente mostra recalc(); gli handler di editing lo richiamano dopo le modifiche.',
      },
    ],
  },
  en: {
    title: 'Get started with AMB Grid in Angular',
    intro: 'The Live Multi-Asset Portfolio demo shows how to integrate AMB Grid into Angular, use lookups and selective editing, and update formatters, Timelines and totals using locally generated quotes that simulate a WebSocket feed.',
    installPrompt: 'Still need to install AMB Grid?',
    installLink: 'Go to the Installation page →',
    codeLabel: 'TypeScript code',
    steps: [
      {
        title: 'Initialize AMB Grid in the Angular lifecycle',
        description: 'Angular owns the DOM container linked to #gridHost. @ViewChild and ElementRef make it available in ngAfterViewInit; AMB.table creates the grid inside it. Angular coordinates the component, while AMB Grid manages the table.',
        note: 'Partial excerpts from PortfolioGridComponent, showing only the Price column. Imports, helpers and subscriptions are omitted. The complete cleanup stops the timer, removes the listener and destroys the lookup and grid.',
      },
      {
        title: 'Edit only the fields you need',
        description: 'Only Instrument and Quantity have editors. AMB.lookup searches the local catalogue while excluding instruments already held in other positions; AMB.multifieldLookup links the name to instrumentId, ticker and type. Instrument comes from multifield.masterColumn(), and dependent columns from multifield.dependentColumn(). Price, Timeline, Value and P/L have no editors.',
        note: 'Excerpts from ngAfterViewInit and the Quantity editor. The omitted applyRecord callback uses instrumentSelectionPatch to check duplicates and update linked fields, quantity and average cost. The full callback and validator require finite, positive quantities. The 14 positions remain fixed.',
      },
      {
        title: 'Update data with a simulated feed',
        description: 'The feed is a local, in-memory simulation: it reproduces WebSocket-like push updates without a WebSocket connection or server, financial backend or real quotes. The application timer calls tick every 900 ms while Live is active and the page is visible. MarketSimulator.advance generates prices and updates history; only cells for affected instruments are repainted, without recreating the table.',
        note: 'tick, refreshLiveCells and paintLiveCell are application methods; getData(), getCellElement() and recalc() are public AMB Grid APIs. LIVE_FIELDS selects timeline, price, value and profitLoss. paintLiveCell delegates the SVG drawing of 32 local samples to paintTimeline; formatters create the initial content through liveCell.',
      },
      {
        title: 'Refresh aggregate calculations',
        description: 'The application helper calculatePortfolioTotals computes value, P/L and return on cost across all 14 positions, including when filters are active. AMB Grid runs topCalc; AMB.formatters.calculation displays total value. P/L uses the application’s profitSummary formatter. recalc refreshes totals after each tick and quantity edit; instrument selection also triggers recalculation.',
        note: 'valueSummary and profitLossSummary name the totals properties in the Value and P/L columns. initialHoldings and formatters are defined in the component. The preceding tick shows recalc(); editing handlers call it after changes as well.',
      },
    ],
  },
} as const;

export const stepCode = [
  [snippets.lifecycle, snippets.cleanup],
  [snippets.lookup, snippets.multifield, snippets.quantity],
  [snippets.tick, snippets.refresh],
  [snippets.totals],
];
