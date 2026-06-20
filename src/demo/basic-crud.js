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
        toolbar: {
            buttons: [
                'add',
                'save',
                'payload',
                {
                    id: 'report',
                    label: 'Show report',
                    onClick: handleShowReport
                },
                {
                    id: 'selected',
                    label: 'Show selected',
                    onClick: handleShowSelected
                }
            ],
            onAdd: handleAdd,
            onSave: handleSave,
            onPayload: handleShowPayload
        },
        search: {
            enabled: true,
            placeholder: 'Search notes...',
            filters: {
                enabled: true
            }
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
            {
                title: 'Title',
                field: 'title',
                editor: AMB.editors.text({ trim: true }),
                required: true,
                requiredMessage: 'Title is required',
                validation: {
                    minLength: {
                        value: 3,
                        message: 'Title must be at least 3 characters'
                    }
                }
            },
            {
                title: 'Tag',
                field: 'tag',
                editor: AMB.editors.text({ lowercase: true, trim: true }),
                required: true,
                requiredMessage: 'Tag is required',
                validation: {
                    pattern: {
                        regex: /^[a-z]+$/,
                        message: 'Tag must contain lowercase letters only'
                    },
                    maxLength: {
                        value: 12,
                        message: 'Tag must be at most 12 characters'
                    }
                }
            },
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
    const partialSaveDialog = new AMB.ConfirmDialog({
        title: 'Save valid rows?'
    });
    const originalDestroy = demo.destroy.bind(demo);
    const hasValidChanges = payload => {
        return payload.changes.inserted.length > 0
            || payload.changes.updated.length > 0
            || payload.changes.deleted.length > 0;
    };
    const getInvalidRowsMessage = validateResult => {
        const invalidRows = validateResult.rows.filter(row => !row.isValid);

        if (!invalidRows.length) return '';

        return invalidRows.map(row => {
            const rowLabel = row.rowNumber === null || row.rowNumber === undefined
                ? 'unknown'
                : row.rowNumber;
            const fields = row.errors.map(error => error.field).join(', ');

            return `Row ${rowLabel}: ${fields}`;
        }).join('\n');
    };

    demo.destroy = () => {
        partialSaveDialog.destroy();
        originalDestroy();
    };

    function handleAdd() {
        crud.addRow({ id: null, title: '', tag: '', archived: 'N' });
    }

    function handleShowPayload({ payload }) {
        output.textContent = JSON.stringify(payload, null, 2);
    }

    function handleShowReport() {
        output.textContent = JSON.stringify(crud.getStateReport(), null, 2);
    }

    function handleShowSelected() {
        output.textContent = JSON.stringify(demo.getSelectedRows(), null, 2);
    }

    async function handleSave() {
        const validateResult = crud.validateAll();
        const payloadWithInvalid = crud.getSavePayload({ includeInvalid: true });
        const payload = crud.getSavePayload();

        if (!validateResult.isValid) {
            if (!hasValidChanges(payload)) {
                output.textContent = JSON.stringify({
                    validateResult,
                    payload: payloadWithInvalid,
                    report: crud.getStateReport()
                }, null, 2);
                return;
            }

            const invalidRowsMessage = getInvalidRowsMessage(validateResult);
            const confirmed = await partialSaveDialog.confirm({
                message: [
                    'Some rows contain errors and will not be saved. Do you want to save only valid rows?',
                    invalidRowsMessage ? `Invalid rows:\n${invalidRowsMessage}` : ''
                ].filter(Boolean).join('\n\n')
            });

            if (!confirmed) {
                output.textContent = JSON.stringify({
                    validateResult,
                    payload: payloadWithInvalid,
                    report: crud.getStateReport()
                }, null, 2);
                return;
            }
        }

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
    }

    return demo;
}
