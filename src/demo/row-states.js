import { AMB } from '../index.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';

const countRowsByState = (report, state) => {
    return report.rows.filter(row => row.state === state).length;
};

const buildErrorDetails = report => {
    return report.rows
        .filter(row => row.hasErrors)
        .map(row => {
            const errorCount = row.cellErrors.length + (row.rowError ? 1 : 0);
            const label = errorCount === 1 ? 'error' : 'errors';

            return `Row ${row.rowNumber ?? 'n/a'}: ${errorCount} ${label}`;
        });
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
    `Row errors: ${report.errors.rows.length}`,
    ...buildErrorDetails(report),
    '',
    'Use Add row to create a new row.',
    'Edit Item, Category, Owner, or Note to create a modified row.',
    'Use the delete column to mark an existing row as deleted.',
    'Use Save to simulate backend confirmation and mark valid changes as saved.',
    'Use Create error to modify two rows and attach demo errors.'
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
    const errorCounts = new Map();
    const initialData = [
        { id: 1, item: 'Clean sample', category: 'Inventory', owner: 'Ops', note: 'Ready', _state: 'clean' },
        { id: 2, item: 'Tracked sample', category: 'Quality', owner: 'QA', note: 'Editable', _state: 'clean' },
        { id: 3, item: 'Review sample', category: 'Backoffice', owner: 'Admin', note: 'Pending', _state: 'clean' },
        { id: 4, item: 'Reference sample', category: 'System', owner: 'System', note: 'Reference data', _state: 'clean' },
        { id: 5, item: 'Audit sample', category: 'Compliance', owner: 'Audit', note: 'Needs review', _state: 'clean' },
        { id: 6, item: 'Stable sample', category: 'Operations', owner: 'Ops', note: 'Stable', _state: 'clean' }
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
                    <li>An error is not a lifecycle state. The Errors column counts active row and cell error markers separately.</li>
                    <li>Create error intentionally modifies rows 1 and 4 before adding errors, so both rows enter the <code>modified</code> lifecycle state.</li>
                    <li>Row 1 receives one cell error; non-consecutive row 4 receives two cell errors. The report shows their detailed counts.</li>
                    <li>Save acts only on valid <code>new</code>, <code>modified</code>, or <code>deleted</code> rows. With no changed rows, Save leaves lifecycle states unchanged.</li>
                    <li>Reload restores the six initial rows, clears all errors, resets lifecycle states to <code>clean</code>, and resets Errors to zero.</li>
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
                'reload',
                {
                    id: 'state-error',
                    label: 'Create error',
                    title: 'Create demo errors',
                    onClick: handleCreateError
                },
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
                }
            ],
            onAdd: handleAdd,
            onSave: handleSave,
            onReload: handleReload
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
                title: 'Errors',
                field: '_ambErrorCount',
                width: 90,
                formatter: formatErrorCount,
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

    function getRowKey(cell) {
        const data = cell.getRow().getData();

        return data.id ?? data._ambTempId;
    }

    function formatErrorCount(cell) {
        return errorCounts.get(getRowKey(cell)) || 0;
    }

    function updateErrorCounts() {
        errorCounts.clear();

        const errors = crud.getStateReport().errors;

        [...errors.cells, ...errors.rows].forEach(error => {
            const key = error.id ?? error.tempId ?? error.key;

            errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
        });
    }

    function refreshErrorCounts() {
        updateErrorCounts();

        demo.table.getRows().forEach(row => {
            const errorCell = row.getCell('_ambErrorCount');
            const errorElement = errorCell
                && typeof errorCell.getElement === 'function'
                && errorCell.getElement();

            if (errorElement) {
                errorElement.textContent = String(
                    errorCounts.get(row.getData().id ?? row.getData()._ambTempId) || 0
                );
            }
        });
    }

    demo.destroy = () => {
        reportDialog.destroy();
        originalDestroy();
    };

    function handleAdd() {
        demo.feedback.clear();
        return crud.addRow({
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
        demo.feedback.clear();

        crud.updateRowFields(1, {
            note: 'Manual error injected in this row'
        });
        crud.markCellError(1, 'note', 'Manual demo error');

        crud.updateRowFields(4, {
            owner: 'Invalid owner',
            note: 'Two demo errors injected'
        });
        crud.markCellError(4, 'owner', 'Owner is not valid for this demo');
        crud.markCellError(4, 'note', 'Note requires review');

        refreshErrorCounts();
        demo.feedback.show({
            type: 'warning',
            message: 'Demo errors were added: row 1 has 1 error, row 4 has 2 errors. Affected rows are modified.'
        });
    }

    async function handleReload() {
        demo.feedback.clear();
        reportDialog.close();

        crud.getStateReport().rows.forEach(row => {
            crud.rollbackRow(row.key);
        });

        errorCounts.clear();
        nextId = 7;
        await demo.table.setData(initialData.map(row => ({ ...row })));
        refreshErrorCounts();
        demo.feedback.show({
            type: 'success',
            message: 'Initial row states data reloaded.'
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
