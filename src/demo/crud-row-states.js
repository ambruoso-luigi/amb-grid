import { AMB } from '../index.js';
import { publicExampleTranslations } from './example-copy.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';
import { createDemoCheckboxFormatter } from './utils/demo-checkbox.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';
import { createDemoCommandGuideToolbar } from './utils/demo-command-guide-toolbar.js';

export default function crudRowStates(app) {
    let nextId = 10;
    let destroyed = false;
    const errorCounts = new Map();
    const serverRejectedRows = new Map();
    let presentationPending = false;
    const t = (key, values = {}) => {
        const locale = document.documentElement.lang === 'en' ? 'en' : 'it';
        const message = publicExampleTranslations[locale][`examples.crudRowStates.${key}`];
        return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), message);
    };
    const initialData = [
        { id: 'REC-001', description: 'Approved service request', type: 'Request', department: 'Operations', tag: 'service', archived: 'N' },
        { id: 'REC-002', description: 'Contract review in progress', type: 'Contract', department: 'Operations', tag: 'contract', archived: 'N' },
        { id: 'REC-003', description: 'Superseded operations procedure', type: 'Procedure', department: 'Operations', tag: 'procedure', archived: 'Y' },
        { id: 'REC-004', description: 'Compliance evidence requires review', type: 'Request', department: 'Compliance', tag: 'evidence', archived: 'N' },
        { id: 'REC-005', description: 'Supplier onboarding checklist', type: 'Procedure', department: 'Procurement', tag: 'supplier', archived: 'N' },
        { id: 'REC-006', description: 'Quarterly budget approval', type: 'Request', department: 'Finance', tag: 'budget', archived: 'N' },
        { id: 'REC-007', description: 'Infrastructure support agreement', type: 'Contract', department: 'IT', tag: 'support', archived: 'N' },
        { id: 'REC-008', description: 'Employee access review procedure', type: 'Procedure', department: 'Compliance', tag: 'access', archived: 'N' },
        { id: 'REC-009', description: 'Completed warehouse maintenance request', type: 'Request', department: 'Operations', tag: 'warehouse', archived: 'Y' }
    ];
    app.innerHTML = `
        <h2 data-i18n="examples.crudRowStates.title">CRUD &amp; Row States</h2>
        <p class="demo-note" data-i18n="examples.crudRowStates.intro">Edit business records, inspect lifecycle states and errors, and compare reports with the save payload.</p>
        ${createDemoColumnGuide({
            summary: 'How this table works', summaryKey: 'examples.crudRowStates.detailsTitle',
            summaryMeta: 'Identity · states · errors · save', summaryMetaKey: 'examples.crudRowStates.guideMeta', summaryIcon: 'help', variant: 'technical',
            intro: 'The table starts with nine clean records. Prepare states explicitly restores the baseline and creates a valid lifecycle scenario.', introKey: 'examples.crudRowStates.guideIntro',
            points: [
                { title: 'Identity and states', titleKey: 'examples.crudRowStates.point1Title', description: 'Reports distinguish persistent IDs, temporary IDs, row numbers and lifecycle states.', descriptionKey: 'examples.crudRowStates.detail1' },
                { title: 'Editing and validation', titleKey: 'examples.crudRowStates.point2Title', description: 'Edit business fields; validation errors remain distinct from deleted rows.', descriptionKey: 'examples.crudRowStates.detail2' },
                { title: 'Payload and saving', titleKey: 'examples.crudRowStates.point3Title', description: 'Inspect inserted, updated and deleted changes, then simulate saving valid rows and assigning IDs.', descriptionKey: 'examples.crudRowStates.detail3' },
                { title: 'Rollback and Reload', titleKey: 'examples.crudRowStates.point4Title', description: 'Rollback restores one row. Reload restores the nine initial records.', descriptionKey: 'examples.crudRowStates.detail4' }
            ],
            columns: [
                { title: 'Record ID', titleKey: 'guides.rowStates.id.title', badge: 'PERSISTENT', description: 'Readonly identifier assigned by the backend.', descriptionKey: 'guides.rowStates.id.description' },
                { title: 'Description', titleKey: 'guides.rowStates.description.title', badge: 'TEXT', description: 'Required trimmed description, at least 3 characters.', descriptionKey: 'examples.crudRowStates.descriptionGuide' },
                { title: 'Type', titleKey: 'guides.rowStates.type.title', badge: 'SELECT', description: 'Restricted is accepted locally; the simulated backend allows it only for Compliance.', descriptionKey: 'examples.crudRowStates.typeGuide' },
                { title: 'Department', titleKey: 'examples.crudRowStates.column.department', badge: 'SELECT', description: 'The business department responsible for this record.', descriptionKey: 'examples.crudRowStates.departmentGuide' },
                { title: 'Tag', titleKey: 'guides.basic.tag.title', badge: 'TEXT', description: 'Required lowercase letters, up to 12 characters.', descriptionKey: 'examples.crudRowStates.tagGuide' },
                { title: 'Archived', titleKey: 'guides.basic.archived.title', badge: 'BOOLEAN', description: 'Editable checkbox stored as Y or N.', descriptionKey: 'examples.crudRowStates.archivedGuide' },
                { title: 'State', titleKey: 'guides.rowStates.state.title', badge: 'STATE', description: 'clean, new, modified, deleted or saved.', descriptionKey: 'guides.rowStates.state.description' },
                { title: 'Errors', titleKey: 'guides.rowStates.errors.title', badge: 'DERIVED', description: 'Current cell and row error count.', descriptionKey: 'guides.rowStates.errors.description' }
            ]
        })}
        <div class="demo-table-workbench">
            <div class="demo-command-guide-host"></div>
            <div id="crud-row-states-table" class="demo-business-grid demo-business-grid--viewport demo-row-states-grid"></div>
        </div>
    `;
    const commandGuideToolbar = createDemoCommandGuideToolbar(app);
    const reportDialog = createDemoReportDialog();
    const partialSaveDialog = new AMB.ConfirmDialog();
    const rowConfirmDialog = new AMB.ConfirmDialog();
    const formatArchivedCheckbox = createDemoCheckboxFormatter({ checkedValue: 'Y' });
    const demo = AMB.table({
        selector: '#crud-row-states-table',
        rowActionColumn: {
            enabled: true,
            confirmDeleteMessage: 'Delete record?', confirmRollbackMessage: 'Rollback record?', confirmRemoveNewMessage: 'Remove new record?',
            confirmProvider: ({ action }) => rowConfirmDialog.confirm({ title: t('confirmTitle'), message: t(`confirm.${action}`), confirmText: t('confirm'), cancelText: t('cancel') })
        },
        toolbar: {
            buttons: [
                'add',
                { id: 'state-prepare', label: t('prepare'), title: t('prepareTitle'), onClick: handlePrepareStates },
                'save', 'payload',
                { id: 'state-report', label: t('report'), title: t('reportTitle'), onClick: handleShowReport },
                'reload', commandGuideToolbar.button
            ],
            onAdd: handleAdd, onSave: handleSave, onPayload: handleShowPayload, onReload: handleReload
        },
        search: { enabled: true, placeholder: t('search'), filters: { enabled: true } },
        data: initialData.map(row => ({ ...row })),
        layout: 'fitColumns',
        columns: [
            { title: 'Record ID', field: 'id', minWidth: 95, widthGrow: 0.7, cssClass: 'demo-cell--passive demo-cell--derived' },
            { title: 'Description', field: 'description', minWidth: 180, widthGrow: 2.4, editor: AMB.editors.text({ trim: true }), required: true, requiredMessage: t('descriptionRequired'), validation: { minLength: { value: 3, message: t('descriptionLength') } } },
            { title: 'Type', field: 'type', minWidth: 108, widthGrow: 0.9, editor: AMB.editors.select({ options: ['Request', 'Contract', 'Procedure', 'Restricted'] }), required: true, requiredMessage: t('typeRequired') },
            { title: 'Department', field: 'department', minWidth: 118, widthGrow: 1, editor: AMB.editors.select({ options: ['Operations', 'Compliance', 'Procurement', 'Finance', 'IT'] }), required: true, requiredMessage: t('departmentRequired') },
            { title: 'Tag', field: 'tag', minWidth: 90, widthGrow: 0.8, editor: AMB.editors.text({ lowercase: true, trim: true }), required: true, requiredMessage: t('tagRequired'), validation: { pattern: { regex: /^[a-z]+$/, message: t('tagPattern') }, maxLength: { value: 12, message: t('tagLength') } } },
            { title: 'Archived', field: 'archived', minWidth: 82, widthGrow: 0.6, hozAlign: 'center', cssClass: 'demo-business-checkbox-cell', formatter: formatArchivedCheckbox, editor: AMB.editors.checkbox({ checkedValue: 'Y', uncheckedValue: 'N', checkedLabel: '', uncheckedLabel: '' }) },
            { title: 'State', field: '_state', minWidth: 92, widthGrow: 0.7, cssClass: 'demo-cell--passive demo-cell--derived' },
            { title: 'Errors', field: '_ambErrorCount', minWidth: 70, widthGrow: 0.5, formatter: formatErrorCount, cssClass: 'demo-cell--passive demo-cell--derived' }
        ]
    });
    const crud = demo.crud;
    commandGuideToolbar.mount();
    const originalDestroy = demo.destroy.bind(demo);
    const crudUnsubscribers = ['cell-error', 'cell-error-cleared', 'row-error', 'row-error-cleared', 'row-state-changed']
        .map(name => demo.onCrud(name, schedulePresentation));
    demo.table.on('cellEdited', handleBackendCorrection);
    demo.table.on('renderComplete', syncPresentation);
    window.addEventListener('amb-demo-language-change', syncPresentation);
    syncPresentation();
    demo.destroy = () => {
        destroyed = true;
        window.removeEventListener('amb-demo-language-change', syncPresentation);
        demo.table.off('renderComplete', syncPresentation);
        demo.table.off('cellEdited', handleBackendCorrection);
        crudUnsubscribers.forEach(unsubscribe => unsubscribe?.());
        reportDialog.destroy();
        partialSaveDialog.destroy();
        rowConfirmDialog.destroy();
        commandGuideToolbar.destroy();
        originalDestroy();
    };

    function formatErrorCount(cell) {
        const data = cell.getRow().getData();
        return errorCounts.get(data.id ?? data._ambTempId) || 0;
    }

    function refreshErrorCounts() {
        errorCounts.clear();
        const errors = crud.getStateReport().errors;
        [...errors.cells, ...errors.rows].forEach(error => {
            const key = error.id ?? error.tempId ?? error.key;
            errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
        });
        demo.table.getRows().forEach(row => {
            const element = row.getCell('_ambErrorCount')?.getElement();
            if (element) element.textContent = String(errorCounts.get(row.getData().id ?? row.getData()._ambTempId) || 0);
        });
        app.querySelectorAll('.tabulator-cell[data-cell-error="true"]').forEach(cell => cell.removeAttribute('title'));
    }

    function syncServerErrorPresentation() {
        const typeErrors = new Map(crud.getStateReport().errors.cells.filter(error => error.field === 'type').map(error => [error.key, error.message]));
        for (const [key, message] of serverRejectedRows) {
            if (typeErrors.get(key) !== message) serverRejectedRows.delete(key);
        }
        demo.table.getRows().forEach(row => {
            const data = row.getData();
            if (serverRejectedRows.has(data.id ?? data._ambTempId)) row.getElement().setAttribute('data-demo-server-error', 'true');
            else row.getElement().removeAttribute('data-demo-server-error');
        });
    }

    function schedulePresentation() {
        if (destroyed || presentationPending) return;
        presentationPending = true;
        globalThis.queueMicrotask(() => {
            presentationPending = false;
            syncPresentation();
        });
    }

    function handleBackendCorrection(cell) {
        if (!['type', 'department'].includes(cell.getField())) return;
        const data = cell.getRow().getData();
        const key = data.id ?? data._ambTempId;
        const message = serverRejectedRows.get(key);
        if (!message || (data.type === 'Restricted' && data.department !== 'Compliance')) return;
        const error = crud.getStateReport().errors.cells.find(error => error.key === key && error.field === 'type');
        serverRejectedRows.delete(key);
        if (error?.message === message) crud.clearCellError(key, 'type');
        schedulePresentation();
    }

    function syncPresentation() {
        if (destroyed) return;
        refreshErrorCounts();
        syncServerErrorPresentation();
        for (const [field, key] of Object.entries({ id: 'id', description: 'description', type: 'type', department: 'department', tag: 'tag', archived: 'archived', _state: 'state', _ambErrorCount: 'errors' })) {
            const title = app.querySelector(`.tabulator-col[tabulator-field="${field}"] .tabulator-col-title`);
            if (title) title.textContent = t(`column.${key}`);
        }
        for (const [action, key] of Object.entries({ add: 'add', 'state-prepare': 'prepare', save: 'save', payload: 'payload', 'state-report': 'report', reload: 'reload' })) {
            const button = app.querySelector(`[data-action="${action}"]`);
            if (!button) continue;
            const label = button.querySelector('.amb-toolbar__button-label');
            if (label) label.textContent = t(key);
            button.title = t(key);
            button.setAttribute('aria-label', t(key));
        }
        const search = app.querySelector('.amb-toolbar__search-input');
        if (search) search.placeholder = t('search');
        for (const button of app.querySelectorAll('.amb-row-action-button')) {
            button.title = t(`action.${button.dataset.action}`);
            button.setAttribute('aria-label', button.title);
        }
    }

    function runAfterEditSettled(callback) {
        document.activeElement?.blur?.();
        return new Promise(resolve => globalThis.setTimeout(() => resolve(destroyed ? undefined : callback()), 0));
    }

    function handleAdd() {
        demo.feedback.clear();
        return crud.addRow({ id: null, description: 'New vendor risk assessment', type: 'Request', department: 'Operations', tag: 'vendor', archived: 'N' });
    }

    function handleSave() {
        return runAfterEditSettled(saveChangedRows);
    }

    async function saveChangedRows() {
        demo.feedback.clear();
        const validateResult = demo.validateChanges();
        const payload = demo.getSavePayload({ savePolicy: 'valid-only', includeInvalid: true });
        if (!payload.hasChanges) return demo.feedback.show({ type: 'info', message: t('noChanges') });
        if (!payload.hasValidChanges) return demo.feedback.show({ type: 'warning', message: t('noValidChanges') });
        if (payload.hasInvalidChanges && payload.isPartialSave) {
            const invalidRows = validateResult.rows.filter(row => !row.isValid).map(row => `${t('row')} ${row.rowNumber}: ${row.errors.map(error => error.field).join(', ')}`);
            const confirmed = await partialSaveDialog.confirm({ title: t('partialTitle'), message: [t('partialMessage'), ...invalidRows].join('\n'), confirmText: t('saveValid'), cancelText: t('cancel') });
            if (!confirmed || destroyed) return destroyed ? undefined : demo.feedback.show({ type: 'info', message: t('cancelled') });
        }
        let report = crud.getStateReport();
        const before = new Map(report.validChangedRows.map(row => [row.key, row.state]));
        const rejected = report.validChangedRows.filter(row => row.after.type === 'Restricted' && row.after.department !== 'Compliance');
        rejected.forEach(row => {
            const message = t('backendRejected', { id: row.id ?? row.tempId ?? row.key });
            serverRejectedRows.set(row.key, message);
            crud.markCellError(row.key, 'type', message);
        });
        report = crud.getStateReport();
        const generatedIds = report.validChangedRows.filter(row => row.state === 'new' && !row.id && row.tempId).map(row => ({ tempId: row.tempId, id: `REC-${String(nextId++).padStart(3, '0')}` }));
        crud.applyBackendIds(generatedIds);
        const result = crud.markValidChangesSaved();
        const deleted = result.saved.filter(row => before.get(row.key) === 'deleted').length;
        const invalid = crud.getStateReport().invalidChangedRowsCount;
        const parts = [t('savedCount', { count: result.saved.length - deleted }), t('deletedCount', { count: deleted })];
        if (rejected.length) {
            const ids = rejected.map(row => row.id ?? row.tempId ?? row.key).join(', ');
            const explanation = rejected.length === 1 ? t('backendRejected', { id: ids }) : t('backendRejectedMany', { ids });
            parts.unshift(`${t(result.saved.length ? 'backendPartial' : 'backendNotSaved')} ${explanation}`);
        }
        if (invalid) parts.push(t('invalidCount', { count: invalid }));
        refreshErrorCounts();
        syncServerErrorPresentation();
        demo.feedback.show({ type: rejected.length ? 'error' : invalid ? 'warning' : 'success', message: parts.join(' ') });
    }

    async function resetToCleanBaseline() {
        nextId = 10;
        errorCounts.clear();
        serverRejectedRows.clear();
        demo.clearSearch();
        demo.clearFilter();
        await demo.setData(initialData.map(row => ({ ...row })));
        syncPresentation();
    }

    async function handlePrepareStates() {
        demo.feedback.clear();
        reportDialog.close();
        await resetToCleanBaseline();
        if (destroyed) return;
        await demo.updateRow('REC-005', { tag: 'review' });
        await demo.deleteRow('REC-003');
        await handleAdd();
        syncPresentation();
        demo.feedback.show({ type: 'info', message: t('prepared') });
    }

    async function handleReload() {
        demo.feedback.clear();
        reportDialog.close();
        await resetToCleanBaseline();
        if (!destroyed) demo.feedback.show({ type: 'success', message: t('reloaded') });
    }

    function handleShowReport() {
        return runAfterEditSettled(() => {
            const report = crud.getStateReport();
            const lines = [
                t('reportTitle'),
                `${t('rows')}: ${report.totalRows}`,
                ...['clean', 'new', 'modified', 'deleted', 'saved'].map(state => `${state}: ${report.rows.filter(row => row.state === state).length}`),
                `${t('errorRows')}: ${report.errorRowsCount}`,
                `${t('cellErrors')}: ${report.errors.cells.length}`,
                `${t('rowErrors')}: ${report.errors.rows.length}`,
                '',
                ...report.rows.map(row => `${t('column.id')}: ${row.id ?? '—'} | Temp ID: ${row.tempId ?? '—'} | ${t('row')}: ${row.rowNumber ?? '—'} | ${row.state} | ${t('column.errors')}: ${row.cellErrors.length + (row.rowError ? 1 : 0)}`),
                '',
                ...report.errors.cells.map(error => `${t('row')} ${error.rowNumber}: ${error.field} — ${error.message}`),
                ...report.errors.rows.map(error => `${t('row')} ${error.rowNumber}: ${error.message}`)
            ];
            reportDialog.open({ title: t('reportTitle'), reportLines: lines, jsonData: report, apiMethods: ['getStateReport'] });
        });
    }

    function handleShowPayload() {
        return runAfterEditSettled(() => {
            const payload = demo.getSavePayload({ savePolicy: 'valid-only', includeInvalid: true });
            reportDialog.open({ title: t('payloadTitle'), reportLines: ['inserted', 'updated', 'deleted'].map(key => `${key}: ${payload.changes[key].length}`), jsonData: payload, apiMethods: ['getSavePayload'] });
        });
    }

    return demo;
}
