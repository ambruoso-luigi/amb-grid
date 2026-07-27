const resolveRowComponent = (table, crud, identifier) => {
    const ambRow = crud.findRowByKey(identifier);

    if (ambRow) return ambRow;

    return table.getRow(identifier);
};

const isDataTreeEnabled = table => Boolean(table && table.options && table.options.dataTree);

const isGroupingEnabled = table => {
    const groupBy = table && table.options && table.options.groupBy;

    return typeof groupBy === 'function'
        || (typeof groupBy === 'string' && groupBy.length > 0)
        || (Array.isArray(groupBy) && groupBy.length > 0);
};

const resolveTreeRowOperation = (table, crud, identifier, methodName) => {
    if (!isDataTreeEnabled(table)) return false;

    const row = resolveRowComponent(table, crud, identifier);

    if (!row || typeof row[methodName] !== 'function') return false;

    return row;
};

/**
 * Creates the row methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @param {object} context.crud - AMB Grid CRUD layer.
 * @returns {object} Row methods for the flat controller API.
 * @private
 * @internal
 */
export const createRowMethods = ({ table, crud }) => ({
    /**
     * Returns the row components in the requested row range.
     *
     * Without a row range, all current row components are returned. A range
     * such as `"active"` can be used to retrieve rows included after the
     * current filtering and search conditions have been applied.
     *
     * Row components expose advanced operations. Mutating rows directly through
     * those components may bypass or interfere with AMB Grid CRUD tracking.
     *
     * @param {...any} args - Optional arguments used to select the row range.
     * @returns {object[]} Row components in the requested range.
     */
    getRows(...args) {
        return table.getRows(...args);
    },

    /**
     * Returns a row component for the requested row.
     *
     * Backend identifiers and AMB Grid temporary identifiers are resolved
     * through the CRUD layer. Other supported row lookup values retain their
     * standard lookup behavior.
     *
     * The returned component exposes advanced row operations. Mutating the row
     * directly through that component may bypass or interfere with AMB Grid CRUD
     * tracking.
     *
     * @param {*} identifier - Backend id, AMB temporary id, or supported row lookup value.
     * @returns {object|false} Matching row component, or `false` when no row is found.
     */
    getRow(identifier) {
        return resolveRowComponent(table, crud, identifier);
    },

    /**
     * Returns the current runtime group for one managed row component.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and `_ambTempId` values address the managed row
     * component. Other supported row lookup values retain the engine fallback.
     *
     * The Group Component is returned by identity for advanced use. Normal
     * group operations remain available through the dedicated AMB Grid
     * controller methods. The method returns `false` when the row is not
     * grouped or the operation is unavailable, and it does not modify grouping,
     * row data or CRUD state.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {object|false} Runtime Group Component, or `false`.
     */
    getRowGroup(identifier) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.getGroup !== 'function') return false;

        return row.getGroup();
    },

    /**
     * Returns the managed row data for one row through the AMB Grid controller.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and AMB Grid temporary identifiers address the managed
     * row component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * The returned object is the row data managed by the underlying table
     * engine. Directly mutating it may bypass AMB Grid CRUD tracking; normal
     * application code should prefer AMB Grid APIs when changing row data. The
     * optional transform value is forwarded unchanged. The result is returned
     * by identity, including falsy values produced by the engine. The method
     * returns `false` only when the row or operation is not available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @param {*} [transform] - Optional transform selector forwarded to the row component.
     * @returns {*|false} Row data result, or `false` when unavailable.
     */
    getRowData(identifier, transform) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.getData !== 'function') return false;

        return row.getData(transform);
    },

    /**
     * Returns the identifying index value for one row.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and AMB Grid temporary identifiers address the managed
     * row component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * This reads the row index value reported by the underlying table engine.
     * It is not the numerical row position exposed by `getRowPosition`. The
     * value is returned without conversion, including falsy values. The method
     * returns `false` only when the row or operation is not available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {*|false} Row index value, or `false` when unavailable.
     */
    getRowIndex(identifier) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.getIndex !== 'function') return false;

        return row.getIndex();
    },

    /**
     * Returns the next managed row component relative to one row.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and AMB Grid temporary identifiers address the managed
     * row component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * The result from the underlying table engine is returned by identity. This
     * preserves the next managed row component, or `false` when there is no
     * next row. The method also returns `false` when the row or operation is not
     * available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {object|false} Next managed row component, or `false`.
     */
    getNextRow(identifier) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.getNextRow !== 'function') return false;

        return row.getNextRow();
    },

    /**
     * Returns the previous managed row component relative to one row.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and AMB Grid temporary identifiers address the managed
     * row component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * The result from the underlying table engine is returned by identity. This
     * preserves the previous managed row component, or `false` when there is no
     * previous row. The method also returns `false` when the row or operation is
     * not available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {object|false} Previous managed row component, or `false`.
     */
    getPrevRow(identifier) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.getPrevRow !== 'function') return false;

        return row.getPrevRow();
    },

    /**
     * Returns the runtime DOM element for one row.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and `_ambTempId` values address the managed row
     * component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * This exposes the row's runtime DOM node by identity. Directly modifying
     * the DOM may bypass normal AMB Grid behavior; normal application code
     * should prefer AMB Grid public APIs when changing row data. The result is
     * returned by identity, including falsy values produced by the engine. The
     * method returns `false` when the row or operation is not available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {Element|false} Runtime row DOM element, or `false` when unavailable.
     */
    getRowElement(identifier) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.getElement !== 'function') return false;

        return row.getElement();
    },

    /**
     * Returns the Cell Components for one row.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and `_ambTempId` values address the managed row
     * component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * Cell Components are advanced runtime objects and are returned by
     * identity, including empty arrays. Directly modifying components may
     * bypass normal AMB Grid behavior; normal application code should prefer
     * AMB Grid public APIs when changing row data. The result is returned by
     * identity, including falsy values produced by the engine. The method
     * returns `false` when the row or operation is not available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {object[]|false} Row Cell Components, or `false` when unavailable.
     */
    getRowCells(identifier) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.getCells !== 'function') return false;

        return row.getCells();
    },

    /**
     * Runs a new native validation of the cells in one resolved row.
     *
     * `true` means every cell is valid; an array contains the invalid native
     * Cell Components. This is not the structured AMB result from
     * `grid.validateRow(...)`. `false` means the row or operation is unavailable.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {true|object[]|false} Native validation result, or `false`.
     */
    validateRowCells(identifier) {
        const row = resolveRowComponent(
            table,
            crud,
            identifier
        );

        if (
            !row
            || typeof row.validate !== 'function'
        ) {
            return false;
        }

        return row.validate();
    },

    /**
     * Returns the selected Range Components that overlap one managed row.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and AMB Grid temporary identifiers address the managed
     * Row Component. Unlike `grid.getRanges()`, this returns only ranges that
     * involve the resolved row.
     *
     * The array and its advanced runtime Range Components are returned without
     * copies, preserving engine order; an empty array means no selected range
     * overlaps the row. This read does not add, change or remove ranges and
     * does not modify cell values, row data or CRUD state. `false` means the
     * row or operation is unavailable.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {object[]|false} Overlapping runtime Range Components, or `false`.
     */
    getRowRanges(identifier) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.getRanges !== 'function') return false;

        return row.getRanges();
    },

    /**
     * Returns one Cell Component from a row.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and `_ambTempId` values address the managed row
     * component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * The column lookup is forwarded unchanged to the row component. Cell
     * Components are advanced runtime objects and are returned by identity.
     * Directly modifying components may bypass normal AMB Grid behavior; normal
     * application code should prefer AMB Grid public APIs when changing row
     * data. The result is returned by identity, including `false` when the
     * column or cell is not available. The method also returns `false` when the
     * row or operation is not available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @param {*} column - Column lookup supported by the row component.
     * @returns {object|false} Matching Cell Component, or `false`.
     */
    getRowCell(identifier, column) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.getCell !== 'function') return false;

        return row.getCell(column);
    },

    /**
     * Normalizes the runtime height of one row.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and `_ambTempId` values address the managed row
     * component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * This realigns the row's runtime cell heights. It does not directly
     * modify row data, snapshots, save payloads or AMB Grid CRUD tracking, and
     * it does not trigger an explicit table redraw. The method returns `false`
     * when the row or operation is not available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {boolean} `true` when delegated, otherwise `false`.
     */
    normalizeRowHeight(identifier) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.normalizeHeight !== 'function') return false;

        row.normalizeHeight();
        return true;
    },

    /**
     * Reapplies the runtime formatting for one row.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and `_ambTempId` values address the managed row
     * component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * This updates the row's runtime representation. It does not directly
     * modify row data, snapshots, save payloads or AMB Grid CRUD tracking.
     * Formatters and formatting callbacks configured by the application may be
     * executed again and can therefore have the effects defined by application
     * code. The method returns `false` when the row or operation is not
     * available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {boolean} `true` when delegated, otherwise `false`.
     */
    reformatRow(identifier) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.reformat !== 'function') return false;

        row.reformat();
        return true;
    },

    /**
     * Freezes one row through the AMB Grid controller.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and AMB Grid temporary identifiers address the managed
     * row component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * Freezing changes only the runtime row position used by the grid display.
     * Row data, snapshots, CRUD state and AMB Grid save payloads are not
     * modified. The method returns `false` when the row or operation is not
     * available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {boolean} `true` when the runtime row position is frozen, otherwise `false`.
     */
    freezeRow(identifier) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.freeze !== 'function') return false;

        row.freeze();
        return true;
    },

    /**
     * Unfreezes one row through the AMB Grid controller.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and AMB Grid temporary identifiers address the managed
     * row component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * Unfreezing changes only the runtime row position used by the grid display.
     * Row data, snapshots, CRUD state and AMB Grid save payloads are not
     * modified. The method returns `false` when the row or operation is not
     * available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {boolean} `true` when the runtime row position is unfrozen, otherwise `false`.
     */
    unfreezeRow(identifier) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.unfreeze !== 'function') return false;

        row.unfreeze();
        return true;
    },

    /**
     * Reports whether one row is currently frozen in the AMB Grid controller.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and AMB Grid temporary identifiers address the managed
     * row component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * The check reads the current runtime row position state only. Row data,
     * snapshots, CRUD state and AMB Grid save payloads are not modified. The
     * method returns `false` when the row or operation is not available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {boolean} Current frozen state, or `false` when unavailable.
     */
    isRowFrozen(identifier) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.isFrozen !== 'function') return false;

        return row.isFrozen();
    },

    /**
     * Adds a new managed child row through the AMB Grid controller.
     *
     * Data Tree must be enabled. The public controller API resolves the parent
     * managed row component from a backend id, `_ambTempId` or another
     * supported lookup. The optional relative row is resolved in the same way
     * and is accepted only when it belongs to the same parent. The position
     * flag is forwarded unchanged to support placement above or below it.
     *
     * The child receives CRUD state `new`, an `_ambTempId` when it has no
     * backend id, and the normal technical numbering. It is included in normal
     * AMB Grid changes and CRUD payloads. AMB Grid delegates the operation
     * internally to the underlying table engine and preserves its result.
     * Adding the child does not alter the parent CRUD state or Data Tree runtime
     * state, and does not expand, focus or select rows automatically. `false`
     * is returned when the operation is unavailable or invalid.
     *
     * @param {*} parentIdentifier - AMB Grid parent identifier or supported row lookup value.
     * @param {object} [data={}] - Application data for the new managed child row.
     * @param {*} [addToTop] - Position flag forwarded without normalization.
     * @param {*} [relativeToIdentifier] - Identifier for a relative row with the same parent.
     * @returns {*|false} Result from the underlying table engine, or `false`.
     */
    addTreeChild(
        parentIdentifier,
        data = {},
        addToTop,
        relativeToIdentifier
    ) {
        if (!isDataTreeEnabled(table)) return false;

        const parent = resolveRowComponent(
            table,
            crud,
            parentIdentifier
        );

        if (!parent) return false;

        let relativeTo;

        if (relativeToIdentifier !== undefined) {
            relativeTo = resolveRowComponent(
                table,
                crud,
                relativeToIdentifier
            );

            if (!relativeTo) return false;
        }

        return crud.addTreeChild(
            parent,
            data,
            addToTop,
            relativeTo
        );
    },

    /**
     * Expands one Data Tree row through the AMB Grid controller.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and `_ambTempId` values address the managed row
     * component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * Data Tree must be enabled for the operation to be delegated. Expansion
     * changes only Data Tree runtime state managed by the underlying table
     * engine. Row data, snapshots, CRUD state and AMB Grid save payloads are
     * not modified. The returned `true` means the operation was delegated, not
     * that the row had children or changed state. `false` is returned when Data
     * Tree, the row or the operation is not available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {boolean} `true` when expansion is delegated, otherwise `false`.
     */
    expandTreeRow(identifier) {
        const row = resolveTreeRowOperation(table, crud, identifier, 'treeExpand');

        if (!row) return false;

        row.treeExpand();
        return true;
    },

    /**
     * Collapses one Data Tree row through the AMB Grid controller.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and `_ambTempId` values address the managed row
     * component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * Data Tree must be enabled for the operation to be delegated. Collapse
     * changes only Data Tree runtime state managed by the underlying table
     * engine. Row data, snapshots, CRUD state and AMB Grid save payloads are
     * not modified. The returned `true` means the operation was delegated, not
     * that the row had children or changed state. `false` is returned when Data
     * Tree, the row or the operation is not available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {boolean} `true` when collapse is delegated, otherwise `false`.
     */
    collapseTreeRow(identifier) {
        const row = resolveTreeRowOperation(table, crud, identifier, 'treeCollapse');

        if (!row) return false;

        row.treeCollapse();
        return true;
    },

    /**
     * Toggles one Data Tree row through the AMB Grid controller.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and `_ambTempId` values address the managed row
     * component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * Data Tree must be enabled for the operation to be delegated. Toggling
     * changes only Data Tree runtime state managed by the underlying table
     * engine. Row data, snapshots, CRUD state and AMB Grid save payloads are
     * not modified. The returned `true` means the operation was delegated, not
     * that the row had children or changed state. `false` is returned when Data
     * Tree, the row or the operation is not available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {boolean} `true` when toggle is delegated, otherwise `false`.
     */
    toggleTreeRow(identifier) {
        const row = resolveTreeRowOperation(table, crud, identifier, 'treeToggle');

        if (!row) return false;

        row.treeToggle();
        return true;
    },

    /**
     * Returns the parent Row Component for one Data Tree row.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and `_ambTempId` values address the managed row
     * component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * Data Tree must be enabled. This method reads Data Tree runtime state from
     * the underlying table engine and does not modify row data, snapshots, CRUD
     * state or AMB Grid save payloads. It returns the parent managed row
     * component by identity, or `false` when Data Tree, the row or the
     * operation is not available, or when the underlying table engine reports
     * that the row is a root.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {object|false} Parent Row Component, or `false`.
     */
    getTreeParent(identifier) {
        const row = resolveTreeRowOperation(table, crud, identifier, 'getTreeParent');

        if (!row) return false;

        return row.getTreeParent();
    },

    /**
     * Returns the direct child Row Components for one Data Tree row.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and `_ambTempId` values address the managed row
     * component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * Data Tree must be enabled. This method reads Data Tree runtime state from
     * the underlying table engine and does not modify row data, snapshots, CRUD
     * state or AMB Grid save payloads. It returns the direct child managed row
     * components by identity, preserving the engine array, empty arrays and row
     * component references. `false` is returned when Data Tree, the row or the
     * operation is not available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {object[]|false} Direct child Row Components, or `false`.
     */
    getTreeChildren(identifier) {
        const row = resolveTreeRowOperation(table, crud, identifier, 'getTreeChildren');

        if (!row) return false;

        return row.getTreeChildren();
    },

    /**
     * Reports whether one Data Tree row is expanded.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and `_ambTempId` values address the managed row
     * component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * Data Tree must be enabled. This method reads Data Tree runtime state from
     * the underlying table engine and does not modify row data, snapshots, CRUD
     * state or AMB Grid save payloads. It preserves both `true` and `false`
     * returned by the engine. `false` is also returned when Data Tree, the row
     * or the operation is not available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {boolean} Current Data Tree expanded state, or `false` when unavailable.
     */
    isTreeExpanded(identifier) {
        const row = resolveTreeRowOperation(table, crud, identifier, 'isTreeExpanded');

        if (!row) return false;

        return row.isTreeExpanded();
    },

    /**
     * Registers a callback for runtime display-position changes of one row.
     *
     * Backend identifiers, `_ambTempId` values and other supported lookups are
     * resolved through the AMB Grid row resolver. The callback is forwarded by
     * identity and receives the position values produced by the runtime engine,
     * without AMB normalization. The engine invokes it immediately with the
     * current position and can invoke it again when filtering, sorting,
     * grouping, pagination or other runtime changes affect the displayed
     * position.
     *
     * This observation does not modify row data, snapshots, errors or CRUD
     * state. The current runtime engine exposes no public unsubscribe mechanism
     * for this registration. `true` means registration was delegated; `false`
     * means the callback, row or operation is unavailable.
     *
     * @param {*} identifier - Backend id, AMB temporary id, or supported row lookup value.
     * @param {Function} callback - Runtime position callback forwarded by identity.
     * @returns {boolean} `true` when registration is delegated, otherwise `false`.
     */
    watchRowPosition(identifier, callback) {
        if (typeof callback !== 'function') return false;

        const row = resolveRowComponent(
            table,
            crud,
            identifier
        );

        if (
            !row
            || typeof row.watchPosition !== 'function'
        ) {
            return false;
        }

        row.watchPosition(callback);
        return true;
    },

    /**
     * Returns the current numerical position of a row.
     *
     * Positions start at 1. Backend identifiers and AMB Grid temporary
     * identifiers are resolved through the CRUD layer, while other supported row
     * lookup values retain their normal behavior.
     *
     * The method returns `false` when a position is not currently available and
     * does not modify the row or grid state.
     *
     * @param {*} identifier - Backend id, AMB temporary id, or supported row lookup value.
     * @param {...any} args - Additional position lookup arguments.
     * @returns {number|false} Current one-based row position, or `false`.
     */
    getRowPosition(identifier, ...args) {
        const ambRow = crud.findRowByKey(identifier);

        return table.getRowPosition(ambRow || identifier, ...args);
    },

    /**
     * Returns the row component at a numerical position.
     *
     * Positions start at 1. The returned component exposes advanced row
     * operations, so direct mutations may bypass or interfere with AMB Grid CRUD
     * tracking.
     *
     * @param {...any} args - Position lookup arguments.
     * @returns {object|false} Row component at the requested position, or `false`.
     */
    getRowFromPosition(...args) {
        return table.getRowFromPosition(...args);
    },

    /**
     * Moves one managed row component relative to another in a flat grid.
     *
     * The AMB Grid controller public controller API resolves both rows from
     * backend ids, `_ambTempId` values or other supported lookups. The move
     * changes runtime order only: `true` places the source above the target and
     * `false` places it below. AMB Grid delegates the operation internally to
     * the underlying table engine, then realigns technical row numbering.
     *
     * Application data and CRUD state are not modified. Grouping and Data Tree
     * are not supported by this controlled runtime operation. `false` indicates
     * that the operation is unavailable or invalid.
     *
     * @param {*} rowIdentifier - Identifier or supported lookup for the managed row component to move.
     * @param {*} targetIdentifier - Identifier or supported lookup for the target managed row component.
     * @param {*} aboveTarget - Relative position flag forwarded unchanged.
     * @returns {*|false} Result from the underlying table engine, or `false`.
     */
    moveRow(
        rowIdentifier,
        targetIdentifier,
        aboveTarget
    ) {
        if (
            isDataTreeEnabled(table)
            || isGroupingEnabled(table)
        ) {
            return false;
        }

        const row = resolveRowComponent(
            table,
            crud,
            rowIdentifier
        );
        const targetRow = resolveRowComponent(
            table,
            crud,
            targetIdentifier
        );

        if (!row || !targetRow || row === targetRow) {
            return false;
        }

        return crud.moveRow(
            row,
            targetRow,
            aboveTarget
        );
    },

    /**
     * Returns row components matching a filter definition.
     *
     * This is a one-off query and does not modify the current programmatic
     * filters, header filters or AMB Grid global search state.
     *
     * Returned components expose advanced runtime operations. Direct mutations
     * may bypass or interfere with AMB Grid CRUD tracking.
     *
     * @param {...*} args - Filter definition arguments.
     * @returns {object[]} Matching row components.
     */
    searchRows(...args) {
        return table.searchRows(...args);
    },

    /**
     * Scrolls vertically to a grid row.
     *
     * Backend identifiers and AMB Grid temporary identifiers are resolved
     * through the CRUD layer before the operation is delegated. Other supported
     * row lookup values are forwarded unchanged.
     *
     * The optional position controls where the row appears in the viewport.
     * The optional visibility flag controls whether scrolling also occurs when
     * the row is already visible.
     *
     * This method does not change pagination, selection, focus, row data or
     * CRUD state.
     *
     * @param {*} identifier - Backend id, AMB temporary id or supported row lookup.
     * @param {'top'|'center'|'bottom'|'nearest'} [position] - Requested viewport position.
     * @param {boolean} [scrollIfVisible] - Scroll even when the row is already visible.
     * @returns {Promise<void>} Original scrolling promise.
     */
    scrollToRow(identifier, ...args) {
        const ambRow = crud.findRowByKey(identifier);

        return table.scrollToRow(ambRow || identifier, ...args);
    }
});
