import { ConfirmDialog } from '../ui/confirm-dialog.js';
import { date } from './date.js';
import { LookupDialog } from '../ui/lookup-dialog.js';
import { FeedbackRegion } from '../ui/feedback-region.js';
import { SearchFiltersDialog } from '../ui/search-filters-dialog.js';
import { editors } from './editors.js';
import { formatters } from './formatters.js';
import { createLookup } from './lookup.js';
import { createMultifieldLookup } from './mlk.js';
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
 * @property {object} date - Date configuration helpers.
 * @property {Function} lookup - Primary lookup data source factory.
 * @property {Function} mlk - Multifield Lookup factory for record-to-row field groups.
 * @property {Function} LookupDialog - Lookup selection dialog class.
 * @property {Function} FeedbackRegion - Accessible status region class.
 * @property {Function} ConfirmDialog - Confirmation dialog class.
 * @property {Function} SearchFiltersDialog - Search filter dialog class.
 */
export const AMB = {
    validators,
    formatters,
    editors,
    parsers,
    date,
    lookup: createLookup,
    mlk: createMultifieldLookup,
    LookupDialog,
    FeedbackRegion,
    ConfirmDialog,
    SearchFiltersDialog,
    table: createTable
};
