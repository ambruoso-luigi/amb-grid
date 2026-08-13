import { AMB } from '../index.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';

const hasReservedDocumentPrefix = value => {
    if (value === null || value === undefined || String(value).trim() === '') return true;

    return !String(value).toUpperCase().startsWith('TMP');
};

const buildReadableReport = ({ validateResult, stateReport, validationScope }) => {
    const errors = validateResult ? validateResult.errors : stateReport.errors.cells;
    const scopeLabel = validationScope === 'full'
        ? 'full table validation'
        : validationScope === 'changes'
            ? 'changed/new rows validation'
            : 'current validation state';
    const lines = [
        validateResult
            ? `Validation result (${scopeLabel}): ${validateResult.isValid ? 'valid' : 'invalid'}`
            : 'Current validation state',
        `Rows with errors: ${stateReport.errorRowsCount}`,
        `Cell errors: ${errors.length}`,
        `Changed rows: ${stateReport.changedRowsCount}`,
        ''
    ];

    if (errors.length === 0) {
        lines.push('No validation errors are currently tracked.');
        lines.push('');
        lines.push('Edit a cell, or use Create anomalies to generate a few intentional validation failures.');
        return lines.join('\n');
    }

    lines.push('What happened:');
    lines.push(validationScope === 'full'
        ? 'AMB Grid evaluated the registered validators for the full table and marked every cell that failed.'
        : 'AMB Grid evaluated the registered validators for changed/new rows only; clean rows can still be used as comparison context.');
    lines.push('');
    lines.push('Errors by row:');

    const errorsByRow = new Map();

    errors.forEach(error => {
        const rowLabel = error.rowNumber !== null && error.rowNumber !== undefined
            ? `Row ${error.rowNumber}`
            : `ID ${error.id || error.key || 'unknown'}`;

        if (!errorsByRow.has(rowLabel)) {
            errorsByRow.set(rowLabel, []);
        }

        errorsByRow.get(rowLabel).push(error);
    });

    errorsByRow.forEach((rowErrors, rowLabel) => {
        lines.push(`- ${rowLabel}`);

        rowErrors.forEach(error => {
            const valueLabel = error.value !== undefined
                ? ` (value: ${JSON.stringify(error.value)})`
                : '';

            lines.push(`  - ${error.field}: ${error.message}${valueLabel}`);
        });
    });

    lines.push('');
    lines.push('Use the JSON tab to inspect the raw validation result and CrudHelper state report for integration/debugging.');

    return lines.join('\n');
};

const validationData = [
    {
        id: 1,
        alias: 'Atlas',
        email: 'atlas@example.test',
        accessCode: 'ATL001',
        fiscalCode: 'RSSMRA80A01H501U',
        vatNumber: '12345678901',
        fiscalIdOrVat: 'RSSMRA80A01H501U',
        iban: 'IT60X0542811101000000123456',
        documentNumber: 'DOC1001'
    },
    {
        id: 2,
        alias: 'Beacon',
        email: 'beacon@example.test',
        accessCode: 'BCN002',
        fiscalCode: 'BNCLGU85C10F205Z',
        vatNumber: '98765432109',
        fiscalIdOrVat: '98765432109',
        iban: 'IT23A0306909606100000123456',
        documentNumber: 'DOC1002'
    },
    {
        id: 3,
        alias: 'Cobalt',
        email: 'cobalt@example.test',
        accessCode: 'CBL003',
        fiscalCode: 'VRDLGI90B15F205X',
        vatNumber: '11122233344',
        fiscalIdOrVat: 'VRDLGI90B15F205X',
        iban: 'IT45B0503412345000009876543',
        documentNumber: 'DOC1003'
    },
    {
        id: 4,
        alias: 'Delta',
        email: 'delta@example.test',
        accessCode: 'DLT004',
        fiscalCode: 'PLLMRC76D20H501Y',
        vatNumber: '55566677788',
        fiscalIdOrVat: '55566677788',
        iban: 'IT12C0200812345000007654321',
        documentNumber: 'DOC1004'
    },
    {
        id: 5,
        alias: 'Echo',
        email: 'echo@example.test',
        accessCode: 'ECH005',
        fiscalCode: 'GLLMRC88E15H501Q',
        vatNumber: '24681357901',
        fiscalIdOrVat: 'GLLMRC88E15H501Q',
        iban: 'IT98D0335901600100000987654',
        documentNumber: 'DOC1005'
    },
    {
        id: 6,
        alias: 'Forge',
        email: 'forge@example.test',
        accessCode: 'FRG006',
        fiscalCode: 'FRNLCU92M20F205D',
        vatNumber: '13579246801',
        fiscalIdOrVat: '13579246801',
        iban: 'IT77E0623012345000001112223',
        documentNumber: 'DOC1006'
    },
    {
        id: 7,
        alias: 'Harbor',
        email: 'harbor@example.test',
        accessCode: 'HRB007',
        fiscalCode: 'MRARSS79P10H501K',
        vatNumber: '10293847561',
        fiscalIdOrVat: 'MRARSS79P10H501K',
        iban: 'IT31F0103012345000003334445',
        documentNumber: 'DOC1007'
    },
    {
        id: 8,
        alias: 'Iris',
        email: 'iris@example.test',
        accessCode: 'IRS008',
        fiscalCode: 'NTNGPP83T01F205L',
        vatNumber: '56473829101',
        fiscalIdOrVat: '56473829101',
        iban: 'IT54G0306912345000005556667',
        documentNumber: 'DOC1008'
    },
    {
        id: 9,
        alias: 'Juniper',
        email: 'juniper@example.test',
        accessCode: 'JNP009',
        fiscalCode: 'SNTPLA91C30H501V',
        vatNumber: '01928374655',
        fiscalIdOrVat: 'SNTPLA91C30H501V',
        iban: 'IT66H0501812345000007778889',
        documentNumber: 'DOC1009'
    },
    {
        id: 10,
        alias: 'Keystone',
        email: 'keystone@example.test',
        accessCode: 'KYS010',
        fiscalCode: 'RZZLRA86A12F205M',
        vatNumber: '90817263544',
        fiscalIdOrVat: '90817263544',
        iban: 'IT89L0326812345000009990001',
        documentNumber: 'DOC1010'
    },
    {
        id: 11,
        alias: 'Ledger',
        email: 'ledger@example.test',
        accessCode: 'LDG011',
        fiscalCode: 'LDRPLA84D22H501S',
        vatNumber: '74185296301',
        fiscalIdOrVat: 'LDRPLA84D22H501S',
        iban: 'IT41M0310412345000002223334',
        documentNumber: 'DOC1011'
    }
];

const anomalyPatches = [
    { id: 2, alias: 'Atlas' },
    { id: 3, alias: '' },
    { id: 4, email: 'bad-email' },
    { id: 5, accessCode: 'x1' },
    { id: 6, fiscalCode: 'ABC123' },
    { id: 7, vatNumber: '123' },
    { id: 8, fiscalIdOrVat: 'ABC123' },
    { id: 9, iban: 'IT00X123' },
    { id: 10, documentNumber: 'TMP12345' },
    {
        id: 11,
        alias: 'Atlas',
        email: 'ledger.example.test',
        accessCode: 'LDG11',
        fiscalCode: 'ABC123',
        fiscalIdOrVat: 'ABC123',
        iban: 'IT41M03104',
        documentNumber: 'TMP2040'
    }
];

export default function validation(app) {
    app.innerHTML = `
        <h2 data-i18n="examples.validation.title">Validation</h2>
        <p class="demo-note" data-i18n="examples.validation.intro">Most validations run when you leave an edited cell. The toolbar can create intentional errors, open the report, or reset the data.</p>
        <details class="demo-disclosure">
            <summary class="demo-disclosure__summary" data-i18n="examples.validation.detailsTitle">Validation rules and limits</summary>
            <div class="demo-disclosure__content">
                <ul class="demo-explanation-list">
                    <li><strong data-i18n="examples.validation.point1Title">Field rules</strong><span data-i18n="examples.validation.detail1">Fields demonstrate required, unique, length, pattern, and format rules.</span></li>
                    <li><strong data-i18n="examples.validation.point2Title">Visible errors</strong><span data-i18n="examples.validation.detail2">Leaving an invalid edited cell associates feedback with that cell and row.</span></li>
                    <li><strong data-i18n="examples.validation.point3Title">Valid and invalid data</strong><span data-i18n="examples.validation.detail3">Create anomalies makes the contrast visible; the report lists the rules that failed.</span></li>
                    <li><strong data-i18n="examples.validation.point4Title">Payload and save</strong><span data-i18n="examples.validation.detail4">Invalid changed rows cannot enter the save-ready portion of the payload.</span></li>
                    <li><strong data-i18n="examples.validation.point5Title">Correct and retry</strong><span data-i18n="examples.validation.detail5">Correct a highlighted value and validate again to clear its error.</span></li>
                </ul>
            </div>
        </details>
        <div class="demo-table-workbench">
            <div id="validation-table" class="demo-business-grid"></div>
        </div>
    `;

    const demo = AMB.table({
        selector: '#validation-table',
        deleteColumn: {
            enabled: true,
            actions: {
                delete: false,
                rollback: true,
                removeNew: false
            },
            confirmDeleteMessage: 'Delete this row?',
            confirmRollbackMessage: 'Rollback this row?',
            confirmRemoveNewMessage: 'Remove this new row?'
        },
        toolbar: {
            buttons: [
                {
                    id: 'create-anomalies',
                    label: 'Create anomalies',
                    title: 'Create intentional validation errors',
                    onClick: handleCreateAnomalies
                },
                {
                    id: 'show-report',
                    label: 'Show report',
                    title: 'Show validation report',
                    onClick: handleShowReport
                },
                {
                    id: 'reset-data',
                    label: 'Reset data',
                    title: 'Reset validation demo data',
                    onClick: handleResetData
                }
            ]
        },
        data: validationData,
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', minWidth: 65, widthGrow: 0.45 },
            {
                title: 'Alias',
                field: 'alias',
                minWidth: 95,
                widthGrow: 0.8,
                editor: AMB.editors.text({ trim: true, maxLength: 20 }),
                required: true,
                requiredMessage: 'Alias is required',
                validation: {
                    minLength: {
                        value: 3,
                        message: 'Alias must be at least 3 characters'
                    },
                    maxLength: {
                        value: 20,
                        message: 'Alias must be at most 20 characters'
                    },
                    unique: {
                        caseSensitive: false,
                        message: 'Alias must be unique'
                    }
                }
            },
            {
                title: 'Email',
                field: 'email',
                minWidth: 145,
                widthGrow: 1.35,
                editor: AMB.editors.text({ trim: true, maxLength: 80 }),
                validation: {
                    email: {
                        message: 'Email must be a valid address, for example name@example.com'
                    }
                }
            },
            {
                title: 'Access Code',
                field: 'accessCode',
                minWidth: 105,
                widthGrow: 0.8,
                editor: AMB.editors.text({ uppercase: true, trim: true, maxLength: 6 }),
                validation: {
                    pattern: {
                        regex: /^[A-Z]{3}[0-9]{3}$/,
                        message: 'Access Code must contain exactly 3 uppercase letters followed by 3 digits, e.g. ABC001'
                    }
                }
            },
            {
                title: 'Codice Fiscale',
                field: 'fiscalCode',
                minWidth: 135,
                widthGrow: 1.05,
                editor: AMB.editors.text({ uppercase: true, trim: true, maxLength: 16 }),
                validation: {
                    codiceFiscale: {
                        message: 'Codice Fiscale must follow the Italian fiscal code format'
                    }
                }
            },
            {
                title: 'Partita IVA',
                field: 'vatNumber',
                minWidth: 110,
                widthGrow: 0.85,
                editor: AMB.editors.text({ trim: true, maxLength: 11 }),
                validation: {
                    pattern: {
                        regex: /^[0-9]{11}$/,
                        message: 'Partita IVA must contain exactly 11 digits'
                    }
                }
            },
            {
                title: 'CF or P.IVA',
                field: 'fiscalIdOrVat',
                minWidth: 130,
                widthGrow: 1,
                editor: AMB.editors.text({ uppercase: true, trim: true, maxLength: 16 }),
                validation: {
                    anyOf: {
                        message: 'Enter a valid Codice Fiscale or Partita IVA',
                        validators: [
                            {
                                type: 'codiceFiscale',
                                message: 'Invalid Codice Fiscale'
                            },
                            {
                                type: 'pattern',
                                regex: /^[0-9]{11}$/,
                                message: 'Invalid Partita IVA'
                            }
                        ]
                    }
                }
            },
            {
                title: 'Italian IBAN',
                field: 'iban',
                minWidth: 155,
                widthGrow: 1.25,
                editor: AMB.editors.text({ uppercase: true, trim: true, maxLength: 27 }),
                validation: {
                    italianIban: {
                        message: 'Italian IBAN must contain 27 characters, e.g. IT60X0542811101000000123456'
                    }
                }
            },
            {
                title: 'Passport/Document',
                field: 'documentNumber',
                minWidth: 135,
                widthGrow: 1,
                editor: AMB.editors.text({ uppercase: true, trim: true, maxLength: 20 }),
                validation: {
                    pattern: {
                        regex: /^[A-Z0-9]{6,20}$/,
                        message: 'Document number must contain 6 to 20 alphanumeric characters'
                    }
                },
                validator: AMB.validators.custom(
                    'Document number cannot start with reserved prefix TMP',
                    hasReservedDocumentPrefix
                )
            }
        ]
    });
    const { crud } = demo;
    const reportDialog = createDemoReportDialog();
    const originalDestroy = demo.destroy.bind(demo);

    const openValidationReport = () => {
        const details = {
            validateResult: null,
            validationScope: 'state',
            stateReport: crud.getStateReport()
        };

        reportDialog.open({
            title: 'Validation report',
            reportText: buildReadableReport(details),
            jsonData: details
        });
    };

    demo.destroy = () => {
        reportDialog.destroy();
        originalDestroy();
    };

    async function handleCreateAnomalies() {
        demo.feedback.clear();

        anomalyPatches.forEach(({ id, ...patch }) => {
            crud.updateRow(id, patch);
        });

        await new Promise(resolve => window.setTimeout(resolve, 0));
        crud.validateChanges();
        demo.feedback.show({
            type: 'warning',
            message: 'Anomalies created. Check highlighted cells or open the report.'
        });
    }

    function handleShowReport() {
        openValidationReport();
    }

    async function handleResetData() {
        demo.feedback.clear();
        crud.getStateReport().rows.forEach(row => {
            crud.rollbackRow(row.key);
        });

        await new Promise(resolve => window.setTimeout(resolve, 0));
        demo.feedback.show({
            type: 'success',
            message: 'Validation demo data reset.'
        });
    }

    return demo;
}
