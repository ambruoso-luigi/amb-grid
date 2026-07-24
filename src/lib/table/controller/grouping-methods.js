/**
 * Reads a value from an AMB-provided runtime Group Component.
 *
 * @param {object} group - Group Component obtained through AMB Grid.
 * @param {string} methodName - Group Component read method to call.
 * @returns {*|false} Runtime value, or `false` when unavailable.
 * @private
 * @internal
 */
const readGroup = (group, methodName) => {
    if (!group || typeof group[methodName] !== 'function') {
        return false;
    }

    return group[methodName]();
};

/**
 * Runs a runtime action on an AMB-provided Group Component.
 *
 * @param {object} group - Group Component obtained through AMB Grid.
 * @param {string} methodName - Group Component action method to call.
 * @returns {boolean} `true` when delegated, or `false` when unavailable.
 * @private
 * @internal
 */
const runGroupAction = (group, methodName) => {
    if (!group || typeof group[methodName] !== 'function') {
        return false;
    }

    group[methodName]();
    return true;
};

/**
 * Creates the row-grouping methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Grouping methods for the flat controller API.
 * @private
 * @internal
 */
export const createGroupingMethods = ({ table }) => ({
    /**
     * Returns the current data in the runtime grouped output order.
     *
     * When grouping is active, the result contains group-header descriptors and
     * row data in grouped display order. When grouping is inactive, the runtime
     * returns the normal table data representation.
     *
     * Group-header descriptors can contain properties such as `level`,
     * `rowCount` and `headerContent`. This output is not an AMB Grid save payload
     * and must not be used to infer CRUD state.
     *
     * @returns {Array} Current grouped data output.
     */
    getGroupedData() {
        return table.getGroupedData();
    },

    /**
     * Returns the current top-level group components.
     *
     * Group components expose the current runtime group structure and advanced
     * operations for inspecting or controlling individual groups. Nested groups
     * remain available through their parent components.
     *
     * The returned array and components retain their runtime identities and
     * should be treated carefully. Direct component operations can affect the
     * grid outside higher-level AMB Grid workflows.
     *
     * @returns {object[]} Current top-level group components.
     */
    getGroups() {
        return table.getGroups();
    },

    /**
     * Returns the runtime key for a Group Component obtained through AMB Grid.
     *
     * The group component is read directly and the runtime key is returned
     * without conversion, including falsy keys. Group components are advanced
     * objects; direct mutation of returned component-related values can bypass
     * normal AMB Grid workflows. Data and CRUD state are not modified. `false`
     * indicates the component or operation is unavailable.
     *
     * @param {object} group - Group Component obtained through AMB Grid.
     * @returns {*|false} Runtime group key, or `false` when unavailable.
     */
    getGroupKey(group) {
        return readGroup(group, 'getKey');
    },

    /**
     * Returns the runtime grouping field for a Group Component obtained through AMB Grid.
     *
     * The field is read from the provided group component without rebuilding it
     * from table configuration. Group components are advanced runtime objects;
     * direct mutation of returned component-related values can bypass normal AMB
     * Grid workflows. Data and CRUD state are not modified. `false` indicates
     * the component or operation is unavailable.
     *
     * @param {object} group - Group Component obtained through AMB Grid.
     * @returns {*|false} Runtime grouping field, or `false` when unavailable.
     */
    getGroupField(group) {
        return readGroup(group, 'getField');
    },

    /**
     * Returns the runtime DOM element for a Group Component obtained through AMB Grid.
     *
     * The element is returned by identity and without copies. The DOM node is an
     * advanced runtime object; manipulating it directly can bypass normal AMB
     * Grid behavior and workflows. Data and CRUD state are not modified. `false`
     * indicates the component or operation is unavailable.
     *
     * @param {object} group - Group Component obtained through AMB Grid.
     * @returns {Element|false} Runtime group DOM element, or `false` when unavailable.
     */
    getGroupElement(group) {
        return readGroup(group, 'getElement');
    },

    /**
     * Returns runtime Row Components for a Group Component obtained through AMB Grid.
     *
     * The array, contained Row Components and runtime order are returned without
     * copies or transformation, including an empty array. Row Components are
     * advanced runtime objects; direct mutation can bypass normal AMB Grid
     * workflows. Data and CRUD state are not modified. `false` indicates the
     * component or operation is unavailable.
     *
     * @param {object} group - Group Component obtained through AMB Grid.
     * @returns {Array<object>|false} Runtime Row Components, or `false` when unavailable.
     */
    getGroupRows(group) {
        return readGroup(group, 'getRows');
    },

    /**
     * Returns runtime child Group Components for a Group Component obtained through AMB Grid.
     *
     * The child group array and contained Group Components are returned without
     * copies. Group Components are advanced runtime objects; direct mutation can
     * bypass normal AMB Grid workflows. Data and CRUD state are not modified.
     * `false` indicates the component, relation or operation is unavailable.
     *
     * @param {object} group - Group Component obtained through AMB Grid.
     * @returns {Array<object>|false} Runtime child Group Components, or `false` when unavailable.
     */
    getGroupSubGroups(group) {
        return readGroup(group, 'getSubGroups');
    },

    /**
     * Returns the runtime parent Group Component for a Group Component obtained through AMB Grid.
     *
     * The parent component is returned by identity and without copies. Group
     * Components are advanced runtime objects; direct mutation can bypass normal
     * AMB Grid workflows. Data and CRUD state are not modified. `false`
     * indicates the component, relation or operation is unavailable.
     *
     * @param {object} group - Group Component obtained through AMB Grid.
     * @returns {object|false} Runtime parent Group Component, or `false` when unavailable.
     */
    getGroupParent(group) {
        return readGroup(group, 'getParentGroup');
    },

    /**
     * Returns the runtime visibility state for a Group Component obtained through AMB Grid.
     *
     * The visibility value is read directly from the group component and both
     * `true` and `false` are preserved. This method does not show, hide, toggle
     * or scroll the group. Group Components are advanced runtime objects; direct
     * mutation can bypass normal AMB Grid workflows. Data and CRUD state are not
     * modified. `false` indicates the component or operation is unavailable, or
     * the group is currently not visible.
     *
     * @param {object} group - Group Component obtained through AMB Grid.
     * @returns {boolean|false} Runtime visibility state, or `false` when unavailable.
     */
    isGroupVisible(group) {
        return readGroup(group, 'isVisible');
    },

    /**
     * Shows a Group Component obtained through AMB Grid.
     *
     * This delegates to the runtime group component and can only change that
     * group's runtime open/visibility state. It does not rebuild grouping,
     * redraw the table, or modify row data and AMB Grid CRUD state. `false`
     * indicates the component or operation is unavailable. `true` indicates the
     * action was delegated to the runtime component.
     *
     * @param {object} group - Group Component obtained through AMB Grid.
     * @returns {boolean} `true` when delegated, or `false` when unavailable.
     */
    showGroup(group) {
        return runGroupAction(group, 'show');
    },

    /**
     * Hides a Group Component obtained through AMB Grid.
     *
     * This delegates to the runtime group component and can only change that
     * group's runtime open/visibility state. It does not rebuild grouping,
     * redraw the table, or modify row data and AMB Grid CRUD state. `false`
     * indicates the component or operation is unavailable. `true` indicates the
     * action was delegated to the runtime component.
     *
     * @param {object} group - Group Component obtained through AMB Grid.
     * @returns {boolean} `true` when delegated, or `false` when unavailable.
     */
    hideGroup(group) {
        return runGroupAction(group, 'hide');
    },

    /**
     * Toggles a Group Component obtained through AMB Grid.
     *
     * This delegates to the runtime group component and can only change that
     * group's runtime open/visibility state. It does not rebuild grouping,
     * redraw the table, or modify row data and AMB Grid CRUD state. `false`
     * indicates the component or operation is unavailable. `true` indicates the
     * action was delegated to the runtime component.
     *
     * @param {object} group - Group Component obtained through AMB Grid.
     * @returns {boolean} `true` when delegated, or `false` when unavailable.
     */
    toggleGroup(group) {
        return runGroupAction(group, 'toggle');
    },

    /**
     * Scrolls to a Group Component obtained through AMB Grid.
     *
     * The `position` and `ifVisible` values are forwarded unchanged so the
     * runtime engine can apply its own defaults when either value is
     * `undefined`. This can only change the displayed scroll position. It does
     * not rebuild grouping or modify row data and AMB Grid CRUD state. `false`
     * indicates the component or operation is unavailable. Otherwise, the
     * runtime scroll result is returned directly.
     *
     * @param {object} group - Group Component obtained through AMB Grid.
     * @param {*} position - Runtime scroll position forwarded unchanged.
     * @param {*} ifVisible - Runtime visibility behavior forwarded unchanged.
     * @returns {*|false} Runtime scroll result, or `false` when unavailable.
     */
    scrollToGroup(group, position, ifVisible) {
        if (!group || typeof group.scrollTo !== 'function') {
            return false;
        }

        return group.scrollTo(position, ifVisible);
    },

    /**
     * Changes the fields or functions used to group grid rows.
     *
     * A string or function creates one grouping level, while an array creates
     * multiple levels. Pass `false` to remove the current grouping.
     *
     * Grouping changes the runtime row organization but does not directly
     * modify row data or AMB Grid CRUD state.
     *
     * @param {string|Function|Array|false} groupBy - Runtime grouping definition.
     * @returns {*} Result of changing the grouping definition.
     */
    setGroupBy(groupBy) {
        return table.setGroupBy(groupBy);
    },

    /**
     * Changes the allowed group values for each grouping level.
     *
     * Rows whose values are outside the configured lists can be excluded from
     * the visible grouped structure according to the runtime grouping behavior.
     * This does not delete those rows or change their AMB Grid CRUD state.
     *
     * @param {Array} groupValues - Allowed values for each grouping level.
     * @returns {*} Result of updating the allowed group values.
     */
    setGroupValues(groupValues) {
        return table.setGroupValues(groupValues);
    },

    /**
     * Changes the initial open state used when groups are generated.
     *
     * The value can be a boolean, a callback, or a list of values for
     * multi-level grouping. Existing and future group rendering follows the
     * runtime grouping behavior.
     *
     * @param {boolean|Function|Array} groupStartOpen - Group opening definition.
     * @returns {*} Result of updating the opening definition.
     */
    setGroupStartOpen(groupStartOpen) {
        return table.setGroupStartOpen(groupStartOpen);
    },

    /**
     * Changes the formatter used to generate group headers.
     *
     * A callback can be supplied for one grouping level, or an array of
     * callbacks for multi-level grouping. Callback identities and returned
     * content are forwarded without AMB Grid transformations.
     *
     * @param {Function|Function[]} groupHeader - Group-header formatter definition.
     * @returns {*} Result of updating the group-header definition.
     */
    setGroupHeader(groupHeader) {
        return table.setGroupHeader(groupHeader);
    }
});
