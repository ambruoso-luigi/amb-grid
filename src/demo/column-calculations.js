import { AMB } from '../index.js';
import { countPrintProducts } from './utils/demo-calculations.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';
import { createDemoCommandGuideToolbar } from './utils/demo-command-guide-toolbar.js';
import { createDemoActionTutorial } from './components/demo-action-tutorial.js';
import { demoIcon } from './demo-icons.js';
import { publicExampleTranslations } from './example-copy.js';

const formatAveragePrice = value => Number(value).toFixed(2);
const calculationData = [
    { id: 1001, product: 'Barcode printer', category: 'Hardware', quantity: 8, unitPrice: 84.5, deliveryDays: 3, score: 88 },
    { id: 1002, product: 'Label printer', category: 'Hardware', quantity: 5, unitPrice: 219.9, deliveryDays: 5, score: 92 },
    { id: 1003, product: 'Shipping labels', category: 'Supplies', quantity: 40, unitPrice: 12.75, deliveryDays: 2, score: 81 },
    { id: 1004, product: 'Storage bin', category: 'Warehouse', quantity: 24, unitPrice: 18.2, deliveryDays: 4, score: 85 },
    { id: 1005, product: 'Packing tape', category: 'Supplies', quantity: 36, unitPrice: 4.8, deliveryDays: 1, score: 79 },
    { id: 1006, product: 'Safety gloves', category: 'Safety', quantity: 18, unitPrice: 9.6, deliveryDays: 3, score: 95 },
    { id: 1007, product: 'Steel shelving', category: 'Warehouse', quantity: 6, unitPrice: 148, deliveryDays: 7, score: 90 },
    { id: 1008, product: 'Thermal printer', category: 'Hardware', quantity: 10, unitPrice: 300, deliveryDays: 4, score: 93 },
    { id: 1009, product: 'Bubble wrap', category: 'Supplies', quantity: 50, unitPrice: 20, deliveryDays: 2, score: 84 },
    { id: 1010, product: 'Print server', category: 'Warehouse', quantity: 3, unitPrice: 432.25, deliveryDays: 6, score: 91 }
];

export default function columnCalculations(app) {
    let nextProductId = 1011;

    app.innerHTML = `
        <div class="demo-crud-heading">
            <h2 data-i18n="examples.columnCalculations.title">Column calculations</h2>
            <div class="demo-crud-heading__commands">
                <button type="button" class="demo-crud-tutorial-launch" data-action="tutorial-launch" aria-controls="column-calculations-tutorial" aria-expanded="false">${demoIcon('tutorialPlay', { size: 21, strokeWidth: 2.6 })}<span>Start tutorial</span></button>
        ${createDemoColumnGuide({
            summary: 'Column Calculations technical guide',
            summaryKey: 'examples.columnCalculations.detailsTitle',
            summaryIcon: 'guideText', variant: 'technical',
            intro: 'AMB Grid displays aggregates directly in the calculation row. Each result uses values from its own column and updates automatically when data or row states change.',
            introKey: 'examples.columnCalculations.detailsText',
            points: [
                { title: 'Built-in and custom calculations', titleKey: 'examples.columnCalculations.point1Title', description: 'AMB Grid provides built-in aggregates and custom calculations.', descriptionKey: 'examples.columnCalculations.detail1' },
                { title: 'Live updates', titleKey: 'examples.columnCalculations.point2Title', description: 'Edit, add, delete, or undo and the corresponding aggregates follow the active rows.', descriptionKey: 'examples.columnCalculations.detail2' },
                { title: 'Custom PRINT calculation', titleKey: 'examples.columnCalculations.point3Title', description: 'PRINT counts product names containing print, regardless of case.', descriptionKey: 'examples.columnCalculations.detail3' },
                { title: 'Deleted rows and rollback', titleKey: 'examples.columnCalculations.point4Title', description: 'Deleted rows are excluded from aggregates until restored.', descriptionKey: 'examples.columnCalculations.detail4' },
                { title: 'Calculation row', titleKey: 'examples.columnCalculations.point5Title', description: 'Results appear directly above their columns.', descriptionKey: 'examples.columnCalculations.detail5' }
            ],
            columns: [
                { title: 'ID', titleKey: 'examples.columnCalculations.id', badge: 'COUNT', description: 'Counts active rows, excluding rows marked as deleted.', descriptionKey: 'examples.columnCalculations.idCalc' },
                { title: 'Product', titleKey: 'examples.columnCalculations.product', badge: 'PRINT', description: 'Custom function counting product names containing print, regardless of case.', descriptionKey: 'examples.columnCalculations.productCalc' },
                { title: 'Category', titleKey: 'examples.columnCalculations.category', badge: 'UNIQUE', description: 'Counts distinct categories among active rows.', descriptionKey: 'examples.columnCalculations.categoryCalc' },
                { title: 'Quantity', titleKey: 'examples.columnCalculations.quantity', badge: 'SUM', description: 'Adds quantities from active rows and updates after each edit.', descriptionKey: 'examples.columnCalculations.quantityCalc' },
                { title: 'Unit price', titleKey: 'examples.columnCalculations.unitPrice', badge: 'AVG', description: 'Calculates the average unit price across active rows.', descriptionKey: 'examples.columnCalculations.unitPriceCalc' },
                { title: 'Delivery days', titleKey: 'examples.columnCalculations.deliveryDays', badge: 'MIN', description: 'Returns the shortest delivery time among active rows.', descriptionKey: 'examples.columnCalculations.deliveryDaysCalc' },
                { title: 'Score', titleKey: 'examples.columnCalculations.score', badge: 'MAX', description: 'Returns the highest score among active rows.', descriptionKey: 'examples.columnCalculations.scoreCalc' }
            ]
        })}
            </div>
        </div>
        <p class="demo-note" data-i18n="examples.columnCalculations.intro" data-i18n-emphasis="examples.columnCalculations.introEmphasis">Column calculations shows built-in aggregates and custom calculations defined by the developer, updated directly in their respective columns when the data changes.</p>
        <div class="demo-action-tutorial-host"></div>
        <div class="demo-table-workbench">
            <div class="demo-command-guide-host"></div>
            <div id="column-calculations-table" class="demo-business-grid demo-business-grid--viewport demo-column-calculations-grid"></div>
        </div>
    `;

    let destroyed = false;
    let grid = null;
    let tutorialState = null;
    let tutorialStarted = false;
    let highlightedControl = null;
    let guidedDelete = null;
    let rowActionGlow = null;
    let scenarioGeneration = 0;
    const rowConfirmDialog = new AMB.ConfirmDialog();
    const t = key => publicExampleTranslations[document.documentElement.lang === 'en' ? 'en' : 'it'][`examples.columnCalculations.${key}`];
    const tutorialLaunch = app.querySelector('[data-action="tutorial-launch"]');
    const tutorialLaunchLabel = tutorialLaunch.querySelector('span');
    const technicalGuide = app.querySelector('.demo-crud-heading .demo-disclosure--technical');
    const editCandidates = new Map();
    const tutorial = createDemoActionTutorial({
        host: app.querySelector('.demo-action-tutorial-host'),
        variant: 'crud', tutorialCopyPrefix: 'examples.columnCalculations',
        initiallyHidden: true, externalOpenButton: tutorialLaunch, panelId: 'column-calculations-tutorial',
        locale: document.documentElement.lang === 'en' ? 'en' : 'it',
        titleKey: 'examples.columnCalculations.tutorialTitle',
        completedKey: 'examples.columnCalculations.tutorialCompleted',
        onRestart: resetTutorialScenario,
        onCompleteAction: resetTutorialScenario,
        onCompleteSuccess: finishTutorial,
        onStateChange: state => {
            tutorialState = state;
            if (state.hidden || state.complete || state.resetting || state.destroyed) {
                editCandidates.clear();
                guidedDelete = null;
            }
            tutorialLaunch.hidden = !state.hidden;
            tutorialLaunch.setAttribute('aria-expanded', String(!state.hidden));
            tutorialLaunchLabel.textContent = t(tutorialStarted ? 'tutorialResume' : 'tutorialStart');
            syncTutorialHighlight();
        },
        steps: [
            {
                id: 'update-sum', actionId: 'quantity-edited', instructionKey: 'examples.columnCalculations.tutorialSum',
                isComplete: ({ id, field, previous, value, before, after, row }) => id === 1001 && field === 'quantity'
                    && Number.isInteger(value) && previous !== value && Number.isFinite(before) && after === before + (value - previous)
                    && row?.after?.quantity === value && row.state === 'modified' && !row.hasErrors
            },
            {
                id: 'update-print', actionId: 'product-edited', instructionKey: 'examples.columnCalculations.tutorialPrint',
                isComplete: ({ id, field, previous, value, before, after, row }) => id === 1004 && field === 'product'
                    && previous !== value && countPrintProducts([previous]) === 0 && countPrintProducts([value]) === 1
                    && Number.isFinite(before) && after === before + 1
                    && row?.after?.product === value && row.state === 'modified' && !row.hasErrors
            },
            {
                id: 'delete-product', actionId: 'product-deleted', instructionKey: 'examples.columnCalculations.tutorialCount',
                isComplete: ({ valid }) => valid
            }
        ]
    });
    const commandGuideToolbar = createDemoCommandGuideToolbar(app);
    grid = AMB.table({
        selector: '#column-calculations-table',
        rowActionColumn: {
            enabled: true,
            confirmDeleteMessage: 'Delete this product?',
            confirmRollbackMessage: 'Rollback this product?',
            confirmRemoveNewMessage: 'Remove this new product?',
            confirmProvider: handleRowConfirmation
        },
        toolbar: {
            buttons: ['add', commandGuideToolbar.button],
            onAdd: handleAdd
        },
        data: calculationData.map(row => ({ ...row })),
        layout: 'fitColumns',
        columns: [
            {
                title: 'ID', field: 'id', minWidth: 70, widthGrow: 0.45,
                cssClass: 'demo-cell--passive',
                topCalc: 'count',
                topCalcFormatter: AMB.formatters.calculation({ label: 'COUNT', className: 'demo-calculation-summary demo-calculation-summary--count' })
            },
            {
                title: 'Product', field: 'product', minWidth: 150, widthGrow: 1.5,
                editor: AMB.editors.text({ trim: true }),
                topCalc: countPrintProducts,
                topCalcFormatter: AMB.formatters.calculation({ label: 'PRINT', className: 'demo-calculation-summary demo-calculation-summary--print' })
            },
            {
                title: 'Category', field: 'category', minWidth: 115, widthGrow: 1,
                editor: AMB.editors.text({ trim: true }),
                topCalc: 'unique',
                topCalcFormatter: AMB.formatters.calculation({ label: 'UNIQUE', className: 'demo-calculation-summary demo-calculation-summary--count' })
            },
            {
                title: 'Quantity', field: 'quantity', minWidth: 100, widthGrow: 0.75,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                topCalc: 'sum',
                topCalcFormatter: AMB.formatters.calculation({ label: 'SUM', className: 'demo-calculation-summary demo-calculation-summary--numeric' })
            },
            {
                title: 'Unit price', field: 'unitPrice', minWidth: 110, widthGrow: 0.85,
                editor: AMB.editors.decimal({ integerDigits: 7, decimalDigits: 2, allowEmpty: false }),
                formatter: AMB.formatters.decimal(2),
                topCalc: 'avg',
                topCalcParams: { precision: false },
                topCalcFormatter: AMB.formatters.calculation({ label: 'AVG', className: 'demo-calculation-summary demo-calculation-summary--numeric', formatValue: formatAveragePrice })
            },
            {
                title: 'Delivery days', field: 'deliveryDays', minWidth: 115, widthGrow: 0.8,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                topCalc: 'min',
                topCalcFormatter: AMB.formatters.calculation({ label: 'MIN', className: 'demo-calculation-summary demo-calculation-summary--range' })
            },
            {
                title: 'Score', field: 'score', minWidth: 88, widthGrow: 0.6,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                topCalc: 'max',
                topCalcFormatter: AMB.formatters.calculation({ label: 'MAX', className: 'demo-calculation-summary demo-calculation-summary--range' })
            }
        ]
    });
    commandGuideToolbar.mount();
    tutorialLaunch.addEventListener('click', handleTutorialLaunch);
    window.addEventListener('amb-demo-language-change', syncTutorialLaunchLabel);
    window.addEventListener('resize', syncTutorialHighlight);
    window.addEventListener('scroll', syncTutorialHighlight, true);
    grid.table.on('renderComplete', handleCalculationUpdate);
    grid.table.on('dataChanged', handleCalculationUpdate);
    grid.table.on('rowUpdated', handleCalculationUpdate);
    grid.table.on('scrollVertical', syncTutorialHighlight);
    grid.table.on('scrollHorizontal', syncTutorialHighlight);
    syncTutorialHighlight();

    const editKey = cell => `${cell.getRow().getData().id}:${cell.getField()}`;
    const handleEditStart = cell => {
        const context = tutorial.capture();
        const id = cell.getRow().getData().id;
        const field = cell.getField();
        const expected = context?.stepId === 'update-sum' && id === 1001 && field === 'quantity'
            || context?.stepId === 'update-print' && id === 1004 && field === 'product';
        if (!expected) return;
        editCandidates.set(editKey(cell), {
            context, id, field, previous: cell.getValue(),
            before: Number(grid.getCalcResults().top?.[field])
        });
    };
    const handleEditCancelled = cell => editCandidates.delete(editKey(cell));
    const handleEditConfirmed = cell => {
        const key = editKey(cell);
        const candidate = editCandidates.get(key);
        if (destroyed || !candidate) return;
        candidate.value = cell.getValue();
        candidate.confirmed = true;
        checkCandidates();
    };
    grid.table.on('cellEditing', handleEditStart);
    grid.table.on('cellEditCancelled', handleEditCancelled);
    grid.table.on('cellEdited', handleEditConfirmed);
    const unsubscribeRowState = grid.onCrud('row-state-changed', ({ key, nextState }) => {
        if (guidedDelete && guidedDelete.key === key && nextState === 'deleted') {
            guidedDelete.stateChanged = true;
        }
        const generation = scenarioGeneration;
        queueMicrotask(() => {
            if (!destroyed && generation === scenarioGeneration) checkCandidates();
        });
    });

    function checkCandidates() {
        if (destroyed) return;
        const report = grid.getStateReport();
        const after = grid.getCalcResults().top || {};
        for (const [key, candidate] of editCandidates) {
            if (!candidate.confirmed) continue;
            const row = report.rows.find(item => item.id === candidate.id);
            if (tutorial.notify(candidate.field === 'quantity' ? 'quantity-edited' : 'product-edited', {
                ...candidate, after: Number(after[candidate.field]), row
            }, candidate.context)) editCandidates.delete(key);
        }
        const candidate = guidedDelete;
        if (!candidate?.accepted || !candidate.stateChanged) return;
        const row = report.rows.find(item => item.key === candidate.key && item.id === 1006);
        const active = report.rows.filter(item => item.state !== 'deleted').map(item => item.after);
        const before = candidate.before;
        const close = (actual, expected) => Number.isFinite(Number(actual))
            && Math.abs(Number(actual) - expected) < 1e-8;
        const expectedAvg = active.reduce((sum, item) => sum + Number(item.unitPrice), 0) / active.length;
        const valid = row?.state === 'deleted' && active.length > 0
            && close(after.id, Number(before.id) - 1)
            && close(after.category, Number(before.category) - 1)
            && close(after.quantity, Number(before.quantity) - Number(candidate.row.quantity))
            && close(after.score, Math.max(...active.map(item => Number(item.score))))
            && close(after.unitPrice, expectedAvg)
            && close(after.deliveryDays, Math.min(...active.map(item => Number(item.deliveryDays))))
            && close(after.product, countPrintProducts(active.map(item => item.product)));
        if (tutorial.notify('product-deleted', { valid }, candidate.context)) guidedDelete = null;
    }

    function handleCalculationUpdate() {
        checkCandidates();
        syncTutorialHighlight();
    }

    async function handleRowConfirmation({ action, id, message }) {
        if (destroyed) return false;
        const generation = scenarioGeneration;
        const context = tutorial.capture();
        const row = grid.getStateReport().rows.find(item => item.key === id);
        const isDelete = action === 'delete' && row && row.state !== 'new';
        const isRollback = action === 'rollback' && row;
        const element = rowConfirmDialog.element;
        const panel = rowConfirmDialog.panelElement;
        const oldHeader = panel?.querySelector('.demo-crud-row-confirm-dialog__header');
        element?.classList.remove('demo-crud-row-confirm-dialog--delete', 'demo-crud-row-confirm-dialog--rollback');
        if (oldHeader) {
            panel.prepend(rowConfirmDialog.titleElement);
            oldHeader.remove();
        }
        const title = isDelete ? t('deleteTitle') : t('rollbackTitle');
        const confirmation = rowConfirmDialog.confirm({
            title: isDelete || isRollback ? title.replace('{id}', String(row.id ?? row.key)) : message,
            message: isDelete ? t('deleteMessage') : isRollback ? t('rollbackMessage') : message,
            confirmText: isDelete ? t('deleteConfirm') : isRollback ? t('rollbackConfirm') : t('removeConfirm'),
            cancelText: isDelete ? t('deleteCancel') : isRollback ? t('rollbackCancel') : t('removeCancel')
        });
        const { element: dialog, panelElement, titleElement, confirmButton } = rowConfirmDialog;
        dialog.classList.add('demo-crud-row-confirm-dialog');
        if (isDelete || isRollback) {
            dialog.classList.add(isDelete ? 'demo-crud-row-confirm-dialog--delete' : 'demo-crud-row-confirm-dialog--rollback');
            const header = document.createElement('div');
            const badge = document.createElement('span');
            header.className = 'demo-crud-row-confirm-dialog__header';
            badge.className = 'demo-crud-row-confirm-dialog__badge';
            badge.setAttribute('aria-hidden', 'true');
            const icon = isDelete ? 'delete' : 'undo2';
            badge.innerHTML = demoIcon(icon, { size: 22, strokeWidth: 2.2 });
            header.append(badge, titleElement);
            panelElement.prepend(header);
            confirmButton.insertAdjacentHTML('afterbegin', demoIcon(icon, { size: 18, strokeWidth: 2.2 }));
        }
        const candidate = isDelete && row.id === 1006 && context?.stepId === 'delete-product'
            && rowConfirmDialog.resolveCurrent ? {
                context, key: row.key, row: { ...row.after }, before: { ...grid.getCalcResults().top },
                resolver: rowConfirmDialog.resolveCurrent, accepted: false, stateChanged: false
            } : null;
        if (candidate) {
            guidedDelete = candidate;
            syncTutorialHighlight();
        }
        const confirmed = await confirmation;
        if (destroyed || generation !== scenarioGeneration) return false;
        if (candidate && guidedDelete === candidate) {
            if (confirmed) candidate.accepted = true;
            else guidedDelete = null;
            syncTutorialHighlight();
            if (!confirmed) requestAnimationFrame(() => {
                if (!destroyed && generation === scenarioGeneration) syncTutorialHighlight();
            });
        }
        return confirmed;
    }

    async function handleAdd() {
        const id = nextProductId++;
        grid.feedback.clear();

        const added = await grid.crud.addRow({
            id,
            product: 'New product',
            category: 'New category',
            quantity: 0,
            unitPrice: 0,
            deliveryDays: 0,
            score: 0
        });
        return added;
    }

    function syncTutorialLaunchLabel() {
        tutorialLaunchLabel.textContent = t(tutorialStarted ? 'tutorialResume' : 'tutorialStart');
    }

    function handleTutorialLaunch() {
        if (destroyed || !tutorialState?.hidden) return;
        tutorialLaunch.setAttribute('data-demo-crud-rays-consumed', '');
        const resuming = tutorialStarted;
        tutorialStarted = true;
        if (resuming) tutorial.reopen();
        else void tutorial.restart();
    }

    function finishTutorial({ openGuide }) {
        tutorialStarted = false;
        syncTutorialLaunchLabel();
        if (openGuide) {
            technicalGuide.open = true;
            technicalGuide.querySelector('summary').focus({ preventScroll: true });
        } else tutorialLaunch.focus({ preventScroll: true });
    }

    function clearTutorialHighlight() {
        highlightedControl?.classList.remove('demo-crud-tutorial-target', 'demo-crud-tutorial-target--pulse', 'demo-crud-tutorial-target--rays');
        highlightedControl = null;
        rowActionGlow?.remove();
        rowActionGlow = null;
    }

    function syncTutorialHighlight() {
        if (!grid || destroyed || !tutorialState || tutorialState.hidden || tutorialState.complete || tutorialState.resetting || tutorialState.restartFailed || tutorialState.destroyed) {
            clearTutorialHighlight();
            return;
        }
        const step = tutorialState.stepId;
        const target = step === 'delete-product'
            ? guidedDelete?.accepted ? null : guidedDelete?.resolver === rowConfirmDialog.resolveCurrent && guidedDelete?.resolver
                ? rowConfirmDialog.confirmButton : grid.table.getRow(1006)?.getElement().querySelector('[data-action="delete"]')
            : grid.table.getRow(step === 'update-sum' ? 1001 : 1004)
                ?.getCell(step === 'update-sum' ? 'quantity' : 'product')?.getElement();
        const rays = step === 'delete-product';
        if (target?.isConnected && target.getClientRects().length > 0 && !target.matches(':disabled')) {
            if (highlightedControl !== target || !target.classList.contains('demo-crud-tutorial-target--pulse')) {
                clearTutorialHighlight();
                target.classList.add('demo-crud-tutorial-target', 'demo-crud-tutorial-target--pulse');
                if (rays) target.classList.add('demo-crud-tutorial-target--rays');
                highlightedControl = target;
            }
            if (target.matches('.amb-row-action-button')) {
                if (!rowActionGlow) {
                    rowActionGlow = document.createElement('div');
                    rowActionGlow.className = 'demo-crud-row-action-glow demo-crud-row-action-glow--pulse demo-crud-row-action-glow--rays';
                    rowActionGlow.setAttribute('aria-hidden', 'true');
                    document.body.append(rowActionGlow);
                }
                const rect = target.getBoundingClientRect();
                const bounds = target.closest('.tabulator-tableholder')?.getBoundingClientRect();
                rowActionGlow.hidden = !bounds || rect.left < bounds.left || rect.right > bounds.right
                    || rect.top < bounds.top || rect.bottom > bounds.bottom;
                Object.assign(rowActionGlow.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
            }
        } else clearTutorialHighlight();
    }

    async function resetTutorialScenario() {
        if (destroyed) return false;
        scenarioGeneration += 1;
        try {
            editCandidates.clear();
            guidedDelete = null;
            clearTutorialHighlight();
            rowConfirmDialog.destroy();
            grid.table.cancelEdit?.();
            nextProductId = 1011;
            await grid.setData(calculationData.map(row => ({ ...row })));
            syncTutorialHighlight();
            return !destroyed;
        } catch { return false; }
    }

    return {
        destroy() {
            destroyed = true;
            scenarioGeneration += 1;
            clearTutorialHighlight();
            editCandidates.clear();
            guidedDelete = null;
            tutorialLaunch.removeEventListener('click', handleTutorialLaunch);
            window.removeEventListener('amb-demo-language-change', syncTutorialLaunchLabel);
            window.removeEventListener('resize', syncTutorialHighlight);
            window.removeEventListener('scroll', syncTutorialHighlight, true);
            grid.table.off('renderComplete', handleCalculationUpdate);
            grid.table.off('dataChanged', handleCalculationUpdate);
            grid.table.off('rowUpdated', handleCalculationUpdate);
            grid.table.off('scrollVertical', syncTutorialHighlight);
            grid.table.off('scrollHorizontal', syncTutorialHighlight);
            grid.table.off('cellEditing', handleEditStart);
            grid.table.off('cellEditCancelled', handleEditCancelled);
            grid.table.off('cellEdited', handleEditConfirmed);
            unsubscribeRowState?.();
            rowConfirmDialog.destroy();
            commandGuideToolbar.destroy();
            tutorial.destroy();
            grid.destroy();
        }
    };
}
