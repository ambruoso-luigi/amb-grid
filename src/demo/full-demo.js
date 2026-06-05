import { AMB } from '../index.js';

export default function fullDemo(app) {
    app.innerHTML = `
        <h2>Starship Registry</h2>
        <div class="toolbar">
            <button type="button" id="add-ship">Add starship</button>
            <button type="button" id="save-ships">Mark valid changes saved</button>
            <button type="button" id="ship-report">Show state report</button>
        </div>
        <div id="starship-table"></div>
        <pre class="demo-output" id="starship-output"></pre>
    `;

    const demo = AMB.table({
        selector: '#starship-table',
        height: '320px',
        deleteColumn: {
            enabled: true,
            confirmDeleteMessage: 'Delete this starship?',
            confirmRollbackMessage: 'Rollback this starship?',
            confirmRemoveNewMessage: 'Remove this new starship?'
        },
        data: [
            { id: 1, shipName: 'Aster Dawn', registryCode: 'AST001', captainEmail: 'aster@example.test', crewSize: 42, fuelCapacity: 12500.5, launchDate: '05/06/2026', status: 'Ready' },
            { id: 2, shipName: 'Vector Halo', registryCode: 'VEC220', captainEmail: 'vector@example.test', crewSize: 18, fuelCapacity: 8800, launchDate: '14/09/2026', status: 'Survey' },
            { id: 3, shipName: 'Lumen Arc', registryCode: 'LUM404', captainEmail: 'lumen@example.test', crewSize: 64, fuelCapacity: 15120.75, launchDate: '02/12/2026', status: 'Docked' }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'Ship Name', field: 'shipName', editor: AMB.editors.text({ trim: true }), required: true },
            {
                title: 'Registry Code',
                field: 'registryCode',
                editor: AMB.editors.text({ uppercase: true, trim: true }),
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
                editor: AMB.editors.date({ format: 'dd/mm/yyyy', allowEmpty: true }),
                formatter: AMB.formatters.date('dd/mm/yyyy'),
                validation: {
                    date: {
                        format: 'dd/mm/yyyy',
                        message: 'Enter a real launch date'
                    }
                }
            },
            { title: 'Status', field: 'status', editor: AMB.editors.text({ trim: true }) }
        ]
    });

    const { crud } = demo;
    const output = app.querySelector('#starship-output');

    app.querySelector('#add-ship').addEventListener('click', () => {
        crud.addRow({
            id: Date.now(),
            shipName: '',
            registryCode: '',
            captainEmail: '',
            crewSize: '',
            fuelCapacity: '',
            launchDate: '',
            status: ''
        });
    });
    app.querySelector('#save-ships').addEventListener('click', () => {
        output.textContent = JSON.stringify({ saved: crud.markValidChangesSaved() }, null, 2);
    });
    app.querySelector('#ship-report').addEventListener('click', () => {
        output.textContent = JSON.stringify(crud.getStateReport(), null, 2);
    });

    return demo;
}
