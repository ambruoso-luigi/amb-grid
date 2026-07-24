const readSheet = (sheet, methodName) => {
    if (!sheet) return false;

    const method = sheet[methodName];
    if (typeof method !== 'function') return false;

    return method.call(sheet);
};

/**
 * Creates the spreadsheet methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Spreadsheet methods for the flat controller API.
 * @private
 * @internal
 */
export const createSpreadsheetMethods = ({ table }) => ({
    /**
     * Returns the current spreadsheet sheet definitions.
     *
     * Definitions contain the runtime spreadsheet metadata and data exposed by
     * the grid's Spreadsheet module. The returned structure retains its
     * runtime identity and should be treated as read-only.
     *
     * Spreadsheet data uses a matrix-oriented format and is separate from the
     * standard AMB Grid object-row CRUD contract.
     *
     * @returns {object[]} Current spreadsheet sheet definitions.
     */
    getSheetDefinitions() {
        return table.getSheetDefinitions();
    },

    /**
     * Returns the current spreadsheet Sheet Components.
     *
     * Sheet Components expose advanced runtime operations that can modify
     * their sheets. The returned array and components retain their runtime
     * identities and should be handled carefully.
     *
     * @returns {object[]} Current Sheet Components.
     */
    getSheets() {
        return table.getSheets();
    },

    /**
     * Returns a spreadsheet Sheet Component.
     *
     * Omit the lookup to request the active sheet, or pass a supported sheet
     * key or Sheet Component. The method returns false when no matching sheet
     * is available according to the runtime Spreadsheet implementation.
     *
     * @param {*} [sheetLookup] - Sheet key, Sheet Component or supported lookup.
     * @returns {object|false} Matching Sheet Component, or false when unavailable.
     */
    getSheet(...args) {
        return table.getSheet(...args);
    },

    /**
     * Returns the runtime title of one spreadsheet sheet.
     *
     * `sheet` must be a Sheet Component obtained through the AMB Grid API, for
     * example with `getSheet()` or `getSheets()`. The runtime title is returned
     * without transformations, including an empty string. Reading it does not
     * modify sheet data or AMB Grid CRUD state.
     *
     * @param {object} sheet - Sheet Component obtained through the AMB Grid API.
     * @returns {*|false} Runtime sheet title, or `false` when the component or operation is unavailable.
     */
    getSheetTitle(sheet) {
        return readSheet(sheet, 'getTitle');
    },

    /**
     * Returns the runtime key of one spreadsheet sheet.
     *
     * `sheet` must be a Sheet Component obtained through the AMB Grid API, for
     * example with `getSheet()` or `getSheets()`. The runtime key is returned
     * without string, number or other transformations. Reading it does not
     * modify sheet data or AMB Grid CRUD state.
     *
     * @param {object} sheet - Sheet Component obtained through the AMB Grid API.
     * @returns {*|false} Runtime sheet key, or `false` when the component or operation is unavailable.
     */
    getSheetKey(sheet) {
        return readSheet(sheet, 'getKey');
    },

    /**
     * Returns the runtime definition of one spreadsheet sheet.
     *
     * `sheet` must be a Sheet Component obtained through the AMB Grid API, for
     * example with `getSheet()` or `getSheets()`. The runtime configuration is
     * returned by identity without transformations and should be treated as
     * read-only. Direct structural changes can bypass normal AMB Grid workflows;
     * use explicitly designed AMB Grid APIs instead. Reading the definition does
     * not modify sheet data or AMB Grid CRUD state.
     *
     * @param {object} sheet - Sheet Component obtained through the AMB Grid API.
     * @returns {object|false} Runtime sheet definition, or `false` when the component or operation is unavailable.
     */
    getSheetDefinition(sheet) {
        return readSheet(sheet, 'getDefinition');
    },

    /**
     * Returns the matrix data for a spreadsheet sheet.
     *
     * Omit the lookup to read the active sheet, or pass a supported sheet
     * lookup. Spreadsheet rows are represented as arrays rather than the object
     * rows used by the standard AMB Grid CRUD workflow.
     *
     * Reading sheet data does not generate a CRUD payload or modify sheet
     * state.
     *
     * @param {*} [sheetLookup] - Sheet key, Sheet Component or supported lookup.
     * @returns {Array<Array<*>>|false} Sheet matrix data, or false when unavailable.
     */
    getSheetData(...args) {
        return table.getSheetData(...args);
    },

    /**
     * Replaces the matrix data of a spreadsheet sheet.
     *
     * Pass only the matrix to update the active sheet, or pass a sheet lookup
     * followed by the matrix to update a specific sheet.
     *
     * Spreadsheet data is separate from the standard AMB Grid object-row CRUD
     * workflow and does not synchronize row state or save payloads.
     *
     * @param {...*} args - Sheet lookup and matrix data, or only matrix data.
     * @returns {void|false} False when no matching sheet is available.
     */
    setSheetData(...args) {
        return table.setSheetData(...args);
    },

    /**
     * Clears all matrix data from a spreadsheet sheet.
     *
     * Omit the lookup to clear the active sheet, or pass a supported sheet
     * lookup. Clearing spreadsheet data does not reset AMB Grid CRUD state.
     *
     * @param {*} [sheetLookup] - Sheet key, Sheet Component or supported lookup.
     * @returns {void|false} False when no matching sheet is available.
     */
    clearSheet(...args) {
        return table.clearSheet(...args);
    },

    /**
     * Replaces the current spreadsheet sheets.
     *
     * Definitions and matrix data are forwarded unchanged. The operation belongs
     * to the Spreadsheet runtime and does not synchronize AMB Grid CRUD state.
     *
     * @param {object[]} sheets - Sheet definitions to load.
     * @returns {object[]} Newly created Sheet Components.
     */
    setSheets(...args) {
        return table.setSheets(...args);
    },

    /**
     * Adds a spreadsheet sheet.
     *
     * @param {object} sheetDefinition - Definition of the sheet to add.
     * @returns {object} Newly created Sheet Component.
     */
    addSheet(...args) {
        return table.addSheet(...args);
    },

    /**
     * Makes a spreadsheet sheet active.
     *
     * @param {*} [sheetLookup] - Sheet key, component or supported lookup.
     * @returns {void|false} False when no matching sheet is available.
     */
    activeSheet(...args) {
        return table.activeSheet(...args);
    },

    /**
     * Removes a spreadsheet sheet.
     *
     * The runtime keeps at least one sheet available and manages any change to
     * the active sheet.
     *
     * @param {*} [sheetLookup] - Sheet key, component or supported lookup.
     * @returns {void}
     */
    removeSheet(...args) {
        return table.removeSheet(...args);
    }
});
