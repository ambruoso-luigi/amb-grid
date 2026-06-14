import { AMB } from '../index.js';

const hasReservedDocumentPrefix = value => {
    if (value === null || value === undefined || String(value).trim() === '') return true;

    return !String(value).toUpperCase().startsWith('TMP');
};

const createReportDialog = () => {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');
    const title = document.createElement('h3');
    const report = document.createElement('pre');
    const actions = document.createElement('div');
    const closeButton = document.createElement('button');

    overlay.className = 'validation-report-dialog';
    overlay.hidden = true;
    dialog.className = 'validation-report-dialog__panel';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'validation-report-dialog-title');
    title.id = 'validation-report-dialog-title';
    title.className = 'validation-report-dialog__title';
    title.textContent = 'Validation report';
    report.className = 'validation-report-dialog__content';
    actions.className = 'validation-report-dialog__actions';
    closeButton.type = 'button';
    closeButton.className = 'validation-report-dialog__button';
    closeButton.textContent = 'Close';

    actions.append(closeButton);
    dialog.append(title, report, actions);
    overlay.append(dialog);
    document.body.append(overlay);

    const close = () => {
        overlay.hidden = true;
        document.removeEventListener('keydown', handleKeyDown);
    };

    function handleKeyDown(event) {
        if (event.key === 'Escape') {
            close();
        }
    }

    closeButton.addEventListener('click', close);
    overlay.addEventListener('click', event => {
        if (event.target === overlay) {
            close();
        }
    });

    return {
        open(content) {
            report.textContent = content;
            overlay.hidden = false;
            document.addEventListener('keydown', handleKeyDown);
            closeButton.focus();
        },
        destroy() {
            document.removeEventListener('keydown', handleKeyDown);
            overlay.remove();
        }
    };
};

export default function validation(app) {
    app.innerHTML = `
        <h2>Validation</h2>
        <p class="demo-note">Most validations run when you leave an edited cell. For demo purposes, this page also provides a Validate all button to validate every row at once, including cells that were never edited.</p>
        <div class="demo-note">
            <strong>Validation rules:</strong>
            <ul>
                <li>Alias: required, unique, 3-20 characters</li>
                <li>Email: valid email format</li>
                <li>Access Code: 3 uppercase letters + 3 digits, e.g. ABC001</li>
                <li>Codice Fiscale: Italian fiscal code format, e.g. RSSMRA80A01H501U</li>
                <li>Partita IVA: exactly 11 digits, e.g. 12345678901</li>
                <li>Codice Fiscale / Partita IVA: accepts either a valid Codice Fiscale or a valid Partita IVA using AMB.validators.anyOf.</li>
                <li>International IBAN: international IBAN syntax, spaces allowed, e.g. GB82 WEST 1234 5698 7654 32</li>
                <li>Italian IBAN: Italian IBAN syntax, e.g. IT60X0542811101000000123456</li>
                <li>Passport/Document: 6-20 alphanumeric characters; custom rule rejects TMP prefixes</li>
            </ul>
        </div>
        <div class="toolbar">
            <button type="button" id="action-validate-all">Validate all</button>
            <button type="button" id="action-show-report">Show report</button>
        </div>
        <div id="validation-table"></div>
        <pre class="demo-output" id="validation-output"></pre>
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

            .validation-report-dialog__title {
                color: #172033;
                font-size: 18px;
                line-height: 1.25;
                margin: 0;
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

            .validation-report-dialog__button {
                background: #ffffff;
                border: 1px solid #b8bec8;
                border-radius: 5px;
                color: #222;
                cursor: pointer;
                font: inherit;
                padding: 8px 12px;
            }

            .validation-report-dialog__button:hover {
                background: #f4f6fb;
            }
        </style>
    `;

    const demo = AMB.table({
        selector: '#validation-table',
        height: '360px',
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
        data: [
            {
                id: 1,
                alias: 'Nova',
                email: 'nova@example.test',
                accessCode: 'ABC001',
                fiscalCode: 'RSSMRA80A01H501U',
                vatNumber: '12345678901',
                fiscalIdOrVat: 'RSSMRA80A01H501U',
                internationalIban: 'GB82 WEST 1234 5698 7654 32',
                iban: 'IT60X0542811101000000123456',
                documentNumber: 'YA123456'
            },
            {
                id: 2,
                alias: 'Quill',
                email: 'quill@example.test',
                accessCode: 'QIL220',
                fiscalCode: 'BNCLGU85C10F205Z',
                vatNumber: '98765432109',
                fiscalIdOrVat: '98765432109',
                internationalIban: 'DE89 3704 0044 0532 0130 00',
                iban: 'IT23A0306909606100000123456',
                documentNumber: 'P1234567'
            },
            {
                id: 3,
                alias: '',
                email: 'bad-email',
                accessCode: 'x1',
                fiscalCode: 'ABC123',
                vatNumber: '123',
                fiscalIdOrVat: 'ABC123',
                internationalIban: 'ABC123',
                iban: 'IT123',
                documentNumber: 'A1'
            },
            {
                id: 4,
                alias: 'Iris',
                email: 'iris@example.test',
                accessCode: 'IRS004',
                fiscalCode: 'VRDLGI90B15F205X',
                vatNumber: '11122233344',
                fiscalIdOrVat: '11122233344',
                internationalIban: 'FR14 2004 1010 0505 0001 3M02 606',
                iban: 'IT60X0542811101000000123456',
                documentNumber: 'TMP12345'
            },
            {
                id: 5,
                alias: 'Io',
                email: 'io@example.test',
                accessCode: 'IOA005',
                fiscalCode: 'PLLMRC76D20H501Y',
                vatNumber: '55566677788',
                fiscalIdOrVat: 'PLLMRC76D20H501Y',
                internationalIban: 'GB82WEST12345698765432',
                iban: 'IT00X123',
                documentNumber: 'DOC789'
            },
            {
                id: 6,
                alias: 'VeryLongAliasOverTwenty',
                email: 'mira@example.test',
                accessCode: 'MIR006',
                fiscalCode: 'RSSMRA80A01H501U',
                vatNumber: '12345678901',
                fiscalIdOrVat: 'not-valid',
                internationalIban: 'NL91 ABNA 0417 1643 00',
                iban: 'IT23A0306909606100000123456',
                documentNumber: 'Z9PASS88'
            }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 80 },
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
                title: 'International IBAN',
                field: 'internationalIban',
                editor: AMB.editors.text({ uppercase: true, trim: true, maxLength: 42 }),
                validation: {
                    iban: {
                        message: 'Enter a valid international IBAN'
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
    const output = app.querySelector('#validation-output');
    const reportDialog = createReportDialog();
    const originalDestroy = demo.destroy;

    demo.destroy = () => {
        reportDialog.destroy();

        if (typeof originalDestroy === 'function') {
            originalDestroy();
        }
    };

    app.querySelector('#action-validate-all').addEventListener('click', () => {
        const validateResult = crud.validateAll();

        output.textContent = JSON.stringify({
            validateResult,
            report: crud.getStateReport()
        }, null, 2);
    });

    app.querySelector('#action-show-report').addEventListener('click', () => {
        reportDialog.open(JSON.stringify(crud.getStateReport(), null, 2));
    });

    return demo;
}
