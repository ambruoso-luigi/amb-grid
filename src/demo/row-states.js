import { AMB } from '../index.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';
import { createDemoCommandGuideToolbar } from './utils/demo-command-guide-toolbar.js';

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
    'Edit Description to create a modified row.',
    'Use the row action column to mark an existing row as deleted.',
    'Use Save to confirm valid changes and mark them as saved.',
    'Errors remain distinct from the deleted lifecycle state.'
];

const buildRowNumbersReport = report => [
    'Row numbers',
    '',
    ...report.rows.map(row => {
        const identifier = row.id ?? row.tempId ?? 'unknown';

        return `Record ID ${identifier} — Temp ID ${row.tempId ?? 'n/a'} — Row ${row.rowNumber ?? 'n/a'} — state ${row.state}`;
    })
];

const plural = (count, singular, pluralForm = `${singular}s`) => `${count} ${count === 1 ? singular : pluralForm}`;

export default function rowStates(app) {
    let nextId = 5;
    let crud = null;
    const errorCounts = new Map();
    const initialData = [
        { id: 'REC-001', description: 'Approved service request', type: 'Request' },
        { id: 'REC-002', description: 'Contract review in progress', type: 'Contract' },
        { id: 'REC-003', description: 'Superseded operations procedure', type: 'Procedure' },
        { id: 'REC-004', description: 'Compliance evidence requires review', type: 'Compliance' }
    ];

    app.innerHTML = `
        <h2 data-i18n="examples.rowStates.title">Row states</h2>
        <p class="demo-note" data-i18n="examples.rowStates.intro">How AMB Grid tracks each row through its lifecycle.</p>
        ${createDemoColumnGuide({
            summary: 'How row states work',
            summaryKey: 'examples.rowStates.detailsTitle',
            summaryMeta: 'Identity · states · errors · save', summaryMetaKey: 'examples.rowStates.guideMeta', summaryIcon: 'help', variant: 'technical',
            intro: 'Row States keeps record identity, lifecycle state, and errors separate. The table starts clean: edit manually or use Show states to prepare examples.',
            introKey: 'examples.rowStates.guideIntro',
            points: [
                { title: 'Identity', titleKey: 'examples.rowStates.point1Title', description: 'ID identifies persisted rows, Temp ID identifies unsaved rows, and row number remains a stable reference.', descriptionKey: 'examples.rowStates.detail1' },
                { title: 'Transitions', titleKey: 'examples.rowStates.point2Title', description: 'Editing moves clean to modified, Add creates new, and Delete marks a persisted row deleted.', descriptionKey: 'examples.rowStates.detail2' },
                { title: 'Rollback', titleKey: 'examples.rowStates.point3Title', description: 'Rollback restores the baseline values and the matching lifecycle state.', descriptionKey: 'examples.rowStates.detail3' },
                { title: 'Errors', titleKey: 'examples.rowStates.point4Title', description: 'Errors belong to a row or cell and remain conceptually distinct from Deleted.', descriptionKey: 'examples.rowStates.detail4' },
                { title: 'Save', titleKey: 'examples.rowStates.point5Title', description: 'Save assigns definitive IDs to new rows, confirms valid changes, and exposes saved through the real lifecycle.', descriptionKey: 'examples.rowStates.detail5' }
            ],
            columns: [
                { title: 'Record ID', titleKey: 'guides.rowStates.id.title', badge: 'PERSISTENT', description: 'Readonly identifier for a row already known by the backend.', descriptionKey: 'guides.rowStates.id.description' },
                { title: 'Temp ID', titleKey: 'guides.rowStates.tempId.title', badge: 'TEMP', description: 'Readonly client identifier assigned to a new unsaved row.', descriptionKey: 'guides.rowStates.tempId.description' },
                { title: 'Row', titleKey: 'guides.rowStates.rowNumber.title', badge: 'ROW', description: 'Derived row number used by reports and validation feedback.', descriptionKey: 'guides.rowStates.rowNumber.description' },
                { title: 'State', titleKey: 'guides.rowStates.state.title', badge: 'STATE', description: 'Shows clean, new, modified, deleted, or saved state.', descriptionKey: 'guides.rowStates.state.description' },
                { title: 'Errors', titleKey: 'guides.rowStates.errors.title', badge: 'DERIVED', description: 'Readonly count of cell and row errors currently attached to the record.', descriptionKey: 'guides.rowStates.errors.description' },
                { title: 'Description', titleKey: 'guides.rowStates.description.title', badge: 'TEXT', description: 'Trimmed editable description used to demonstrate lifecycle transitions.', descriptionKey: 'guides.rowStates.description.description' },
                { title: 'Type', titleKey: 'guides.rowStates.type.title', badge: 'SELECT', description: 'Required business type; Restricted is accepted locally but rejected by the simulated backend.', descriptionKey: 'guides.rowStates.type.description' }
            ]
        })}
        <div class="demo-table-workbench">
            <div class="demo-command-guide-host"></div>
            <div id="row-states-table" class="demo-business-grid demo-business-grid--viewport demo-row-states-grid"></div>
        </div>
    `;

    const commandGuideToolbar = createDemoCommandGuideToolbar(app);
    const demo = AMB.table({
        selector: '#row-states-table',
        rowActionColumn: {
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
                { id: 'state-show-states', label: 'Show states', title: 'Show lifecycle examples', onClick: handleShowStates },
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
                commandGuideToolbar.button
            ],
            onAdd: handleAdd,
            onSave: handleSave,
            onReload: handleReload
        },
        data: initialData.map(row => ({ ...row })),
        layout: 'fitColumns',
        columns: [
            {
                title: 'Record ID',
                field: 'id',
                minWidth: 68,
                widthGrow: 0.4,
                cssClass: 'demo-cell--passive demo-cell--derived'
            },
            {
                title: 'Temp ID',
                field: '_ambTempId',
                minWidth: 105,
                widthGrow: 0.65,
                cssClass: 'demo-cell--passive demo-cell--derived'
            },
            {
                title: 'Row',
                field: '_ambRowNumber',
                minWidth: 58,
                widthGrow: 0.35,
                cssClass: 'demo-cell--passive demo-cell--derived'
            },
            {
                title: 'State',
                field: '_state',
                minWidth: 92,
                widthGrow: 0.6,
                cssClass: 'demo-cell--passive demo-cell--derived'
            },
            {
                title: 'Errors',
                field: '_ambErrorCount',
                minWidth: 75,
                widthGrow: 0.45,
                formatter: formatErrorCount,
                cssClass: 'demo-cell--passive demo-cell--derived'
            },
            { title: 'Description', field: 'description', minWidth: 220, widthGrow: 1.8, editor: AMB.editors.text({ trim: true }), required: true, requiredMessage: 'Description is required', validation: { minLength: { value: 3, message: 'Description must be at least 3 characters' } } },
            { title: 'Type', field: 'type', minWidth: 130, widthGrow: 0.8, editor: AMB.editors.select({ options: ['Request', 'Contract', 'Procedure', 'Compliance', 'Restricted'] }), required: true, requiredMessage: 'Type is required' }
        ]
    });
    commandGuideToolbar.mount();

    crud = demo.crud;
    const reportDialog = createDemoReportDialog();
    const partialSaveDialog = new AMB.ConfirmDialog({ title: 'Some rows contain errors' });
    const serverRejectedRows = new Set();
    const originalDestroy = demo.destroy.bind(demo);
    const onRenderComplete = () => {
        syncServerErrorPresentation();
        clearNativeErrorTitles();
    };
    demo.table.on('renderComplete', onRenderComplete);
    const handleCrudErrorEvent = event => {
        if (event.type === 'cell-error-cleared' && event.field === 'type' && serverRejectedRows.has(event.key)) {
            const data = event.row?.getData?.();

            if (data?.type !== 'Restricted') {
                serverRejectedRows.delete(event.key);
                syncServerErrorPresentation();
                syncServerRejectedFeedback();
            }
        }
        refreshErrorCounts();
        globalThis.setTimeout(clearNativeErrorTitles, 0);
    };
    const crudUnsubscribers = ['cell-error', 'cell-error-cleared', 'row-error', 'row-error-cleared']
        .map(eventName => demo.onCrud(eventName, event => {
            handleCrudErrorEvent({ ...event, type: eventName });
        }));
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

    function syncServerErrorPresentation() {
        demo.table.getRows().forEach(row => {
            const data = row.getData();
            const key = data.id ?? data._ambTempId;
            const element = row.getElement();

            if (serverRejectedRows.has(key)) element.setAttribute('data-demo-server-error', 'true');
            else element.removeAttribute('data-demo-server-error');
        });
    }

    function syncServerRejectedFeedback() {
        if (!serverRejectedRows.size) {
            demo.feedback.clear();
            return;
        }

        demo.feedback.show({
            type: 'error',
            message: `${plural(serverRejectedRows.size, 'row')} ${serverRejectedRows.size === 1 ? 'was' : 'were'} rejected by the backend.`
        });
    }

    function clearNativeErrorTitles() {
        app.querySelectorAll('#row-states-table .tabulator-cell[data-cell-error="true"]')
            .forEach(cell => cell.removeAttribute('title'));
    }

    demo.destroy = () => {
        demo.table.off('renderComplete', onRenderComplete);
        crudUnsubscribers.forEach(unsubscribe => unsubscribe?.());
        reportDialog.destroy();
        partialSaveDialog.destroy();
        commandGuideToolbar.destroy();
        originalDestroy();
    };

    function handleAdd() {
        demo.feedback.clear();
        return crud.addRow({
            id: null,
            description: 'New lifecycle sample',
            type: 'Request'
        });
    }

    function handleSave() {
        return runAfterEditSettled(saveChangedRows);
    }

    async function saveChangedRows() {
        demo.feedback.clear();
        const validateResult = demo.validateChanges();
        let payload = demo.getSavePayload({ savePolicy: 'valid-only', includeInvalid: true });

        if (!payload.hasChanges) {
            demo.feedback.show({ type: 'info', message: 'There are no changes to save.' });
            return;
        }
        if (!payload.hasValidChanges && payload.hasInvalidChanges) {
            demo.feedback.show({ type: 'warning', message: 'There are no valid changes to save. Correct the rows with errors first.' });
            return;
        }
        if (payload.hasValidChanges && payload.hasInvalidChanges && payload.isPartialSave) {
            const invalidRows = validateResult.rows.filter(row => !row.isValid)
                .map(row => `Row ${row.rowNumber}: ${row.errors.map(error => error.field).join(', ')}`);
            const confirmed = await partialSaveDialog.confirm({
                message: ['Some rows contain errors and will not be saved.', 'Do you want to save only the valid rows?', '', 'Invalid rows:', ...invalidRows].join('\n'),
                confirmText: 'Save valid rows',
                cancelText: 'Cancel'
            });
            if (!confirmed) {
                demo.feedback.show({ type: 'info', message: 'Save cancelled.' });
                return;
            }
        }
        let report = crud.getStateReport();
        const rowsBeingSaved = new Map(report.validChangedRows.map(row => [row.key, row]));
        const frontendInvalidCount = payload.invalidChangedRows?.length || 0;
        const restrictedRows = report.validChangedRows.filter(row => row.after.type === 'Restricted');
        restrictedRows.forEach(row => {
            crud.markCellError(row.key, 'type', 'The backend rejected this record because the selected type is restricted.');
            serverRejectedRows.add(row.key);
        });
        refreshErrorCounts();
        syncServerErrorPresentation();
        clearNativeErrorTitles();
        report = crud.getStateReport();
        const generatedIds = report.validChangedRows
            .filter(row => row.state === 'new' && !row.id && row.tempId)
            .map(row => ({
                tempId: row.tempId,
                id: `REC-${String(nextId++).padStart(3, '0')}`
            }));

        crud.applyBackendIds(generatedIds);

        const result = crud.markValidChangesSaved();
        result.saved.forEach(row => serverRejectedRows.delete(row.key));
        syncServerErrorPresentation();
        const deletedCount = result.saved.filter(row => rowsBeingSaved.get(row.key)?.state === 'deleted').length;
        const savedCount = result.saved.length - deletedCount;
        const parts = [];
        if (savedCount) parts.push(`${plural(savedCount, 'row')} saved.`);
        if (deletedCount) parts.push(`${plural(deletedCount, 'row')} deleted.`);
        if (restrictedRows.length) parts.push(`${plural(restrictedRows.length, 'row')} ${restrictedRows.length === 1 ? 'was' : 'were'} rejected by the backend.`);
        if (frontendInvalidCount) parts.push(`${plural(frontendInvalidCount, 'row')} with validation errors remain.`);
        demo.feedback.show({
            type: restrictedRows.length ? 'error' : frontendInvalidCount ? 'warning' : 'success',
            message: parts.join(' ') || 'There are no changes to save.'
        });
    }

    // Restores the four valid persisted records and clears all demo state.
    async function resetToCleanBaseline() {
        errorCounts.clear();
        serverRejectedRows.clear();
        await demo.setData(initialData.map(row => ({ ...row })));
        refreshErrorCounts();
    }

    async function handleShowStates() {
        demo.feedback.clear();
        reportDialog.close();
        await resetToCleanBaseline();
        await demo.updateRow('REC-002', {
            description: 'Contract review awaiting approval'
        });
        await demo.deleteRow('REC-003');
        await demo.updateRow('REC-004', { type: '' });
        demo.validateRow('REC-004');
        await demo.addRow({ id: null, description: 'New vendor risk assessment', type: 'Request' });
        refreshErrorCounts();
    }

    async function handleReload() {
        demo.feedback.clear();
        reportDialog.close();

        nextId = 5;
        await resetToCleanBaseline();
        demo.feedback.show({
            type: 'success',
            message: 'Clean baseline reloaded.'
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
