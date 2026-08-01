export const EDITOR_API_COVERAGE = [
    {
        editor: 'text',
        publicPath: 'editors.text',
        source: 'text-editor.js',
        status: 'exposed',
        classification: 'native',
        reason: 'editors.text provides the standard AMB Grid text-editing contract.'
    },
    {
        editor: 'integer',
        publicPath: 'editors.integer',
        source: 'number-editors.js',
        status: 'exposed',
        classification: 'AMB-aware',
        reason: 'editors.integer normalizes and commits integer values through AMB Grid editing rules.'
    },
    {
        editor: 'decimal',
        publicPath: 'editors.decimal',
        source: 'number-editors.js',
        status: 'exposed',
        classification: 'AMB-aware',
        reason: 'editors.decimal normalizes and commits decimal values through AMB Grid editing rules.'
    },
    {
        editor: 'date',
        publicPath: 'editors.date',
        source: 'date-editor.js',
        status: 'exposed',
        classification: 'internal-adapter',
        reason: 'editors.date owns date parsing, commit behavior and keyboard lifecycle while keeping the optional picker widget internal.'
    },
    {
        editor: 'checkbox',
        publicPath: 'editors.checkbox',
        source: 'checkbox-editor.js',
        status: 'exposed',
        classification: 'AMB-aware',
        reason: 'editors.checkbox maps checked state to configured values through the AMB Grid editing contract.'
    },
    {
        editor: 'select',
        publicPath: 'editors.select',
        source: 'select-editor.js',
        status: 'exposed',
        classification: 'native',
        reason: 'editors.select provides the standard AMB Grid selection contract for configured options.'
    },
    {
        editor: 'autocomplete',
        publicPath: 'editors.autocomplete',
        source: 'autocomplete-editor.js',
        status: 'exposed',
        classification: 'internal-adapter',
        reason: 'editors.autocomplete owns matching, commit rules and cleanup while keeping the suggestion widget internal.'
    },
    {
        editor: 'lookup',
        publicPath: 'editors.lookup',
        source: 'lookup-editor.js',
        status: 'exposed',
        classification: 'dialog-backed',
        reason: 'editors.lookup integrates the AMB Grid lookup dialog and row-field mapping contract.'
    },
    {
        editor: 'largeText',
        publicPath: 'editors.largeText',
        source: 'large-text-editor.js',
        status: 'exposed',
        classification: 'dialog-backed',
        reason: 'editors.largeText provides the AMB Grid modal editing contract for long text.'
    }
];
