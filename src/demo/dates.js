import { AMB } from '../index.js';

const minDate = '2025-01-01';
const maxDate = '2027-12-31';

const createDateValidation = (format, message) => ({
    date: {
        format,
        minDate,
        maxDate,
        message
    }
});

export default function dates(app) {
    app.innerHTML = `
        <h2>Dates</h2>
        <p class="demo-note">This demo focuses on date editors, the datepicker, and validation. Invalid typed dates stay visible so validators can report errors.</p>
        <div class="demo-note">
            <strong>Supported behavior:</strong>
            <ul>
                <li>Manual date accepts <code>D/M/YYYY</code> and <code>DD/MM/YYYY</code>.</li>
                <li>ISO-style date accepts <code>YYYY-M-D</code> and <code>YYYY-MM-DD</code>.</li>
                <li>Auto separators are applied only when typing digits from left to right.</li>
                <li>Compact date accepts exactly <code>YYYYMMDD</code>.</li>
                <li>Invalid typed values stay visible so validation can report them.</li>
                <li>All date columns enforce an allowed range from <code>01/01/2025</code> to <code>31/12/2027</code>.</li>
                <li>Picker limits and validation limits are aligned.</li>
            </ul>
            <p>Try <code>20/7/2026</code>, <code>2026-06-5</code>, <code>31/02/2026</code>, <code>2026720</code>, or <code>01/01/2028</code>.</p>
        </div>
        <div class="toolbar">
            <button type="button" id="action-validate-dates">Validate dates</button>
        </div>
        <div id="dates-table"></div>
        <pre class="demo-output" id="dates-output"></pre>
    `;

    const demo = AMB.table({
        selector: '#dates-table',
        height: '320px',
        data: [
            {
                id: 1,
                eventName: 'Planning review',
                manualDate: '05/06/2026',
                pickerDate: '12/06/2026',
                isoDate: '2026-06-05',
                compactDate: '20260605'
            },
            {
                id: 2,
                eventName: 'Customer workshop',
                manualDate: '20/07/2026',
                pickerDate: '21/07/2026',
                isoDate: '2026-07-20',
                compactDate: '20260720'
            },
            {
                id: 3,
                eventName: 'Archive review',
                manualDate: '',
                pickerDate: '',
                isoDate: '',
                compactDate: ''
            }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 70 },
            { title: 'Event', field: 'eventName', editor: AMB.editors.text({ trim: true, maxLength: 80 }) },
            {
                title: 'Manual date',
                field: 'manualDate',
                editor: AMB.editors.date({
                    format: 'dd/mm/yyyy',
                    allowEmpty: true,
                    minDate,
                    maxDate
                }),
                formatter: AMB.formatters.date('dd/mm/yyyy'),
                validation: createDateValidation(
                    'dd/mm/yyyy',
                    'Enter a real date between 01/01/2025 and 31/12/2027'
                )
            },
            {
                title: 'Picker date',
                field: 'pickerDate',
                editor: AMB.editors.date({
                    format: 'dd/mm/yyyy',
                    allowEmpty: true,
                    picker: true,
                    minDate,
                    maxDate
                }),
                formatter: AMB.formatters.date('dd/mm/yyyy'),
                validation: createDateValidation(
                    'dd/mm/yyyy',
                    'Pick or enter a real date between 01/01/2025 and 31/12/2027'
                )
            },
            {
                title: 'ISO-style date',
                field: 'isoDate',
                editor: AMB.editors.date({
                    format: 'iso',
                    allowEmpty: true,
                    minDate,
                    maxDate
                }),
                formatter: AMB.formatters.date('iso'),
                validation: createDateValidation(
                    'iso',
                    'Enter a real ISO-style date between 2025-01-01 and 2027-12-31'
                )
            },
            {
                title: 'Compact date',
                field: 'compactDate',
                editor: AMB.editors.date({
                    format: 'legacy',
                    allowEmpty: true,
                    minDate,
                    maxDate
                }),
                formatter: AMB.formatters.date('legacy'),
                validation: createDateValidation(
                    'legacy',
                    'Enter exactly 8 digits for a real date in range, e.g. 20260720'
                )
            }
        ]
    });

    const output = app.querySelector('#dates-output');

    app.querySelector('#action-validate-dates').addEventListener('click', () => {
        const result = demo.crud.validateAll();

        output.textContent = JSON.stringify({
            isValid: result.isValid,
            errors: result.errors
        }, null, 2);
    });

    return demo;
}
