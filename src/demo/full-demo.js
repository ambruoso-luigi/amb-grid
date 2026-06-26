import { AMB } from '../index.js';
import { fakeApi } from '../../demo/fake-backend/fake-api.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';

const categories = [
    'Consumables',
    'Equipment',
    'Furniture',
    'Storage'
];

const warehouses = [
    'Bologna Hub',
    'Milano Nord',
    'Roma Est',
    'Torino Ovest'
];

const toolbarIcons = {
    add: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14"></path>
            <path d="M5 12h14"></path>
        </svg>
    `,
    reload: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 7v5h-5"></path>
            <path d="M19 12a7 7 0 1 1-2.05-4.95L20 10"></path>
        </svg>
    `,
    save: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.2 4.2L19 7"></path>
        </svg>
    `,
    payload: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5H5v14h3"></path>
            <path d="M16 5h3v14h-3"></path>
            <path d="M10 9l-2.5 3L10 15"></path>
            <path d="M14 9l2.5 3L14 15"></path>
        </svg>
    `,
    validate: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3z"></path>
            <path d="M8.8 12.2l2.1 2.1 4.3-4.6"></path>
        </svg>
    `,
    report: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4h10l2 2v14H5V4h2z"></path>
            <path d="M8 10h8"></path>
            <path d="M8 14h8"></path>
            <path d="M8 18h5"></path>
        </svg>
    `
};

const toolbarLabels = {
    it: {
        add: { label: 'Prodotto', title: 'Aggiungi prodotto' },
        reload: { label: 'Ricarica', title: 'Ricarica tabella' },
        save: { label: 'Salva', title: 'Salva modifiche' },
        payload: { label: 'Payload', title: 'Mostra payload' },
        validate: { label: 'Valida', title: 'Valida righe' },
        report: { label: 'Report', title: 'Mostra report stato' }
    },
    en: {
        add: { label: 'Product', title: 'Add product' },
        reload: { label: 'Reload', title: 'Reload table' },
        save: { label: 'Save', title: 'Save changes' },
        payload: { label: 'Payload', title: 'Show payload' },
        validate: { label: 'Validate', title: 'Validate rows' },
        report: { label: 'Report', title: 'Show state report' }
    }
};

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

const updateToolbarLabels = demo => {
    const lang = getLanguage();
    const labels = toolbarLabels[lang];
    const toolbar = demo.toolbar && demo.toolbar.element;

    if (!toolbar) return;

    Object.entries(labels).forEach(([id, label]) => {
        const button = toolbar.querySelector(`[data-action="${id === 'report' ? 'show-report' : id}"]`);
        const labelElement = button && button.querySelector('.amb-toolbar__button-label');
        const iconElement = button && button.querySelector('.amb-toolbar__button-icon');

        if (!button || !labelElement) return;

        labelElement.textContent = label.label;
        if (iconElement && toolbarIcons[id]) {
            iconElement.innerHTML = toolbarIcons[id];
        }
        button.title = label.title;
        button.setAttribute('aria-label', label.title);
    });
};

export default async function fullDemo(app) {
    app.innerHTML = `
        <div class="demo-section-heading demo-section-heading--split">
            <div>
                <p class="demo-kicker" data-i18n="mainDemo.kicker">Demo legacy-friendly</p>
                <h2 data-i18n="mainDemo.title">Gestionale Magazzino Classico</h2>
                <p class="demo-note" data-i18n="mainDemo.description">Una pagina gestionale classica, adatta a contesti server-rendered e legacy-friendly, con una UI moderna per CRUD, validazione e payload applicativi.</p>
            </div>
            <p class="demo-scenario-label" data-i18n="mainDemo.scenario">Scenario: Classic Warehouse Backoffice</p>
        </div>
        <div id="inventory-table"></div>
    `;

    const statusLookup = AMB.lookup({
        keyField: 'id',
        valueField: 'id',
        labelField: 'description',
        columns: [
            { field: 'id', title: 'Code', visible: true, width: 150 },
            { field: 'description', title: 'Description', visible: true }
        ],
        search: {
            fields: 'visible'
        },
        load: ({ query }) => fakeApi.searchStatuses(query)
    });
    const statusDialog = new AMB.LookupDialog();
    const reportDialog = createDemoReportDialog();
    const products = await fakeApi.getProducts();

    const demo = AMB.table({
        selector: '#inventory-table',
        height: '340px',
        search: {
            enabled: true,
            placeholder: 'Search inventory...',
            filters: {
                enabled: true
            }
        },
        deleteColumn: {
            enabled: true,
            confirmDeleteMessage: 'Delete this product?',
            confirmRollbackMessage: 'Rollback this product?',
            confirmRemoveNewMessage: 'Remove this new product?'
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
                    icon: toolbarIcons.report,
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
        columns: [
            {
                title: 'SKU',
                field: 'sku',
                width: 130,
                editor: AMB.editors.text({ uppercase: true, trim: true }),
                required: true,
                validation: {
                    pattern: {
                        regex: /^SKU-[0-9]{4}$/,
                        message: 'Use SKU-0000 format'
                    },
                    unique: {
                        caseSensitive: false,
                        message: 'SKU must be unique'
                    }
                }
            },
            {
                title: 'Product name',
                field: 'productName',
                width: 190,
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
                title: 'Category',
                field: 'category',
                width: 150,
                editor: AMB.editors.autocomplete(categories, { maxOptions: 8 }),
                required: true,
                validation: {
                    allowedValues: {
                        values: categories,
                        message: 'Choose a known category'
                    }
                }
            },
            {
                title: 'Warehouse',
                field: 'warehouse',
                width: 150,
                editor: AMB.editors.autocomplete(warehouses, { maxOptions: 8 }),
                required: true,
                validation: {
                    allowedValues: {
                        values: warehouses,
                        message: 'Choose a known warehouse'
                    }
                }
            },
            {
                title: 'Stock quantity',
                field: 'stockQuantity',
                width: 140,
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
                title: 'Minimum stock',
                field: 'minimumStock',
                width: 140,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                required: true,
                validation: {
                    integer: true,
                    min: {
                        value: 0,
                        message: 'Minimum stock cannot be negative'
                    }
                }
            },
            {
                title: 'Unit price',
                field: 'unitPrice',
                width: 130,
                editor: AMB.editors.decimal({ integerDigits: 7, decimalDigits: 2, allowEmpty: false }),
                formatter: AMB.formatters.decimal(2),
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
                width: 150,
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
                width: 150,
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
                        pagination: false,
                        destroyOnClose: true
                    }
                })
            },
            {
                title: 'Notes',
                field: 'notes',
                width: 240,
                formatter: AMB.formatters.largeTextPreview({ maxLength: 42 }),
                editor: AMB.editors.largeText({
                    title: 'Edit inventory notes',
                    rows: 10,
                    closeOnBackdropClick: false,
                    tabBehavior: 'save-and-navigate'
                })
            },
            {
                title: 'Internal code',
                field: 'internalCode',
                width: 130,
                editor: AMB.editors.text({ uppercase: true, trim: true })
            }
        ]
    });

    const { crud } = demo;
    const originalDestroy = demo.destroy.bind(demo);
    const handleLanguageChange = () => updateToolbarLabels(demo);

    updateToolbarLabels(demo);
    demo.feedback.show({
        type: 'info',
        message: t('loaded')
    });
    window.addEventListener('amb-demo-language-change', handleLanguageChange);

    demo.destroy = () => {
        window.removeEventListener('amb-demo-language-change', handleLanguageChange);
        reportDialog.destroy();

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
        crud.addRow({
            id: null,
            sku: '',
            productName: '',
            category: '',
            warehouse: '',
            stockQuantity: 0,
            minimumStock: 0,
            unitPrice: '',
            lastCheckDate: '',
            status: '',
            notes: '',
            internalCode: ''
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
