/**
 * Creates the pagination methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @param {object} context.crud - AMB Grid CRUD layer.
 * @returns {object} Pagination methods for the flat controller API.
 * @private
 * @internal
 */
export const createPaginationMethods = ({ table, crud }) => ({
    /**
     * Returns the current page number.
     *
     * Page numbers start at 1. The method returns `false` when pagination is
     * disabled.
     *
     * @returns {number|false} Current page number, or `false` when pagination is disabled.
     */
    getPage() {
        return table.getPage();
    },

    /**
     * Returns the maximum available page number.
     *
     * The method returns `false` when pagination is disabled.
     *
     * @returns {number|false} Maximum page number, or `false` when pagination is disabled.
     */
    getPageMax() {
        return table.getPageMax();
    },

    /**
     * Returns the number of rows allowed on each page.
     *
     * @returns {number} Current page size.
     */
    getPageSize() {
        return table.getPageSize();
    },

    /**
     * Shows the requested page.
     *
     * The page can be specified using a positive page number or one of the
     * `"first"`, `"prev"`, `"next"` and `"last"` navigation values.
     *
     * With remote pagination, changing page may start a data request. This
     * method does not automatically save, validate or confirm pending AMB Grid
     * changes. The returned Promise is the original page-change Promise.
     *
     * @param {number|'first'|'prev'|'next'|'last'} page - Page to display.
     * @returns {Promise} Promise completed after the page change.
     */
    setPage(page) {
        return table.setPage(page);
    },

    /**
     * Shows the next page.
     *
     * With remote pagination, changing page may start a data request. This
     * method does not automatically save, validate or confirm pending AMB Grid
     * changes. The returned Promise is not transformed.
     *
     * @returns {Promise} Promise completed after the page change.
     */
    nextPage() {
        return table.nextPage();
    },

    /**
     * Shows the previous page.
     *
     * With remote pagination, changing page may start a data request. This
     * method does not automatically save, validate or confirm pending AMB Grid
     * changes. The returned Promise is not transformed.
     *
     * @returns {Promise} Promise completed after the page change.
     */
    previousPage() {
        return table.previousPage();
    },

    /**
     * Changes the number of rows displayed on each page.
     *
     * With remote pagination, this setting may be ignored when the page size is
     * controlled by the server.
     *
     * This method does not automatically save, validate, confirm pending AMB
     * Grid changes, or move back to the first page.
     *
     * @param {number} size - Number of rows to display on each page.
     * @returns {*} Result of the page-size update.
     */
    setPageSize(size) {
        return table.setPageSize(size);
    },

    /**
     * Shows the local pagination page containing the requested row.
     *
     * Backend identifiers and AMB Grid temporary identifiers are resolved
     * through the CRUD layer. Other supported row lookup values retain their
     * normal behavior.
     *
     * With remote pagination, the page of a row that has not been loaded cannot
     * be determined without specific backend support.
     *
     * This method does not automatically save, validate or confirm pending AMB
     * Grid changes. The returned Promise is the original row-page Promise.
     *
     * @param {*} identifier - Backend id, AMB temporary id, or supported row lookup value.
     * @returns {Promise} Promise completed after the row page has been displayed.
     */
    setPageToRow(identifier) {
        const ambRow = crud.findRowByKey(identifier);

        return table.setPageToRow(ambRow || identifier);
    }
});
