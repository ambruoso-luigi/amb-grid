import { AMB } from '../index.js';

export default function numeric(app) {
    app.innerHTML = `
        <h2>Numeric</h2>
        <p class="demo-note">Numeric editors keep user input constrained while validators enforce the accepted numeric shape. This demo shows integer limits, fixed decimal precision, currency formatting, and percentage formatting.</p>
        <details class="demo-disclosure">
            <summary class="demo-disclosure__summary">Numeric behavior</summary>
            <div class="demo-disclosure__content">
                <ul class="demo-rules-list">
                    <li>Count: integer value, empty allowed, maximum 10 digits.</li>
                    <li>Measure: decimal value, negative values allowed, up to 3 integer digits and 3 decimal digits.</li>
                    <li>Credits: currency-style decimal value, up to 7 integer digits and 2 decimal digits.</li>
                    <li>Progress: stored as a ratio and displayed as a percentage with 3 decimal digits.</li>
                    <li>Editors constrain typing, while validators still protect the table state and report invalid values.</li>
                </ul>
            </div>
        </details>
        <div id="numeric-table"></div>
    `;

    return AMB.table({
        selector: '#numeric-table',
        height: '260px',
        toolbar: false,
        data: [
            { id: 1, count: 12, measure: 42.125, credits: 1200.75, progress: 0.456 },
            { id: 2, count: 4, measure: -3.25, credits: 84, progress: 0.805 },
            { id: 3, count: '', measure: '', credits: '', progress: 0.125 }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 80 },
            {
                title: 'Count',
                field: 'count',
                editor: AMB.editors.integer({
                    allowEmpty: true,
                    maxLength: 10
                }),
                formatter: AMB.formatters.integer(),
                validation: {
                    integer: {
                        message: 'Count must be an integer with up to 10 digits.'
                    },
                    maxLength: {
                        value: 10,
                        message: 'Count must be an integer with up to 10 digits.'
                    }
                }
            },
            {
                title: 'Measure',
                field: 'measure',
                editor: AMB.editors.decimal({
                    allowNegative: true,
                    allowEmpty: true,
                    integerDigits: 3,
                    decimalDigits: 3
                }),
                formatter: AMB.formatters.decimal(3),
                validation: {
                    decimal: {
                        integerDigits: 3,
                        decimalDigits: 3,
                        allowNegative: true,
                        message: 'Use a decimal value with up to 3 integer digits and 3 decimal digits'
                    }
                }
            },
            {
                title: 'Credits',
                field: 'credits',
                editor: AMB.editors.decimal({
                    allowEmpty: true,
                    integerDigits: 7,
                    decimalDigits: 2
                }),
                formatter: AMB.formatters.currency(),
                validation: {
                    decimal: {
                        integerDigits: 7,
                        decimalDigits: 2,
                        message: 'Use up to 7 integer digits and 2 decimal digits'
                    }
                }
            },
            {
                title: 'Progress',
                field: 'progress',
                editor: AMB.editors.decimal({
                    decimalSeparator: '.',
                    allowEmpty: true,
                    integerDigits: 1,
                    decimalDigits: 3
                }),
                formatter: AMB.formatters.percent(3),
                validation: {
                    decimal: {
                        decimalSeparator: '.',
                        integerDigits: 1,
                        decimalDigits: 3,
                        message: 'Use a ratio with up to 1 integer digit and 3 decimal digits'
                    }
                }
            }
        ]
    });
}
