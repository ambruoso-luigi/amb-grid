import { AMB } from '../index.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';
import { decorateDemoEditorButtons } from './utils/decorate-demo-editor-button.js';

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

const dateData = [
    { id: 1, eventName: 'Planning review', manualDate: '05/06/2026', pickerDate: '12/06/2026', isoDate: '2026-06-05', compactDate: '20260605', pickerOnlyDate: '15-06-2026' },
    { id: 2, eventName: 'Customer workshop', manualDate: '20/07/2026', pickerDate: '21/07/2026', isoDate: '2026-07-20', compactDate: '20260720', pickerOnlyDate: '22-07-2026' },
    { id: 3, eventName: 'Inventory audit', manualDate: '14/01/2025', pickerDate: '16/01/2025', isoDate: '2025-01-14', compactDate: '20250114', pickerOnlyDate: '18-01-2025' },
    { id: 4, eventName: 'Supplier meeting', manualDate: '09/03/2025', pickerDate: '10/03/2025', isoDate: '2025-03-09', compactDate: '20250309', pickerOnlyDate: '11-03-2025' },
    { id: 5, eventName: 'Release checkpoint', manualDate: '28/09/2025', pickerDate: '29/09/2025', isoDate: '2025-09-28', compactDate: '20250928', pickerOnlyDate: '30-09-2025' },
    { id: 6, eventName: 'Budget approval', manualDate: '11/02/2026', pickerDate: '12/02/2026', isoDate: '2026-02-11', compactDate: '20260211', pickerOnlyDate: '13-02-2026' },
    { id: 7, eventName: 'Quality inspection', manualDate: '04/11/2026', pickerDate: '05/11/2026', isoDate: '2026-11-04', compactDate: '20261104', pickerOnlyDate: '06-11-2026' },
    { id: 8, eventName: 'Contract renewal', manualDate: '17/04/2027', pickerDate: '18/04/2027', isoDate: '2027-04-17', compactDate: '20270417', pickerOnlyDate: '19-04-2027' },
    { id: 9, eventName: 'Training session', manualDate: '23/08/2027', pickerDate: '24/08/2027', isoDate: '2027-08-23', compactDate: '20270823', pickerOnlyDate: '25-08-2027' },
    { id: 10, eventName: 'Year-end review', manualDate: '15/12/2027', pickerDate: '16/12/2027', isoDate: '2027-12-15', compactDate: '20271215', pickerOnlyDate: '17-12-2027' }
];

const reportCopy = {
    it: {
        title: 'Report validazione date',
        valid: 'valido',
        invalid: 'non valido',
        result: 'Risultato validazione',
        errors: 'Errori',
        noErrors: 'Nessun errore di validazione sulle date.',
        row: 'Riga'
    },
    en: {
        title: 'Date validation report',
        valid: 'valid',
        invalid: 'invalid',
        result: 'Validation result',
        errors: 'Errors',
        noErrors: 'No date validation errors.',
        row: 'Row'
    }
};

const getLanguage = () => document.documentElement.lang === 'en' ? 'en' : 'it';

const buildDateReport = result => {
    const copy = reportCopy[getLanguage()];
    const lines = [
        `${copy.result}: ${result.isValid ? copy.valid : copy.invalid}`,
        `${copy.errors}: ${result.errors.length}`,
        ''
    ];

    if (result.errors.length === 0) {
        lines.push(copy.noErrors);
        return lines.join('\n');
    }

    result.errors.forEach(error => {
        const rowLabel = error.rowNumber !== null && error.rowNumber !== undefined
            ? `${copy.row} ${error.rowNumber}`
            : `ID ${error.id || error.tempId || 'unknown'}`;
        const codeLabel = error.code ? ` [${error.code}]` : '';

        lines.push(`- ${rowLabel}, ${error.field}${codeLabel}: ${error.message}`);
    });

    return lines.join('\n');
};

export default function dates(app) {
    app.innerHTML = `
        <h2 data-i18n="examples.dates.title">Dates</h2>
        <p class="demo-note" data-i18n="examples.dates.intro">Compare manual date input, multiple formats, validation ranges, and real datepicker modes.</p>
        ${createDemoColumnGuide({
            summary: 'How dates work',
            summaryKey: 'examples.dates.detailsTitle',
            intro: 'The example keeps date format, editor behavior, display, validation, and range constraints aligned through shared date configurations.',
            introKey: 'examples.dates.detailsText',
            points: [
                { title: 'Multiple formats', titleKey: 'examples.dates.point1Title', description: 'Manual, ISO-style, compact, and dash-separated dates use their declared formats.', descriptionKey: 'examples.dates.detail1' },
                { title: 'Manual and picker', titleKey: 'examples.dates.point2Title', description: 'Some cells accept typing, some add a calendar button, and picker-only opens the calendar directly.', descriptionKey: 'examples.dates.detail2' },
                { title: 'Visible validation', titleKey: 'examples.dates.point3Title', description: 'Invalid typed values remain visible so validation can explain syntax, calendar, or range errors.', descriptionKey: 'examples.dates.detail3' },
                { title: 'Allowed range', titleKey: 'examples.dates.point4Title', description: 'Every date stays between 01/01/2025 and 31/12/2027.', descriptionKey: 'examples.dates.detail4' }
            ],
            columns: [
                { title: 'Event', titleKey: 'guides.dates.event.title', badge: 'TEXT', description: 'Editable event name.', descriptionKey: 'guides.dates.event.description' },
                { title: 'Manual date', titleKey: 'guides.dates.manual.title', badge: 'DD/MM/YYYY', description: 'Manual input with calendar-date and range validation.', descriptionKey: 'guides.dates.manual.description' },
                { title: 'Picker date', titleKey: 'guides.dates.picker.title', badge: 'MANUAL + PICKER', description: 'Supports both typing and selection from the calendar button.', descriptionKey: 'guides.dates.picker.description' },
                { title: 'ISO-style date', titleKey: 'guides.dates.iso.title', badge: 'ISO', description: 'Accepts YYYY-M-D or YYYY-MM-DD according to the date configuration.', descriptionKey: 'guides.dates.iso.description' },
                { title: 'Compact date', titleKey: 'guides.dates.compact.title', badge: 'YYYYMMDD', description: 'Legacy compact date using exactly eight digits.', descriptionKey: 'guides.dates.compact.description' },
                { title: 'Picker-only date', titleKey: 'guides.dates.pickerOnly.title', badge: 'PICKER', description: 'Selected through the calendar and stored as DD-MM-YYYY.', descriptionKey: 'guides.dates.pickerOnly.description' }
            ]
        })}
        <div class="demo-table-workbench">
            <div id="dates-table" class="demo-business-grid demo-business-grid--viewport"></div>
        </div>
    `;

    const demo = AMB.table({
        selector: '#dates-table',
        toolbar: {
            buttons: ['validate'],
            onValidate: handleValidateDates
        },
        data: dateData.map(row => ({ ...row })),
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', minWidth: 58, widthGrow: 0.4 },
            { title: 'Event', field: 'eventName', minWidth: 135, widthGrow: 1.35, editor: AMB.editors.text({ trim: true, maxLength: 80 }) },
            {
                title: 'Manual date', field: 'manualDate', minWidth: 115, widthGrow: 0.9,
                editor: AMB.editors.date(dateItManual.editor),
                formatter: AMB.formatters.date(dateItManual.formatter),
                validation: { date: dateItManual.validator }
            },
            {
                title: 'Picker date', field: 'pickerDate', minWidth: 115, widthGrow: 0.9,
                editor: AMB.editors.date(dateItPicker.editor),
                formatter: AMB.formatters.date(dateItPicker.formatter),
                validation: { date: dateItPicker.validator }
            },
            {
                title: 'ISO-style date', field: 'isoDate', minWidth: 125, widthGrow: 0.95,
                editor: AMB.editors.date(dateIsoManual.editor),
                formatter: AMB.formatters.date(dateIsoManual.formatter),
                validation: { date: dateIsoManual.validator }
            },
            {
                title: 'Compact date', field: 'compactDate', minWidth: 115, widthGrow: 0.9,
                editor: AMB.editors.date(dateCompactManual.editor),
                formatter: AMB.formatters.date(dateCompactManual.formatter),
                validation: { date: dateCompactManual.validator }
            },
            {
                title: 'Picker-only date', field: 'pickerOnlyDate', minWidth: 130, widthGrow: 1,
                cssClass: 'amb-cell--readonly-actionable amb-cell--actionable amb-cell--picker-only',
                editor: AMB.editors.date(dateDashPickerOnly.editor),
                formatter: AMB.formatters.date(dateDashPickerOnly.formatter),
                validation: { date: dateDashPickerOnly.validator }
            }
        ]
    });

    const reportDialog = createDemoReportDialog();
    const stopDecoratingDateButtons = decorateDemoEditorButtons(app.querySelector('#dates-table'), {
        selector: '.amb-date-editor-picker-button',
        icon: 'date',
        label: 'Open calendar'
    });
    const validateButton = app.querySelector('[data-action="validate"]');
    const validateLabel = validateButton && validateButton.querySelector('.amb-toolbar__button-label');
    const originalDestroy = demo.destroy.bind(demo);

    if (validateButton) {
        validateButton.dataset.i18nTitle = 'examples.dates.validateTitle';
    }
    if (validateLabel) {
        validateLabel.dataset.i18n = 'examples.dates.validate';
    }

    demo.destroy = () => {
        reportDialog.destroy();
        stopDecoratingDateButtons();
        originalDestroy();
    };

    function handleValidateDates() {
        const result = demo.crud.validateAll();

        reportDialog.open({
            title: reportCopy[getLanguage()].title,
            reportText: buildDateReport(result),
            jsonData: result
        });
    }

    return demo;
}
