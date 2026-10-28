type Language = 'it' | 'en';

// Display-only excerpts: never execute these strings or mount another grid.
const snippets = {
  lifecycle: `const gridElementRef = useRef<HTMLDivElement | null>(null);
useEffect(() => {
  if (!gridElementRef.current) return;
  let destroyGrid = () => {};
  const initializeGrid = window.setTimeout(() => {
    if (!gridElementRef.current) return;
    const grid = AMB.table({
      selector: gridElementRef.current, data: [],
      columns: [{ title: 'Product name', field: 'productName' }],
    });
    destroyGrid = () => grid.destroy();
  }, 0);
  return () => {
    window.clearTimeout(initializeGrid);
    destroyGrid();
  };
}, []);
return <div className="react-demo-grid" ref={gridElementRef} />;`,
  state: `const [payload, setPayload] = useState<InventoryPayload>(emptyPayload);
const syncFromGrid = useCallback((controller: InventoryGridController) => {
  const nextPayload = controller.getSavePayload({
    savePolicy: 'valid-only', includeInvalid: true,
  });
  setPayload(nextPayload);
}, []);
<InventoryGrid onReady={handleGridReady} onStateChange={syncFromGrid} />;`,
  events: `let isActive = true;
const refresh = () => queueMicrotask(() => {
  if (isActive) onStateChange(grid);
});
const removeCrudListeners = [grid.onCrud('row-state-changed', refresh)];
grid.on('dataFiltered', refresh);

destroyGrid = () => {
  isActive = false;
  grid.off('dataFiltered', refresh);
  removeCrudListeners.forEach((removeListener) => removeListener());
  grid.destroy();
};`,
  lookup: `const supplierLookup = AMB.lookup({
  keyField: 'id', valueField: 'code', labelField: 'description',
  columns: [
    { field: 'code', title: 'Code', visible: true, width: 92 },
    { field: 'name', title: 'Supplier', visible: true, width: 200 },
    { field: 'city', title: 'City', visible: true, width: 120 },
    { field: 'category', title: 'Category', visible: true, width: 170 },
  ],
  search: { fields: ['code', 'name', 'city'] },
  mapToRow: { supplierCode: 'code', supplierName: 'name', supplierCity: 'city' },
  load: async ({ query }) => {
    const response = await fetch(
      \`/api/suppliers?query=\${encodeURIComponent(query)}\`,
    );
    if (!response.ok) throw new Error(\`GET /api/suppliers failed with \${response.status}\`);
    const body = await response.json() as { suppliers: Supplier[] };
    return body.suppliers;
  },
});`,
  editor: `const supplierDialog = new AMB.LookupDialog();
const supplierEditor = AMB.editors.lookup(supplierLookup, {
  allowEmpty: false, dialog: supplierDialog,
  dialogTitle: 'Search supplier', searchPlaceholder: 'Search supplier...',
  invalidMessage: 'Unknown supplier code',
  autoComplete: false, showDescription: true,
  dialogOptions: { closeOnBackdropClick: false, destroyOnClose: true },
});
// In columns: { title: 'Supplier', field: 'supplierCode', editor: supplierEditor, ... }
// In destroyGrid: supplierDialog.destroy();`,
  request: `const currentPayload = grid.getSavePayload({
  savePolicy: 'valid-only', includeInvalid: true,
});
const report = grid.getStateReport();
const savedCandidates = report.validChangedRows.map(({ key, tempId }) => ({ key, tempId }));
const response = await fetch('/api/products/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(currentPayload.changes),
});
if (!response.ok) throw new Error(\`POST /api/products/save failed with \${response.status}\`);
const result = await response.json() as SaveResponse;`,
  acknowledge: `const idByTempId = new Map(result.insertedIds
  .filter(({ tempId }) => Boolean(tempId))
  .map(({ tempId, id }) => [tempId as string, id]));
grid.applyBackendIds(result.insertedIds.filter(
  (mapping): mapping is { tempId: string; id: number } =>
    typeof mapping.tempId === 'string',
));
const identifiers = savedCandidates.map(({ key, tempId }) =>
  tempId ? idByTempId.get(tempId) ?? key : key);
const acknowledged = grid.markRowsSaved(identifiers);
if (!acknowledged) throw new Error('Save acknowledgement failed');
syncFromGrid(grid);`,
} as const;

const copy = {
  it: {
    title: 'Inizia con AMB Grid in React',
    intro: 'La demo Inventory Operations mostra come integrare AMB Grid nei componenti React, coordinando lifecycle, eventi, stato applicativo e salvataggio delle modifiche attraverso le API pubbliche della libreria.',
    installPrompt: 'Devi ancora installare AMB Grid?',
    installLink: 'Vai alla pagina Installazione →',
    codeLabel: 'Codice TypeScript / TSX',
    steps: [
      {
        title: 'Integra AMB Grid nel lifecycle React',
        description: 'React possiede il contenitore DOM; AMB Grid gestisce la griglia al suo interno. useRef mantiene il riferimento al contenitore e useEffect coordina inizializzazione e distruzione.',
        note: 'Estratto semplificato del corpo di InventoryGrid.tsx: importa useRef e useEffect da React e AMB dal modulo della demo. Qui le colonne sono ridotte a una. Il timer viene annullato nel cleanup e la griglia viene distrutta se è stata creata. Nella demo completa il cleanup rimuove anche i listener, distrugge supplierDialog, azzera gridRef e chiama onReady(null).',
      },
      {
        title: 'Sincronizza AMB Grid con lo stato React',
        description: 'InventoryShell passa syncFromGrid come onStateChange. In InventoryGrid, gli eventi reali row-state-changed e dataFiltered richiamano questa callback: il nuovo payload aggiorna lo stato React. La callback completa legge anche getStateReport() e getCalcResults() per aggiornare i KPI.',
        note: 'Estratti parziali di InventoryShell.tsx e InventoryGrid.tsx; tipi, emptyPayload e handleGridReady sono definiti nella demo. Il secondo blocco mostra due sottoscrizioni e il relativo destroyGrid: onCrud restituisce la funzione di rimozione, mentre on richiede off.',
      },
      {
        title: 'Configura editor e ricerca dei fornitori',
        description: 'AMB.lookup definisce ricerca e mappatura dei dati del fornitore nella riga. AMB.editors.lookup usa questa configurazione nell’editor della colonna Supplier e apre il dialogo di ricerca. La richiesta /api/suppliers è intercettata dal backend simulato locale.',
        note: 'Estratti di InventoryGrid.tsx: Supplier è il tipo importato dai dati della demo. Le opzioni del lookup sono quelle effettive; supplierEditor dà un nome all’espressione che nella demo è direttamente nella proprietà editor della colonna. Il dialogo viene creato nell’effetto e distrutto nel cleanup.',
      },
      {
        title: 'Gestisci il salvataggio asincrono',
        description: 'getSavePayload() prepara i dati, ma non li invia. fetch trasmette le modifiche all’API simulata; solo dopo una risposta valida applyBackendIds associa gli ID restituiti e markRowsSaved conferma le righe salvate. Le modifiche non valide restano da correggere.',
        note: 'Due estratti consecutivi di saveValidChanges in InventoryShell.tsx, dentro il blocco try della callback asincrona. SaveResponse contiene insertedIds: { tempId?: string; id: number }[]. Prima di arrivare qui, prepareSave esegue validateChanges(), controlla hasChanges e canSave e richiede conferma per il salvataggio parziale. Sono omessi busy, catch/finally e i messaggi di feedback, presenti nella demo.',
      },
    ],
  },
  en: {
    title: 'Get started with AMB Grid in React',
    intro: 'The Inventory Operations demo shows how to integrate AMB Grid into React components, coordinating lifecycle, events, application state and saving changes through the library’s public APIs.',
    installPrompt: 'Still need to install AMB Grid?',
    installLink: 'Go to the Installation page →',
    codeLabel: 'TypeScript / TSX code',
    steps: [
      {
        title: 'Integrate AMB Grid into the React lifecycle',
        description: 'React owns the DOM container; AMB Grid manages the grid inside it. useRef keeps the container reference and useEffect coordinates initialization and destruction.',
        note: 'Simplified excerpt from the InventoryGrid.tsx component body: import useRef and useEffect from React and AMB from the demo module. Columns are reduced to one here. Cleanup cancels the timer and destroys the grid if it was created. In the full demo, cleanup also removes listeners, destroys supplierDialog, resets gridRef and calls onReady(null).',
      },
      {
        title: 'Synchronize AMB Grid with React state',
        description: 'InventoryShell passes syncFromGrid as onStateChange. In InventoryGrid, the real row-state-changed and dataFiltered events call this callback: the new payload updates React state. The full callback also reads getStateReport() and getCalcResults() to update the KPIs.',
        note: 'Partial excerpts from InventoryShell.tsx and InventoryGrid.tsx; types, emptyPayload and handleGridReady are defined in the demo. The second block shows two subscriptions and their destroyGrid cleanup: onCrud returns an unsubscribe function, while on requires off.',
      },
      {
        title: 'Configure editors and supplier search',
        description: 'AMB.lookup defines supplier search and maps supplier data into the row. AMB.editors.lookup uses this configuration in the Supplier column editor and opens the search dialog. The local mock backend intercepts the /api/suppliers request.',
        note: 'Excerpts from InventoryGrid.tsx: Supplier is the type imported from the demo data. These are the actual lookup options; supplierEditor names the expression that the demo places directly in the column’s editor property. The dialog is created inside the effect and destroyed during cleanup.',
      },
      {
        title: 'Handle asynchronous saving',
        description: 'getSavePayload() prepares data but does not send it. fetch submits changes to the mock API; only after a successful response does applyBackendIds assign the returned IDs and markRowsSaved acknowledge saved rows. Invalid changes remain pending correction.',
        note: 'Two consecutive excerpts from saveValidChanges in InventoryShell.tsx, inside the async callback’s try block. SaveResponse contains insertedIds: { tempId?: string; id: number }[]. Before reaching this code, prepareSave runs validateChanges(), checks hasChanges and canSave, and requests confirmation for partial saves. The demo’s busy state, catch/finally and feedback messages are omitted.',
      },
    ],
  },
} as const;

// A small, local tokenizer for these fixed excerpts. React escapes all text.
function CodeBlock({ code, label }: { code: string; label: string }) {
  const tokens = code.split(/(\/\/[^\n]*|'[^'\n]*'|"[^"\n]*"|`[^`]*`|\b(?:const|let|if|return|useEffect|useRef|useState|useCallback|async|await|as|new|typeof|true|false|null)\b|\bAMB\b|\b\d+\b|\b[A-Za-z_$][\w$]*(?=\())/g);
  return (
    <pre aria-label={label} className="react-start-code" tabIndex={0}><code>{tokens.map((token, index) => {
      const kind = token.startsWith('//') ? 'comment'
        : /^['"`]/.test(token) ? 'string'
          : token === 'AMB' ? 'api'
            : /^\d+$/.test(token) ? 'number'
              : /^(const|let|if|return|async|await|as|new|typeof|true|false|null)$/.test(token) ? 'keyword'
                : index % 2 === 1 ? 'function' : undefined;
      return kind ? <span className={`react-start-token--${kind}`} key={index}>{token}</span> : token;
    })}</code></pre>
  );
}

const stepCode = [
  [snippets.lifecycle],
  [snippets.state, snippets.events],
  [snippets.lookup, snippets.editor],
  [snippets.request, snippets.acknowledge],
];

export function ReactGettingStarted({ language }: { language: Language }) {
  const text = copy[language];
  return (
    <section aria-labelledby="react-getting-started-title" className="react-start-guide" id="react-getting-started">
      <header className="react-start-guide__heading">
        <p className="react-start-guide__kicker">REACT · TYPESCRIPT</p>
        <h2 id="react-getting-started-title">{text.title}</h2>
        <p>{text.intro}</p>
        <p className="react-start-guide__install">{text.installPrompt} <a href="/install/">{text.installLink}</a></p>
      </header>
      <ol className="react-start-guide__steps">
        {text.steps.map((step, index) => (
          <li className="react-start-step" key={index}>
            <span aria-hidden="true" className="react-start-step__number">{index + 1}</span>
            <div className="react-start-step__body">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <p className="react-start-step__note">{step.note}</p>
              {stepCode[index].map((code, block) => <CodeBlock code={code} key={block} label={`${step.title} — ${text.codeLabel} ${block + 1}`} />)}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
