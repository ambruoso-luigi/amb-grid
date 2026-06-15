import { AMB } from '../index.js';

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
    lines.push('The JSON tab contains the raw validation result and CrudHelper state report for integration/debugging.');

    return lines.join('\n');
};

const createReportDialog = () => {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');
    const header = document.createElement('div');
    const title = document.createElement('h3');
    const tabs = document.createElement('div');
    const summaryButton = document.createElement('button');
    const jsonButton = document.createElement('button');
    const content = document.createElement('pre');
    const actions = document.createElement('div');
    const closeButton = document.createElement('button');
    let currentPayload = null;

    overlay.className = 'validation-report-dialog';
    overlay.hidden = true;
    dialog.className = 'validation-report-dialog__panel';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'validation-report-dialog-title');
    header.className = 'validation-report-dialog__header';
    title.id = 'validation-report-dialog-title';
    title.className = 'validation-report-dialog__title';
    title.textContent = 'Validation report';
    tabs.className = 'validation-report-dialog__tabs';
    summaryButton.type = 'button';
    summaryButton.className = 'validation-report-dialog__tab';
    summaryButton.textContent = 'Summary';
    jsonButton.type = 'button';
    jsonButton.className = 'validation-report-dialog__tab';
    jsonButton.textContent = 'JSON';
    content.className = 'validation-report-dialog__content';
    actions.className = 'validation-report-dialog__actions';
    closeButton.type = 'button';
    closeButton.className = 'validation-report-dialog__button';
    closeButton.textContent = 'Close';

    tabs.append(summaryButton, jsonButton);
    header.append(title, tabs);
    actions.append(closeButton);
    dialog.append(header, content, actions);
    overlay.append(dialog);
    document.body.append(overlay);

    const setMode = mode => {
        if (!currentPayload) return;

        const isJson = mode === 'json';

        summaryButton.classList.toggle('is-active', !isJson);
        jsonButton.classList.toggle('is-active', isJson);
        content.textContent = isJson
            ? JSON.stringify(currentPayload, null, 2)
            : buildReadableReport(currentPayload);
    };

    const close = () => {
        overlay.hidden = true;
        document.removeEventListener('keydown', handleKeyDown);
    };

    function handleKeyDown(event) {
        if (event.key === 'Escape') {
            close();
        }
    }

    summaryButton.addEventListener('click', () => setMode('summary'));
    jsonButton.addEventListener('click', () => setMode('json'));
    closeButton.addEventListener('click', close);
    overlay.addEventListener('click', event => {
        if (event.target === overlay) {
            close();
        }
    });

    return {
        open(payload, mode = 'summary') {
            currentPayload = payload;
            overlay.hidden = false;
            document.addEventListener('keydown', handleKeyDown);
            setMode(mode);
            closeButton.focus();
        },
        destroy() {
            document.removeEventListener('keydown', handleKeyDown);
            overlay.remove();
        }
    };
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
        <h2>Validation</h2>
        <p class="demo-note">Most validations run when you leave an edited cell. For demo purposes, this page also provides a full-table audit and a changed/new rows validation flow for CRUD save scenarios.</p>
        <div class="demo-note">
            <strong>Validation rules:</strong>
            <ul>
                <li>Alias: required, unique, 3-20 characters</li>
                <li>Email: valid email syntax</li>
                <li>Access Code: modular example: the editor uppercases input, then a pattern validator checks 3 letters + 3 digits, e.g. ABC001</li>
                <li>Codice Fiscale: syntactic Italian fiscal code format, e.g. RSSMRA80A01H501U</li>
                <li>Partita IVA: syntactic 11-digit format, e.g. 12345678901</li>
                <li>Codice Fiscale / Partita IVA: accepts either a syntactic Codice Fiscale or an 11-digit Partita IVA using AMB.validators.anyOf</li>
                <li>Italian IBAN: syntactic Italian IBAN format, spaces ignored by the validator; no checksum, bank, account, official, fiscal, or existence check is performed</li>
                <li>Passport/Document: 6-20 alphanumeric characters; custom rule rejects TMP prefixes</li>
            </ul>
            <p>Format-specific validators in this demo are syntactic checks only. They do not replace backend validation, official verification, checksum validation where not implemented, authorization, or business rules.</p>
            <p><strong>Validate all</strong> audits the whole table. <strong>Validate changed rows</strong> validates only new or modified rows, while clean rows remain available as comparison context for validators such as unique.</p>
        </div>
        <div class="toolbar">
            <button type="button" id="action-validate-all">Validate all</button>
            <button type="button" id="action-validate-changes">Validate changed rows</button>
            <button type="button" id="action-create-anomalies">Create anomalies</button>
            <button type="button" id="action-show-report">Show report</button>
        </div>
        <div id="validation-table"></div>
        <style>
            .validation-report-dialog[hidden] {
                display: none;
            }

            .validation-report-dialog {
                align-items: center;
                background: rgb(15 23 42 / 38%);
                box-sizing: border-box;
                display: flex;
                inset: 0;
                justify-content: center;
                padding: 24px;
                position: fixed;
                z-index: 10030;
            }

            .validation-report-dialog__panel {
                background: #ffffff;
                border: 1px solid #d6dde8;
                border-radius: 8px;
                box-shadow: 0 18px 48px rgb(15 23 42 / 22%);
                box-sizing: border-box;
                display: grid;
                gap: 14px;
                max-height: calc(100vh - 48px);
                max-width: 960px;
                padding: 18px;
                width: min(960px, calc(100vw - 48px));
            }

            .validation-report-dialog__header {
                align-items: center;
                display: flex;
                gap: 12px;
                justify-content: space-between;
            }

            .validation-report-dialog__title {
                color: #172033;
                font-size: 18px;
                line-height: 1.25;
                margin: 0;
            }

            .validation-report-dialog__tabs {
                display: inline-flex;
                gap: 6px;
            }

            .validation-report-dialog__tab,
            .validation-report-dialog__button {
                background: #ffffff;
                border: 1px solid #b8bec8;
                border-radius: 5px;
                color: #222;
                cursor: pointer;
                font: inherit;
                padding: 8px 12px;
            }

            .validation-report-dialog__tab:hover,
            .validation-report-dialog__button:hover,
            .validation-report-dialog__tab.is-active {
                background: #f4f6fb;
            }

            .validation-report-dialog__tab.is-active {
                border-color: #6b7cff;
            }

            .validation-report-dialog__content {
                background: #f7f7f7;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
                color: #222;
                margin: 0;
                max-height: min(620px, calc(100vh - 180px));
                overflow: auto;
                padding: 12px;
                white-space: pre-wrap;
            }

            .validation-report-dialog__actions {
                display: flex;
                justify-content: flex-end;
            }
        </style>
    `;

    const demo = AMB.table({
        selector: '#validation-table',
        height: '420px',
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
        data: validationData,
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 70 },
            {
                title: 'Alias',
                field: 'alias',
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
                        message: 'Alias must be unique'
                    }
                }
            },
            {
                title: 'Email',
                field: 'email',
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
    const reportDialog = createReportDialog();
    const originalDestroy = demo.destroy;

    const openValidationReport = (validateResult, mode = 'summary', validationScope = 'changes') => {
        reportDialog.open({
            validateResult,
            validationScope,
            stateReport: crud.getStateReport()
        }, mode);
    };

    demo.destroy = () => {
        reportDialog.destroy();

        if (typeof originalDestroy === 'function') {
            originalDestroy();
        }
    };

    app.querySelector('#action-validate-all').addEventListener('click', () => {
        openValidationReport(crud.validateAll(), 'summary', 'full');
    });

    app.querySelector('#action-validate-changes').addEventListener('click', () => {
        openValidationReport(crud.validateChanges(), 'summary', 'changes');
    });

    app.querySelector('#action-create-anomalies').addEventListener('click', () => {
        anomalyPatches.forEach(({ id, ...patch }) => {
            crud.updateRow(id, patch);
        });

        window.setTimeout(() => {
            openValidationReport(crud.validateChanges(), 'summary', 'changes');
        }, 0);
    });

    app.querySelector('#action-show-report').addEventListener('click', () => {
        reportDialog.open({
            validateResult: null,
            validationScope: 'state',
            stateReport: crud.getStateReport()
        }, 'json');
    });

    return demo;
}
