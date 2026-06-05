import { AMB } from '../index.js';

export default function numeric(app) {
    app.innerHTML = `
        <h2>Numeric</h2>
        <div id="numeric-table"></div>
    `;

    return AMB.table({
        selector: '#numeric-table',
        height: '260px',
        data: [
            { id: 1, count: 12, measure: 42.5, credits: 1200.75, progress: 0.45 },
            { id: 2, count: 4, measure: -3.25, credits: 84, progress: 0.8 },
            { id: 3, count: '', measure: '', credits: '', progress: 0.12 }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 80 },
            {
                title: 'Count',
                field: 'count',
                editor: AMB.editors.integer({ allowEmpty: true }),
                formatter: AMB.formatters.integer(),
                validation: { integer: true }
            },
            {
                title: 'Measure',
                field: 'measure',
                editor: AMB.editors.decimal({ allowNegative: true, allowEmpty: true }),
                formatter: AMB.formatters.decimal(2),
                validation: {
                    decimal: {
                        decimalDigits: 2,
                        allowNegative: true,
                        message: 'Use a decimal value'
                    }
                }
            },
            {
                title: 'Credits',
                field: 'credits',
                editor: AMB.editors.decimal({ allowEmpty: true }),
                formatter: AMB.formatters.currency()
            },
            {
                title: 'Progress',
                field: 'progress',
                editor: AMB.editors.decimal({ decimalSeparator: '.', allowEmpty: true }),
                formatter: AMB.formatters.percent(1)
            }
        ]
    });
}
