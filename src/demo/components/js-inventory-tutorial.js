import { createDemoActionTutorial } from './demo-action-tutorial.js';
import { publicExampleTranslations } from '../example-copy.js';

const prefix = 'examples.javascriptInventory';
const action = (actionId, instruction, isComplete) => ({ actionId, instructionKey: `${prefix}.${instruction}`, isComplete });
const changed = p => p.before !== p.after && p.committed === true;

export const inventoryTutorialSteps = [
    { id: 'arrows', actions: [action('move', 'arrows', p => p.from && p.to && p.from !== p.to)] },
    { id: 'enter', actions: [action('edit', 'enter', p => p.openedBy === 'Enter' && changed(p) && p.changedRow)] },
    { id: 'tab', actions: [
        action('tab-forward', 'tabForward', p => p.from === 'stockQuantity' && p.to === 'unitPrice' && p.editing && p.committed && p.changed),
        action('tab-backward', 'tabBackward', p => p.from === 'unitPrice' && p.to === 'stockQuantity' && p.editing)
    ] },
    { id: 'escape', actions: [
        action('temporary', 'escapePrepare', p => p.openedBy === 'Enter' && p.text && p.temporary !== String(p.before ?? '')),
        action('cancel', 'escapeCancel', p => p.temporary !== String(p.before ?? '') && p.after === p.before && p.closed)
    ] },
    { id: 'direct-lookup', actions: [action('direct', 'direct', p => p.typed && !p.dialog && p.valid && changed(p))] },
    { id: 'dialog-lookup', actions: [
        action('dialog-open', 'dialogOpen', p => p.opened && p.key === 'F2'),
        action('dialog-search', 'dialogSearch', p => p.searched),
        action('dialog-select', 'dialogSelect', p => p.selected && p.applied && p.valid)
    ] },
    { id: 'mouse', actions: [action('mouse-edit', 'mouse', p => p.openedBy === 'mouse' && changed(p) && p.changedRow)] },
    { id: 'add', actions: [action('added', 'add', p => p.present && p.state === 'new' && /^PRD-[A-Z0-9]{4}$/.test(p.code))] },
    { id: 'partial-save', actions: [
        action('partial-open', 'partialOpen', p => p.opened && p.valid && p.invalid),
        action('partial-saved', 'partialConfirm', p => p.confirmed && p.ok && p.saved > 0 && p.pendingInvalid > 0)
    ] }
];

export function createInventoryTutorial({ host, launch, app, demo, statusDialog, statusOptions, technicalGuide, locale, resetData, hasPendingChanges, confirmStart, onResetError }) {
    let active = null;
    let intent = null;
    let move = null;
    let dialogCandidate = null;
    let started = false;
    let state = null;
    let resetting = false;
    let destroyed = false;
    let completing = false;
    let skipCloseReset = false;
    const label = launch.querySelector('span');
    const translate = key => publicExampleTranslations[document.documentElement.lang === 'en' ? 'en' : 'it'][`${prefix}.${key}`];
    const originalOpen = statusDialog.open;
    const notify = (id, payload, context = tutorial.capture()) => tutorial.notify(id, payload, context);
    const note = document.createElement('p');
    note.className = 'demo-main-tutorial-note';
    note.hidden = true;
    const clearTracking = () => { active = null; intent = null; move = null; dialogCandidate = null; };
    const runReset = async () => {
        if (resetting || destroyed) return false;
        resetting = true;
        launch.disabled = true;
        launch.setAttribute('aria-busy', 'true');
        label.textContent = translate('tutorialRestoring');
        clearTracking();
        try {
            return await resetData() !== false;
        } catch {
            return false;
        } finally {
            resetting = false;
            launch.disabled = false;
            launch.setAttribute('aria-busy', 'false');
            label.textContent = translate(started ? 'tutorialResume' : 'tutorialStart');
        }
    };
    const tutorial = createDemoActionTutorial({
        host, variant: 'crud', initiallyHidden: true, externalOpenButton: launch,
        panelId: 'javascript-inventory-tutorial', locale,
        titleKey: `${prefix}.tutorialTitle`, completedKey: `${prefix}.tutorialCompleted`, tutorialCopyPrefix: prefix,
        steps: inventoryTutorialSteps,
        onRestart: runReset,
        onCompleteAction: async () => {
            completing = true;
            const success = await runReset();
            completing = false;
            if (success) skipCloseReset = true;
            return success;
        },
        onCompleteSuccess: ({ openGuide }) => {
            started = false;
            label.textContent = translate('tutorialStart');
            if (openGuide && technicalGuide) { technicalGuide.open = true; technicalGuide.querySelector('summary')?.focus(); }
            else launch.focus();
        },
        onStateChange: next => {
            const wasOpen = state && !state.hidden;
            state = next;
            launch.hidden = !next.hidden;
            launch.setAttribute('aria-expanded', String(!next.hidden));
            label.textContent = translate(started ? 'tutorialResume' : 'tutorialStart');
            note.hidden = next.hidden;
            note.textContent = translate('tutorialResetNote');
            const closeButton = host.querySelector('[data-tutorial-action="skip"]');
            if (closeButton) closeButton.disabled = next.resetting || next.destroyed;
            if (wasOpen && next.hidden && !next.destroyed && !completing) {
                if (skipCloseReset) { skipCloseReset = false; return; }
                void runReset().then(success => {
                    if (destroyed) return;
                    if (success) {
                        started = false;
                        label.textContent = translate('tutorialStart');
                        launch.focus({ preventScroll: true });
                    } else {
                        tutorial.reopen();
                        onResetError?.();
                    }
                });
            }
        }
    });
    (host.querySelector('.demo-action-tutorial__bar') || host).append(note);
    const root = app.querySelector('#inventory-table');
    const cellOf = target => target?.closest?.('.tabulator-cell');
    let starting = false;
    const onLaunch = async () => {
        if (resetting || starting || destroyed) return;
        starting = true;
        launch.disabled = true;
        try {
            if (hasPendingChanges() && !await confirmStart()) return;
            if (destroyed) return;
            started = true;
            await tutorial.restart();
        } finally {
            starting = false;
            if (!resetting) launch.disabled = false;
        }
    };
    const onLanguage = () => { label.textContent = translate(started ? 'tutorialResume' : 'tutorialStart'); note.textContent = translate('tutorialResetNote'); };
    const onPointer = event => {
        move = null;
        const cell = cellOf(event.target);
        if (cell && root.contains(cell)) intent = { kind: 'mouse', cell, context: tutorial.capture() };
    };
    const onKey = event => {
        const cell = cellOf(event.target);
        const context = tutorial.capture();
        if (!context) return;
        if (!event.key.startsWith('Arrow') && event.key !== 'Tab') move = null;
        if (cell && root.contains(cell)) {
            if (event.key.startsWith('Arrow') && !cell.classList.contains('tabulator-editing')) move = { from: cell, context };
            if (event.key === 'Enter' && !cell.classList.contains('tabulator-editing')) intent = { kind: 'Enter', cell, context };
            if (active && cell === active.cell.getElement()) {
                if (event.key === 'Enter') active.confirmed = true;
                if (event.key === 'Escape') active.cancelled = true;
                if (event.key === 'F2') active.f2 = true;
                if (event.key === 'Tab') move = { from: cell, field: active.cell.getField(), before: active.before, context, tab: event.shiftKey ? 'tab-backward' : 'tab-forward' };
            }
        }
    };
    const onFocus = event => {
        const cell = cellOf(event.target);
        if (!move || !cell || !root.contains(cell) || cell === move.from) return;
        if (move.tab && !cell.classList.contains('tabulator-editing')) return;
        const previous = move;
        move = null;
        if (previous.tab) notify(previous.tab, { from: previous.field, to: cell.getAttribute('tabulator-field'), editing: cell.classList.contains('tabulator-editing'), committed: previous.committed, changed: previous.changed }, previous.context);
        else notify('move', { from: previous.from, to: cell }, previous.context);
    };
    const onInput = event => {
        if (active && active.cell.getElement().contains(event.target)) {
            active.temporary = event.target.value;
            active.typed = true;
            if (notify('temporary', { before: active.before, temporary: active.temporary, openedBy: active.openedBy, text: ['productName', 'itemCode'].includes(active.cell.getField()) }, active.context)) active.context = tutorial.capture();
        }
        if (dialogCandidate && statusDialog.overlay?.contains(event.target) && event.target.matches('.amb-lookup-dialog__search')) {
            if (event.target.value.trim() && notify('dialog-search', { searched: true }, dialogCandidate.context)) dialogCandidate.context = tutorial.capture();
        }
    };
    const onEditing = cell => {
        const element = cell.getElement();
        active = { cell, before: cell.getValue(), temporary: cell.getValue(), openedBy: intent?.cell === element ? intent.kind : null,
            context: tutorial.capture(), typed: false, dialog: false, confirmed: false, cancelled: false };
        intent = null;
    };
    const onEdited = cell => {
        if (!active || active.cell !== cell) return;
        const edit = active;
        active = null;
        if (move?.tab && move.from === cell.getElement()) {
            move.committed = true;
            move.changed = cell.getValue() !== edit.before;
        }
        const data = cell.getRow().getData();
        const row = demo.getStateReport().rows.find(item => item.id === data.id || item.tempId && item.tempId === data._ambTempId);
        const payload = { before: edit.before, after: cell.getValue(), committed: true, openedBy: edit.openedBy,
            changedRow: Boolean(row?.hasChanges), typed: edit.typed, dialog: edit.dialog, valid: statusOptions.includes(cell.getValue()) };
        if (cell.getField() === 'status' && dialogCandidate?.selected) {
            notify('dialog-select', { selected: true, applied: cell.getValue() === dialogCandidate.selected.id, valid: payload.valid }, dialogCandidate.context);
            dialogCandidate = null;
        } else if (cell.getField() === 'status') notify('direct', payload, edit.context);
        else if (edit.openedBy === 'mouse') notify('mouse-edit', payload, edit.context);
        else if (edit.confirmed) notify('edit', payload, edit.context);
    };
    const onCancelled = cell => {
        if (!active || active.cell !== cell) return;
        const edit = active;
        active = null;
        if (edit.cancelled) notify('cancel', { before: edit.before, temporary: edit.temporary, after: cell.getValue(), closed: true }, edit.context);
    };
    statusDialog.open = function (...args) {
        const edit = active;
        const selection = originalOpen.apply(this, args);
        if (edit) edit.dialog = true;
        if (edit?.f2 && edit.cell.getField() === 'status' && tutorial.capture()?.stepId === 'dialog-lookup') {
            const context = tutorial.capture();
            const opened = Boolean(statusDialog.overlay && !statusDialog.overlay.hidden);
            if (context.actionIndex === 0) notify('dialog-open', { opened, key: 'F2' }, context);
            if (opened) dialogCandidate = { context: tutorial.capture(), selected: null };
        }
        const candidate = dialogCandidate;
        return selection.then(selected => {
            if (candidate && candidate === dialogCandidate) {
                if (selected) candidate.selected = selected;
                else dialogCandidate = null;
            }
            return selected;
        });
    };
    launch.addEventListener('click', onLaunch);
    app.addEventListener('pointerdown', onPointer, true);
    app.addEventListener('keydown', onKey, true);
    app.addEventListener('focusin', onFocus, true);
    document.addEventListener('input', onInput, true);
    window.addEventListener('amb-demo-language-change', onLanguage);
    demo.table.on('cellEditing', onEditing);
    demo.table.on('cellEdited', onEdited);
    demo.table.on('cellEditCancelled', onCancelled);
    return {
        capture: () => tutorial.capture(),
        added(row, context) {
            const data = row?.getData?.();
            const report = demo.getStateReport().rows.find(item => item.tempId && item.tempId === data?._ambTempId);
            notify('added', { present: demo.getData().some(item => item._ambTempId === data?._ambTempId), state: report?.state, code: data?.itemCode }, context);
        },
        partialOpened(payload, context, opened) {
            if (notify('partial-open', { opened, valid: payload.hasValidChanges, invalid: payload.hasInvalidChanges }, context)) return tutorial.capture();
            return context;
        },
        partialSaved(context, confirmed, result, saved, report) {
            notify('partial-saved', { confirmed, ok: result.ok, saved: saved.saved.length, pendingInvalid: report.invalidChangedRowsCount }, context);
        },
        destroy() {
            destroyed = true;
            launch.removeEventListener('click', onLaunch);
            app.removeEventListener('pointerdown', onPointer, true);
            app.removeEventListener('keydown', onKey, true);
            app.removeEventListener('focusin', onFocus, true);
            document.removeEventListener('input', onInput, true);
            window.removeEventListener('amb-demo-language-change', onLanguage);
            demo.table.off('cellEditing', onEditing);
            demo.table.off('cellEdited', onEdited);
            demo.table.off('cellEditCancelled', onCancelled);
            statusDialog.open = originalOpen;
            tutorial.destroy();
            note.remove();
        }
    };
}
