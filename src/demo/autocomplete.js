import { AMB } from '../index.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';

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

const createAutocompleteData = () => [
    { id: 1, task: 'Prepare onboarding pack', department: 'Human Resources', requiredDepartment: 'Administration', tag: 'internal', city: 'Milan' },
    { id: 2, task: 'Review access controls', department: 'Information Technology', requiredDepartment: 'Security', tag: 'review', city: 'Berlin' },
    { id: 3, task: 'Check monthly close', department: 'Finance', requiredDepartment: 'Accounting', tag: 'urgent', city: 'London' },
    { id: 4, task: 'Update support workflow', department: 'Operations', requiredDepartment: 'Support', tag: 'external', city: 'Rome' },
    { id: 5, task: 'Draft campaign brief', department: 'Marketing', requiredDepartment: 'Design', tag: 'priority', city: 'Paris' },
    { id: 6, task: 'Plan delivery route', department: 'Logistics', requiredDepartment: 'Purchasing', tag: 'support', city: 'Bologna' },
    { id: 7, task: 'Review supplier terms', department: 'Legal', requiredDepartment: 'Purchasing', tag: 'approved', city: 'Madrid' },
    { id: 8, task: 'Prepare product research', department: 'Product', requiredDepartment: 'Research and Development', tag: 'important', city: 'Amsterdam' },
    { id: 9, task: 'Schedule quality audit', department: 'Quality Assurance', requiredDepartment: 'Engineering', tag: 'pending', city: 'Vienna' },
    { id: 10, task: 'Update sales forecast', department: 'Sales', requiredDepartment: 'Business Development', tag: 'business', city: 'Boston' }
];

export default function autocomplete(app) {
    app.innerHTML = `
        <h2 data-i18n="examples.autocomplete.title">Autocomplete</h2>
        <p class="demo-note" data-i18n="examples.autocomplete.intro">Autocomplete helps users choose suggested values while AMB Grid controls commit, validation, and row state.</p>
        <details class="demo-disclosure">
            <summary class="demo-disclosure__summary" data-i18n="examples.autocomplete.detailsTitle">Autocomplete behavior</summary>
            <div class="demo-disclosure__content">
                <ul class="demo-explanation-list">
                    <li><strong data-i18n="examples.autocomplete.point1Title">Suggestions</strong><span data-i18n="examples.autocomplete.detail1">Matching options appear and narrow while you type.</span></li>
                    <li><strong data-i18n="examples.autocomplete.point2Title">Strict values</strong><span data-i18n="examples.autocomplete.detail2">Department fields require a value from the supplied list.</span></li>
                    <li><strong data-i18n="examples.autocomplete.point3Title">Free values</strong><span data-i18n="examples.autocomplete.detail3">Tag and city also accept custom values that are not in the suggestions.</span></li>
                    <li><strong data-i18n="examples.autocomplete.point4Title">Keyboard</strong><span data-i18n="examples.autocomplete.detail4">Use the arrow keys to navigate suggestions and confirm without leaving the keyboard.</span></li>
                    <li><strong data-i18n="examples.autocomplete.point5Title">Committed value</strong><span data-i18n="examples.autocomplete.detail5">The confirmed option becomes the cell value used by validation and the CRUD payload.</span></li>
                </ul>
            </div>
        </details>
        <div class="demo-table-workbench">
            <div id="autocomplete-table" class="demo-business-grid demo-business-grid--viewport"></div>
        </div>
    `;

    const demo = AMB.table({
        selector: '#autocomplete-table',
        toolbar: {
            buttons: [
                {
                    id: 'validate-autocomplete',
                    label: 'Validate autocomplete',
                    title: 'Validate autocomplete values',
                    onClick: handleValidateAutocomplete
                },
                {
                    id: 'create-autocomplete-anomalies',
                    label: 'Create anomalies',
                    title: 'Create invalid strict autocomplete values',
                    onClick: handleCreateAutocompleteAnomalies
                },
                {
                    id: 'reset-autocomplete',
                    label: 'Reset data',
                    title: 'Reset autocomplete demo data',
                    onClick: handleResetAutocomplete
                }
            ]
        },
        data: createAutocompleteData(),
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', minWidth: 65, widthGrow: 0.4 },
            {
                title: 'Task',
                field: 'task',
                minWidth: 155,
                widthGrow: 1.45,
                editor: AMB.editors.text({ trim: true, maxLength: 80 })
            },
            {
                title: 'Department strict',
                field: 'department',
                minWidth: 145,
                widthGrow: 1.15,
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
                minWidth: 150,
                widthGrow: 1.2,
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
                minWidth: 125,
                widthGrow: 0.9,
                editor: AMB.editors.autocomplete(tags, {
                    allowEmpty: true,
                    allowCustomValue: true,
                    placeholder: 'Type or add a tag...'
                })
            },
            {
                title: 'Long list (max 5)',
                field: 'city',
                minWidth: 135,
                widthGrow: 1,
                editor: AMB.editors.autocomplete(cities, {
                    allowEmpty: true,
                    allowCustomValue: true,
                    maxOptions: 5,
                    placeholder: 'Try B, M, or R...'
                })
            }
        ]
    });
    const reportDialog = createDemoReportDialog();
    const originalDestroy = demo.destroy.bind(demo);

    demo.destroy = () => {
        reportDialog.destroy();
        originalDestroy();
    };

    function handleValidateAutocomplete() {
        const result = demo.crud.validateAll();

        reportDialog.open({
            title: 'Autocomplete validation report',
            reportText: buildReport(result),
            jsonData: result
        });
    }

    async function handleCreateAutocompleteAnomalies() {
        demo.feedback.clear();
        demo.crud.updateRow(2, {
            department: 'Unknown department',
            requiredDepartment: '',
            tag: 'custom-note'
        });
        demo.crud.updateRow(3, {
            requiredDepartment: 'Unknown department'
        });

        await new Promise(resolve => window.setTimeout(resolve, 0));
        demo.crud.validateChanges();
        demo.feedback.show({
            type: 'warning',
            message: 'Autocomplete anomalies created. Validate to inspect the report.'
        });
    }

    async function handleResetAutocomplete() {
        demo.feedback.clear();
        await demo.table.setData(createAutocompleteData());
        demo.feedback.show({
            type: 'success',
            message: 'Autocomplete demo data reset.'
        });
    }

    return demo;
}
