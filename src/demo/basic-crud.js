import { AMB } from '../index.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';
import { demoDeleteColumnIcons, demoIcon } from './demo-icons.js';

const countRowsByState = (report, state) => {
    return report.rows.filter(row => row.state === state).length;
};

const buildPayloadReport = payload => [
    `Inserted rows: ${payload.changes.inserted.length}`,
    `Updated rows: ${payload.changes.updated.length}`,
    `Deleted rows: ${payload.changes.deleted.length}`,
    `Has changes: ${payload.hasChanges}`,
    `Can save: ${payload.canSave}`
];

const buildStateReport = report => [
    `Total rows: ${report.totalRows}`,
    `Clean rows: ${countRowsByState(report, 'clean')}`,
    `New rows: ${countRowsByState(report, 'new')}`,
    `Modified rows: ${countRowsByState(report, 'modified')}`,
    `Deleted rows: ${countRowsByState(report, 'deleted')}`,
    `Saved rows: ${countRowsByState(report, 'saved')}`,
    `Error rows: ${report.errorRowsCount}`,
    `Can save: ${report.validChangedRowsCount > 0 && !report.hasErrors}`
];

export default function basicCrud(app) {
    let nextNoteNumber = 4;
    const initialData = [
        { id: 'NT-001', title: 'Welcome note', tag: 'intro', archived: 'N' },
        { id: 'NT-002', title: 'Shortcut idea', tag: 'idea', archived: 'N' },
        { id: 'NT-003', title: 'Release checklist', tag: 'todo', archived: 'Y' }
    ];

    const getNextNoteId = () => {
        const value = String(nextNoteNumber).padStart(3, '0');

        nextNoteNumber += 1;
        return `NT-${value}`;
    };

    app.innerHTML = `
        <h2>Basic CRUD</h2>
        <p class="demo-note">Edit rows, add new records, mark rows for deletion, and inspect the generated save payload. AMB Grid tracks row states and builds a backend-ready CRUD payload without performing backend calls by itself.</p>
        <details class="demo-disclosure">
            <summary class="demo-disclosure__summary">Basic CRUD behavior</summary>
            <div class="demo-disclosure__content">
                <ul class="demo-rules-list">
                    <li>Add Row creates a new client-side row.</li>
                    <li>Editing a cell marks the row as modified.</li>
                    <li>Delete marks existing rows for deletion and removes unsaved new rows.</li>
                    <li>Save validates changes, builds the payload, and simulates backend confirmation.</li>
                    <li>Show payload, Show report, and Show selected open the demo report dialog.</li>
                    <li>AMB Grid does not perform backend requests directly; application callbacks decide how to persist data.</li>
                </ul>
            </div>
        </details>
        <div id="basic-table"></div>
    `;

    const demo = AMB.table({
        selector: '#basic-table',
        height: '260px',
        deleteColumn: {
            enabled: true,
            icons: demoDeleteColumnIcons,
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
                'reload',
                'save',
                'payload',
                {
                    id: 'report',
                    label: 'Show report',
                    icon: demoIcon('report'),
                    onClick: handleShowReport
                },
                {
                    id: 'selected',
                    label: 'Show selected',
                    icon: demoIcon('selected'),
                    onClick: handleShowSelected
                }
            ],
            onAdd: handleAdd,
            onReload: handleReload,
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
        data: initialData.map(row => ({ ...row })),
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
    const reportDialog = createDemoReportDialog();
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
        reportDialog.destroy();
        partialSaveDialog.destroy();
        originalDestroy();
    };

    function handleAdd() {
        demo.feedback.clear();
        crud.addRow({ id: null, title: '', tag: '', archived: 'N' });
    }

    async function handleReload() {
        nextNoteNumber = 4;
        await demo.table.setData(initialData.map(row => ({ ...row })));
        demo.feedback.show({
            type: 'success',
            message: 'Data reloaded.'
        });
    }

    function handleShowPayload({ payload }) {
        reportDialog.open({
            title: 'Save payload',
            reportLines: buildPayloadReport(payload),
            jsonData: payload
        });
    }

    function handleShowReport() {
        const stateReport = crud.getStateReport();

        reportDialog.open({
            title: 'Basic CRUD report',
            reportLines: buildStateReport(stateReport),
            jsonData: stateReport
        });
    }

    function handleShowSelected() {
        const selectedRows = demo.getSelectedRows();
        const selectedIds = selectedRows
            .map(row => row.id || row._ambTempId)
            .filter(Boolean);

        reportDialog.open({
            title: 'Selected rows',
            reportLines: [
                `Selected rows: ${selectedRows.length}`,
                `Selected IDs: ${selectedIds.length ? selectedIds.join(', ') : 'none'}`
            ],
            jsonData: selectedRows
        });
    }

    async function handleSave() {
        const validateResult = crud.validateAll();
        const payload = crud.getSavePayload();

        if (!validateResult.isValid) {
            if (!hasValidChanges(payload)) {
                demo.feedback.show({
                    type: 'warning',
                    message: 'There are no valid changes to save.'
                });
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
                demo.feedback.show({
                    type: 'info',
                    message: 'Save cancelled.'
                });
                return;
            }
        }

        if (!hasValidChanges(payload)) {
            demo.feedback.show({
                type: 'info',
                message: 'There are no changes to save.'
            });
            return;
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
        crud.applyBackendIds(generatedIds);
        crud.markValidChangesSaved();
        demo.feedback.show({
            type: 'success',
            message: 'Changes saved successfully.'
        });
    }

    return demo;
}
