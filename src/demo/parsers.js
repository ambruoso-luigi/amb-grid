import { AMB } from '../index.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';
import { createDemoCommandGuideToolbar } from './utils/demo-command-guide-toolbar.js';
import { createDemoActionTutorial } from './components/demo-action-tutorial.js';
import { demoIcon } from './demo-icons.js';
import { publicExampleTranslations } from './example-copy.js';

const priorityParser = AMB.parsers.custom(value => {
    const priorities = {
        High: 'H',
        Medium: 'M',
        Low: 'L'
    };

    return priorities[String(value ?? '').trim()] ?? null;
});

const parserFactories = {
    decimal: () => AMB.parsers.decimalToPayload(),
    integer: () => AMB.parsers.integerToPayload(),
    date: () => AMB.parsers.dateToPayload(),
    compactDate: () => AMB.parsers.dateToPayload(),
    dateTime: () => AMB.parsers.dateTimeToPayload(),
    time: () => AMB.parsers.timeToPayload(),
    boolean: () => AMB.parsers.booleanToPayload({ trueValue: 'Y', falseValue: 'N' }),
    emptyToNull: () => AMB.parsers.emptyToNull(),
    custom: () => priorityParser
};

const textParserEditor = AMB.editors.text({ maxLength: 80 });
const booleanParserEditor = AMB.editors.checkbox({
    checkedValue: true,
    uncheckedValue: false
});

const parserInputEditor = (cell, onRendered, success, cancel) => {
    const rowData = cell.getRow().getData();
    const editor = rowData.parserKey === 'boolean'
        ? booleanParserEditor
        : textParserEditor;

    return editor(cell, onRendered, success, cancel);
};

const parserExamples = [
    { id: 1, type: 'Decimal', parserKey: 'decimal', parserName: 'decimalToPayload()', input: '-123.123,01', description: 'Visual decimal to payload decimal string.' },
    { id: 2, type: 'Integer', parserKey: 'integer', parserName: 'integerToPayload()', input: '1.234', description: 'Grouped integer to payload integer string.' },
    { id: 3, type: 'Date', parserKey: 'date', parserName: 'dateToPayload()', input: '16/06/2026', description: 'Date normalized to YYYY-MM-DD.' },
    { id: 4, type: 'Compact date', parserKey: 'compactDate', parserName: 'dateToPayload()', input: '20260616', description: 'Compact legacy date normalized to YYYY-MM-DD.' },
    { id: 5, type: 'DateTime', parserKey: 'dateTime', parserName: 'dateTimeToPayload()', input: '16/06/2026 14:30', description: 'Date and time normalized with seconds.' },
    { id: 6, type: 'Time', parserKey: 'time', parserName: 'timeToPayload()', input: '9:05', description: 'Time normalized to HH:MM:SS.' },
    { id: 7, type: 'Boolean', parserKey: 'boolean', parserName: 'booleanToPayload({ trueValue: \'Y\', falseValue: \'N\' })', input: true, description: 'Application boolean converted to a configured backend value.' },
    { id: 8, type: 'Empty to null', parserKey: 'emptyToNull', parserName: 'emptyToNull()', input: '   ', description: 'Whitespace-only input becomes a real null value.', acceptsNull: true },
    { id: 9, type: 'Custom', parserKey: 'custom', parserName: 'custom(priority => ...)', input: 'High', description: 'Application-defined rule that converts a business priority into the value expected by the payload.' }
];

const feedbackCopy = {
    it: 'Il parser non riconosce questo input. Il valore normalizzato è null.',
    en: 'The parser cannot normalize this input. The parsed value is null.'
};

const parserRowCopy = {
    it: {
        decimal: ['Decimale', 'Decimale visuale convertito in stringa decimale per il payload.'],
        integer: ['Intero', 'Intero raggruppato convertito in stringa intera per il payload.'],
        date: ['Data', 'Data normalizzata nel formato YYYY-MM-DD.'],
        compactDate: ['Data compatta', 'Data legacy compatta normalizzata nel formato YYYY-MM-DD.'],
        dateTime: ['Data e ora', 'Data e ora normalizzate includendo i secondi.'],
        time: ['Ora', 'Ora normalizzata nel formato HH:MM:SS.'],
        boolean: ['Booleano', 'Booleano applicativo convertito nel valore backend configurato.'],
        emptyToNull: ['Vuoto a null', 'Un input di soli spazi diventa un vero valore null.'],
        custom: [
            'Personalizzato',
            'Regola applicativa personalizzata che converte una priorità business nel valore previsto dal payload.',
            'Regola applicativa personalizzata'
        ]
    },
    en: {
        decimal: ['Decimal', 'Visual decimal to payload decimal string.'],
        integer: ['Integer', 'Grouped integer to payload integer string.'],
        date: ['Date', 'Date normalized to YYYY-MM-DD.'],
        compactDate: ['Compact date', 'Compact legacy date normalized to YYYY-MM-DD.'],
        dateTime: ['DateTime', 'Date and time normalized with seconds.'],
        time: ['Time', 'Time normalized to HH:MM:SS.'],
        boolean: ['Boolean', 'Application boolean converted to a configured backend value.'],
        emptyToNull: ['Empty to null', 'Whitespace-only input becomes a real null value.'],
        custom: [
            'Custom',
            'Application-defined rule that converts a business priority into the value expected by the payload.',
            'Application-defined rule'
        ]
    }
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
            intro: 'Parsers normalize visual values into backend-oriented shapes. They can reject incoherent syntax, but they do not replace validation or business rules.',
            introKey: 'examples.parsers.detailsText',
            points: [
                { title: 'Normalization', titleKey: 'examples.parsers.point1Title', description: 'Each row applies one public AMB parser to the edited Input value.', descriptionKey: 'examples.parsers.detail1' },
                { title: 'Payload shape', titleKey: 'examples.parsers.point2Title', description: 'Parsed value shows the predictable representation intended for application payloads.', descriptionKey: 'examples.parsers.detail2' },
                { title: 'Separate validation', titleKey: 'examples.parsers.point3Title', description: 'A parser transforms syntax; validation and business rules still decide whether data is acceptable.', descriptionKey: 'examples.parsers.detail3' },
                { title: 'Built-in parsers', titleKey: 'examples.parsers.point4Title', description: 'AMB Grid provides ready-to-use parsers for common payload transformations such as numbers, dates, times, booleans and null values. Their options can be configured for the application contract.', descriptionKey: 'examples.parsers.detail4' },
                { title: 'Custom parsers', titleKey: 'examples.parsers.point5Title', description: 'When a business rule needs a specific transformation, AMB.parsers.custom(parseFn) lets the application define its own reusable parsing logic.', descriptionKey: 'examples.parsers.detail5' }
            ],
            columns: [
                { title: 'Type', titleKey: 'guides.parsers.type.title', badge: 'PARSER', description: 'Identifies the transformation and its public parser.', descriptionKey: 'guides.parsers.type.description' },
                { title: 'Input', titleKey: 'guides.parsers.input.title', badge: 'EDITABLE', description: 'Visual value entered and edited by the user.', descriptionKey: 'guides.parsers.input.description' },
                { title: 'Parsed value', titleKey: 'guides.parsers.output.title', badge: 'READONLY', description: 'Normalized result produced by the parser, including a real null.', descriptionKey: 'guides.parsers.output.description' },
                { title: 'Description', titleKey: 'guides.parsers.description.title', badge: 'INFO', description: 'Briefly explains the transformation demonstrated by the row.', descriptionKey: 'guides.parsers.description.description' }
            ]
        })}
            </div>
        </div>
        <p class="demo-note" data-i18n="examples.parsers.intro">Edit an input value and inspect the normalized representation produced for a predictable payload.</p>
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
                    && parserKey === 'decimal' && previous !== input && input === '1.234,56' && parsedValue === '1234.56'
            },
            {
                id: 'parse-boolean', actionId: 'parser-updated', instructionKey: 'examples.parsers.tutorialBoolean',
                isComplete: ({ id, field, parserKey, previous, input, parsedValue }) => id === 7 && field === 'input'
                    && parserKey === 'boolean' && previous !== input && input === false && parsedValue === 'N'
            },
            {
                id: 'parse-custom', actionId: 'parser-updated', instructionKey: 'examples.parsers.tutorialCustom',
                isComplete: ({ id, field, parserKey, previous, input, parsedValue }) => id === 9 && field === 'input'
                    && parserKey === 'custom' && previous !== input && input === 'Low' && parsedValue === 'L'
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
                editor: parserInputEditor,
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
        const context = tutorial.capture();
        if (!context) return;
        const id = cell.getRow().getData().id;
        editCandidates.set(id, { context, id, field: 'input', previous: cell.getValue() });
    };
    const handleEditCancelled = cell => editCandidates.delete(cell.getRow().getData().id);
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
        const id = { 'parse-decimal': 1, 'parse-boolean': 7, 'parse-custom': 9 }[tutorialState.stepId];
        const target = demo.table.getRow(id)?.getCell('input')?.getElement();
        if (target?.isConnected && target.getClientRects().length > 0) {
            if (highlightedControl === target && target.classList.contains('demo-crud-tutorial-target--pulse')) return;
            clearTutorialHighlight();
            target.classList.add('demo-crud-tutorial-target', 'demo-crud-tutorial-target--pulse');
            highlightedControl = target;
        } else clearTutorialHighlight();
    }

    async function resetTutorialScenario() {
        if (destroyed) return false;
        try {
            pendingResult = null;
            editCandidates.clear();
            await demo.setData(createParserData());
            syncTutorialHighlight();
            return !destroyed;
        } catch { return false; }
    }

    return demo;
}
