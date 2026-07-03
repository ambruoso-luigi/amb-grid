# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: add-row-focus-diagnostic.e2e.js >> browser addRow focus diagnostic >> Gestionale Magazzino Classico reports immediate and delayed focus after repeated Add row
- Location: tests\e2e\add-row-focus-diagnostic.e2e.js:296:5

# Error details

```
Error: Target cell did not open a real editor.
classification: B) toolbar callback did not keep the Add button busy
scenario: Gestionale Magazzino Classico paginated deleteColumn via toolbar
iteration: 1
pollOutcome: poll-timeout
busyImmediate: null
busyAfter50ms: null
busyAfterPolling: null
--- immediate report ---
scenario: Gestionale Magazzino Classico paginated deleteColumn via toolbar
iteration: 1
phase: immediate
activeElement.tagName: BODY
activeElement.className: 
activeElement.ariaLabel: null
actionButtonFocused: false
activeInsideTabulatorCell: false
activeCellField: null
newRowsVisible: 1
currentPage: 11
pageSize: 10
newRowExists: true
targetCellField: itemCode
targetCellExists: true
targetCellEditing: false
targetEditorExists: false
targetEditorFocused: false
targetCellContainsActiveElement: false
buttonBusy: null
--- delayed report ---
scenario: Gestionale Magazzino Classico paginated deleteColumn via toolbar
iteration: 1
phase: after-polling
activeElement.tagName: BODY
activeElement.className: 
activeElement.ariaLabel: null
actionButtonFocused: false
activeInsideTabulatorCell: false
activeCellField: null
newRowsVisible: 1
currentPage: 11
pageSize: 10
newRowExists: true
targetCellField: itemCode
targetCellExists: true
targetCellEditing: false
targetEditorExists: false
targetEditorFocused: false
targetCellContainsActiveElement: false
buttonBusy: null
--- extra ---
{
  "addRowReturnIsPromise": "not measurable from the demo toolbar without exposing the grid controller",
  "cellEditCalled": "not measurable from the demo toolbar without monkey-patching the grid controller"
}

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e4]:
    - navigation "AMB Grid guide navigation" [ref=e5]:
      - link "AMB Grid" [ref=e6] [cursor=pointer]:
        - /url: "#top"
        - img "AMB Grid" [ref=e7]
      - generic "Language" [ref=e8]:
        - button "English" [ref=e9] [cursor=pointer]: EN
        - switch "Cambia lingua in inglese" [checked] [ref=e10] [cursor=pointer]
        - button "Italiano" [pressed] [ref=e14] [cursor=pointer]: IT
    - link "Torna alla home demo" [ref=e15] [cursor=pointer]:
      - /url: "#top"
    - generic [ref=e16]:
      - paragraph [ref=e17]: JavaScript
      - heading "AMB Grid con JavaScript" [level=1] [ref=e18]
      - paragraph [ref=e19]: Demo tabellare e guida essenziale per usare AMB Grid in una pagina JavaScript classica, senza framework obbligatori.
  - generic [ref=e20]:
    - generic [ref=e21]:
      - generic [ref=e22]:
        - generic [ref=e23]: Demo principale
        - paragraph [ref=e24]: Demo legacy-friendly
        - heading "Gestionale Magazzino Classico" [level=2] [ref=e25]
        - paragraph [ref=e26]: Una pagina gestionale classica, adatta a contesti server-rendered e legacy-friendly, con una UI moderna per CRUD, validazione e payload applicativi.
      - paragraph [ref=e27]: "Scenario: Classic Warehouse Backoffice"
    - generic [ref=e28]:
      - generic [ref=e29]:
        - button "Add row" [ref=e30] [cursor=pointer]:
          - img [ref=e32]
          - generic [ref=e34]: Row
        - button "Reload data" [ref=e35] [cursor=pointer]:
          - img [ref=e37]
          - generic [ref=e40]: Reload
        - button "Save changes" [ref=e41] [cursor=pointer]:
          - img [ref=e43]
          - generic [ref=e45]: Save
        - button "Show payload" [ref=e46] [cursor=pointer]:
          - img [ref=e48]
          - generic [ref=e50]: Show payload
        - button "Validate rows" [ref=e51] [cursor=pointer]:
          - img [ref=e53]
          - generic [ref=e55]: Validate
        - button "Show state report" [ref=e56] [cursor=pointer]:
          - generic [ref=e57]: Report
      - generic [ref=e59]:
        - searchbox "Search inventory..." [ref=e60]
        - button "Filters" [ref=e61] [cursor=pointer]:
          - img [ref=e63]
    - grid [ref=e65]:
      - rowgroup [ref=e66]:
        - row "Item code Product name Warehouse Stock quantity Unit price Last check date Status Requires inspection Notes" [ref=e68]:
          - columnheader [ref=e69]
          - columnheader "Item code" [ref=e74]:
            - generic [ref=e77]: Item code
          - columnheader "Product name" [ref=e81]:
            - generic [ref=e84]: Product name
          - columnheader "Warehouse" [ref=e88]:
            - generic [ref=e91]: Warehouse
          - columnheader "Stock quantity" [ref=e95]:
            - generic [ref=e98]: Stock quantity
          - columnheader "Unit price" [ref=e102]:
            - generic [ref=e105]: Unit price
          - columnheader "Last check date" [ref=e109]:
            - generic [ref=e112]: Last check date
          - columnheader "Status" [ref=e116]:
            - generic [ref=e119]: Status
          - columnheader "Requires inspection" [ref=e123]:
            - generic [ref=e126]: Requires inspection
          - columnheader "Notes" [ref=e130]:
            - generic [ref=e133]: Notes
      - rowgroup [ref=e138]:
        - row "Remove new product 0" [ref=e139]:
          - gridcell "Remove new product" [ref=e140]:
            - button "Remove new product" [ref=e142] [cursor=pointer]: ✕
          - gridcell [ref=e144]
          - gridcell [ref=e146]
          - gridcell [ref=e148]
          - gridcell "0" [ref=e150]
          - gridcell [ref=e152]
          - gridcell [ref=e154]
          - gridcell [ref=e156]
          - gridcell [ref=e158]
          - gridcell [ref=e160]
      - generic [ref=e164]:
        - generic [ref=e165]: Page Size
        - combobox "Page Size" [ref=e166]:
          - option "10" [selected]
          - option "20"
          - option "50"
        - button "First Page" [ref=e167] [cursor=pointer]: First
        - button "Prev Page" [ref=e168] [cursor=pointer]: Prev
        - generic [ref=e169]:
          - button "Show Page 7" [ref=e170] [cursor=pointer]: "7"
          - button "Show Page 8" [ref=e171] [cursor=pointer]: "8"
          - button "Show Page 9" [ref=e172] [cursor=pointer]: "9"
          - button "Show Page 10" [ref=e173] [cursor=pointer]: "10"
          - button "Show Page 11" [ref=e174] [cursor=pointer]: "11"
        - button "Next Page" [disabled] [ref=e175]: Next
        - button "Last Page" [disabled] [ref=e176]: Last
  - generic [ref=e177]:
    - generic [ref=e178]:
      - paragraph [ref=e179]: JavaScript
      - heading "Inizia con AMB Grid in JavaScript" [level=2] [ref=e180]
      - paragraph [ref=e181]: Dopo la demo completa, questi step mostrano il minimo necessario per preparare container, dati, colonne e payload in una pagina JavaScript.
    - generic "JavaScript getting started steps" [ref=e182]:
      - article [ref=e183]:
        - generic [ref=e184]: "1"
        - generic [ref=e185]:
          - heading "Prepara il container" [level=3] [ref=e186]
          - paragraph [ref=e187]: Crea nel markup un punto di mount dedicato alla griglia.
          - code [ref=e189]: <div id="grid"></div>
      - article [ref=e190]:
        - generic [ref=e191]: "2"
        - generic [ref=e192]:
          - heading "Importa AMB Grid" [level=3] [ref=e193]
          - paragraph [ref=e194]: Durante lo sviluppo locale importa la libreria dal sorgente o dal build del progetto. Quando il pacchetto npm sarà disponibile, questa sezione conterrà il comando ufficiale.
          - code [ref=e196]: "import { AMB } from './src/index.js'; // oppure importa lo stesso export dal tuo build locale quando lo prepari."
      - article [ref=e197]:
        - generic [ref=e198]: "3"
        - generic [ref=e199]:
          - heading "Definisci dati e colonne" [level=3] [ref=e200]
          - paragraph [ref=e201]: Parti da un dataset piccolo e da colonne esplicite. I validator possono essere aggiunti dove servono regole applicative.
          - code [ref=e203]: "const rows = [ { id: 1, sku: 'SKU-1001', productName: 'Steel shelving unit', stockQuantity: 42 }, { id: 2, sku: 'SKU-1002', productName: 'Barcode scanner', stockQuantity: 8 } ]; const columns = [ { title: 'SKU', field: 'sku', editor: AMB.editors.text({ uppercase: true }) }, { title: 'Product name', field: 'productName', editor: AMB.editors.text({ trim: true }) }, { title: 'Stock quantity', field: 'stockQuantity', editor: AMB.editors.integer({ allowEmpty: false }), formatter: AMB.formatters.integer(), validation: { integer: true, min: { value: 0 } } } ];"
      - article [ref=e204]:
        - generic [ref=e205]: "4"
        - generic [ref=e206]:
          - heading "Crea la griglia CRUD" [level=3] [ref=e207]
          - paragraph [ref=e208]: AMB.table monta Tabulator e aggiunge lo strato CRUD di AMB Grid per stati riga, validazione e payload.
          - code [ref=e210]: "const grid = AMB.table({ selector: '#grid', data: rows, columns, layout: 'fitColumns', deleteColumn: { enabled: true }, toolbar: { buttons: ['add', 'reload', 'save', 'payload', 'validate'], onAdd: () => grid.crud.addRow({ id: null, sku: '', productName: '', stockQuantity: 0 }), onPayload: ({ payload }) => console.log(payload) } });"
      - article [ref=e211]:
        - generic [ref=e212]: "5"
        - generic [ref=e213]:
          - heading "Leggi il payload" [level=3] [ref=e214]
          - paragraph [ref=e215]: Quando l’applicazione deve salvare, leggi il payload CRUD generato da AMB Grid e invialo al tuo backend.
          - code [ref=e217]: "const payload = grid.crud.getSavePayload(); if (payload.canSave) { await saveRows(payload.changes); }"
      - article [ref=e218]:
        - generic [ref=e219]: "6"
        - generic [ref=e220]:
          - heading "Prossimi passi" [level=3] [ref=e221]
          - paragraph [ref=e222]: Rivedi la demo completa per vedere lookup, autocomplete, toolbar, rollback, validazione e payload nello stesso flusso.
          - generic [ref=e223]:
            - link "Torna alla demo" [ref=e224] [cursor=pointer]:
              - /url: "#getting-started-javascript"
              - img [ref=e225]
              - generic [ref=e227]: Torna alla demo
            - link "Vedi esempi funzionali" [ref=e228] [cursor=pointer]:
              - /url: "#feature-examples"
              - img [ref=e229]
              - generic [ref=e232]: Vedi esempi funzionali
  - generic [ref=e233]:
    - generic [ref=e234]:
      - paragraph [ref=e235]: Video guida
      - heading "Installazione e uso in JavaScript" [level=2] [ref=e236]
      - paragraph [ref=e237]: Qui verrà collegato il video introduttivo su installazione e uso di AMB Grid in JavaScript.
    - button "Video in arrivo" [disabled] [ref=e238]:
      - img [ref=e239]
      - generic [ref=e242]: Video in arrivo
```

# Test source

```ts
  171 |     return page.locator(selector).evaluate(button => button.dataset.busy || null);
  172 | };
  173 | 
  174 | const waitForFocusOutcome = async (page, {
  175 |     tableSelector,
  176 |     targetField
  177 | }) => {
  178 |     try {
  179 |         return await page.waitForFunction(({ tableSelector, targetField }) => {
  180 |             const tableRoot = document.querySelector(tableSelector);
  181 |             const activeElement = document.activeElement;
  182 |             const actionButton = activeElement && typeof activeElement.closest === 'function'
  183 |                 ? activeElement.closest('.amb-row-action-button')
  184 |                 : null;
  185 |             const visibleNewRows = tableRoot
  186 |                 ? Array.from(tableRoot.querySelectorAll('.tabulator-row[data-state="new"]'))
  187 |                     .filter(row => row.offsetParent !== null)
  188 |                 : [];
  189 |             const newRow = visibleNewRows[visibleNewRows.length - 1] || null;
  190 |             const targetCell = newRow
  191 |                 ? newRow.querySelector(`.tabulator-cell[tabulator-field="${targetField}"]`)
  192 |                 : null;
  193 |             const targetEditor = targetCell
  194 |                 ? targetCell.querySelector('input, textarea, select, [contenteditable="true"]')
  195 |                 : null;
  196 | 
  197 |             if (targetEditor) return 'target-editor-exists';
  198 |             if (targetCell && activeElement && targetCell.contains(activeElement)) return 'active-in-target-cell';
  199 |             if (actionButton) return 'active-in-action-button';
  200 | 
  201 |             return false;
  202 |         }, { tableSelector, targetField }, { timeout: POLL_TIMEOUT_MS }).then(handle => handle.jsonValue());
  203 |     } catch (error) {
  204 |         return 'poll-timeout';
  205 |     }
  206 | };
  207 | 
  208 | const runToolbarDiagnostic = async (page, {
  209 |     scenario,
  210 |     iteration,
  211 |     tableSelector,
  212 |     targetField,
  213 |     addButtonSelector
  214 | }) => {
  215 |     const addButton = page.locator(addButtonSelector);
  216 | 
  217 |     await addButton.click();
  218 | 
  219 |     const immediate = await collectFocusReport(page, {
  220 |         scenario,
  221 |         iteration,
  222 |         phase: 'immediate',
  223 |         tableSelector,
  224 |         targetField,
  225 |         addButtonSelector
  226 |     });
  227 |     const busyImmediate = await readBusyState(page, addButtonSelector);
  228 | 
  229 |     await page.waitForTimeout(50);
  230 |     const busyAfter50ms = await readBusyState(page, addButtonSelector);
  231 | 
  232 |     const pollOutcome = await waitForFocusOutcome(page, { tableSelector, targetField });
  233 |     const delayed = await collectFocusReport(page, {
  234 |         scenario,
  235 |         iteration,
  236 |         phase: 'after-polling',
  237 |         tableSelector,
  238 |         targetField,
  239 |         addButtonSelector
  240 |     });
  241 |     const busyAfterPolling = await readBusyState(page, addButtonSelector);
  242 |     const diagnostic = {
  243 |         scenario,
  244 |         iteration,
  245 |         pollOutcome,
  246 |         immediate,
  247 |         delayed,
  248 |         busyImmediate,
  249 |         busyAfter50ms,
  250 |         busyAfterPolling,
  251 |         extra: {
  252 |             addRowReturnIsPromise: 'not measurable from the demo toolbar without exposing the grid controller',
  253 |             cellEditCalled: 'not measurable from the demo toolbar without monkey-patching the grid controller'
  254 |         }
  255 |     };
  256 | 
  257 |     diagnostic.classification = classifyDiagnostic(diagnostic);
  258 |     console.info(formatDiagnostic(diagnostic));
  259 | 
  260 |     return diagnostic;
  261 | };
  262 | 
  263 | const assertDiagnosticSuccess = diagnostic => {
  264 |     const message = formatDiagnostic(diagnostic);
  265 | 
  266 |     expect(diagnostic.delayed.actionButtonFocused, `Focus is on the action/remove button.\n${message}`)
  267 |         .toBe(false);
  268 |     expect(diagnostic.delayed.targetCellExists, `Target cell is missing.\n${message}`)
  269 |         .toBe(true);
  270 |     expect(diagnostic.delayed.targetEditorExists, `Target cell did not open a real editor.\n${message}`)
> 271 |         .toBe(true);
      |          ^ Error: Target cell did not open a real editor.
  272 |     expect(
  273 |         diagnostic.delayed.targetEditorFocused || diagnostic.delayed.targetCellContainsActiveElement,
  274 |         `Active element is not inside the target field editor/cell.\n${message}`
  275 |     ).toBe(true);
  276 | };
  277 | 
  278 | const openInventoryDemo = async page => {
  279 |     await page.goto('/src/demo/index.html#getting-started-javascript');
  280 |     await expect(page.locator('#inventory-table.tabulator')).toBeVisible();
  281 | 
  282 |     const pageSize = page.locator('#inventory-table .tabulator-page-size');
  283 | 
  284 |     if (await pageSize.count()) {
  285 |         await pageSize.selectOption('10');
  286 |         await expect(pageSize).toHaveValue('10');
  287 |     }
  288 | };
  289 | 
  290 | const openBasicCrudDemo = async page => {
  291 |     await page.goto('/src/demo/index.html#feature-examples');
  292 |     await expect(page.locator('#basic-table.tabulator')).toBeVisible();
  293 | };
  294 | 
  295 | test.describe('browser addRow focus diagnostic', () => {
  296 |     test('Gestionale Magazzino Classico reports immediate and delayed focus after repeated Add row', async ({ page }) => {
  297 |         await openInventoryDemo(page);
  298 | 
  299 |         for (let iteration = 1; iteration <= 3; iteration += 1) {
  300 |             const diagnostic = await runToolbarDiagnostic(page, {
  301 |                 scenario: 'Gestionale Magazzino Classico paginated deleteColumn via toolbar',
  302 |                 iteration,
  303 |                 tableSelector: '#inventory-table',
  304 |                 targetField: 'itemCode',
  305 |                 addButtonSelector: '#javascript-demo .amb-toolbar__button--add'
  306 |             });
  307 | 
  308 |             assertDiagnosticSuccess(diagnostic);
  309 |         }
  310 |     });
  311 | 
  312 |     test('Basic CRUD reports immediate and delayed focus after Add row', async ({ page }) => {
  313 |         await openBasicCrudDemo(page);
  314 | 
  315 |         const diagnostic = await runToolbarDiagnostic(page, {
  316 |             scenario: 'Basic CRUD non-paginated deleteColumn via toolbar',
  317 |             iteration: 1,
  318 |             tableSelector: '#basic-table',
  319 |             targetField: 'title',
  320 |             addButtonSelector: '#feature-example .amb-toolbar__button--add'
  321 |         });
  322 | 
  323 |         assertDiagnosticSuccess(diagnostic);
  324 |     });
  325 | 
  326 |     test('direct awaited crud.addRow fixture compares core focus without toolbar timing', async ({ page }) => {
  327 |         await page.goto('/tests/e2e/fixtures/add-row-direct.html');
  328 |         await expect(page.locator('#fixture-table.tabulator')).toBeVisible();
  329 | 
  330 |         const directResult = await page.evaluate(() => window.__ambAddRowDiagnostic.addDirect());
  331 |         const pollOutcome = await waitForFocusOutcome(page, {
  332 |             tableSelector: '#fixture-table',
  333 |             targetField: 'itemCode'
  334 |         });
  335 |         const delayed = await collectFocusReport(page, {
  336 |             scenario: 'Direct awaited crud.addRow fixture',
  337 |             iteration: 1,
  338 |             phase: 'after-direct-await',
  339 |             tableSelector: '#fixture-table',
  340 |             targetField: 'itemCode'
  341 |         });
  342 |         const extra = await page.evaluate(directResult => {
  343 |             const diagnostics = window.__ambAddRowDiagnostic.diagnostics;
  344 |             const lastEditCall = diagnostics.cellEditCalls[diagnostics.cellEditCalls.length - 1] || null;
  345 | 
  346 |             return {
  347 |                 directResult,
  348 |                 addRowReturnIsPromise: diagnostics.directAddReturnIsPromise,
  349 |                 cellEditCalled: diagnostics.cellEditCalls.length > 0,
  350 |                 cellEditField: lastEditCall ? lastEditCall.field : null,
  351 |                 cellEditCalls: diagnostics.cellEditCalls
  352 |             };
  353 |         }, directResult);
  354 |         const diagnostic = {
  355 |             scenario: 'Direct awaited crud.addRow fixture',
  356 |             iteration: 1,
  357 |             pollOutcome,
  358 |             immediate: delayed,
  359 |             delayed,
  360 |             busyImmediate: null,
  361 |             busyAfter50ms: null,
  362 |             busyAfterPolling: null,
  363 |             extra
  364 |         };
  365 | 
  366 |         diagnostic.classification = classifyDiagnostic(diagnostic);
  367 |         console.info(formatDiagnostic(diagnostic));
  368 | 
  369 |         assertDiagnosticSuccess(diagnostic);
  370 |     });
  371 | });
```