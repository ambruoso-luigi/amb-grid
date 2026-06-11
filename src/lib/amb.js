import { ConfirmDialog } from '../ui/confirm-dialog.js';
import { LookupDialog } from '../ui/lookup-dialog.js';
import { SearchFiltersDialog } from '../ui/search-filters-dialog.js';
import { editors } from './editors.js';
import { formatters } from './formatters.js';
import { createLookup } from './lookup.js';
import { parsers } from './parsers.js';
import { createTable } from './table/index.js';
import { validators } from './validators.js';

/**
 * Public AMB Grid namespace.
 *
 * @namespace AMB
 * @property {object} editors - Editor factories for Tabulator columns.
 * @property {object} formatters - Formatter factories for Tabulator columns.
 * @property {object} validators - Validator factories used by CrudHelper.
 * @property {object} parsers - Parser factories used by editors, formatters, and validators.
 * @property {Function} lookup - Primary lookup data source factory.
 * @property {Function} LookupDialog - Lookup selection dialog class.
 * @property {Function} ConfirmDialog - Confirmation dialog class.
 * @property {Function} SearchFiltersDialog - Search filter dialog class.
 */
export const AMB = {
    validators,
    formatters,
    editors,
    parsers,
    lookup: createLookup,
    LookupDialog,
    ConfirmDialog,
    SearchFiltersDialog,
    table: createTable
};
