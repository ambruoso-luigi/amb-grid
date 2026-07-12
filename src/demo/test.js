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
let currentMultifieldGrid = null;

const testLookupAutoCompleteOptions = {
    autoComplete: true,
    autoCompleteMinChars: 1,
    autoCompleteOnTab: true
};
const MLK_DATASET_URL = `${import.meta.env.BASE_URL}demo/data/italian-municipalities.demo.json`;
const createMunicipalityMlk = municipalityLookup => AMB.mlk({
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
        istatCode: '065078',
        cadastralCode: 'F912',
        municipality: 'Nocera Inferiore',
        province: 'SA',
        region: 'CAMPANIA',
        postalCode: '84014'
    },
    {
        id: 2,
        istatCode: '015146',
        cadastralCode: 'F205',
        municipality: 'Milano',
        province: 'MI',
        region: 'LOMBARDIA',
        postalCode: '20121'
    }
];

const createEmptyMultifieldRow = () => ({
    id: null,
    istatCode: '',
    cadastralCode: '',
    municipality: '',
    province: '',
    region: '',
    postalCode: ''
});

const loadMunicipalities = async () => {
    const response = await fetch(MLK_DATASET_URL);

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
        mapToRow: MUNICIPALITY_MAP_TO_ROW,
        load: ({ query }) => {
            return filterMunicipalities(municipalities, query);
        }
    });
    const municipalityDialog = new AMB.LookupDialog();
    const municipalityMlk = createMunicipalityMlk(municipalityLookup);
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
            municipalityMlk.masterColumn({
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
            municipalityMlk.dependentColumn('province', { width: 100 }),
            municipalityMlk.dependentColumn('region', { width: 130 }),
            municipalityMlk.dependentColumn('postalCode', { width: 125 }),
            municipalityMlk.dependentColumn('istatCode', { width: 120 }),
            municipalityMlk.dependentColumn('cadastralCode', { width: 155 })
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
        showTestOutput('MLK municipality payload', {
            definition: municipalityMlk,
            payload,
            report: buildStateSummary(grid.crud.getStateReport())
        });
    }

    function handleValidate() {
        const validateResult = grid.crud.validateAll();

        showTestOutput('MLK municipality validation', {
            definition: municipalityMlk,
            isValid: validateResult.isValid,
            validateResult,
            payload: grid.crud.getSavePayload({ includeInvalid: true })
        });
        grid.feedback.show({
            type: validateResult.isValid ? 'success' : 'warning',
            message: validateResult.isValid
                ? 'MLK municipality rows are valid.'
                : 'MLK municipality rows contain errors.'
        });
    }

    if (tableMount) {
        showTestOutput('MLK municipality dataset loaded', {
            rows: municipalities.length,
            definition: municipalityMlk
        });
    }

    return grid;
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
    if (currentMultifieldGrid && typeof currentMultifieldGrid.destroy === 'function') {
        currentMultifieldGrid.destroy();
        currentMultifieldGrid = null;
    }

    currentMultifieldGrid = await createMultifieldLookupGrid();
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
};

mountTestPage().catch(error => {
    console.error(error);
    showTestOutput('Test page initialization failed', {
        message: error && error.message ? error.message : String(error),
        stack: error && error.stack ? error.stack : null
    });
});
