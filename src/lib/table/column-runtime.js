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

const hasValidField = column => {
    return column
        && column.field !== null
        && column.field !== undefined
        && column.field !== '';
};

const isTechnicalField = field => {
    return typeof field === 'string' && field.startsWith('_');
};

const getColumnField = column => {
    return column && typeof column.getField === 'function'
        ? column.getField()
        : false;
};

const getManagedColumnType = column => {
    const definition = column
        && typeof column.getDefinition === 'function'
        ? column.getDefinition()
        : null;

    return definition && definition._ambManagedColumn
        ? definition._ambManagedColumn
        : null;
};

const isManagedColumn = column => {
    return Boolean(getManagedColumnType(column));
};

const collectColumnFields = columns => {
    const fields = [];

    (columns || []).forEach(column => {
        if (!column || typeof column !== 'object') return;

        if (hasValidField(column)) {
            fields.push(column.field);
        }

        if (column.columns) {
            fields.push(...collectColumnFields(column.columns));
        }
    });

    return fields;
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

const getComponentSubColumns = component => {
    if (!component || typeof component.getSubColumns !== 'function') return [];

    const subColumns = component.getSubColumns();

    return Array.isArray(subColumns) ? subColumns : [];
};

const collectComponentFields = component => {
    const subColumns = getComponentSubColumns(component);

    if (subColumns.length) {
        return subColumns.flatMap(collectComponentFields);
    }

    const field = getColumnField(component);

    return field === false || field === null || field === undefined || field === ''
        ? []
        : [field];
};

const arraysMatch = (first, second) => {
    return first.length === second.length
        && first.every((value, index) => value === second[index]);
};

const getCoherentRuntimeColumns = (
    table,
    applicationColumns,
    managedDefinitions
) => {
    const runtimeColumns = table.getColumns(true);

    if (!Array.isArray(runtimeColumns)) return null;

    const expectedManagedTypes = (managedDefinitions || [])
        .filter(Boolean)
        .map(definition => definition._ambManagedColumn);
    const runtimeManagedTypes = runtimeColumns
        .map(getManagedColumnType)
        .filter(Boolean);

    if (!arraysMatch(runtimeManagedTypes, expectedManagedTypes)) return null;

    let foundApplicationColumn = false;

    for (const column of runtimeColumns) {
        if (isManagedColumn(column)) {
            if (foundApplicationColumn) return null;
        } else {
            foundApplicationColumn = true;
        }
    }

    const applicationComponents = runtimeColumns.filter(column => {
        return !isManagedColumn(column);
    });

    if (applicationComponents.length !== applicationColumns.length) return null;

    const coherent = applicationColumns.every((column, index) => {
        const component = applicationComponents[index];
        const canonicalIsGroup = Boolean(
            column
            && Array.isArray(column.columns)
        );
        const componentSubColumns = getComponentSubColumns(component);
        const runtimeIsGroup = componentSubColumns.length > 0;

        if (canonicalIsGroup !== runtimeIsGroup) return false;

        return arraysMatch(
            collectColumnFields([column]),
            collectComponentFields(component)
        );
    });

    return coherent ? applicationComponents : null;
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
    const lookupIntroduced = !previousLookup && nextLookup;
    const lookupChanged = previousLookup
        && !hasSameLookupConfiguration(previousLookup, nextLookup);

    if (!lookupIntroduced && !lookupChanged) return;

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

const isValidAddedComponent = (column, field) => {
    return Boolean(
        column
        && typeof column === 'object'
        && typeof column.getField === 'function'
        && column.getField() === field
    );
};

/**
 * Coordinates transactional application column mutations for AMB Grid.
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

    const commonDependenciesAvailable = () => {
        const searchController = getSearchController();

        return Boolean(
            table
            && crud
            && typeof crud.replaceDeclarativeCellValidators === 'function'
            && lifecycleResources
            && (!searchController
                || typeof searchController.replaceColumns === 'function')
        );
    };

    const commitPipeline = (
        previousPipeline,
        candidatePipeline,
        affectedFields
    ) => {
        currentPipeline = candidatePipeline;

        affectedFields.forEach(field => {
            crud.replaceDeclarativeCellValidators(
                field,
                toCrudValidators(candidatePipeline.validators, field)
            );
        });

        if (lifecycleResources.unsubscribeLookupMetadata) {
            lifecycleResources.unsubscribeLookupMetadata();
        }

        affectedFields.forEach(field => {
            clearInvalidLookupMetadata(
                table,
                field,
                getLookupColumn(previousPipeline.lookupColumns, field),
                getLookupColumn(candidatePipeline.lookupColumns, field)
            );
        });

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
            if (
                !commonDependenciesAvailable()
                || typeof table.getColumn !== 'function'
                || typeof table.updateColumnDefinition !== 'function'
            ) {
                return false;
            }

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

            const previousPipeline = currentPipeline;
            const runtimeResult = table.updateColumnDefinition(
                field,
                preparedDefinition
            );

            return Promise.resolve(runtimeResult).then(newColumn => {
                commitPipeline(
                    previousPipeline,
                    candidatePipeline,
                    [field]
                );

                return newColumn;
            });
        },

        /**
         * Adds one unique top-level application data column through the
         * centralized AMB Grid preparation and synchronization lifecycle.
         *
         * @param {object} columnDefinition - New application column definition.
         * @param {*} before - Insert before the resolved position only when `true`.
         * @param {*} position - Optional supported runtime column lookup.
         * @returns {Promise<object>|false} New Column Component, or `false`.
         * @private
         * @internal
         */
        addColumn(columnDefinition, before = false, position) {
            if (!isObjectPatch(columnDefinition)) return false;
            if (
                'columns' in columnDefinition
                || '_ambManagedColumn' in columnDefinition
                || !hasValidField(columnDefinition)
                || isTechnicalField(columnDefinition.field)
            ) {
                return false;
            }
            const insertBefore = before === true;
            const hasPosition = position !== undefined;

            if (
                !commonDependenciesAvailable()
                || typeof table.getColumns !== 'function'
                || typeof table.addColumn !== 'function'
                || (
                    hasPosition
                    && typeof table.getColumn !== 'function'
                )
            ) {
                return false;
            }

            const field = columnDefinition.field;
            const canonicalFields = collectColumnFields(
                currentPipeline.applicationColumns
            );

            if (canonicalFields.includes(field)) return false;

            const applicationComponents = getCoherentRuntimeColumns(
                table,
                currentPipeline.applicationColumns,
                [
                    pipelineOptions.selectionColumn,
                    pipelineOptions.deleteColumn
                ]
            );

            if (!applicationComponents) return false;

            let runtimePosition;
            let insertionIndex;

            if (hasPosition) {
                runtimePosition = table.getColumn(position);

                if (
                    !runtimePosition
                    || isManagedColumn(runtimePosition)
                ) {
                    return false;
                }

                const positionIndex = applicationComponents.indexOf(
                    runtimePosition
                );

                if (positionIndex < 0) return false;

                insertionIndex = insertBefore
                    ? positionIndex
                    : positionIndex + 1;
            } else if (insertBefore && applicationComponents.length) {
                runtimePosition = applicationComponents[0];
                insertionIndex = 0;
            } else {
                insertionIndex = currentPipeline.applicationColumns.length;
            }

            const candidateColumns = [
                ...currentPipeline.applicationColumns
            ];
            const canonicalDefinition = {
                ...columnDefinition
            };

            candidateColumns.splice(
                insertionIndex,
                0,
                canonicalDefinition
            );

            const candidatePipeline = prepareColumnPipeline({
                ...pipelineOptions,
                columns: candidateColumns
            });

            candidatePipeline.applicationColumns = candidateColumns;

            const preparedDefinition =
                candidatePipeline.preparedDataColumns[insertionIndex];

            if (
                !preparedDefinition
                || preparedDefinition.field !== field
            ) {
                return false;
            }

            const previousPipeline = currentPipeline;
            const runtimeArguments = runtimePosition
                ? [
                    preparedDefinition,
                    insertBefore,
                    runtimePosition
                ]
                : [
                    preparedDefinition,
                    false
                ];
            const runtimeResult = table.addColumn(...runtimeArguments);

            return Promise.resolve(runtimeResult).then(newColumn => {
                if (!isValidAddedComponent(newColumn, field)) {
                    throw new Error(
                        'AMB Grid column addition did not return the expected Column Component'
                    );
                }

                commitPipeline(
                    previousPipeline,
                    candidatePipeline,
                    [field]
                );

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
