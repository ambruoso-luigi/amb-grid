
/**
 * Row lifecycle states tracked by CrudHelper.
 *
 * Error markers are intentionally stored separately from this state.
 */
export const ROW_STATE = {
    CLEAN: 'clean',
    NEW: 'new',
    MODIFIED: 'modified',
    DELETED: 'deleted',
    SAVED: 'saved'
};

const cloneData = (data) => {
    if (typeof structuredClone === 'function') {
        return structuredClone(data);
    }

    return JSON.parse(JSON.stringify(data));
};

export class CrudHelper {
    /**
     * Create a helper that tracks CRUD state and validation markers for a Tabulator table.
     *
     * @param {object} table - Tabulator table instance.
     * @param {object} [options] - Field names used by the helper.
     * @param {string} [options.idField='id'] - Unique row identifier field.
     * @param {string} [options.stateField='_state'] - Field used to store the row state.
     * @param {string} [options.originalDataField='_originalData'] - Field used to store original row data.
     * @param {object} [options.rowNumbering] - Local technical row numbering options.
     * @param {boolean} [options.rowNumbering.enabled=true] - Whether local row numbering is enabled.
     * @param {string} [options.rowNumbering.field='_tehRowNumber'] - Field used to store the local row number.
     * @param {boolean} [options.rowNumbering.assignOnAdd=true] - Whether new rows receive the next local row number.
     */
    constructor(table, options = {}) {
        const { rowNumbering = {}, ...baseOptions } = options;

        this.table = table;
        this.options = {
            idField: 'id',
            stateField: '_state',
            originalDataField: '_originalData',
            ...baseOptions,
            rowNumbering: {
                enabled: true,
                field: '_tehRowNumber',
                assignOnAdd: true,
                ...rowNumbering
            }
        };
        this.originalRows = new Map();
        this.modifiedCells = new Map();
        this.cellErrors = new Map();
        this.cellValidators = new Map();
        this.rowErrors = new Map();
        this.eventHandlers = new Map();

        this._captureInitialSnapshot();
        this._enableTracking();
    }

    _enableTracking() {
        this.table.on('tableBuilt', () => {
            this._captureInitialSnapshot();
        });

        this.table.on('cellEdited', (cell) => {
            const row = cell.getRow();
            const state = this._getBaseRowState(row);

            if (state === ROW_STATE.NEW || state === ROW_STATE.DELETED) {
                this._clearCellState(cell);
                this._validateCell(cell);
                return;
            }

            this._syncCellState(cell);
            this._applyConsistentRowState(row);
            this._validateCell(cell);
        });
    }

    _captureInitialSnapshot() {
        this._assignMissingRowNumbers();

        const rows = this.table.getRows();

        rows.forEach(row => {
            const data = row.getData();
            const id = data[this.options.idField];

            if (id === undefined || this.originalRows.has(id)) return;

            this.originalRows.set(id, this._cleanHelperFields(data));

            if (!data[this.options.stateField]) {
                this._applyRowState(row, ROW_STATE.CLEAN);
            }
        });
    }

    _cleanHelperFields(data) {
        const clonedData = cloneData(data);

        delete clonedData[this.options.stateField];
        delete clonedData[this.options.originalDataField];

        return clonedData;
    }

    _cleanStateReportData(data) {
        const clonedData = this._cleanHelperFields(data);

        if (this._isRowNumberingEnabled()) {
            delete clonedData[this._getRowNumberField()];
        }

        return clonedData;
    }

    _patchRow(row, partialData) {
        if (!row) return;

        return row.update(partialData);
    }

    _emit(eventName, payload) {
        const callbacks = this.eventHandlers.get(eventName);

        if (!callbacks) return;

        Array.from(callbacks).forEach(callback => {
            try {
                callback(payload);
            } catch (error) {
                console.error(`CrudHelper event handler failed for ${eventName}`, error);
            }
        });
    }

    _getRowNumberingOptions() {
        return this.options.rowNumbering;
    }

    _isRowNumberingEnabled() {
        const rowNumbering = this._getRowNumberingOptions();

        return Boolean(rowNumbering && rowNumbering.enabled);
    }

    _getRowNumberField() {
        return this._getRowNumberingOptions().field;
    }

    _getMaxRowNumber() {
        if (!this._isRowNumberingEnabled()) return 0;

        const field = this._getRowNumberField();
        const rowNumbers = this.table.getRows().map(row => {
            return Number(row.getData()[field]);
        });

        return rowNumbers.reduce((max, rowNumber) => {
            return Number.isFinite(rowNumber) && rowNumber > max ? rowNumber : max;
        }, 0);
    }

    _assignMissingRowNumbers() {
        if (!this._isRowNumberingEnabled()) return;

        const field = this._getRowNumberField();
        let nextRowNumber = this._getMaxRowNumber() + 1;

        this.table.getRows().forEach(row => {
            const data = row.getData();

            if (data[field] !== undefined && data[field] !== null) return;

            this._patchRow(row, {
                [field]: nextRowNumber
            });

            nextRowNumber += 1;
        });
    }

    _assignRowNumberOnAdd(rowData) {
        const rowNumbering = this._getRowNumberingOptions();

        if (!this._isRowNumberingEnabled() || !rowNumbering.assignOnAdd) {
            return rowData;
        }

        const field = this._getRowNumberField();

        if (rowData[field] !== undefined && rowData[field] !== null) {
            return rowData;
        }

        return {
            ...rowData,
            [field]: this._getMaxRowNumber() + 1
        };
    }

    _restoreRowData(row, originalData) {
        const currentData = row.getData();
        const restoredData = cloneData(originalData);
        const resetData = {};

        Object.keys(currentData).forEach(field => {
            if (!(field in restoredData) && field !== this.options.stateField) {
                resetData[field] = undefined;
            }
        });

        this._patchRow(row, {
            ...resetData,
            ...restoredData,
            [this.options.stateField]: ROW_STATE.CLEAN
        });
    }

    _getRowId(row) {
        return row.getData()[this.options.idField];
    }

    _getBaseRowState(row) {
        const data = row.getData();
        return data[this.options.stateField] || ROW_STATE.CLEAN;
    }

    _getCleanRowState(row) {
        const baseState = this._getBaseRowState(row);

        if (baseState === ROW_STATE.NEW || baseState === ROW_STATE.DELETED) {
            return baseState;
        }

        return this._hasModifiedCells(row) ? ROW_STATE.MODIFIED : ROW_STATE.CLEAN;
    }

    _applyConsistentRowState(row) {
        if (!row) return;

        const nextState = this._getCleanRowState(row);

        this._applyRowState(row, nextState);
    }

    _getOriginalDataForRow(row) {
        const data = row.getData();
        const id = data[this.options.idField];

        return this.originalRows.get(id) || data[this.options.originalDataField] || null;
    }

    _valuesAreEqual(currentValue, originalValue) {
        return Object.is(currentValue, originalValue);
    }

    _getChangedFields(before, after) {
        const fields = new Set([
            ...Object.keys(before),
            ...Object.keys(after)
        ]);

        return Array.from(fields).filter(field => {
            return !this._valuesAreEqual(before[field], after[field]);
        });
    }

    _markCellModified(cell) {
        if (!cell) return;

        const row = cell.getRow();
        const id = this._getRowId(row);
        const field = cell.getField();
        const cellElement = cell.getElement();

        if (!this.modifiedCells.has(id)) {
            this.modifiedCells.set(id, new Set());
        }

        this.modifiedCells.get(id).add(field);

        if (cellElement) {
            cellElement.dataset.cellState = ROW_STATE.MODIFIED;
        }
    }

    _getCell(row, field) {
        const cell = row.getCell(field);

        return cell || null;
    }

    _clearCellState(cell) {
        if (!cell) return;

        const row = cell.getRow();
        const id = this._getRowId(row);
        const field = cell.getField();
        const cellElement = cell.getElement();
        const fields = this.modifiedCells.get(id);

        if (fields) {
            fields.delete(field);

            if (fields.size === 0) {
                this.modifiedCells.delete(id);
            }
        }

        if (cellElement) {
            delete cellElement.dataset.cellState;
        }
    }

    _clearRowCellStates(row) {
        if (!row) return;

        const id = this._getRowId(row);

        row.getCells().forEach(cell => {
            const cellElement = cell.getElement();

            if (cellElement) {
                delete cellElement.dataset.cellState;
            }
        });

        this.modifiedCells.delete(id);
    }

    _hasModifiedCells(row) {
        if (!row) return false;

        const fields = this.modifiedCells.get(this._getRowId(row));

        return Boolean(fields && fields.size > 0);
    }

    _syncCellState(cell) {
        if (!cell) return;

        const row = cell.getRow();
        const state = this._getBaseRowState(row);

        if (state === ROW_STATE.NEW || state === ROW_STATE.DELETED) {
            this._clearCellState(cell);
            return;
        }

        const originalData = this._getOriginalDataForRow(row);
        const field = cell.getField();

        if (!originalData || !(field in originalData)) {
            this._clearCellState(cell);
            return;
        }

        if (this._valuesAreEqual(cell.getValue(), originalData[field])) {
            this._clearCellState(cell);
            return;
        }

        this._markCellModified(cell);
    }

    _syncRowCellStates(row) {
        if (!row) return;

        row.getCells().forEach(cell => {
            this._syncCellState(cell);
        });
    }

    /**
     * Return or create the internal field -> message Map for one row.
     *
     * @private
     * @param {*} id - Row identifier.
     * @returns {Map<string, string>} Cell error messages grouped by field.
     */
    _getCellErrorMap(id) {
        if (!this.cellErrors.has(id)) {
            this.cellErrors.set(id, new Map());
        }

        return this.cellErrors.get(id);
    }

    _hasRowError(id) {
        return this.rowErrors.has(id);
    }

    _hasCellErrors(id) {
        const errors = this.cellErrors.get(id);

        return Boolean(errors && errors.size > 0);
    }

    _validateCell(cell) {
        if (!cell) return;

        const field = cell.getField();
        const validators = this.cellValidators.get(field);

        if (!validators || validators.length === 0) return;

        const row = cell.getRow();
        const rowData = row.getData();
        const id = rowData[this.options.idField];
        const value = cell.getValue();
        const failedValidator = validators.find(validator => {
            return !validator.validateFn(value, rowData, cell, this);
        });

        if (!failedValidator) {
            this.clearCellError(id, field);
            return;
        }

        this.markCellError(id, field, failedValidator.message);
    }

    _syncRowErrorAttribute(row) {
        if (!row) return;

        const id = this._getRowId(row);
        const rowElement = row.getElement();

        if (!rowElement) return;

        if (this._hasRowError(id) || this._hasCellErrors(id)) {
            rowElement.dataset.rowError = 'true';
            return;
        }

        delete rowElement.dataset.rowError;
    }

    /**
     * Check whether any row-level or cell-level errors are currently tracked.
     *
     * @returns {boolean} True when at least one error is tracked.
     */
    hasErrors() {
        return this.rowErrors.size > 0 || this.getCellErrors().length > 0;
    }

    /**
     * Register an automatic validator for a field.
     *
     * @param {string} field - Cell field name to validate.
     * @param {string} message - Error message used when validation fails.
     * @param {Function} validateFn - Function receiving (value, rowData, cell, helper); returns true when valid.
     */
    addCellValidator(field, message, validateFn) {
        if (!this.cellValidators.has(field)) {
            this.cellValidators.set(field, []);
        }

        this.cellValidators.get(field).push({
            message,
            validateFn
        });
    }

    /**
     * Remove the automatic validator registered for a field.
     *
     * @param {string} field - Cell field name.
     */
    removeCellValidator(field) {
        this.cellValidators.delete(field);
    }

    /**
     * Register a callback for a CrudHelper event.
     *
     * @param {string} eventName - Event name to subscribe to.
     * @param {Function} callback - Callback invoked with the event payload.
     * @returns {Function} Function that removes the subscription.
     */
    on(eventName, callback) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, new Set());
        }

        this.eventHandlers.get(eventName).add(callback);

        return () => {
            this.off(eventName, callback);
        };
    }

    /**
     * Remove a callback from a CrudHelper event.
     *
     * @param {string} eventName - Event name to unsubscribe from.
     * @param {Function} callback - Previously registered callback.
     */
    off(eventName, callback) {
        const callbacks = this.eventHandlers.get(eventName);

        if (!callbacks) return;

        callbacks.delete(callback);

        if (callbacks.size === 0) {
            this.eventHandlers.delete(eventName);
        }
    }

    /**
     * Return all currently tracked row-level and cell-level errors.
     *
     * @returns {{hasErrors: boolean, rows: object[], cells: object[]}} Grouped error summary.
     */
    getErrors() {
        const rows = this.getRowErrors();
        const cells = this.getCellErrors();

        return {
            hasErrors: rows.length > 0 || cells.length > 0,
            rows,
            cells
        };
    }

    /**
     * Return all currently tracked row-level errors.
     *
     * @returns {{id: *, message: string}[]} Row-level errors.
     */
    getRowErrors() {
        return Array.from(this.rowErrors, ([id, message]) => {
            return { id, message };
        });
    }

    /**
     * Return all currently tracked cell-level errors.
     *
     * @returns {{id: *, field: string, message: string}[]} Cell-level errors.
     */
    getCellErrors() {
        const errors = [];

        this.cellErrors.forEach((fields, id) => {
            fields.forEach((message, field) => {
                errors.push({ id, field, message });
            });
        });

        return errors;
    }

    /**
     * Mark a cell as invalid without changing the row state.
     *
     * @param {*} id - Row identifier.
     * @param {string} field - Cell field name.
     * @param {string} message - Error message shown as the cell title.
     * @returns {boolean} True when the cell error was applied.
     */
    markCellError(id, field, message) {
        const row = this.findRowById(id);

        if (!row) {
            console.warn(`Row with ${this.options.idField} ${id} not found`);
            return false;
        }

        const cell = this._getCell(row, field);

        if (!cell) {
            console.warn(`Cell with field ${field} not found`);
            return false;
        }

        if (this._getBaseRowState(row) === ROW_STATE.DELETED) {
            console.warn(`Cannot mark deleted row with ${this.options.idField} ${id} as error`);
            return false;
        }

        this._getCellErrorMap(id).set(field, message);

        const cellElement = cell.getElement();

        if (cellElement) {
            cellElement.dataset.cellError = 'true';
            cellElement.title = message;
        }

        this._syncRowErrorAttribute(row);
        this._emit('cell-error', { row, cell, id, field, message });
        return true;
    }

    /**
     * Clear the error marker from a single cell without changing the row state.
     *
     * @param {*} id - Row identifier.
     * @param {string} field - Cell field name.
     * @returns {boolean} True when the row was found and the marker was cleared.
     */
    clearCellError(id, field) {
        const row = this.findRowById(id);

        if (!row) {
            console.warn(`Row with ${this.options.idField} ${id} not found`);
            return false;
        }

        const errors = this.cellErrors.get(id);

        const hadError = Boolean(errors && errors.has(field));

        if (errors) {
            errors.delete(field);

            if (errors.size === 0) {
                this.cellErrors.delete(id);
            }
        }

        const cell = this._getCell(row, field);
        const cellElement = cell && cell.getElement();

        if (cellElement) {
            delete cellElement.dataset.cellError;
            cellElement.removeAttribute('title');
        }

        this._syncRowErrorAttribute(row);

        if (hadError) {
            this._emit('cell-error-cleared', { row, cell, id, field });
        }

        return true;
    }

    /**
     * Clear all cell-level errors from a row without changing the row state.
     *
     * @param {*} id - Row identifier.
     * @returns {boolean} True when the row was found and its cell errors were cleared.
     */
    clearRowErrors(id) {
        const row = this.findRowById(id);

        if (!row) {
            console.warn(`Row with ${this.options.idField} ${id} not found`);
            return false;
        }

        const errors = this.cellErrors.get(id);

        if (errors) {
            Array.from(errors).forEach(([field, message]) => {
                const cell = this._getCell(row, field);
                const cellElement = cell && cell.getElement();

                if (cellElement) {
                    delete cellElement.dataset.cellError;
                    cellElement.removeAttribute('title');
                }

                this._emit('cell-error-cleared', { row, cell, id, field, message });
            });
        }

        this.cellErrors.delete(id);
        this._syncRowErrorAttribute(row);
        return true;
    }

    /**
     * Mark a row as invalid without changing its row state.
     *
     * @param {*} id - Row identifier.
     * @param {string} message - Error message shown as the row title.
     * @returns {boolean} True when the row error was applied.
     */
    markRowError(id, message) {
        const row = this.findRowById(id);

        if (!row) {
            console.warn(`Row with ${this.options.idField} ${id} not found`);
            return false;
        }

        if (this._getBaseRowState(row) === ROW_STATE.DELETED) {
            console.warn(`Cannot mark deleted row with ${this.options.idField} ${id} as error`);
            return false;
        }

        this.rowErrors.set(id, message);

        const rowElement = row.getElement();

        if (rowElement) {
            rowElement.dataset.rowError = 'true';
            rowElement.title = message;
        }

        this._emit('row-error', { row, id, message });
        return true;
    }

    /**
     * Clear the row-level error marker without changing the row state.
     *
     * @param {*} id - Row identifier.
     * @returns {boolean} True when the row was found and the marker was cleared.
     */
    clearRowError(id) {
        const row = this.findRowById(id);

        if (!row) {
            console.warn(`Row with ${this.options.idField} ${id} not found`);
            return false;
        }

        const hadError = this.rowErrors.has(id);

        this.rowErrors.delete(id);

        const rowElement = row.getElement();

        if (rowElement) {
            rowElement.removeAttribute('title');
        }

        this._syncRowErrorAttribute(row);

        if (hadError) {
            this._emit('row-error-cleared', { row, id });
        }

        return true;
    }

    /**
     * Clear row-level and cell-level error markers from a row.
     *
     * @param {*} id - Row identifier.
     * @returns {boolean} True when the row was found and all error markers were cleared.
     */
    clearAllErrors(id) {
        const clearedCellErrors = this.clearRowErrors(id);
        const clearedRowError = this.clearRowError(id);

        return clearedCellErrors && clearedRowError;
    }

    /**
     * Add a new row and mark it as inserted.
     *
     * @param {object} data - Row data to insert.
     * @returns {object|Promise<object>} Tabulator row component, or a promise resolving to one.
     */
    addRow(data) {
        const rowData = this._assignRowNumberOnAdd({
            ...data,
            [this.options.stateField]: ROW_STATE.NEW
        });

        const result = this.table.addRow(rowData);

        if (result && typeof result.then === 'function') {
            return result.then(row => {
                this._applyRowState(row, ROW_STATE.NEW);
                return row;
            });
        }

        this._applyRowState(result, ROW_STATE.NEW);
        return result;
    }

    /**
     * Find a row by the configured identifier field.
     *
     * @param {*} id - Row identifier.
     * @returns {object|null} Tabulator row component, or null when no row matches.
     */
    findRowById(id) {
        const idField = this.options.idField;
        const rows = this.table.getRows();

        return rows.find(row => {
            const data = row.getData();
            return data[idField] === id;
        }) || null;
    }

    /**
     * Update a row and refresh its modification state.
     *
     * @param {*} id - Row identifier.
     * @param {object} data - Partial row data to apply.
     * @returns {object|null} Updated Tabulator row component, or null when no row matches.
     */
    updateRow(id, data) {
        const row = this.findRowById(id);

        if (!row) {
            console.warn(`Row with ${this.options.idField} ${id} not found`);
            return null;
        }

        this._patchRow(row, data);
        this._markRowModified(row);

        return row;
    }

    /**
     * Mark an existing row as deleted, or remove it when it has not been saved yet.
     *
     * @param {*} id - Row identifier.
     * @returns {boolean} True when the row was found and deleted or marked for deletion.
     */
    deleteRow(id) {
        const row = this.findRowById(id);

        if (!row) {
            console.warn(`Row with ${this.options.idField} ${id} not found`);
            return false;
        }

        if (this._getBaseRowState(row) === ROW_STATE.NEW) {
            this._clearRowCellStates(row);
            this.clearAllErrors(id);
            row.delete();
            return true;
        }

        this._clearRowCellStates(row);
        this.clearAllErrors(id);
        this._applyRowState(row, ROW_STATE.DELETED);
        return true;
    }

    /**
     * Restore a row to its original data and clear local tracking markers.
     *
     * @param {*} id - Row identifier.
     * @returns {boolean} True when the rollback completed.
     */
    rollbackRow(id) {
        const row = this.findRowById(id);

        if (!row) {
            console.warn(`Row with ${this.options.idField} ${id} not found`);
            return false;
        }

        const data = row.getData();
        const state = this._getBaseRowState(row);

        if (state === ROW_STATE.NEW) {
            this._clearRowCellStates(row);
            this.clearAllErrors(id);
            row.delete();
            return true;
        }

        if (state === ROW_STATE.CLEAN) {
            this._clearRowCellStates(row);
            this.clearAllErrors(id);
            this._applyRowState(row, ROW_STATE.CLEAN);
            return true;
        }

        if (state === ROW_STATE.MODIFIED || state === ROW_STATE.DELETED) {
            const originalData = this.originalRows.get(id) || data[this.options.originalDataField];

            if (!originalData) {
                console.warn(`Original data for row with ${this.options.idField} ${id} not found`);
                return false;
            }

            this._restoreRowData(row, originalData);
            this._clearRowCellStates(row);
            this.clearAllErrors(id);
            this._applyRowState(row, ROW_STATE.CLEAN);
            return true;
        }

        return true;
    }

    /**
     * Mark a pending row as saved after a successful backend confirmation.
     *
     * @param {*} id - Row identifier.
     * @returns {boolean} True when the row was found and the saved marker was applied or no-op was valid.
     */
    markRowSaved(id) {
        const row = this.findRowById(id);

        if (!row) {
            console.warn(`Row with ${this.options.idField} ${id} not found`);
            return false;
        }

        const data = row.getData();
        const state = this._getBaseRowState(row);

        if (state === ROW_STATE.NEW || state === ROW_STATE.MODIFIED) {
            this.originalRows.set(id, this._cleanHelperFields(data));
            this._clearRowCellStates(row);
            this._applyRowState(row, ROW_STATE.SAVED);
            this._emit('row-saved', { row, id, state: ROW_STATE.SAVED });
            return true;
        }

        if (state === ROW_STATE.DELETED) {
            this._clearRowCellStates(row);
            this.clearAllErrors(id);
            this.originalRows.delete(id);
            this._emit('row-saved', { row, id, state });
            row.delete();
            return true;
        }

        return true;
    }

    /**
     * Mark multiple pending rows as saved after a successful backend confirmation.
     *
     * @param {*[]} ids - Row identifiers to mark as saved.
     * @returns {boolean} True only when every row was marked successfully.
     */
    markRowsSaved(ids) {
        return ids.every(id => {
            return this.markRowSaved(id);
        });
    }

    /**
     * Mark all valid changed rows from the current state report as saved.
     *
     * @returns {boolean} True only when every valid changed row was marked successfully.
     */
    markValidChangesSaved() {
        const report = this.getStateReport();

        return report.validChangedRows.every(row => {
            return this.markRowSaved(row.id);
        });
    }

    /**
     * Search rows by a field value using Tabulator's equality search.
     *
     * @param {string} field - Field name to search.
     * @param {*} value - Value to match.
     * @returns {object[]} Matching Tabulator row components.
     */
    searchByField(field, value) {
        return this.table.searchRows(field, '=', value);
    }

    /**
     * Return pending inserts, updates, and deletions based only on row state.
     *
     * @returns {{inserted: object[], updated: object[], deleted: object[]}} Grouped change set.
     */
    getChanges() {
        const changes = {
            inserted: [],
            updated: [],
            deleted: []
        };

        this.table.getRows().forEach(row => {
            const data = row.getData();
            const id = data[this.options.idField];
            const state = data[this.options.stateField] || ROW_STATE.CLEAN;

            if (state === ROW_STATE.NEW) {
                changes.inserted.push({
                    ...this._cleanHelperFields(data),
                    tempRowNumber: data[this._getRowNumberField()]
                });
                return;
            }

            if (state === ROW_STATE.MODIFIED) {
                const before = this._getOriginalDataForRow(row);

                if (!before) return;

                const cleanBefore = this._cleanHelperFields(before);
                const after = this._cleanHelperFields(data);

                changes.updated.push({
                    id,
                    before: cleanBefore,
                    after,
                    changedFields: this._getChangedFields(cleanBefore, after)
                });
                return;
            }

            if (state === ROW_STATE.DELETED) {
                const originalData = this._getOriginalDataForRow(row);

                changes.deleted.push({
                    id,
                    originalData: originalData ? this._cleanHelperFields(originalData) : null
                });
            }
        });

        return changes;
    }

    /**
     * Return a complete read-only snapshot of row state, errors, and save-ready changes.
     *
     * @returns {{
     *   hasChanges: boolean,
     *   hasErrors: boolean,
     *   totalRows: number,
     *   changedRowsCount: number,
     *   errorRowsCount: number,
     *   validChangedRowsCount: number,
     *   invalidChangedRowsCount: number,
     *   rows: object[],
     *   changedRows: object[],
     *   validChangedRows: object[],
     *   invalidChangedRows: object[],
     *   changes: {inserted: object[], updated: object[], deleted: object[]},
     *   validChanges: {inserted: object[], updated: object[], deleted: object[]},
     *   errors: {hasErrors: boolean, rows: object[], cells: object[]}
     * }} Full table state report.
     */
    getStateReport() {
        const rows = this.table.getRows().map(row => {
            const data = row.getData();
            const id = data[this.options.idField];
            const state = data[this.options.stateField] || ROW_STATE.CLEAN;
            const hasRowError = this.rowErrors.has(id);
            const rowError = hasRowError ? this.rowErrors.get(id) : null;
            const cellErrorMap = this.cellErrors.get(id);
            const cellErrors = cellErrorMap
                ? Array.from(cellErrorMap, ([field, message]) => {
                    return { field, message };
                })
                : [];
            const hasChanges = state === ROW_STATE.NEW
                || state === ROW_STATE.MODIFIED
                || state === ROW_STATE.DELETED;
            const hasErrors = hasRowError || cellErrors.length > 0;
            const beforeData = this._getOriginalDataForRow(row);
            const before = beforeData ? this._cleanStateReportData(beforeData) : null;
            const after = this._cleanStateReportData(data);
            const changedFields = before ? this._getChangedFields(before, after) : [];

            return {
                id,
                rowNumber: this._isRowNumberingEnabled() ? data[this._getRowNumberField()] : null,
                state,
                hasChanges,
                hasErrors,
                isValid: !hasErrors,
                isSaveCandidate: hasChanges && !hasErrors,
                rowError,
                cellErrors,
                changedFields,
                before,
                after
            };
        });

        const changedRows = rows.filter(row => row.hasChanges);
        const validChangedRows = changedRows.filter(row => !row.hasErrors);
        const invalidChangedRows = changedRows.filter(row => row.hasErrors);
        const errorRows = rows.filter(row => row.hasErrors);
        const validChanges = {
            inserted: [],
            updated: [],
            deleted: []
        };

        validChangedRows.forEach(row => {
            if (row.state === ROW_STATE.NEW) {
                validChanges.inserted.push(row.after);
                return;
            }

            if (row.state === ROW_STATE.MODIFIED) {
                if (!row.before) return;

                validChanges.updated.push({
                    id: row.id,
                    before: row.before,
                    after: row.after,
                    changedFields: row.changedFields
                });
                return;
            }

            if (row.state === ROW_STATE.DELETED) {
                validChanges.deleted.push({
                    id: row.id,
                    originalData: row.before
                });
            }
        });

        return {
            hasChanges: changedRows.length > 0,
            hasErrors: errorRows.length > 0,
            totalRows: rows.length,
            changedRowsCount: changedRows.length,
            errorRowsCount: errorRows.length,
            validChangedRowsCount: validChangedRows.length,
            invalidChangedRowsCount: invalidChangedRows.length,
            rows,
            changedRows,
            validChangedRows,
            invalidChangedRows,
            changes: this.getChanges(),
            validChanges,
            errors: this.getErrors()
        };
    }

    _markRowModified(row) {
        if (!row) return;

        const data = row.getData();
        const stateField = this.options.stateField;
        const originalDataField = this.options.originalDataField;

        const baseState = this._getBaseRowState(row);

        if (baseState === ROW_STATE.NEW) {
            this._clearRowCellStates(row);
            this._applyConsistentRowState(row);
            return;
        }

        if (baseState === ROW_STATE.DELETED) {
            this._clearRowCellStates(row);
            this._applyConsistentRowState(row);
            return;
        }

        const id = data[this.options.idField];

        if (!this.originalRows.has(id) && !data[originalDataField]) {
            this._patchRow(row, {
                [originalDataField]: this._cleanHelperFields(data)
            });
        }

        this._syncRowCellStates(row);
        this._applyConsistentRowState(row);
    }

    _applyRowState(row, state) {
        if (!row) return;

        const stateField = this.options.stateField;
        const rowElement = row.getElement();
        const previousState = this._getBaseRowState(row);

        this._patchRow(row, {
            [stateField]: state
        });

        if (rowElement) {
            rowElement.dataset.state = state;
        }

        if (previousState !== state) {
            this._emit('row-state-changed', {
                row,
                id: this._getRowId(row),
                previousState,
                nextState: state
            });
        }
    }
}
