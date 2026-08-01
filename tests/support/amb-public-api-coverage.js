export const PACKAGE_ENTRY_EXPORTS = [
    'AMB',
    'CrudHelper',
    'ROW_STATE',
    'validators',
    'formatters',
    'editors',
    'parsers',
    'date',
    'createLookup',
    'createMultifieldLookup',
    'multifieldLookup',
    'ConfirmDialog',
    'LookupDialog',
    'SearchFiltersDialog',
    'FeedbackRegion'
];

export const AMB_NAMESPACE_API_COVERAGE = [
    {
        member: 'validators',
        source: 'lib/validators.js',
        classification: 'namespace',
        packageExport: 'validators',
        reason: 'AMB.validators exposes the certified AMB Grid validator factory namespace.'
    },
    {
        member: 'formatters',
        source: 'lib/formatters.js',
        classification: 'namespace',
        packageExport: 'formatters',
        reason: 'AMB.formatters exposes the certified AMB Grid formatter factory namespace.'
    },
    {
        member: 'editors',
        source: 'lib/editors.js',
        classification: 'namespace',
        packageExport: 'editors',
        reason: 'AMB.editors exposes the separately certified AMB Grid editor factory namespace.'
    },
    {
        member: 'parsers',
        source: 'lib/parsers.js',
        classification: 'namespace',
        packageExport: 'parsers',
        reason: 'AMB.parsers exposes the certified AMB Grid payload and value normalization namespace.'
    },
    {
        member: 'date',
        source: 'lib/date.js',
        classification: 'namespace',
        packageExport: 'date',
        reason: 'AMB.date exposes the shared AMB Grid date configuration namespace.'
    },
    {
        member: 'lookup',
        source: 'lib/lookup.js',
        classification: 'factory-alias',
        packageExport: 'createLookup',
        reason: 'AMB.lookup is the primary namespace alias of the public lookup data-source factory.'
    },
    {
        member: 'multifieldLookup',
        source: 'lib/multifield-lookup.js',
        classification: 'factory-alias',
        packageExport: 'createMultifieldLookup',
        reason: 'AMB.multifieldLookup is the primary namespace alias of the public multifield lookup factory.'
    },
    {
        member: 'LookupDialog',
        source: 'ui/lookup-dialog.js',
        classification: 'class',
        packageExport: 'LookupDialog',
        reason: 'AMB.LookupDialog exposes the certified searchable selection dialog class.'
    },
    {
        member: 'FeedbackRegion',
        source: 'ui/feedback-region.js',
        classification: 'class',
        packageExport: 'FeedbackRegion',
        reason: 'AMB.FeedbackRegion exposes the certified accessible feedback region class.'
    },
    {
        member: 'ConfirmDialog',
        source: 'ui/confirm-dialog.js',
        classification: 'class',
        packageExport: 'ConfirmDialog',
        reason: 'AMB.ConfirmDialog exposes the certified promise-based confirmation dialog class.'
    },
    {
        member: 'SearchFiltersDialog',
        source: 'ui/search-filters-dialog.js',
        classification: 'class',
        packageExport: 'SearchFiltersDialog',
        reason: 'AMB.SearchFiltersDialog exposes the certified search-field configuration dialog class.'
    },
    {
        member: 'table',
        source: 'lib/table/index.js',
        classification: 'factory',
        packageExport: null,
        reason: 'AMB.table is the primary public factory for creating an AMB Grid instance.'
    }
];

export const SUPPORT_NAMESPACE_MEMBERS = {
    validators: [
        'required',
        'pattern',
        'email',
        'iban',
        'italianIban',
        'codiceFiscale',
        'number',
        'integer',
        'decimal',
        'date',
        'range',
        'min',
        'max',
        'minLength',
        'maxLength',
        'unique',
        'allowedValues',
        'custom',
        'anyOf',
        'allOf'
    ],
    formatters: [
        'text',
        'uppercase',
        'lowercase',
        'decimal',
        'integer',
        'currency',
        'date',
        'percent',
        'percentFromRatio',
        'emptyPlaceholder',
        'checkbox',
        'largeTextPreview'
    ],
    parsers: [
        'date',
        'decimalToPayload',
        'integerToPayload',
        'dateToPayload',
        'dateTimeToPayload',
        'trim',
        'emptyToNull',
        'uppercase',
        'removeSpaces',
        'digitsOnly',
        'ibanToPayload',
        'fiscalCodeToPayload'
    ],
    date: [
        'createConfig'
    ]
};
