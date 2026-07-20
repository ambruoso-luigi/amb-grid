/**
 * Creates the spreadsheet reading methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Spreadsheet reading methods for the flat controller API.
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
    }
});
