import { AMB } from '../index.js';

const DATASET_URL = `${import.meta.env.BASE_URL}demo/data/italian-municipalities.demo.json`;
const DATASET_WARNING = 'This dataset is provided for demonstration purposes only. '
    + 'It may be incomplete, outdated, or inaccurate. '
    + 'Do not use it as an official source for production systems.';

const loadMunicipalities = async () => {
    const response = await fetch(DATASET_URL);

    if (!response.ok) {
        throw new Error(`Unable to load the municipality demo dataset (${response.status})`);
    }

    return response.json();
};

export default async function multifieldLookup(app) {
    app.innerHTML = `
        <h2>Italian municipality multifield lookup</h2>
        <p>
            Edit the Municipality cell to open the lookup. Province, Region,
            Postal Code, ISTAT Code and Cadastral Code are populated from the
            selected record. The technical codes are hidden from the lookup
            dialog but remain visible in the main grid.
        </p>
        <p class="demo-warning"><strong>Demo data warning:</strong> ${DATASET_WARNING}</p>
        <div class="toolbar">
            <button type="button" id="municipality-add">Add row</button>
            <button type="button" id="municipality-report">Show payload</button>
        </div>
        <div id="municipality-table"></div>
        <pre class="demo-output" id="municipality-output">Loading municipality data...</pre>
    `;

    const output = app.querySelector('#municipality-output');
    let municipalities;

    try {
        municipalities = await loadMunicipalities();
    } catch (error) {
        output.textContent = error.message;
        return null;
    }

    const municipalityLookup = AMB.lookup({
        keyField: 'istatCode',
        valueField: 'istatCode',
        labelField: 'municipalityName',
        columns: [
            { field: 'municipalityName', title: 'Municipality', visible: true },
            { field: 'province', title: 'Province', visible: true, width: 110 },
            { field: 'region', title: 'Region', visible: true },
            { field: 'postalCode', title: 'Postal Code', visible: true, width: 120 },
            { field: 'istatCode', title: 'ISTAT Code', visible: false },
            { field: 'cadastralCode', title: 'Cadastral Code', visible: false }
        ],
        search: {
            fields: 'visible'
        },
        mapToRow: {
            istatCode: 'istatCode',
            cadastralCode: 'cadastralCode',
            municipality: 'municipalityName',
            province: 'province',
            region: 'region',
            postalCode: 'postalCode'
        },
        load: () => municipalities
    });
    const lookupDialog = new AMB.LookupDialog();
    const grid = AMB.table({
        selector: '#municipality-table',
        data: [
            {
                id: 1,
                istatCode: '065078',
                cadastralCode: 'F912',
                municipality: 'Nocera Inferiore',
                province: 'SA',
                region: 'CAMPANIA',
                postalCode: '84014'
            }
        ],
        layout: 'fitColumns',
        deleteColumn: {
            enabled: true
        },
        columns: [
            { title: 'ISTAT Code', field: 'istatCode', width: 120, editable: false },
            { title: 'Cadastral Code', field: 'cadastralCode', width: 135, editable: false },
            {
                title: 'Municipality',
                field: 'municipality',
                required: true,
                editor: AMB.editors.lookup(municipalityLookup, {
                    dialog: lookupDialog,
                    dialogTitle: 'Select an Italian municipality',
                    searchPlaceholder: 'Search municipality, province, region, or postal code...'
                })
            },
            { title: 'Province', field: 'province', required: true, width: 105, editable: false },
            { title: 'Region', field: 'region', editable: false },
            { title: 'Postal Code', field: 'postalCode', width: 120, editable: false }
        ]
    });

    output.textContent = `Loaded ${municipalities.length.toLocaleString('en')} municipality records.`;

    app.querySelector('#municipality-add').addEventListener('click', () => {
        grid.crud.addRow({
            id: null,
            istatCode: '',
            cadastralCode: '',
            municipality: '',
            province: '',
            region: '',
            postalCode: ''
        });
    });
    app.querySelector('#municipality-report').addEventListener('click', () => {
        output.textContent = JSON.stringify(grid.crud.getSavePayload({
            includeInvalid: true
        }), null, 2);
    });
    return {
        ...grid,
        destroy() {
            lookupDialog.destroy();
            grid.destroy();
        }
    };
}
