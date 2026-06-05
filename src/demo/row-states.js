import { AMB } from '../index.js';

export default function rowStates(app) {
    app.innerHTML = `
        <h2>Row states</h2>
        <div class="toolbar">
            <button type="button" id="state-add">New</button>
            <button type="button" id="state-modify">Modified</button>
            <button type="button" id="state-delete">Deleted</button>
            <button type="button" id="state-save">Saved</button>
            <button type="button" id="state-error">Error</button>
            <button type="button" id="state-report">Report</button>
        </div>
        <div id="row-states-table"></div>
        <pre class="demo-output" id="row-states-output"></pre>
    `;

    const demo = AMB.table({
        selector: '#row-states-table',
        height: '260px',
        data: [
            { id: 1, item: 'Clean sample', note: 'Ready' },
            { id: 2, item: 'Tracked sample', note: 'Editable' },
            { id: 3, item: 'Review sample', note: 'Pending' }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 80 },
            { title: 'Item', field: 'item', editor: AMB.editors.text({ trim: true }) },
            { title: 'Note', field: 'note', editor: AMB.editors.text({ trim: true }) }
        ]
    });

    const { crud } = demo;
    const output = app.querySelector('#row-states-output');

    app.querySelector('#state-add').addEventListener('click', () => {
        crud.addRow({ id: Date.now(), item: 'New sample', note: '' });
    });
    app.querySelector('#state-modify').addEventListener('click', () => {
        crud.updateRow(2, { note: `Changed ${new Date().toLocaleTimeString()}` });
    });
    app.querySelector('#state-delete').addEventListener('click', () => {
        crud.deleteRow(3);
    });
    app.querySelector('#state-save').addEventListener('click', () => {
        output.textContent = JSON.stringify({ saved: crud.markValidChangesSaved() }, null, 2);
    });
    app.querySelector('#state-error').addEventListener('click', () => {
        crud.markCellError(1, 'note', 'Manual demo error');
    });
    app.querySelector('#state-report').addEventListener('click', () => {
        output.textContent = JSON.stringify(crud.getStateReport(), null, 2);
    });

    return demo;
}
