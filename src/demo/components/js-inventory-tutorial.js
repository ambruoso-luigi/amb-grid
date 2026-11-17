import { createDemoActionTutorial } from './demo-action-tutorial.js';
import { publicExampleTranslations } from '../example-copy.js';

const prefix = 'examples.javascriptInventory';
const action = (actionId, instruction, isComplete) => ({ actionId, instructionKey: `${prefix}.${instruction}`, isComplete });
const changed = p => p.before !== p.after && p.committed === true;
const differentPrice = p => {
    const text = String(p.temporary ?? '').trim().replace(',', '.');
    return text !== '' && Number.isFinite(Number(text)) && Number(text) !== Number(p.before);
};

export const inventoryTutorialSteps = [
    { id: 'keyboard-edit', actions: [
        action('move', 'arrows', p => p.from && p.to && p.from !== p.to && p.firstRow && p.field === 'stockQuantity'),
        action('edit', 'enter', p => p.field === 'stockQuantity' && p.sameRow && p.openedBy === 'Enter' && p.confirmed && p.typed && Number.isInteger(p.after) && p.after >= 0 && changed(p) && p.changedRow)
    ] },
    { id: 'tab', actions: [
        action('tab-forward', 'tabForward', p => p.from === 'stockQuantity' && p.to === 'unitPrice' && p.openedBy === 'Enter' && p.sameRow && p.editing && p.committed && p.changed && p.valid)
    ] },
    { id: 'escape', actions: [
        action('temporary', 'escapePrepare', p => p.field === 'unitPrice' && p.continued && differentPrice(p)),
        action('cancel', 'escapeCancel', p => p.field === 'unitPrice' && p.continued && differentPrice(p) && p.after === p.before && p.closed && p.cancelled)
    ] },
    { id: 'pages', actions: [
        action('page-next', 'pageNext', p => p.shortcut && p.rendered && p.after === p.before + 1),
        action('page-previous', 'pagePrevious', p => p.shortcut && p.rendered && p.after === p.original && p.before === p.original + 1)
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
    let targetRow = null;
    let pageIntent = null;
    let originalPage = null;
    let dialogCandidate = null;
    let f2Intent = null;
    let started = false;
    let state = null;
    let resetting = false;
    let destroyed = false;
    let completing = false;
    let skipCloseReset = false;
    let root = null;
    let highlighted = null;
    let inputGlow = null;
    let preferredRow = null;
    let partialButton = null;
    let dialogObserver = null;
    let commitObserver = null;
    const label = launch.querySelector('span');
    const translate = key => publicExampleTranslations[document.documentElement.lang === 'en' ? 'en' : 'it'][`${prefix}.${key}`];
    const pageNote = () => demo.table.getPageMax?.() <= 1 ? translate('pageSingle') : translate('pageUnavailable');
    const originalOpen = statusDialog.open;
    const notify = (id, payload, context = tutorial.capture()) => tutorial.notify(id, payload, context);
    const note = document.createElement('p');
    note.className = 'demo-main-tutorial-note';
    note.hidden = true;
    const clearHighlight = () => {
        highlighted?.classList.remove('demo-crud-tutorial-target', 'demo-crud-tutorial-target--pulse', 'demo-crud-tutorial-target--rays');
        highlighted = null;
        inputGlow?.remove();
        inputGlow = null;
    };
    const visible = element => {
        if (!element?.isConnected || !element.getClientRects().length) return false;
        const holder = element.closest?.('.tabulator-tableholder');
        if (!holder) return true;
        const rect = element.getBoundingClientRect();
        const bounds = holder.getBoundingClientRect();
        return rect.right > bounds.left && rect.left < bounds.right && rect.bottom > bounds.top && rect.top < bounds.bottom;
    };
    const syncHighlight = () => {
        if (!root || destroyed || !state || state.hidden || state.complete || state.resetting || state.restartFailed || state.destroyed) {
            clearHighlight();
            return;
        }
        const { stepId, actionIndex } = state;
        let target = null;
        if (stepId === 'add') target = app.querySelector('[data-action="add"]');
        else if (stepId === 'partial-save') target = actionIndex === 1 && partialButton?.isConnected ? partialButton : app.querySelector('[data-action="save"]');
        else if (stepId === 'dialog-lookup' && actionIndex > 0 && statusDialog.overlay) {
            target = actionIndex === 1 ? statusDialog.overlay.querySelector('.amb-lookup-dialog__search')
                : statusDialog.overlay.querySelector('.amb-lookup-dialog__row--selected, .amb-lookup-dialog__row');
        } else {
            const field = ({ 'keyboard-edit': 'stockQuantity', tab: move?.tab ? 'unitPrice' : 'stockQuantity',
                escape: 'unitPrice', pages: 'productName', 'direct-lookup': 'status', 'dialog-lookup': 'status', mouse: 'productName' })[stepId];
            if (!target) {
                const selector = `.tabulator-cell[tabulator-field="${field || 'productName'}"]`;
                const row = preferredRow?.isConnected && root.contains(preferredRow) && visible(preferredRow) ? preferredRow : null;
                target = row?.querySelector(selector) || [...(root.querySelectorAll?.(selector) || [])].find(visible);
            }
        }
        if (target?.classList?.contains('tabulator-editing')) target = null;
        if (!visible(target)) target = null;
        if (target === highlighted) {
            if (inputGlow) {
                const rect = target.getBoundingClientRect();
                Object.assign(inputGlow.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
            }
            return;
        }
        clearHighlight();
        if (target) {
            target.classList.add('demo-crud-tutorial-target', 'demo-crud-tutorial-target--pulse');
            if (target.tagName === 'BUTTON') target.classList.add('demo-crud-tutorial-target--rays');
            highlighted = target;
            if (target.tagName === 'INPUT') {
                inputGlow = document.createElement('div');
                inputGlow.className = 'demo-crud-row-action-glow demo-crud-row-action-glow--pulse';
                inputGlow.setAttribute('aria-hidden', 'true');
                const rect = target.getBoundingClientRect();
                Object.assign(inputGlow.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, zIndex: '10001' });
                document.body.append(inputGlow);
            }
        }
    };
    const clearTracking = () => {
        active = null; intent = null; move = null; targetRow = null; pageIntent = null; originalPage = null; dialogCandidate = null; f2Intent = null;
        preferredRow = null; partialButton = null; dialogObserver?.disconnect(); dialogObserver = null;
        commitObserver?.disconnect(); commitObserver = null; clearHighlight();
    };
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
            note.textContent = next.stepId === 'pages' && next.actionIndex === 0 && demo.table.getPage?.() >= demo.table.getPageMax?.() ? pageNote() : translate('tutorialResetNote');
            const closeButton = host.querySelector('[data-tutorial-action="skip"]');
            if (closeButton) closeButton.disabled = next.resetting || next.destroyed;
            syncHighlight();
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
    root = app.querySelector('#inventory-table');
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
    const onLanguage = () => {
        label.textContent = translate(started ? 'tutorialResume' : 'tutorialStart');
        note.textContent = state?.stepId === 'pages' && state.actionIndex === 0 && demo.table.getPage?.() >= demo.table.getPageMax?.() ? pageNote() : translate('tutorialResetNote');
    };
    const onPointer = event => {
        move = null;
        pageIntent = null;
        f2Intent = null;
        const cell = cellOf(event.target);
        if (cell && root.contains(cell)) { preferredRow = cell.closest('.tabulator-row'); intent = { kind: 'mouse', cell, context: tutorial.capture() }; syncHighlight(); }
    };
    const onKey = event => {
        const cell = cellOf(event.target);
        const context = tutorial.capture();
        if (!context) return;
        if (pageIntent) pageIntent = null;
        if (context.stepId === 'pages' && cell && root.contains(cell) && event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && ['PageDown', 'PageUp'].includes(event.key)) {
            pageIntent = { key: event.key, before: demo.table.getPage?.(), context, rendered: false };
        }
        if (event.key !== 'F2') f2Intent = null;
        if (!event.key.startsWith('Arrow') && event.key !== 'Tab') move = null;
        if (cell && root.contains(cell)) {
            if (event.key === 'F2' && cell.getAttribute('tabulator-field') === 'status' && context.stepId === 'dialog-lookup') {
                f2Intent = { context, cell };
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && !cell.classList.contains('tabulator-editing')) move = { from: cell, context };
            if (event.key === 'Enter' && !cell.classList.contains('tabulator-editing')) intent = { kind: 'Enter', cell, context };
            if (active && cell === active.cell.getElement()) {
                if (event.key === 'Enter') active.confirmed = true;
                if (event.key === 'Escape') active.cancelled = true;
                if (event.key === 'Tab' && !event.shiftKey) move = { from: cell, row: active.cell.getRow(), field: active.cell.getField(), before: active.before, context, tab: 'tab-forward' };
            }
        }
    };
    const onFocus = event => {
        const cell = cellOf(event.target);
        if (cell && root.contains(cell)) { preferredRow = cell.closest('.tabulator-row'); syncHighlight(); }
        if (f2Intent && cell && cell !== f2Intent.cell) f2Intent = null;
        if (pageIntent && cell && root.contains(cell) && pageIntent.rendered) {
            const pending = pageIntent;
            pageIntent = null;
            const next = pending.key === 'PageDown';
            if (notify(next ? 'page-next' : 'page-previous', { shortcut: true, rendered: true, before: pending.before, after: demo.table.getPage?.(), original: originalPage }, pending.context) && next) originalPage = pending.before;
        }
        if (!move || !cell || !root.contains(cell) || cell === move.from) return;
        if (move.tab && (!cell.classList.contains('tabulator-editing') || !active || active.cell.getElement() !== cell)) return;
        const previous = move;
        move = null;
        if (previous.tab) {
            const advanced = notify(previous.tab, { from: previous.field, to: cell.getAttribute('tabulator-field'), openedBy: previous.openedBy, sameRow: active?.cell.getRow() === previous.row, editing: Boolean(active && active.cell.getElement() === cell), committed: previous.committed, changed: previous.changed, valid: previous.valid }, previous.context);
            if (advanced && active) { active.context = tutorial.capture(); active.continued = true; }
        } else {
            const row = cell.closest('.tabulator-row');
            const firstRow = [...(root.querySelectorAll?.('.tabulator-row') || [])].find(visible);
            if (notify('move', { from: previous.from, to: cell, field: cell.getAttribute('tabulator-field'), firstRow: row && row === firstRow && previous.from.closest('.tabulator-row') === row }, previous.context)) targetRow = row;
        }
    };
    const onInput = event => {
        if (active && active.cell.getElement().contains(event.target)) {
            active.temporary = event.target.value;
            active.typed = true;
            if (notify('temporary', { before: active.before, temporary: active.temporary, field: active.cell.getField(), continued: active.continued }, active.context)) active.context = tutorial.capture();
        }
        if (dialogCandidate && statusDialog.overlay?.contains(event.target) && event.target.matches('.amb-lookup-dialog__search')) {
            if (event.target.value.trim()) {
                dialogCandidate.searched = true;
                if (notify('dialog-search', { searched: true }, dialogCandidate.context)) dialogCandidate.context = tutorial.capture();
            }
            queueMicrotask(syncHighlight);
        }
    };
    const onEditing = cell => {
        const element = cell.getElement();
        active = { cell, before: cell.getValue(), temporary: cell.getValue(), openedBy: intent?.cell === element ? intent.kind : null,
            context: tutorial.capture(), typed: false, dialog: false, confirmed: false, cancelled: false };
        intent = null;
        clearHighlight();
        if (move?.tab && move.committed) {
            const previous = move;
            move = null;
            if (notify(previous.tab, { from: previous.field, to: cell.getField(), openedBy: previous.openedBy, sameRow: cell.getRow() === previous.row, editing: true, committed: previous.committed, changed: previous.changed, valid: previous.valid }, previous.context)) { active.context = tutorial.capture(); active.continued = true; }
        }
    };
    const onEdited = cell => {
        if (!active || active.cell !== cell) return;
        const edit = active;
        active = null;
        if (move?.tab && move.from === cell.getElement()) {
            move.committed = true;
            move.changed = cell.getValue() !== edit.before;
            move.valid = Number.isInteger(cell.getValue()) && cell.getValue() >= 0;
            move.openedBy = edit.openedBy;
        }
        const data = cell.getRow().getData();
        const row = demo.getStateReport().rows.find(item => item.id === data.id || item.tempId && item.tempId === data._ambTempId);
        const payload = { before: edit.before, after: cell.getValue(), committed: true, openedBy: edit.openedBy,
            changedRow: Boolean(row?.hasChanges), field: cell.getField(), sameRow: cell.getElement().closest('.tabulator-row') === targetRow, confirmed: edit.confirmed, typed: edit.typed, dialog: edit.dialog, valid: statusOptions.includes(cell.getValue()) };
        if (cell.getField() === 'status' && dialogCandidate?.selected) {
            commitObserver?.disconnect();
            commitObserver = null;
            notify('dialog-select', { selected: dialogCandidate.searched, applied: cell.getValue() === dialogCandidate.selected.id, valid: payload.valid }, dialogCandidate.context);
            dialogCandidate = null;
        } else if (cell.getField() === 'status') notify('direct', payload, edit.context);
        else if (edit.openedBy === 'mouse') notify('mouse-edit', payload, edit.context);
        else if (edit.confirmed) notify('edit', payload, edit.context);
        syncHighlight();
    };
    const onCancelled = cell => {
        if (!active || active.cell !== cell) return;
        f2Intent = null;
        const edit = active;
        active = null;
        if (edit.cancelled) notify('cancel', { before: edit.before, temporary: edit.temporary, after: cell.getValue(), closed: !cell.getElement().classList.contains('tabulator-editing'), cancelled: true, field: cell.getField(), continued: edit.continued }, edit.context);
        syncHighlight();
    };
    const onPageRender = () => {
        if (pageIntent && demo.table.getPage?.() !== pageIntent.before) pageIntent.rendered = true;
        if (state?.stepId === 'pages' && state.actionIndex === 0) note.textContent = demo.table.getPage?.() >= demo.table.getPageMax?.() ? pageNote() : translate('tutorialResetNote');
        syncHighlight();
    };
    statusDialog.open = function (...args) {
        const edit = active;
        const selection = originalOpen.apply(this, args);
        if (edit) edit.dialog = true;
        const request = f2Intent;
        f2Intent = null;
        const context = tutorial.capture();
        if (request && edit?.cell.getElement() === request.cell && edit.cell.getField() === 'status'
            && context?.stepId === 'dialog-lookup' && context.generation === request.context.generation
            && context.actionIndex === request.context.actionIndex) {
            const opened = Boolean(statusDialog.overlay?.isConnected && !statusDialog.overlay.hidden && statusDialog.overlay.getClientRects().length);
            if (context.actionIndex === 0) notify('dialog-open', { opened, key: 'F2' }, request.context);
            if (opened) {
                dialogCandidate = { context: tutorial.capture(), selected: null, searched: false };
                dialogObserver?.disconnect();
                if (typeof MutationObserver === 'function') {
                    dialogObserver = new MutationObserver(syncHighlight);
                    dialogObserver.observe(statusDialog.overlay, { childList: true, subtree: true });
                }
                syncHighlight();
            }
        }
        const candidate = dialogCandidate;
        const observer = dialogObserver;
        return selection.then(selected => {
            if (candidate && candidate === dialogCandidate) {
                if (selected) {
                    candidate.selected = selected;
                    if (edit && selected.id === edit.before && typeof MutationObserver === 'function') {
                        const cell = edit.cell;
                        commitObserver?.disconnect();
                        commitObserver = new MutationObserver(() => {
                            if (dialogCandidate !== candidate || cell.getElement().classList.contains('tabulator-editing')) return;
                            commitObserver?.disconnect();
                            commitObserver = null;
                            if (notify('dialog-select', { selected: candidate.searched, applied: cell.getValue() === selected.id, valid: statusOptions.includes(cell.getValue()) }, candidate.context)) dialogCandidate = null;
                            syncHighlight();
                        });
                        commitObserver.observe(cell.getElement(), { childList: true, subtree: true });
                    }
                }
                else { dialogCandidate = null; f2Intent = null; }
            }
            observer?.disconnect();
            if (dialogObserver === observer) dialogObserver = null;
            syncHighlight();
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
    for (const event of ['scrollVertical', 'scrollHorizontal', 'dataFiltered']) demo.table.on(event, syncHighlight);
    demo.table.on('renderComplete', onPageRender);
    window.addEventListener('resize', syncHighlight);
    window.addEventListener('scroll', syncHighlight, true);
    return {
        capture: () => tutorial.capture(),
        added(row, context) {
            const data = row?.getData?.();
            const report = demo.getStateReport().rows.find(item => item.tempId && item.tempId === data?._ambTempId);
            notify('added', { present: demo.getData().some(item => item._ambTempId === data?._ambTempId), state: report?.state, code: data?.itemCode }, context);
        },
        partialOpened(payload, context, opened, button) {
            partialButton = button;
            if (notify('partial-open', { opened, valid: payload.hasValidChanges, invalid: payload.hasInvalidChanges }, context)) return tutorial.capture();
            syncHighlight();
            return context;
        },
        partialClosed() { partialButton = null; syncHighlight(); },
        partialSaved(context, confirmed, result, saved, report) {
            notify('partial-saved', { confirmed, ok: result.ok, saved: saved.saved.length, pendingInvalid: report.invalidChangedRowsCount }, context);
        },
        destroy() {
            destroyed = true;
            clearTracking();
            launch.removeEventListener('click', onLaunch);
            app.removeEventListener('pointerdown', onPointer, true);
            app.removeEventListener('keydown', onKey, true);
            app.removeEventListener('focusin', onFocus, true);
            document.removeEventListener('input', onInput, true);
            window.removeEventListener('amb-demo-language-change', onLanguage);
            demo.table.off('cellEditing', onEditing);
            demo.table.off('cellEdited', onEdited);
            demo.table.off('cellEditCancelled', onCancelled);
            for (const event of ['scrollVertical', 'scrollHorizontal', 'dataFiltered']) demo.table.off(event, syncHighlight);
            demo.table.off('renderComplete', onPageRender);
            window.removeEventListener('resize', syncHighlight);
            window.removeEventListener('scroll', syncHighlight, true);
            statusDialog.open = originalOpen;
            tutorial.destroy();
            note.remove();
        }
    };
}
