import { AMB } from '../index.js';

export default function basicCrud(app) {
    let nextNoteNumber = 4;

    const getNextNoteId = () => {
        const value = String(nextNoteNumber).padStart(3, '0');

        nextNoteNumber += 1;
        return `NT-${value}`;
    };

    app.innerHTML = `
        <h2>Basic CRUD</h2>
        <div class="toolbar">
            <button type="button" id="action-add-row">Add row</button>
            <button type="button" id="action-save">Save</button>
            <button type="button" id="action-show-report">Show report</button>
            <button type="button" id="action-show-selected">Show selected</button>
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
            { id: 'NT-001', title: 'Welcome note', tag: 'intro', archived: 'N' },
            { id: 'NT-002', title: 'Shortcut idea', tag: 'idea', archived: 'N' },
            { id: 'NT-003', title: 'Release checklist', tag: 'todo', archived: 'Y' }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 80 },
            { title: 'Temp ID', field: '_ambTempId', width: 130 },
            { title: 'Row No.', field: '_ambRowNumber', width: 90 },
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

    app.querySelector('#action-add-row').addEventListener('click', () => {
        crud.addRow({ id: null, title: '', tag: '', archived: 'N' });
    });
    app.querySelector('#action-save').addEventListener('click', () => {
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
                id: getNextNoteId()
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
    app.querySelector('#action-show-report').addEventListener('click', () => {
        output.textContent = JSON.stringify(crud.getStateReport(), null, 2);
    });
    app.querySelector('#action-show-selected').addEventListener('click', () => {
        output.textContent = JSON.stringify(demo.getSelectedRows(), null, 2);
    });

    return demo;
}
