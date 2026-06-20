import { AMB } from '../index.js';
import {
    applyMunicipalitySelection,
    MUNICIPALITY_LOOKUP_COLUMNS,
    MUNICIPALITY_MAP_TO_ROW
} from './multifield-lookup-config.js';

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
            Click the Municipality cell to open the lookup. The municipality
            cannot be typed manually in this demo: selecting a valid record
            keeps Municipality, Province, Region, Postal Code, ISTAT Code and
            Cadastral Code synchronized.
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
        columns: MUNICIPALITY_LOOKUP_COLUMNS,
        search: {
            fields: 'visible'
        },
        mapToRow: MUNICIPALITY_MAP_TO_ROW,
        load: () => municipalities
    });
    const lookupDialog = new AMB.LookupDialog();
    const rowsWithOpenDialog = new WeakSet();
    let grid = null;

    const openMunicipalityLookup = async cell => {
        if (!grid) return;

        const row = cell.getRow();
        const rowData = row.getData();
        const stateField = grid.crud.options.stateField;

        if (rowData[stateField] === 'deleted' || rowsWithOpenDialog.has(row)) return;

        rowsWithOpenDialog.add(row);

        try {
            const visibleColumns = municipalityLookup.columns.filter(column => {
                return column.visible === true;
            });
            const selected = await lookupDialog.open({
                title: 'Select an Italian municipality',
                columns: visibleColumns,
                data: await municipalityLookup.load(),
                valueField: municipalityLookup.keyField,
                searchFields: visibleColumns.map(column => column.field),
                searchPlaceholder: 'Search municipality, province, region, or postal code...'
            });

            applyMunicipalitySelection({
                selected,
                rowData,
                crud: grid.crud
            });
        } finally {
            rowsWithOpenDialog.delete(row);
        }
    };

    grid = AMB.table({
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
                editable: false,
                cellClick: (event, cell) => {
                    event.preventDefault?.();
                    openMunicipalityLookup(cell);
                }
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
