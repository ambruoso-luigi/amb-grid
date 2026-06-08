import { AMB } from '../index.js';

export default function basicCrud(app) {
    app.innerHTML = `
        <h2>Basic CRUD</h2>
        <div class="toolbar">
            <button type="button" id="add-note">Add note</button>
            <button type="button" id="save-valid">Mark valid changes saved</button>
            <button type="button" id="show-report">Show report</button>
        </div>
        <div id="basic-table"></div>
        <pre class="demo-output" id="basic-output"></pre>
    `;

    const demo = AMB.table({
        selector: '#basic-table',
        height: '260px',
        deleteColumn: {
            enabled: true,
            confirmDeleteMessage: 'Delete this note?',
            confirmRollbackMessage: 'Rollback this note?',
            confirmRemoveNewMessage: 'Remove this new note?'
        },
        data: [
            { id: 1, title: 'Welcome note', tag: 'intro' },
            { id: 2, title: 'Shortcut idea', tag: 'idea' },
            { id: 3, title: 'Release checklist', tag: 'todo' }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 80 },
            { title: 'Temp ID', field: '_ambTempId', width: 130 },
            { title: '#', field: '_ambRowNumber', width: 70 },
            { title: 'State', field: '_state', width: 100 },
            { title: 'Title', field: 'title', editor: AMB.editors.text({ trim: true }) },
            { title: 'Tag', field: 'tag', editor: AMB.editors.text({ lowercase: true, trim: true }) }
        ]
    });

    const { crud } = demo;
    const output = app.querySelector('#basic-output');

    app.querySelector('#add-note').addEventListener('click', () => {
        crud.addRow({ id: null, title: '', tag: '' });
    });
    app.querySelector('#save-valid').addEventListener('click', () => {
        output.textContent = JSON.stringify({ saved: crud.markValidChangesSaved() }, null, 2);
    });
    app.querySelector('#show-report').addEventListener('click', () => {
        output.textContent = JSON.stringify(crud.getStateReport(), null, 2);
    });

    return demo;
}
