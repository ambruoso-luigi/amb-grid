import { AMB } from '../index.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';
import { createDemoCommandGuideToolbar } from './utils/demo-command-guide-toolbar.js';
import { createDemoActionTutorial } from './components/demo-action-tutorial.js';
import { createDemoCheckboxFormatter } from './utils/demo-checkbox.js';
import { demoIcon } from './demo-icons.js';
import { parserRowCopy, publicExampleTranslations } from './example-copy.js';

const normalizeDescription = value => {
    const text = String(value ?? '').trim();
    return text ? text.toUpperCase().replace(/\s+/g, '_') : null;
};
const descriptionParser = AMB.parsers.custom(normalizeDescription);

const parserFactories = {
    decimal: () => AMB.parsers.decimalToPayload(),
    integer: () => AMB.parsers.integerToPayload(),
    date: () => AMB.parsers.dateToPayload(),
    compactDate: () => AMB.parsers.dateToPayload(),
    dateTime: () => AMB.parsers.dateTimeToPayload(),
    time: () => AMB.parsers.timeToPayload(),
    boolean: () => AMB.parsers.booleanToPayload({ trueValue: 'Y', falseValue: 'N' }),
    emptyToNull: () => AMB.parsers.emptyToNull(),
    custom: () => descriptionParser
};

const textParserEditor = AMB.editors.text({ maxLength: 80 });
const formatBooleanInput = createDemoCheckboxFormatter();

const parserExamples = [
    { id: 1, type: 'Decimal', parserKey: 'decimal', parserName: 'decimalToPayload()', input: '12,50', description: 'Converts a comma-separated decimal into a normalized string using a decimal point.' },
    { id: 2, type: 'Integer', parserKey: 'integer', parserName: 'integerToPayload()', input: '1.234', description: 'Grouped integer to payload integer string.' },
    { id: 3, type: 'Date', parserKey: 'date', parserName: 'dateToPayload()', input: '16/06/2026', description: 'Date normalized to YYYY-MM-DD.' },
    { id: 4, type: 'Compact date', parserKey: 'compactDate', parserName: 'dateToPayload()', input: '20260616', description: 'Compact legacy date normalized to YYYY-MM-DD.' },
    { id: 5, type: 'DateTime', parserKey: 'dateTime', parserName: 'dateTimeToPayload()', input: '16/06/2026 14:30', description: 'Date and time normalized with seconds.' },
    { id: 6, type: 'Time', parserKey: 'time', parserName: 'timeToPayload()', input: '9:05', description: 'Time normalized to HH:MM:SS.' },
    { id: 7, type: 'Boolean', parserKey: 'boolean', parserName: 'booleanToPayload({ trueValue: \'Y\', falseValue: \'N\' })', input: true, description: 'Application boolean converted to a configured backend value.' },
    { id: 8, type: 'Empty to null', parserKey: 'emptyToNull', parserName: 'emptyToNull()', input: '   ', description: 'Whitespace-only input becomes a real null value.', acceptsNull: true },
    { id: 9, type: 'Custom', parserKey: 'custom', parserName: 'custom(normalizeDescription)', input: 'Main warehouse', description: 'Application-defined rule that converts a description into an uppercase code with underscores.' }
];

const feedbackCopy = {
    it: 'Il parser non riconosce questo input. Il valore normalizzato è null.',
    en: 'The parser cannot normalize this input. The parsed value is null.'
};

const parseExampleValue = example => {
    const createParser = parserFactories[example.parserKey];

    return createParser ? createParser().parse(example.input) : null;
};

const createParserData = () => parserExamples.map(example => ({
    ...example,
    parsedValue: parseExampleValue(example)
}));

const getParserRowText = data => {
    const language = document.documentElement.lang === 'en' ? 'en' : 'it';

    return parserRowCopy[language][data.parserKey] || [data.type, data.description];
};

const formatParserType = cell => {
    const data = cell.getRow().getData();
    const [type] = getParserRowText(data);
    const wrapper = document.createElement('span');
    const typeLabel = document.createElement('strong');
    const parserLabel = document.createElement('code');

    wrapper.className = 'demo-parser-type';
    typeLabel.textContent = type;
    parserLabel.textContent = data.parserName;
    wrapper.append(typeLabel, parserLabel);

    return wrapper;
};

const formatParserDescription = cell => {
    const [, description, emphasis] = getParserRowText(cell.getRow().getData());

    if (!emphasis) return description;

    const emphasisIndex = description.indexOf(emphasis);

    if (emphasisIndex < 0) return description;

    const wrapper = document.createElement('span');
    const accent = document.createElement('span');
    const afterEmphasis = description.slice(emphasisIndex + emphasis.length);

    accent.className = 'demo-text-accent';
    accent.textContent = emphasis;
    wrapper.append(
        document.createTextNode(description.slice(0, emphasisIndex)),
        accent,
        document.createTextNode(afterEmphasis)
    );

    return wrapper;
};

const formatParsedValue = cell => {
    const value = cell.getValue();
    const output = document.createElement('span');

    output.className = 'demo-parser-output';
    output.classList.toggle('demo-parser-output--null', value === null);
    output.textContent = value === null ? 'null' : String(value ?? '');

    return output;
};

const formatParserInput = cell => {
    if (cell.getRow().getData().parserKey !== 'boolean') {
        const text = document.createElement('span');
        text.textContent = String(cell.getValue() ?? '');
        return text;
    }

    return formatBooleanInput(cell);
};

export default function parsers(app) {
    app.innerHTML = `
        <div class="demo-crud-heading">
            <h2 data-i18n="examples.parsers.title">Parsers</h2>
            <div class="demo-crud-heading__commands">
                <button type="button" class="demo-crud-tutorial-launch" data-action="tutorial-launch" aria-controls="parsers-tutorial" aria-expanded="false">${demoIcon('tutorialPlay', { size: 21, strokeWidth: 2.6 })}<span>Start tutorial</span></button>
        ${createDemoColumnGuide({
            summary: 'Parsers technical guide',
            summaryKey: 'examples.parsers.detailsTitle',
            summaryIcon: 'guideText', variant: 'technical',
            intro: 'AMB Grid parsers transform user input into predictable backend-oriented values. This example demonstrates normalization of numbers, dates, times, booleans, and text using built-in and custom parsers.',
            introKey: 'examples.parsers.detailsText',
            points: [
                { title: 'Normalization', titleKey: 'examples.parsers.point1Title', description: 'Each row uses a parser to transform the Input value. The result is displayed immediately in the Parsed value column.', descriptionKey: 'examples.parsers.detail1' },
                { title: 'Payload format', titleKey: 'examples.parsers.point2Title', description: 'Parsed value represents the normalized result intended for the application or backend. For example, 125,50 becomes 125.50, and 8:30 becomes 08:30:00.', descriptionKey: 'examples.parsers.detail2' },
                { title: 'Parsers and validation', titleKey: 'examples.parsers.point3Title', description: 'A parser transforms a value into the desired format. Some parsers may return null when a format cannot be recognized, but validation and business rules remain separate responsibilities.', descriptionKey: 'examples.parsers.detail3' },
                { title: 'Built-in parsers', titleKey: 'examples.parsers.point4Title', description: 'AMB Grid includes parsers for integers, decimals, dates, date-times, times, booleans, and empty values. Parsers can be configured to match application-specific formats.', descriptionKey: 'examples.parsers.detail4' },
                { title: 'Custom parsers', titleKey: 'examples.parsers.point5Title', description: 'With AMB.parsers.custom(parseFn), developers can define JavaScript functions for application-specific transformations. In this example, a description is converted into an uppercase code with underscores replacing spaces.', descriptionKey: 'examples.parsers.detail5' }
            ],
            columns: [
                { title: 'Type', titleKey: 'guides.parsers.type.title', badge: 'PARSER', description: 'Identifies the transformation type and the public parser being used.', descriptionKey: 'guides.parsers.type.description' },
                { title: 'Input', titleKey: 'guides.parsers.input.title', badge: 'EDITABLE', description: 'User-provided value. The Boolean row uses a checkbox.', descriptionKey: 'guides.parsers.input.description' },
                { title: 'Parsed value', titleKey: 'guides.parsers.output.title', badge: 'READONLY', description: 'Normalized parser result, including a real null value.', descriptionKey: 'guides.parsers.output.description' },
                { title: 'Description', titleKey: 'guides.parsers.description.title', badge: 'INFO', description: 'Briefly explains the transformation performed by the row.', descriptionKey: 'guides.parsers.description.description' }
            ]
        })}
            </div>
        </div>
        <p class="demo-note" data-i18n="examples.parsers.intro">Edit Input values and see how parsers transform numbers, times, and text into normalized backend data.</p>
        <div class="demo-action-tutorial-host"></div>
        <div class="demo-table-workbench">
            <div class="demo-command-guide-host"></div>
            <div id="parsers-table" class="demo-business-grid demo-business-grid--viewport demo-parsers-grid"></div>
        </div>
    `;

    let destroyed = false;
    let demo = null;
    let tutorialState = null;
    let tutorialStarted = false;
    let highlightedControl = null;
    const t = key => publicExampleTranslations[document.documentElement.lang === 'en' ? 'en' : 'it'][`examples.parsers.${key}`];
    const tutorialLaunch = app.querySelector('[data-action="tutorial-launch"]');
    const tutorialLaunchLabel = tutorialLaunch.querySelector('span');
    const technicalGuide = app.querySelector('.demo-crud-heading .demo-disclosure--technical');
    let pendingResult = null;
    const editCandidates = new Map();
    const tutorial = createDemoActionTutorial({
        host: app.querySelector('.demo-action-tutorial-host'),
        variant: 'crud', tutorialCopyPrefix: 'examples.parsers',
        initiallyHidden: true, externalOpenButton: tutorialLaunch, panelId: 'parsers-tutorial',
        locale: document.documentElement.lang === 'en' ? 'en' : 'it',
        titleKey: 'examples.parsers.tutorialTitle',
        completedKey: 'examples.parsers.tutorialCompleted',
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
                id: 'parse-decimal', actionId: 'parser-updated', instructionKey: 'examples.parsers.tutorialDecimal',
                isComplete: ({ id, field, parserKey, previous, input, parsedValue }) => id === 1 && field === 'input'
                    && parserKey === 'decimal' && previous !== input && typeof input === 'string'
                    && input.includes(',') && typeof parsedValue === 'string' && /^-?\d+\.\d+$/.test(parsedValue)
            },
            {
                id: 'parse-time', actionId: 'parser-updated', instructionKey: 'examples.parsers.tutorialTime',
                isComplete: ({ id, field, parserKey, previous, input, parsedValue }) => id === 6 && field === 'input'
                    && parserKey === 'time' && previous !== input && typeof parsedValue === 'string'
                    && /^\d{2}:\d{2}:\d{2}$/.test(parsedValue)
            },
            {
                id: 'parse-custom', actionId: 'parser-updated', instructionKey: 'examples.parsers.tutorialCustom',
                isComplete: ({ id, field, parserKey, previous, input, parsedValue }) => id === 9 && field === 'input'
                    && parserKey === 'custom' && previous !== input && typeof input === 'string'
                    && /^\S+(?:\s+\S+)+$/.test(input.trim()) && typeof parsedValue === 'string' && parsedValue.length > 0
            }
        ]
    });
    const commandGuideToolbar = createDemoCommandGuideToolbar(app);
    demo = AMB.table({
        selector: '#parsers-table',
        toolbar: {
            buttons: [commandGuideToolbar.button]
        },
        data: createParserData(),
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', minWidth: 58, widthGrow: 0.35, cssClass: 'demo-cell--passive' },
            {
                title: 'Type', field: 'type', minWidth: 150, widthGrow: 1.0,
                editable: false,
                formatter: formatParserType,
                cssClass: 'demo-cell--passive demo-cell--derived'
            },
            {
                title: 'Input', field: 'input', minWidth: 190, widthGrow: 1.25,
                editor: textParserEditor,
                editable: cell => cell.getRow().getData().id !== 7,
                formatter: formatParserInput,
                cellClick: (event, cell) => {
                    const { id, parserKey } = cell.getRow().getData();
                    if (id !== 7 || parserKey !== 'boolean' || event.detail > 1) return;
                    cell.setValue(!cell.getValue());
                },
                cellEdited: handleInputEdited
            },
            {
                title: 'Parsed value', field: 'parsedValue', minWidth: 190, widthGrow: 1.20,
                editable: false,
                formatter: formatParsedValue,
                cssClass: 'demo-cell--passive demo-cell--derived'
            },
            {
                title: 'Description', field: 'description', minWidth: 300, widthGrow: 2.60,
                editable: false,
                formatter: formatParserDescription,
                cssClass: 'demo-cell--passive'
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
    const handleLanguageChange = () => demo.redraw(true);
    const originalDestroy = demo.destroy.bind(demo);
    const handleEditStart = cell => {
        if (cell.getField() !== 'input') return;
        pendingResult = null;
        editCandidates.clear();
        const context = tutorial.capture();
        if (!context) return;
        const id = cell.getRow().getData().id;
        editCandidates.set(id, { context, id, field: 'input', previous: cell.getValue() });
    };
    const handleEditCancelled = cell => {
        editCandidates.delete(cell.getRow().getData().id);
        pendingResult = null;
    };
    const handleRowUpdated = row => {
        const candidate = pendingResult;
        if (destroyed || !candidate || row.getData().id !== candidate.id) return;
        const data = row.getData();
        if (data.input !== candidate.input || data.parsedValue !== candidate.expectedParsedValue) return;
        pendingResult = null;
        tutorial.notify('parser-updated', {
            ...candidate, parserKey: data.parserKey, input: data.input, parsedValue: data.parsedValue
        }, candidate.context);
    };

    window.addEventListener('amb-demo-language-change', handleLanguageChange);
    demo.table.on('cellEditing', handleEditStart);
    demo.table.on('cellEditCancelled', handleEditCancelled);
    demo.table.on('rowUpdated', handleRowUpdated);

    demo.destroy = () => {
        destroyed = true;
        clearTutorialHighlight();
        pendingResult = null;
        editCandidates.clear();
        tutorialLaunch.removeEventListener('click', handleTutorialLaunch);
        window.removeEventListener('amb-demo-language-change', syncTutorialLaunchLabel);
        demo.table.off('renderComplete', syncTutorialHighlight);
        demo.table.off('scrollVertical', syncTutorialHighlight);
        demo.table.off('scrollHorizontal', syncTutorialHighlight);
        window.removeEventListener('amb-demo-language-change', handleLanguageChange);
        demo.table.off('cellEditing', handleEditStart);
        demo.table.off('cellEditCancelled', handleEditCancelled);
        demo.table.off('rowUpdated', handleRowUpdated);
        commandGuideToolbar.destroy();
        tutorial.destroy();
        originalDestroy();
    };

    function handleInputEdited(cell) {
        const rowData = cell.getRow().getData();
        const parsedValue = parseExampleValue(rowData);
        const candidate = editCandidates.get(rowData.id);
        editCandidates.delete(rowData.id);
        pendingResult = candidate ? {
            ...candidate, input: rowData.input, expectedParsedValue: parsedValue
        } : null;

        demo.feedback.clear();
        demo.updateRow(rowData.id, { parsedValue });

        if (parsedValue === null && !rowData.acceptsNull) {
            const language = document.documentElement.lang === 'en' ? 'en' : 'it';

            demo.feedback.show({
                type: 'warning',
                message: feedbackCopy[language]
            });
        }
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
    }

    function syncTutorialHighlight() {
        if (!demo || destroyed || !tutorialState || tutorialState.hidden || tutorialState.complete || tutorialState.resetting || tutorialState.restartFailed || tutorialState.destroyed) {
            clearTutorialHighlight();
            return;
        }
        const id = { 'parse-decimal': 1, 'parse-time': 6, 'parse-custom': 9 }[tutorialState.stepId];
        const target = demo.table.getRow(id)?.getCell('input')?.getElement();
        if (target?.isConnected && target.getClientRects().length > 0) {
            if (highlightedControl === target && target.classList.contains('demo-crud-tutorial-target--pulse')) return;
            clearTutorialHighlight();
            target.classList.add('demo-crud-tutorial-target', 'demo-crud-tutorial-target--pulse', 'demo-crud-tutorial-target--rays');
            highlightedControl = target;
        } else clearTutorialHighlight();
    }

    async function resetTutorialScenario() {
        if (destroyed) return false;
        try {
            pendingResult = null;
            editCandidates.clear();
            demo.table.cancelEdit?.();
            await demo.setData(createParserData());
            syncTutorialHighlight();
            return !destroyed;
        } catch { return false; }
    }

    return demo;
}
