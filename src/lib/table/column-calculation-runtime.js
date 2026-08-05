import { ROW_STATE } from '../crud-helper.js';

const CALCULATION_POSITIONS = ['top', 'bottom'];
const CALCULATION_WRAPPER = Symbol('ambCalculationWrapper');
const PARAMS_WRAPPER = Symbol('ambCalculationParamsWrapper');

const getStateField = getCrud => {
    const crud = typeof getCrud === 'function' ? getCrud() : null;

    return crud && crud.options && crud.options.stateField
        ? crud.options.stateField
        : '_state';
};

/**
 * Filters calculation values and row data together, preserving order and row identity.
 *
 * @param {Array} values - Values supplied by the calculation engine.
 * @param {Array} data - Runtime row data supplied by the calculation engine.
 * @param {Function} getCrud - Return the current CRUD helper.
 * @returns {{values: Array, data: Array}} Paired calculation inputs without deleted rows.
 * @private
 * @internal
 */
export const filterDeletedCalculationRows = (
    values,
    data,
    getCrud = () => null
) => {
    if (!Array.isArray(values) || !Array.isArray(data)) {
        return { values, data };
    }

    const stateField = getStateField(getCrud);
    const filteredValues = [];
    const filteredData = [];

    data.forEach((rowData, index) => {
        if (
            rowData
            && (rowData[stateField] || ROW_STATE.CLEAN) === ROW_STATE.DELETED
        ) {
            return;
        }

        filteredValues.push(values[index]);
        filteredData.push(rowData);
    });

    return {
        values: filteredValues,
        data: filteredData
    };
};

const resolveRegisteredCalculation = (getTable, name) => {
    const table = typeof getTable === 'function' ? getTable() : null;
    const columnCalcs = table
        && table.modules
        && table.modules.columnCalcs;
    const registry = columnCalcs
        && columnCalcs.constructor
        && columnCalcs.constructor.calculations;
    const calculation = registry && registry[name];

    return typeof calculation === 'function' ? calculation : null;
};

const wrapCalculationParams = (params, getCrud) => {
    if (typeof params !== 'function' || params[PARAMS_WRAPPER]) {
        return params;
    }

    const wrappedParams = function (values, data) {
        const filtered = filterDeletedCalculationRows(values, data, getCrud);

        return params.call(this, filtered.values, filtered.data);
    };

    Object.defineProperty(wrappedParams, PARAMS_WRAPPER, { value: true });

    return wrappedParams;
};

const wrapCalculation = (calculation, getCrud, getTable) => {
    if (
        (typeof calculation !== 'function' && typeof calculation !== 'string')
        || calculation[CALCULATION_WRAPPER]
    ) {
        return calculation;
    }

    const wrappedCalculation = function (values, data, params) {
        const filtered = filterDeletedCalculationRows(values, data, getCrud);
        const implementation = typeof calculation === 'string'
            ? resolveRegisteredCalculation(getTable, calculation)
            : calculation;

        if (!implementation) return undefined;

        return implementation.call(
            this,
            filtered.values,
            filtered.data,
            params
        );
    };

    Object.defineProperty(wrappedCalculation, CALCULATION_WRAPPER, {
        value: true
    });

    return wrappedCalculation;
};

/**
 * Prepares table and group calculations to ignore rows in CRUD deleted state.
 *
 * @param {object[]} columns - Application column definitions.
 * @param {Function} getCrud - Return the current CRUD helper.
 * @param {Function} getTable - Return the current internal table instance.
 * @returns {object[]} Independently prepared column definitions.
 * @private
 * @internal
 */
export const prepareColumnCalculations = (
    columns = [],
    getCrud = () => null,
    getTable = () => null
) => {
    return (columns || []).map(column => {
        const nextColumn = { ...column };

        if (nextColumn.columns) {
            nextColumn.columns = prepareColumnCalculations(
                nextColumn.columns,
                getCrud,
                getTable
            );
        }

        CALCULATION_POSITIONS.forEach(position => {
            const calculationKey = `${position}Calc`;
            const paramsKey = `${calculationKey}Params`;

            if (nextColumn[calculationKey] !== undefined) {
                nextColumn[calculationKey] = wrapCalculation(
                    nextColumn[calculationKey],
                    getCrud,
                    getTable
                );
            }

            if (nextColumn[paramsKey] !== undefined) {
                nextColumn[paramsKey] = wrapCalculationParams(
                    nextColumn[paramsKey],
                    getCrud
                );
            }
        });

        return nextColumn;
    });
};

/**
 * Recalculates table and group calculations when a row enters or leaves deleted state.
 *
 * @param {object} table - Internal table engine.
 * @param {object} crud - AMB CRUD helper.
 * @returns {Function} Unsubscribe callback.
 * @private
 * @internal
 */
export const bindDeletedRowCalculationRecalc = (table, crud) => {
    if (!crud || typeof crud.on !== 'function') return () => {};

    return crud.on('row-state-changed', ({ previousState, nextState }) => {
        const wasDeleted = previousState === ROW_STATE.DELETED;
        const isDeleted = nextState === ROW_STATE.DELETED;

        if (wasDeleted === isDeleted) return;
        if (!table || typeof table.recalc !== 'function') return;

        table.recalc();
    });
};
