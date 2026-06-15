
import { LOOKUP_METADATA_FIELD, rollbackLookupMetadata } from './lookup-metadata.js';

/**
 * Row lifecycle states tracked by CrudHelper.
 *
 * `clean` rows match the captured snapshot, `new` rows exist only on the
 * client, `modified` rows have edited fields, `deleted` rows are existing rows
 * marked for deletion, and `saved` rows were acknowledged by the backend.
 * Error markers are stored separately from row state.
 *
 * @readonly
 * @enum {string}
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

/**
 * Track row insert, update, delete, validation, and save state for a Tabulator table.
 *
 * Uses backend ids for persisted rows and AMB temporary ids for new rows.
 * Reports changes as inserted, updated, and deleted payload groups.
 */
export class CrudHelper {
    /**
     * Create a helper that tracks CRUD state and validation markers for a Tabulator table.
     *
     * @param {object} table - Tabulator table instance.
     * @param {object} [options] - Field names used by the helper.
     * @param {string} [options.idField='id'] - Unique row identifier field.
     * @param {string} [options.stateField='_state'] - Field used to store the row state.
     * @param {string} [options.originalDataField='_originalData'] - Field used to store original row data.
     * @param {object} [options.errorStyle] - Error highlighting options.
     * @param {boolean} [options.errorStyle.highlightRowOnCellError=false] - Whether cell errors also mark the row.
     * @param {string} [options.rowNumberField='_ambRowNumber'] - Internal visible/logical row number field.
     * @param {string} [options.tempIdField='_ambTempId'] - Internal technical key for rows without backend id.
     * @param {boolean} [options.renumberOnAdd=true] - Whether new rows receive the next row number.
     * @param {boolean} [options.renumberOnDelete=true] - Whether physically removing new rows renumbers remaining rows.
     */
    constructor(table, options = {}) {
        const { errorStyle = {}, rowNumbering = {}, ...baseOptions } = options;
        const rowNumberField = baseOptions.rowNumberField
            || rowNumbering.field
            || '_ambRowNumber';

        this.table = table;
        this.options = {
            idField: 'id',
            rowNumberField,
            tempIdField: '_ambTempId',
            renumberOnAdd: rowNumbering.assignOnAdd !== undefined
                ? rowNumbering.assignOnAdd
                : true,
            renumberOnDelete: true,
            stateField: '_state',
            originalDataField: '_originalData',
            ...baseOptions,
            errorStyle: {
                highlightRowOnCellError: false,
                ...errorStyle
            },
            rowNumbering: {
                enabled: true,
                field: rowNumberField,
                assignOnAdd: baseOptions.renumberOnAdd !== undefined
                    ? baseOptions.renumberOnAdd
                    : rowNumbering.assignOnAdd !== undefined
                        ? rowNumbering.assignOnAdd
                        : true,
                ...rowNumbering
            }
        };
        this.originalRows = new Map();
        this.modifiedCells = new Map();
        this.cellErrors = new Map();
        this.cellValidators = new Map();
        this.rowErrors = new Map();
        this.eventHandlers = new Map();
        this.tabulatorEventHandlers = new Map();
        this.isDestroyed = false;
        this.nextTempIdNumber = 1;

        this._captureInitialSnapshot();
        this._enableTracking();
    }

    _enableTracking() {
        if (!this.table || typeof this.table.on !== 'function') return;

        const tableBuiltHandler = () => {
            this._handleTableBuilt();
        };
        const cellEditedHandler = cell => {
            this._handleCellEdited(cell);
        };

        this.tabulatorEventHandlers.set('tableBuilt', tableBuiltHandler);
        this.tabulatorEventHandlers.set('cellEdited', cellEditedHandler);
        this.table.on('tableBuilt', tableBuiltHandler);
        this.table.on('cellEdited', cellEditedHandler);
    }

    _handleTableBuilt() {
        if (this.isDestroyed) return;

        this._captureInitialSnapshot();
    }

    _handleCellEdited(cell) {
        if (this.isDestroyed) return;

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
    }

    _captureInitialSnapshot() {
        if (!this.table || typeof this.table.getRows !== 'function') return;

        this._assignMissingRowNumbers();
        this._assignMissingTempIds();

        const rows = this.table.getRows();

        rows.forEach(row => {
            const data = row.getData();
            const key = this._getRowKey(row);
            const state = data[this.options.stateField];

            if (!key || state === ROW_STATE.NEW || this.originalRows.has(key)) return;

            this.originalRows.set(key, this._cleanHelperFields(data));

            if (!state) {
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
        return this._cleanHelperFields(data);
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
        return this.options.rowNumberField || this._getRowNumberingOptions().field;
    }

    _getTempIdField() {
        return this.options.tempIdField;
    }

    _isMissingId(id) {
        return id === null || id === undefined || id === '';
    }

    _getRowTempId(row) {
        const data = row && row.getData ? row.getData() : {};

        return data[this._getTempIdField()];
    }

    _getRowKey(row) {
        const id = this._getRowId(row);

        if (!this._isMissingId(id)) return id;

        return this._getRowTempId(row);
    }

    _getIdentifierLabel(identifier) {
        return `${this.options.idField}/${this._getTempIdField()} ${identifier}`;
    }

    _extractTempIdNumber(tempId) {
        const match = String(tempId || '').match(/^amb-temp-(\d+)$/);

        return match ? Number(match[1]) : 0;
    }

    _createTempId() {
        const tempId = `amb-temp-${this.nextTempIdNumber}`;

        this.nextTempIdNumber += 1;

        return tempId;
    }

    _syncNextTempIdNumber() {
        const field = this._getTempIdField();
        const maxTempIdNumber = this.table.getRows().reduce((max, row) => {
            const tempIdNumber = this._extractTempIdNumber(row.getData()[field]);

            return tempIdNumber > max ? tempIdNumber : max;
        }, 0);

        if (maxTempIdNumber >= this.nextTempIdNumber) {
            this.nextTempIdNumber = maxTempIdNumber + 1;
        }
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

    _assignMissingTempIds() {
        const idField = this.options.idField;
        const tempIdField = this._getTempIdField();

        this._syncNextTempIdNumber();

        this.table.getRows().forEach(row => {
            const data = row.getData();

            if (!this._isMissingId(data[idField]) || data[tempIdField]) return;

            this._patchRow(row, {
                [tempIdField]: this._createTempId()
            });
        });
    }

    _assignInternalFieldsOnAdd(rowData) {
        const nextRowData = { ...rowData };
        const idField = this.options.idField;
        const tempIdField = this._getTempIdField();

        if (this._isMissingId(nextRowData[idField]) && !nextRowData[tempIdField]) {
            nextRowData[tempIdField] = this._createTempId();
        }

        const field = this._getRowNumberField();

        if (
            this._isRowNumberingEnabled()
            && this.options.renumberOnAdd
            && (nextRowData[field] === undefined || nextRowData[field] === null)
        ) {
            nextRowData[field] = this._getMaxRowNumber() + 1;
        }

        return nextRowData;
    }

    _renumberRows() {
        if (!this._isRowNumberingEnabled()) return;

        const field = this._getRowNumberField();

        this.table.getRows().forEach((row, index) => {
            const rowNumber = index + 1;
            const key = this._getRowKey(row);

            this._patchRow(row, {
                [field]: rowNumber
            });

            if (this.originalRows.has(key)) {
                const originalData = this.originalRows.get(key);

                this.originalRows.set(key, {
                    ...originalData,
                    [field]: rowNumber
                });
            }
        });
    }

    _renumberAfterPhysicalDelete(deleteResult) {
        const renumber = () => {
            if (this.options.renumberOnDelete) {
                this._renumberRows();
            }
        };

        if (deleteResult && typeof deleteResult.then === 'function') {
            deleteResult.then(renumber);
            return;
        }

        globalThis.setTimeout(renumber, 0);
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
        const key = this._getRowKey(row);

        return this.originalRows.get(key) || data[this.options.originalDataField] || null;
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
        const key = this._getRowKey(row);
        const field = cell.getField();
        const cellElement = cell.getElement();

        if (!this.modifiedCells.has(key)) {
            this.modifiedCells.set(key, new Set());
        }

        this.modifiedCells.get(key).add(field);

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
        const key = this._getRowKey(row);
        const field = cell.getField();
        const cellElement = cell.getElement();
        const fields = this.modifiedCells.get(key);

        if (fields) {
            fields.delete(field);

            if (fields.size === 0) {
                this.modifiedCells.delete(key);
            }
        }

        if (cellElement) {
            delete cellElement.dataset.cellState;
        }
    }

    _clearRowCellStates(row) {
        if (!row) return;

        const key = this._getRowKey(row);

        row.getCells().forEach(cell => {
            const cellElement = cell.getElement();

            if (cellElement) {
                delete cellElement.dataset.cellState;
            }
        });

        this.modifiedCells.delete(key);
    }

    _hasModifiedCells(row) {
        if (!row) return false;

        const fields = this.modifiedCells.get(this._getRowKey(row));

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
        const key = this._getRowKey(row);
        const value = cell.getValue();
        const failedValidator = validators.find(validator => {
            return !validator.validateFn(value, rowData, cell, this);
        });

        if (!failedValidator) {
            this.clearCellError(key, field);
            return;
        }

        this.markCellError(key, field, failedValidator.message);
    }

    _validateField(row, field) {
        const validators = this.cellValidators.get(field);

        if (!validators || validators.length === 0) return null;

        const cell = this._getCell(row, field);
        const rowData = row.getData();
        const key = this._getRowKey(row);
        const value = rowData[field];
        const failedValidator = validators.find(validator => {
            return !validator.validateFn(value, rowData, cell, this);
        });

        if (!failedValidator) {
            this.clearCellError(key, field);
            return null;
        }

        this.markCellError(key, field, failedValidator.message);

        return {
            field,
            message: failedValidator.message,
            value
        };
    }

    _syncRowErrorAttribute(row) {
        if (!row) return;

        const key = this._getRowKey(row);
        const rowElement = row.getElement();

        if (!rowElement) return;

        if (this._hasRowError(key)) {
            rowElement.dataset.rowError = 'true';
        } else {
            delete rowElement.dataset.rowError;
        }

        if (this.options.errorStyle.highlightRowOnCellError && this._hasCellErrors(key)) {
            rowElement.dataset.hasCellError = 'true';
        } else {
            delete rowElement.dataset.hasCellError;
        }
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
     * Validate every registered cell validator for one row without changing row state.
     *
     * @param {*} id - Row identifier.
     * @returns {object|null} Row validation result, or null when the row is not found.
     */
    validateRow(identifier) {
        const row = this.findRowByKey(identifier);

        if (!row) {
            console.warn(`Row with ${this._getIdentifierLabel(identifier)} not found`);
            return null;
        }

        const data = row.getData();
        const id = data[this.options.idField];
        const tempId = data[this._getTempIdField()];
        const rowNumber = data[this._getRowNumberField()];
        const errors = [];

        this.cellValidators.forEach((validators, field) => {
            if (!validators || validators.length === 0) return;

            const error = this._validateField(row, field);

            if (error) {
                errors.push(error);
            }
        });

        return {
            id,
            tempId,
            rowNumber,
            isValid: errors.length === 0,
            errors
        };
    }

    _buildValidationResult(rows) {
        const errors = [];

        rows.forEach(rowResult => {
            rowResult.errors.forEach(error => {
                errors.push({
                    id: rowResult.id,
                    tempId: rowResult.tempId,
                    rowNumber: rowResult.rowNumber,
                    ...error
                });
            });
        });

        return {
            isValid: errors.length === 0,
            rows,
            errors
        };
    }

    /**
     * Validate all active rows with registered cell validators without changing row state.
     *
     * @param {object} [options] - Validation options.
     * @param {boolean} [options.includeDeleted=false] - Include rows marked as deleted in the technical audit result.
     * @returns {{isValid: boolean, rows: object[], errors: object[]}}
     */
    validateAll(options = {}) {
        const normalizedOptions = {
            includeDeleted: false,
            ...options
        };
        const rows = this.table.getRows()
            .filter(row => {
                return normalizedOptions.includeDeleted
                    || this._getBaseRowState(row) !== ROW_STATE.DELETED;
            })
            .map(row => this.validateRow(this._getRowKey(row)))
            .filter(Boolean);

        return this._buildValidationResult(rows);
    }

    /**
     * Validate only rows with pending insert/update changes.
     *
     * Clean, saved, and deleted rows can still be used by cross-row validators
     * such as `unique`, but they are not validated or marked by this method.
     *
     * @returns {{isValid: boolean, rows: object[], errors: object[]}}
     */
    validateChanges() {
        const rows = this.table.getRows()
            .filter(row => {
                const state = this._getBaseRowState(row);

                return state === ROW_STATE.NEW || state === ROW_STATE.MODIFIED;
            })
            .map(row => this.validateRow(this._getRowKey(row)))
            .filter(Boolean);

        return this._buildValidationResult(rows);
    }

    /**
     * Register a callback for a CrudHelper event.
     *
     * @param {string} eventName - Event name to subscribe to.
     * @param {Function} callback - Callback invoked with the event payload.
     * @returns {Function} Function that removes the subscription.
     */
    on(eventName, callback) {
        if (this.isDestroyed) {
            return () => {};
        }

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
     * Release the CRUD layer attached to the Tabulator table.
     *
     * Removes the Tabulator event handlers registered by this CrudHelper,
     * clears tracking state for original rows, modified cells, validation
     * errors, cell validators, and custom CrudHelper subscriptions. The method
     * is safe to call more than once.
     *
     * This does not destroy the Tabulator table and does not call
     * `table.destroy()`. It is intended for lifecycle cleanup in modals, tabs,
     * dynamic page sections, SPA views, or grid reinitialization flows where
     * the table engine may be owned separately from the CRUD layer.
     *
     * @example
     * const crud = new CrudHelper(table);
     *
     * // later, detach only the CRUD layer
     * crud.destroy();
     */
    destroy() {
        if (this.isDestroyed) return;

        this.isDestroyed = true;

        if (this.table && typeof this.table.off === 'function') {
            this.tabulatorEventHandlers.forEach((handler, eventName) => {
                this.table.off(eventName, handler);
            });
        }

        this.tabulatorEventHandlers.clear();
        this.originalRows.clear();
        this.modifiedCells.clear();
        this.cellErrors.clear();
        this.cellValidators.clear();
        this.rowErrors.clear();
        this.eventHandlers.clear();
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
     * @returns {object[]} Row-level errors.
     */
    getRowErrors() {
        return Array.from(this.rowErrors, ([key, message]) => {
            const row = this.findRowByKey(key);
            const data = row && row.getData ? row.getData() : {};

            return {
                key,
                id: data[this.options.idField],
                tempId: data[this._getTempIdField()],
                rowNumber: data[this._getRowNumberField()],
                message
            };
        });
    }

    /**
     * Return all currently tracked cell-level errors.
     *
     * @returns {object[]} Cell-level errors.
     */
    getCellErrors() {
        const errors = [];

        this.cellErrors.forEach((fields, key) => {
            const row = this.findRowByKey(key);
            const data = row && row.getData ? row.getData() : {};

            fields.forEach((message, field) => {
                errors.push({
                    key,
                    id: data[this.options.idField],
                    tempId: data[this._getTempIdField()],
                    rowNumber: data[this._getRowNumberField()],
                    field,
                    message
                });
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
    markCellError(identifier, field, message) {
        const row = this.findRowByKey(identifier);

        if (!row) {
            console.warn(`Row with ${this._getIdentifierLabel(identifier)} not found`);
            return false;
        }

        const id = this._getRowId(row);
        const key = this._getRowKey(row);
        const cell = this._getCell(row, field);

        if (!cell) {
            console.warn(`Cell with field ${field} not found`);
            return false;
        }

        if (this._getBaseRowState(row) === ROW_STATE.DELETED) {
            console.warn(`Cannot mark deleted row with ${this._getIdentifierLabel(identifier)} as error`);
            return false;
        }

        this._getCellErrorMap(key).set(field, message);

        const cellElement = cell.getElement();

        if (cellElement) {
            cellElement.dataset.cellError = 'true';
            cellElement.title = message;
        }

        this._syncRowErrorAttribute(row);
        this._emit('cell-error', {
            row,
            cell,
            id,
            tempId: this._getRowTempId(row),
            key,
            field,
            message
        });
        return true;
    }

    /**
     * Clear the error marker from a single cell without changing the row state.
     *
     * @param {*} id - Row identifier.
     * @param {string} field - Cell field name.
     * @returns {boolean} True when the row was found and the marker was cleared.
     */
    clearCellError(identifier, field) {
        const row = this.findRowByKey(identifier);

        if (!row) {
            console.warn(`Row with ${this._getIdentifierLabel(identifier)} not found`);
            return false;
        }

        const id = this._getRowId(row);
        const key = this._getRowKey(row);
        const errors = this.cellErrors.get(key);

        const hadError = Boolean(errors && errors.has(field));

        if (errors) {
            errors.delete(field);

            if (errors.size === 0) {
                this.cellErrors.delete(key);
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
            this._emit('cell-error-cleared', {
                row,
                cell,
                id,
                tempId: this._getRowTempId(row),
                key,
                field
            });
        }

        return true;
    }

    /**
     * Clear all cell-level errors from a row without changing the row state.
     *
     * @param {*} id - Row identifier.
     * @returns {boolean} True when the row was found and its cell errors were cleared.
     */
    clearRowErrors(identifier) {
        const row = this.findRowByKey(identifier);

        if (!row) {
            console.warn(`Row with ${this._getIdentifierLabel(identifier)} not found`);
            return false;
        }

        const id = this._getRowId(row);
        const key = this._getRowKey(row);
        const errors = this.cellErrors.get(key);

        if (errors) {
            Array.from(errors).forEach(([field, message]) => {
                const cell = this._getCell(row, field);
                const cellElement = cell && cell.getElement();

                if (cellElement) {
                    delete cellElement.dataset.cellError;
                    cellElement.removeAttribute('title');
                }

                this._emit('cell-error-cleared', {
                    row,
                    cell,
                    id,
                    tempId: this._getRowTempId(row),
                    key,
                    field,
                    message
                });
            });
        }

        this.cellErrors.delete(key);
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
    markRowError(identifier, message) {
        const row = this.findRowByKey(identifier);

        if (!row) {
            console.warn(`Row with ${this._getIdentifierLabel(identifier)} not found`);
            return false;
        }

        const id = this._getRowId(row);
        const key = this._getRowKey(row);

        if (this._getBaseRowState(row) === ROW_STATE.DELETED) {
            console.warn(`Cannot mark deleted row with ${this._getIdentifierLabel(identifier)} as error`);
            return false;
        }

        this.rowErrors.set(key, message);

        const rowElement = row.getElement();

        if (rowElement) {
            rowElement.title = message;
        }

        this._syncRowErrorAttribute(row);

        this._emit('row-error', {
            row,
            id,
            tempId: this._getRowTempId(row),
            key,
            message
        });
        return true;
    }

    /**
     * Clear the row-level error marker without changing the row state.
     *
     * @param {*} id - Row identifier.
     * @returns {boolean} True when the row was found and the marker was cleared.
     */
    clearRowError(identifier) {
        const row = this.findRowByKey(identifier);

        if (!row) {
            console.warn(`Row with ${this._getIdentifierLabel(identifier)} not found`);
            return false;
        }

        const id = this._getRowId(row);
        const key = this._getRowKey(row);
        const hadError = this.rowErrors.has(key);

        this.rowErrors.delete(key);

        const rowElement = row.getElement();

        if (rowElement) {
            rowElement.removeAttribute('title');
        }

        this._syncRowErrorAttribute(row);

        if (hadError) {
            this._emit('row-error-cleared', {
                row,
                id,
                tempId: this._getRowTempId(row),
                key
            });
        }

        return true;
    }

    /**
     * Clear row-level and cell-level error markers from a row.
     *
     * @param {*} id - Row identifier.
     * @returns {boolean} True when the row was found and all error markers were cleared.
     */
    clearAllErrors(identifier) {
        const clearedCellErrors = this.clearRowErrors(identifier);
        const clearedRowError = this.clearRowError(identifier);

        return clearedCellErrors && clearedRowError;
    }

    /**
     * Add a new row and mark it as inserted.
     *
     * @param {object} data - Row data to insert.
     * @returns {object|Promise<object>} Tabulator row component, or a promise resolving to one.
     */
    addRow(data) {
        const rowData = this._assignInternalFieldsOnAdd({
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

        if (this._isMissingId(id)) return null;

        return rows.find(row => {
            const data = row.getData();
            return data[idField] === id;
        }) || null;
    }

    /**
     * Find a row by backend id when present, otherwise by AMB temporary id.
     *
     * @param {*} identifier - Backend id or temporary AMB id.
     * @returns {object|null} Tabulator row component, or null when no row matches.
     */
    findRowByKey(identifier) {
        const rows = this.table.getRows();

        return rows.find(row => {
            const data = row.getData();
            const id = data[this.options.idField];

            if (!this._isMissingId(id) && id === identifier) return true;

            return data[this._getTempIdField()] === identifier;
        }) || null;
    }

    _findRowByTempId(tempId) {
        const tempIdField = this._getTempIdField();

        return this.table.getRows().find(row => {
            return row.getData()[tempIdField] === tempId;
        }) || null;
    }

    _copyMapEntry(map, oldKey, newKey) {
        if (!map.has(oldKey)) return;

        map.set(newKey, map.get(oldKey));
        map.delete(oldKey);
    }

    _applyBackendIdToSnapshot(snapshot, id, tempId, keepTempIdAfterBackendId) {
        if (!snapshot) return snapshot;

        const idField = this.options.idField;
        const tempIdField = this._getTempIdField();
        const nextSnapshot = {
            ...snapshot,
            [idField]: id
        };

        if (keepTempIdAfterBackendId) {
            nextSnapshot[tempIdField] = tempId;
        } else {
            delete nextSnapshot[tempIdField];
        }

        return nextSnapshot;
    }

    /**
     * Apply backend-generated ids to rows currently identified by AMB temporary ids.
     *
     * @param {object[]} mappings - Backend id mappings keyed by temp id.
     * @param {*} mappings[].tempId - AMB temporary id returned in the inserted payload.
     * @param {*} mappings[].id - Backend id assigned to the inserted row.
     * @param {object} [options] - Apply options.
     * @param {boolean} [options.keepTempIdAfterBackendId=false] - Keep the temporary id after assigning backend id.
     * @returns {{applied: object[], notFound: object[], invalid: object[], duplicates: object[]}} Apply result.
     * @example
     * grid.crud.applyBackendIds([
     *   { tempId: 'amb-temp-1', id: 42 }
     * ]);
     */
    applyBackendIds(mappings, options = {}) {
        const normalizedOptions = {
            keepTempIdAfterBackendId: false,
            ...options
        };
        const result = {
            applied: [],
            notFound: [],
            invalid: [],
            duplicates: []
        };
        const idField = this.options.idField;
        const tempIdField = this._getTempIdField();
        const rowNumberField = this._getRowNumberField();

        (mappings || []).forEach(mapping => {
            const tempId = mapping && mapping.tempId;
            const id = mapping && mapping.id;

            if (this._isMissingId(id)) {
                result.invalid.push({
                    tempId,
                    id,
                    reason: 'Backend id is required'
                });
                return;
            }

            const row = this._findRowByTempId(tempId);

            if (!row) {
                result.notFound.push({ tempId, id });
                return;
            }

            const duplicate = this.findRowById(id);

            if (duplicate && duplicate !== row) {
                result.duplicates.push({
                    tempId,
                    id,
                    reason: 'Backend id already exists'
                });
                return;
            }

            const data = row.getData();
            const oldKey = this._getRowKey(row);
            const rowNumber = data[rowNumberField];
            const oldOriginalData = data[this.options.originalDataField];
            const patch = {
                [idField]: id
            };

            if (!normalizedOptions.keepTempIdAfterBackendId) {
                patch[tempIdField] = undefined;
            } else {
                patch[tempIdField] = tempId;
            }

            if (oldOriginalData) {
                patch[this.options.originalDataField] = this._applyBackendIdToSnapshot(
                    oldOriginalData,
                    id,
                    tempId,
                    normalizedOptions.keepTempIdAfterBackendId
                );
            }

            this._patchRow(row, patch);

            if (!normalizedOptions.keepTempIdAfterBackendId) {
                delete row.getData()[tempIdField];
                if (row.getData()[this.options.originalDataField]) {
                    delete row.getData()[this.options.originalDataField][tempIdField];
                }
            }

            const newKey = this._getRowKey(row);

            if (oldKey !== newKey) {
                if (this.originalRows.has(oldKey)) {
                    const originalData = this.originalRows.get(oldKey);

                    this.originalRows.delete(oldKey);
                    this.originalRows.set(newKey, this._applyBackendIdToSnapshot(
                        originalData,
                        id,
                        tempId,
                        normalizedOptions.keepTempIdAfterBackendId
                    ));
                }

                this._copyMapEntry(this.modifiedCells, oldKey, newKey);
                this._copyMapEntry(this.cellErrors, oldKey, newKey);
                this._copyMapEntry(this.rowErrors, oldKey, newKey);
            }

            result.applied.push({
                tempId,
                id,
                rowNumber
            });
        });

        return result;
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
    deleteRow(identifier) {
        const row = this.findRowByKey(identifier);

        if (!row) {
            console.warn(`Row with ${this._getIdentifierLabel(identifier)} not found`);
            return false;
        }

        const key = this._getRowKey(row);

        if (this._getBaseRowState(row) === ROW_STATE.NEW) {
            this._clearRowCellStates(row);
            this.clearAllErrors(key);

            this._renumberAfterPhysicalDelete(row.delete());
            return true;
        }

        this._clearRowCellStates(row);
        this.clearAllErrors(key);
        this._applyRowState(row, ROW_STATE.DELETED);
        return true;
    }

    /**
     * Restore a row to its original data and clear local tracking markers.
     *
     * @param {*} id - Row identifier.
     * @returns {boolean} True when the rollback completed.
     */
    rollbackRow(identifier) {
        const row = this.findRowByKey(identifier);

        if (!row) {
            console.warn(`Row with ${this._getIdentifierLabel(identifier)} not found`);
            return false;
        }

        const data = row.getData();
        const key = this._getRowKey(row);
        const state = this._getBaseRowState(row);

        if (state === ROW_STATE.NEW) {
            this._clearRowCellStates(row);
            this.clearAllErrors(key);

            this._renumberAfterPhysicalDelete(row.delete());
            return true;
        }

        if (state === ROW_STATE.CLEAN) {
            this._clearRowCellStates(row);
            this.clearAllErrors(key);
            this._applyRowState(row, ROW_STATE.CLEAN);
            return true;
        }

        if (state === ROW_STATE.MODIFIED || state === ROW_STATE.DELETED) {
            const originalData = this.originalRows.get(key) || data[this.options.originalDataField];

            if (!originalData) {
                console.warn(`Original data for row with ${this._getIdentifierLabel(identifier)} not found`);
                return false;
            }

            const lookupMetadata = rollbackLookupMetadata(data);
            const restoredData = lookupMetadata
                ? {
                    ...originalData,
                    [LOOKUP_METADATA_FIELD]: lookupMetadata
                }
                : originalData;

            this._restoreRowData(row, restoredData);
            this._clearRowCellStates(row);
            this.clearAllErrors(key);
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
    markRowSaved(identifier) {
        const row = this.findRowByKey(identifier);

        if (!row) {
            console.warn(`Row with ${this._getIdentifierLabel(identifier)} not found`);
            return false;
        }

        const data = row.getData();
        const id = data[this.options.idField];
        const key = this._getRowKey(row);
        const state = this._getBaseRowState(row);

        if (state === ROW_STATE.NEW && this._isMissingId(id)) {
            return false;
        }

        if (state === ROW_STATE.NEW || state === ROW_STATE.MODIFIED) {
            this.originalRows.set(key, this._cleanHelperFields(data));
            this._clearRowCellStates(row);
            this._applyRowState(row, ROW_STATE.SAVED);
            this._emit('row-saved', {
                row,
                id,
                tempId: this._getRowTempId(row),
                key,
                state: ROW_STATE.SAVED
            });
            return true;
        }

        if (state === ROW_STATE.DELETED) {
            this._clearRowCellStates(row);
            this.clearAllErrors(key);
            this.originalRows.delete(key);
            this._emit('row-saved', {
                row,
                id,
                tempId: this._getRowTempId(row),
                key,
                state
            });
            this._renumberAfterPhysicalDelete(row.delete());
            return true;
        }

        return true;
    }

    /**
     * Mark multiple pending rows as saved after a successful backend confirmation.
     *
     * @param {Array.<*>} ids - Row identifiers to mark as saved.
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
        const result = {
            saved: [],
            skipped: []
        };

        report.validChangedRows.forEach(row => {
            if (row.state === ROW_STATE.NEW && this._isMissingId(row.id)) {
                result.skipped.push({
                    tempId: row.tempId,
                    reason: 'missing-backend-id'
                });
                return;
            }

            if (this.markRowSaved(row.key)) {
                result.saved.push({
                    key: row.key,
                    id: row.id,
                    tempId: row.tempId,
                    rowNumber: row.rowNumber,
                    state: row.state
                });
                return;
            }

            result.skipped.push({
                key: row.key,
                id: row.id,
                tempId: row.tempId,
                rowNumber: row.rowNumber,
                reason: 'not-saved'
            });
        });

        return result;
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
            const tempId = data[this._getTempIdField()];
            const rowNumber = data[this._getRowNumberField()];
            const state = data[this.options.stateField] || ROW_STATE.CLEAN;

            if (state === ROW_STATE.NEW) {
                changes.inserted.push(this._cleanHelperFields(data));
                return;
            }

            if (state === ROW_STATE.MODIFIED) {
                const before = this._getOriginalDataForRow(row);

                if (!before) return;

                const cleanBefore = this._cleanHelperFields(before);
                const after = this._cleanHelperFields(data);

                changes.updated.push({
                    id,
                    tempId,
                    rowNumber,
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
                    tempId,
                    rowNumber,
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
            const tempId = data[this._getTempIdField()];
            const key = this._getRowKey(row);
            const state = data[this.options.stateField] || ROW_STATE.CLEAN;
            const hasRowError = this.rowErrors.has(key);
            const rowError = hasRowError ? this.rowErrors.get(key) : null;
            const cellErrorMap = this.cellErrors.get(key);
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
                key,
                id,
                tempId,
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
                    tempId: row.tempId,
                    rowNumber: row.rowNumber,
                    before: row.before,
                    after: row.after,
                    changedFields: row.changedFields
                });
                return;
            }

            if (row.state === ROW_STATE.DELETED) {
                validChanges.deleted.push({
                    id: row.id,
                    tempId: row.tempId,
                    rowNumber: row.rowNumber,
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

    /**
     * Build a backend-ready save payload from the current report without changing state.
     *
     * @param {object} [options] - Payload options.
     * @param {boolean} [options.onlyValid=true] - Use only valid changes.
     * @param {boolean} [options.includeInvalid=false] - Include invalid changed rows.
     * @returns {object} Save payload snapshot.
     * @example
     * const payload = grid.crud.getSavePayload();
     *
     * if (payload.canSave) {
     *   await saveRows(payload.changes);
     * }
     */
    getSavePayload(options = {}) {
        const normalizedOptions = {
            onlyValid: true,
            includeInvalid: false,
            ...options
        };
        const report = this.getStateReport();
        const changes = normalizedOptions.onlyValid ? report.validChanges : report.changes;
        const hasPayloadChanges = changes.inserted.length > 0
            || changes.updated.length > 0
            || changes.deleted.length > 0;

        return {
            canSave: hasPayloadChanges && !report.hasErrors,
            hasChanges: report.hasChanges,
            hasErrors: report.hasErrors,
            summary: {
                totalRows: report.totalRows,
                changedRowsCount: report.changedRowsCount,
                validChangedRowsCount: report.validChangedRowsCount,
                invalidChangedRowsCount: report.invalidChangedRowsCount,
                errorRowsCount: report.errorRowsCount
            },
            changes,
            invalidChangedRows: normalizedOptions.includeInvalid ? report.invalidChangedRows : []
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

        const key = this._getRowKey(row);

        if (!this.originalRows.has(key) && !data[originalDataField]) {
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
                tempId: this._getRowTempId(row),
                key: this._getRowKey(row),
                previousState,
                nextState: state
            });
        }
    }
}
