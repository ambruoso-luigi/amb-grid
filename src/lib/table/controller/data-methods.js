/**
 * Delegates a full dataset replacement to the internal table engine and then
 * registers the loaded managed rows as a new CRUD baseline.
 *
 * @param {object} table - Internal table engine.
 * @param {object} crud - AMB Grid CRUD helper.
 * @param {string} methodName - Internal replacement method name.
 * @param {Array.<*>} args - Arguments forwarded without transformation.
 * @returns {*|false} Delegated result, a Promise preserving its resolved value, or `false`.
 * @private
 * @internal
 */
const replaceDataAndRebase = (table, crud, methodName, args) => {
    if (
        !table
        || typeof table[methodName] !== 'function'
        || !crud
        || typeof crud.rebaseCurrentData !== 'function'
    ) {
        return false;
    }

    const operation = table[methodName](...args);

    if (!operation || typeof operation.then !== 'function') {
        const rebase = crud.rebaseCurrentData();

        if (rebase && typeof rebase.then === 'function') {
            return rebase.then(() => operation);
        }

        return operation;
    }

    return operation.then(result => {
        const rebase = crud.rebaseCurrentData();

        if (rebase && typeof rebase.then === 'function') {
            return rebase.then(() => result);
        }

        return result;
    });
};

/**
 * Creates the data methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @param {object} context.crud - AMB Grid CRUD helper.
 * @returns {object} Data methods for the flat controller API.
 * @private
 * @internal
 */
export const createDataMethods = ({ table, crud }) => ({
    /**
     * Returns the current AJAX data URL used by the grid.
     *
     * The result is the URL configured through the runtime data-loading
     * configuration or the latest URL supplied to a data-loading operation.
     * Pagination, filter and sorter parameters generated for individual
     * requests are not included.
     *
     * This is a read-only operation and does not load data or modify AMB Grid
     * CRUD state.
     *
     * @returns {string} Current AJAX data URL, or an empty string when unset.
     */
    getAjaxUrl() {
        return table.getAjaxUrl();
    },

    /**
     * Returns the current grid data.
     *
     * An optional row range can be provided to limit the returned rows. For
     * example, the `"active"` range returns rows currently included after
     * filters and search conditions have been applied.
     *
     * This method returns runtime row data as-is. It does not create an AMB
     * Grid save payload or remove technical fields. Returned row objects should
     * be treated as read-only because direct changes may bypass CRUD tracking.
     *
     * @param {...any} args - Optional arguments used to select the requested rows.
     * @returns {object[]} Current row data.
     */
    getData(...args) {
        return table.getData(...args);
    },

    /**
     * Returns the number of rows in the requested row range.
     *
     * An optional row range can be provided. For example, `"active"` returns
     * the number of rows currently included after filters and search conditions
     * have been applied.
     *
     * This method reads the current grid state without modifying filters,
     * search, pagination, selection, or AMB Grid CRUD state.
     *
     * @param {...any} args - Optional arguments used to select the row range.
     * @returns {number} Number of rows in the requested range.
     */
    getDataCount(...args) {
        return table.getDataCount(...args);
    },

    /**
     * Replaces runtime data through the AMB Grid controller.
     *
     * The public controller API delegates the operation internally and, only
     * after it succeeds, registers all loaded managed rows as the new CRUD
     * baseline. Pending changes and application errors from the previous
     * dataset are intentionally discarded, while validators and CRUD
     * subscriptions remain active.
     *
     * A rejected internal operation leaves the previous tracking unchanged and
     * rejects with the same error. On success, the resolved value is preserved
     * after every row has a clean CRUD state.
     *
     * @param {...*} args - Data-loading arguments forwarded without transformation.
     * @returns {Promise<*>|*|false} Replacement result, or `false` when unavailable.
     */
    setData(...args) {
        return replaceDataAndRebase(table, crud, 'setData', args);
    },

    /**
     * Silently replaces runtime data through the AMB Grid controller.
     *
     * The public controller API preserves the internal table engine's runtime
     * replacement behavior, delegates the operation internally and, only after
     * it succeeds, registers all loaded managed rows as the new CRUD baseline.
     * Pending changes and application errors from the previous dataset are
     * intentionally discarded, while validators and CRUD subscriptions remain
     * active.
     *
     * A rejected internal operation leaves the previous tracking unchanged and
     * rejects with the same error. On success, the resolved value is preserved
     * after every row has a clean CRUD state.
     *
     * @param {...*} args - Data-replacement arguments forwarded without transformation.
     * @returns {Promise<*>|*|false} Replacement result, or `false` when unavailable.
     */
    replaceData(...args) {
        return replaceDataAndRebase(table, crud, 'replaceData', args);
    },

    /**
     * Adds multiple managed rows through the AMB Grid controller.
     *
     * Every supplied object remains unchanged while the public controller API
     * prepares a CRUD insertion with AMB-managed temporary identifiers and
     * technical fields. A position identifier is resolved to a managed row
     * component when possible, then the operation delegates internally in one
     * batch while preserving the internal table engine result.
     *
     * Rejections propagate unchanged. The operation does not focus, scroll,
     * select, change pages, or expand managed rows.
     *
     * @param {object[]} rowsData - Application row objects to add as managed rows.
     * @param {*} addToTop - Position flag forwarded without normalization.
     * @param {*} [positionIdentifier] - AMB identifier or internal position lookup.
     * @returns {Promise<object[]>|false} Preserved internal result, or `false`.
     */
    addData(rowsData, addToTop, positionIdentifier) {
        if (!crud || typeof crud.addData !== 'function') {
            return false;
        }

        let position = positionIdentifier;

        if (positionIdentifier !== undefined) {
            position = crud.findRowByKey(positionIdentifier)
                || positionIdentifier;
        }

        return crud.addData(
            rowsData,
            addToTop,
            position
        );
    },

    /**
     * Partially updates multiple existing rows through the AMB Grid controller.
     *
     * Each object is a partial application-data patch located by backend id or
     * temporary id. Unknown rows, missing identifiers, deleted managed rows,
     * and patches without application fields are ignored. Technical fields
     * cannot be overwritten; AMB Grid manages CRUD state, CRUD baseline
     * comparison, validation, and error markers. No new rows are added.
     *
     * Processing is sequential and non-atomic. A rejected managed row update
     * stops later patches, preserves earlier updates, and propagates the same
     * error without rollback. The public controller API delegates row updates
     * internally through the CRUD lifecycle; direct bulk mutation remains
     * advanced engine access.
     *
     * @param {object[]} rowsData - Partial patches for existing managed rows.
     * @returns {Promise<void>|false} Completion Promise, or `false` when unavailable.
     */
    updateData(rowsData) {
        if (!crud || typeof crud.updateData !== 'function') {
            return false;
        }

        return crud.updateData(rowsData);
    },

    /**
     * Returns row data matching a filter definition.
     *
     * This is a one-off query and does not modify the current programmatic
     * filters, header filters or AMB Grid global search state.
     *
     * Returned objects are the current runtime row data and should be treated
     * as read-only. Direct mutations may bypass AMB Grid CRUD tracking.
     *
     * @param {...*} args - Filter definition arguments.
     * @returns {object[]} Matching row data.
     */
    searchData(...args) {
        return table.searchData(...args);
    }
});
