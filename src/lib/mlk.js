import { LookupDialog } from '../ui/lookup-dialog.js';
import { lookup as lookupEditor } from './editors/lookup-editor.js';

const DEFAULT_DERIVED_CLASS = 'amb-cell--readonly-passive amb-cell--derived';
const DEFAULT_ACTIONABLE_CLASS = 'amb-cell--readonly-actionable amb-cell--actionable';

const isBlank = value => value === null || value === undefined || value === '';

const requireNonEmptyString = (value, name) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`AMB.mlk requires ${name} to be a non-empty string`);
    }

    return value.trim();
};

const normalizeMasterField = masterField => {
    if (!masterField || typeof masterField !== 'object') {
        throw new Error('AMB.mlk requires masterField');
    }

    return {
        title: masterField.title,
        required: masterField.required === true,
        autocomplete: masterField.autocomplete !== false,
        dialog: masterField.dialog !== false,
        ...masterField,
        field: requireNonEmptyString(masterField.field, 'masterField.field'),
        from: requireNonEmptyString(masterField.from, 'masterField.from')
    };
};

const normalizeDependentField = dependentField => {
    if (!dependentField || typeof dependentField !== 'object') {
        throw new Error('AMB.mlk dependentFields entries must be objects');
    }

    const visibleInLookup = dependentField.visibleInLookup !== false;

    return {
        readonly: true,
        visibleInGrid: true,
        visibleInLookup,
        searchable: visibleInLookup,
        required: false,
        ...dependentField,
        field: requireNonEmptyString(dependentField.field, 'dependentFields.field'),
        from: requireNonEmptyString(dependentField.from, 'dependentFields.from'),
        readonly: dependentField.readonly !== false
    };
};

const assertRecordLookup = lookup => {
    if (!lookup || typeof lookup !== 'object') {
        throw new Error('AMB.mlk requires a record-based lookup');
    }

    if (typeof lookup.keyField !== 'string' || !lookup.keyField) {
        throw new Error('AMB.mlk requires a record-based lookup with keyField');
    }

    if (typeof lookup.load !== 'function' || typeof lookup.getByKey !== 'function') {
        throw new Error('AMB.mlk lookup must expose load() and getByKey()');
    }
};

const mergeCssClass = (...classes) => {
    return classes
        .filter(Boolean)
        .join(' ')
        .trim();
};

/**
 * Create a Multifield Lookup (MLK) definition.
 *
 * `AMB.mlk(...)` links one editable master cell to a complete lookup record.
 * A normal lookup answers "which value goes in this cell?"; an MLK answers
 * "which external record is attached to this row, and which row fields must
 * be updated together?". The mapping is explicit: every `{ from, field }`
 * pair maps `lookupRecord[from]` to `row[field]`.
 *
 * Keyboard behavior is inherited from the lookup editor: when the master cell
 * is closed, `Enter` opens the lookup dialog and `Tab`/`Shift+Tab` navigate
 * between cells. When the dialog is open, focus remains in the dialog,
 * arrows move selection, `Enter` selects, and `Escape` closes.
 *
 * @param {object} options - MLK options.
 * @param {string} options.id - Non-empty MLK identifier for diagnostics.
 * @param {object} options.lookup - Record-based `AMB.lookup(...)` instance.
 * @param {object} options.masterField - Master field definition.
 * @param {string} options.masterField.field - Row field updated by the master.
 * @param {string} options.masterField.from - Lookup record field mapped to the master.
 * @param {object[]} [options.dependentFields=[]] - Dependent readonly fields.
 * @param {boolean} [options.clearDependentsOnInvalidMaster=true] - Clear dependents when typed master is invalid.
 * @param {boolean} [options.clearDependentsOnEmptyMaster=true] - Clear dependents when master is empty.
 * @param {boolean} [options.readonlyDependents=true] - Make dependent columns readonly by default.
 * @returns {object} MLK definition and column helpers.
 */
export function createMultifieldLookup(options = {}) {
    const id = requireNonEmptyString(options.id, 'id');
    const lookup = options.lookup;

    assertRecordLookup(lookup);

    const masterField = normalizeMasterField(options.masterField);
    const dependentFields = (options.dependentFields || []).map(normalizeDependentField);
    const dependentByField = new Map(
        dependentFields.map(dependentField => [dependentField.field, dependentField])
    );
    const clearDependentsOnInvalidMaster = options.clearDependentsOnInvalidMaster !== false;
    const clearDependentsOnEmptyMaster = options.clearDependentsOnEmptyMaster !== false;
    const readonlyDependents = options.readonlyDependents !== false;
    const mappingEntries = [
        {
            role: 'master',
            field: masterField.field,
            from: masterField.from
        },
        ...dependentFields.map(dependentField => ({
            role: 'dependent',
            field: dependentField.field,
            from: dependentField.from
        }))
    ];
    const mapToRow = Object.fromEntries(
        mappingEntries.map(entry => [entry.field, entry.from])
    );
    const visibleLookupColumns = mappingEntries
        .filter(entry => entry.role === 'master'
            || dependentByField.get(entry.field)?.visibleInLookup !== false)
        .map(entry => {
            const source = entry.role === 'master'
                ? masterField
                : dependentByField.get(entry.field);

            return {
                field: entry.from,
                title: source.title || entry.from,
                visible: true,
                width: source.lookupWidth || source.width
            };
        });
    const searchableFields = mappingEntries
        .filter(entry => entry.role === 'master'
            || dependentByField.get(entry.field)?.searchable !== false)
        .map(entry => entry.from);

    const createPatch = record => {
        if (!record || typeof record !== 'object') return null;

        return Object.fromEntries(
            mappingEntries.map(entry => [entry.field, record[entry.from] ?? ''])
        );
    };

    const createClearPatch = ({ includeMaster = false, masterValue = '' } = {}) => {
        const patch = Object.fromEntries(
            dependentFields.map(dependentField => [dependentField.field, ''])
        );

        if (includeMaster) {
            patch[masterField.field] = masterValue;
        }

        return patch;
    };

    const isRecordValid = record => {
        if (!record || typeof record !== 'object') return false;
        if (isBlank(record[masterField.from])) return false;

        return dependentFields.every(dependentField => {
            return !dependentField.required || !isBlank(record[dependentField.from]);
        });
    };

    const validateMasterValue = (value, rowData) => {
        if (isBlank(value)) return !masterField.required;

        return dependentFields.every(dependentField => {
            return !dependentField.required || !isBlank(rowData[dependentField.field]);
        });
    };

    const masterColumn = (columnOptions = {}) => {
        const dialog = columnOptions.dialog
            || options.dialog
            || (masterField.dialog === false ? null : new LookupDialog());
        const autocompleteOptions = masterField.autocomplete === false
            ? {}
            : {
                autoComplete: true,
                autoCompleteMinChars: masterField.autoCompleteMinChars || 1,
                autoCompleteOnTab: masterField.autoCompleteOnTab !== false
            };
        const {
            dialog: _dialog,
            validation,
            validator,
            cssClass,
            ...restColumnOptions
        } = columnOptions;

        return {
            title: masterField.title || masterField.field,
            field: masterField.field,
            required: masterField.required,
            cssClass: mergeCssClass(DEFAULT_ACTIONABLE_CLASS, cssClass),
            ...restColumnOptions,
            editor: lookupEditor(lookup, {
                allowEmpty: !masterField.required,
                dialog,
                columns: visibleLookupColumns,
                search: {
                    fields: searchableFields
                },
                mapToRow,
                invalidMessage: `Select a valid ${masterField.title || masterField.field}`,
                clearMappedFieldsOnEmpty: clearDependentsOnEmptyMaster,
                clearMappedFieldsOnInvalid: clearDependentsOnInvalidMaster,
                buildEmptyPatch: () => createClearPatch({
                    includeMaster: true,
                    masterValue: ''
                }),
                buildInvalidPatch: ({ value }) => createClearPatch({
                    includeMaster: false,
                    masterValue: value
                }),
                ...autocompleteOptions,
                ...(columnOptions.editorOptions || {})
            }),
            validation: {
                ...validation
            },
            validator: validator || {
                message: `Select a valid ${masterField.title || masterField.field}`,
                validate: validateMasterValue
            }
        };
    };

    const dependentColumn = (field, columnOptions = {}) => {
        const dependentField = dependentByField.get(field);

        if (!dependentField) {
            throw new Error(`AMB.mlk "${id}" does not define dependent field "${field}"`);
        }

        const {
            editable,
            editor,
            cssClass,
            validator,
            ...restColumnOptions
        } = columnOptions;

        return {
            title: dependentField.title || dependentField.field,
            field: dependentField.field,
            visible: dependentField.visibleInGrid !== false,
            required: false,
            validator: validator || (dependentField.required === true
                ? {
                    message: `${dependentField.title || dependentField.field} is required for ${masterField.title || masterField.field}`,
                    validate(value, rowData) {
                        if (isBlank(rowData[masterField.field])) return true;

                        return !isBlank(value);
                    }
                }
                : undefined),
            cssClass: mergeCssClass(
                readonlyDependents && dependentField.readonly
                    ? DEFAULT_DERIVED_CLASS
                    : null,
                cssClass
            ),
            ...restColumnOptions,
            editable: readonlyDependents && dependentField.readonly
                ? false
                : editable,
            editor: readonlyDependents && dependentField.readonly
                ? undefined
                : editor
        };
    };

    return {
        id,
        lookup,
        masterField,
        dependentFields,
        clearDependentsOnInvalidMaster,
        clearDependentsOnEmptyMaster,
        readonlyDependents,
        mapping: mappingEntries.map(entry => ({ ...entry })),
        mapToRow,
        lookupColumns: visibleLookupColumns.map(column => ({ ...column })),
        searchFields: [...searchableFields],
        createPatch,
        createClearPatch,
        isRecordValid,
        validateMasterValue,
        masterColumn,
        dependentColumn
    };
}

export const mlk = createMultifieldLookup;
