import { AMB } from '../index.js';
import { fakeApi } from '../../demo/fake-backend/fake-api.js';

export default async function fullDemo(app) {
    app.innerHTML = `
        <h2>Starship Registry</h2>
        <div class="toolbar">
            <button type="button" id="add-ship">Add starship</button>
            <button type="button" id="save-ships">Save changes</button>
            <button type="button" id="ship-report">Show state report</button>
        </div>
        <div id="starship-table"></div>
        <pre class="demo-output" id="starship-output"></pre>
    `;

    const output = app.querySelector('#starship-output');

    output.textContent = 'Loading...';

    const starships = await fakeApi.getStarships();
    const statuses = await fakeApi.getStatuses();
    const statusLabels = Object.fromEntries(
        statuses.map(item => [item.id, item.description])
    );
    const statusLookup = AMB.lookup({
        valueField: 'id',
        labelField: 'description',
        load: async ({ query }) => fakeApi.searchStatuses(query)
    });
    const lookupDialog = new AMB.LookupDialog();

    const demo = AMB.table({
        selector: '#starship-table',
        height: '320px',
        search: {
            enabled: true,
            placeholder: 'Search starships...',
            filters: {
                enabled: true
            }
        },
        deleteColumn: {
            enabled: true,
            confirmDeleteMessage: 'Delete this starship?',
            confirmRollbackMessage: 'Rollback this starship?',
            confirmRemoveNewMessage: 'Remove this new starship?'
        },
        data: starships,
        layout: 'fitColumns',
        columns: [
            { title: 'Ship Name', field: 'shipName', editor: AMB.editors.text({ trim: true }), required: true },
            {
                title: 'Registry Code',
                field: 'registryCode',
                editor: AMB.editors.text({ uppercase: true, trim: true }),
                required: true,
                validation: {
                    pattern: {
                        regex: /^[A-Z]{3}[0-9]{3}$/,
                        message: 'Use three letters and three digits'
                    }
                }
            },
            {
                title: 'Captain Email',
                field: 'captainEmail',
                editor: AMB.editors.text({ trim: true }),
                validation: { email: { message: 'Enter a valid email' } }
            },
            {
                title: 'Crew Size',
                field: 'crewSize',
                editor: AMB.editors.integer({ allowEmpty: true }),
                formatter: AMB.formatters.integer(),
                validation: { integer: true }
            },
            {
                title: 'Fuel Capacity',
                field: 'fuelCapacity',
                editor: AMB.editors.decimal({ integerDigits: 7, decimalDigits: 2, allowEmpty: true }),
                formatter: AMB.formatters.decimal(2),
                validation: {
                    decimal: {
                        integerDigits: 7,
                        decimalDigits: 2,
                        message: 'Enter a valid fuel capacity'
                    }
                }
            },
            {
                title: 'Launch Date',
                field: 'launchDate',
                editor: AMB.editors.date({
                    format: 'dd/mm/yyyy',
                    allowEmpty: true,
                    picker: true
                }),
                formatter: AMB.formatters.date('dd/mm/yyyy'),
                validation: {
                    date: {
                        format: 'dd/mm/yyyy',
                        message: 'Enter a real launch date'
                    }
                }
            },
            {
                title: 'Status',
                field: 'status',
                required: true,
                editor: AMB.editors.lookup(statusLookup, {
                    uppercase: true,
                    allowEmpty: true,
                    dialog: lookupDialog,
                    dialogTitle: 'Search status',
                    invalidMessage: 'Unknown status code',
                    autoComplete: true,
                    dialogColumns: [
                        { field: 'id', title: 'Code', width: 140 },
                        { field: 'description', title: 'Description' }
                    ]
                }),
                formatter: cell => {
                    const value = cell.getValue();
                    const cellElement = cell.getElement();
                    const description = statusLabels[value] || '';
                    const rowData = cell.getRow().getData();
                    const field = cell.getField();

                    if (!rowData._ambLookup) {
                        rowData._ambLookup = {};
                    }

                    if (!rowData._ambLookup[field]) {
                        rowData._ambLookup[field] = {
                            initial: {
                                value: value || '',
                                description
                            },
                            current: {
                                value: value || '',
                                description
                            }
                        };
                    }

                    cellElement.dataset.lookupField = field;

                    return value || '';
                }
            },
            {
                title: 'Notes',
                field: 'notes',
                width: 220,
                formatter: AMB.formatters.largeTextPreview({ maxLength: 40 }),
                editor: AMB.editors.largeText({
                    title: 'Edit notes',
                    rows: 10
                })
            }
        ]
    });

    const { crud } = demo;
    const saveButton = app.querySelector('#save-ships');

    output.textContent = '';

    app.querySelector('#add-ship').addEventListener('click', () => {
        crud.addRow({
            id: null,
            shipName: '',
            registryCode: '',
            captainEmail: '',
            crewSize: '',
            fuelCapacity: '',
            launchDate: '',
            status: '',
            notes: ''
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
            const result = await fakeApi.saveStarshipChanges(payload);

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
    app.querySelector('#ship-report').addEventListener('click', () => {
        output.textContent = JSON.stringify(crud.getStateReport(), null, 2);
    });

    return {
        ...demo,
        destroy() {
            lookupDialog.destroy();
            demo.destroy();
        }
    };
}
