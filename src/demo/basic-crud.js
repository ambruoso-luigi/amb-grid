import { AMB } from '../index.js';

export default function basicCrud(app) {
    let nextNoteId = 4;

    app.innerHTML = `
        <h2>Basic CRUD</h2>
        <div class="toolbar">
            <button type="button" id="add-note">Add note</button>
            <button type="button" id="save-valid">Mark valid changes saved</button>
            <button type="button" id="show-report">Show report</button>
            <button type="button" id="show-selected">Show selected</button>
            <button type="button" id="clear-selection">Clear selection</button>
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
        selectionColumn: {
            enabled: true,
            mode: 'multiple'
        },
        data: [
            { id: 1, title: 'Welcome note', tag: 'intro', archived: 'N' },
            { id: 2, title: 'Shortcut idea', tag: 'idea', archived: 'N' },
            { id: 3, title: 'Release checklist', tag: 'todo', archived: 'Y' }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 80 },
            { title: 'Temp ID', field: '_ambTempId', width: 130 },
            { title: '#', field: '_ambRowNumber', width: 70 },
            { title: 'State', field: '_state', width: 100 },
            { title: 'Title', field: 'title', editor: AMB.editors.text({ trim: true }) },
            { title: 'Tag', field: 'tag', editor: AMB.editors.text({ lowercase: true, trim: true }) },
            {
                title: 'Archived',
                field: 'archived',
                width: 130,
                formatter: AMB.formatters.checkbox({
                    checkedValue: 'Y',
                    uncheckedValue: 'N',
                    checkedLabel: 'Yes',
                    uncheckedLabel: 'No'
                }),
                editor: AMB.editors.checkbox({
                    checkedValue: 'Y',
                    uncheckedValue: 'N',
                    checkedLabel: 'Yes',
                    uncheckedLabel: 'No'
                })
            }
        ]
    });

    const { crud } = demo;
    const output = app.querySelector('#basic-output');

    app.querySelector('#add-note').addEventListener('click', () => {
        crud.addRow({ id: null, title: '', tag: '', archived: 'N' });
    });
    app.querySelector('#save-valid').addEventListener('click', () => {
        const validateResult = crud.validateAll();

        if (!validateResult.isValid) {
            output.textContent = JSON.stringify({
                validateResult,
                payload: crud.getSavePayload({ includeInvalid: true })
            }, null, 2);
            return;
        }

        const payload = crud.getSavePayload();
        const generatedIds = payload.changes.inserted
            .filter(item => {
                return item._ambTempId
                    && (item.id === null || item.id === undefined || item.id === '');
            })
            .map(item => ({
                tempId: item._ambTempId,
                id: nextNoteId++
            }));
        const applyIdsResult = crud.applyBackendIds(generatedIds);
        const savedResult = crud.markValidChangesSaved();

        output.textContent = JSON.stringify({
            payload,
            generatedIds,
            applyIdsResult,
            savedResult,
            report: crud.getStateReport()
        }, null, 2);
    });
    app.querySelector('#show-report').addEventListener('click', () => {
        output.textContent = JSON.stringify(crud.getStateReport(), null, 2);
    });
    app.querySelector('#show-selected').addEventListener('click', () => {
        output.textContent = JSON.stringify(demo.getSelectedRows(), null, 2);
    });
    app.querySelector('#clear-selection').addEventListener('click', () => {
        demo.clearSelection();
        output.textContent = JSON.stringify(demo.getSelectedRows(), null, 2);
    });

    return demo;
}
