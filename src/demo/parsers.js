import { AMB } from '../index.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';

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
    { id: 9, type: 'Custom', parserKey: 'custom', parserName: 'custom(priority => ...)', input: 'High', description: 'Application-defined parser for a business-specific rule.' }
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
        custom: ['Personalizzato', 'Parser applicativo personalizzato per una regola business.']
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
        custom: ['Custom', 'Application-defined parser for a business-specific rule.']
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
    return getParserRowText(cell.getRow().getData())[1];
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
        <h2 data-i18n="examples.parsers.title">Parsers</h2>
        <p class="demo-note" data-i18n="examples.parsers.intro">Edit an input value and inspect the normalized representation produced for a predictable payload.</p>
        ${createDemoColumnGuide({
            summary: 'How parsers work',
            summaryKey: 'examples.parsers.detailsTitle',
            intro: 'Parsers normalize visual values into backend-oriented shapes. They can reject incoherent syntax, but they do not replace validation or business rules.',
            introKey: 'examples.parsers.detailsText',
            points: [
                { title: 'Normalization', titleKey: 'examples.parsers.point1Title', description: 'Each row applies one public AMB parser to the edited Input value.', descriptionKey: 'examples.parsers.detail1' },
                { title: 'Payload shape', titleKey: 'examples.parsers.point2Title', description: 'Parsed value shows the predictable representation intended for application payloads.', descriptionKey: 'examples.parsers.detail2' },
                { title: 'Separate validation', titleKey: 'examples.parsers.point3Title', description: 'A parser transforms syntax; validation and business rules still decide whether data is acceptable.', descriptionKey: 'examples.parsers.detail3' }
            ],
            columns: [
                { title: 'Type', titleKey: 'guides.parsers.type.title', badge: 'PARSER', description: 'Identifies the transformation and its public parser.', descriptionKey: 'guides.parsers.type.description' },
                { title: 'Input', titleKey: 'guides.parsers.input.title', badge: 'EDITABLE', description: 'Visual value entered and edited by the user.', descriptionKey: 'guides.parsers.input.description' },
                { title: 'Parsed value', titleKey: 'guides.parsers.output.title', badge: 'READONLY', description: 'Normalized result produced by the parser, including a real null.', descriptionKey: 'guides.parsers.output.description' },
                { title: 'Description', titleKey: 'guides.parsers.description.title', badge: 'INFO', description: 'Briefly explains the transformation demonstrated by the row.', descriptionKey: 'guides.parsers.description.description' }
            ]
        })}
        <div class="demo-table-workbench">
            <div id="parsers-table" class="demo-business-grid demo-business-grid--viewport demo-parsers-grid"></div>
        </div>
    `;

    const demo = AMB.table({
        selector: '#parsers-table',
        toolbar: false,
        data: createParserData(),
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', minWidth: 58, widthGrow: 0.35 },
            {
                title: 'Type', field: 'type', minWidth: 150, widthGrow: 1.05,
                editable: false,
                formatter: formatParserType,
                cssClass: 'amb-cell--readonly-passive amb-cell--derived'
            },
            {
                title: 'Input', field: 'input', minWidth: 190, widthGrow: 1.5,
                editor: parserInputEditor,
                cellEdited: handleInputEdited
            },
            {
                title: 'Parsed value', field: 'parsedValue', minWidth: 190, widthGrow: 1.45,
                editable: false,
                formatter: formatParsedValue,
                cssClass: 'amb-cell--readonly-passive amb-cell--derived'
            },
            {
                title: 'Description', field: 'description', minWidth: 210, widthGrow: 1.8,
                editable: false,
                formatter: formatParserDescription,
                cssClass: 'amb-cell--readonly-passive'
            }
        ]
    });
    const handleLanguageChange = () => demo.redraw(true);
    const originalDestroy = demo.destroy.bind(demo);

    window.addEventListener('amb-demo-language-change', handleLanguageChange);

    demo.destroy = () => {
        window.removeEventListener('amb-demo-language-change', handleLanguageChange);
        originalDestroy();
    };

    function handleInputEdited(cell) {
        const rowData = cell.getRow().getData();
        const parsedValue = parseExampleValue(rowData);

        demo.feedback.clear();
        demo.crud.updateRowFields(rowData.id, { parsedValue });

        if (parsedValue === null && !rowData.acceptsNull) {
            const language = document.documentElement.lang === 'en' ? 'en' : 'it';

            demo.feedback.show({
                type: 'warning',
                message: feedbackCopy[language]
            });
        }
    }

    return demo;
}
