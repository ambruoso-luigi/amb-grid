import { AMB } from '../index.js';

const departments = [
    'Human Resources',
    'Information Technology',
    'Finance',
    'Operations',
    'Legal'
];

const tags = [
    'urgent',
    'internal',
    'external',
    'review',
    'blocked'
];

const cities = [
    'Amsterdam',
    'Athens',
    'Barcelona',
    'Berlin',
    'Bologna',
    'Brussels',
    'Budapest',
    'Copenhagen',
    'Dublin',
    'Florence',
    'Frankfurt',
    'Geneva',
    'Hamburg',
    'Helsinki',
    'Lisbon',
    'London',
    'Madrid',
    'Milan',
    'Munich',
    'Naples',
    'Oslo',
    'Paris',
    'Prague',
    'Rome',
    'Stockholm',
    'Turin',
    'Valencia',
    'Venice',
    'Vienna',
    'Warsaw'
];

const buildReport = result => {
    const lines = [
        `Validation result: ${result.isValid ? 'valid' : 'invalid'}`,
        `Errors: ${result.errors.length}`,
        ''
    ];

    if (result.errors.length === 0) {
        lines.push('Strict values are allowed and custom free values are accepted.');
        return lines.join('\n');
    }

    result.errors.forEach(error => {
        const rowLabel = error.rowNumber !== null && error.rowNumber !== undefined
            ? `Row ${error.rowNumber}`
            : `ID ${error.id || error.tempId || 'unknown'}`;

        lines.push(`- ${rowLabel}, ${error.field}: ${error.message}`);
    });

    lines.push('');
    lines.push('Unknown strict values remain visible and are reported above.');
    lines.push('Custom values in the free column are accepted.');

    return lines.join('\n');
};

export default function autocomplete(app) {
    app.innerHTML = `
        <h2>Autocomplete</h2>
        <p class="demo-note">Autocomplete suggests values from a list while the user types. Columns can allow custom values or require one of the suggested values.</p>
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
            { id: 1, task: 'Prepare onboarding pack', department: 'Human Resources', tag: 'internal', city: 'Milan' },
            { id: 2, task: 'Review access controls', department: 'Information Technology', tag: 'review', city: 'Berlin' },
            { id: 3, task: 'Check monthly close', department: 'Finance', tag: 'urgent', city: 'London' },
            { id: 4, task: 'Update support workflow', department: 'Operations', tag: 'external', city: 'Rome' }
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
                editor: AMB.editors.autocomplete(departments, {
                    allowEmpty: true,
                    allowCustomValue: false,
                    invalidBehavior: 'commitRaw',
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
                title: 'Free tag',
                field: 'tag',
                editor: AMB.editors.autocomplete(tags, {
                    allowEmpty: true,
                    allowCustomValue: true,
                    placeholder: 'Type or add a tag...'
                })
            },
            {
                title: 'City (max 5)',
                field: 'city',
                editor: AMB.editors.autocomplete(cities, {
                    allowEmpty: true,
                    allowCustomValue: true,
                    maxOptions: 5,
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
            tag: 'custom-note'
        });

        window.setTimeout(() => {
            output.textContent = buildReport(demo.crud.validateChanges());
        }, 0);
    });

    return demo;
}
