import 'tabulator-tables/dist/css/tabulator.min.css';
import { TEH } from '../index.js';
import '../ui/floating-message.css';
import '../ui/confirm-dialog.css';

document.querySelector('#app').innerHTML = `
    <h1>tabulator-editable-helper</h1>

    <div class="toolbar">
        <button type="button" id="add-row">Add temp contact</button>
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
        confirmRollbackMessage: 'Confirm rollback?',
        confirmRemoveNewMessage: 'Confirm removing this new row?'
    },

    data: [
        { id: 1, fullName: 'Mario Rossi', email: 'mario.rossi@example.com', roleCode: 'ADM001', age: 34 },
        { id: 2, fullName: 'Luigi Bianchi', email: 'luigi.bianchi@example.com', roleCode: 'USR102', age: 41 },
        { id: 3, fullName: 'Anna Verdi', email: 'anna.verdi@example.com', roleCode: 'SUP210', age: 29 }
    ],

    layout: 'fitColumns',

    columns: [
        { title: 'ID', field: 'id', width: 80 },
        {
            title: 'Full name',
            field: 'fullName',
            editor: 'input',
            required: true,
            validation: {
                minLength: {
                    value: 3,
                    message: 'Full name must be at least 3 characters'
                },
                maxLength: {
                    value: 40,
                    message: 'Full name must be at most 40 characters'
                }
            }
        },
        {
            title: 'Email',
            field: 'email',
            editor: 'input',
            validation: {
                email: {
                    message: 'Invalid email format'
                }
            }
        },
        {
            title: 'Role code',
            field: 'roleCode',
            editor: 'input',
            validation: {
                pattern: {
                    regex: /^[A-Z]{3}[0-9]{3}$/,
                    message: 'Role code must be like ADM001'
                }
            }
        },
        {
            title: 'Age',
            field: 'age',
            editor: 'number',
            formatter: TEH.formatters.integer(),
            validation: {
                range: {
                    min: 18,
                    max: 65,
                    message: 'Age must be between 18 and 65'
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

    await crud.addRow({ id: 4, fullName: '', email: '', roleCode: '', age: '' });
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
            fullName: data.fullName,
            rowNumber: data._tehRowNumber
        };
    });

    console.log('row numbers', rowNumbers);
});
