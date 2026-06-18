import { AMB } from '../index.js';

const departments = [
    'Human Resources',
    'Information Technology',
    'Finance',
    'Operations',
    'Legal'
];

const priorities = [
    'Low',
    'Medium',
    'High',
    'Critical'
];

const tags = [
    'urgent',
    'internal',
    'external',
    'review',
    'blocked'
];

const createStaticLookup = items => AMB.lookup({
    cache: {
        enabled: false
    },
    load: ({ query }) => {
        const normalizedQuery = String(query || '').trim().toLowerCase();

        if (normalizedQuery === '') return items;

        return items.filter(item => item.toLowerCase().includes(normalizedQuery));
    }
});

const buildReport = result => {
    const lines = [
        `Validation result: ${result.isValid ? 'valid' : 'invalid'}`,
        `Errors: ${result.errors.length}`,
        ''
    ];

    if (result.errors.length === 0) {
        lines.push('All strict autocomplete values are allowed. Free tags, including custom values, are accepted.');
        return lines.join('\n');
    }

    result.errors.forEach(error => {
        const rowLabel = error.rowNumber !== null && error.rowNumber !== undefined
            ? `Row ${error.rowNumber}`
            : `ID ${error.id || error.tempId || 'unknown'}`;

        lines.push(`- ${rowLabel}, ${error.field}: ${error.message}`);
    });

    lines.push('');
    lines.push('Unknown strict values remain visible in the grid and are reported above.');
    lines.push('The custom free tag is accepted.');

    return lines.join('\n');
};

export default function autocomplete(app) {
    const departmentLookup = createStaticLookup(departments);
    const priorityLookup = createStaticLookup(priorities);
    const tagLookup = createStaticLookup(tags);

    app.innerHTML = `
        <h2>Lookup / Autocomplete</h2>
        <p class="demo-note">Autocomplete uses lookup data to suggest values while editing. Strict columns keep unknown typed values visible so validation can report them; free columns accept custom values.</p>
        <p class="demo-note">The lookup supplies suggestions, the editor handles input, and the validator decides whether the stored value is acceptable.</p>
        <div class="toolbar">
            <button type="button" id="action-validate-autocomplete">Validate autocomplete</button>
            <button type="button" id="action-create-autocomplete-anomalies">Create autocomplete anomalies</button>
        </div>
        <div id="autocomplete-table"></div>
        <pre class="demo-output" id="autocomplete-output"></pre>
    `;

    const demo = AMB.table({
        selector: '#autocomplete-table',
        height: '340px',
        data: [
            { id: 1, task: 'Prepare onboarding pack', department: 'Human Resources', priority: 'Medium', tag: 'internal' },
            { id: 2, task: 'Review access controls', department: 'Information Technology', priority: 'High', tag: 'review' },
            { id: 3, task: 'Check monthly close', department: 'Finance', priority: 'Critical', tag: 'urgent' },
            { id: 4, task: 'Update support workflow', department: 'Operations', priority: 'Low', tag: 'external' }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 70 },
            {
                title: 'Task',
                field: 'task',
                editor: AMB.editors.text({ trim: true, maxLength: 80 })
            },
            {
                title: 'Department strict',
                field: 'department',
                editor: AMB.editors.autocomplete(departmentLookup, {
                    allowEmpty: true,
                    allowCustomValue: false,
                    invalidBehavior: 'commitRaw',
                    maxOptions: 20,
                    placeholder: 'Type to search...'
                }),
                validation: {
                    allowedValues: {
                        values: departments,
                        trim: true,
                        caseSensitive: false,
                        message: 'Choose a department from the list'
                    }
                }
            },
            {
                title: 'Priority strict',
                field: 'priority',
                editor: AMB.editors.autocomplete(priorityLookup, {
                    allowEmpty: true,
                    allowCustomValue: false,
                    invalidBehavior: 'commitRaw',
                    maxOptions: 20,
                    placeholder: 'Type to search...'
                }),
                validation: {
                    allowedValues: {
                        values: priorities,
                        trim: true,
                        caseSensitive: false,
                        message: 'Choose a priority from the list'
                    }
                }
            },
            {
                title: 'Free tag',
                field: 'tag',
                editor: AMB.editors.autocomplete(tagLookup, {
                    allowEmpty: true,
                    allowCustomValue: true,
                    maxOptions: 20,
                    placeholder: 'Type to search...'
                })
            }
        ]
    });
    const output = app.querySelector('#autocomplete-output');

    app.querySelector('#action-validate-autocomplete').addEventListener('click', () => {
        output.textContent = buildReport(demo.crud.validateAll());
    });

    app.querySelector('#action-create-autocomplete-anomalies').addEventListener('click', () => {
        demo.crud.updateRow(2, {
            department: 'Unknown department',
            priority: 'Very high',
            tag: 'custom-note'
        });

        window.setTimeout(() => {
            output.textContent = buildReport(demo.crud.validateChanges());
        }, 0);
    });

    return demo;
}
