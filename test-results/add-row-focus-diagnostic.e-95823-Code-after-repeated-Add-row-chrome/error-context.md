# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: add-row-focus-diagnostic.e2e.js >> browser addRow focus diagnostic >> Gestionale Magazzino Classico keeps focus out of remove-new and inside itemCode after repeated Add row
- Location: tests\e2e\add-row-focus-diagnostic.e2e.js:121:5

# Error details

```
Error: Target cell did not open a real editor.
scenario: Gestionale Magazzino Classico paginated deleteColumn
iteration: 1
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
  1   | import { expect, test } from '@playwright/test';
  2   | 
  3   | const formatReport = report => {
  4   |     return [
  5   |         `scenario: ${report.scenario}`,
  6   |         `iteration: ${report.iteration}`,
  7   |         `activeElement.tagName: ${report.activeElement.tagName}`,
  8   |         `activeElement.className: ${report.activeElement.className}`,
  9   |         `activeElement.ariaLabel: ${report.activeElement.ariaLabel}`,
  10  |         `actionButtonFocused: ${report.actionButtonFocused}`,
  11  |         `activeInsideTabulatorCell: ${report.activeInsideTabulatorCell}`,
  12  |         `activeCellField: ${report.activeCellField}`,
  13  |         `newRowsVisible: ${report.newRowsVisible}`,
  14  |         `currentPage: ${report.currentPage}`,
  15  |         `pageSize: ${report.pageSize}`,
  16  |         `newRowExists: ${report.newRowExists}`,
  17  |         `targetCellField: ${report.targetField}`,
  18  |         `targetCellExists: ${report.targetCellExists}`,
  19  |         `targetCellEditing: ${report.targetCellEditing}`,
  20  |         `targetEditorExists: ${report.targetEditorExists}`,
  21  |         `targetEditorFocused: ${report.targetEditorFocused}`,
  22  |         `targetCellContainsActiveElement: ${report.targetCellContainsActiveElement}`
  23  |     ].join('\n');
  24  | };
  25  | 
  26  | const collectFocusReport = async (page, {
  27  |     scenario,
  28  |     iteration,
  29  |     tableSelector,
  30  |     targetField
  31  | }) => {
  32  |     return page.evaluate(({ scenario, iteration, tableSelector, targetField }) => {
  33  |         const tableRoot = document.querySelector(tableSelector);
  34  |         const activeElement = document.activeElement;
  35  |         const actionButton = activeElement && typeof activeElement.closest === 'function'
  36  |             ? activeElement.closest('.amb-row-action-button')
  37  |             : null;
  38  |         const activeCell = activeElement && typeof activeElement.closest === 'function'
  39  |             ? activeElement.closest('.tabulator-cell')
  40  |             : null;
  41  |         const visibleNewRows = tableRoot
  42  |             ? Array.from(tableRoot.querySelectorAll('.tabulator-row[data-state="new"]'))
  43  |                 .filter(row => row.offsetParent !== null)
  44  |             : [];
  45  |         const newRow = visibleNewRows[visibleNewRows.length - 1] || null;
  46  |         const targetCell = newRow
  47  |             ? newRow.querySelector(`.tabulator-cell[tabulator-field="${targetField}"]`)
  48  |             : null;
  49  |         const targetEditor = targetCell
  50  |             ? targetCell.querySelector('input, textarea, select, [contenteditable="true"]')
  51  |             : null;
  52  |         const activePage = tableRoot
  53  |             ? tableRoot.querySelector('.tabulator-page.active')
  54  |             : null;
  55  |         const pageSizeSelect = tableRoot
  56  |             ? tableRoot.querySelector('.tabulator-page-size')
  57  |             : null;
  58  | 
  59  |         return {
  60  |             scenario,
  61  |             iteration,
  62  |             activeElement: {
  63  |                 tagName: activeElement ? activeElement.tagName : null,
  64  |                 className: activeElement ? String(activeElement.className || '') : null,
  65  |                 ariaLabel: activeElement ? activeElement.getAttribute('aria-label') : null
  66  |             },
  67  |             actionButtonFocused: Boolean(actionButton),
  68  |             activeInsideTabulatorCell: Boolean(activeCell),
  69  |             activeCellField: activeCell ? activeCell.getAttribute('tabulator-field') : null,
  70  |             newRowsVisible: visibleNewRows.length,
  71  |             currentPage: activePage ? activePage.textContent.trim() : null,
  72  |             pageSize: pageSizeSelect ? pageSizeSelect.value : null,
  73  |             newRowExists: Boolean(newRow),
  74  |             targetField,
  75  |             targetCellExists: Boolean(targetCell),
  76  |             targetCellEditing: Boolean(
  77  |                 targetCell && targetCell.classList.contains('tabulator-editing')
  78  |             ),
  79  |             targetEditorExists: Boolean(targetEditor),
  80  |             targetEditorFocused: Boolean(targetEditor && targetEditor === activeElement),
  81  |             targetCellContainsActiveElement: Boolean(
  82  |                 targetCell && activeElement && targetCell.contains(activeElement)
  83  |             )
  84  |         };
  85  |     }, { scenario, iteration, tableSelector, targetField });
  86  | };
  87  | 
  88  | const assertFocusReport = report => {
  89  |     const message = formatReport(report);
  90  | 
  91  |     expect(report.actionButtonFocused, `Focus is on the action/remove button.\n${message}`)
  92  |         .toBe(false);
  93  |     expect(report.targetCellExists, `Target cell is missing.\n${message}`)
  94  |         .toBe(true);
  95  |     expect(report.targetEditorExists, `Target cell did not open a real editor.\n${message}`)
> 96  |         .toBe(true);
      |          ^ Error: Target cell did not open a real editor.
  97  |     expect(
  98  |         report.targetEditorFocused || report.targetCellContainsActiveElement,
  99  |         `Active element is not inside the target field editor/cell.\n${message}`
  100 |     ).toBe(true);
  101 | };
  102 | 
  103 | const openInventoryDemo = async page => {
  104 |     await page.goto('/src/demo/index.html#getting-started-javascript');
  105 |     await expect(page.locator('#inventory-table.tabulator')).toBeVisible();
  106 | 
  107 |     const pageSize = page.locator('#inventory-table .tabulator-page-size');
  108 | 
  109 |     if (await pageSize.count()) {
  110 |         await pageSize.selectOption('10');
  111 |         await expect(pageSize).toHaveValue('10');
  112 |     }
  113 | };
  114 | 
  115 | const openBasicCrudDemo = async page => {
  116 |     await page.goto('/src/demo/index.html#feature-examples');
  117 |     await expect(page.locator('#basic-table.tabulator')).toBeVisible();
  118 | };
  119 | 
  120 | test.describe('browser addRow focus diagnostic', () => {
  121 |     test('Gestionale Magazzino Classico keeps focus out of remove-new and inside itemCode after repeated Add row', async ({ page }) => {
  122 |         await openInventoryDemo(page);
  123 | 
  124 |         const addButton = page.locator('#javascript-demo .amb-toolbar__button--add');
  125 | 
  126 |         for (let iteration = 1; iteration <= 3; iteration += 1) {
  127 |             await addButton.click();
  128 | 
  129 |             const report = await collectFocusReport(page, {
  130 |                 scenario: 'Gestionale Magazzino Classico paginated deleteColumn',
  131 |                 iteration,
  132 |                 tableSelector: '#inventory-table',
  133 |                 targetField: 'itemCode'
  134 |             });
  135 | 
  136 |             console.info(formatReport(report));
  137 |             assertFocusReport(report);
  138 |         }
  139 |     });
  140 | 
  141 |     test('Basic CRUD comparison reports focus after Add row without pagination', async ({ page }) => {
  142 |         await openBasicCrudDemo(page);
  143 | 
  144 |         await page.locator('#feature-example .amb-toolbar__button--add').click();
  145 | 
  146 |         const report = await collectFocusReport(page, {
  147 |             scenario: 'Basic CRUD non-paginated deleteColumn',
  148 |             iteration: 1,
  149 |             tableSelector: '#basic-table',
  150 |             targetField: 'title'
  151 |         });
  152 | 
  153 |         console.info(formatReport(report));
  154 |         assertFocusReport(report);
  155 |     });
  156 | });
  157 | 
```