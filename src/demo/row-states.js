import { AMB } from '../index.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';

const countRowsByState = (report, state) => {
    return report.rows.filter(row => row.state === state).length;
};

const buildStateReport = report => [
    'Row states report',
    '',
    `Rows: ${report.totalRows}`,
    '',
    'Lifecycle states',
    '',
    `Clean: ${countRowsByState(report, 'clean')}`,
    `New: ${countRowsByState(report, 'new')}`,
    `Modified: ${countRowsByState(report, 'modified')}`,
    `Deleted: ${countRowsByState(report, 'deleted')}`,
    `Saved: ${countRowsByState(report, 'saved')}`,
    '',
    'Errors',
    '',
    `Rows with errors: ${report.errorRowsCount}`,
    `Cell errors: ${report.errors.cells.length}`,
    '',
    'Use Add row to create a new row.',
    'Edit Item, Category, Owner, or Note to create a modified row.',
    'Use the delete column to mark an existing row as deleted.',
    'Use Save to simulate backend confirmation and mark valid changes as saved.',
    'Use Create error to mark a demo cell error without changing lifecycle state.'
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
    let crud = null;
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
                    <li><code>clean</code>, <code>new</code>, <code>modified</code>, <code>deleted</code>, and <code>saved</code> are lifecycle states.</li>
                    <li><code>clean</code>: an existing row has not been changed.</li>
                    <li><code>new</code>: Add row created an unsaved client-side row.</li>
                    <li><code>modified</code>: an editable value differs from its original value.</li>
                    <li><code>deleted</code>: the standard delete column marked an existing row for deletion.</li>
                    <li><code>saved</code>: valid new or modified data was confirmed through the normal Save callback.</li>
                    <li>An error is not a lifecycle state. Health reports errors separately, so a <code>clean</code>, <code>new</code>, or <code>modified</code> row can also show <code>Error</code>.</li>
                    <li>Create error uses <code>markCellError</code>; row 1 remains <code>clean</code> while Health changes to <code>Error</code>.</li>
                    <li>Save acts only on valid <code>new</code>, <code>modified</code>, or <code>deleted</code> rows. With no changed rows, Save leaves lifecycle states unchanged.</li>
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
                title: 'Lifecycle',
                field: '_state',
                width: 110,
                cssClass: 'amb-cell--readonly-passive amb-cell--derived'
            },
            {
                title: 'Health',
                field: '_ambHealth',
                width: 90,
                formatter: formatHealth,
                cssClass: 'amb-cell--readonly-passive amb-cell--derived'
            },
            { title: 'Item', field: 'item', editor: AMB.editors.text({ trim: true }) },
            { title: 'Category', field: 'category', editor: AMB.editors.text({ trim: true }) },
            { title: 'Owner', field: 'owner', editor: AMB.editors.text({ trim: true }) },
            { title: 'Note', field: 'note', editor: AMB.editors.text({ trim: true }) }
        ]
    });

    crud = demo.crud;
    const reportDialog = createDemoReportDialog();
    const originalDestroy = demo.destroy.bind(demo);
    const runAfterEditSettled = callback => {
        if (
            document.activeElement
            && typeof document.activeElement.blur === 'function'
        ) {
            document.activeElement.blur();
        }

        return new Promise(resolve => {
            globalThis.setTimeout(() => {
                resolve(callback());
            }, 0);
        });
    };

    function formatHealth(cell) {
        if (!crud) return 'OK';

        const data = cell.getRow().getData();
        const reportRow = crud.getStateReport().rows.find(row => {
            if (data.id !== null && data.id !== undefined && data.id !== '') {
                return row.id === data.id;
            }

            return row.tempId === data._ambTempId;
        });

        return reportRow?.hasErrors ? 'Error' : 'OK';
    }

    function refreshHealth() {
        const reportRows = crud.getStateReport().rows;

        reportRows.forEach(reportRow => {
            const row = crud.findRowByKey(reportRow.key);
            const healthCell = row
                && typeof row.getCell === 'function'
                && row.getCell('_ambHealth');
            const healthElement = healthCell
                && typeof healthCell.getElement === 'function'
                && healthCell.getElement();

            if (healthElement) {
                healthElement.textContent = reportRow.hasErrors ? 'Error' : 'OK';
            }
        });
    }

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
        return runAfterEditSettled(saveChangedRows);
    }

    function saveChangedRows() {
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
        refreshHealth();
        demo.feedback.show({
            type: 'warning',
            message: 'A manual error was added to row 1. Lifecycle remains clean; Health is now Error.'
        });
    }

    function handleShowReport() {
        return runAfterEditSettled(openStateReport);
    }

    function openStateReport() {
        const report = crud.getStateReport();

        reportDialog.open({
            title: 'Row states report',
            reportLines: buildStateReport(report),
            jsonData: report
        });
    }

    function handleShowRowNumbers() {
        return runAfterEditSettled(openRowNumbersReport);
    }

    function openRowNumbersReport() {
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
