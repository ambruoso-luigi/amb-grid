import { AMB } from '../index.js';

const parserExamples = [
    {
        input: '-123.123,01',
        parserName: 'decimalToDb()',
        createParser: () => AMB.parsers.decimalToDb(),
        note: 'DB decimal string, not a JavaScript Number'
    },
    {
        input: '1.234',
        parserName: 'integerToDb()',
        createParser: () => AMB.parsers.integerToDb(),
        note: 'Integer payload string'
    },
    {
        input: '16/06/2026',
        parserName: 'dateToMysqlDate()',
        createParser: () => AMB.parsers.dateToMysqlDate(),
        note: 'Date normalized to YYYY-MM-DD'
    },
    {
        input: '20260616',
        parserName: 'dateToMysqlDate()',
        createParser: () => AMB.parsers.dateToMysqlDate(),
        note: 'Compact legacy-style date input'
    },
    {
        input: '16/06/2026 14:30',
        parserName: 'dateTimeToMysql()',
        createParser: () => AMB.parsers.dateTimeToMysql(),
        note: 'DateTime normalized to YYYY-MM-DD HH:MM:SS'
    },
    {
        input: 'it60 x054 2811 1010 0000 0123 456',
        parserName: 'ibanToDb()',
        createParser: () => AMB.parsers.ibanToDb(),
        note: 'Trim, remove spaces, uppercase'
    },
    {
        input: 'rss mra 80a01 h501u',
        parserName: 'fiscalCodeToDb()',
        createParser: () => AMB.parsers.fiscalCodeToDb(),
        note: 'Trim, remove spaces, uppercase'
    },
    {
        input: 'Tel. 071-123456',
        parserName: 'digitsOnly()',
        createParser: () => AMB.parsers.digitsOnly(),
        note: 'Useful for phone-like numeric text'
    },
    {
        input: '   ',
        parserName: 'emptyToNull()',
        createParser: () => AMB.parsers.emptyToNull(),
        note: 'Empty or whitespace-only input becomes null'
    },
    {
        input: '12.34,56',
        parserName: 'decimalToDb()',
        createParser: () => AMB.parsers.decimalToDb(),
        note: 'Bad thousands grouping'
    }
];

const formatOutput = value => {
    return value === null ? 'null' : JSON.stringify(value);
};

const createCell = value => {
    const cell = document.createElement('td');

    cell.textContent = value;

    return cell;
};

export default function parsers(app) {
    app.innerHTML = `
        <h2>Parsers</h2>
        <p class="demo-note">Parsers normalize visual/editorial values into predictable payload values for the backend. They are separate from validators, formatters, and editors.</p>
        <p class="demo-note">They may reject incoherent syntax, but they do not replace validation, business rules, authorization, or backend checks.</p>
        <div class="toolbar">
            <button type="button" id="run-parser-examples">Run parser examples</button>
        </div>
        <div class="demo-table-wrap">
            <table class="demo-table" id="parser-results">
                <thead>
                    <tr>
                        <th>Input</th>
                        <th>Parser</th>
                        <th>Output</th>
                        <th>Note</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="4">Run the examples to see parser output.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    const tableBody = app.querySelector('#parser-results tbody');

    const renderResults = () => {
        tableBody.replaceChildren();

        parserExamples.forEach(example => {
            const row = document.createElement('tr');
            const output = example.createParser().parse(example.input);

            row.append(
                createCell(JSON.stringify(example.input)),
                createCell(example.parserName),
                createCell(formatOutput(output)),
                createCell(example.note || '')
            );
            tableBody.append(row);
        });
    };

    app.querySelector('#run-parser-examples').addEventListener('click', renderResults);

    return null;
}
