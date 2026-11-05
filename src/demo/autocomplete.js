import { AMB } from '../index.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';
import { createDemoCommandGuideToolbar } from './utils/demo-command-guide-toolbar.js';
import { createDemoActionTutorial } from './components/demo-action-tutorial.js';
import { demoIcon } from './demo-icons.js';
import { publicExampleTranslations } from './example-copy.js';

const departments = [
    'Administration',
    'Accounting',
    'Business Development',
    'Customer Care',
    'Design',
    'Engineering',
    'Finance',
    'Human Resources',
    'Information Technology',
    'Legal',
    'Logistics',
    'Marketing',
    'Operations',
    'Product',
    'Purchasing',
    'Quality Assurance',
    'Research and Development',
    'Sales',
    'Security',
    'Support'
];

const tags = [
    'approved',
    'blocked',
    'business',
    'external',
    'follow-up',
    'internal',
    'important',
    'pending',
    'priority',
    'review',
    'security',
    'support',
    'urgent'
];

const cities = [
    'Amsterdam',
    'Athens',
    'Bari',
    'Barcelona',
    'Berlin',
    'Bilbao',
    'Bologna',
    'Bordeaux',
    'Boston',
    'Bremen',
    'Brussels',
    'Budapest',
    'Copenhagen',
    'Dublin',
    'Florence',
    'Frankfurt',
    'Geneva',
    'Hamburg',
    'Helsinki',
    'Lisbon',
    'London',
    'Madrid',
    'Manchester',
    'Marseille',
    'Milan',
    'Munich',
    'Naples',
    'Oslo',
    'Paris',
    'Prague',
    'Riga',
    'Rome',
    'Rotterdam',
    'Stockholm',
    'Turin',
    'Valencia',
    'Venice',
    'Vienna',
    'Warsaw'
];

const buildReport = result => {
    const lines = [
        `Validation result: ${result.isValid ? 'valid' : 'invalid'}`,
        `Errors: ${result.errors.length}`,
        ''
    ];

    if (result.errors.length === 0) {
        lines.push('Strict values are allowed and custom free values are accepted.');
        return lines.join('\n');
    }

    result.errors.forEach(error => {
        const rowLabel = error.rowNumber !== null && error.rowNumber !== undefined
            ? `Row ${error.rowNumber}`
            : `ID ${error.id || error.tempId || 'unknown'}`;

        lines.push(`- ${rowLabel}, ${error.field}: ${error.message}`);
    });

    lines.push('');
    lines.push('Unknown strict values remain visible and are reported above.');
    lines.push('Custom values in the free column are accepted.');

    return lines.join('\n');
};

const createAutocompleteData = () => [
    { id: 1, task: 'Prepare onboarding pack', department: 'Human Resources', requiredDepartment: 'Administration', tag: 'internal', city: 'Milan' },
    { id: 2, task: 'Review access controls', department: 'Information Technology', requiredDepartment: 'Security', tag: 'review', city: 'Berlin' },
    { id: 3, task: 'Check monthly close', department: 'Finance', requiredDepartment: 'Accounting', tag: 'urgent', city: 'London' },
    { id: 4, task: 'Update support workflow', department: 'Operations', requiredDepartment: 'Support', tag: 'external', city: 'Rome' },
    { id: 5, task: 'Draft campaign brief', department: 'Marketing', requiredDepartment: 'Design', tag: 'priority', city: 'Paris' },
    { id: 6, task: 'Plan delivery route', department: 'Logistics', requiredDepartment: 'Purchasing', tag: 'support', city: 'Bologna' },
    { id: 7, task: 'Review supplier terms', department: 'Legal', requiredDepartment: 'Purchasing', tag: 'approved', city: 'Madrid' },
    { id: 8, task: 'Prepare product research', department: 'Product', requiredDepartment: 'Research and Development', tag: 'important', city: 'Amsterdam' },
    { id: 9, task: 'Schedule quality audit', department: 'Quality Assurance', requiredDepartment: 'Engineering', tag: 'pending', city: 'Vienna' },
    { id: 10, task: 'Update sales forecast', department: 'Sales', requiredDepartment: 'Business Development', tag: 'business', city: 'Boston' }
];

export default function autocomplete(app) {
    app.innerHTML = `
        <div class="demo-crud-heading">
            <h2 data-i18n="examples.autocomplete.title">Autocomplete</h2>
            <div class="demo-crud-heading__commands">
                <button type="button" class="demo-crud-tutorial-launch" data-action="tutorial-launch" aria-controls="autocomplete-tutorial" aria-expanded="false">${demoIcon('tutorialPlay', { size: 21, strokeWidth: 2.6 })}<span>Start tutorial</span></button>
        ${createDemoColumnGuide({
            summary: 'Autocomplete Technical Guide',
            summaryKey: 'examples.autocomplete.detailsTitle',
            summaryMeta: 'Assisted input · suggestions', summaryMetaKey: 'examples.autocomplete.guideMeta', summaryIcon: 'guideText', variant: 'technical',
            intro: 'This example shows assisted input with dynamic suggestions. Compare fields that require a listed value with fields that also accept custom values.',
            introKey: 'examples.autocomplete.guideIntro',
            points: [
                { title: 'Suggestions', titleKey: 'examples.autocomplete.point1Title', description: 'Matching options appear and narrow while you type.', descriptionKey: 'examples.autocomplete.detail1' },
                { title: 'Strict values', titleKey: 'examples.autocomplete.point2Title', description: 'Department fields require a value from the supplied list.', descriptionKey: 'examples.autocomplete.detail2' },
                { title: 'Free values', titleKey: 'examples.autocomplete.point3Title', description: 'Tag and city also accept custom values that are not in the suggestions.', descriptionKey: 'examples.autocomplete.detail3' },
                { title: 'Keyboard', titleKey: 'examples.autocomplete.point4Title', description: 'Use the arrow keys to navigate suggestions and confirm without leaving the keyboard.', descriptionKey: 'examples.autocomplete.detail4' },
                { title: 'Committed value', titleKey: 'examples.autocomplete.point5Title', description: 'The confirmed option becomes the cell value used by validation and the CRUD payload.', descriptionKey: 'examples.autocomplete.detail5' }
            ],
            columns: [
                { title: 'ID', titleKey: 'guides.autocomplete.id.title', badge: 'READONLY', description: 'Persistent identifier for the example row.', descriptionKey: 'guides.autocomplete.id.description' },
                { title: 'Task', titleKey: 'guides.autocomplete.task.title', badge: 'TEXT', description: 'Trimmed free text with an 80-character editor limit.', descriptionKey: 'guides.autocomplete.task.description' },
                { title: 'Department strict', titleKey: 'guides.autocomplete.strict.title', badge: 'STRICT', description: 'Optional value, but when entered it must match the department list.', descriptionKey: 'guides.autocomplete.strict.description' },
                { title: 'Department required', titleKey: 'guides.autocomplete.required.title', badge: 'REQUIRED', description: 'Must contain a department selected from the supplied list.', descriptionKey: 'guides.autocomplete.required.description' },
                { title: 'Free autocomplete', titleKey: 'guides.autocomplete.free.title', badge: 'FREE', description: 'Suggests known tags while also accepting a custom value.', descriptionKey: 'guides.autocomplete.free.description' },
                { title: 'Long list (max 5)', titleKey: 'guides.autocomplete.city.title', badge: 'MAX 5', description: 'Suggests at most five matching cities and accepts custom text.', descriptionKey: 'guides.autocomplete.city.description' }
            ]
        })}
            </div>
        </div>
        <p class="demo-note" data-i18n="examples.autocomplete.intro">Autocomplete helps users choose suggested values while AMB Grid controls commit, validation, and row state.</p>
        <div class="demo-action-tutorial-host"></div>
        <div class="demo-table-workbench">
            <div class="demo-command-guide-host"></div>
            <div id="autocomplete-table" class="demo-business-grid demo-business-grid--viewport"></div>
        </div>
    `;

    let destroyed = false;
    let activeEdit = null;
    let demo = null;
    let tutorialState = null;
    let highlightedControl = null;
    let highlightedStep = null;
    let tutorialStarted = false;
    let scenarioGeneration = 0;
    const t = key => publicExampleTranslations[document.documentElement.lang === 'en' ? 'en' : 'it'][`examples.autocomplete.${key}`];
    const tutorialLaunch = app.querySelector('[data-action="tutorial-launch"]');
    const tutorialLaunchLabel = tutorialLaunch.querySelector('span');
    const technicalGuide = app.querySelector('.demo-crud-heading .demo-disclosure--technical');
    const technicalGuideSummary = technicalGuide.querySelector('summary');
    const tutorial = createDemoActionTutorial({
        host: app.querySelector('.demo-action-tutorial-host'),
        variant: 'crud',
        tutorialCopyPrefix: 'examples.autocomplete',
        initiallyHidden: true,
        externalOpenButton: tutorialLaunch,
        panelId: 'autocomplete-tutorial',
        locale: document.documentElement.lang === 'en' ? 'en' : 'it',
        titleKey: 'examples.autocomplete.tutorialTitle',
        completedKey: 'examples.autocomplete.tutorialCompleted',
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
                id: 'show-suggestions', actionId: 'suggestions-open', instructionKey: 'examples.autocomplete.tutorialSuggestions',
                isComplete: ({ id, field, typed, options }) => id === 1 && field === 'requiredDepartment'
                    && typed !== 'Administration' && options.includes('Security')
            },
            {
                id: 'choose-department', actionId: 'department-committed', instructionKey: 'examples.autocomplete.tutorialChoose',
                isComplete: ({ id, field, value, selected, previous, row, editorClosed }) => id === 1
                    && field === 'requiredDepartment' && value === 'Security' && selected === value
                    && previous !== value && departments.includes(value) && editorClosed
                    && row?.state === 'modified' && row.after?.requiredDepartment === value
                    && !row.cellErrors.some(error => error.field === field)
            },
            {
                id: 'enter-free-value', actionId: 'free-value-committed', instructionKey: 'examples.autocomplete.tutorialFree',
                isComplete: ({ id, field, value, previous, row, editorClosed }) => id === 1
                    && field === 'tag' && typeof value === 'string' && value.trim().length > 0
                    && value !== previous && !tags.includes(value) && editorClosed
                    && row?.state === 'modified' && row.after?.tag === value
                    && !row.cellErrors.some(error => error.field === field)
            }
        ]
    });
    const commandGuideToolbar = createDemoCommandGuideToolbar(app);
    demo = AMB.table({
        selector: '#autocomplete-table',
        toolbar: {
            buttons: [
                'reload',
                {
                    id: 'validate-autocomplete',
                    label: 'Validate autocomplete',
                    title: 'Validate autocomplete values',
                    onClick: handleValidateAutocomplete
                },
                {
                    id: 'create-autocomplete-anomalies',
                    label: 'Create anomalies',
                    title: 'Create invalid strict autocomplete values',
                    onClick: handleCreateAutocompleteAnomalies
                },
                commandGuideToolbar.button
            ],
            onReload: handleReload
        },
        data: createAutocompleteData(),
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', minWidth: 65, widthGrow: 0.4, cssClass: 'demo-cell--passive' },
            {
                title: 'Task',
                field: 'task',
                minWidth: 155,
                widthGrow: 1.45,
                editor: AMB.editors.text({ trim: true, maxLength: 80 })
            },
            {
                title: 'Department strict',
                field: 'department',
                minWidth: 145,
                widthGrow: 1.15,
                editor: AMB.editors.autocomplete(departments, {
                    allowEmpty: true,
                    allowCustomValue: false,
                    invalidBehavior: 'commitRaw',
                    placeholder: 'Type to search...'
                }),
                validation: {
                    allowedValues: {
                        values: departments,
                        trim: true,
                        caseSensitive: false,
                        message: 'Choose a department from the list'
                    }
                }
            },
            {
                title: 'Department required',
                field: 'requiredDepartment',
                minWidth: 150,
                widthGrow: 1.2,
                editor: AMB.editors.autocomplete(departments, {
                    allowEmpty: false,
                    allowCustomValue: false,
                    invalidBehavior: 'commitRaw',
                    placeholder: 'Type to search...'
                }),
                validation: {
                    required: {
                        message: 'Department is required'
                    },
                    allowedValues: {
                        values: departments,
                        trim: true,
                        caseSensitive: false,
                        message: 'Choose a department from the list'
                    }
                }
            },
            {
                title: 'Free autocomplete',
                field: 'tag',
                minWidth: 125,
                widthGrow: 0.9,
                editor: AMB.editors.autocomplete(tags, {
                    allowEmpty: true,
                    allowCustomValue: true,
                    placeholder: 'Type or add a tag...'
                })
            },
            {
                title: 'Long list (max 5)',
                field: 'city',
                minWidth: 135,
                widthGrow: 1,
                editor: AMB.editors.autocomplete(cities, {
                    allowEmpty: true,
                    allowCustomValue: true,
                    maxOptions: 5,
                    placeholder: 'Try B, M, or R...'
                })
            }
        ]
    });
    tutorialLaunch.addEventListener('click', handleTutorialLaunch);
    commandGuideToolbar.mount();
    const reportDialog = createDemoReportDialog();
    const originalDestroy = demo.destroy.bind(demo);

    const handleEditStart = cell => {
        activeEdit = {
            cell,
            id: cell.getRow().getData().id,
            field: cell.getField(),
            previous: cell.getValue(),
            selected: null,
            context: tutorial.capture()
        };
        globalThis.requestAnimationFrame(syncTutorialHighlight);
    };
    const handleEditorInput = event => {
        if (activeEdit?.cell.getElement().contains(event.target)) {
            activeEdit.selected = null;
            syncTutorialHighlight();
        }
    };
    const handleSuggestionsOpen = event => {
        const edit = activeEdit;
        if (!edit || !edit.cell.getElement().contains(event.target)) return;
        const input = event.target;
        const list = document.getElementById(input.getAttribute('aria-controls'));
        if (input.getAttribute('aria-expanded') !== 'true' || !list || list.hidden) return;
        const options = [...list.querySelectorAll('[role="option"]')].map(option => option.textContent.trim());
        const advanced = tutorial.notify('suggestions-open', {
            id: edit.id, field: edit.field, typed: input.value, options
        }, edit.context);
        if (advanced) edit.context = tutorial.capture();
        syncTutorialHighlight();
    };
    const handleSuggestionChosen = event => {
        const edit = activeEdit;
        if (!edit || !edit.cell.getElement().contains(event.target)) return;
        edit.selected = String(event.text?.value ?? event.text ?? '');
    };
    const handleEditCancelled = () => { activeEdit = null; syncTutorialHighlight(); };
    const handleEditConfirmed = cell => {
        const edit = activeEdit;
        activeEdit = null;
        if (destroyed || !edit || edit.cell !== cell) return;
        const value = cell.getValue();
        const row = demo.getStateReport().rows.find(item => item.id === edit.id);
        const payload = {
            id: edit.id, field: edit.field, value, previous: edit.previous,
            selected: edit.selected, row,
            editorClosed: !cell.getElement().querySelector('.amb-autocomplete-editor')
        };
        tutorial.notify(edit.field === 'requiredDepartment' ? 'department-committed' : 'free-value-committed', payload, edit.context);
        syncTutorialHighlight();
    };
    demo.table.on('cellEditing', handleEditStart);
    demo.table.on('cellEditCancelled', handleEditCancelled);
    demo.table.on('cellEdited', handleEditConfirmed);
    demo.table.on('renderComplete', syncTutorialHighlight);
    demo.table.on('scrollVertical', syncTutorialHighlight);
    demo.table.on('scrollHorizontal', syncTutorialHighlight);
    demo.table.on('dataFiltered', syncTutorialHighlight);
    document.addEventListener('input', handleEditorInput, true);
    document.addEventListener('awesomplete-open', handleSuggestionsOpen, true);
    document.addEventListener('awesomplete-close', syncTutorialHighlight, true);
    document.addEventListener('awesomplete-highlight', handleSuggestionChosen, true);
    document.addEventListener('awesomplete-selectcomplete', handleSuggestionChosen, true);
    window.addEventListener('amb-demo-language-change', syncTutorialLaunchLabel);
    syncTutorialHighlight();

    demo.destroy = () => {
        destroyed = true;
        scenarioGeneration += 1;
        clearTutorialHighlight();
        activeEdit = null;
        tutorialLaunch.removeEventListener('click', handleTutorialLaunch);
        window.removeEventListener('amb-demo-language-change', syncTutorialLaunchLabel);
        demo.table.off('cellEditing', handleEditStart);
        demo.table.off('cellEditCancelled', handleEditCancelled);
        demo.table.off('cellEdited', handleEditConfirmed);
        demo.table.off('renderComplete', syncTutorialHighlight);
        demo.table.off('scrollVertical', syncTutorialHighlight);
        demo.table.off('scrollHorizontal', syncTutorialHighlight);
        demo.table.off('dataFiltered', syncTutorialHighlight);
        document.removeEventListener('input', handleEditorInput, true);
        document.removeEventListener('awesomplete-open', handleSuggestionsOpen, true);
        document.removeEventListener('awesomplete-close', syncTutorialHighlight, true);
        document.removeEventListener('awesomplete-highlight', handleSuggestionChosen, true);
        document.removeEventListener('awesomplete-selectcomplete', handleSuggestionChosen, true);
        reportDialog.destroy();
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
        tutorialStarted = true;
        tutorial.reopen();
    }

    function finishTutorial({ openGuide }) {
        if (destroyed) return;
        tutorialStarted = false;
        syncTutorialLaunchLabel();
        if (openGuide) {
            technicalGuide.open = true;
            technicalGuideSummary.focus({ preventScroll: true });
        } else tutorialLaunch.focus({ preventScroll: true });
    }

    function clearTutorialHighlight() {
        highlightedControl?.classList.remove('demo-crud-tutorial-target', 'demo-crud-tutorial-target--pulse', 'demo-crud-tutorial-target--rays');
        highlightedControl = null;
    }

    function syncTutorialHighlight() {
        if (!demo || destroyed || !tutorialState || tutorialState.hidden || tutorialState.complete
            || tutorialState.resetting || tutorialState.restartFailed || tutorialState.destroyed) {
            clearTutorialHighlight();
            highlightedStep = null;
            return;
        }
        if (highlightedStep !== tutorialState.stepId) {
            clearTutorialHighlight();
            highlightedStep = tutorialState.stepId;
        }
        const field = tutorialState.stepId === 'enter-free-value' ? 'tag' : 'requiredDepartment';
        const cell = demo.table.getRow(1)?.getCell(field)?.getElement();
        let target = cell;
        if (cell && activeEdit?.cell.getElement() === cell) {
            const input = cell.querySelector('.amb-autocomplete-editor');
            const list = input?.getAttribute('aria-expanded') === 'true'
                ? document.getElementById(input.getAttribute('aria-controls')) : null;
            const securityOption = tutorialState.stepId === 'choose-department' && list && !list.hidden
                ? [...list.querySelectorAll('[role="option"]')].find(option => option.textContent.trim() === 'Security') : null;
            target = securityOption || input?.closest('.awesomplete') || cell;
        }
        const rays = Boolean(target && target !== cell);
        if (target?.isConnected && target.getClientRects().length > 0) {
            if (highlightedControl === target && target.classList.contains('demo-crud-tutorial-target')
                && target.classList.contains('demo-crud-tutorial-target--pulse')
                && target.classList.contains('demo-crud-tutorial-target--rays') === rays) return;
            clearTutorialHighlight();
            target.classList.add('demo-crud-tutorial-target', 'demo-crud-tutorial-target--pulse');
            if (rays) target.classList.add('demo-crud-tutorial-target--rays');
            highlightedControl = target;
        } else clearTutorialHighlight();
    }

    async function resetTutorialScenario() {
        const generation = ++scenarioGeneration;
        activeEdit = null;
        clearTutorialHighlight();
        demo.table.cancelEdit?.();
        reportDialog.close();
        demo.feedback.clear();
        await demo.setData(createAutocompleteData());
        if (destroyed || generation !== scenarioGeneration) return false;
        syncTutorialHighlight();
        return true;
    }

    function handleValidateAutocomplete() {
        const result = demo.crud.validateAll();

        reportDialog.open({
            title: 'Autocomplete validation report',
            reportText: buildReport(result),
            jsonData: result
        });
    }

    async function handleCreateAutocompleteAnomalies() {
        demo.feedback.clear();
        demo.crud.updateRow(2, {
            department: 'Unknown department',
            requiredDepartment: '',
            tag: 'custom-note'
        });
        demo.crud.updateRow(3, {
            requiredDepartment: 'Unknown department'
        });

        await new Promise(resolve => window.setTimeout(resolve, 0));
        demo.crud.validateChanges();
        demo.feedback.show({
            type: 'warning',
            message: 'Autocomplete anomalies created. Validate to inspect the report.'
        });
    }

    async function handleReload() {
        if (await resetTutorialScenario()) demo.feedback.show({
            type: 'success', message: 'Autocomplete demo data reloaded.'
        });
    }

    return demo;
}
