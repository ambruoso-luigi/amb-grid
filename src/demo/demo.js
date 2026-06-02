import 'tabulator-tables/dist/css/tabulator.min.css';
import { TEH } from '../lib/teh.js';
import '../ui/floating-message.css';

document.querySelector('#app').innerHTML = `
    <h1>tabulator-editable-helper</h1>

    <div class="toolbar">
        <button type="button" id="modify-row">Modify Luigi</button>
        <button type="button" id="mark-luigi-saved">Mark Luigi saved</button>
        <button type="button" id="rollback-row">Rollback Luigi</button>
        <button type="button" id="delete-row">Delete Anna</button>
        <button type="button" id="mark-anna-saved">Mark Anna saved</button>
        <button type="button" id="rollback-deleted-row">Rollback Anna</button>
        <button type="button" id="add-row">Add temp row</button>
        <button type="button" id="rollback-new-row">Rollback temp row</button>
        <button type="button" id="cell-error">Cell error on Luigi age</button>
        <button type="button" id="clear-cell-error">Clear Luigi age error</button>
        <button type="button" id="row-error">Row error on Anna</button>
        <button type="button" id="clear-row-error">Clear Anna row error</button>
        <button type="button" id="show-changes">Show changes</button>
        <button type="button" id="show-errors">Show errors</button>
        <button type="button" id="show-row-numbers">Show row numbers</button>
    </div>

    <div id="example-table"></div>
`;

const editableTable = TEH.table({
    selector: '#example-table',
    height: '300px',

    data: [
        { id: 1, name: 'Mario', age: 30 },
        { id: 2, name: 'Luigi', age: 41 },
        { id: 3, name: 'Anna', age: 25 }
    ],

    layout: 'fitColumns',

    columns: [
        { title: 'ID', field: 'id', width: 80 },
        { title: 'Name', field: 'name', editor: 'input' },
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

document.querySelector('#modify-row').addEventListener('click', () => {
    crud.updateRow(2, { age: 42 });
});

document.querySelector('#mark-luigi-saved').addEventListener('click', () => {
    crud.markRowSaved(2);
});

document.querySelector('#rollback-row').addEventListener('click', () => {
    crud.rollbackRow(2);
});

document.querySelector('#delete-row').addEventListener('click', () => {
    crud.deleteRow(3);
});

document.querySelector('#mark-anna-saved').addEventListener('click', () => {
    crud.markRowSaved(3);
});

document.querySelector('#rollback-deleted-row').addEventListener('click', () => {
    crud.rollbackRow(3);
});

document.querySelector('#add-row').addEventListener('click', async () => {
    if (crud.findRowById(4)) return;

    await crud.addRow({ id: 4, name: 'Francesca', age: 29 });
});

document.querySelector('#rollback-new-row').addEventListener('click', () => {
    crud.rollbackRow(4);
});

document.querySelector('#cell-error').addEventListener('click', () => {
    crud.markCellError(2, 'age', 'Età non valida');
});

document.querySelector('#clear-cell-error').addEventListener('click', () => {
    crud.clearCellError(2, 'age');
});

document.querySelector('#row-error').addEventListener('click', () => {
    crud.markRowError(3, 'Errore backend durante il salvataggio');
});

document.querySelector('#clear-row-error').addEventListener('click', () => {
    crud.clearRowError(3);
});

document.querySelector('#show-changes').addEventListener('click', () => {
    console.log('changes', crud.getChanges());
});

document.querySelector('#show-errors').addEventListener('click', () => {
    console.log('errors', crud.getErrors());
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
