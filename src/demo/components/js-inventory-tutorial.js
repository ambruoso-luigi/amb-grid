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
    { id: 'direct-lookup', actions: [action('direct', 'direct', p => p.existing && p.openedBy === 'Enter' && p.typed && !p.dialog && p.valid && changed(p))] },
    { id: 'dialog-lookup', actions: [
        action('dialog-open', 'dialogOpen', p => p.opened && p.key === 'F2'),
        action('dialog-search', 'dialogSearch', p => p.searched),
        action('dialog-select', 'dialogSelect', p => p.selected && p.applied && p.valid)
    ] },
    { id: 'date-picker', actions: [
        action('date-open', 'dateOpen', p => p.opened && p.f2 && p.cell),
        action('date-move', 'dateMove', p => p.opened && p.moved),
        action('date-select', 'dateSelect', p => p.selected && p.closed && p.valid && p.after !== p.before),
        action('date-commit', 'dateCommit', p => p.selected && p.valid && changed(p) && p.applied)
    ] },
    { id: 'notes', actions: [
        action('notes-open', 'notesOpen', p => p.doubleClick && p.opened && p.textarea),
        action('notes-input', 'notesInput', p => Boolean(p.text?.trim()) && p.text !== p.before),
        action('notes-save', 'notesSave', p => p.saved && p.closed && p.applied && changed(p))
    ] },
    { id: 'add', actions: [action('added', 'add', p => p.present && p.ready && p.state === 'new' && /^PRD-[A-Z0-9]{4}$/.test(p.code))] },
    { id: 'partial-save', actions: [
        action('partial-open', 'partialOpen', p => p.opened && p.valid && p.invalid),
        action('partial-saved', 'partialConfirm', p => p.confirmed && p.ok && p.prepared && p.backendSaved > 0 && p.saved > 0 && p.pendingInvalid > 0)
    ] }
];

export function createInventoryTutorial({ host, launch, app, demo, statusDialog, statusOptions, locale, resetData, hasPendingChanges, confirmStart, confirmRestart, onOpenCommandGuide, onResetError }) {
    let active = null;
    let intent = null;
    let move = null;
    let targetRow = null;
    let navigationStartRow = null;
    let pageIntent = null;
    let originalPage = null;
    let dialogCandidate = null;
    let f2Intent = null;
    let started = false;
    let state = null;
    let resetting = false;
    let destroyed = false;
    let completing = false;
    let root = null;
    let highlighted = null;
    let inputGlow = null;
    let preferredRow = null;
    let partialButton = null;
    let dialogObserver = null;
    let commitObserver = null;
    let directRowId = null;
    let directRow = null;
    let suggestedTabRow = null;
    let suggestedStatusRow = null;
    let dateRequest = null;
    let notesRequest = null;
    let popupSession = null;
    let popupObserver = null;
    let partialSummary = null;
    const label = launch.querySelector('span');
    const translate = key => publicExampleTranslations[document.documentElement.lang === 'en' ? 'en' : 'it'][`${prefix}.${key}`];
    const pageNote = () => demo.table.getPageMax?.() <= 1 ? translate('pageSingle') : translate('pageUnavailable');
    const noteText = current => current?.complete && partialSummary
        ? translate('partialSummary').replace('{saved}', partialSummary.saved).replace('{pending}', partialSummary.pending)
        : current?.stepId === 'pages' && current.actionIndex === 0 && demo.table.getPage?.() >= demo.table.getPageMax?.() ? pageNote() : translate('tutorialResetNote');
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
    const firstVisibleRow = () => [...(root?.querySelectorAll?.('.tabulator-row') || [])].find(visible);
    const rowUsable = (row, field) => Boolean(row && root.contains(row) && visible(row) && row.querySelector?.(`.tabulator-cell[tabulator-field="${field}"]`));
    const alternativeRow = (origin, field, allowOrigin) => {
        const rows = [...(root?.querySelectorAll?.('.tabulator-row') || [])].filter(row => rowUsable(row, field));
        return rows.find(row => row !== origin) || (allowOrigin ? rows[0] : null) || null;
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
        else if (stepId === 'pages') target = null;
        else if (stepId === 'keyboard-edit' && actionIndex === 0) {
            const row = firstVisibleRow();
            const field = navigationStartRow === row && row ? 'stockQuantity' : 'itemCode';
            target = row?.querySelector?.(`.tabulator-cell[tabulator-field="${field}"]`) || null;
        } else if (stepId === 'tab') {
            if (!rowUsable(suggestedTabRow, 'stockQuantity')) suggestedTabRow = alternativeRow(targetRow || preferredRow, 'stockQuantity', true);
            target = suggestedTabRow?.querySelector?.(`.tabulator-cell[tabulator-field="${move?.tab ? 'unitPrice' : 'stockQuantity'}"]`) || null;
        } else if (stepId === 'dialog-lookup' && actionIndex === 0) {
            const origin = directRow?.getElement?.() || directRow?.element || null;
            if (!rowUsable(suggestedStatusRow, 'status')) suggestedStatusRow = rowUsable(origin, 'status') ? origin : alternativeRow(null, 'status', true);
            target = suggestedStatusRow?.querySelector?.('.tabulator-cell[tabulator-field="status"]') || null;
        } else if (stepId === 'dialog-lookup' && actionIndex > 0 && statusDialog.overlay) {
            target = statusDialog.overlay.querySelector('.amb-lookup-dialog__search');
        } else if (stepId === 'date-picker' && actionIndex > 0 && popupSession?.popup) {
            target = popupSession.popup.querySelector('.datepicker-picker');
        } else if (stepId === 'notes' && actionIndex > 0 && popupSession?.popup) {
            target = popupSession.popup.querySelector(actionIndex === 1 ? '.amb-large-text-editor__textarea' : '.amb-large-text-editor__button--primary');
        } else {
            const field = ({ 'keyboard-edit': 'stockQuantity', tab: move?.tab ? 'unitPrice' : 'stockQuantity',
                escape: 'unitPrice', pages: 'productName', 'direct-lookup': 'status', 'dialog-lookup': 'status', 'date-picker': 'lastCheckDate', notes: 'notes' })[stepId];
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
                const modal = statusDialog.overlay?.contains?.(target) ? statusDialog.overlay : null;
                Object.assign(inputGlow.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, zIndex: modal ? '1' : '10001' });
                (modal || document.body).append(inputGlow);
            }
        }
    };
    const clearTracking = () => {
        active = null; intent = null; move = null; targetRow = null; navigationStartRow = null; pageIntent = null; originalPage = null; dialogCandidate = null; f2Intent = null;
        preferredRow = null; partialButton = null; dialogObserver?.disconnect(); dialogObserver = null;
        commitObserver?.disconnect(); commitObserver = null; clearHighlight();
        directRowId = null; directRow = null; suggestedTabRow = null; suggestedStatusRow = null; dateRequest = null; notesRequest = null; popupSession = null;
        partialSummary = null;
        popupObserver?.disconnect(); popupObserver = null;
    };
    const runReset = async () => {
        if (resetting || destroyed) return false;
        resetting = true;
        launch.disabled = true;
        launch.setAttribute('aria-busy', 'true');
        label.textContent = translate('tutorialRestoring');
        clearTracking();
        try {
            const success = await resetData() !== false;
            if (!success && !destroyed) onResetError?.();
            return success;
        } catch {
            if (!destroyed) onResetError?.();
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
        onBeforeRestart: () => !hasPendingChanges?.() ? true : (started ? confirmRestart?.() : confirmStart?.()) ?? false,
        onRestart: runReset,
        onCompleteAction: async ({ openGuide }) => {
            if (openGuide) { completing = true; return true; }
            const success = await runReset();
            completing = success;
            return success;
        },
        onCompleteSuccess: ({ openGuide }) => {
            started = false;
            completing = false;
            label.textContent = translate('tutorialStart');
            if (!openGuide) launch.setAttribute('data-demo-inventory-finished', 'true');
            if (openGuide && onOpenCommandGuide) onOpenCommandGuide();
            else launch.focus();
        },
        onStateChange: next => {
            const wasOpen = state && !state.hidden;
            if (state?.stepId !== next.stepId) {
                if (next.stepId === 'tab') suggestedTabRow = null;
                if (next.stepId === 'dialog-lookup') suggestedStatusRow = null;
            }
            if (next.hidden || (state?.stepId && state.stepId !== next.stepId)) {
                dateRequest = null; notesRequest = null; popupSession = null;
                popupObserver?.disconnect(); popupObserver = null;
                if (next.hidden) {
                    intent = null; move = null; pageIntent = null; f2Intent = null;
                    if (dialogCandidate) dialogCandidate.context = null;
                    if (active) active.context = null;
                    dialogObserver?.disconnect(); dialogObserver = null;
                    commitObserver?.disconnect(); commitObserver = null;
                } else if (state?.stepId === 'dialog-lookup') {
                    dialogCandidate = null;
                    dialogObserver?.disconnect(); dialogObserver = null;
                    commitObserver?.disconnect(); commitObserver = null;
                }
            }
            state = next;
            launch.hidden = !next.hidden;
            launch.setAttribute('aria-expanded', String(!next.hidden));
            label.textContent = translate(started ? 'tutorialResume' : 'tutorialStart');
            note.hidden = next.hidden;
            note.textContent = noteText(next);
            const closeButton = host.querySelector('[data-tutorial-action="skip"]');
            if (closeButton) closeButton.disabled = next.resetting || next.beforeRestartPending || next.destroyed;
            syncHighlight();
            if (wasOpen && next.hidden && !next.destroyed && !completing) {
                launch.focus({ preventScroll: true });
            }
        }
    });
    (host.querySelector('.demo-action-tutorial__bar') || host).append(note);
    root = app.querySelector('#inventory-table');
    const cellOf = target => target?.closest?.('.tabulator-cell');
    const observePopup = () => {
        popupObserver?.disconnect();
        if (typeof MutationObserver === 'function' && document.body) {
            popupObserver = new MutationObserver(checkPopup);
            popupObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        }
        queueMicrotask(checkPopup);
    };
    const checkPopup = () => {
        if (destroyed || !active) return;
        const request = dateRequest || notesRequest;
        if (!request || active.cell.getElement() !== request.cell) return;
        const date = Boolean(dateRequest);
        if (date && !active.cell.getElement().querySelector?.('.amb-date-editor-picker-anchor')) return;
        const popup = document.querySelector?.(date ? '.datepicker.active' : '.amb-large-text-editor');
        if (!visible(popup)) return;
        const textarea = date ? null : popup.querySelector('.amb-large-text-editor__textarea');
        const context = request.context;
        popupSession = { kind: date ? 'date' : 'notes', popup, cell: active.cell, before: active.before, context, selected: false, saved: false };
        const accepted = context.actionIndex > 0 || (date
            ? notify('date-open', { opened: true, f2: true, cell: true }, context)
            : notify('notes-open', { doubleClick: true, opened: true, textarea: Boolean(textarea) }, context));
        if (accepted) {
            popupSession.context = tutorial.capture();
            dateRequest = null; notesRequest = null;
            popupObserver?.disconnect(); popupObserver = null;
            syncHighlight();
        } else popupSession = null;
    };
    const onDoubleClick = event => {
        const context = tutorial.capture();
        const cell = cellOf(event.target);
        if (context?.stepId !== 'notes' || !cell || !root.contains(cell) || cell.getAttribute('tabulator-field') !== 'notes') return;
        notesRequest = { cell, context };
        observePopup();
    };
    const dayMarker = popup => {
        const day = popup.querySelector('.datepicker-cell.day.focused') || popup.querySelector('.datepicker-cell.day.selected');
        return day?.getAttribute('data-date') ?? null;
    };
    const resumePopup = kind => {
        const context = tutorial.capture();
        const stepId = kind === 'date' ? 'date-picker' : 'notes';
        const field = kind === 'date' ? 'lastCheckDate' : 'notes';
        if (context?.stepId !== stepId || context.actionIndex === 0 || active?.cell.getField() !== field) return null;
        const popup = document.querySelector?.(kind === 'date' ? '.datepicker.active' : '.amb-large-text-editor');
        if (!visible(popup)) return null;
        active.context = context;
        popupSession = { kind, popup, cell: active.cell, before: active.before, context, selected: false, saved: false };
        syncHighlight();
        return popupSession;
    };
    const onDocumentKey = event => {
        const session = popupSession || resumePopup('date');
        if (!session || session.kind !== 'date' || active?.cell !== session.cell || !visible(session.popup)) return;
        const anchor = session.cell.getElement().querySelector?.('.amb-date-editor-picker-anchor');
        if (event.target !== anchor && !session.popup.contains(event.target)) return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || session.context?.actionIndex !== 1) return;
            const before = dayMarker(session.popup);
            const context = session.context;
            const checkMovement = () => {
                const current = tutorial.capture();
                if (popupSession !== session || active?.cell !== session.cell || !visible(session.popup)
                    || current?.stepId !== 'date-picker' || current.actionIndex !== 1
                    || current.generation !== context?.generation || session.context !== context) return;
                const after = dayMarker(session.popup);
                if (before !== null && after !== null && before !== after && notify('date-move', { opened: true, moved: true }, context)) session.context = tutorial.capture();
            };
            if (typeof requestAnimationFrame === 'function') requestAnimationFrame(checkMovement);
            else queueMicrotask(checkMovement);
        } else if (event.key === 'Enter' && session.context?.actionIndex === 2) {
            session.enterPressed = true;
        }
    };
    const onDateChange = event => {
        const session = popupSession;
        if (session?.kind !== 'date' || !session.enterPressed || active?.cell !== session.cell) return;
        const anchor = session.cell.getElement().querySelector?.('.amb-date-editor-picker-anchor');
        const date = event.detail?.date;
        if (event.target === anchor && date instanceof Date && Number.isFinite(date.getTime())) {
            session.selected = date;
            queueMicrotask(() => confirmDateSelection(session));
        }
    };
    const confirmDateSelection = session => {
        if (popupSession !== session || active?.cell !== session.cell || !session.selected || visible(session.popup)) return;
        const date = session.selected;
        const formatted = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        const value = session.cell.getElement().querySelector?.('input.amb-date-editor')?.value;
        if (notify('date-select', { selected: true, closed: true, valid: value === formatted, before: session.before, after: value }, session.context)) {
            session.context = tutorial.capture();
        }
        syncHighlight();
    };
    const onDateHide = event => {
        const session = popupSession;
        if (session?.kind !== 'date') return;
        const anchor = session.cell.getElement().querySelector?.('.amb-date-editor-picker-anchor');
        if (event.target === anchor) {
            if (session.selected) queueMicrotask(() => confirmDateSelection(session));
            else { popupSession = null; syncHighlight(); }
        }
    };
    const onDocumentClick = event => {
        if (dialogCandidate && !dialogCandidate.context && statusDialog.overlay?.contains(event.target)) {
            const context = tutorial.capture();
            if (context?.stepId === 'dialog-lookup') dialogCandidate.context = context;
        }
        const session = popupSession || resumePopup('notes');
        if (session?.kind === 'notes' && session.popup.contains(event.target) && event.target.closest?.('.amb-large-text-editor__button--primary')) session.saved = true;
    };
    let starting = false;
    const onLaunch = async () => {
        if (resetting || starting || destroyed) return;
        starting = true;
        launch.disabled = true;
        try {
            if (started) {
                tutorial.reopen();
            } else if (await tutorial.restart() === true && !destroyed) {
                started = true;
                launch.removeAttribute('data-demo-inventory-finished');
                label.textContent = translate('tutorialResume');
            }
        } finally {
            starting = false;
            if (!resetting) launch.disabled = false;
        }
    };
    const onLanguage = () => {
        label.textContent = translate(started ? 'tutorialResume' : 'tutorialStart');
        note.textContent = noteText(state);
    };
    const onPointer = event => {
        move = null;
        pageIntent = null;
        f2Intent = null;
        const cell = cellOf(event.target);
        if (state?.stepId === 'keyboard-edit' && state.actionIndex === 0 && cell && root.contains(cell)) {
            const row = cell.closest('.tabulator-row');
            navigationStartRow = row === firstVisibleRow() && cell.getAttribute('tabulator-field') !== 'stockQuantity' ? row : null;
        }
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
            if (event.key === 'F2' && cell.getAttribute('tabulator-field') === 'lastCheckDate' && context.stepId === 'date-picker') {
                dateRequest = { context, cell };
                observePopup();
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && !cell.classList.contains('tabulator-editing')) move = { from: cell, context };
            if (event.key === 'Enter' && !cell.classList.contains('tabulator-editing')) intent = { kind: 'Enter', cell, context };
            if (active && cell === active.cell.getElement()) {
                if (!active.context) active.context = context;
                if (event.key === 'Enter') active.confirmed = true;
                if (event.key === 'Escape') active.cancelled = true;
                if (event.key === 'Tab' && !event.shiftKey) move = { from: cell, row: active.cell.getRow(), field: active.cell.getField(), before: active.before, context, tab: 'tab-forward' };
            }
        }
    };
    const onFocus = event => {
        const cell = cellOf(event.target);
        if (state?.stepId === 'keyboard-edit' && state.actionIndex === 0 && cell && root.contains(cell) && !move) {
            const row = cell.closest('.tabulator-row');
            navigationStartRow = row === firstVisibleRow() && cell.getAttribute('tabulator-field') !== 'stockQuantity' ? row : null;
        }
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
            const firstRow = firstVisibleRow();
            if (notify('move', { from: previous.from, to: cell, field: cell.getAttribute('tabulator-field'), firstRow: row && row === firstRow && previous.from.closest('.tabulator-row') === row }, previous.context)) targetRow = row;
        }
    };
    const observeDialog = () => {
        dialogObserver?.disconnect();
        if (typeof MutationObserver !== 'function' || !statusDialog.overlay) return;
        dialogObserver = new MutationObserver(records => {
            const candidate = dialogCandidate;
            if (candidate?.pendingSearch && records.some(record => record.type === 'childList')) {
                candidate.searched = true;
                candidate.pendingSearch = '';
                if (notify('dialog-search', { searched: true }, candidate.context)) candidate.context = tutorial.capture();
            }
            syncHighlight();
        });
        dialogObserver.observe(statusDialog.overlay, { childList: true, subtree: true });
    };
    const onInput = event => {
        if (!popupSession && event.target.matches?.('.amb-large-text-editor__textarea')) resumePopup('notes');
        if (active && !active.context && active.cell.getElement().contains(event.target)) active.context = tutorial.capture();
        if (popupSession?.kind === 'notes' && popupSession.popup.contains(event.target) && event.target.matches('.amb-large-text-editor__textarea')) {
            const session = popupSession;
            if (notify('notes-input', { text: event.target.value, before: String(session.before ?? '') }, session.context)) session.context = tutorial.capture();
        }
        if (active && active.cell.getElement().contains(event.target)) {
            active.temporary = event.target.value;
            active.typed = true;
            if (notify('temporary', { before: active.before, temporary: active.temporary, field: active.cell.getField(), continued: active.continued }, active.context)) active.context = tutorial.capture();
        }
        if (dialogCandidate && statusDialog.overlay?.contains(event.target) && event.target.matches('.amb-lookup-dialog__search')) {
            if (!dialogCandidate.context) {
                const context = tutorial.capture();
                if (context?.stepId !== 'dialog-lookup') return;
                dialogCandidate.context = context;
                observeDialog();
            }
            dialogCandidate.pendingSearch = event.target.value.trim();
            queueMicrotask(syncHighlight);
        }
    };
    const onEditing = cell => {
        const element = cell.getElement();
        active = { cell, before: cell.getValue(), temporary: cell.getValue(), openedBy: intent?.cell === element ? intent.kind : null,
            context: tutorial.capture(), typed: false, dialog: false, confirmed: false, cancelled: false };
        intent = null;
        clearHighlight();
        if (dateRequest || notesRequest) queueMicrotask(checkPopup);
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
        const payload = { before: edit.before, after: cell.getValue(), committed: true, openedBy: edit.openedBy, existing: data.id != null,
            changedRow: Boolean(row?.hasChanges), field: cell.getField(), sameRow: cell.getElement().closest('.tabulator-row') === targetRow, confirmed: edit.confirmed, typed: edit.typed, dialog: edit.dialog, valid: statusOptions.includes(cell.getValue()) };
        if (cell.getField() === 'status' && dialogCandidate?.selected) {
            commitObserver?.disconnect();
            commitObserver = null;
            notify('dialog-select', { selected: dialogCandidate.searched, applied: cell.getValue() === dialogCandidate.selected.id, valid: payload.valid }, dialogCandidate.context);
            dialogCandidate = null;
        } else if (cell.getField() === 'status') {
            const oldId = directRowId;
            const oldRow = directRow;
            directRowId = data.id;
            directRow = { getElement: () => cell.getRow().getElement?.() || cell.getElement().closest('.tabulator-row') };
            if (!notify('direct', payload, edit.context)) { directRowId = oldId; directRow = oldRow; }
        } else if (popupSession?.cell === cell && popupSession.kind === 'date') {
            const session = popupSession;
            const value = cell.getValue();
            const match = typeof value === 'string' && /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
            const date = match && new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
            const valid = Boolean(match && date.getFullYear() === Number(match[3]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[1]));
            const selected = session.selected instanceof Date && date && session.selected.getFullYear() === date.getFullYear() && session.selected.getMonth() === date.getMonth() && session.selected.getDate() === date.getDate();
            notify('date-commit', { selected, valid, before: session.before, after: value, committed: true, applied: data.lastCheckDate === value }, session.context);
            popupSession = null;
        } else if (popupSession?.cell === cell && popupSession.kind === 'notes') {
            const session = popupSession;
            const value = cell.getValue();
            queueMicrotask(() => {
                if (popupSession !== session) return;
                notify('notes-save', { saved: session.saved, closed: !session.popup.isConnected, before: session.before, after: value, committed: true, applied: data.notes === value }, session.context);
                popupSession = null;
                syncHighlight();
            });
        }
        else if (edit.confirmed) notify('edit', payload, edit.context);
        syncHighlight();
    };
    const onCancelled = cell => {
        if (!active || active.cell !== cell) return;
        f2Intent = null;
        const edit = active;
        active = null;
        if (popupSession?.cell === cell) popupSession = null;
        dateRequest = null; notesRequest = null; popupObserver?.disconnect(); popupObserver = null;
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
            const accepted = context.actionIndex > 0 || notify('dialog-open', { opened, key: 'F2' }, request.context);
            if (opened && accepted) {
                dialogCandidate = { context: tutorial.capture(), selected: null, searched: false };
                observeDialog();
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
    app.addEventListener('dblclick', onDoubleClick, true);
    app.addEventListener('keydown', onKey, true);
    app.addEventListener('focusin', onFocus, true);
    document.addEventListener('input', onInput, true);
    document.addEventListener('keydown', onDocumentKey, true);
    document.addEventListener('changeDate', onDateChange, true);
    document.addEventListener('hide', onDateHide, true);
    document.addEventListener('click', onDocumentClick, true);
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
        added(row, context, ready) {
            const data = row?.getData?.();
            const report = demo.getStateReport().rows.find(item => item.tempId && item.tempId === data?._ambTempId);
            return notify('added', { present: Boolean(data?._ambTempId) && demo.getData().some(item => item._ambTempId === data._ambTempId), ready, state: report?.state, code: data?.itemCode }, context);
        },
        partialOpened(payload, context, opened, button) {
            partialButton = button;
            if (notify('partial-open', { opened, valid: payload.hasValidChanges, invalid: payload.hasInvalidChanges }, context)) return tutorial.capture();
            syncHighlight();
            return context;
        },
        partialClosed() { partialButton = null; syncHighlight(); },
        partialSaved(context, confirmed, result, saved, report, prepared) {
            const backendSaved = ['inserted', 'updated', 'deleted'].reduce((total, key) => total + (result.saved?.[key]?.length || 0), 0);
            partialSummary = { saved: saved.saved.length, pending: report.invalidChangedRowsCount };
            const accepted = notify('partial-saved', { confirmed, ok: result.ok, prepared, backendSaved, saved: saved.saved.length, pendingInvalid: report.invalidChangedRowsCount }, context);
            if (!accepted) partialSummary = null;
            return accepted;
        },
        destroy() {
            destroyed = true;
            clearTracking();
            launch.removeEventListener('click', onLaunch);
            app.removeEventListener('pointerdown', onPointer, true);
            app.removeEventListener('dblclick', onDoubleClick, true);
            app.removeEventListener('keydown', onKey, true);
            app.removeEventListener('focusin', onFocus, true);
            document.removeEventListener('input', onInput, true);
            document.removeEventListener('keydown', onDocumentKey, true);
            document.removeEventListener('changeDate', onDateChange, true);
            document.removeEventListener('hide', onDateHide, true);
            document.removeEventListener('click', onDocumentClick, true);
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
