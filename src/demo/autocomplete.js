import { AMB } from '../index.js';

const departments = [
    'Administration',
    'Accounting',
    'Business Development',
    'Customer Care',
    'Design',
    'Engineering',
    'Finance',
    'Human Resources',
    'Information Technology',
    'Legal',
    'Logistics',
    'Marketing',
    'Operations',
    'Product',
    'Purchasing',
    'Quality Assurance',
    'Research and Development',
    'Sales',
    'Security',
    'Support'
];

const tags = [
    'approved',
    'blocked',
    'business',
    'external',
    'follow-up',
    'internal',
    'important',
    'pending',
    'priority',
    'review',
    'security',
    'support',
    'urgent'
];

const cities = [
    'Amsterdam',
    'Athens',
    'Bari',
    'Barcelona',
    'Berlin',
    'Bilbao',
    'Bologna',
    'Bordeaux',
    'Boston',
    'Bremen',
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
    'Manchester',
    'Marseille',
    'Milan',
    'Munich',
    'Naples',
    'Oslo',
    'Paris',
    'Prague',
    'Riga',
    'Rome',
    'Rotterdam',
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
        <p class="demo-note">Autocomplete suggests text from simple string lists. The typed or selected text is stored directly, with no separate hidden value.</p>
        <ul class="demo-note">
            <li><strong>Free autocomplete:</strong> custom values are allowed.</li>
            <li><strong>Strict autocomplete:</strong> values outside the list stay visible and are reported by validation.</li>
            <li><strong>Required strict autocomplete:</strong> empty and unknown values are reported by validation.</li>
            <li><strong>Long list:</strong> only the first five matches are shown.</li>
        </ul>
        <div class="toolbar">
            <button type="button" id="action-create-autocomplete-anomalies">Create autocomplete anomalies</button>
        </div>
        <div id="autocomplete-table"></div>
        <pre class="demo-output" id="autocomplete-output"></pre>
    `;

    const demo = AMB.table({
        selector: '#autocomplete-table',
        height: '340px',
        data: [
            { id: 1, task: 'Prepare onboarding pack', department: 'Human Resources', requiredDepartment: 'Administration', tag: 'internal', city: 'Milan' },
            { id: 2, task: 'Review access controls', department: 'Information Technology', requiredDepartment: 'Security', tag: 'review', city: 'Berlin' },
            { id: 3, task: 'Check monthly close', department: 'Finance', requiredDepartment: 'Accounting', tag: 'urgent', city: 'London' },
            { id: 4, task: 'Update support workflow', department: 'Operations', requiredDepartment: 'Support', tag: 'external', city: 'Rome' }
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
                title: 'Department required',
                field: 'requiredDepartment',
                editor: AMB.editors.autocomplete(departments, {
                    allowEmpty: false,
                    allowCustomValue: false,
                    invalidBehavior: 'commitRaw',
                    placeholder: 'Type to search...'
                }),
                validation: {
                    required: {
                        message: 'Department is required'
                    },
                    allowedValues: {
                        values: departments,
                        trim: true,
                        caseSensitive: false,
                        message: 'Choose a department from the list'
                    }
                }
            },
            {
                title: 'Free autocomplete',
                field: 'tag',
                editor: AMB.editors.autocomplete(tags, {
                    allowEmpty: true,
                    allowCustomValue: true,
                    placeholder: 'Type or add a tag...'
                })
            },
            {
                title: 'Long list (max 5)',
                field: 'city',
                editor: AMB.editors.autocomplete(cities, {
                    allowEmpty: true,
                    allowCustomValue: true,
                    maxOptions: 5,
                    placeholder: 'Try B, M, or R...'
                })
            }
        ]
    });
    const output = app.querySelector('#autocomplete-output');

    app.querySelector('#action-create-autocomplete-anomalies').addEventListener('click', () => {
        demo.crud.updateRow(2, {
            department: 'Unknown department',
            requiredDepartment: '',
            tag: 'custom-note'
        });
        demo.crud.updateRow(3, {
            requiredDepartment: 'Unknown department'
        });

        window.setTimeout(() => {
            output.textContent = buildReport(demo.crud.validateChanges());
        }, 0);
    });

    return demo;
}
