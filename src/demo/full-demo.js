import { AMB } from '../index.js';
import { fakeApi } from '../../demo/fake-backend/fake-api.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';
import { createDemoCheckboxFormatter } from './utils/demo-checkbox.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';

const DEMO_SAVE_POLICY = 'valid-only';

const messages = {
    it: {
        reloaded: 'Dati ricaricati.',
        noChanges: 'Non ci sono modifiche da salvare.',
        invalid: 'Correggi gli errori evidenziati prima di salvare.',
        saved: 'Modifiche salvate e stati riallineati.',
        partialSaved: 'Modifiche valide salvate. Le righe con errori restano da correggere.',
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
        invalidChangedRows: 'Righe modificate non valide',
        errorRows: 'Righe con errori',
        savePolicy: 'Policy',
        partialSave: 'Salvataggio parziale',
        partialSaveAvailable: 'Salvataggio parziale disponibile',
        canSave: 'Salvabile',
        inserted: 'Inserite',
        updated: 'Aggiornate',
        deleted: 'Eliminate',
        generatedIds: 'ID backend generati',
        rowsStillNeedingCorrection: 'Righe rimaste da correggere',
        partialSaveTitle: 'Sono presenti righe con errori',
        partialSaveConfirm: 'Salva modifiche valide',
        partialSaveCancel: 'Annulla',
        row: 'Riga',
        validChangesCanSave: '{count} modifiche valide possono comunque essere salvate.',
        invalidRowsRemainPending: 'Le righe con errori resteranno in attesa di correzione.',
        saveValidChangesQuestion: 'Vuoi salvare le modifiche valide?'
    },
    en: {
        reloaded: 'Data reloaded.',
        noChanges: 'There are no changes to save.',
        invalid: 'Fix highlighted errors before saving.',
        saved: 'Changes saved and row states aligned.',
        partialSaved: 'Valid changes saved. Rows with errors are still pending correction.',
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
        invalidChangedRows: 'Invalid changed rows',
        errorRows: 'Rows with errors',
        savePolicy: 'Policy',
        partialSave: 'Partial save',
        partialSaveAvailable: 'Partial save available',
        canSave: 'Can save',
        inserted: 'Inserted',
        updated: 'Updated',
        deleted: 'Deleted',
        generatedIds: 'Generated backend IDs',
        rowsStillNeedingCorrection: 'Rows still needing correction',
        partialSaveTitle: 'Some changed rows contain errors',
        partialSaveConfirm: 'Save valid changes',
        partialSaveCancel: 'Cancel',
        row: 'Row',
        validChangesCanSave: '{count} valid changes can still be saved.',
        invalidRowsRemainPending: 'Rows with errors will remain pending for correction.',
        saveValidChangesQuestion: 'Do you want to save the valid changes?'
    }
};

const getLanguage = () => {
    return document.documentElement.lang === 'en' ? 'en' : 'it';
};

const t = key => messages[getLanguage()][key] || messages.it[key] || key;

const formatInspectionCheckbox = createDemoCheckboxFormatter();

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

const countRowsByState = (report, state) => {
    return report.rows.filter(row => row.state === state).length;
};

const getValidChangesCount = payload => {
    const changes = payload.changes || {};

    return (changes.inserted || []).length
        + (changes.updated || []).length
        + (changes.deleted || []).length;
};

const getInvalidChangedRowLines = validateResult => {
    const groupedRows = new Map();

    validateResult.rows
        .filter(row => !row.isValid)
        .forEach(row => {
            const rowLabel = row.rowNumber ?? row.id ?? row.key ?? 'n/a';
            const fields = [...new Set(row.errors.map(error => error.field))];

            groupedRows.set(rowLabel, fields);
        });

    return [...groupedRows.entries()].map(([rowLabel, fields]) => {
        return `${t('row')} ${rowLabel}: ${fields.join(', ')}`;
    });
};

const buildPayloadReport = payload => [
    `${t('savePolicy')}: ${payload.savePolicy}`,
    `${t('inserted')}: ${payload.changes.inserted.length}`,
    `${t('updated')}: ${payload.changes.updated.length}`,
    `${t('deleted')}: ${payload.changes.deleted.length}`,
    `${t('validChangedRows')}: ${payload.hasValidChanges ? getValidChangesCount(payload) : 0}`,
    `${t('invalidChangedRows')}: ${payload.hasInvalidChanges ? payload.summary.invalidChangedRowsCount : 0}`,
    `${t('partialSave')}: ${payload.isPartialSave}`,
    `${t('canSave')}: ${payload.canSave}`
];

const buildStateReport = (report, payload) => [
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
    `${t('invalidChangedRows')}: ${report.invalidChangedRowsCount}`,
    `${t('partialSaveAvailable')}: ${payload.isPartialSave}`,
    `${t('canSave')}: ${payload.canSave}`
];

const buildValidationReport = validateResult => [
    validateResult.isValid ? t('validationValid') : t('validationInvalid'),
    '',
    ...getInvalidChangedRowLines(validateResult)
];

const buildPartialSaveMessage = ({ payload, validateResult }) => [
    ...getInvalidChangedRowLines(validateResult),
    '',
    t('validChangesCanSave').replace('{count}', getValidChangesCount(payload)),
    t('invalidRowsRemainPending'),
    '',
    t('saveValidChangesQuestion')
].join('\n');

const buildSaveReport = ({ result, applyIdsResult, savedResult, payload, validateResult }) => [
    t('saveTitle'),
    '',
    `${t('inserted')}: ${result.saved.inserted.length}`,
    `${t('updated')}: ${result.saved.updated.length}`,
    `${t('deleted')}: ${result.saved.deleted.length}`,
    `${t('generatedIds')}: ${(result.generatedIds || []).length}`,
    `Applied IDs: ${applyIdsResult.applied.length}`,
    `Saved rows: ${savedResult.saved.length}`,
    ...(payload.isPartialSave
        ? [`${t('rowsStillNeedingCorrection')}: ${getInvalidChangedRowLines(validateResult).length}`]
        : [])
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
                ${createDemoColumnGuide({
                    summary: 'How this table works',
                    summaryKey: 'mainDemo.guide.summary',
                    intro: 'Edit inventory data directly while AMB Grid coordinates CRUD state, validation, lookup, search, payload, and save actions.',
                    introKey: 'mainDemo.guide.intro',
                    points: [
                        { title: 'Edit and add', titleKey: 'mainDemo.guide.edit.title', description: 'Edit cells directly or use Add Row to create a new local product.', descriptionKey: 'mainDemo.guide.edit.description' },
                        { title: 'Row actions', titleKey: 'mainDemo.guide.actions.title', description: 'Clean and saved rows show Delete, modified or deleted rows show Rollback, and new rows show Remove new.', descriptionKey: 'mainDemo.guide.actions.description' },
                        { title: 'Validation and lookup', titleKey: 'mainDemo.guide.validation.title', description: 'Field rules validate edits; autocomplete and lookup editors guide controlled selections.', descriptionKey: 'mainDemo.guide.validation.description' },
                        { title: 'Payload and save', titleKey: 'mainDemo.guide.save.title', description: 'The payload separates inserted, updated and deleted records. If some changed rows contain errors, Save can persist the valid changes after confirmation while invalid rows remain pending.', descriptionKey: 'mainDemo.guide.save.description' },
                        { title: 'Search and filters', titleKey: 'mainDemo.guide.search.title', description: 'Search and filter controls narrow the visible inventory without changing the underlying data.', descriptionKey: 'mainDemo.guide.search.description' }
                    ],
                    columns: [
                        { title: 'Item code', titleKey: 'guides.main.itemCode.title', badge: 'UNIQUE', description: 'Required uppercase trimmed code matching PRD-A001 format and unique ignoring case.', descriptionKey: 'guides.main.itemCode.description' },
                        { title: 'Product name', titleKey: 'guides.main.productName.title', badge: 'REQUIRED', description: 'Required trimmed text with a minimum length of 3 characters.', descriptionKey: 'guides.main.productName.description' },
                        { title: 'Warehouse', titleKey: 'guides.main.warehouse.title', badge: 'AUTOCOMPLETE', description: 'Required value selected from the known warehouse options.', descriptionKey: 'guides.main.warehouse.description' },
                        { title: 'Stock quantity', titleKey: 'guides.main.stock.title', badge: 'INTEGER', description: 'Required integer with a minimum value of zero.', descriptionKey: 'guides.main.stock.description' },
                        { title: 'Unit price', titleKey: 'guides.main.price.title', badge: 'DECIMAL', description: 'Required non-negative decimal with two decimal places and currency formatting.', descriptionKey: 'guides.main.price.description' },
                        { title: 'Last check date', titleKey: 'guides.main.date.title', badge: 'DATE', description: 'Required real date edited and displayed in dd/mm/yyyy format.', descriptionKey: 'guides.main.date.description' },
                        { title: 'Status', titleKey: 'guides.main.status.title', badge: 'LOOKUP', description: 'Required status selected from a searchable lookup dialog.', descriptionKey: 'guides.main.status.description' },
                        { title: 'Requires inspection', titleKey: 'guides.main.inspection.title', badge: 'BOOLEAN', description: 'Editable checkbox that records whether the product needs inspection.', descriptionKey: 'guides.main.inspection.description' },
                        { title: 'Notes', titleKey: 'guides.main.notes.title', badge: 'LONG TEXT', description: 'Free long text edited in a dialog and shown as a compact preview.', descriptionKey: 'guides.main.notes.description' }
                    ]
                })}
                <div class="demo-table-workbench">
                    <div id="inventory-table" class="amb-demo-inventory-grid demo-business-grid demo-business-grid--viewport"></div>
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
    const reportDialog = createDemoReportDialog();
    const partialSaveDialog = new AMB.ConfirmDialog();
    const warehouseOptions = await fakeApi.getWarehouses();
    const products = await fakeApi.getProducts();
    let crud = null;

    const tableOptions = {
        selector: '#inventory-table',
        rowActionColumn: {
            enabled: true,
            width: 55,
            confirmDeleteMessage: demoRowActionMessages.delete,
            confirmRollbackMessage: demoRowActionMessages.rollback,
            confirmRemoveNewMessage: demoRowActionMessages.removeNew,
            labels: demoRowActionLabels
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
                minWidth: 110,
                widthGrow: 0.8,
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
                minWidth: 170,
                widthGrow: 1.8,
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
                minWidth: 150,
                widthGrow: 1.2,
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
                minWidth: 115,
                widthGrow: 0.65,
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
                minWidth: 110,
                widthGrow: 0.65,
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
                minWidth: 125,
                widthGrow: 0.7,
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
                minWidth: 105,
                widthGrow: 0.7,
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
                minWidth: 145,
                widthGrow: 0.65,
                hozAlign: 'center',
                cssClass: 'demo-business-checkbox-cell',
                formatter: formatInspectionCheckbox,
                editor: AMB.editors.checkbox({
                    checkedLabel: '',
                    uncheckedLabel: ''
                })
            },
            {
                title: 'Notes',
                field: 'notes',
                minWidth: 180,
                widthGrow: 1.7,
                formatter: AMB.formatters.largeTextPreview({ maxLength: 42 }),
                editor: AMB.editors.largeText({
                    title: 'Edit inventory notes',
                    rows: 10,
                    closeOnBackdropClick: false
                })
            }
        ]
    };

    if (tableHeight) {
        tableOptions.height = tableHeight;
    }

    const demo = AMB.table(tableOptions);
    crud = demo.crud;
    const originalDestroy = demo.destroy.bind(demo);

    demo.destroy = () => {
        reportDialog.destroy();
        partialSaveDialog.destroy();
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

    function openPayloadReport(payload = demo.getSavePayload({
        savePolicy: DEMO_SAVE_POLICY,
        includeInvalid: true
    })) {
        reportDialog.open({
            title: t('payloadTitle'),
            reportLines: buildPayloadReport(payload),
            jsonData: payload
        });
    }

    function openStateReport() {
        const report = crud.getStateReport();
        const payload = demo.getSavePayload({
            savePolicy: DEMO_SAVE_POLICY,
            includeInvalid: true
        });

        reportDialog.open({
            title: t('reportTitle'),
            reportLines: buildStateReport(report, payload),
            jsonData: { report, payload }
        });
    }

    function openValidationReport(validateResult) {
        reportDialog.open({
            title: t('validationTitle'),
            reportLines: buildValidationReport(validateResult),
            jsonData: {
                validateResult,
                payload: demo.getSavePayload({
                    savePolicy: DEMO_SAVE_POLICY,
                    includeInvalid: true
                })
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

    function handleShowPayload() {
        openPayloadReport();
    }

    function handleShowReport() {
        openStateReport();
    }

    function handleValidate() {
        const validateResult = demo.validate();

        openValidationReport(validateResult);
        demo.feedback.show({
            type: validateResult.isValid ? 'success' : 'warning',
            message: validateResult.isValid ? t('validationValid') : t('validationInvalid')
        });
    }

    async function handleSave() {
        demo.feedback.clear();

        const validateResult = demo.validateChanges();
        const payload = demo.getSavePayload({
            savePolicy: DEMO_SAVE_POLICY,
            includeInvalid: true
        });

        if (payload.hasChanges === false) {
            demo.feedback.show({
                type: 'info',
                message: t('noChanges')
            });
            return;
        }

        if (payload.hasValidChanges === false && payload.hasInvalidChanges === true) {
            openValidationReport(validateResult);
            demo.feedback.show({
                type: 'warning',
                message: t('invalid')
            });
            return;
        }

        if (payload.hasValidChanges
            && payload.hasInvalidChanges
            && payload.isPartialSave
            && payload.canSave) {
            const confirmed = await partialSaveDialog.confirm({
                title: t('partialSaveTitle'),
                message: buildPartialSaveMessage({ payload, validateResult }),
                confirmText: t('partialSaveConfirm'),
                cancelText: t('partialSaveCancel')
            });

            if (!confirmed) {
                return;
            }
        }

        if (!payload.canSave) {
            openValidationReport(validateResult);
            demo.feedback.show({
                type: 'warning',
                message: t('invalid')
            });
            return;
        }

        const result = await fakeApi.saveProductChanges(payload);

        if (result.ok) {
            const applyIdsResult = crud.applyBackendIds(result.generatedIds || []);
            const savedResult = crud.markValidChangesSaved();
            const details = {
                result,
                applyIdsResult,
                savedResult,
                payload,
                validateResult,
                report: crud.getStateReport()
            };

            reportDialog.open({
                title: t('saveTitle'),
                reportLines: buildSaveReport(details),
                jsonData: details
            });
            demo.feedback.show({
                type: 'success',
                message: payload.isPartialSave ? t('partialSaved') : t('saved')
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
