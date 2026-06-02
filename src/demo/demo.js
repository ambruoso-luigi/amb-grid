import 'tabulator-tables/dist/css/tabulator.min.css';
import { TEH } from '../lib/teh.js';
import '../ui/floating-message.css';

document.querySelector('#app').innerHTML = `
    <h1>tabulator-editable-helper</h1>

    <div class="toolbar">
        <button type="button" id="add-row">Add temp row</button>
        <button type="button" id="show-state-report">Show state report</button>
        <button type="button" id="mark-valid-changes-saved">Mark valid changes saved</button>
        <button type="button" id="show-row-numbers">Show row numbers</button>
    </div>

    <div id="example-table"></div>
`;

const editableTable = TEH.table({
    selector: '#example-table',
    height: '300px',

    messages: {
        required: 'This field is required'
    },

    deleteColumn: {
        enabled: true,
        width: 55,
        confirmDeleteMessage: 'Confirm row deletion?',
        confirmRollbackMessage: 'Confirm rollback?'
    },

    data: [
        { id: 1, name: 'Mario', age: 30 },
        { id: 2, name: 'Luigi', age: 41 },
        { id: 3, name: 'Anna', age: 25 }
    ],

    layout: 'fitColumns',

    columns: [
        { title: 'ID', field: 'id', width: 80 },
        { title: 'Name', field: 'name', editor: 'input', required: true },
        {
            title: 'Age',
            field: 'age',
            editor: 'number',
            validator: {
                message: 'Age must be between 18 and 40',
                validate: value => {
                    const numberValue = Number(value);
                    return Number.isFinite(numberValue) && numberValue >= 18 && numberValue <= 40;
                }
            }
        }
    ]
});

const { table, crud, floatingMessage, cellMessageBinder } = editableTable;

window.crud = crud;
window.table = table;
window.floatingMessage = floatingMessage;
window.cellMessageBinder = cellMessageBinder;

document.querySelector('#add-row').addEventListener('click', async () => {
    if (crud.findRowById(4)) return;

    await crud.addRow({ id: 4, name: 'Francesca', age: 29 });
});

document.querySelector('#show-state-report').addEventListener('click', () => {
    console.log('state report', crud.getStateReport());
});

document.querySelector('#mark-valid-changes-saved').addEventListener('click', () => {
    console.log('mark valid changes saved', crud.markValidChangesSaved());
});

document.querySelector('#show-row-numbers').addEventListener('click', () => {
    const rowNumbers = table.getRows().map(row => {
        const data = row.getData();

        return {
            id: data.id,
            name: data.name,
            rowNumber: data._tehRowNumber
        };
    });

    console.log('row numbers', rowNumbers);
});
