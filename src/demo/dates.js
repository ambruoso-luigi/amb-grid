import { AMB } from '../index.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';
import { decorateDemoEditorButtons } from './utils/decorate-demo-editor-button.js';
import { createDemoCommandGuideToolbar } from './utils/demo-command-guide-toolbar.js';
import { createDemoActionTutorial } from './components/demo-action-tutorial.js';
import { demoIcon } from './demo-icons.js';
import { publicExampleTranslations } from './example-copy.js';

const minDate = '2025-01-01';
const maxDate = '2027-12-31';

const dateItManual = AMB.date.createConfig({
    format: 'dd/mm/yyyy',
    minDate,
    maxDate,
    mode: 'manual',
    messages: {
        syntax: 'Use D/M/YYYY or DD/MM/YYYY',
        calendar: 'Enter a real calendar date',
        minDate: 'Date must be on or after 01/01/2025',
        maxDate: 'Date must be on or before 31/12/2027'
    }
});

const dateItPicker = AMB.date.createConfig({
    format: 'dd/mm/yyyy',
    minDate,
    maxDate,
    mode: 'manualWithPickerButton',
    messages: dateItManual.validator.messages
});

const dateIsoManual = AMB.date.createConfig({
    format: 'iso',
    minDate,
    maxDate,
    mode: 'manual',
    messages: {
        syntax: 'Use YYYY-M-D or YYYY-MM-DD',
        calendar: 'Enter a real calendar date',
        minDate: 'Date must be on or after 2025-01-01',
        maxDate: 'Date must be on or before 2027-12-31'
    }
});

const dateCompactManual = AMB.date.createConfig({
    format: 'legacy',
    minDate,
    maxDate,
    mode: 'manual',
    messages: {
        syntax: 'Use exactly 8 digits in YYYYMMDD format',
        calendar: 'Enter a real calendar date',
        minDate: 'Date must be on or after 20250101',
        maxDate: 'Date must be on or before 20271231'
    }
});

const dateDashPickerOnly = AMB.date.createConfig({
    format: 'dd-mm-yyyy',
    minDate,
    maxDate,
    mode: 'pickerOnly',
    messages: {
        syntax: 'Use DD-MM-YYYY',
        calendar: 'Enter a real calendar date',
        minDate: 'Date must be on or after 01-01-2025',
        maxDate: 'Date must be on or before 31-12-2027'
    }
});

const dateData = [
    { id: 1, eventName: 'Planning review', manualDate: '05/06/2026', pickerDate: '12/06/2026', isoDate: '2026-06-05', compactDate: '20260605', pickerOnlyDate: '15-06-2026' },
    { id: 2, eventName: 'Customer workshop', manualDate: '20/07/2026', pickerDate: '21/07/2026', isoDate: '2026-07-20', compactDate: '20260720', pickerOnlyDate: '22-07-2026' },
    { id: 3, eventName: 'Inventory audit', manualDate: '14/01/2025', pickerDate: '16/01/2025', isoDate: '2025-01-14', compactDate: '20250114', pickerOnlyDate: '18-01-2025' },
    { id: 4, eventName: 'Supplier meeting', manualDate: '09/03/2025', pickerDate: '10/03/2025', isoDate: '2025-03-09', compactDate: '20250309', pickerOnlyDate: '11-03-2025' },
    { id: 5, eventName: 'Release checkpoint', manualDate: '28/09/2025', pickerDate: '29/09/2025', isoDate: '2025-09-28', compactDate: '20250928', pickerOnlyDate: '30-09-2025' },
    { id: 6, eventName: 'Budget approval', manualDate: '11/02/2026', pickerDate: '12/02/2026', isoDate: '2026-02-11', compactDate: '20260211', pickerOnlyDate: '13-02-2026' },
    { id: 7, eventName: 'Quality inspection', manualDate: '04/11/2026', pickerDate: '05/11/2026', isoDate: '2026-11-04', compactDate: '20261104', pickerOnlyDate: '06-11-2026' },
    { id: 8, eventName: 'Contract renewal', manualDate: '17/04/2027', pickerDate: '18/04/2027', isoDate: '2027-04-17', compactDate: '20270417', pickerOnlyDate: '19-04-2027' },
    { id: 9, eventName: 'Training session', manualDate: '23/08/2027', pickerDate: '24/08/2027', isoDate: '2027-08-23', compactDate: '20270823', pickerOnlyDate: '25-08-2027' },
    { id: 10, eventName: 'Year-end review', manualDate: '15/12/2027', pickerDate: '16/12/2027', isoDate: '2027-12-15', compactDate: '20271215', pickerOnlyDate: '17-12-2027' }
];

const getLanguage = () => document.documentElement.lang === 'en' ? 'en' : 'it';

export default function dates(app) {
    app.innerHTML = `
        <div class="demo-crud-heading">
            <h2 data-i18n="examples.dates.title">Dates</h2>
            <div class="demo-crud-heading__commands">
                <button type="button" class="demo-crud-tutorial-launch" data-action="tutorial-launch" aria-controls="dates-tutorial" aria-expanded="false">${demoIcon('tutorialPlay', { size: 21, strokeWidth: 2.6 })}<span>Start tutorial</span></button>
                ${createDemoColumnGuide({
                    summary: 'Dates technical guide',
                    summaryKey: 'examples.dates.detailsTitle',
                    summaryIcon: 'guideText', variant: 'technical',
                    intro: 'AMB Grid lets developers configure date formats, editing modes, and validation rules. This example compares manual typing, an optional calendar, and picker-only date selection.',
                    introKey: 'examples.dates.detailsText',
                    points: [
                        { title: 'Multiple formats', titleKey: 'examples.dates.point1Title', description: 'Manual, ISO-style, compact, and dash-separated dates use their declared formats.', descriptionKey: 'examples.dates.detail1' },
                        { title: 'Manual input', titleKey: 'examples.dates.point2Title', description: 'Manual date and Picker date allow typing.', descriptionKey: 'examples.dates.detail2' },
                        { title: 'Manual with calendar', titleKey: 'examples.dates.point3Title', description: 'Picker date also provides an optional calendar.', descriptionKey: 'examples.dates.detail3' },
                        { title: 'Picker only', titleKey: 'examples.dates.point4Title', description: 'Picker-only date uses the calendar.', descriptionKey: 'examples.dates.detail4' },
                        { title: 'Automatic validation', titleKey: 'examples.dates.point5Title', description: 'Committed dates are validated automatically.', descriptionKey: 'examples.dates.detail5' },
                        { title: 'Allowed range', titleKey: 'examples.dates.point6Title', description: 'Dates range from 01/01/2025 through 31/12/2027.', descriptionKey: 'examples.dates.detail6' }
                    ],
                    columns: [
                        { title: 'Event', titleKey: 'guides.dates.event.title', badge: 'TEXT', description: 'Editable event name.', descriptionKey: 'examples.dates.eventDescription' },
                        { title: 'Manual date', titleKey: 'guides.dates.manual.title', badge: 'DD/MM/YYYY', description: 'Manual input with calendar-date and range validation.', descriptionKey: 'examples.dates.manualDescription' },
                        { title: 'Picker date', titleKey: 'guides.dates.picker.title', badge: 'MANUAL + PICKER', description: 'Supports typing and calendar selection with F2 or the calendar button.', descriptionKey: 'examples.dates.pickerDescription' },
                        { title: 'ISO-style date', titleKey: 'guides.dates.iso.title', badge: 'ISO', description: 'Accepts year-month-day dates, such as YYYY-MM-DD.', descriptionKey: 'examples.dates.isoDescription' },
                        { title: 'Compact date', titleKey: 'guides.dates.compact.title', badge: 'YYYYMMDD', description: 'Uses an eight-digit compact format without separators.', descriptionKey: 'examples.dates.compactDescription' },
                        { title: 'Picker-only date', titleKey: 'guides.dates.pickerOnly.title', badge: 'PICKER', description: 'Selects dates through the calendar and displays them in DD-MM-YYYY format.', descriptionKey: 'examples.dates.pickerOnlyDescription' }
                    ]
                })}
            </div>
        </div>
        <p class="demo-note" data-i18n="examples.dates.intro">Explore different date formats, manual entry, calendar selection, and automatic date validation.</p>
        <div class="demo-action-tutorial-host"></div>
        <div class="demo-table-workbench">
            <div class="demo-command-guide-host"></div>
            <div id="dates-table" class="demo-business-grid demo-business-grid--viewport"></div>
        </div>
    `;

    let destroyed = false;
    let demo = null;
    let tutorialState = null;
    let tutorialStarted = false;
    let highlightedControl = null;
    let activeCandidate = null;
    let scenarioGeneration = 0;
    const editCandidates = new Map();
    const dateParser = AMB.parsers.date({ inputFormat: dateItPicker.editor.format, outputFormat: 'yyyy-mm-dd', allowEmpty: false });
    const pickerValidator = AMB.validators.date(dateItPicker.validator);
    const t = key => publicExampleTranslations[getLanguage()][`examples.dates.${key}`];
    const tutorialLaunch = app.querySelector('[data-action="tutorial-launch"]');
    const tutorialLaunchLabel = tutorialLaunch.querySelector('span');
    const technicalGuide = app.querySelector('.demo-crud-heading .demo-disclosure--technical');
    const tutorial = createDemoActionTutorial({
        host: app.querySelector('.demo-action-tutorial-host'),
        variant: 'crud', tutorialCopyPrefix: 'examples.dates',
        initiallyHidden: true, externalOpenButton: tutorialLaunch, panelId: 'dates-tutorial',
        locale: getLanguage(),
        titleKey: 'examples.dates.tutorialTitle',
        completedKey: 'examples.dates.tutorialCompleted',
        onRestart: resetTutorialScenario,
        onCompleteAction: resetTutorialScenario,
        onCompleteSuccess: finishTutorial,
        onStateChange: state => {
            tutorialState = state;
            tutorialLaunch.hidden = !state.hidden;
            tutorialLaunch.setAttribute('aria-expanded', String(!state.hidden));
            tutorialLaunchLabel.textContent = t(tutorialStarted ? 'tutorialResume' : 'tutorialStart');
            syncTutorialHighlight();
        },
        steps: [
            {
                id: 'manual-date', actionId: 'date-edited', instructionKey: 'examples.dates.tutorialManual',
                isComplete: ({ id, field, mode, valid }) => id === 1 && field === 'pickerDate' && mode === 'manual' && valid
            },
            {
                id: 'picker-date', actionId: 'date-edited', instructionKey: 'examples.dates.tutorialPicker',
                isComplete: ({ id, field, mode, valid }) => id === 2 && field === 'pickerDate' && mode === 'picker' && valid
            }
        ]
    });
    const commandGuideToolbar = createDemoCommandGuideToolbar(app);
    demo = AMB.table({
        selector: '#dates-table',
        toolbar: {
            buttons: [commandGuideToolbar.button]
        },
        data: dateData.map(row => ({ ...row })),
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', minWidth: 58, widthGrow: 0.4, cssClass: 'demo-cell--passive' },
            { title: 'Event', field: 'eventName', minWidth: 135, widthGrow: 1.35, editor: AMB.editors.text({ trim: true, maxLength: 80 }) },
            {
                title: 'Manual date', field: 'manualDate', minWidth: 115, widthGrow: 0.9,
                editor: AMB.editors.date(dateItManual.editor),
                formatter: AMB.formatters.date(dateItManual.formatter),
                validation: { date: dateItManual.validator }
            },
            {
                title: 'Picker date', field: 'pickerDate', minWidth: 115, widthGrow: 0.9,
                editor: AMB.editors.date(dateItPicker.editor),
                formatter: AMB.formatters.date(dateItPicker.formatter),
                validation: { date: dateItPicker.validator }
            },
            {
                title: 'ISO-style date', field: 'isoDate', minWidth: 125, widthGrow: 0.95,
                editor: AMB.editors.date(dateIsoManual.editor),
                formatter: AMB.formatters.date(dateIsoManual.formatter),
                validation: { date: dateIsoManual.validator }
            },
            {
                title: 'Compact date', field: 'compactDate', minWidth: 115, widthGrow: 0.9,
                editor: AMB.editors.date(dateCompactManual.editor),
                formatter: AMB.formatters.date(dateCompactManual.formatter),
                validation: { date: dateCompactManual.validator }
            },
            {
                title: 'Picker-only date', field: 'pickerOnlyDate', minWidth: 130, widthGrow: 1,
                cssClass: 'amb-cell--readonly-actionable amb-cell--actionable amb-cell--picker-only',
                editor: AMB.editors.date(dateDashPickerOnly.editor),
                formatter: AMB.formatters.date(dateDashPickerOnly.formatter),
                validation: { date: dateDashPickerOnly.validator }
            }
        ]
    });
    commandGuideToolbar.mount();
    tutorialLaunch.addEventListener('click', handleTutorialLaunch);
    window.addEventListener('amb-demo-language-change', syncTutorialLaunchLabel);
    demo.table.on('renderComplete', syncTutorialHighlight);
    demo.table.on('scrollVertical', syncTutorialHighlight);
    demo.table.on('scrollHorizontal', syncTutorialHighlight);
    syncTutorialHighlight();

    const stopDecoratingDateButtons = decorateDemoEditorButtons(app.querySelector('#dates-table'), {
        selector: '.amb-date-editor-picker-button',
        icon: 'date',
        label: 'Open calendar'
    });
    const originalDestroy = demo.destroy.bind(demo);

    const editKey = cell => `${cell.getRow().getData().id}:${cell.getField()}`;
    const detachPickerSelection = candidate => {
        candidate?.pickerAnchor?.removeEventListener('changeDate', handlePickerSelection, true);
        if (candidate) candidate.pickerAnchor = null;
    };
    const handleEditStart = cell => {
        const context = tutorial.capture();
        const id = cell.getRow().getData().id;
        const field = cell.getField();
        globalThis.requestAnimationFrame(syncTutorialHighlight);
        detachPickerSelection(activeCandidate);
        activeCandidate = null;
        if ((context?.stepId === 'manual-date' && id === 1 || context?.stepId === 'picker-date' && id === 2)
            && field === 'pickerDate') {
            activeCandidate = { context, id, field, cell, previous: cell.getValue(), generation: scenarioGeneration,
                mode: null, pickerOpened: false, selectedDate: null, pickerAnchor: null };
            editCandidates.set(editKey(cell), activeCandidate);
        }
    };
    const handleEditCancelled = cell => {
        const candidate = editCandidates.get(editKey(cell));
        editCandidates.delete(editKey(cell));
        detachPickerSelection(candidate);
        if (activeCandidate === candidate) activeCandidate = null;
    };
    const handleEditConfirmed = cell => {
        const key = editKey(cell);
        const candidate = editCandidates.get(key);
        editCandidates.delete(key);
        detachPickerSelection(candidate);
        if (activeCandidate === candidate) activeCandidate = null;
        if (destroyed || !candidate) return;
        const value = cell.getValue();
        const normalized = dateParser.parse(value);
        const previous = dateParser.parse(candidate.previous);
        const rowValue = dateParser.parse(cell.getRow().getData()[candidate.field]);
        const report = demo.getStateReport().rows.find(row => row.id === candidate.id);
        const valid = Boolean(normalized && previous && normalized !== previous && normalized === rowValue
            && pickerValidator.validate(value).isValid && report && !report.rowError
            && !report.cellErrors.some(error => error.field === candidate.field)
            && (candidate.mode !== 'picker' || candidate.pickerOpened && candidate.selectedDate === normalized));
        tutorial.notify('date-edited', {
            id: candidate.id, field: candidate.field, mode: candidate.mode, valid
        }, candidate.context);
        syncTutorialHighlight();
    };
    const pickerDateParser = AMB.parsers.date({ inputFormat: 'Date', outputFormat: 'yyyy-mm-dd', allowEmpty: false });
    const activeEditorContains = target => activeCandidate && activeCandidate.generation === scenarioGeneration
        && activeCandidate.cell.getElement().contains(target);
    const handleManualInput = event => {
        if (event.isTrusted && event.target.matches?.('.amb-date-editor') && activeEditorContains(event.target)) {
            activeCandidate.mode = 'manual';
            activeCandidate.selectedDate = null;
        }
    };
    const handlePickerShow = event => {
        if (event.target.matches?.('.amb-date-editor-picker-anchor') && activeEditorContains(event.target)) {
            activeCandidate.pickerOpened = true;
            if (activeCandidate.pickerAnchor !== event.target) {
                detachPickerSelection(activeCandidate);
                activeCandidate.pickerAnchor = event.target;
                event.target.addEventListener('changeDate', handlePickerSelection, true);
            }
        }
    };
    const handlePickerSelection = event => {
        const candidate = activeCandidate;
        if (!candidate || candidate.generation !== scenarioGeneration || candidate.pickerAnchor !== event.target) return;
        const selectedDate = pickerDateParser.parse(event.detail?.date);
        if (!candidate.pickerOpened || !selectedDate) return;
        candidate.mode = 'picker';
        candidate.selectedDate = selectedDate;
    };
    demo.table.on('cellEditing', handleEditStart);
    demo.table.on('cellEditCancelled', handleEditCancelled);
    demo.table.on('cellEdited', handleEditConfirmed);
    demo.table.on('cellEdited', syncTutorialHighlight);
    document.addEventListener('input', handleManualInput, true);
    document.addEventListener('show', handlePickerShow, true);

    demo.destroy = () => {
        destroyed = true;
        scenarioGeneration += 1;
        clearTutorialHighlight();
        detachPickerSelection(activeCandidate);
        editCandidates.clear();
        activeCandidate = null;
        tutorialLaunch.removeEventListener('click', handleTutorialLaunch);
        window.removeEventListener('amb-demo-language-change', syncTutorialLaunchLabel);
        demo.table.off('renderComplete', syncTutorialHighlight);
        demo.table.off('scrollVertical', syncTutorialHighlight);
        demo.table.off('scrollHorizontal', syncTutorialHighlight);
        demo.table.off('cellEditing', handleEditStart);
        demo.table.off('cellEditCancelled', handleEditCancelled);
        demo.table.off('cellEdited', handleEditConfirmed);
        demo.table.off('cellEdited', syncTutorialHighlight);
        document.removeEventListener('input', handleManualInput, true);
        document.removeEventListener('show', handlePickerShow, true);
        stopDecoratingDateButtons();
        commandGuideToolbar.destroy();
        tutorial.destroy();
        originalDestroy();
    };

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
    }

    function syncTutorialHighlight() {
        if (!demo || destroyed || !tutorialState || tutorialState.hidden || tutorialState.complete || tutorialState.resetting || tutorialState.restartFailed || tutorialState.destroyed) {
            clearTutorialHighlight();
            return;
        }
        const step = tutorialState.stepId;
        const rowId = step === 'picker-date' ? 2 : 1;
        const cell = demo.table.getRow(rowId)?.getCell('pickerDate')?.getElement();
        const pickerButton = step === 'picker-date' ? cell?.querySelector('.amb-date-editor-picker-button') : null;
        const target = pickerButton || cell;
        const rays = target === pickerButton;
        if (target?.isConnected && target.getClientRects().length > 0 && !target.matches(':disabled')) {
            if (highlightedControl === target && target.classList.contains('demo-crud-tutorial-target--pulse')) return;
            clearTutorialHighlight();
            target.classList.add('demo-crud-tutorial-target', 'demo-crud-tutorial-target--pulse');
            if (rays) target.classList.add('demo-crud-tutorial-target--rays');
            highlightedControl = target;
        } else clearTutorialHighlight();
    }

    async function resetTutorialScenario() {
        if (destroyed) return false;
        const generation = ++scenarioGeneration;
        try {
            detachPickerSelection(activeCandidate);
            editCandidates.clear();
            activeCandidate = null;
            demo.table.cancelEdit?.();
            await demo.setData(dateData.map(row => ({ ...row })));
            if (destroyed || generation !== scenarioGeneration) return false;
            syncTutorialHighlight();
            return !destroyed;
        } catch { return false; }
    }

    return demo;
}
