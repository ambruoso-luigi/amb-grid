import { createDemoActionTutorial } from './demo-action-tutorial.js';
import { publicExampleTranslations } from '../example-copy.js';

const prefix = 'examples.javascriptInventory';
const action = (actionId, instruction, isComplete) => ({ actionId, instructionKey: `${prefix}.${instruction}`, isComplete });
const changed = p => p.before !== p.after && p.committed === true;

export const inventoryTutorialSteps = [
    { id: 'arrows', actions: [action('move', 'arrows', p => p.from && p.to && p.from !== p.to)] },
    { id: 'enter', actions: [action('edit', 'enter', p => p.openedBy === 'Enter' && changed(p) && p.changedRow)] },
    { id: 'tab', actions: [
        action('tab-forward', 'tabForward', p => p.from && p.to && p.from !== p.to && p.editing),
        action('tab-backward', 'tabBackward', p => p.from && p.to && p.from !== p.to && p.editing)
    ] },
    { id: 'escape', actions: [action('cancel', 'escape', p => p.temporary !== p.before && p.after === p.before && p.closed)] },
    { id: 'page', actions: [action('page', 'page', p => p.before !== p.after && p.keyboard)] },
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

export function createInventoryTutorial({ host, launch, app, demo, statusDialog, statusOptions, technicalGuide, locale }) {
    let active = null;
    let intent = null;
    let move = null;
    let pageIntent = null;
    let dialogCandidate = null;
    let started = false;
    let state = null;
    const label = launch.querySelector('span');
    const translate = key => publicExampleTranslations[document.documentElement.lang === 'en' ? 'en' : 'it'][`${prefix}.${key}`];
    const originalOpen = statusDialog.open;
    const notify = (id, payload, context = tutorial.capture()) => tutorial.notify(id, payload, context);
    const tutorial = createDemoActionTutorial({
        host, variant: 'crud', initiallyHidden: true, externalOpenButton: launch,
        panelId: 'javascript-inventory-tutorial', locale,
        titleKey: `${prefix}.tutorialTitle`, completedKey: `${prefix}.tutorialCompleted`, tutorialCopyPrefix: prefix,
        steps: inventoryTutorialSteps,
        onRestart: () => { active = null; intent = null; move = null; pageIntent = null; dialogCandidate = null; return true; },
        onCompleteAction: () => true,
        onCompleteSuccess: ({ openGuide }) => {
            started = false;
            label.textContent = translate('tutorialStart');
            if (openGuide && technicalGuide) { technicalGuide.open = true; technicalGuide.querySelector('summary')?.focus(); }
            else launch.focus();
        },
        onStateChange: next => {
            state = next;
            launch.hidden = !next.hidden;
            launch.setAttribute('aria-expanded', String(!next.hidden));
            label.textContent = translate(started ? 'tutorialResume' : 'tutorialStart');
        }
    });
    const root = app.querySelector('#inventory-table');
    const cellOf = target => target?.closest?.('.tabulator-cell');
    const onLaunch = () => { started = true; tutorial.reopen(); };
    const onLanguage = () => { label.textContent = translate(started ? 'tutorialResume' : 'tutorialStart'); };
    const onPointer = event => {
        move = null;
        pageIntent = null;
        const cell = cellOf(event.target);
        if (cell && root.contains(cell)) intent = { kind: 'mouse', cell, context: tutorial.capture() };
    };
    const onKey = event => {
        const cell = cellOf(event.target);
        const context = tutorial.capture();
        if (!context) return;
        if (!event.key.startsWith('Arrow') && event.key !== 'Tab') move = null;
        if (!event.target.closest?.('.tabulator-page')) pageIntent = null;
        if (cell && root.contains(cell)) {
            if (event.key.startsWith('Arrow') && !cell.classList.contains('tabulator-editing')) move = { from: cell, context };
            if (event.key === 'Enter' && !cell.classList.contains('tabulator-editing')) intent = { kind: 'Enter', cell, context };
            if (active && cell === active.cell.getElement()) {
                if (event.key === 'Enter') active.confirmed = true;
                if (event.key === 'Escape') active.cancelled = true;
                if (event.key === 'F2') active.f2 = true;
                if (event.key === 'Tab') move = { from: cell, context, tab: event.shiftKey ? 'tab-backward' : 'tab-forward' };
            }
        }
        if ((event.key === 'Enter' || event.key === ' ') && event.target.closest?.('.tabulator-page')) {
            pageIntent = { before: demo.table.getPage(), context };
        }
    };
    const onFocus = event => {
        const cell = cellOf(event.target);
        if (!move || !cell || !root.contains(cell) || cell === move.from) return;
        if (move.tab && !cell.classList.contains('tabulator-editing')) return;
        const previous = move;
        move = null;
        if (previous.tab) notify(previous.tab, { from: previous.from, to: cell, editing: cell.classList.contains('tabulator-editing') }, previous.context);
        else notify('move', { from: previous.from, to: cell }, previous.context);
    };
    const onInput = event => {
        if (active && active.cell.getElement().contains(event.target)) {
            active.temporary = event.target.value;
            active.typed = true;
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
    const onPage = number => {
        if (!pageIntent) return;
        const previous = pageIntent;
        pageIntent = null;
        notify('page', { before: previous.before, after: number, keyboard: true }, previous.context);
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
    demo.table.on('pageLoaded', onPage);
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
            launch.removeEventListener('click', onLaunch);
            app.removeEventListener('pointerdown', onPointer, true);
            app.removeEventListener('keydown', onKey, true);
            app.removeEventListener('focusin', onFocus, true);
            document.removeEventListener('input', onInput, true);
            window.removeEventListener('amb-demo-language-change', onLanguage);
            demo.table.off('cellEditing', onEditing);
            demo.table.off('cellEdited', onEdited);
            demo.table.off('cellEditCancelled', onCancelled);
            demo.table.off('pageLoaded', onPage);
            statusDialog.open = originalOpen;
            tutorial.destroy();
        }
    };
}
