import { removeLookupMetadata } from '../lookup-metadata.js';
import {
    bindLookupMetadataInitialization,
    prepareColumnPipeline
} from './column-pipeline.js';

const isObjectPatch = patch => {
    return patch
        && typeof patch === 'object'
        && !Array.isArray(patch);
};

const getColumnField = column => {
    return column && typeof column.getField === 'function'
        ? column.getField()
        : false;
};

const isManagedColumn = column => {
    const definition = column
        && typeof column.getDefinition === 'function'
        ? column.getDefinition()
        : null;

    return Boolean(definition && definition._ambManagedColumn);
};

const findColumnByField = (columns, field) => {
    for (const column of columns || []) {
        if (!column || typeof column !== 'object') continue;
        if (column.field === field) return column;

        const nestedColumn = findColumnByField(column.columns, field);

        if (nestedColumn) return nestedColumn;
    }

    return null;
};

const patchColumnTree = (columns, field, patch) => {
    let updated = false;
    const nextColumns = (columns || []).map(column => {
        if (!column || typeof column !== 'object') return column;

        let nextColumn = { ...column };

        if (column.field === field) {
            updated = true;
            nextColumn = {
                ...nextColumn,
                ...patch
            };
        }

        if (column.columns) {
            const nestedResult = patchColumnTree(column.columns, field, patch);

            nextColumn.columns = nestedResult.columns;
            updated = updated || nestedResult.updated;
        }

        return nextColumn;
    });

    return {
        columns: nextColumns,
        updated
    };
};

const getLookupColumn = (lookupColumns, field) => {
    return (lookupColumns || []).find(column => column.field === field) || null;
};

const hasSameLookupConfiguration = (previousColumn, nextColumn) => {
    if (!previousColumn || !nextColumn) return previousColumn === nextColumn;

    const keys = new Set([
        ...Object.keys(previousColumn),
        ...Object.keys(nextColumn)
    ]);

    return [...keys].every(key => {
        return previousColumn[key] === nextColumn[key];
    });
};

const clearInvalidLookupMetadata = (
    table,
    field,
    previousLookup,
    nextLookup
) => {
    if (
        !previousLookup
        || hasSameLookupConfiguration(previousLookup, nextLookup)
    ) {
        return;
    }

    const rows = typeof table.getRows === 'function'
        ? table.getRows()
        : [];

    (rows || []).forEach(row => {
        const rowData = row && typeof row.getData === 'function'
            ? row.getData()
            : row;

        removeLookupMetadata(rowData, field);
    });
};

const toCrudValidators = (validators, field) => {
    return (validators || [])
        .filter(validator => {
            return validator.field === field
                && typeof validator.validate === 'function';
        })
        .map(validator => ({
            message: validator.message,
            validateFn: validator.validate
        }));
};

/**
 * Coordinates transactional application column updates for AMB Grid.
 *
 * Candidate definitions always originate from the unprepared canonical
 * application tree and pass through the centralized column pipeline. Runtime
 * success commits the candidate before declarative validators, lookup
 * metadata bindings and search columns are synchronized.
 *
 * @param {object} options - Internal runtime dependencies.
 * @param {object} options.table - Internal table engine.
 * @param {object} options.crud - AMB Grid CRUD and validation layer.
 * @param {object} options.initialPipeline - Initial centralized pipeline result.
 * @param {object} options.pipelineOptions - Stable centralized pipeline inputs.
 * @param {object} options.lifecycleResources - Mutable AMB lifecycle resources.
 * @param {Function} options.getSearchController - Return the current search controller.
 * @returns {object} Internal application column runtime coordinator.
 * @private
 * @internal
 */
export const createColumnRuntime = ({
    table,
    crud,
    initialPipeline,
    pipelineOptions,
    lifecycleResources,
    getSearchController
}) => {
    let currentPipeline = initialPipeline;

    const dependenciesAvailable = () => {
        const searchController = getSearchController();

        return Boolean(
            table
            && typeof table.getColumn === 'function'
            && typeof table.updateColumnDefinition === 'function'
            && crud
            && typeof crud.replaceDeclarativeCellValidators === 'function'
            && lifecycleResources
            && (!searchController
                || typeof searchController.replaceColumns === 'function')
        );
    };

    return {
        /**
         * Updates one canonical application data column and synchronizes its
         * prepared AMB Grid resources after runtime success.
         *
         * @param {*} columnLookup - Supported runtime column lookup.
         * @param {object} definitionPatch - Shallow application definition patch.
         * @returns {Promise<object>|false} New Column Component, or `false`.
         * @private
         * @internal
         */
        updateColumnDefinition(columnLookup, definitionPatch) {
            if (!isObjectPatch(definitionPatch)) return false;
            if (!dependenciesAvailable()) return false;

            const resolvedColumn = table.getColumn(columnLookup);

            if (!resolvedColumn || isManagedColumn(resolvedColumn)) return false;

            const field = getColumnField(resolvedColumn);

            if (!field) return false;
            if (
                Object.prototype.hasOwnProperty.call(definitionPatch, 'field')
                && definitionPatch.field !== field
            ) {
                return false;
            }
            if (!findColumnByField(currentPipeline.applicationColumns, field)) {
                return false;
            }

            const candidateTree = patchColumnTree(
                currentPipeline.applicationColumns,
                field,
                definitionPatch
            );

            if (!candidateTree.updated) return false;

            const candidatePipeline = prepareColumnPipeline({
                ...pipelineOptions,
                columns: candidateTree.columns
            });
            const preparedDefinition = findColumnByField(
                candidatePipeline.preparedDataColumns,
                field
            );

            if (!preparedDefinition) return false;

            const previousLookup = getLookupColumn(
                currentPipeline.lookupColumns,
                field
            );
            const nextLookup = getLookupColumn(
                candidatePipeline.lookupColumns,
                field
            );
            const runtimeResult = table.updateColumnDefinition(
                field,
                preparedDefinition
            );

            return Promise.resolve(runtimeResult).then(newColumn => {
                currentPipeline = candidatePipeline;
                crud.replaceDeclarativeCellValidators(
                    field,
                    toCrudValidators(candidatePipeline.validators, field)
                );

                if (lifecycleResources.unsubscribeLookupMetadata) {
                    lifecycleResources.unsubscribeLookupMetadata();
                }

                clearInvalidLookupMetadata(
                    table,
                    field,
                    previousLookup,
                    nextLookup
                );
                lifecycleResources.unsubscribeLookupMetadata =
                    bindLookupMetadataInitialization(
                        table,
                        candidatePipeline.lookupColumns
                    );

                const searchController = getSearchController();

                if (searchController) {
                    searchController.replaceColumns(
                        candidatePipeline.searchColumns
                    );
                }

                return newColumn;
            });
        },

        /**
         * Returns the current canonical application columns for internal
         * diagnostics without exposing them on the public controller.
         *
         * @returns {object[]} Current canonical application column tree.
         * @private
         * @internal
         */
        getApplicationColumns() {
            return currentPipeline.applicationColumns;
        }
    };
};
