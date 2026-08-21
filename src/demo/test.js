import 'tabulator-tables/dist/css/tabulator.min.css';
import 'vanillajs-datepicker/css/datepicker.min.css';
import '../amb-grid.css';
import './test.css';

import { AMB } from '../index.js';
import { fakeApi } from '../../demo/fake-backend/fake-api.js';
import { MUNICIPALITY_LOOKUP_COLUMNS } from './multifield-lookup-config.js';

const output = document.querySelector('#test-output');
const selectionModeControl = document.querySelector('#selection-mode');
let currentGrid = null;
let currentMultifieldLookupGrid = null;
let currentAutocompleteGrid = null;
let currentColumnCalculationsGrid = null;

const testLookupAutoCompleteOptions = {
    autoComplete: true,
    autoCompleteMinChars: 1,
    autoCompleteOnTab: true
};
const autocompleteDepartments = [
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
const autocompleteTags = [
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
const autocompleteCities = [
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
const MULTIFIELD_LOOKUP_DATASET_URL = new URL(
    './data/italian-municipalities.demo.json',
    import.meta.url
);
const createMunicipalityMultifieldLookup = municipalityLookup => AMB.multifieldLookup({
    id: 'municipality',
    lookup: municipalityLookup,
    masterField: {
        field: 'municipality',
        from: 'municipalityName',
        title: 'Municipality',
        required: true,
        autocomplete: true,
        dialog: true
    },
    dependentFields: [
        {
            field: 'province',
            from: 'province',
            title: 'Province',
            visibleInGrid: true,
            visibleInLookup: true,
            searchable: true,
            required: true
        },
        {
            field: 'region',
            from: 'region',
            title: 'Region',
            visibleInGrid: true,
            visibleInLookup: true,
            searchable: true,
            required: true
        },
        {
            field: 'postalCode',
            from: 'postalCode',
            title: 'Postal Code',
            visibleInGrid: true,
            visibleInLookup: true,
            searchable: true,
            required: true
        },
        {
            field: 'istatCode',
            from: 'istatCode',
            title: 'ISTAT Code',
            visibleInGrid: true,
            visibleInLookup: false,
            searchable: false,
            required: true
        },
        {
            field: 'cadastralCode',
            from: 'cadastralCode',
            title: 'Cadastral Code',
            visibleInGrid: true,
            visibleInLookup: false,
            searchable: false,
            required: true
        }
    ]
});

const createMultifieldRows = () => [
    {
        id: 1,
        textBefore: 'Before Nocera',
        istatCode: '065078',
        cadastralCode: 'F912',
        municipality: 'Nocera Inferiore',
        province: 'SA',
        region: 'CAMPANIA',
        postalCode: '84014',
        textAfter: 'After Nocera'
    },
    {
        id: 2,
        textBefore: 'Before Milano',
        istatCode: '015146',
        cadastralCode: 'F205',
        municipality: 'Milano',
        province: 'MI',
        region: 'LOMBARDIA',
        postalCode: '20121',
        textAfter: 'After Milano'
    }
];

const createEmptyMultifieldRow = () => ({
    id: null,
    textBefore: '',
    istatCode: '',
    cadastralCode: '',
    municipality: '',
    province: '',
    region: '',
    postalCode: '',
    textAfter: ''
});

const createAutocompleteData = () => [
    { id: 1, task: 'Prepare onboarding pack', department: 'Human Resources', requiredDepartment: 'Administration', tag: 'internal', city: 'Milan' },
    { id: 2, task: 'Review access controls', department: 'Information Technology', requiredDepartment: 'Security', tag: 'review', city: 'Berlin' },
    { id: 3, task: 'Check monthly close', department: 'Finance', requiredDepartment: 'Accounting', tag: 'urgent', city: 'London' },
    { id: 4, task: 'Update support workflow', department: 'Operations', requiredDepartment: 'Support', tag: 'external', city: 'Rome' }
];

const createColumnCalculationsData = () => [
    { id: 1, code: 'A01', product: 'Router', category: 'Hardware', quantity: 5, unitPrice: 120.50, deliveryDays: 3, score: 78 },
    { id: 2, code: 'A02', product: 'CRM', category: 'Software', quantity: 12, unitPrice: 49.90, deliveryDays: 5, score: 92 },
    { id: 3, code: 'A03', product: 'Audit', category: 'Services', quantity: 7, unitPrice: 85, deliveryDays: 2, score: 85 },
    { id: 4, code: 'A04', product: 'Switch', category: 'Hardware', quantity: 20, unitPrice: 65.25, deliveryDays: 7, score: 66 },
    { id: 5, code: 'A05', product: 'ERP', category: 'Software', quantity: 9, unitPrice: 99.99, deliveryDays: 4, score: 88 },
    { id: 6, code: 'A06', product: 'Support', category: 'Services', quantity: 15, unitPrice: 35, deliveryDays: 6, score: 95 },
    { id: 7, code: 'A07', product: 'Keyboard', category: 'Accessories', quantity: 4, unitPrice: 42, deliveryDays: 1, score: 73 },
    { id: 8, code: 'A08', product: 'Monitor', category: 'Hardware', quantity: 11, unitPrice: 210, deliveryDays: 3, score: 81 },
    { id: 9, code: 'A09', product: 'Backup', category: 'Software', quantity: 8, unitPrice: 75.50, deliveryDays: 5, score: 90 },
    { id: 10, code: 'A10', product: 'Training', category: 'Services', quantity: 14, unitPrice: 55, deliveryDays: 2, score: 69 },
    { id: 11, code: 'A11', product: 'Dock', category: 'Accessories', quantity: 6, unitPrice: 89.50, deliveryDays: 4, score: 87 },
    { id: 12, code: 'A12', product: 'Firewall', category: 'Security', quantity: 3, unitPrice: 450, deliveryDays: 6, score: 96 },
    { id: 13, code: 'A13', product: 'VPN', category: 'Security', quantity: 10, unitPrice: 120, deliveryDays: 2, score: 91 },
    { id: 14, code: 'A14', product: 'NAS', category: 'Hardware', quantity: 5, unitPrice: 320, deliveryDays: 5, score: 84 },
    { id: 15, code: 'A15', product: 'Licenses', category: 'Software', quantity: 25, unitPrice: 29.90, deliveryDays: 3, score: 76 },
    { id: 16, code: 'A16', product: 'Consulting', category: 'Services', quantity: 8, unitPrice: 110, deliveryDays: 8, score: 89 },
    { id: 17, code: 'A17', product: 'Headset', category: 'Accessories', quantity: 13, unitPrice: 59.99, deliveryDays: 4, score: 82 },
    { id: 18, code: 'A18', product: 'Gateway', category: 'Networking', quantity: 7, unitPrice: 175, deliveryDays: 2, score: 98 },
    { id: 19, code: 'A19', product: 'Storage', category: 'Hardware', quantity: 9, unitPrice: 240, deliveryDays: 7, score: 79 },
    { id: 20, code: 'A20', product: 'Helpdesk', category: 'Services', quantity: 18, unitPrice: 45, deliveryDays: 5, score: 94 },
    { id: 21, code: 'A21', product: 'WiFi AP', category: 'Networking', quantity: 16, unitPrice: 130, deliveryDays: 3, score: 86 },
    { id: 22, code: 'A22', product: 'Antivirus', category: 'Security', quantity: 22, unitPrice: 38.50, deliveryDays: 4, score: 93 },
    { id: 23, code: 'A23', product: 'Laptop', category: 'Hardware', quantity: 6, unitPrice: 850, deliveryDays: 6, score: 97 },
    { id: 24, code: 'A24', product: 'BI Suite', category: 'Software', quantity: 11, unitPrice: 150, deliveryDays: 5, score: 88 },
    { id: 25, code: 'A25', product: 'Migration', category: 'Services', quantity: 4, unitPrice: 260, deliveryDays: 9, score: 72 },
    { id: 26, code: 'A26', product: 'Mouse', category: 'Accessories', quantity: 30, unitPrice: 24.90, deliveryDays: 2, score: 68 },
    { id: 27, code: 'A27', product: 'Cloud Backup', category: 'Cloud', quantity: 12, unitPrice: 70, deliveryDays: 4, score: 90 },
    { id: 28, code: 'A28', product: 'Switch Pro', category: 'Networking', quantity: 14, unitPrice: 195, deliveryDays: 3, score: 99 },
    { id: 29, code: 'A29', product: 'Compliance', category: 'Services', quantity: 5, unitPrice: 180, deliveryDays: 7, score: 83 },
    { id: 30, code: 'A30', product: 'Database', category: 'Software', quantity: 10, unitPrice: 210, deliveryDays: 5, score: 100 }
];

const createEmptyColumnCalculationsRow = () => ({
    id: null,
    code: '',
    product: '',
    category: '',
    quantity: '',
    unitPrice: '',
    deliveryDays: '',
    score: ''
});

const calculateScoreRange = (_values, data) => {
    const numericValues = (Array.isArray(data) ? data : [])
        .map(row => row && row.score)
        .filter(value => {
            return value !== null
                && value !== undefined
                && !(typeof value === 'string' && value.trim() === '');
        })
        .map(value => Number(value))
        .filter(value => Number.isFinite(value));

    if (numericValues.length === 0) {
        return 0;
    }

    return Math.max(...numericValues) - Math.min(...numericValues);
};

const formatItalianDecimal = value => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return String(value ?? '');
    }

    return numericValue.toLocaleString('it-IT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const createEmptyAutocompleteRow = () => ({
    id: null,
    task: '',
    department: '',
    requiredDepartment: '',
    tag: '',
    city: ''
});

const loadMunicipalities = async () => {
    const response = await fetch(MULTIFIELD_LOOKUP_DATASET_URL);

    if (!response.ok) {
        throw new Error(`Unable to load the municipality test dataset (${response.status})`);
    }

    return response.json();
};

const filterMunicipalities = (records, query) => {
    const normalizedQuery = String(query || '').trim().toLowerCase();

    if (!normalizedQuery) return records;

    return records.filter(record => {
        return [
            record.municipalityName,
            record.province,
            record.region,
            record.postalCode,
            record.istatCode,
            record.cadastralCode
        ].some(value => String(value || '').toLowerCase().includes(normalizedQuery));
    });
};

const showTestOutput = (title, data) => {
    if (!output) return;

    output.textContent = `${title}\n\n${JSON.stringify(data, null, 2)}`;
};

const countRowsByState = (report, state) => {
    return report.rows.filter(row => row.state === state).length;
};

const buildStateSummary = report => ({
    totalRows: report.totalRows,
    clean: countRowsByState(report, 'clean'),
    new: countRowsByState(report, 'new'),
    modified: countRowsByState(report, 'modified'),
    deleted: countRowsByState(report, 'deleted'),
    saved: countRowsByState(report, 'saved'),
    errorRows: report.errorRowsCount,
    validChangedRows: report.validChangedRowsCount,
    canSave: report.validChangedRowsCount > 0 && !report.hasErrors
});

const hasPayloadChanges = payload => {
    const changes = payload.changes || {};

    return Boolean(
        (changes.inserted || []).length
        || (changes.updated || []).length
        || (changes.deleted || []).length
    );
};

const createGrid = async (selectionMode = 'single') => {
    const statusLookup = AMB.lookup({
        keyField: 'id',
        valueField: 'id',
        labelField: 'description',
        columns: [
            { field: 'id', title: 'Code', visible: true, width: 110 },
            { field: 'description', title: 'Description', visible: true, width: 360 }
        ],
        search: {
            fields: 'visible'
        },
        load: ({ query }) => fakeApi.searchStatuses(query)
    });
    const statusDialog = new AMB.LookupDialog();
    const warehouseOptions = await fakeApi.getWarehouses();
    const products = await fakeApi.getProducts();
    let grid = null;

    const tableOptions = {
        selector: '#inventory-test-table',
        selectionColumn: {
            enabled: true,
            mode: selectionMode
        },
        deleteColumn: {
            enabled: true,
            confirmDeleteMessage: 'Delete this product?',
            confirmRemoveNewMessage: 'Remove this new product?'
        },
        search: {
            enabled: true,
            placeholder: 'Search inventory...',
            filters: {
                enabled: true
            }
        },
        toolbar: {
            buttons: [
                'add',
                'reload',
                'save',
                'payload',
                'validate',
                {
                    id: 'show-report',
                    label: 'Report',
                    title: 'Show state report',
                    onClick: handleShowReport
                },
                {
                    id: 'show-selected',
                    label: 'Selected rows',
                    title: 'Show selected rows',
                    onClick: handleShowSelected
                }
            ],
            onAdd: handleAdd,
            onReload: handleReload,
            onSave: handleSave,
            onPayload: handleShowPayload,
            onValidate: handleValidate
        },
        data: products,
        layout: 'fitColumns',
        pagination: true,
        paginationMode: 'local',
        paginationSize: 10,
        paginationSizeSelector: [10, 20, 50],
        columns: [
            {
                title: 'Item code',
                field: 'itemCode',
                width: 130,
                editor: AMB.editors.text({ uppercase: true, trim: true }),
                required: true,
                validation: {
                    pattern: {
                        regex: /^PRD-[A-Z0-9]{4}$/,
                        message: 'Use PRD-A001 format'
                    },
                    unique: {
                        caseSensitive: false,
                        message: 'Item code must be unique'
                    }
                }
            },
            {
                title: 'Product name',
                field: 'productName',
                width: 180,
                widthGrow: 1.2,
                editor: AMB.editors.text({ trim: true }),
                required: true,
                validation: {
                    minLength: {
                        value: 3,
                        message: 'Product name must be at least 3 characters'
                    }
                }
            },
            {
                title: 'Warehouse',
                field: 'warehouse',
                width: 128,
                required: true,
                editor: AMB.editors.autocomplete(warehouseOptions, {
                    maxOptions: 8,
                    trimInput: true
                }),
                validation: {
                    allowedValues: {
                        values: warehouseOptions,
                        message: 'Choose a known warehouse'
                    }
                }
            },
            {
                title: 'Stock quantity',
                field: 'stockQuantity',
                width: 120,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                required: true,
                validation: {
                    integer: true,
                    min: {
                        value: 0,
                        message: 'Stock quantity cannot be negative'
                    }
                }
            },
            {
                title: 'Unit price',
                field: 'unitPrice',
                width: 118,
                editor: AMB.editors.decimal({ integerDigits: 7, decimalDigits: 2, allowEmpty: false }),
                formatter: AMB.formatters.currency(),
                required: true,
                validation: {
                    decimal: {
                        integerDigits: 7,
                        decimalDigits: 2,
                        allowNegative: false,
                        message: 'Enter a valid non-negative unit price'
                    }
                }
            },
            {
                title: 'Last check date',
                field: 'lastCheckDate',
                width: 132,
                editor: AMB.editors.date({
                    format: 'dd/mm/yyyy',
                    allowEmpty: false,
                    picker: true
                }),
                formatter: AMB.formatters.date('dd/mm/yyyy'),
                required: true,
                validation: {
                    date: {
                        format: 'dd/mm/yyyy',
                        allowEmpty: false,
                        message: 'Enter a real check date'
                    }
                }
            },
            {
                title: 'Status',
                field: 'status',
                width: 118,
                required: true,
                editor: AMB.editors.lookup(statusLookup, {
                    showDescription: false,
                    uppercase: true,
                    allowEmpty: false,
                    dialog: statusDialog,
                    dialogTitle: 'Search status',
                    invalidMessage: 'Unknown status code',
                    ...testLookupAutoCompleteOptions,
                    dialogOptions: {
                        closeOnBackdropClick: false,
                        pagination: {
                            enabled: true,
                            pageSize: 8,
                            controls: 'full'
                        },
                        destroyOnClose: true
                    }
                })
            },
            {
                title: 'Requires inspection',
                field: 'requiresInspection',
                width: 150,
                hozAlign: 'center',
                formatter: AMB.formatters.checkbox(),
                editor: AMB.editors.checkbox()
            },
            {
                title: 'Notes',
                field: 'notes',
                width: 210,
                widthGrow: 1.4,
                formatter: AMB.formatters.largeTextPreview({ maxLength: 42 }),
                editor: AMB.editors.largeText({
                    title: 'Edit inventory notes',
                    rows: 10,
                    closeOnBackdropClick: false,
                    tabBehavior: 'save-and-navigate'
                })
            }
        ]
    };

    grid = AMB.table(tableOptions);

    const originalDestroy = grid.destroy.bind(grid);

    grid.destroy = () => {
        statusDialog.destroy();
        originalDestroy();
    };

    grid.feedback.show({
        type: 'info',
        message: 'Warehouse data loaded.'
    });
    showTestOutput('Loaded products', {
        rows: products.length,
        selectionMode
    });

    function handleAdd() {
        grid.feedback.clear();
        return grid.crud.addRow({
            id: null,
            itemCode: '',
            productName: '',
            warehouse: '',
            stockQuantity: 0,
            unitPrice: '',
            lastCheckDate: '',
            status: '',
            requiresInspection: false,
            notes: ''
        });
    }

    async function handleReload() {
        grid.feedback.clear();

        const reloadedProducts = await fakeApi.getProducts();

        await grid.table.setData(reloadedProducts);
        showTestOutput('Reloaded rows', {
            rows: reloadedProducts.length,
            report: buildStateSummary(grid.crud.getStateReport())
        });
        grid.feedback.show({
            type: 'success',
            message: 'Data reloaded.'
        });
    }

    function handleShowPayload({ payload }) {
        showTestOutput('Save payload', payload);
    }

    function handleShowReport() {
        const report = grid.crud.getStateReport();

        showTestOutput('Row state report', {
            summary: buildStateSummary(report),
            report
        });
    }

    function handleShowSelected() {
        const selectedRows = grid.getSelectedRows();

        showTestOutput('Selected rows', {
            mode: selectionMode,
            count: selectedRows.length,
            rows: selectedRows
        });
    }

    function handleValidate() {
        const validateResult = grid.crud.validateAll();

        showTestOutput('Validation report', {
            isValid: validateResult.isValid,
            validateResult,
            payload: grid.crud.getSavePayload({ includeInvalid: true })
        });
        grid.feedback.show({
            type: validateResult.isValid ? 'success' : 'warning',
            message: validateResult.isValid
                ? 'All active rows are valid.'
                : 'Some rows contain errors.'
        });
    }

    async function handleSave() {
        grid.feedback.clear();

        const validateResult = grid.crud.validateAll();

        if (!validateResult.isValid) {
            showTestOutput('Validation report', {
                isValid: false,
                validateResult,
                payload: grid.crud.getSavePayload({ includeInvalid: true })
            });
            grid.feedback.show({
                type: 'warning',
                message: 'Fix highlighted errors before saving.'
            });
            return;
        }

        const payload = grid.crud.getSavePayload();

        if (!hasPayloadChanges(payload)) {
            showTestOutput('Save payload', payload);
            grid.feedback.show({
                type: 'info',
                message: 'There are no changes to save.'
            });
            return;
        }

        grid.feedback.show({
            type: 'info',
            message: 'Simulated save in progress...'
        });

        const result = await fakeApi.saveProductChanges(payload);

        if (result.ok) {
            const applyIdsResult = grid.crud.applyBackendIds(result.generatedIds || []);
            const savedResult = grid.crud.markValidChangesSaved();
            const report = grid.crud.getStateReport();

            showTestOutput('Save result', {
                result,
                applyIdsResult,
                savedResult,
                summary: buildStateSummary(report),
                report
            });
            grid.feedback.show({
                type: 'success',
                message: 'Changes saved and row states aligned.'
            });
            return;
        }

        (result.errors || []).forEach(error => {
            if (error.field) {
                grid.crud.markCellError(error.id, error.field, error.message);
                return;
            }

            grid.crud.markRowError(error.id, error.message);
        });

        showTestOutput('Save errors', result);
        grid.feedback.show({
            type: 'warning',
            message: 'The fake backend returned validation errors.'
        });
    }

    return grid;
};

const createMultifieldLookupGrid = async () => {
    const tableMount = document.querySelector('#multifield-lookup-test-table');
    const municipalities = await loadMunicipalities();
    const municipalityLookup = AMB.lookup({
        keyField: 'istatCode',
        valueField: 'municipalityName',
        labelField: 'municipalityName',
        columns: MUNICIPALITY_LOOKUP_COLUMNS,
        search: {
            fields: 'visible'
        },
        load: ({ query }) => {
            return filterMunicipalities(municipalities, query);
        }
    });
    const municipalityDialog = new AMB.LookupDialog();
    const municipalityMultifieldLookup = createMunicipalityMultifieldLookup(municipalityLookup);
    const grid = AMB.table({
        selector: '#multifield-lookup-test-table',
        deleteColumn: {
            enabled: true,
            confirmDeleteMessage: 'Delete this municipality row?',
            confirmRemoveNewMessage: 'Remove this new municipality row?'
        },
        toolbar: {
            buttons: [
                'add',
                'payload',
                'validate'
            ],
            onAdd: handleAdd,
            onPayload: handleShowPayload,
            onValidate: handleValidate
        },
        data: createMultifieldRows(),
        layout: 'fitColumns',
        columns: [
            {
                title: 'Text before',
                field: 'textBefore',
                width: 150,
                editor: AMB.editors.text({ trim: true })
            },
            municipalityMultifieldLookup.masterColumn({
                width: 220,
                dialog: municipalityDialog,
                editorOptions: {
                    dialogTitle: 'Select an Italian municipality',
                    searchPlaceholder: 'Search municipality, province, region, or postal code...',
                    ...testLookupAutoCompleteOptions,
                    dialogOptions: {
                        closeOnBackdropClick: false,
                        pagination: {
                            enabled: true,
                            pageSize: 100,
                            controls: 'full'
                        },
                        destroyOnClose: true
                    }
                }
            }),
            municipalityMultifieldLookup.dependentColumn('province', { width: 100 }),
            municipalityMultifieldLookup.dependentColumn('region', { width: 130 }),
            municipalityMultifieldLookup.dependentColumn('postalCode', { width: 125 }),
            municipalityMultifieldLookup.dependentColumn('istatCode', { width: 120 }),
            municipalityMultifieldLookup.dependentColumn('cadastralCode', { width: 155 }),
            {
                title: 'Text after',
                field: 'textAfter',
                width: 150,
                editor: AMB.editors.text({ trim: true })
            }
        ]
    });
    const originalDestroy = grid.destroy.bind(grid);

    grid.destroy = () => {
        municipalityDialog.destroy();
        originalDestroy();
    };

    function handleAdd() {
        grid.feedback.clear();
        return grid.crud.addRow(createEmptyMultifieldRow());
    }

    function handleShowPayload({ payload }) {
        showTestOutput('Multifield Lookup municipality payload', {
            definition: municipalityMultifieldLookup,
            payload,
            report: buildStateSummary(grid.crud.getStateReport())
        });
    }

    function handleValidate() {
        const validateResult = grid.crud.validateAll();

        showTestOutput('Multifield Lookup municipality validation', {
            definition: municipalityMultifieldLookup,
            isValid: validateResult.isValid,
            validateResult,
            payload: grid.crud.getSavePayload({ includeInvalid: true })
        });
        grid.feedback.show({
            type: validateResult.isValid ? 'success' : 'warning',
            message: validateResult.isValid
                ? 'Multifield Lookup municipality rows are valid.'
                : 'Multifield Lookup municipality rows contain errors.'
        });
    }

    if (tableMount) {
        showTestOutput('Multifield Lookup municipality dataset loaded', {
            rows: municipalities.length,
            definition: municipalityMultifieldLookup
        });
    }

    return grid;
};

const createAutocompleteGrid = () => {
    const grid = AMB.table({
        selector: '#autocomplete-test-table',
        toolbar: {
            buttons: [
                'add',
                'payload',
                'validate'
            ],
            onAdd: handleAdd,
            onPayload: handleShowPayload,
            onValidate: handleValidate
        },
        data: createAutocompleteData(),
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 70 },
            {
                title: 'Task',
                field: 'task',
                editor: AMB.editors.text({
                    trim: true,
                    maxLength: 80
                })
            },
            {
                title: 'Department strict',
                field: 'department',
                editor: AMB.editors.autocomplete(autocompleteDepartments, {
                    allowEmpty: true,
                    allowCustomValue: false,
                    invalidBehavior: 'commitRaw',
                    placeholder: 'Type to search...'
                }),
                validation: {
                    allowedValues: {
                        values: autocompleteDepartments,
                        trim: true,
                        caseSensitive: false,
                        message: 'Choose a department from the list'
                    }
                }
            },
            {
                title: 'Department required',
                field: 'requiredDepartment',
                editor: AMB.editors.autocomplete(autocompleteDepartments, {
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
                        values: autocompleteDepartments,
                        trim: true,
                        caseSensitive: false,
                        message: 'Choose a department from the list'
                    }
                }
            },
            {
                title: 'Free autocomplete',
                field: 'tag',
                editor: AMB.editors.autocomplete(autocompleteTags, {
                    allowEmpty: true,
                    allowCustomValue: true,
                    placeholder: 'Type or add a tag...'
                })
            },
            {
                title: 'Long list (max 5)',
                field: 'city',
                editor: AMB.editors.autocomplete(autocompleteCities, {
                    allowEmpty: true,
                    allowCustomValue: true,
                    maxOptions: 5,
                    placeholder: 'Try B, M, or R...'
                })
            }
        ]
    });

    function handleAdd() {
        grid.feedback.clear();
        return grid.crud.addRow(createEmptyAutocompleteRow());
    }

    function handleShowPayload({ payload }) {
        showTestOutput('Autocomplete payload', {
            payload,
            report: buildStateSummary(grid.crud.getStateReport())
        });
    }

    function handleValidate() {
        const validateResult = grid.crud.validateAll();

        showTestOutput('Autocomplete validation', {
            isValid: validateResult.isValid,
            validateResult,
            payload: grid.crud.getSavePayload({ includeInvalid: true })
        });
        grid.feedback.show({
            type: validateResult.isValid ? 'success' : 'warning',
            message: validateResult.isValid
                ? 'Autocomplete rows are valid.'
                : 'Autocomplete rows contain errors.'
        });
    }

    return grid;
};

const createColumnCalculationsGrid = () => {
    return AMB.table({
        selector: '#column-calculations-test-table',
        toolbar: {
            buttons: [
                'add',
                {
                    id: 'calculation-results',
                    label: 'Risultati',
                    title: 'Mostra risultati calcoli',
                    onClick: ({ grid }) => {
                        showTestOutput('Risultati calcoli', grid.getCalcResults());
                    }
                },
                {
                    id: 'calculation-recalculate',
                    label: 'Ricalcola',
                    title: 'Ricalcola risultati',
                    onClick: ({ grid }) => {
                        grid.recalc();
                        showTestOutput('Risultati ricalcolati', grid.getCalcResults());
                    }
                }
            ],
            onAdd: ({ grid }) => {
                return grid.addRow(createEmptyColumnCalculationsRow());
            }
        },
        deleteColumn: {
            enabled: true,
            confirmDeleteMessage: 'Eliminare questa riga?',
            confirmRollbackMessage: 'Ripristinare questa riga?',
            confirmRemoveNewMessage: 'Rimuovere questa nuova riga?',
            labels: {
                delete: 'Elimina riga',
                rollback: 'Ripristina riga',
                removeNew: 'Rimuovi nuova riga'
            }
        },
        data: createColumnCalculationsData(),
        layout: 'fitColumns',
        pagination: {
            enabled: true,
            mode: 'local',
            pageSize: 10,
            pageSizeSelector: [10, 20, 50]
        },
        search: {
            enabled: true,
            placeholder: 'Filtra calcoli...',
            filters: {
                enabled: true
            }
        },
        columns: [
            {
                title: 'ID',
                field: 'id',
                width: 70,
                topCalc: 'count',
                topCalcFormatter: AMB.formatters.calculation({ label: 'COUNT:' })
            },
            {
                title: 'Codice',
                field: 'code',
                width: 300,
                editor: AMB.editors.text({ trim: true, uppercase: true }),
                topCalc: 'concat',
                topCalcFormatter: AMB.formatters.calculation({ label: 'CONCAT:' })
            },
            {
                title: 'Prodotto',
                field: 'product',
                minWidth: 120,
                widthGrow: 1,
                editor: AMB.editors.text({ trim: true }),
                topCalc: calculateScoreRange,
                topCalcFormatter: AMB.formatters.calculation({ label: 'RANGE:' })
            },
            {
                title: 'Categoria',
                field: 'category',
                minWidth: 120,
                widthGrow: 1,
                editor: AMB.editors.text({ trim: true }),
                topCalc: 'unique',
                topCalcFormatter: AMB.formatters.calculation({ label: 'UNIQUE:' })
            },
            {
                title: 'Quantità',
                field: 'quantity',
                width: 105,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                topCalc: 'sum',
                topCalcFormatter: AMB.formatters.calculation({ label: 'SUM:' })
            },
            {
                title: 'Prezzo unitario',
                field: 'unitPrice',
                width: 125,
                editor: AMB.editors.decimal({ integerDigits: 7, decimalDigits: 2, allowEmpty: false }),
                topCalc: 'avg',
                topCalcParams: { precision: false },
                topCalcFormatter: AMB.formatters.calculation({
                    label: 'AVG:',
                    className: 'test-calc-highlight',
                    formatValue: formatItalianDecimal
                })
            },
            {
                title: 'Giorni consegna',
                field: 'deliveryDays',
                width: 130,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                topCalc: 'min',
                topCalcFormatter: AMB.formatters.calculation({ label: 'MIN:' })
            },
            {
                title: 'Punteggio',
                field: 'score',
                width: 105,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                topCalc: 'max',
                topCalcFormatter: AMB.formatters.calculation({ label: 'MAX:' })
            }
        ]
    });
};

const mountGrid = async () => {
    if (currentGrid && typeof currentGrid.destroy === 'function') {
        currentGrid.destroy();
        currentGrid = null;
    }

    const selectionMode = selectionModeControl && selectionModeControl.value === 'multiple'
        ? 'multiple'
        : 'single';

    currentGrid = await createGrid(selectionMode);
};

const mountMultifieldLookupGrid = async () => {
    if (currentMultifieldLookupGrid && typeof currentMultifieldLookupGrid.destroy === 'function') {
        currentMultifieldLookupGrid.destroy();
        currentMultifieldLookupGrid = null;
    }

    currentMultifieldLookupGrid = await createMultifieldLookupGrid();
};

const mountAutocompleteGrid = () => {
    if (currentAutocompleteGrid && typeof currentAutocompleteGrid.destroy === 'function') {
        currentAutocompleteGrid.destroy();
        currentAutocompleteGrid = null;
    }

    currentAutocompleteGrid = createAutocompleteGrid();
};

const mountColumnCalculationsGrid = () => {
    if (
        currentColumnCalculationsGrid
        && typeof currentColumnCalculationsGrid.destroy === 'function'
    ) {
        currentColumnCalculationsGrid.destroy();
        currentColumnCalculationsGrid = null;
    }

    currentColumnCalculationsGrid = createColumnCalculationsGrid();
};

selectionModeControl?.addEventListener('change', () => {
    mountGrid().catch(error => {
        console.error(error);
        showTestOutput('Test grid remount failed', {
            message: error && error.message ? error.message : String(error),
            stack: error && error.stack ? error.stack : null
        });
    });
});

const mountTestPage = async () => {
    await mountGrid();
    await mountMultifieldLookupGrid();
    mountAutocompleteGrid();
    mountColumnCalculationsGrid();
};

mountTestPage().catch(error => {
    console.error(error);
    showTestOutput('Test page initialization failed', {
        message: error && error.message ? error.message : String(error),
        stack: error && error.stack ? error.stack : null
    });
});
