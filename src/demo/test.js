import 'tabulator-tables/dist/css/tabulator.min.css';
import 'vanillajs-datepicker/css/datepicker.min.css';
import '../amb-grid.css';
import './test.css';

import { AMB } from '../index.js';
import { fakeApi } from '../../demo/fake-backend/fake-api.js';

const output = document.querySelector('#test-output');
const selectionModeControl = document.querySelector('#selection-mode');
let currentGrid = null;

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
                    autoComplete: true,
                    autoCompleteMinChars: 1,
                    autoCompleteOnTab: true,
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

selectionModeControl?.addEventListener('change', () => {
    mountGrid().catch(error => {
        console.error(error);
        showTestOutput('Test grid remount failed', {
            message: error && error.message ? error.message : String(error),
            stack: error && error.stack ? error.stack : null
        });
    });
});

mountGrid().catch(error => {
    console.error(error);
    showTestOutput('Test page initialization failed', {
        message: error && error.message ? error.message : String(error),
        stack: error && error.stack ? error.stack : null
    });
});
