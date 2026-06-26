import { AMB } from '../index.js';
import { fakeApi } from '../../demo/fake-backend/fake-api.js';

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

export default async function fullDemo(app) {
    app.innerHTML = `
        <div class="demo-section-heading">
            <p class="demo-kicker" data-i18n="mainDemo.kicker">Demo principale</p>
            <h2 data-i18n="mainDemo.title">Gestionale Magazzino Classico</h2>
            <p class="demo-note" data-i18n="mainDemo.description">Una base backoffice per inventario: modifica prodotti, controlla stock e prezzi, valida i dati e genera un payload CRUD pronto per il backend.</p>
        </div>
        <div class="toolbar">
            <button type="button" id="add-product" data-i18n="mainDemo.add">Aggiungi prodotto</button>
            <button type="button" id="save-products" data-i18n="mainDemo.save">Salva modifiche</button>
            <button type="button" id="product-report" data-i18n="mainDemo.report">Mostra report stato</button>
        </div>
        <div id="inventory-table"></div>
        <pre class="demo-output" id="inventory-output"></pre>
    `;

    const output = app.querySelector('#inventory-output');

    output.textContent = 'Loading...';

    const products = await fakeApi.getProducts();
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

    const demo = AMB.table({
        selector: '#inventory-table',
        height: '360px',
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
                    }
                }
            },
            {
                title: 'Product name',
                field: 'productName',
                width: 190,
                editor: AMB.editors.text({ trim: true }),
                required: true
            },
            {
                title: 'Category',
                field: 'category',
                width: 150,
                editor: AMB.editors.autocomplete(categories, { maxOptions: 8 }),
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
                editor: AMB.editors.integer({ allowEmpty: true }),
                formatter: AMB.formatters.integer(),
                validation: { integer: true }
            },
            {
                title: 'Minimum stock',
                field: 'minimumStock',
                width: 140,
                editor: AMB.editors.integer({ allowEmpty: true }),
                formatter: AMB.formatters.integer(),
                validation: { integer: true }
            },
            {
                title: 'Unit price',
                field: 'unitPrice',
                width: 130,
                editor: AMB.editors.decimal({ integerDigits: 7, decimalDigits: 2, allowEmpty: true }),
                formatter: AMB.formatters.decimal(2),
                validation: {
                    decimal: {
                        integerDigits: 7,
                        decimalDigits: 2,
                        message: 'Enter a valid unit price'
                    }
                }
            },
            {
                title: 'Last check date',
                field: 'lastCheckDate',
                width: 150,
                editor: AMB.editors.date({
                    format: 'dd/mm/yyyy',
                    allowEmpty: true,
                    picker: true
                }),
                formatter: AMB.formatters.date('dd/mm/yyyy'),
                validation: {
                    date: {
                        format: 'dd/mm/yyyy',
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
                    allowEmpty: true,
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
    const saveButton = app.querySelector('#save-products');

    output.textContent = '';

    app.querySelector('#add-product').addEventListener('click', () => {
        crud.addRow({
            id: null,
            sku: '',
            productName: '',
            category: '',
            warehouse: '',
            stockQuantity: '',
            minimumStock: '',
            unitPrice: '',
            lastCheckDate: '',
            status: '',
            notes: '',
            internalCode: ''
        });
    });
    saveButton.addEventListener('click', async () => {
        output.textContent = 'Validating...';

        const validateResult = crud.validateAll();

        if (!validateResult.isValid) {
            output.textContent = JSON.stringify({
                validateResult,
                payload: crud.getSavePayload({ includeInvalid: true })
            }, null, 2);
            return;
        }

        const payload = crud.getSavePayload();

        output.textContent = 'Saving...';
        saveButton.disabled = true;

        try {
            const result = await fakeApi.saveProductChanges(payload);

            if (result.ok) {
                const applyIdsResult = crud.applyBackendIds(result.generatedIds || []);
                const savedResult = crud.markValidChangesSaved();

                output.textContent = JSON.stringify({
                    result,
                    applyIdsResult,
                    savedResult,
                    report: crud.getStateReport()
                }, null, 2);
                return;
            }

            (result.errors || []).forEach(error => {
                if (error.field) {
                    crud.markCellError(error.id, error.field, error.message);
                    return;
                }

                crud.markRowError(error.id, error.message);
            });

            output.textContent = JSON.stringify(result, null, 2);
        } finally {
            saveButton.disabled = false;
        }
    });
    app.querySelector('#product-report').addEventListener('click', () => {
        output.textContent = JSON.stringify(crud.getStateReport(), null, 2);
    });

    return {
        ...demo,
        destroy() {
            if (statusDialog.resolve) {
                statusDialog.close(null);
            } else {
                statusDialog.destroy();
            }

            demo.destroy();
        }
    };
}
