import { AMB } from '../index.js';

const minDate = '2025-01-01';
const maxDate = '2027-12-31';

const createDateValidation = (format, messages) => ({
    date: {
        format,
        minDate,
        maxDate,
        message: 'Invalid date',
        messages
    }
});

const buildDateReport = result => {
    const lines = [
        `Validation result: ${result.isValid ? 'valid' : 'invalid'}`,
        `Errors: ${result.errors.length}`,
        ''
    ];

    if (result.errors.length === 0) {
        lines.push('No date validation errors.');
        return lines.join('\n');
    }

    result.errors.forEach(error => {
        const rowLabel = error.rowNumber !== null && error.rowNumber !== undefined
            ? `Row ${error.rowNumber}`
            : `ID ${error.id || error.tempId || 'unknown'}`;
        const codeLabel = error.code ? ` [${error.code}]` : '';

        lines.push(`- ${rowLabel}, ${error.field}${codeLabel}: ${error.message}`);
    });

    lines.push('');
    lines.push('Raw validation result:');
    lines.push(JSON.stringify(result, null, 2));

    return lines.join('\n');
};

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
                <li>The picker limits calendar selection, but manual input is still committed and validated by AMB Grid.</li>
            </ul>
            <p>In <strong>Picker date</strong>, try <code>31/02/2026</code>, <code>01/01/2028</code>, or <code>20/022</code>: the typed value should stay visible, then validation explains the error.</p>
            <p>Also try <code>20/7/2026</code>, <code>2026-06-5</code>, or compact <code>2026720</code>.</p>
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
                    {
                        syntax: 'Use D/M/YYYY or DD/MM/YYYY',
                        calendar: 'Enter a real calendar date',
                        minDate: 'Date must be on or after 01/01/2025',
                        maxDate: 'Date must be on or before 31/12/2027'
                    }
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
                    {
                        syntax: 'Use D/M/YYYY or DD/MM/YYYY',
                        calendar: 'Enter a real calendar date',
                        minDate: 'Date must be on or after 01/01/2025',
                        maxDate: 'Date must be on or before 31/12/2027'
                    }
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
                    {
                        syntax: 'Use YYYY-M-D or YYYY-MM-DD',
                        calendar: 'Enter a real calendar date',
                        minDate: 'Date must be on or after 2025-01-01',
                        maxDate: 'Date must be on or before 2027-12-31'
                    }
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
                    {
                        syntax: 'Use exactly 8 digits in YYYYMMDD format',
                        calendar: 'Enter a real calendar date',
                        minDate: 'Date must be on or after 20250101',
                        maxDate: 'Date must be on or before 20271231'
                    }
                )
            }
        ]
    });

    const output = app.querySelector('#dates-output');

    app.querySelector('#action-validate-dates').addEventListener('click', () => {
        const result = demo.crud.validateAll();

        output.textContent = buildDateReport(result);
    });

    return demo;
}
