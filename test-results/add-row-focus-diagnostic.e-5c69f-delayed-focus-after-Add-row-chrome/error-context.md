# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: add-row-focus-diagnostic.e2e.js >> browser addRow focus diagnostic >> Basic CRUD reports immediate and delayed focus after Add row
- Location: tests\e2e\add-row-focus-diagnostic.e2e.js:312:5

# Error details

```
Error: Target cell did not open a real editor.
classification: B) toolbar callback did not keep the Add button busy
scenario: Basic CRUD non-paginated deleteColumn via toolbar
iteration: 1
pollOutcome: poll-timeout
busyImmediate: null
busyAfter50ms: null
busyAfterPolling: null
--- immediate report ---
scenario: Basic CRUD non-paginated deleteColumn via toolbar
iteration: 1
phase: immediate
activeElement.tagName: INPUT
activeElement.className: amb-cell-editor
activeElement.ariaLabel: null
actionButtonFocused: false
activeInsideTabulatorCell: true
activeCellField: title
newRowsVisible: 1
currentPage: null
pageSize: null
newRowExists: true
targetCellField: title
targetCellExists: true
targetCellEditing: true
targetEditorExists: true
targetEditorFocused: true
targetCellContainsActiveElement: true
buttonBusy: null
--- delayed report ---
scenario: Basic CRUD non-paginated deleteColumn via toolbar
iteration: 1
phase: after-polling
activeElement.tagName: BODY
activeElement.className: 
activeElement.ariaLabel: null
actionButtonFocused: false
activeInsideTabulatorCell: false
activeCellField: null
newRowsVisible: 1
currentPage: null
pageSize: null
newRowExists: true
targetCellField: title
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
    - navigation "AMB Grid demo navigation" [ref=e5]:
      - link "AMB Grid" [ref=e6] [cursor=pointer]:
        - /url: "#top"
        - img "AMB Grid" [ref=e7]
      - generic "Language" [ref=e8]:
        - button "English" [ref=e9] [cursor=pointer]: EN
        - switch "Cambia lingua in inglese" [checked] [ref=e10] [cursor=pointer]
        - button "Italiano" [pressed] [ref=e14] [cursor=pointer]: IT
    - generic [ref=e15]:
      - heading "Griglie CRUD per applicazioni business" [level=1] [ref=e16]
      - paragraph [ref=e17]: AMB Grid aggiunge a Tabulator uno strato framework-agnostic per stati riga, validazione, lookup, rollback, salvataggio e payload pronti per il backend.
      - generic [ref=e18]:
        - link "Apri demo JavaScript" [ref=e19] [cursor=pointer]:
          - /url: "#getting-started-javascript"
          - img [ref=e20]
          - generic [ref=e22]: Apri demo JavaScript
        - link "Vedi esempi funzionali" [ref=e23] [cursor=pointer]:
          - /url: "#feature-examples"
          - img [ref=e24]
          - generic [ref=e27]: Vedi esempi funzionali
    - generic "AMB Grid capabilities" [ref=e28]:
      - generic [ref=e29]:
        - strong [ref=e30]: Stati riga
        - generic [ref=e31]: clean, new, modified, deleted, saved
      - generic [ref=e32]:
        - strong [ref=e33]: Payload CRUD
        - generic [ref=e34]: inserted, updated, deleted
      - generic [ref=e35]:
        - strong [ref=e36]: Integrazione
        - generic [ref=e37]: JavaScript, legacy-friendly, framework-ready
  - generic [ref=e38]:
    - generic [ref=e39]:
      - heading "Integrabile dove lavori già" [level=2] [ref=e40]
      - paragraph [ref=e41]: Usa AMB Grid in pagine JavaScript classiche, sistemi legacy-friendly o stack moderni come React, Vue e Angular.
    - generic [ref=e42]:
      - link "JavaScript Classic integration Snippet base con AMB.table(...). Apri guida JavaScript" [ref=e43] [cursor=pointer]:
        - /url: "#getting-started-javascript"
        - generic [ref=e45]: JS
        - generic [ref=e46]:
          - generic [ref=e47]: JavaScript
          - generic [ref=e48]: Classic integration
          - generic [ref=e49]: Snippet base con AMB.table(...).
          - generic [ref=e50]: Apri guida JavaScript
        - generic [ref=e51]: →
      - link "React Lifecycle integration Esempio concettuale con mount e grid.destroy() nel cleanup. Planned full demo" [ref=e52] [cursor=pointer]:
        - /url: "#feature-examples"
        - img [ref=e54]
        - generic [ref=e59]:
          - generic [ref=e60]: React
          - generic [ref=e61]: Lifecycle integration
          - generic [ref=e62]: Esempio concettuale con mount e grid.destroy() nel cleanup.
          - generic [ref=e63]: Planned full demo
        - generic [ref=e64]: →
      - link "Vue Composition API example Esempio concettuale con onMounted e onUnmounted. Snippet planned" [ref=e65] [cursor=pointer]:
        - /url: "#feature-examples"
        - img [ref=e67]
        - generic [ref=e70]:
          - generic [ref=e71]: Vue
          - generic [ref=e72]: Composition API example
          - generic [ref=e73]: Esempio concettuale con onMounted e onUnmounted.
          - generic [ref=e74]: Snippet planned
        - generic [ref=e75]: →
      - link "Angular Component lifecycle example Esempio concettuale con AfterViewInit e OnDestroy. Snippet planned" [ref=e76] [cursor=pointer]:
        - /url: "#feature-examples"
        - img [ref=e78]
        - generic [ref=e81]:
          - generic [ref=e82]: Angular
          - generic [ref=e83]: Component lifecycle example
          - generic [ref=e84]: Esempio concettuale con AfterViewInit e OnDestroy.
          - generic [ref=e85]: Snippet planned
        - generic [ref=e86]: →
  - generic [ref=e87]:
    - generic [ref=e88]:
      - paragraph [ref=e89]: Flusso applicativo
      - heading "CRUD, validazione e payload nello stesso ciclo" [level=2] [ref=e90]
      - paragraph [ref=e91]: AMB Grid coordina editing, validazione, lookup, rollback, salvataggio e payload pronti per il backend senza imporre un framework.
    - generic [ref=e92]:
      - article [ref=e93]:
        - strong [ref=e94]: Edit
        - paragraph [ref=e95]: Le celle editabili aggiornano i dati senza nascondere gli stati riga.
      - article [ref=e96]:
        - strong [ref=e97]: Editing orientato alla tastiera
        - paragraph [ref=e98]: Inserimento rapido dei dati con navigazione Tab, conferma lookup e flusso pensato per utenti gestionali.
      - article [ref=e99]:
        - strong [ref=e100]: Validate
        - paragraph [ref=e101]: Validatori e parser separano qualità del dato e normalizzazione payload.
      - article [ref=e102]:
        - strong [ref=e103]: Payload
        - paragraph [ref=e104]: Le modifiche diventano JSON leggibile e pronto per una API applicativa.
      - article [ref=e105]:
        - strong [ref=e106]: Align
        - paragraph [ref=e107]: Dopo il salvataggio, ID backend e stati possono essere riallineati.
  - generic [ref=e108]:
    - generic [ref=e109]:
      - paragraph [ref=e110]: Mini-demo tecniche
      - heading "Esempi funzionali" [level=2] [ref=e111]
      - paragraph [ref=e112]: Le demo esistenti restano accessibili come esempi focalizzati su singole capacità di AMB Grid.
    - generic "Feature examples" [ref=e113]:
      - button "Basic CRUD CRUD minimo con toolbar e payload applicativo. Apri esempio" [ref=e114] [cursor=pointer]:
        - generic [ref=e115]: Basic CRUD
        - generic [ref=e116]: CRUD minimo con toolbar e payload applicativo.
        - generic [ref=e117]: Apri esempio
      - button "Validation Regole campo, errori riga e report di validazione. Apri esempio" [ref=e118] [cursor=pointer]:
        - generic [ref=e119]: Validation
        - generic [ref=e120]: Regole campo, errori riga e report di validazione.
        - generic [ref=e121]: Apri esempio
      - button "Numeric fields Integer, decimal e percentuali con parser coerenti. Apri esempio" [ref=e122] [cursor=pointer]:
        - generic [ref=e123]: Numeric fields
        - generic [ref=e124]: Integer, decimal e percentuali con parser coerenti.
        - generic [ref=e125]: Apri esempio
      - button "Dates Editor data, picker e normalizzazione payload. Apri esempio" [ref=e126] [cursor=pointer]:
        - generic [ref=e127]: Dates
        - generic [ref=e128]: Editor data, picker e normalizzazione payload.
        - generic [ref=e129]: Apri esempio
      - button "Autocomplete Suggerimenti controllati per campi testuali business. Apri esempio" [ref=e130] [cursor=pointer]:
        - generic [ref=e131]: Autocomplete
        - generic [ref=e132]: Suggerimenti controllati per campi testuali business.
        - generic [ref=e133]: Apri esempio
      - button "Multifield lookup Lookup che aggiorna più campi da un record scelto. Apri esempio" [ref=e134] [cursor=pointer]:
        - generic [ref=e135]: Multifield lookup
        - generic [ref=e136]: Lookup che aggiorna più campi da un record scelto.
        - generic [ref=e137]: Apri esempio
      - button "Parsers Parser dedicati per trasformare i valori verso API. Apri esempio" [ref=e138] [cursor=pointer]:
        - generic [ref=e139]: Parsers
        - generic [ref=e140]: Parser dedicati per trasformare i valori verso API.
        - generic [ref=e141]: Apri esempio
      - button "Row states Stati riga, rollback, delete e report tecnici. Apri esempio" [ref=e142] [cursor=pointer]:
        - generic [ref=e143]: Row states
        - generic [ref=e144]: Stati riga, rollback, delete e report tecnici.
        - generic [ref=e145]: Apri esempio
      - button "Multiple tables Più griglie indipendenti nella stessa pagina. Apri esempio" [ref=e146] [cursor=pointer]:
        - generic [ref=e147]: Multiple tables
        - generic [ref=e148]: Più griglie indipendenti nella stessa pagina.
        - generic [ref=e149]: Apri esempio
    - generic [ref=e150]:
      - heading "Basic CRUD" [level=2] [ref=e151]
      - paragraph [ref=e152]: Edit rows, add new records, mark rows for deletion, and inspect the generated save payload. AMB Grid tracks row states and builds a backend-ready CRUD payload without performing backend calls by itself.
      - group [ref=e153]:
        - generic "Basic CRUD behavior" [ref=e154] [cursor=pointer]
      - generic [ref=e155]:
        - generic [ref=e156]:
          - button "Add row" [ref=e157] [cursor=pointer]:
            - img [ref=e159]
            - generic [ref=e161]: Row
          - button "Reload data" [ref=e162] [cursor=pointer]:
            - img [ref=e164]
            - generic [ref=e167]: Reload
          - button "Save changes" [ref=e168] [cursor=pointer]:
            - img [ref=e170]
            - generic [ref=e172]: Save
          - button "Show payload" [ref=e173] [cursor=pointer]:
            - img [ref=e175]
            - generic [ref=e177]: Show payload
          - button "Show report" [ref=e178] [cursor=pointer]:
            - generic [ref=e179]: Show report
          - button "Show selected" [ref=e180] [cursor=pointer]:
            - generic [ref=e181]: Show selected
        - generic [ref=e183]:
          - searchbox "Search notes..." [ref=e184]
          - button "Filters" [ref=e185] [cursor=pointer]:
            - img [ref=e187]
      - grid [ref=e189]:
        - rowgroup [ref=e190]:
          - row "Select Row ID Temp ID Row No. State Title Tag Archived" [ref=e192]:
            - columnheader "Select Row" [ref=e193]:
              - checkbox "Select Row" [ref=e197] [cursor=pointer]
            - columnheader [ref=e199]
            - columnheader "ID" [ref=e204]:
              - generic [ref=e207]: ID
            - columnheader "Temp ID" [ref=e211]:
              - generic [ref=e214]: Temp ID
            - columnheader "Row No." [ref=e218]:
              - generic [ref=e221]: Row No.
            - columnheader "State" [ref=e225]:
              - generic [ref=e228]: State
            - columnheader "Title" [ref=e232]:
              - generic [ref=e235]: Title
            - columnheader "Tag" [ref=e239]:
              - generic [ref=e242]: Tag
            - columnheader "Archived" [ref=e246]:
              - generic [ref=e249]: Archived
        - rowgroup [ref=e254]:
          - row "Select Row Delete row NT-001 1 clean Welcome note intro ☐ No" [ref=e255]:
            - gridcell "Select Row" [ref=e256]:
              - checkbox "Select Row" [ref=e257] [cursor=pointer]
            - gridcell "Delete row" [ref=e258]:
              - button "Delete row" [ref=e260] [cursor=pointer]: 🗑
            - gridcell "NT-001" [ref=e261]
            - gridcell [ref=e262]
            - gridcell "1" [ref=e263]
            - gridcell "clean" [ref=e264]
            - gridcell "Welcome note" [ref=e265]
            - gridcell "intro" [ref=e266]
            - gridcell "☐ No" [ref=e267]
          - row "Select Row Delete row NT-002 2 clean Shortcut idea idea ☐ No" [ref=e268]:
            - gridcell "Select Row" [ref=e269]:
              - checkbox "Select Row" [ref=e270] [cursor=pointer]
            - gridcell "Delete row" [ref=e271]:
              - button "Delete row" [ref=e273] [cursor=pointer]: 🗑
            - gridcell "NT-002" [ref=e274]
            - gridcell [ref=e275]
            - gridcell "2" [ref=e276]
            - gridcell "clean" [ref=e277]
            - gridcell "Shortcut idea" [ref=e278]
            - gridcell "idea" [ref=e279]
            - gridcell "☐ No" [ref=e280]
          - row "Select Row Delete row NT-003 3 clean Release checklist todo ☑ Yes" [ref=e281]:
            - gridcell "Select Row" [ref=e282]:
              - checkbox "Select Row" [ref=e283] [cursor=pointer]
            - gridcell "Delete row" [ref=e284]:
              - button "Delete row" [ref=e286] [cursor=pointer]: 🗑
            - gridcell "NT-003" [ref=e287]
            - gridcell [ref=e288]
            - gridcell "3" [ref=e289]
            - gridcell "clean" [ref=e290]
            - gridcell "Release checklist" [ref=e291]
            - gridcell "todo" [ref=e292]
            - gridcell "☑ Yes" [ref=e293]
          - row "Select Row Remove new row amb-temp-1 4 new ☐ No" [ref=e294]:
            - gridcell "Select Row" [ref=e295]:
              - checkbox "Select Row" [ref=e296] [cursor=pointer]
            - gridcell "Remove new row" [ref=e297]:
              - button "Remove new row" [ref=e299] [cursor=pointer]: ×
            - gridcell [ref=e300]
            - gridcell "amb-temp-1" [ref=e301]
            - gridcell "4" [ref=e302]
            - gridcell "new" [ref=e303]
            - gridcell [ref=e304]
            - gridcell [ref=e305]
            - gridcell "☐ No" [ref=e306]
  - generic [ref=e307]:
    - generic [ref=e308]:
      - paragraph [ref=e309]: Prossimi passi
      - heading "Roadmap essenziale" [level=2] [ref=e310]
    - list [ref=e311]:
      - listitem [ref=e312]: Raffinare la demo magazzino con fake API più completa, rollback guidato e salvataggio simulato più realistico.
      - listitem [ref=e313]: Preparare una futura versione bilingue completa e una pubblicazione GitHub Pages dedicata alla demo.
      - listitem [ref=e314]: "Definire in seguito build libreria, `files` npm o `.npmignore`, tipi e artifact pubblicabile senza demo."
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