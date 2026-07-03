# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: add-row-focus-diagnostic.e2e.js >> browser addRow focus diagnostic >> Basic CRUD comparison reports focus after Add row without pagination
- Location: tests\e2e\add-row-focus-diagnostic.e2e.js:141:5

# Error details

```
Error: Target cell did not open a real editor.
scenario: Basic CRUD non-paginated deleteColumn
iteration: 1
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