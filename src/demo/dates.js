import { AMB } from '../index.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';

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

    return lines.join('\n');
};

const debugDateEditorCall = (label, options) => {
    const editor = AMB.editors.date(options);

    return (cell, onRendered, success, cancel) => {
        console.log('[Dates demo] date editor called', {
            label,
            field: cell && cell.getField && cell.getField(),
            value: cell && cell.getValue && cell.getValue(),
            debugFlag: window.__AMB_DEBUG_DATE_EDITOR__
        });

        debugger;

        return editor(cell, onRendered, success, cancel);
    };
};

export default function dates(app) {
    app.innerHTML = `
        <h2>Dates</h2>
        <p class="demo-note">This demo focuses on date editors, the datepicker, and validation. Invalid typed dates stay visible so validators can report errors.</p>
        <details class="demo-disclosure">
            <summary class="demo-disclosure__summary">Supported behavior</summary>
            <div class="demo-disclosure__content">
                <ul class="demo-rules-list">
                    <li>Manual date accepts <code>D/M/YYYY</code> and <code>DD/MM/YYYY</code>.</li>
                    <li>ISO-style date accepts <code>YYYY-M-D</code> and <code>YYYY-MM-DD</code>.</li>
                    <li>Manual inputs accept only digits and the separator configured for the column.</li>
                    <li>Auto separators are applied only when typing digits from left to right.</li>
                    <li>Compact date accepts exactly <code>YYYYMMDD</code>.</li>
                    <li>Invalid but plausible typed values stay visible so validation can report them.</li>
                    <li>All date columns enforce an allowed range from <code>01/01/2025</code> to <code>31/12/2027</code>.</li>
                    <li>The picker opens only from the calendar button, limits calendar selection, and never owns the manual input.</li>
                    <li>Date columns use <code>AMB.date.createConfig(...)</code> so format and limits are declared once.</li>
                    <li>Picker-only date opens immediately and stores the configured <code>DD-MM-YYYY</code> format.</li>
                </ul>
                <p>Try <code>31/02/2026</code>, <code>01/01/2028</code>, or <code>20/022</code>: the typed value stays visible, then validation explains the error.</p>
            </div>
        </details>
        <div id="dates-table"></div>
    `;

    const demo = AMB.table({
        selector: '#dates-table',
        height: '320px',
        toolbar: {
            buttons: [
                {
                    id: 'validate-dates',
                    label: 'Validate dates',
                    title: 'Validate date values',
                    onClick: handleValidateDates
                }
            ]
        },
        data: [
            {
                id: 1,
                eventName: 'Planning review',
                manualDate: '05/06/2026',
                pickerDate: '12/06/2026',
                isoDate: '2026-06-05',
                compactDate: '20260605',
                pickerOnlyDate: '15-06-2026'
            },
            {
                id: 2,
                eventName: 'Customer workshop',
                manualDate: '20/07/2026',
                pickerDate: '21/07/2026',
                isoDate: '2026-07-20',
                compactDate: '20260720',
                pickerOnlyDate: '22-07-2026'
            },
            {
                id: 3,
                eventName: 'Archive review',
                manualDate: '',
                pickerDate: '',
                isoDate: '',
                compactDate: '',
                pickerOnlyDate: ''
            }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 70 },
            { title: 'Event', field: 'eventName', editor: AMB.editors.text({ trim: true, maxLength: 80 }) },
            {
                title: 'Manual date',
                field: 'manualDate',
                editor: AMB.editors.date(dateItManual.editor),
                formatter: AMB.formatters.date(dateItManual.formatter),
                validation: {
                    date: dateItManual.validator
                }
            },
            {
                title: 'Picker date',
                field: 'pickerDate',
                editor: AMB.editors.date(dateItPicker.editor),
                formatter: AMB.formatters.date(dateItPicker.formatter),
                validation: {
                    date: dateItPicker.validator
                }
            },
            {
                title: 'ISO-style date',
                field: 'isoDate',
                editor: AMB.editors.date(dateIsoManual.editor),
                formatter: AMB.formatters.date(dateIsoManual.formatter),
                validation: {
                    date: dateIsoManual.validator
                }
            },
            {
                title: 'Compact date',
                field: 'compactDate',
                editor: AMB.editors.date(dateCompactManual.editor),
                formatter: AMB.formatters.date(dateCompactManual.formatter),
                validation: {
                    date: dateCompactManual.validator
                }
            },
            {
                title: 'Picker-only date',
                field: 'pickerOnlyDate',
                editor: debugDateEditorCall('pickerOnlyDate', dateDashPickerOnly.editor),
                formatter: AMB.formatters.date(dateDashPickerOnly.formatter),
                validation: {
                    date: dateDashPickerOnly.validator
                }
            }
        ]
    });

    const reportDialog = createDemoReportDialog();
    const originalDestroy = demo.destroy.bind(demo);

    demo.destroy = () => {
        reportDialog.destroy();
        originalDestroy();
    };

    function handleValidateDates() {
        const result = demo.crud.validateAll();

        reportDialog.open({
            title: 'Date validation report',
            reportText: buildDateReport(result),
            jsonData: result
        });
    }

    return demo;
}
