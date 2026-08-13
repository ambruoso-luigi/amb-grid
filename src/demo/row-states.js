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
    'Use Save to confirm valid changes and mark them as saved.',
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
        <h2 data-i18n="examples.rowStates.title">Row states</h2>
        <p class="demo-note" data-i18n="examples.rowStates.intro">Use the CRUD toolbar and delete column to explore how AMB Grid tracks each row through its lifecycle.</p>
        <details class="demo-disclosure">
            <summary class="demo-disclosure__summary" data-i18n="examples.rowStates.detailsTitle">Row states behavior</summary>
            <div class="demo-disclosure__content">
                <ul class="demo-explanation-list">
                    <li><strong data-i18n="examples.rowStates.point1Title">Lifecycle</strong><span data-i18n="examples.rowStates.detail1">clean is unchanged, new was added locally, and modified differs from its original data.</span></li>
                    <li><strong data-i18n="examples.rowStates.point2Title">Delete</strong><span data-i18n="examples.rowStates.detail2">deleted marks an existing row for removal; a new unsaved row is removed directly.</span></li>
                    <li><strong data-i18n="examples.rowStates.point3Title">Save</strong><span data-i18n="examples.rowStates.detail3">Save processes valid changes and exposes saved after application confirmation.</span></li>
                    <li><strong data-i18n="examples.rowStates.point4Title">Rollback</strong><span data-i18n="examples.rowStates.detail4">Rollback restores original values and returns an edited row to clean.</span></li>
                    <li><strong data-i18n="examples.rowStates.point5Title">Report</strong><span data-i18n="examples.rowStates.detail5">Report summarizes lifecycle states and errors; Row numbers exposes the stable references used by feedback.</span></li>
                </ul>
            </div>
        </details>
        <div id="row-states-table" class="demo-example-grid-frame"></div>
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
                minWidth: 68,
                widthGrow: 0.4,
                cssClass: 'amb-cell--readonly-passive amb-cell--derived'
            },
            {
                title: 'Temp ID',
                field: '_ambTempId',
                minWidth: 105,
                widthGrow: 0.65,
                cssClass: 'amb-cell--readonly-passive amb-cell--derived'
            },
            {
                title: '#',
                field: '_ambRowNumber',
                minWidth: 58,
                widthGrow: 0.35,
                cssClass: 'amb-cell--readonly-passive amb-cell--derived'
            },
            {
                title: 'Lifecycle',
                field: '_state',
                minWidth: 92,
                widthGrow: 0.6,
                cssClass: 'amb-cell--readonly-passive amb-cell--derived'
            },
            {
                title: 'Errors',
                field: '_ambErrorCount',
                minWidth: 75,
                widthGrow: 0.45,
                formatter: formatErrorCount,
                cssClass: 'amb-cell--readonly-passive amb-cell--derived'
            },
            { title: 'Item', field: 'item', minWidth: 125, widthGrow: 1.35, editor: AMB.editors.text({ trim: true }) },
            { title: 'Category', field: 'category', minWidth: 105, widthGrow: 0.9, editor: AMB.editors.text({ trim: true }) },
            { title: 'Owner', field: 'owner', minWidth: 90, widthGrow: 0.75, editor: AMB.editors.text({ trim: true }) },
            { title: 'Note', field: 'note', minWidth: 140, widthGrow: 1.6, editor: AMB.editors.text({ trim: true }) }
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
