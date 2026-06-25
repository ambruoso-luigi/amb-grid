import { AMB } from '../index.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';

const countRowsByState = (report, state) => {
    return report.rows.filter(row => row.state === state).length;
};

const buildStateReport = report => [
    'Row states report',
    '',
    `Rows: ${report.totalRows}`,
    `Clean: ${countRowsByState(report, 'clean')}`,
    `New: ${countRowsByState(report, 'new')}`,
    `Modified: ${countRowsByState(report, 'modified')}`,
    `Deleted: ${countRowsByState(report, 'deleted')}`,
    `Saved: ${countRowsByState(report, 'saved')}`,
    `Error: ${report.errorRowsCount}`,
    '',
    'Use Add row to create a new row.',
    'Edit Item, Category, Owner, or Note to create a modified row.',
    'Use the delete column to mark an existing row as deleted.',
    'Use Save to simulate backend confirmation and mark valid changes as saved.',
    'Use Create error to mark a demo cell error.'
];

const buildRowNumbersReport = report => [
    'Row numbers',
    '',
    ...report.rows.map(row => {
        const identifier = row.id ?? row.tempId ?? 'unknown';

        return `ID ${identifier} — row ${row.rowNumber ?? 'n/a'} — state ${row.state}`;
    })
];

export default function rowStates(app) {
    let nextId = 7;
    const initialData = [
        { id: 1, item: 'Clean sample', category: 'Inventory', owner: 'Ops', note: 'Ready' },
        { id: 2, item: 'Tracked sample', category: 'Quality', owner: 'QA', note: 'Editable' },
        { id: 3, item: 'Review sample', category: 'Backoffice', owner: 'Admin', note: 'Pending' },
        { id: 4, item: 'Reference sample', category: 'System', owner: 'System', note: 'Reference data' },
        { id: 5, item: 'Audit sample', category: 'Compliance', owner: 'Audit', note: 'Needs review' },
        { id: 6, item: 'Stable sample', category: 'Operations', owner: 'Ops', note: 'Stable' }
    ];

    app.innerHTML = `
        <h2>Row states</h2>
        <p class="demo-note">Use the standard CRUD toolbar and delete column to explore how AMB Grid tracks each row through its lifecycle.</p>
        <details class="demo-disclosure">
            <summary class="demo-disclosure__summary">Row states behavior</summary>
            <div class="demo-disclosure__content">
                <ul class="demo-rules-list">
                    <li><code>clean</code>: an existing row has not been changed.</li>
                    <li><code>new</code>: Add row created an unsaved client-side row.</li>
                    <li><code>modified</code>: an editable value differs from its original value.</li>
                    <li><code>deleted</code>: the standard delete column marked an existing row for deletion.</li>
                    <li><code>saved</code>: valid new or modified data was confirmed through the normal Save callback.</li>
                    <li><code>error</code>: a row or cell has a manual or validation error; Create error demonstrates this separately from <code>_state</code>.</li>
                    <li><code>_ambTempId</code>: temporary identifier assigned to new rows before backend confirmation.</li>
                    <li><code>_ambRowNumber</code>: stable row number used by reports and validation feedback.</li>
                    <li><code>_state</code>: internal lifecycle state exposed here only for demonstration.</li>
                </ul>
            </div>
        </details>
        <div id="row-states-table"></div>
    `;

    const demo = AMB.table({
        selector: '#row-states-table',
        height: '320px',
        deleteColumn: {
            enabled: true,
            confirmDeleteMessage: 'Delete this sample?',
            confirmRollbackMessage: 'Rollback this sample?',
            confirmRemoveNewMessage: 'Remove this new sample?'
        },
        toolbar: {
            buttons: [
                'add',
                'save',
                {
                    id: 'state-report',
                    label: 'Report',
                    title: 'Show row states report',
                    onClick: handleShowReport
                },
                {
                    id: 'state-row-numbers',
                    label: 'Row numbers',
                    title: 'Show row number report',
                    onClick: handleShowRowNumbers
                },
                {
                    id: 'state-error',
                    label: 'Create error',
                    title: 'Create a demo cell error',
                    onClick: handleCreateError
                }
            ],
            onAdd: handleAdd,
            onSave: handleSave
        },
        data: initialData.map(row => ({ ...row })),
        layout: 'fitColumns',
        columns: [
            {
                title: 'ID',
                field: 'id',
                width: 80,
                cssClass: 'amb-cell--readonly-passive amb-cell--derived'
            },
            {
                title: 'Temp ID',
                field: '_ambTempId',
                width: 130,
                cssClass: 'amb-cell--readonly-passive amb-cell--derived'
            },
            {
                title: '#',
                field: '_ambRowNumber',
                width: 70,
                cssClass: 'amb-cell--readonly-passive amb-cell--derived'
            },
            {
                title: 'State',
                field: '_state',
                width: 100,
                cssClass: 'amb-cell--readonly-passive amb-cell--derived'
            },
            { title: 'Item', field: 'item', editor: AMB.editors.text({ trim: true }) },
            { title: 'Category', field: 'category', editor: AMB.editors.text({ trim: true }) },
            { title: 'Owner', field: 'owner', editor: AMB.editors.text({ trim: true }) },
            { title: 'Note', field: 'note', editor: AMB.editors.text({ trim: true }) }
        ]
    });

    const { crud } = demo;
    const reportDialog = createDemoReportDialog();
    const originalDestroy = demo.destroy.bind(demo);

    demo.destroy = () => {
        reportDialog.destroy();
        originalDestroy();
    };

    function handleAdd() {
        demo.feedback.clear();
        crud.addRow({
            id: null,
            item: 'New sample',
            category: '',
            owner: '',
            note: ''
        });
    }

    function handleSave() {
        demo.feedback.clear();

        const report = crud.getStateReport();
        const generatedIds = report.validChangedRows
            .filter(row => row.state === 'new' && !row.id && row.tempId)
            .map(row => ({
                tempId: row.tempId,
                id: nextId++
            }));

        crud.applyBackendIds(generatedIds);

        const result = crud.markValidChangesSaved();

        if (!result.saved.length) {
            demo.feedback.show({
                type: 'info',
                message: result.skipped.length
                    ? 'No valid changes could be marked as saved.'
                    : 'There are no valid changes to save.'
            });
            return;
        }

        demo.feedback.show({
            type: 'success',
            message: `${result.saved.length} row(s) marked as saved.`
        });
    }

    function handleCreateError() {
        crud.markCellError(1, 'note', 'Manual demo error');
        demo.feedback.show({
            type: 'warning',
            message: 'A manual error was added to row 1, Note.'
        });
    }

    function handleShowReport() {
        const report = crud.getStateReport();

        reportDialog.open({
            title: 'Row states report',
            reportLines: buildStateReport(report),
            jsonData: report
        });
    }

    function handleShowRowNumbers() {
        const report = crud.getStateReport();
        const rows = report.rows.map(row => ({
            id: row.id,
            tempId: row.tempId,
            rowNumber: row.rowNumber,
            state: row.state
        }));

        reportDialog.open({
            title: 'Row numbers',
            reportLines: buildRowNumbersReport(report),
            jsonData: rows
        });
    }

    return demo;
}
