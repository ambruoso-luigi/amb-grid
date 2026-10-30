import { AMB } from '../index.js';
import { publicExampleTranslations } from './example-copy.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';
import { createDemoCheckboxFormatter } from './utils/demo-checkbox.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';
import { createDemoCommandGuideToolbar } from './utils/demo-command-guide-toolbar.js';
import { createDemoActionTutorial } from './components/demo-action-tutorial.js';

export default function crudRowStates(app) {
    let nextId = 10;
    let destroyed = false;
    const errorCounts = new Map();
    const serverRejectedRows = new Map();
    const backendRetryRows = new Set();
    const tutorialEdits = new Map();
    const tutorialRowActions = new Map();
    let tutorialNewTempId = null;
    let preparingStates = false;
    let presentationPending = false;
    let demo = null;
    let scenarioGeneration = 0;
    let resettingScenario = false;
    let baselineReset = Promise.resolve();
    const scenarioOperations = new Set();
    const identifierSignatures = new WeakMap();
    let tutorialState = null;
    let highlightedControl = null;
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
            <div class="demo-action-tutorial-host"></div>
            <div id="crud-row-states-table" class="demo-business-grid demo-business-grid--viewport demo-row-states-grid"></div>
        </div>
    `;
    const commandGuideToolbar = createDemoCommandGuideToolbar(app);
    const reportDialog = createDemoReportDialog();
    const partialSaveDialog = new AMB.ConfirmDialog();
    const rowConfirmDialog = new AMB.ConfirmDialog();
    const tutorial = createDemoActionTutorial({
        host: app.querySelector('.demo-action-tutorial-host'),
        locale: document.documentElement.lang,
        titleKey: 'examples.crudRowStates.tutorialTitle',
        completedKey: 'examples.crudRowStates.tutorialCompleted',
        onRestart: resetToCleanBaseline,
        onStateChange: state => {
            tutorialState = state;
            syncTutorialHighlight();
        },
        steps: [
            {
                id: 'edit-record', actions: [{
                    actionId: 'cell-edited', instructionKey: 'examples.crudRowStates.tutorialEdit',
                    isComplete: ({ id, field, previous, report }) => id === 'REC-001' && field === 'type' && previous === 'Request'
                        && report.rows.some(row => row.id === id && row.after.type === 'Procedure' && row.state === 'modified' && !row.hasErrors)
                }]
            },
            {
                id: 'add-record', actions: [{
                    actionId: 'row-added', instructionKey: 'examples.crudRowStates.tutorialAdd',
                    isComplete: ({ row }) => row?.state === 'new' && Boolean(row.tempId) && !row.id && !row.hasErrors
                }]
            },
            {
                id: 'delete-record', actions: [{
                    actionId: 'row-action', instructionKey: 'examples.crudRowStates.tutorialDelete',
                    isComplete: ({ id, action, report }) => id === 'REC-003' && action === 'delete'
                        && report.rows.some(row => row.id === id && row.state === 'deleted')
                }]
            },
            {
                id: 'frontend-report', actions: [
                    {
                        actionId: 'cell-edited', instructionKey: 'examples.crudRowStates.tutorialInvalidate',
                        isComplete: ({ id, field, report }) => id === 'REC-004' && field === 'description' && hasTutorialFrontendError(report)
                    },
                    {
                        actionId: 'open-report', instructionKey: 'examples.crudRowStates.tutorialInspectError',
                        isComplete: ({ opened, report }) => opened === true && hasTutorialFrontendError(report)
                            && report.errors.cells.some(error => error.id === 'REC-004' && error.field === 'description')
                    }
                ]
            },
            {
                id: 'partial-save', actions: [
                    {
                        actionId: 'partial-save-opened', instructionKey: 'examples.crudRowStates.tutorialPartialSave',
                        isComplete: ({ opened, report }) => opened === true && hasTutorialPartialScenario(report)
                    },
                    {
                        actionId: 'save', instructionKey: 'examples.crudRowStates.tutorialConfirmPartial',
                        isComplete: ({ report, saved, generatedIds, partialConfirmed }) => partialConfirmed === true
                            && saved.some(row => row.id === 'REC-001') && saved.some(row => row.id === 'REC-003' && row.state === 'deleted')
                            && report.rows.some(row => row.id === 'REC-001' && row.state === 'saved' && row.after.type === 'Procedure')
                            && generatedIds.some(mapping => mapping.tempId === tutorialNewTempId
                                && report.rows.some(row => row.id === mapping.id && row.state === 'saved' && !row.hasErrors))
                            && !report.rows.some(row => row.id === 'REC-003') && hasTutorialFrontendError(report)
                    }
                ]
            },
            {
                id: 'rollback-record', actions: [{
                    actionId: 'row-action', instructionKey: 'examples.crudRowStates.tutorialRollback',
                    isComplete: ({ id, action, previous, report }) => id === 'REC-004' && action === 'rollback'
                        && previous?.cellErrors.some(error => error.field === 'description')
                        && report.rows.some(row => row.id === id && row.state === 'clean' && !row.hasErrors && !row.hasChanges
                            && row.after.description === initialData.find(item => item.id === id).description)
                        && errorCounts.get(id) === undefined
                }]
            },
            {
                id: 'backend-error', actions: [
                    {
                        actionId: 'cell-edited', instructionKey: 'examples.crudRowStates.tutorialRestrictedEdit',
                        isComplete: ({ id, field, previous, report, backendRejected }) => id === 'REC-001' && field === 'type'
                            && previous !== 'Restricted' && !backendRejected
                            && report.rows.some(row => row.id === id && row.after.type === 'Restricted' && row.after.department === 'Operations'
                                && row.state === 'modified' && !row.hasErrors)
                    },
                    {
                        actionId: 'save', instructionKey: 'examples.crudRowStates.tutorialBackendSave',
                        isComplete: ({ report, rejectedIds, feedbackShown, feedbackType }) => feedbackShown && feedbackType === 'error'
                            && rejectedIds.includes('REC-001') && serverRejectedRows.has('REC-001') && errorCounts.get('REC-001') > 0
                            && report.rows.some(row => row.id === 'REC-001' && row.state === 'modified' && row.hasChanges
                                && row.cellErrors.some(error => error.field === 'type' && error.message === serverRejectedRows.get(row.key)))
                    }
                ]
            },
            {
                id: 'correct-save', actions: [
                    {
                        actionId: 'cell-edited', instructionKey: 'examples.crudRowStates.tutorialCorrectEdit',
                        isComplete: ({ id, field, previous, report, backendRejected }) => id === 'REC-001' && field === 'type'
                            && previous === 'Restricted' && !backendRejected && backendRetryRows.has(id)
                            && report.rows.some(row => row.id === id && row.after.type === 'Procedure' && !row.hasErrors)
                    },
                    {
                        actionId: 'save', instructionKey: 'examples.crudRowStates.tutorialCorrectSave',
                        isComplete: ({ report, saved, feedbackShown }) => feedbackShown && saved.some(row => row.id === 'REC-001')
                            && !serverRejectedRows.has('REC-001') && !backendRetryRows.has('REC-001')
                            && report.rows.some(row => row.id === 'REC-001' && row.state === 'saved'
                                && row.after.type === 'Procedure' && !row.hasErrors && !row.hasChanges)
                    }
                ]
            }
        ]
    });
    const formatArchivedCheckbox = createDemoCheckboxFormatter({ checkedValue: 'Y' });
    demo = AMB.table({
        selector: '#crud-row-states-table',
        rowActionColumn: {
            enabled: true,
            confirmDeleteMessage: 'Delete record?', confirmRollbackMessage: 'Rollback record?', confirmRemoveNewMessage: 'Remove new record?',
            confirmProvider: handleConfirmRowAction
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
            { title: 'Record ID', field: 'id', minWidth: 95, widthGrow: 0.7, formatter: formatRecordId, variableHeight: true, cssClass: 'demo-cell--passive demo-cell--derived' },
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
    crudUnsubscribers.push(demo.onCrud('row-state-changed', handleTutorialRowState));
    demo.table.on('cellEditing', handleTutorialEditStart);
    demo.table.on('cellEditCancelled', handleTutorialEditCancelled);
    demo.table.on('cellEdited', handleBackendCorrection);
    demo.table.on('cellEdited', handleTutorialEdit);
    demo.table.on('renderComplete', syncPresentation);
    demo.table.on('scrollVertical', syncTutorialHighlight);
    demo.table.on('dataFiltered', syncTutorialHighlight);
    window.addEventListener('amb-demo-language-change', syncPresentation);
    syncPresentation();
    demo.destroy = () => {
        destroyed = true;
        scenarioGeneration += 1;
        clearTutorialHighlight();
        tutorialEdits.clear();
        tutorialRowActions.clear();
        backendRetryRows.clear();
        scenarioOperations.clear();
        window.removeEventListener('amb-demo-language-change', syncPresentation);
        demo.table.off('renderComplete', syncPresentation);
        demo.table.off('scrollVertical', syncTutorialHighlight);
        demo.table.off('dataFiltered', syncTutorialHighlight);
        demo.table.off('cellEdited', handleBackendCorrection);
        demo.table.off('cellEdited', handleTutorialEdit);
        demo.table.off('cellEditing', handleTutorialEditStart);
        demo.table.off('cellEditCancelled', handleTutorialEditCancelled);
        crudUnsubscribers.forEach(unsubscribe => unsubscribe?.());
        reportDialog.destroy();
        partialSaveDialog.destroy();
        rowConfirmDialog.destroy();
        commandGuideToolbar.destroy();
        tutorial.destroy();
        originalDestroy();
    };

    function formatErrorCount(cell) {
        const data = cell.getRow().getData();
        return errorCounts.get(data.id ?? data._ambTempId) || 0;
    }

    function formatRecordId(cell) {
        const data = cell.getRow().getData();
        if (data.id !== null && data.id !== undefined && data.id !== '') return String(data.id);
        if (!data._ambTempId) return '';
        const indicator = document.createElement('span');
        const label = document.createElement('span');
        const identifier = document.createElement('code');
        indicator.className = 'demo-crud-temp-id';
        indicator.dataset.demoTempId = String(data._ambTempId);
        label.className = 'demo-crud-temp-id__label';
        label.textContent = t('temporaryId');
        identifier.textContent = String(data._ambTempId);
        indicator.append(label, identifier);
        return indicator;
    }

    function clearTutorialHighlight() {
        highlightedControl?.classList.remove('demo-crud-tutorial-target');
        highlightedControl = null;
    }

    function syncTutorialHighlight() {
        clearTutorialHighlight();
        if (!demo || destroyed || resettingScenario || preparingStates || !tutorialState
            || tutorialState.hidden || tutorialState.complete || tutorialState.resetting || tutorialState.restartFailed || tutorialState.destroyed) return;
        const { stepId, actionIndex } = tutorialState;
        let target = null;
        let recordId = null;
        let field = null;
        let rowAction = null;
        let toolbarAction = null;
        if (stepId === 'edit-record' || (stepId === 'backend-error' || stepId === 'correct-save') && actionIndex === 0) {
            recordId = 'REC-001';
            field = 'type';
        } else if (stepId === 'add-record') toolbarAction = 'add';
        else if (stepId === 'delete-record') { recordId = 'REC-003'; rowAction = 'delete'; }
        else if (stepId === 'frontend-report' && actionIndex === 0) { recordId = 'REC-004'; field = 'description'; }
        else if (stepId === 'frontend-report') toolbarAction = 'state-report';
        else if (stepId === 'rollback-record') { recordId = 'REC-004'; rowAction = 'rollback'; }
        else if (stepId === 'partial-save' && actionIndex === 1 && partialSaveDialog.resolveCurrent) target = partialSaveDialog.confirmButton;
        else if (stepId === 'partial-save' || stepId === 'backend-error' || stepId === 'correct-save') toolbarAction = 'save';
        if (recordId) {
            const row = demo.table.getRows().find(item => item.getData().id === recordId);
            target = field ? row?.getCell(field)?.getElement() : row?.getElement().querySelector(`[data-action="${rowAction}"]`);
        } else if (toolbarAction) target = app.querySelector(`[data-action="${toolbarAction}"]`);
        if (target?.isConnected && target.getClientRects().length > 0) {
            target.classList.add('demo-crud-tutorial-target');
            highlightedControl = target;
        }
    }

    function trackScenarioOperation(operation) {
        const pending = Promise.resolve(operation);
        scenarioOperations.add(pending);
        pending.then(() => scenarioOperations.delete(pending), () => scenarioOperations.delete(pending));
        return pending;
    }

    function isCurrentScenario(generation) {
        return !destroyed && !resettingScenario && generation === scenarioGeneration;
    }

    function hasTutorialFrontendError(report) {
        return report.rows.some(row => row.id === 'REC-004' && row.state === 'modified' && row.after.description === ''
            && row.cellErrors.some(error => error.field === 'description')) && errorCounts.get('REC-004') > 0;
    }

    function hasTutorialPartialScenario(report) {
        return hasTutorialFrontendError(report)
            && report.rows.some(row => row.id === 'REC-001' && row.state === 'modified' && row.after.type === 'Procedure' && !row.hasErrors)
            && report.rows.some(row => row.tempId === tutorialNewTempId && row.state === 'new' && !row.hasErrors)
            && report.rows.some(row => row.id === 'REC-003' && row.state === 'deleted');
    }

    async function handleConfirmRowAction({ action, id }) {
        if (resettingScenario || destroyed) return false;
        const generation = scenarioGeneration;
        reportDialog.close();
        const context = preparingStates ? null : tutorial.capture();
        const previous = crud.getStateReport().rows.find(row => row.key === id);
        const confirmed = await trackScenarioOperation(rowConfirmDialog.confirm({ title: t('confirmTitle'), message: t(`confirm.${action}`), confirmText: t('confirm'), cancelText: t('cancel') }));
        if (!isCurrentScenario(generation)) return false;
        if (confirmed && !destroyed && action === 'rollback') backendRetryRows.delete(id);
        if (confirmed && !destroyed && context) tutorialRowActions.set(id, { action, context, previous });
        return confirmed;
    }

    function handleTutorialRowState({ id, key, nextState }) {
        const generation = scenarioGeneration;
        const candidate = tutorialRowActions.get(key);
        if (!candidate || preparingStates || destroyed || resettingScenario) return;
        if (candidate.action !== 'delete' && candidate.action !== 'rollback') return;
        if (nextState !== (candidate.action === 'delete' ? 'deleted' : 'clean')) return;
        tutorialRowActions.delete(key);
        if (candidate.action === 'rollback') backendRetryRows.delete(key);
        globalThis.queueMicrotask(() => {
            if (!isCurrentScenario(generation) || preparingStates) return;
            refreshErrorCounts();
            tutorial.notify('row-action', { id, action: candidate.action, previous: candidate.previous, report: crud.getStateReport() }, candidate.context);
        });
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
        if (resettingScenario || destroyed) return;
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

    function handleTutorialEditStart(cell) {
        const data = cell.getRow().getData();
        const context = preparingStates || resettingScenario ? null : tutorial.capture();
        if (context) tutorialEdits.set(`${data.id}:${cell.getField()}`, { context, previous: cell.getValue() });
    }

    function handleTutorialEditCancelled(cell) {
        tutorialEdits.delete(`${cell.getRow().getData().id}:${cell.getField()}`);
    }

    function handleTutorialEdit(cell) {
        const data = cell.getRow().getData();
        const key = `${data.id}:${cell.getField()}`;
        const candidate = tutorialEdits.get(key);
        tutorialEdits.delete(key);
        if (!candidate || preparingStates || destroyed || resettingScenario) return;
        refreshErrorCounts();
        tutorial.notify('cell-edited', {
            id: data.id,
            field: cell.getField(),
            previous: candidate.previous,
            report: crud.getStateReport(),
            backendRejected: serverRejectedRows.has(data.id ?? data._ambTempId)
        }, candidate.context);
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
        demo.table.getRows().forEach(row => {
            const data = row.getData();
            const cell = row.getCell('id');
            const element = cell?.getElement();
            const signature = `${data.id ?? ''}:${data._ambTempId ?? ''}:${document.documentElement.lang}`;
            if (element && identifierSignatures.get(element) !== signature) {
                identifierSignatures.set(element, signature);
                cell.reformat();
                row.normalizeHeight();
            }
        });
        syncTutorialHighlight();
    }

    function runAfterEditSettled(callback) {
        const generation = scenarioGeneration;
        if (document.activeElement?.closest?.('#crud-row-states-table .tabulator-editing')) document.activeElement.blur();
        return trackScenarioOperation(new Promise(resolve => globalThis.setTimeout(() => resolve(isCurrentScenario(generation) ? callback() : undefined), 0)));
    }

    async function handleAdd() {
        if (resettingScenario || destroyed) return;
        const generation = scenarioGeneration;
        const context = preparingStates ? null : tutorial.capture();
        reportDialog.close();
        demo.feedback.clear();
        const added = await trackScenarioOperation(crud.addRow({ id: null, description: 'New vendor risk assessment', type: 'Request', department: 'Operations', tag: 'vendor', archived: 'N' }));
        if (isCurrentScenario(generation) && !preparingStates && added) {
            const row = crud.getStateReport().rows.find(item => item.tempId === added.getData()._ambTempId);
            if (tutorial.notify('row-added', { row }, context)) tutorialNewTempId = row.tempId;
        }
        return added;
    }

    function handleSave() {
        if (resettingScenario || destroyed) return;
        const generation = scenarioGeneration;
        reportDialog.close();
        const context = tutorial.capture();
        return runAfterEditSettled(() => saveChangedRows(context, generation));
    }

    // A corrected backend rejection is resubmitted on Save even when it matches the saved baseline.
    async function saveChangedRows(context, generation) {
        if (!isCurrentScenario(generation)) return;
        demo.feedback.clear();
        const validateResult = demo.validateChanges();
        const payload = demo.getSavePayload({ savePolicy: 'valid-only', includeInvalid: true });
        const retries = crud.getStateReport().rows.filter(row => backendRetryRows.has(row.key) && row.state === 'clean' && !row.hasErrors);
        if (!payload.hasChanges && !retries.length) return demo.feedback.show({ type: 'info', message: t('noChanges') });
        if (!payload.hasValidChanges && !retries.length) return demo.feedback.show({ type: 'warning', message: t('noValidChanges') });
        let partialConfirmed = false;
        if (payload.hasInvalidChanges && payload.isPartialSave) {
            const invalidRows = validateResult.rows.filter(row => !row.isValid).map(row => `${t('row')} ${row.rowNumber}: ${row.errors.map(error => error.field).join(', ')}`);
            const confirmation = partialSaveDialog.confirm({ title: t('partialTitle'), message: [t('partialMessage'), ...invalidRows].join('\n'), confirmText: t('saveValid'), cancelText: t('cancel') });
            refreshErrorCounts();
            if (tutorial.notify('partial-save-opened', { opened: Boolean(partialSaveDialog.resolveCurrent), report: crud.getStateReport() }, context)) context = tutorial.capture();
            syncTutorialHighlight();
            const confirmed = await confirmation;
            if (!isCurrentScenario(generation)) return;
            syncTutorialHighlight();
            if (!confirmed || destroyed) return destroyed ? undefined : demo.feedback.show({ type: 'info', message: t('cancelled') });
            partialConfirmed = true;
        }
        let report = crud.getStateReport();
        const before = new Map(report.validChangedRows.map(row => [row.key, row.state]));
        const rejected = report.validChangedRows.filter(row => row.after.type === 'Restricted' && row.after.department !== 'Compliance');
        rejected.forEach(row => {
            const message = t('backendRejected', { id: row.id ?? row.tempId ?? row.key });
            serverRejectedRows.set(row.key, message);
            backendRetryRows.add(row.key);
            crud.markCellError(row.key, 'type', message);
        });
        report = crud.getStateReport();
        const generatedIds = report.validChangedRows.filter(row => row.state === 'new' && !row.id && row.tempId).map(row => ({ tempId: row.tempId, id: `REC-${String(nextId++).padStart(3, '0')}` }));
        crud.applyBackendIds(generatedIds);
        const result = crud.markValidChangesSaved();
        for (const retry of retries) {
            const validation = crud.validateRow(retry.key);
            const row = demo.table.getRow(retry.id);
            if (!validation?.isValid || !row || row.getData().type === 'Restricted' && row.getData().department !== 'Compliance') continue;
            await row.update({ [crud.options.stateField]: 'saved' });
            if (!isCurrentScenario(generation)) return;
            row.getElement().dataset.state = 'saved';
            result.saved.push({ key: retry.key, id: retry.id, tempId: retry.tempId, state: retry.state });
        }
        result.saved.forEach(row => backendRetryRows.delete(row.key));
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
        const feedbackType = rejected.length ? 'error' : invalid ? 'warning' : 'success';
        demo.feedback.show({ type: feedbackType, message: parts.join(' ') });
        tutorial.notify('save', {
            report: crud.getStateReport(), saved: result.saved, rejectedIds: rejected.map(row => row.id),
            feedbackShown: true, feedbackType, generatedIds, partialConfirmed
        }, context);
    }

    function resetToCleanBaseline() {
        const generation = ++scenarioGeneration;
        resettingScenario = true;
        preparingStates = false;
        clearTutorialHighlight();
        tutorialEdits.clear();
        tutorialRowActions.clear();
        demo.table.cancelEdit?.();
        reportDialog.close();
        partialSaveDialog.destroy();
        rowConfirmDialog.destroy();
        demo.feedback.clear();
        const pending = [...scenarioOperations];
        baselineReset = baselineReset.catch(() => {}).then(async () => {
            await Promise.allSettled(pending);
            if (destroyed || generation !== scenarioGeneration) return false;
            nextId = 10;
            errorCounts.clear();
            serverRejectedRows.clear();
            backendRetryRows.clear();
            tutorialNewTempId = null;
            demo.clearSearch();
            demo.clearFilter();
            await demo.setData(initialData.map(row => ({ ...row })));
            if (destroyed || generation !== scenarioGeneration) return false;
            resettingScenario = false;
            syncPresentation();
            return true;
        });
        return baselineReset;
    }

    async function handlePrepareStates() {
        if (!await resetToCleanBaseline()) return;
        const generation = scenarioGeneration;
        preparingStates = true;
        try {
            await trackScenarioOperation(demo.updateRow('REC-005', { tag: 'review' }));
            if (!isCurrentScenario(generation)) return;
            await trackScenarioOperation(demo.deleteRow('REC-003'));
            if (!isCurrentScenario(generation)) return;
            await handleAdd();
        } finally {
            if (generation === scenarioGeneration) preparingStates = false;
        }
        if (!isCurrentScenario(generation)) return;
        syncPresentation();
        demo.feedback.show({ type: 'info', message: t('prepared') });
    }

    async function handleReload() {
        if (await resetToCleanBaseline()) demo.feedback.show({ type: 'success', message: t('reloaded') });
    }

    function handleShowReport() {
        if (resettingScenario || destroyed) return;
        const context = tutorial.capture();
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
            tutorial.notify('open-report', { opened: true, report }, context);
        });
    }

    function handleShowPayload() {
        if (resettingScenario || destroyed) return;
        return runAfterEditSettled(() => {
            const payload = demo.getSavePayload({ savePolicy: 'valid-only', includeInvalid: true });
            reportDialog.open({ title: t('payloadTitle'), reportLines: ['inserted', 'updated', 'deleted'].map(key => `${key}: ${payload.changes[key].length}`), jsonData: payload, apiMethods: ['getSavePayload'] });
        });
    }

    return demo;
}
