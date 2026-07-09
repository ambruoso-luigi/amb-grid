import { AMB } from '../index.js';
import { fakeApi } from '../../demo/fake-backend/fake-api.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';

const messages = {
    it: {
        loaded: 'Dati magazzino caricati.',
        reloaded: 'Dati ricaricati.',
        noChanges: 'Non ci sono modifiche da salvare.',
        invalid: 'Correggi gli errori evidenziati prima di salvare.',
        saving: 'Salvataggio simulato in corso...',
        saved: 'Modifiche salvate e stati riallineati.',
        saveError: 'Il backend fake ha restituito errori di validazione.',
        payloadTitle: 'Payload di salvataggio',
        reportTitle: 'Report stato righe',
        validationTitle: 'Report validazione',
        saveTitle: 'Risultato salvataggio',
        validationValid: 'Tutte le righe attive sono valide.',
        validationInvalid: 'Sono presenti righe con errori.',
        stateReport: 'Report stato righe',
        totalRows: 'Righe totali',
        validChangedRows: 'Righe modificate valide',
        errorRows: 'Righe con errori',
        canSave: 'Salvabile',
        inserted: 'Inserite',
        updated: 'Aggiornate',
        deleted: 'Eliminate',
        generatedIds: 'ID backend generati'
    },
    en: {
        loaded: 'Warehouse data loaded.',
        reloaded: 'Data reloaded.',
        noChanges: 'There are no changes to save.',
        invalid: 'Fix highlighted errors before saving.',
        saving: 'Simulated save in progress...',
        saved: 'Changes saved and row states aligned.',
        saveError: 'The fake backend returned validation errors.',
        payloadTitle: 'Save payload',
        reportTitle: 'Row state report',
        validationTitle: 'Validation report',
        saveTitle: 'Save result',
        validationValid: 'All active rows are valid.',
        validationInvalid: 'Some rows contain errors.',
        stateReport: 'Row state report',
        totalRows: 'Total rows',
        validChangedRows: 'Valid changed rows',
        errorRows: 'Rows with errors',
        canSave: 'Can save',
        inserted: 'Inserted',
        updated: 'Updated',
        deleted: 'Deleted',
        generatedIds: 'Generated backend IDs'
    }
};

const getLanguage = () => {
    return document.documentElement.lang === 'en' ? 'en' : 'it';
};

const t = key => messages[getLanguage()][key] || messages.it[key] || key;

const formatInspectionCheckbox = cell => {
    const checked = cell.getValue() === true;
    const stateClass = checked ? ' is-checked' : '';

    return `<span class="demo-inspection-visual${stateClass}" aria-hidden="true"></span>`;
};

const demoRowActionMessages = {
    delete: 'Delete this product?',
    rollback: 'Rollback this product?',
    removeNew: 'Remove this new product?'
};

const demoRowActionLabels = {
    delete: 'Delete product',
    rollback: 'Rollback product changes',
    removeNew: 'Remove new product'
};

const demoRowActionIcons = {
    delete: '🗑',
    rollback: '↶',
    removeNew: '×'
};

const getDemoRowState = (row, crud) => {
    const data = row && typeof row.getData === 'function' ? row.getData() : {};
    const stateField = crud && crud.options ? crud.options.stateField : '_state';

    return data[stateField] || 'clean';
};

const getDemoRowIdentifier = (crud, data) => {
    const id = data[crud.options.idField];

    if (id !== null && id !== undefined && id !== '') return id;

    return data[crud.options.tempIdField];
};

const getDemoRowActionConfig = state => {
    if (state === 'new') {
        return {
            action: 'remove-new',
            icon: demoRowActionIcons.removeNew,
            label: demoRowActionLabels.removeNew,
            className: 'amb-row-action-button--remove-new'
        };
    }

    if (state === 'modified' || state === 'deleted') {
        return {
            action: 'rollback',
            icon: demoRowActionIcons.rollback,
            label: demoRowActionLabels.rollback,
            className: 'amb-row-action-button--rollback'
        };
    }

    return {
        action: 'delete',
        icon: demoRowActionIcons.delete,
        label: demoRowActionLabels.delete,
        className: 'amb-row-action-button--delete'
    };
};

const createDemoRowActionsContainer = state => {
    const container = document.createElement('div');
    const config = getDemoRowActionConfig(state);
    const button = document.createElement('button');

    container.className = 'amb-row-actions amb-demo-row-actions';
    button.type = 'button';
    button.className = `amb-row-action-button ${config.className}`;
    button.dataset.action = config.action;
    button.textContent = config.icon;
    button.setAttribute('aria-label', config.label);
    button.title = config.label;
    container.append(button);

    return container;
};

const updateDemoRowActionButton = (row, crud) => {
    const rowElement = row && typeof row.getElement === 'function' ? row.getElement() : null;
    const container = rowElement && rowElement.querySelector('.amb-demo-row-actions');

    if (!container) return;

    container.replaceWith(createDemoRowActionsContainer(getDemoRowState(row, crud)));
};

const createDemoRowActionColumn = ({ getCrud, confirmDialog }) => ({
    title: '',
    field: '_demoRowActions',
    width: 55,
    hozAlign: 'center',
    headerSort: false,
    formatter: cell => createDemoRowActionsContainer(getDemoRowState(cell.getRow(), getCrud())),
    cellClick: async (event, cell) => {
        const target = event.target;
        const actionElement = target && typeof target.closest === 'function'
            ? target.closest('[data-action]')
            : null;
        const crud = getCrud();

        if (!actionElement || !crud) return;

        const row = cell.getRow();
        const data = row.getData();
        const state = getDemoRowState(row, crud);
        const action = actionElement.dataset.action;
        const identifier = getDemoRowIdentifier(crud, data);

        if (action === 'remove-new' && state === 'new') {
            if (await confirmDialog.confirm({ message: demoRowActionMessages.removeNew })) {
                crud.deleteRow(identifier);
            }

            return;
        }

        if (action === 'rollback' && (state === 'modified' || state === 'deleted')) {
            if (await confirmDialog.confirm({ message: demoRowActionMessages.rollback })) {
                crud.rollbackRow(identifier);
                updateDemoRowActionButton(row, crud);
            }

            return;
        }

        if (action !== 'delete' || (state !== 'clean' && state !== 'saved')) return;

        if (await confirmDialog.confirm({ message: demoRowActionMessages.delete })) {
            crud.deleteRow(identifier);
            updateDemoRowActionButton(row, crud);
        }
    }
});

const countRowsByState = (report, state) => {
    return report.rows.filter(row => row.state === state).length;
};

const hasPayloadChanges = payload => {
    const changes = payload.changes || {};

    return Boolean(
        (changes.inserted || []).length
        || (changes.updated || []).length
        || (changes.deleted || []).length
    );
};

const buildPayloadReport = payload => [
    `${t('inserted')}: ${payload.changes.inserted.length}`,
    `${t('updated')}: ${payload.changes.updated.length}`,
    `${t('deleted')}: ${payload.changes.deleted.length}`,
    `${t('canSave')}: ${payload.canSave}`
];

const buildStateReport = report => [
    t('stateReport'),
    '',
    `${t('totalRows')}: ${report.totalRows}`,
    `Clean: ${countRowsByState(report, 'clean')}`,
    `New: ${countRowsByState(report, 'new')}`,
    `Modified: ${countRowsByState(report, 'modified')}`,
    `Deleted: ${countRowsByState(report, 'deleted')}`,
    `Saved: ${countRowsByState(report, 'saved')}`,
    `${t('errorRows')}: ${report.errorRowsCount}`,
    `${t('validChangedRows')}: ${report.validChangedRowsCount}`,
    `${t('canSave')}: ${report.validChangedRowsCount > 0 && !report.hasErrors}`
];

const buildValidationReport = validateResult => [
    validateResult.isValid ? t('validationValid') : t('validationInvalid'),
    '',
    ...validateResult.rows
        .filter(row => !row.isValid)
        .map(row => {
            const rowLabel = row.rowNumber ?? row.id ?? row.key ?? 'n/a';
            const fields = row.errors.map(error => error.field).join(', ');

            return `Row ${rowLabel}: ${fields}`;
        })
];

const buildSaveReport = ({ result, applyIdsResult, savedResult }) => [
    t('saveTitle'),
    '',
    `${t('inserted')}: ${result.saved.inserted.length}`,
    `${t('updated')}: ${result.saved.updated.length}`,
    `${t('deleted')}: ${result.saved.deleted.length}`,
    `${t('generatedIds')}: ${(result.generatedIds || []).length}`,
    `Applied IDs: ${applyIdsResult.applied.length}`,
    `Saved rows: ${savedResult.saved.length}`
];

export default async function fullDemo(app, options = {}) {
    const {
        className = '',
        compactHeader = false,
        showHeader = true,
        showScenario = true,
        tableHeight = null,
        variant = 'default'
    } = options;
    const extraClasses = [
        variant && variant !== 'default' ? `demo-shell--${variant}` : '',
        compactHeader ? 'demo-shell--compact-header' : '',
        className
    ]
        .join(' ')
        .split(/\s+/)
        .filter(Boolean);

    if (extraClasses.length) {
        app.classList.add(...extraClasses);
    }
    document.body.classList.add('demo-main-demo-active');

    if (tableHeight) {
        app.style.setProperty('--demo-table-height', tableHeight);
    } else {
        app.style.removeProperty('--demo-table-height');
    }

    app.innerHTML = `
        <div class="demo-inventory-panel card bg-base-100 text-base-content" data-theme="light">
            ${showHeader ? `<div class="demo-app-shell__header card-body">
                <div>
                    <span class="demo-main-badge" data-i18n="mainDemo.primaryLabel">Demo principale</span>
                    <p class="demo-kicker" data-i18n="mainDemo.kicker">Demo legacy-friendly</p>
                    <h2 data-i18n="mainDemo.title">Gestionale Magazzino Classico</h2>
                    <p class="demo-note" data-i18n="mainDemo.description">Una pagina gestionale classica, adatta a contesti server-rendered e legacy-friendly, con una UI moderna per CRUD, validazione e payload applicativi.</p>
                </div>
                ${showScenario ? '<p class="demo-scenario-label" data-i18n="mainDemo.scenario">Scenario: Classic Warehouse Backoffice</p>' : ''}
            </div>` : ''}
            <div class="demo-app-shell card bg-base-100">
                <div class="demo-app-shell__meta card-body">
                    <div>
                        <p class="demo-kicker" data-i18n="mainDemo.panelKicker">Pannello operativo</p>
                        <h3 data-i18n="mainDemo.panelTitle">Dati magazzino editabili</h3>
                        <p class="demo-note" data-i18n="mainDemo.panelText">Gestisci righe prodotto, stati CRUD, validazione e payload backend nello stesso flusso.</p>
                    </div>
                </div>
                <div class="demo-table-workbench">
                    <div id="inventory-table" class="amb-demo-inventory-grid"></div>
                </div>
            </div>
        </div>
    `;

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
    const confirmDialog = new AMB.ConfirmDialog();
    const reportDialog = createDemoReportDialog();
    const warehouseOptions = await fakeApi.getWarehouses();
    const products = await fakeApi.getProducts();
    let crud = null;
    let unsubscribeDemoRowActions = null;

    const tableOptions = {
        selector: '#inventory-table',
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
                formatter: formatInspectionCheckbox,
                editor: AMB.editors.checkbox({
                    checkedLabel: '',
                    uncheckedLabel: ''
                })
            },
            createDemoRowActionColumn({
                getCrud: () => crud,
                confirmDialog
            }),
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

    if (tableHeight) {
        tableOptions.height = tableHeight;
    }

    const demo = AMB.table(tableOptions);
    crud = demo.crud;
    unsubscribeDemoRowActions = crud.on('row-state-changed', ({ row }) => {
        updateDemoRowActionButton(row, crud);
    });
    const originalDestroy = demo.destroy.bind(demo);

    demo.feedback.show({
        type: 'info',
        message: t('loaded')
    });

    demo.destroy = () => {
        if (typeof unsubscribeDemoRowActions === 'function') {
            unsubscribeDemoRowActions();
        }

        confirmDialog.destroy();
        reportDialog.destroy();
        app.style.removeProperty('--demo-table-height');
        document.body.classList.remove('demo-main-demo-active');
        if (extraClasses.length) {
            app.classList.remove(...extraClasses);
        }

        if (statusDialog.resolve) {
            statusDialog.close(null);
        } else {
            statusDialog.destroy();
        }

        originalDestroy();
    };

    function openPayloadReport(payload = crud.getSavePayload()) {
        reportDialog.open({
            title: t('payloadTitle'),
            reportLines: buildPayloadReport(payload),
            jsonData: payload
        });
    }

    function openStateReport() {
        const report = crud.getStateReport();

        reportDialog.open({
            title: t('reportTitle'),
            reportLines: buildStateReport(report),
            jsonData: report
        });
    }

    function openValidationReport(validateResult) {
        reportDialog.open({
            title: t('validationTitle'),
            reportLines: buildValidationReport(validateResult),
            jsonData: {
                validateResult,
                payload: crud.getSavePayload({ includeInvalid: true })
            }
        });
    }

    function handleAdd() {
        demo.feedback.clear();
        return crud.addRow({
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
        demo.feedback.clear();
        reportDialog.close();

        const reloadedProducts = await fakeApi.getProducts();

        await demo.table.setData(reloadedProducts);
        demo.feedback.show({
            type: 'success',
            message: t('reloaded')
        });
    }

    function handleShowPayload({ payload }) {
        openPayloadReport(payload);
    }

    function handleShowReport() {
        openStateReport();
    }

    function handleValidate() {
        const validateResult = crud.validateAll();

        openValidationReport(validateResult);
        demo.feedback.show({
            type: validateResult.isValid ? 'success' : 'warning',
            message: validateResult.isValid ? t('validationValid') : t('validationInvalid')
        });
    }

    async function handleSave() {
        demo.feedback.clear();

        const validateResult = crud.validateAll();

        if (!validateResult.isValid) {
            openValidationReport(validateResult);
            demo.feedback.show({
                type: 'warning',
                message: t('invalid')
            });
            return;
        }

        const payload = crud.getSavePayload();

        if (!hasPayloadChanges(payload)) {
            demo.feedback.show({
                type: 'info',
                message: t('noChanges')
            });
            return;
        }

        demo.feedback.show({
            type: 'info',
            message: t('saving')
        });

        const result = await fakeApi.saveProductChanges(payload);

        if (result.ok) {
            const applyIdsResult = crud.applyBackendIds(result.generatedIds || []);
            const savedResult = crud.markValidChangesSaved();
            const details = {
                result,
                applyIdsResult,
                savedResult,
                report: crud.getStateReport()
            };

            reportDialog.open({
                title: t('saveTitle'),
                reportLines: buildSaveReport(details),
                jsonData: details
            });
            demo.feedback.show({
                type: 'success',
                message: t('saved')
            });
            return;
        }

        (result.errors || []).forEach(error => {
            if (error.field) {
                crud.markCellError(error.id, error.field, error.message);
                return;
            }

            crud.markRowError(error.id, error.message);
        });

        reportDialog.open({
            title: t('saveTitle'),
            reportLines: [t('saveError')],
            jsonData: result
        });
        demo.feedback.show({
            type: 'warning',
            message: t('saveError')
        });
    }

    return demo;
}
