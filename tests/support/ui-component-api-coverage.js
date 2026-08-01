export const UI_COMPONENT_API_COVERAGE = [
    {
        component: 'ConfirmDialog',
        publicExport: 'ConfirmDialog',
        source: 'ui/confirm-dialog.js',
        status: 'exposed',
        classification: 'promise-dialog',
        publicMethods: [
            'confirm',
            'destroy'
        ],
        reason: 'ConfirmDialog provides the AMB Grid promise-based confirmation contract and explicit lifecycle cleanup.'
    },
    {
        component: 'LookupDialog',
        publicExport: 'LookupDialog',
        source: 'ui/lookup-dialog.js',
        status: 'exposed',
        classification: 'promise-dialog',
        publicMethods: [
            'open',
            'close',
            'destroy'
        ],
        reason: 'LookupDialog provides the AMB Grid searchable selection dialog contract while keeping rendering, filtering and pagination helpers internal.'
    },
    {
        component: 'SearchFiltersDialog',
        publicExport: 'SearchFiltersDialog',
        source: 'ui/search-filters-dialog.js',
        status: 'exposed',
        classification: 'promise-dialog',
        publicMethods: [
            'open',
            'close',
            'destroy'
        ],
        reason: 'SearchFiltersDialog provides the AMB Grid search-field configuration dialog contract while keeping selection and rendering helpers internal.'
    },
    {
        component: 'FeedbackRegion',
        publicExport: 'FeedbackRegion',
        source: 'ui/feedback-region.js',
        status: 'exposed',
        classification: 'status-region',
        publicMethods: [
            'show',
            'clear',
            'destroy'
        ],
        reason: 'FeedbackRegion provides the accessible AMB Grid status and alert messaging lifecycle.'
    }
];
