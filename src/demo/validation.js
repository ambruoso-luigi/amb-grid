import { AMB } from '../index.js';

const hasReservedDocumentPrefix = value => {
    if (value === null || value === undefined || String(value).trim() === '') return true;

    return !String(value).toUpperCase().startsWith('TMP');
};

export default function validation(app) {
    app.innerHTML = `
        <h2>Validation</h2>
        <p class="demo-note">Edit cells or press Validate all to trigger validation errors.</p>
        <div class="demo-note">
            <strong>Validation rules:</strong>
            <ul>
                <li>Alias: required, 3-20 characters</li>
                <li>Email: valid email format</li>
                <li>Access Code: 3 uppercase letters + 3 digits, e.g. ABC001</li>
                <li>Codice Fiscale: exactly 16 alphanumeric characters, e.g. RSSMRA80A01H501U</li>
                <li>Partita IVA: exactly 11 digits, e.g. 12345678901</li>
                <li>Fiscal ID / VAT: valid Codice Fiscale OR valid Partita IVA</li>
                <li>Italian IBAN: 27 characters, e.g. IT60X0542811101000000123456</li>
                <li>Passport/Document: 6-20 alphanumeric characters; custom rule rejects TMP prefixes</li>
            </ul>
        </div>
        <div class="toolbar">
            <button type="button" id="action-validate-all">Validate all</button>
            <button type="button" id="action-show-report">Show report</button>
        </div>
        <div id="validation-table"></div>
        <pre class="demo-output" id="validation-output"></pre>
    `;

    const demo = AMB.table({
        selector: '#validation-table',
        height: '360px',
        // TODO: support undo-only delete column mode
        deleteColumn: {
            enabled: true,
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
                editor: AMB.editors.text({ trim: true }),
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
                    }
                }
            },
            {
                title: 'Email',
                field: 'email',
                editor: AMB.editors.text({ trim: true }),
                validation: {
                    email: {
                        message: 'Email must be a valid address, for example name@example.com'
                    }
                }
            },
            {
                title: 'Access Code',
                field: 'accessCode',
                editor: AMB.editors.text({ uppercase: true, trim: true }),
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
                editor: AMB.editors.text({ uppercase: true, trim: true }),
                validation: {
                    pattern: {
                        regex: /^[A-Z0-9]{16}$/,
                        message: 'Codice Fiscale must contain exactly 16 alphanumeric characters'
                    }
                }
            },
            {
                title: 'Partita IVA',
                field: 'vatNumber',
                editor: AMB.editors.text({ trim: true }),
                validation: {
                    pattern: {
                        regex: /^[0-9]{11}$/,
                        message: 'Partita IVA must contain exactly 11 digits'
                    }
                }
            },
            {
                title: 'Fiscal ID / VAT',
                field: 'fiscalIdOrVat',
                editor: AMB.editors.text({ uppercase: true, trim: true }),
                validation: {
                    anyOf: {
                        message: 'Enter a valid Codice Fiscale or Partita IVA',
                        validators: [
                            {
                                type: 'pattern',
                                regex: /^[A-Z0-9]{16}$/,
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
                editor: AMB.editors.text({ uppercase: true, trim: true }),
                validation: {
                    pattern: {
                        regex: /^IT[0-9]{2}[A-Z][0-9]{10}[A-Z0-9]{12}$/,
                        message: 'Italian IBAN must contain 27 characters, e.g. IT60X0542811101000000123456'
                    }
                }
            },
            {
                title: 'Passport/Document',
                field: 'documentNumber',
                editor: AMB.editors.text({ uppercase: true, trim: true }),
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

    app.querySelector('#action-validate-all').addEventListener('click', () => {
        const validateResult = crud.validateAll();

        output.textContent = JSON.stringify({
            validateResult,
            report: crud.getStateReport()
        }, null, 2);
    });

    app.querySelector('#action-show-report').addEventListener('click', () => {
        output.textContent = JSON.stringify(crud.getStateReport(), null, 2);
    });

    return demo;
}
