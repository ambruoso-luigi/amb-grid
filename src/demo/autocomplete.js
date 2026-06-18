import { AMB } from '../index.js';

const departments = [
    { code: 'HR', label: 'Human Resources' },
    { code: 'IT', label: 'Information Technology' },
    { code: 'FIN', label: 'Finance' },
    { code: 'OPS', label: 'Operations' },
    { code: 'LEG', label: 'Legal' }
];

const costCenters = [
    { code: 'CC100', label: 'Administration' },
    { code: 'CC200', label: 'Sales Operations' },
    { code: 'CC300', label: 'Product Support' },
    { code: 'CC400', label: 'Internal Tools' }
];

const tags = [
    { code: 'urgent', label: 'Urgent' },
    { code: 'internal', label: 'Internal' },
    { code: 'external', label: 'External' },
    { code: 'review', label: 'Review' },
    { code: 'blocked', label: 'Blocked' }
];

const createStaticLookup = items => AMB.lookup({
    valueField: 'code',
    labelField: 'label',
    cache: {
        enabled: false
    },
    load: ({ query }) => {
        const normalizedQuery = String(query || '').trim().toLowerCase();

        if (normalizedQuery === '') return items;

        return items.filter(item => {
            return item.code.toLowerCase().includes(normalizedQuery)
                || item.label.toLowerCase().includes(normalizedQuery);
        });
    }
});

const buildReport = result => {
    const lines = [
        `Validation result: ${result.isValid ? 'valid' : 'invalid'}`,
        `Errors: ${result.errors.length}`,
        ''
    ];

    if (result.errors.length === 0) {
        lines.push('All strict autocomplete values are allowed.');
        return lines.join('\n');
    }

    result.errors.forEach(error => {
        const rowLabel = error.rowNumber !== null && error.rowNumber !== undefined
            ? `Row ${error.rowNumber}`
            : `ID ${error.id || error.tempId || 'unknown'}`;

        lines.push(`- ${rowLabel}, ${error.field}: ${error.message}`);
    });

    return lines.join('\n');
};

export default function autocomplete(app) {
    const departmentLookup = createStaticLookup(departments);
    const costCenterLookup = createStaticLookup(costCenters);
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
            { id: 1, task: 'Prepare onboarding pack', department: 'HR', costCenter: 'CC100', tag: 'internal' },
            { id: 2, task: 'Review access controls', department: 'IT', costCenter: 'CC400', tag: 'review' },
            { id: 3, task: 'Check monthly close', department: 'FIN', costCenter: 'CC100', tag: 'urgent' },
            { id: 4, task: 'Update support workflow', department: 'OPS', costCenter: 'CC300', tag: 'custom-note' }
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
                    codeField: 'code',
                    descriptionField: 'label'
                }),
                validation: {
                    allowedValues: {
                        values: departments.map(item => item.code),
                        trim: true,
                        caseSensitive: true,
                        message: 'Choose a department from the lookup'
                    }
                }
            },
            {
                title: 'Cost center strict',
                field: 'costCenter',
                editor: AMB.editors.autocomplete(costCenterLookup, {
                    allowEmpty: true,
                    allowCustomValue: false,
                    invalidBehavior: 'commitRaw',
                    codeField: 'code',
                    descriptionField: 'label'
                }),
                validation: {
                    allowedValues: {
                        values: costCenters.map(item => item.code),
                        trim: true,
                        caseSensitive: true,
                        message: 'Choose a cost center from the lookup'
                    }
                }
            },
            {
                title: 'Free tag',
                field: 'tag',
                editor: AMB.editors.autocomplete(tagLookup, {
                    allowEmpty: true,
                    allowCustomValue: true,
                    codeField: 'code',
                    descriptionField: 'label'
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
            department: 'XXX',
            costCenter: 'CC999',
            tag: 'custom-note'
        });

        window.setTimeout(() => {
            output.textContent = buildReport(demo.crud.validateChanges());
        }, 0);
    });

    return demo;
}
