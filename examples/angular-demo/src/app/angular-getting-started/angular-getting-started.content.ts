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
  selection: `const instrument = record as Instrument;
const row = cell.getRow().getData() as HoldingsRow;
const key = positionKey(row);
const selection = instrumentSelectionPatch(
  this.grid.getData() as HoldingsRow[], key, instrument,
  this.market.quoteFor(instrument.id).price,
);`,
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
  timeline: `const history = this.market.historyFor(row.instrumentId);
const previousClose = this.quoteFor(row).previousClose;
const low = Math.min(...history);
const high = Math.max(...history);
const spread = Math.max(high - low, previousClose * 0.001);
const base = low - spread * 0.15;
const scale = spread * 1.3;
svg.setAttribute('class', 'portfolio-grid__timeline');
svg.setAttribute('aria-label',
  \`\${row.ticker}: andamento simulato degli ultimi \${history.length} campioni\`);
while (svg.children.length < history.length)
  svg.append(document.createElementNS(namespace, 'rect'));
while (svg.children.length > history.length) svg.lastElementChild?.remove();`,
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
  recalc: `this.grid.on('cellEdited', (event: unknown) => {
  const cell = event as EditedCell;
  if (cell.getField() === 'quantity') {
    const row = cell.getRow().getData();
    this.refreshLiveCells(row);
    this.grid?.recalc();
  }
  if (cell.getField() === 'instrument') this.activeLookupKey = null;
});`,
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
        note: 'Estratti di PortfolioGridComponent: il primo mostra solo la colonna Price readonly. Import e helper come initialRows, HoldingsRow e liveCell sono definiti nel sorgente; le altre colonne e la registrazione degli eventi sono omesse. Il secondo è il cleanup reale: ngOnDestroy ferma il timer, rimuove il listener esistente, distrugge il lookup e chiama grid.destroy().',
      },
      {
        title: 'Modifica soltanto i campi necessari',
        description: 'Solo Instrument e Quantity hanno un editor. AMB.lookup ricerca nel catalogo locale escludendo gli strumenti già presenti in altre posizioni; AMB.multifieldLookup collega il nome a instrumentId, ticker e type. La colonna Instrument nasce da multifield.masterColumn(), le dipendenti da multifield.dependentColumn(). Price, Timeline, Value e P/L sono consultabili senza editor.',
        note: 'Estratti di ngAfterViewInit: lookup e multifield mantengono le opzioni reali. Il terzo frammento è il nucleo di editorOptions.applyRecord: dopo il controllo di this.grid, l’helper applicativo instrumentSelectionPatch verifica i duplicati e restituisce i campi collegati, quantità e costo medio. La callback restituisce selection, oppure null mostrando un errore; la parte omessa aggiorna filtri, celle e totali. L’ultimo frammento seleziona l’editor Quantity: decimali per Crypto, interi per le altre categorie; il callback e il validator completi verificano quantità finite e positive. Le 14 posizioni restano fisse.',
      },
      {
        title: 'Aggiorna i dati con un feed simulato',
        description: 'Il feed è una simulazione locale in memoria: riproduce aggiornamenti push simili a WebSocket, senza connessione o server WebSocket, backend finanziario o quotazioni reali. Il timer applicativo chiama tick ogni 900 ms quando Live è attivo e la pagina è visibile. MarketSimulator.advance genera prezzi e aggiorna lo storico; vengono ridipinte soltanto le celle degli strumenti interessati, senza ricreare la tabella.',
        note: 'Metodi reali di PortfolioGridComponent: tick e refreshLiveCells sono applicativi, mentre getData(), getCellElement() e recalc() sono API pubbliche AMB Grid. LIVE_FIELDS comprende timeline, price, value e profitLoss. I formatter creano i contenuti tramite liveCell; paintLiveCell aggiorna prezzo, valori e P/L e delega a paintTimeline. Il terzo estratto mostra il nucleo SVG di paintTimeline, dopo la creazione o il recupero di svg; seguono nel sorgente gli attributi e i colori delle barre, calcolati sui 32 campioni locali.',
      },
      {
        title: 'Aggiorna i calcoli aggregati',
        description: 'L’helper applicativo calculatePortfolioTotals calcola valore, P/L e rendimento sul costo usando tutte le 14 posizioni, anche con filtri attivi. AMB Grid esegue topCalc; AMB.formatters.calculation presenta il valore totale. Il P/L usa il formatter applicativo profitSummary. recalc aggiorna i totali dopo ogni tick e dopo l’editing della quantità; anche la selezione di uno strumento richiede un ricalcolo.',
        note: 'Estratti parziali: valueSummary e profitLossSummary danno un nome alle proprietà topCalc/topCalcFormatter delle colonne Value e P/L; inizializzazione di initialHoldings e formatter sono nel componente reale. Il secondo blocco è il listener cellEdited esistente, registrato dopo AMB.table. La colonna Instrument mostra anche il conteggio posizioni tramite topCalc e AMB.formatters.calculation.',
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
        note: 'Excerpts from PortfolioGridComponent: the first shows only the readonly Price column. Imports and helpers such as initialRows, HoldingsRow and liveCell are defined in the source; other columns and event registration are omitted. The second is the actual cleanup: ngOnDestroy stops the timer, removes the existing listener, destroys the lookup and calls grid.destroy().',
      },
      {
        title: 'Edit only the fields you need',
        description: 'Only Instrument and Quantity have editors. AMB.lookup searches the local catalogue while excluding instruments already held in other positions; AMB.multifieldLookup links the name to instrumentId, ticker and type. Instrument comes from multifield.masterColumn(), and dependent columns from multifield.dependentColumn(). Price, Timeline, Value and P/L have no editors.',
        note: 'Excerpts from ngAfterViewInit: lookup and multifield retain their actual options. The third fragment is the core of editorOptions.applyRecord: after checking this.grid, the application helper instrumentSelectionPatch checks duplicates and returns linked fields, quantity and average cost. The callback returns selection, or null with an error; omitted code refreshes filters, cells and totals. The last fragment selects the Quantity editor: decimals for Crypto, integers for other categories; the full callback and validator enforce finite, positive quantities. The 14 positions remain fixed.',
      },
      {
        title: 'Update data with a simulated feed',
        description: 'The feed is a local, in-memory simulation: it reproduces WebSocket-like push updates without a WebSocket connection or server, financial backend or real quotes. The application timer calls tick every 900 ms while Live is active and the page is visible. MarketSimulator.advance generates prices and updates history; only cells for affected instruments are repainted, without recreating the table.',
        note: 'Actual PortfolioGridComponent methods: tick and refreshLiveCells belong to the application; getData(), getCellElement() and recalc() are public AMB Grid APIs. LIVE_FIELDS contains timeline, price, value and profitLoss. Formatters create content through liveCell; paintLiveCell updates price, values and P/L and delegates to paintTimeline. The third excerpt shows the SVG core of paintTimeline, after svg is created or retrieved; the source then sets bar attributes and colors using the 32 local samples.',
      },
      {
        title: 'Refresh aggregate calculations',
        description: 'The application helper calculatePortfolioTotals computes value, P/L and return on cost across all 14 positions, including when filters are active. AMB Grid runs topCalc; AMB.formatters.calculation displays total value. P/L uses the application’s profitSummary formatter. recalc refreshes totals after each tick and quantity edit; instrument selection also triggers recalculation.',
        note: 'Partial excerpts: valueSummary and profitLossSummary name the Value and P/L columns’ topCalc/topCalcFormatter properties; initialHoldings and formatters are defined in the actual component. The second block is the existing cellEdited listener, registered after AMB.table. The Instrument column also shows the position count through topCalc and AMB.formatters.calculation.',
      },
    ],
  },
} as const;

export const stepCode = [
  [snippets.lifecycle, snippets.cleanup],
  [snippets.lookup, snippets.multifield, snippets.selection, snippets.quantity],
  [snippets.tick, snippets.refresh, snippets.timeline],
  [snippets.totals, snippets.recalc],
];
