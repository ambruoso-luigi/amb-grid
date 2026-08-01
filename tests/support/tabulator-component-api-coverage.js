export const TABULATOR_COMPONENT_API_VERSION = '6.4.0';

export const TABULATOR_ROW_COMPONENT_API_METHODS = [
    // Core Row Component
    'delete getCell getCells getData getElement getIndex getNextRow getPosition getPrevRow getTable move normalizeHeight reformat scrollTo update watchPosition',
    // Module-provided Row Component functions
    'addTreeChild deselect freeze getGroup getRanges getTreeChildren getTreeParent isFrozen isSelected isTreeExpanded pageTo popup select toggleSelect treeCollapse treeExpand treeToggle unfreeze validate'
].join(' ').split(/\s+/);

export const TABULATOR_CELL_COMPONENT_API_METHODS = [
    // Core Cell Component
    'checkHeight getColumn getData getElement getField getInitialValue getOldValue getRow getTable getType getValue restoreInitialValue restoreOldValue setValue',
    // Module-provided Cell Component functions
    'cancelEdit clearEdited clearValidation edit getRanges isEdited isValid navigateDown navigateLeft navigateNext navigatePrev navigateRight navigateUp popup validate'
].join(' ').split(/\s+/);

export const TABULATOR_COLUMN_COMPONENT_API_METHODS = [
    // Core Column Component
    'delete getCells getDefinition getElement getField getNextColumn getParentColumn getPrevColumn getSubColumns getTable getTitleDownload getWidth hide isVisible move scrollTo setWidth show toggle updateDefinition',
    // Module-provided Column Component functions
    'getHeaderFilterValue getRanges headerFilterFocus popup reloadHeaderFilter setHeaderFilterValue validate'
].join(' ').split(/\s+/);

export const TABULATOR_GROUP_COMPONENT_API_METHODS = [
    'getElement getField getKey getParentGroup getRows getSubGroups getTable hide isVisible popup scrollTo show toggle'
].join(' ').split(/\s+/);

export const TABULATOR_RANGE_COMPONENT_API_METHODS = [
    'clearValues getBottomEdge getBounds getCells getColumns getData getElement getLeftEdge getRightEdge getRows getStructuredCells getTopEdge remove setBounds setEndBound setStartBound'
].join(' ').split(/\s+/);

export const TABULATOR_CALC_COMPONENT_API_METHODS = [
    'getCell getCells getData getElement getTable'
].join(' ').split(/\s+/);

export const TABULATOR_SHEET_COMPONENT_API_METHODS = [
    'active clear getData getDefinition getKey getTitle remove setColumns setData setRows setTitle'
].join(' ').split(/\s+/);

export const COMPONENT_API_SHARED_METHODS = [
    { method: 'delete', components: ['column', 'row'], reason: 'Both row and column components can delete their own contextual object.', ambPolicy: 'AMB routes each deletion through its matching managed controller operation.' },
    { method: 'getCell', components: ['calc', 'row'], reason: 'Rows and calculation rows can both resolve one cell by column.', ambPolicy: 'AMB keeps distinct row and calculation entry points because their lookup contexts differ.' },
    { method: 'getCells', components: ['calc', 'column', 'range', 'row'], reason: 'Several components expose the cells contained by their own context.', ambPolicy: 'AMB uses context-specific flat methods and returns the managed runtime components.' },
    { method: 'getData', components: ['calc', 'cell', 'range', 'row', 'sheet'], reason: 'Data shape and meaning depend on the component that owns the call.', ambPolicy: 'AMB exposes a context-named read method for each data shape.' },
    { method: 'getDefinition', components: ['column', 'sheet'], reason: 'Columns and sheets each expose their own runtime definition.', ambPolicy: 'AMB separates the two definition reads by component context.' },
    { method: 'getElement', components: ['calc', 'cell', 'column', 'group', 'range', 'row'], reason: 'Rendered component types expose their own runtime element.', ambPolicy: 'AMB uses explicit context-named element accessors.' },
    { method: 'getField', components: ['cell', 'column', 'group'], reason: 'Field meaning is contextual to a cell, column, or row group.', ambPolicy: 'AMB preserves the context in each public method name.' },
    { method: 'getKey', components: ['group', 'sheet'], reason: 'Groups and sheets both have contextual key values.', ambPolicy: 'AMB exposes distinct group and sheet key reads.' },
    { method: 'getRanges', components: ['cell', 'column', 'row'], reason: 'Cells, columns, and rows can report ranges that overlap their context.', ambPolicy: 'AMB resolves each context explicitly before reading overlapping ranges.' },
    { method: 'getRows', components: ['group', 'range'], reason: 'Groups and ranges each contain contextual row components.', ambPolicy: 'AMB keeps group and range row reads separate.' },
    { method: 'getTable', components: ['calc', 'cell', 'column', 'group', 'row'], reason: 'Most component types can return their owning internal table engine.', ambPolicy: 'AMB intentionally omits contextual aliases because advanced engine access already exists at grid.table.' },
    { method: 'hide', components: ['column', 'group'], reason: 'Columns and groups both control contextual visibility.', ambPolicy: 'AMB exposes separate column and group visibility methods.' },
    { method: 'isVisible', components: ['column', 'group'], reason: 'Columns and groups both report contextual visibility.', ambPolicy: 'AMB exposes separate column and group visibility reads.' },
    { method: 'move', components: ['column', 'row'], reason: 'Rows and columns can each move relative to a peer component.', ambPolicy: 'AMB applies the appropriate managed row or column movement contract.' },
    { method: 'popup', components: ['cell', 'column', 'group', 'row'], reason: 'Several rendered components can anchor a contextual popup.', ambPolicy: 'AMB exposes one context-named popup method per supported component.' },
    { method: 'remove', components: ['range', 'sheet'], reason: 'Ranges and sheets can both remove their own contextual object.', ambPolicy: 'AMB keeps runtime range removal separate from spreadsheet sheet removal.' },
    { method: 'scrollTo', components: ['column', 'group', 'row'], reason: 'Rows, columns, and groups can scroll their context into view.', ambPolicy: 'AMB exposes explicit context-named scrolling methods.' },
    { method: 'show', components: ['column', 'group'], reason: 'Columns and groups both control contextual visibility.', ambPolicy: 'AMB exposes separate column and group visibility methods.' },
    { method: 'toggle', components: ['column', 'group'], reason: 'Columns and groups both toggle contextual visibility.', ambPolicy: 'AMB exposes separate column and group visibility methods.' },
    { method: 'validate', components: ['cell', 'column', 'row'], reason: 'Native validation can run in cell, column, or row context.', ambPolicy: 'AMB names native contextual validation explicitly so it is not confused with AMB validation reports.' }
];

export const COMPONENT_API_COVERAGE = [
    // Row Component
    { component: 'row', method: 'delete', status: 'narrower-contract', classification: 'overridden', publicMethod: 'deleteRow', controller: 'crud-methods', reason: 'grid.deleteRow(identifier) preserves AMB deletion state and save-payload semantics instead of deleting through a contextual component.' },
    { component: 'row', method: 'getCell', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getRowCell', controller: 'row-methods', reason: 'grid.getRowCell(identifier, column) resolves backend and temporary identifiers before returning the contextual cell.' },
    { component: 'row', method: 'getCells', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getRowCells', controller: 'row-methods', reason: 'grid.getRowCells(identifier) resolves the managed row before returning its cells.' },
    { component: 'row', method: 'getData', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getRowData', controller: 'row-methods', reason: 'grid.getRowData(identifier, transform) is the AMB-aware contextual data read; a getData alias would obscure the row lookup.' },
    { component: 'row', method: 'getElement', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getRowElement', controller: 'row-methods', reason: 'grid.getRowElement(identifier) resolves the managed row before returning its runtime element.' },
    { component: 'row', method: 'getIndex', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getRowIndex', controller: 'row-methods', reason: 'grid.getRowIndex(identifier) resolves AMB identifiers and preserves the distinction between index and position.' },
    { component: 'row', method: 'getNextRow', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getNextRow', controller: 'row-methods' },
    { component: 'row', method: 'getPosition', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getRowPosition', controller: 'row-methods', reason: 'grid.getRowPosition(identifier) retains the row context while resolving AMB identifiers.' },
    { component: 'row', method: 'getPrevRow', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getPrevRow', controller: 'row-methods' },
    { component: 'row', method: 'getTable', status: 'intentionally-excluded', classification: 'not-applicable', reason: 'Contextual engine aliases are redundant because advanced access is already available through grid.table.' },
    { component: 'row', method: 'move', status: 'narrower-contract', classification: 'AMB-aware', publicMethod: 'moveRow', controller: 'row-methods', reason: 'grid.moveRow(...) resolves managed identifiers, rejects grouped and Data Tree moves, and realigns technical numbering.' },
    { component: 'row', method: 'normalizeHeight', status: 'exposed', classification: 'AMB-aware', publicMethod: 'normalizeRowHeight', controller: 'row-methods', reason: 'grid.normalizeRowHeight(identifier) resolves the managed row and makes the layout-only effect explicit.' },
    { component: 'row', method: 'reformat', status: 'exposed', classification: 'AMB-aware', publicMethod: 'reformatRow', controller: 'row-methods', reason: 'grid.reformatRow(identifier) resolves the managed row before delegating runtime formatting.' },
    { component: 'row', method: 'scrollTo', status: 'exposed', classification: 'AMB-aware', publicMethod: 'scrollToRow', controller: 'row-methods', reason: 'grid.scrollToRow(identifier, ...) resolves backend and temporary identifiers before scrolling.' },
    { component: 'row', method: 'update', status: 'narrower-contract', classification: 'overridden', publicMethod: 'updateRow', controller: 'crud-methods', reason: 'grid.updateRow(identifier, patch) protects managed CRUD state, validation, snapshots, and deleted-row semantics.' },
    { component: 'row', method: 'watchPosition', status: 'exposed', classification: 'AMB-aware', publicMethod: 'watchRowPosition', controller: 'row-methods', reason: 'grid.watchRowPosition(identifier, callback) resolves the managed row before registering the position watcher.' },
    { component: 'row', method: 'addTreeChild', status: 'narrower-contract', classification: 'overridden', publicMethod: 'addTreeChild', controller: 'row-methods', reason: 'AMB adds a managed child with temporary identity and CRUD state while validating the parent and relative-row context.' },
    { component: 'row', method: 'deselect', status: 'exposed', classification: 'AMB-aware', publicMethod: 'deselectRow', controller: 'selection-methods', reason: 'grid.deselectRow(identifier) resolves one managed identifier instead of requiring a contextual component.' },
    { component: 'row', method: 'freeze', status: 'exposed', classification: 'AMB-aware', publicMethod: 'freezeRow', controller: 'row-methods', reason: 'grid.freezeRow(identifier) resolves the managed row and limits the operation to runtime positioning.' },
    { component: 'row', method: 'getGroup', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getRowGroup', controller: 'row-methods', reason: 'grid.getRowGroup(identifier) resolves the managed row before reading its current group.' },
    { component: 'row', method: 'getRanges', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getRowRanges', controller: 'row-methods', reason: 'grid.getRowRanges(identifier) resolves one managed row and returns only ranges overlapping that row.' },
    { component: 'row', method: 'getTreeChildren', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getTreeChildren', controller: 'row-methods' },
    { component: 'row', method: 'getTreeParent', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getTreeParent', controller: 'row-methods' },
    { component: 'row', method: 'isFrozen', status: 'exposed', classification: 'AMB-aware', publicMethod: 'isRowFrozen', controller: 'row-methods', reason: 'grid.isRowFrozen(identifier) resolves the managed row before reading runtime frozen state.' },
    { component: 'row', method: 'isSelected', status: 'exposed', classification: 'AMB-aware', publicMethod: 'isRowSelected', controller: 'selection-methods', reason: 'grid.isRowSelected(identifier) reads selection state after managed identifier resolution.' },
    { component: 'row', method: 'isTreeExpanded', status: 'exposed', classification: 'AMB-aware', publicMethod: 'isTreeExpanded', controller: 'row-methods' },
    { component: 'row', method: 'pageTo', status: 'exposed', classification: 'AMB-aware', publicMethod: 'setPageToRow', controller: 'pagination-methods', reason: 'grid.setPageToRow(identifier) resolves the managed row before loading its local page.' },
    { component: 'row', method: 'popup', status: 'exposed', classification: 'AMB-aware', publicMethod: 'showRowPopup', controller: 'popup-methods', reason: 'grid.showRowPopup(identifier, ...) resolves the managed row and makes the popup anchor explicit.' },
    { component: 'row', method: 'select', status: 'exposed', classification: 'AMB-aware', publicMethod: 'selectRow', controller: 'selection-methods', reason: 'grid.selectRow(identifier) resolves one managed identifier before changing runtime selection.' },
    { component: 'row', method: 'toggleSelect', status: 'exposed', classification: 'AMB-aware', publicMethod: 'toggleSelectRow', controller: 'selection-methods', reason: 'grid.toggleSelectRow(identifier) resolves one managed identifier before toggling selection.' },
    { component: 'row', method: 'treeCollapse', status: 'exposed', classification: 'AMB-aware', publicMethod: 'collapseTreeRow', controller: 'row-methods', reason: 'grid.collapseTreeRow(identifier) resolves a managed row and verifies that Data Tree is enabled.' },
    { component: 'row', method: 'treeExpand', status: 'exposed', classification: 'AMB-aware', publicMethod: 'expandTreeRow', controller: 'row-methods', reason: 'grid.expandTreeRow(identifier) resolves a managed row and verifies that Data Tree is enabled.' },
    { component: 'row', method: 'treeToggle', status: 'exposed', classification: 'AMB-aware', publicMethod: 'toggleTreeRow', controller: 'row-methods', reason: 'grid.toggleTreeRow(identifier) resolves a managed row and verifies that Data Tree is enabled.' },
    { component: 'row', method: 'unfreeze', status: 'exposed', classification: 'AMB-aware', publicMethod: 'unfreezeRow', controller: 'row-methods', reason: 'grid.unfreezeRow(identifier) resolves the managed row and limits the operation to runtime positioning.' },
    { component: 'row', method: 'validate', status: 'exposed', classification: 'AMB-aware', publicMethod: 'validateRowCells', controller: 'row-methods', reason: 'grid.validateRowCells(identifier) explicitly returns native contextual validation rather than an AMB validation report.' },

    // Cell Component
    { component: 'cell', method: 'checkHeight', status: 'exposed', classification: 'AMB-aware', publicMethod: 'checkCellHeight', controller: 'cell-methods', reason: 'grid.checkCellHeight(rowIdentifier, column) resolves the managed cell before the layout-only check.' },
    { component: 'cell', method: 'getColumn', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getCellColumn', controller: 'cell-methods', reason: 'grid.getCellColumn(rowIdentifier, column) resolves the managed cell before returning its column.' },
    { component: 'cell', method: 'getData', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getCellData', controller: 'cell-methods', reason: 'grid.getCellData(rowIdentifier, column, transform) makes the cell context explicit and resolves the managed row.' },
    { component: 'cell', method: 'getElement', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getCellElement', controller: 'cell-methods', reason: 'grid.getCellElement(rowIdentifier, column) resolves the managed cell before returning its runtime element.' },
    { component: 'cell', method: 'getField', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getCellField', controller: 'cell-methods', reason: 'grid.getCellField(rowIdentifier, column) resolves the managed cell before reading its field.' },
    { component: 'cell', method: 'getInitialValue', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getCellInitialValue', controller: 'cell-methods', reason: 'grid.getCellInitialValue(...) distinguishes the runtime initial value from AMB snapshots.' },
    { component: 'cell', method: 'getOldValue', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getCellOldValue', controller: 'cell-methods', reason: 'grid.getCellOldValue(...) distinguishes the runtime previous value from AMB snapshots.' },
    { component: 'cell', method: 'getRow', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getCellRow', controller: 'cell-methods', reason: 'grid.getCellRow(rowIdentifier, column) resolves the cell through the managed row lookup.' },
    { component: 'cell', method: 'getTable', status: 'intentionally-excluded', classification: 'not-applicable', reason: 'Contextual engine aliases are redundant because advanced access is already available through grid.table.' },
    { component: 'cell', method: 'getType', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getCellType', controller: 'cell-methods', reason: 'grid.getCellType(rowIdentifier, column) preserves cell context in the flat API.' },
    { component: 'cell', method: 'getValue', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getCellValue', controller: 'cell-methods', reason: 'grid.getCellValue(rowIdentifier, column) resolves backend and temporary row identifiers before reading the value.' },
    { component: 'cell', method: 'restoreInitialValue', status: 'narrower-contract', classification: 'overridden', publicMethod: 'restoreCellInitialValue', controller: 'cell-methods', reason: 'AMB reapplies the runtime initial value through CRUD tracking instead of the component restoration shortcut.' },
    { component: 'cell', method: 'restoreOldValue', status: 'narrower-contract', classification: 'overridden', publicMethod: 'restoreCellOldValue', controller: 'cell-methods', reason: 'AMB reapplies the runtime previous value through CRUD tracking instead of the component restoration shortcut.' },
    { component: 'cell', method: 'setValue', status: 'narrower-contract', classification: 'overridden', publicMethod: 'setCellValue', controller: 'cell-methods', reason: 'grid.setCellValue(...) updates one resolved field through AMB CRUD and deliberately omits the native mutate flag.' },
    { component: 'cell', method: 'cancelEdit', status: 'exposed', classification: 'AMB-aware', publicMethod: 'cancelCellEdit', controller: 'cell-methods', reason: 'grid.cancelCellEdit(rowIdentifier, column) resolves the managed cell before cancelling its active editor.' },
    { component: 'cell', method: 'clearEdited', status: 'exposed', classification: 'AMB-aware', publicMethod: 'clearCellEditedMarker', controller: 'cell-state-methods', reason: 'grid.clearCellEditedMarker(...) targets one resolved cell and does not imply an AMB CRUD rollback.' },
    { component: 'cell', method: 'clearValidation', status: 'exposed', classification: 'AMB-aware', publicMethod: 'clearCellValidationMarker', controller: 'cell-state-methods', reason: 'grid.clearCellValidationMarker(...) targets one native marker without clearing AMB validation errors.' },
    { component: 'cell', method: 'edit', status: 'narrower-contract', classification: 'AMB-aware', publicMethod: 'editCell', controller: 'cell-methods', reason: 'grid.editCell(...) resolves a managed cell and deliberately omits the force flag so normal editability protections remain active.' },
    { component: 'cell', method: 'getRanges', status: 'exposed', classification: 'AMB-aware', publicMethod: 'getCellRanges', controller: 'cell-methods', reason: 'grid.getCellRanges(...) resolves one managed cell and returns only ranges overlapping it.' },
    { component: 'cell', method: 'isEdited', status: 'exposed', classification: 'AMB-aware', publicMethod: 'isCellEdited', controller: 'cell-state-methods', reason: 'grid.isCellEdited(...) reads the native marker on one AMB-resolved cell.' },
    { component: 'cell', method: 'isValid', status: 'exposed', classification: 'AMB-aware', publicMethod: 'isCellValid', controller: 'cell-state-methods', reason: 'grid.isCellValid(...) reads native validation state on one resolved cell without replacing AMB validation.' },
    { component: 'cell', method: 'navigateDown', status: 'exposed', classification: 'AMB-aware', publicMethod: 'navigateCellDown', controller: 'cell-methods', reason: 'grid.navigateCellDown(...) preserves the explicit resolved-cell navigation context.' },
    { component: 'cell', method: 'navigateLeft', status: 'exposed', classification: 'AMB-aware', publicMethod: 'navigateCellLeft', controller: 'cell-methods', reason: 'grid.navigateCellLeft(...) preserves the explicit resolved-cell navigation context.' },
    { component: 'cell', method: 'navigateNext', status: 'exposed', classification: 'AMB-aware', publicMethod: 'navigateCellNext', controller: 'cell-methods', reason: 'grid.navigateCellNext(...) preserves the explicit resolved-cell navigation context.' },
    { component: 'cell', method: 'navigatePrev', status: 'exposed', classification: 'AMB-aware', publicMethod: 'navigateCellPrev', controller: 'cell-methods', reason: 'grid.navigateCellPrev(...) preserves the explicit resolved-cell navigation context.' },
    { component: 'cell', method: 'navigateRight', status: 'exposed', classification: 'AMB-aware', publicMethod: 'navigateCellRight', controller: 'cell-methods', reason: 'grid.navigateCellRight(...) preserves the explicit resolved-cell navigation context.' },
    { component: 'cell', method: 'navigateUp', status: 'exposed', classification: 'AMB-aware', publicMethod: 'navigateCellUp', controller: 'cell-methods', reason: 'grid.navigateCellUp(...) preserves the explicit resolved-cell navigation context.' },
    { component: 'cell', method: 'popup', status: 'exposed', classification: 'AMB-aware', publicMethod: 'showCellPopup', controller: 'popup-methods', reason: 'grid.showCellPopup(...) resolves the managed cell and makes the popup anchor explicit.' },
    { component: 'cell', method: 'validate', status: 'exposed', classification: 'AMB-aware', publicMethod: 'validateCell', controller: 'cell-methods', reason: 'grid.validateCell(...) explicitly returns native contextual validation rather than an AMB validation report.' },

    // Column Component
    { component: 'column', method: 'delete', status: 'narrower-contract', classification: 'overridden', publicMethod: 'deleteColumn', controller: 'column-methods', reason: 'grid.deleteColumn(...) protects managed columns and preserves row data and CRUD tracking.' },
    { component: 'column', method: 'getCells', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getColumnCells', controller: 'column-methods', reason: 'grid.getColumnCells(columnLookup) is the flat contextual equivalent and returns the runtime cells unchanged.' },
    { component: 'column', method: 'getDefinition', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getColumnDefinition', controller: 'column-methods', reason: 'grid.getColumnDefinition(columnLookup) preserves column context in the flat API.' },
    { component: 'column', method: 'getElement', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getColumnElement', controller: 'column-methods', reason: 'grid.getColumnElement(columnLookup) preserves column context in the flat API.' },
    { component: 'column', method: 'getField', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getColumnField', controller: 'column-methods', reason: 'grid.getColumnField(columnLookup) preserves column context in the flat API.' },
    { component: 'column', method: 'getNextColumn', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getNextColumn', controller: 'column-methods' },
    { component: 'column', method: 'getParentColumn', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getColumnParent', controller: 'column-methods', reason: 'grid.getColumnParent(columnLookup) names the contextual relationship explicitly.' },
    { component: 'column', method: 'getPrevColumn', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getPrevColumn', controller: 'column-methods' },
    { component: 'column', method: 'getSubColumns', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getColumnSubColumns', controller: 'column-methods', reason: 'grid.getColumnSubColumns(columnLookup) names the contextual relationship explicitly.' },
    { component: 'column', method: 'getTable', status: 'intentionally-excluded', classification: 'not-applicable', reason: 'Contextual engine aliases are redundant because advanced access is already available through grid.table.' },
    { component: 'column', method: 'getTitleDownload', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getColumnDownloadTitle', controller: 'column-methods', reason: 'grid.getColumnDownloadTitle(columnLookup) exposes the download-title meaning more explicitly.' },
    { component: 'column', method: 'getWidth', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getColumnWidth', controller: 'column-methods', reason: 'grid.getColumnWidth(columnLookup) preserves column context in the flat API.' },
    { component: 'column', method: 'hide', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'hideColumn', controller: 'column-methods', reason: 'grid.hideColumn(columnLookup) is the existing flat equivalent; no contextual alias is needed.' },
    { component: 'column', method: 'isVisible', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'isColumnVisible', controller: 'column-methods', reason: 'grid.isColumnVisible(columnLookup) preserves column context in the flat API.' },
    { component: 'column', method: 'move', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'moveColumn', controller: 'column-methods', reason: 'grid.moveColumn(...) is the existing flat equivalent and accepts the source column lookup explicitly.' },
    { component: 'column', method: 'scrollTo', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'scrollToColumn', controller: 'column-methods', reason: 'grid.scrollToColumn(...) is the existing flat equivalent and accepts the column lookup explicitly.' },
    { component: 'column', method: 'setWidth', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'setColumnWidth', controller: 'column-methods', reason: 'grid.setColumnWidth(columnLookup, width) preserves column context in the flat API.' },
    { component: 'column', method: 'show', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'showColumn', controller: 'column-methods', reason: 'grid.showColumn(columnLookup) is the existing flat equivalent; no contextual alias is needed.' },
    { component: 'column', method: 'toggle', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'toggleColumn', controller: 'column-methods', reason: 'grid.toggleColumn(columnLookup) is the existing flat equivalent; no contextual alias is needed.' },
    { component: 'column', method: 'updateDefinition', status: 'narrower-contract', classification: 'overridden', publicMethod: 'updateColumnDefinition', controller: 'column-methods', reason: 'AMB updates application columns through the managed preparation pipeline, rejects field changes, and protects managed columns.' },
    { component: 'column', method: 'getHeaderFilterValue', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getHeaderFilterValue', controller: 'filter-methods' },
    { component: 'column', method: 'getRanges', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getColumnRanges', controller: 'column-methods', reason: 'grid.getColumnRanges(columnLookup) returns only ranges overlapping the resolved column.' },
    { component: 'column', method: 'headerFilterFocus', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'setHeaderFilterFocus', controller: 'filter-methods', reason: 'grid.setHeaderFilterFocus(columnLookup) describes the focus action in the flat controller vocabulary.' },
    { component: 'column', method: 'popup', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'showColumnPopup', controller: 'popup-methods', reason: 'grid.showColumnPopup(columnLookup, ...) makes the popup anchor explicit.' },
    { component: 'column', method: 'reloadHeaderFilter', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'reloadHeaderFilter', controller: 'filter-methods' },
    { component: 'column', method: 'setHeaderFilterValue', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'setHeaderFilterValue', controller: 'filter-methods' },
    { component: 'column', method: 'validate', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'validateColumnCells', controller: 'column-methods', reason: 'grid.validateColumnCells(columnLookup) explicitly returns native contextual validation rather than an AMB validation report.' },

    // Group Component
    { component: 'group', method: 'getElement', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getGroupElement', controller: 'grouping-methods', reason: 'grid.getGroupElement(group) preserves group context in the flat API.' },
    { component: 'group', method: 'getField', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getGroupField', controller: 'grouping-methods', reason: 'grid.getGroupField(group) preserves group context in the flat API.' },
    { component: 'group', method: 'getKey', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getGroupKey', controller: 'grouping-methods', reason: 'grid.getGroupKey(group) preserves group context in the flat API.' },
    { component: 'group', method: 'getParentGroup', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getGroupParent', controller: 'grouping-methods', reason: 'grid.getGroupParent(group) names the contextual relationship explicitly.' },
    { component: 'group', method: 'getRows', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getGroupRows', controller: 'grouping-methods', reason: 'grid.getGroupRows(group) distinguishes contextual rows from the table-wide row read.' },
    { component: 'group', method: 'getSubGroups', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getGroupSubGroups', controller: 'grouping-methods', reason: 'grid.getGroupSubGroups(group) names the contextual relationship explicitly.' },
    { component: 'group', method: 'getTable', status: 'intentionally-excluded', classification: 'not-applicable', reason: 'Contextual engine aliases are redundant because advanced access is already available through grid.table.' },
    { component: 'group', method: 'hide', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'hideGroup', controller: 'grouping-methods', reason: 'grid.hideGroup(group) is the flat contextual equivalent.' },
    { component: 'group', method: 'isVisible', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'isGroupVisible', controller: 'grouping-methods', reason: 'grid.isGroupVisible(group) preserves group context in the flat API.' },
    { component: 'group', method: 'popup', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'showGroupPopup', controller: 'popup-methods', reason: 'grid.showGroupPopup(group, ...) makes the popup anchor explicit.' },
    { component: 'group', method: 'scrollTo', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'scrollToGroup', controller: 'grouping-methods', reason: 'grid.scrollToGroup(group, ...) is the flat contextual equivalent.' },
    { component: 'group', method: 'show', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'showGroup', controller: 'grouping-methods', reason: 'grid.showGroup(group) is the flat contextual equivalent.' },
    { component: 'group', method: 'toggle', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'toggleGroup', controller: 'grouping-methods', reason: 'grid.toggleGroup(group) is the flat contextual equivalent.' },

    // Range Component
    { component: 'range', method: 'clearValues', status: 'narrower-contract', classification: 'overridden', publicMethod: 'clearRangeValues', controller: 'range-methods', reason: 'AMB clears only application fields through grouped CRUD patches while protecting technical fields and lifecycle state.' },
    { component: 'range', method: 'getBottomEdge', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getRangeBottomEdge', controller: 'range-methods', reason: 'grid.getRangeBottomEdge(range) preserves range context in the flat API.' },
    { component: 'range', method: 'getBounds', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getRangeBounds', controller: 'range-methods', reason: 'grid.getRangeBounds(range) preserves range context in the flat API.' },
    { component: 'range', method: 'getCells', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getRangeCells', controller: 'range-methods', reason: 'grid.getRangeCells(range) distinguishes contextual cells from other cell collections.' },
    { component: 'range', method: 'getColumns', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getRangeColumns', controller: 'range-methods', reason: 'grid.getRangeColumns(range) preserves range context in the flat API.' },
    { component: 'range', method: 'getData', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getRangeData', controller: 'range-methods', reason: 'grid.getRangeData(range) distinguishes one contextual range from the table-wide range data read.' },
    { component: 'range', method: 'getElement', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getRangeElement', controller: 'range-methods', reason: 'grid.getRangeElement(range) preserves range context in the flat API.' },
    { component: 'range', method: 'getLeftEdge', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getRangeLeftEdge', controller: 'range-methods', reason: 'grid.getRangeLeftEdge(range) preserves range context in the flat API.' },
    { component: 'range', method: 'getRightEdge', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getRangeRightEdge', controller: 'range-methods', reason: 'grid.getRangeRightEdge(range) preserves range context in the flat API.' },
    { component: 'range', method: 'getRows', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getRangeRows', controller: 'range-methods', reason: 'grid.getRangeRows(range) distinguishes contextual rows from the table-wide row read.' },
    { component: 'range', method: 'getStructuredCells', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getRangeStructuredCells', controller: 'range-methods', reason: 'grid.getRangeStructuredCells(range) names the structured contextual result explicitly.' },
    { component: 'range', method: 'getTopEdge', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getRangeTopEdge', controller: 'range-methods', reason: 'grid.getRangeTopEdge(range) preserves range context in the flat API.' },
    { component: 'range', method: 'remove', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'removeRange', controller: 'range-methods', reason: 'grid.removeRange(range) makes runtime range removal explicit and does not imply data deletion.' },
    { component: 'range', method: 'setBounds', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'setRangeBounds', controller: 'range-methods', reason: 'grid.setRangeBounds(range, start, end) preserves range context in the flat API.' },
    { component: 'range', method: 'setEndBound', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'setRangeEndBound', controller: 'range-methods', reason: 'grid.setRangeEndBound(range, end) preserves range context in the flat API.' },
    { component: 'range', method: 'setStartBound', status: 'exposed', classification: 'overridden', publicMethod: 'setRangeStartBound', controller: 'range-methods', reason: 'AMB Grid derives the final Cell Component from the public structured cells and uses the supported two-bound operation because the installed 6.4.0 contextual start-bound method targets the end bound while its contextual bounds read returns internal cells that cannot be reused directly by that public operation.' },

    // Calculation Component
    { component: 'calc', method: 'getCell', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getCalcCell', controller: 'calculation-methods', reason: 'grid.getCalcCell(calc, column) distinguishes calculation-row context from normal row context.' },
    { component: 'calc', method: 'getCells', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getCalcCells', controller: 'calculation-methods', reason: 'grid.getCalcCells(calc) distinguishes calculation-row cells from normal row cells.' },
    { component: 'calc', method: 'getData', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getCalcData', controller: 'calculation-methods', reason: 'grid.getCalcData(calc, transform) preserves calculation-row context in the flat API.' },
    { component: 'calc', method: 'getElement', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getCalcElement', controller: 'calculation-methods', reason: 'grid.getCalcElement(calc) preserves calculation-row context in the flat API.' },
    { component: 'calc', method: 'getTable', status: 'intentionally-excluded', classification: 'not-applicable', reason: 'Contextual engine aliases are redundant because advanced access is already available through grid.table.' },

    // Sheet Component
    { component: 'sheet', method: 'active', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'activeSheet', controller: 'spreadsheet-methods', reason: 'grid.activeSheet(sheetLookup) is the existing flat spreadsheet equivalent.' },
    { component: 'sheet', method: 'clear', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'clearSheet', controller: 'spreadsheet-methods', reason: 'grid.clearSheet(sheetLookup) is the existing flat spreadsheet equivalent.' },
    { component: 'sheet', method: 'getData', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getSheetData', controller: 'spreadsheet-methods', reason: 'grid.getSheetData(sheetLookup) distinguishes spreadsheet matrix data from standard row data.' },
    { component: 'sheet', method: 'getDefinition', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getSheetDefinition', controller: 'spreadsheet-methods', reason: 'grid.getSheetDefinition(sheet) preserves sheet context in the flat API.' },
    { component: 'sheet', method: 'getKey', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getSheetKey', controller: 'spreadsheet-methods', reason: 'grid.getSheetKey(sheet) preserves sheet context in the flat API.' },
    { component: 'sheet', method: 'getTitle', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'getSheetTitle', controller: 'spreadsheet-methods', reason: 'grid.getSheetTitle(sheet) preserves sheet context in the flat API.' },
    { component: 'sheet', method: 'remove', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'removeSheet', controller: 'spreadsheet-methods', reason: 'grid.removeSheet(sheetLookup) is the existing flat spreadsheet equivalent.' },
    { component: 'sheet', method: 'setColumns', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'setSheetColumns', controller: 'spreadsheet-methods', reason: 'grid.setSheetColumns(sheet, columns) keeps sheet dimensions distinct from grid column definitions.' },
    { component: 'sheet', method: 'setData', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'setSheetData', controller: 'spreadsheet-methods', reason: 'grid.setSheetData(sheetLookup, data) keeps spreadsheet matrices separate from standard AMB row data.' },
    { component: 'sheet', method: 'setRows', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'setSheetRows', controller: 'spreadsheet-methods', reason: 'grid.setSheetRows(sheet, rows) keeps sheet dimensions distinct from AMB data rows.' },
    { component: 'sheet', method: 'setTitle', status: 'exposed', classification: 'safe-pass-through', publicMethod: 'setSheetTitle', controller: 'spreadsheet-methods', reason: 'grid.setSheetTitle(sheet, title) preserves sheet context in the flat API.' }
];
