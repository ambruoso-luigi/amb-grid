import { AMB } from '../index.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';
import { createDemoCommandGuideToolbar } from './utils/demo-command-guide-toolbar.js';
import { createDemoActionTutorial } from './components/demo-action-tutorial.js';
import { demoIcon } from './demo-icons.js';
import { publicExampleTranslations } from './example-copy.js';

const fileNameViolation = value => {
    if (typeof value !== 'string' || value.trim() === '' || value === '.' || value === '..') return 'fileNameEmpty';
    if (/[\x00-\x1f<>:"\/\\|?*]/.test(value)) return 'fileNameCharacter';
    if (/[. ]$/.test(value)) return 'fileNameTrailing';
    const baseName = value.split('.')[0].replace(/ +$/, '');
    if (/^(?:CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])$/i.test(baseName)) return 'fileNameReserved';
    return null;
};

const buildReadableReport = ({ validateResult, stateReport, validationScope }, fileNameLabel) => {
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
            const rowValue = stateReport.rows.find(row => row.id === error.id)?.after?.[error.field];
            const value = error.value !== undefined ? error.value : rowValue;
            const valueLabel = value !== undefined
                ? ` (value: ${JSON.stringify(value)})`
                : '';

            lines.push(`  - ${error.field === 'fileName' ? fileNameLabel : error.field}: ${error.message}${valueLabel}`);
        });
    });

    lines.push('');
    lines.push('Use the JSON tab to inspect the raw validation result and AMB Grid state report for integration/debugging.');

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
        fileName: 'Report2026.pdf'
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
        fileName: 'Clienti.xlsx'
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
        fileName: 'Anagrafica.csv'
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
        fileName: 'Bilancio2026.pdf'
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
        fileName: 'Preventivo.docx'
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
        fileName: 'Inventario.csv'
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
        fileName: 'Archivio.zip'
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
        fileName: 'Documento'
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
        fileName: 'Contatti_2026.csv'
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
        fileName: 'Riepilogo@2026.pdf'
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
        fileName: 'Note finali.txt'
    }
];

const anomalyPatches = [
    { id: 2, alias: 'Atlas' },
    { id: 3, alias: '' },
    { id: 4, email: 'bad-email' },
    { id: 5, accessCode: 'x1' },
    { id: 6, fiscalIdOrVat: 'ABC123' },
    { id: 7, iban: 'IT00X123' },
    { id: 8, fiscalIdOrVat: 'ABC123' },
    { id: 9, iban: 'IT00X123' },
    { id: 10, fileName: 'CON.txt' },
    {
        id: 11,
        alias: 'Atlas',
        email: 'ledger.example.test',
        accessCode: 'LDG11',
        fiscalIdOrVat: 'ABC123',
        iban: 'IT41M03104',
        fileName: 'Report?.pdf'
    }
];

export default function validation(app) {
    app.innerHTML = `
        <div class="demo-crud-heading">
            <h2 data-i18n="examples.validation.title">Validation</h2>
            <div class="demo-crud-heading__commands">
                <button type="button" class="demo-crud-tutorial-launch" data-action="tutorial-launch" aria-controls="validation-tutorial" aria-expanded="false">${demoIcon('tutorialPlay', { size: 21, strokeWidth: 2.6 })}<span>Start tutorial</span></button>
        ${createDemoColumnGuide({
            summary: 'Validation technical guide',
            summaryKey: 'examples.validation.detailsTitle',
            summaryIcon: 'guideText', variant: 'technical',
            className: 'demo-column-guide--validation',
            intro: 'The seven columns demonstrate automatic validation when edits are committed, multiple rules on the same cell, and two ways to customize validation: regular expressions and JavaScript functions. Create anomalies and Report let you inspect the resulting errors.',
            introKey: 'examples.validation.guideIntro',
            points: [
                { title: 'Immediate validation', titleKey: 'examples.validation.point1Title', description: 'When you commit a cell edit, AMB Grid automatically runs its configured validators. For example, Alias checks required values, minimum and maximum length, and uniqueness. Each rule can provide its own error message.', descriptionKey: 'examples.validation.detail1' },
                { title: 'Visible errors', titleKey: 'examples.validation.point2Title', description: 'When validation fails, the cell is highlighted and displays the message associated with the failed rule. Rollback restores the original value and clears the error.', descriptionKey: 'examples.validation.detail2' },
                { title: 'Custom validation', titleKey: 'examples.validation.point3Title', description: 'AMB Grid lets developers customize validation in two ways:', descriptionKey: 'examples.validation.detail3' },
                { title: 'Valid and invalid data', titleKey: 'examples.validation.point4Title', description: 'Create anomalies generates different invalid values to demonstrate how AMB Grid highlights validation errors. Report provides a summary of the failed rules.', descriptionKey: 'examples.validation.detail4' },
                { title: 'Alternative validation', titleKey: 'examples.validation.point5Title', description: 'The CF or P.IVA column uses AMB.validators.anyOf(): a value is accepted if it matches either an Italian fiscal code format or an 11-digit VAT number.', descriptionKey: 'examples.validation.detail5' },
                { title: 'Rollback', titleKey: 'examples.validation.point6Title', description: "Rollback restores the row's original values and clears errors introduced by the reverted changes.", descriptionKey: 'examples.validation.detail6' }
            ],
            columns: [
                { title: 'ID', titleKey: 'guides.validation.id.title', badge: 'ID', description: 'Persistent identifier used as validation context.', descriptionKey: 'guides.validation.id.description' },
                { title: 'Alias', titleKey: 'guides.validation.alias.title', badge: 'REQUIRED', description: 'Required, case-insensitive unique value between 3 and 20 characters.', descriptionKey: 'guides.validation.alias.description' },
                { title: 'Email', titleKey: 'guides.validation.email.title', badge: 'EMAIL', description: 'Checks whether the value follows a valid email-address format.', descriptionKey: 'guides.validation.email.description' },
                { title: 'Access Code', titleKey: 'guides.validation.accessCode.title', badge: 'PATTERN', description: 'Uses the built-in pattern validator with a developer-defined regex: exactly 3 uppercase letters followed by 3 digits.', descriptionKey: 'guides.validation.accessCode.description' },
                { title: 'CF or P.IVA', titleKey: 'guides.validation.combined.title', badge: 'ANY OF', description: 'Accepts a valid Italian fiscal code or an 11-digit VAT number.', descriptionKey: 'guides.validation.combined.description' },
                { title: 'Italian IBAN', titleKey: 'guides.validation.iban.title', badge: 'IBAN', description: 'Checks the expected 27-character Italian IBAN format.', descriptionKey: 'guides.validation.iban.description' },
                { title: 'File name', titleKey: 'guides.validation.fileName.title', badge: 'CUSTOM', description: 'Uses a custom JavaScript function to check forbidden characters and other Windows file-naming rules.', descriptionKey: 'guides.validation.fileName.description' }
            ]
        })}
            </div>
        </div>
        <p class="demo-note" data-i18n="examples.validation.intro" data-i18n-emphasis="examples.validation.introEmphasis">Validation demonstrates built-in rules and developer-defined custom checks. Edit cells to see immediate validation, or use Create anomalies and Report to explore validation errors.</p>
        <div class="demo-action-tutorial-host"></div>
        <div class="demo-table-workbench">
            <div class="demo-command-guide-host"></div>
            <div id="validation-table" class="demo-business-grid demo-business-grid--viewport demo-validation-grid"></div>
        </div>
    `;

    const guideCopy = publicExampleTranslations[document.documentElement.lang === 'en' ? 'en' : 'it'];
    const customGuidePoint = app.querySelectorAll('.demo-crud-heading .demo-disclosure--technical .demo-explanation-list > li')[2];
    for (const suffix of ['Bullet1', 'Bullet2', 'End']) {
        const key = `examples.validation.detail3${suffix}`;
        const line = document.createElement('span');
        line.dataset.i18n = key;
        line.textContent = guideCopy[key];
        if (suffix !== 'End') line.dataset.i18nEmphasis = `${key}Emphasis`;
        customGuidePoint.append(line);
    }
    app.querySelectorAll('.demo-column-guide--validation .demo-column-guide__title').forEach((title, index) => {
        const key = `guides.validation.${['id', 'alias', 'email', 'accessCode', 'combined', 'iban', 'fileName'][index]}.title`;
        title.dataset.i18n = key;
        if (index === 6 && document.documentElement.lang !== 'en') title.textContent = 'Nome file';
    });

    let destroyed = false;
    let demo = null;
    let tutorialState = null;
    let highlightedControl = null;
    let highlightedStep = null;
    let rowActionGlow = null;
    let rowActionGlowFrame = null;
    let guidedRollbackConfirmation = null;
    let tutorialStarted = false;
    let scenarioGeneration = 0;
    const editCandidates = new Map();
    let pendingRollback = null;
    let anomalyErrorKeys = null;
    let editingCell = null;
    const secondRowId = validationData[1].id;
    const initialSecondRow = validationData[1];
    const aliasMinLength = 3;
    const aliasUniqueOptions = { caseSensitive: false };
    const aliasMinLengthRule = AMB.validators.minLength(aliasMinLength);
    const aliasUniqueRule = AMB.validators.unique({ field: 'alias', ...aliasUniqueOptions });
    const editKey = cell => `${cell.getRow().getData().id}:${cell.getField()}`;
    const t = (key, values = {}) => {
        const message = publicExampleTranslations[document.documentElement.lang === 'en' ? 'en' : 'it'][`examples.validation.${key}`];
        return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), message);
    };
    const validateFileName = value => {
        const violation = fileNameViolation(value);
        return violation ? { isValid: false, message: t(violation), code: violation } : true;
    };
    const tutorialLaunch = app.querySelector('[data-action="tutorial-launch"]');
    const tutorialLaunchLabel = tutorialLaunch.querySelector('span');
    const technicalGuide = app.querySelector('.demo-crud-heading .demo-disclosure--technical');
    const technicalGuideSummary = technicalGuide.querySelector('summary');
    const tutorial = createDemoActionTutorial({
        host: app.querySelector('.demo-action-tutorial-host'),
        variant: 'crud',
        tutorialCopyPrefix: 'examples.validation',
        initiallyHidden: true,
        externalOpenButton: tutorialLaunch,
        panelId: 'validation-tutorial',
        locale: document.documentElement.lang === 'en' ? 'en' : 'it',
        titleKey: 'examples.validation.tutorialTitle',
        completedKey: 'examples.validation.tutorialCompleted',
        onRestart: resetTutorialScenario,
        onCompleteAction: resetTutorialScenario,
        onCompleteSuccess: finishTutorial,
        onStateChange: state => {
            if (tutorialState && (tutorialState.stepId !== state.stepId || tutorialState.actionIndex !== state.actionIndex)) {
                guidedRollbackConfirmation = null;
            }
            tutorialState = state;
            if (state.hidden || state.resetting || state.destroyed) {
                editCandidates.clear();
                pendingRollback = null;
                guidedRollbackConfirmation = null;
            }
            tutorialLaunch.hidden = !state.hidden;
            tutorialLaunch.setAttribute('aria-expanded', String(!state.hidden));
            tutorialLaunchLabel.textContent = t(tutorialStarted ? 'tutorialResume' : 'tutorialStart');
            syncTutorialHighlight();
        },
        steps: [
            {
                id: 'immediate-validation', actionId: 'alias-short', instructionKey: 'examples.validation.tutorialImmediate',
                isComplete: ({ id, field, value, report }) => id === secondRowId && field === 'alias'
                    && typeof value === 'string' && value.length === 2 && aliasMinLengthRule.validate(value) === false
                    && hasCellError(report, id, field, value)
            },
            {
                id: 'message-rollback', actionId: 'rollback', instructionKey: 'examples.validation.tutorialMessageRollback',
                isComplete: ({ id, field, before, after }) => completedRollback(id, field, before, after, 'minLength')
            },
            {
                id: 'multiple-validation', actions: [
                    {
                        actionId: 'alias-unique', instructionKey: 'examples.validation.tutorialMultiple',
                        isComplete: ({ id, field, value, report }) => id === secondRowId && field === 'alias'
                            && typeof value === 'string' && value.length >= 3 && value.length <= 20
                            && aliasUniqueRule.validate(value, demo.table.getRow(id)?.getData(),
                                demo.table.getRow(id)?.getCell(field), demo.crud) === false
                            && hasCellError(report, id, field, value)
                    },
                    {
                        actionId: 'rollback', instructionKey: 'examples.validation.tutorialMultipleRollback',
                        isComplete: ({ id, field, before, after }) => completedRollback(id, field, before, after, 'unique')
                    }
                ]
            },
            {
                id: 'custom-validation', actions: [
                    {
                        actionId: 'file-name-custom', instructionKey: 'examples.validation.tutorialCustom',
                        isComplete: ({ id, field, value, report }) => id === secondRowId && field === 'fileName'
                            && hasFileNameError(report, id, value)
                    },
                    {
                        actionId: 'rollback', instructionKey: 'examples.validation.tutorialCustomRollback',
                        isComplete: ({ id, field, before, after }) => completedRollback(id, field, before, after, 'custom')
                    }
                ]
            },
            {
                id: 'create-anomalies', actionId: 'create-anomalies', instructionKey: 'examples.validation.tutorialAnomalies',
                isComplete: ({ introducedErrors, report }) => introducedErrors > 0 && report.errorRowsCount > 0
                    && report.errors.cells.length >= introducedErrors
            },
            {
                id: 'inspect-report', actionId: 'show-report', instructionKey: 'examples.validation.tutorialReport',
                isComplete: ({ opened, report, errorKeys }) => opened === true && report.errorRowsCount > 0
                    && errorKeys?.size > 0 && errorKeys.size === report.errors.cells.filter(error => errorKeys.has(errorKey(error))).length
            }
        ]
    });
    const commandGuideToolbar = createDemoCommandGuideToolbar(app);
    demo = AMB.table({
        selector: '#validation-table',
        rowActionColumn: {
            enabled: true,
            actions: {
                delete: false,
                rollback: true,
                removeNew: false
            },
            confirmDeleteMessage: 'Delete this row?',
            confirmRollbackMessage: 'Rollback this row?',
            confirmRemoveNewMessage: 'Remove this new row?',
            confirmProvider: handleRowConfirmation
        },
        toolbar: {
            buttons: [
                'reload',
                {
                    id: 'show-report',
                    label: 'Report',
                    title: 'Show validation report',
                    onClick: handleShowReport
                },
                {
                    id: 'create-anomalies',
                    label: 'Create anomalies',
                    title: 'Create intentional validation errors',
                    onClick: handleCreateAnomalies
                },
                commandGuideToolbar.button
            ],
            onReload: handleReload
        },
        data: validationData.map(row => ({ ...row })),
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', minWidth: 65, widthGrow: 0.45, cssClass: 'demo-cell--passive' },
            {
                title: 'Alias',
                field: 'alias',
                minWidth: 95,
                widthGrow: 0.8,
                editor: AMB.editors.text({ trim: true, maxLength: 20 }),
                validation: {
                    required: {
                        message: 'Alias is required'
                    },
                    minLength: {
                        value: aliasMinLength,
                        message: 'Alias must be at least 3 characters'
                    },
                    maxLength: {
                        value: 20,
                        message: 'Alias must be at most 20 characters'
                    },
                    unique: {
                        ...aliasUniqueOptions,
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
                title: 'CF or P.IVA',
                field: 'fiscalIdOrVat',
                minWidth: 130,
                widthGrow: 1,
                editor: AMB.editors.text({ uppercase: true, trim: true, maxLength: 16 }),
                validator: AMB.validators.anyOf([
                    AMB.validators.codiceFiscale('Invalid Codice Fiscale'),
                    AMB.validators.pattern(/^[0-9]{11}$/, 'Invalid Partita IVA')
                ], 'Enter a valid Codice Fiscale or Partita IVA')
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
                title: document.documentElement.lang === 'en' ? 'File name' : 'Nome file',
                field: 'fileName',
                minWidth: 135,
                widthGrow: 1,
                editor: AMB.editors.text(),
                validator: AMB.validators.custom(t('fileNameInvalid'), validateFileName)
            }
        ]
    });
    tutorialLaunch.addEventListener('click', handleTutorialLaunch);
    commandGuideToolbar.mount();
    const reportDialog = createDemoReportDialog();
    const rowConfirmDialog = new AMB.ConfirmDialog();
    const originalDestroy = demo.destroy.bind(demo);

    function errorKey(error) {
        return `${error.id}:${error.field}:${error.message}`;
    }

    function hasCellError(report, id, field, value) {
        return report.rows.some(row => row.id === id && row.after[field] === value
            && row.cellErrors.some(error => error.field === field));
    }

    function hasFileNameError(report, id, value) {
        const violation = fileNameViolation(value);
        if (!violation) return false;
        const messages = ['it', 'en'].map(locale => publicExampleTranslations[locale][`examples.validation.${violation}`]);
        return report.rows.some(row => row.id === id && row.after.fileName === value
            && row.cellErrors.some(error => error.field === 'fileName' && messages.includes(error.message)));
    }

    function rollbackFieldFor(context) {
        if (context?.stepId === 'message-rollback'
            || context?.stepId === 'multiple-validation' && context.actionIndex === 1) return 'alias';
        if (context?.stepId === 'custom-validation' && context.actionIndex === 1) return 'fileName';
        return null;
    }

    function hasExpectedViolation(report, row, field, rule) {
        const value = row?.after[field];
        if (!row?.cellErrors.some(error => error.field === field)) return false;
        if (rule === 'minLength') return typeof value === 'string' && value.length === 2
            && aliasMinLengthRule.validate(value) === false;
        if (rule === 'custom') return hasFileNameError(report, row.id, value);
        if (rule === 'unique' && typeof value === 'string' && value.length >= 3 && value.length <= 20) {
            const normalized = value.trim().toLowerCase();
            return report.rows.some(other => other.id !== row.id && other.state !== 'deleted'
                && typeof other.after.alias === 'string' && other.after.alias.trim().toLowerCase() === normalized);
        }
        return false;
    }

    function completedRollback(id, field, before, after, rule) {
        const oldRow = before?.rows.find(row => row.id === id);
        const restoredRow = after?.rows.find(row => row.id === id);
        return id === secondRowId && oldRow?.state === 'modified'
            && hasExpectedViolation(before, oldRow, field, rule)
            && restoredRow?.state === 'clean' && !restoredRow.hasChanges && !restoredRow.hasErrors
            && restoredRow.after[field] === initialSecondRow[field]
            && !restoredRow.cellErrors.some(error => error.field === field);
    }

    async function handleRowConfirmation({ action, id }) {
        pendingRollback = null;
        const context = tutorial.capture();
        const field = action === 'rollback' && id === secondRowId ? rollbackFieldFor(context) : null;
        const before = field ? demo.getStateReport() : null;
        const recordId = typeof id === 'number' && Number.isFinite(id) || typeof id === 'string' && /^\d+$/.test(id.trim())
            ? String(id).trim() : '';
        const confirmation = rowConfirmDialog.confirm({
            title: recordId ? t('rollbackTitle', { id: recordId }) : t('rollbackTitleFallback'),
            message: t('rollbackMessage'), confirmText: t('rollbackConfirm'), cancelText: t('rollbackCancel')
        });
        const { element, panelElement, titleElement, confirmButton } = rowConfirmDialog;
        element.classList.add('demo-crud-row-confirm-dialog', 'demo-crud-row-confirm-dialog--rollback');
        if (!panelElement.querySelector('.demo-crud-row-confirm-dialog__header')) {
            const header = document.createElement('div');
            const badge = document.createElement('span');
            header.className = 'demo-crud-row-confirm-dialog__header';
            badge.className = 'demo-crud-row-confirm-dialog__badge';
            badge.setAttribute('aria-hidden', 'true');
            badge.innerHTML = demoIcon('undo2', { size: 22, strokeWidth: 2.2 });
            header.append(badge, titleElement);
            panelElement.prepend(header);
        }
        confirmButton.insertAdjacentHTML('afterbegin', demoIcon('undo2', { size: 18, strokeWidth: 2.2 }));
        const guided = field && rowConfirmDialog.resolveCurrent
            ? { resolver: rowConfirmDialog.resolveCurrent, accepted: false } : null;
        if (guided) {
            guidedRollbackConfirmation = guided;
            syncTutorialHighlight();
        }
        const confirmed = await confirmation;
        if (guided && guidedRollbackConfirmation === guided) {
            if (confirmed) guided.accepted = true;
            else guidedRollbackConfirmation = null;
            syncTutorialHighlight();
            if (!confirmed) globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(() => {
                if (!destroyed && tutorialState?.stepId === context.stepId) syncTutorialHighlight();
            }));
        }
        if (confirmed && field && !destroyed && tutorial.capture()?.generation === context.generation) {
            pendingRollback = { context, id, field, before };
        }
        return confirmed;
    }

    function handleTutorialRollback({ id, previousState, nextState }) {
        const candidate = pendingRollback;
        if (!candidate || id !== candidate.id || previousState !== 'modified' || nextState !== 'clean') return;
        pendingRollback = null;
        globalThis.queueMicrotask(() => {
            if (destroyed) return;
            const after = demo.getStateReport();
            tutorial.notify('rollback', { id, field: candidate.field, before: candidate.before, after }, candidate.context);
            syncTutorialHighlight();
        });
    }

    const handleEditStart = cell => {
        const context = tutorial.capture();
        editingCell = cell.getElement();
        if (highlightedControl === editingCell) clearTutorialHighlight();
        if (!context || !['immediate-validation', 'multiple-validation', 'custom-validation'].includes(context.stepId)) return;
        const id = cell.getRow().getData().id;
        const field = cell.getField();
        if (id !== secondRowId || (context.stepId === 'custom-validation' ? field !== 'fileName' : field !== 'alias')) return;
        editCandidates.set(editKey(cell), { context, id, field, oldValue: cell.getValue() });
    };
    const handleEditCancelled = cell => {
        editCandidates.delete(editKey(cell));
        editingCell = null;
        syncTutorialHighlight();
    };
    const handleEditConfirmed = cell => {
        const key = editKey(cell);
        const candidate = editCandidates.get(key);
        editCandidates.delete(key);
        editingCell = null;
        if (!candidate || destroyed) {
            syncTutorialHighlight();
            return;
        }
        const value = cell.getValue();
        globalThis.queueMicrotask(() => {
            if (destroyed) return;
            const report = demo.getStateReport();
            const actionId = candidate.context.stepId === 'immediate-validation' ? 'alias-short'
                : candidate.context.stepId === 'multiple-validation' ? 'alias-unique' : 'file-name-custom';
            tutorial.notify(actionId, { id: candidate.id, field: candidate.field, value,
                oldValue: candidate.oldValue, report }, candidate.context);
            syncTutorialHighlight();
        });
    };
    demo.table.on('cellEditing', handleEditStart);
    demo.table.on('cellEditCancelled', handleEditCancelled);
    demo.table.on('cellEdited', handleEditConfirmed);
    const unsubscribeRollback = demo.onCrud('row-state-changed', handleTutorialRollback);
    demo.table.on('renderComplete', syncTutorialHighlight);
    demo.table.on('scrollVertical', syncTutorialHighlight);
    demo.table.on('scrollHorizontal', syncTutorialHighlight);
    demo.table.on('dataFiltered', syncTutorialHighlight);
    window.addEventListener('amb-demo-language-change', syncTutorialLaunchLabel);
    syncTutorialHighlight();

    const openValidationReport = () => {
        const details = {
            validateResult: null,
            validationScope: 'state',
            stateReport: demo.getStateReport()
        };

        reportDialog.open({
            title: 'Validation report',
            reportText: buildReadableReport(details, t('fileNameTitle')),
            jsonData: details
        });
        return details;
    };

    demo.destroy = () => {
        destroyed = true;
        scenarioGeneration += 1;
        clearTutorialHighlight();
        editCandidates.clear();
        pendingRollback = null;
        guidedRollbackConfirmation = null;
        anomalyErrorKeys = null;
        editingCell = null;
        tutorialLaunch.removeEventListener('click', handleTutorialLaunch);
        window.removeEventListener('amb-demo-language-change', syncTutorialLaunchLabel);
        demo.table.off('cellEditing', handleEditStart);
        demo.table.off('cellEditCancelled', handleEditCancelled);
        demo.table.off('cellEdited', handleEditConfirmed);
        unsubscribeRollback();
        demo.table.off('renderComplete', syncTutorialHighlight);
        demo.table.off('scrollVertical', syncTutorialHighlight);
        demo.table.off('scrollHorizontal', syncTutorialHighlight);
        demo.table.off('dataFiltered', syncTutorialHighlight);
        reportDialog.destroy();
        rowConfirmDialog.destroy();
        commandGuideToolbar.destroy();
        tutorial.destroy();
        originalDestroy();
    };

    function syncTutorialLaunchLabel() {
        tutorialLaunchLabel.textContent = t(tutorialStarted ? 'tutorialResume' : 'tutorialStart');
        const fileNameHeader = demo.table.getColumn('fileName')?.getElement()
            .querySelector('.tabulator-col-title');
        if (fileNameHeader) fileNameHeader.textContent = t('fileNameTitle');
    }

    function handleTutorialLaunch() {
        if (destroyed || !tutorialState?.hidden) return;
        tutorialLaunch.setAttribute('data-demo-crud-rays-consumed', '');
        const resuming = tutorialStarted;
        tutorialStarted = true;
        if (resuming) tutorial.reopen();
        else void tutorial.restart();
    }

    function finishTutorial({ openGuide }) {
        if (destroyed) return;
        tutorialStarted = false;
        syncTutorialLaunchLabel();
        if (openGuide) {
            technicalGuide.open = true;
            technicalGuideSummary.focus({ preventScroll: true });
        } else tutorialLaunch.focus({ preventScroll: true });
    }

    function clearTutorialHighlight() {
        highlightedControl?.classList.remove('demo-crud-tutorial-target', 'demo-crud-tutorial-target--pulse', 'demo-crud-tutorial-target--rays');
        highlightedControl = null;
        clearRowActionGlow();
    }

    function clearRowActionGlow() {
        if (rowActionGlowFrame !== null) globalThis.cancelAnimationFrame(rowActionGlowFrame);
        rowActionGlowFrame = null;
        if (!rowActionGlow) return;
        window.removeEventListener('scroll', scheduleRowActionGlowSync, true);
        window.removeEventListener('resize', scheduleRowActionGlowSync);
        rowActionGlow.remove();
        rowActionGlow = null;
    }

    function scheduleRowActionGlowSync() {
        if (rowActionGlowFrame !== null) return;
        rowActionGlowFrame = globalThis.requestAnimationFrame(() => {
            rowActionGlowFrame = null;
            if (rowActionGlow && !destroyed) syncTutorialHighlight();
        });
    }

    function syncRowActionGlow(target) {
        if (!rowActionGlow) {
            rowActionGlow = document.createElement('div');
            rowActionGlow.className = 'demo-crud-row-action-glow demo-crud-row-action-glow--pulse demo-crud-row-action-glow--rays';
            rowActionGlow.setAttribute('aria-hidden', 'true');
            document.body.append(rowActionGlow);
            window.addEventListener('scroll', scheduleRowActionGlowSync, true);
            window.addEventListener('resize', scheduleRowActionGlowSync);
        }
        const holder = target.closest('.tabulator-tableholder');
        const bounds = holder?.getBoundingClientRect();
        const rect = target.getBoundingClientRect();
        const visible = bounds && rect.width > 0 && rect.height > 0
            && rect.left >= bounds.left && rect.right <= bounds.right
            && rect.top >= bounds.top && rect.bottom <= bounds.bottom
            && rect.right > 0 && rect.left < window.innerWidth
            && rect.bottom > 0 && rect.top < window.innerHeight;
        rowActionGlow.hidden = !visible;
        if (!visible) return;
        rowActionGlow.style.left = `${rect.left}px`;
        rowActionGlow.style.top = `${rect.top}px`;
        rowActionGlow.style.width = `${rect.width}px`;
        rowActionGlow.style.height = `${rect.height}px`;
    }

    function syncTutorialHighlight() {
        if (!demo || destroyed || !tutorialState || tutorialState.hidden || tutorialState.complete
            || tutorialState.resetting || tutorialState.restartFailed || tutorialState.destroyed) {
            clearTutorialHighlight();
            highlightedStep = null;
            return;
        }
        if (highlightedStep !== tutorialState.stepId) {
            clearTutorialHighlight();
            highlightedStep = tutorialState.stepId;
        }
        const { stepId, actionIndex } = tutorialState;
        let target = null;
        let rowActionTarget = false;
        if (stepId === 'create-anomalies' || stepId === 'inspect-report') {
            target = app.querySelector(`[data-action="${stepId === 'create-anomalies' ? 'create-anomalies' : 'show-report'}"]`);
        } else if (stepId === 'immediate-validation' || stepId === 'message-rollback'
            || stepId === 'multiple-validation' || stepId === 'custom-validation') {
            const field = stepId === 'custom-validation' ? 'fileName' : 'alias';
            const rollback = stepId === 'message-rollback'
                || (stepId === 'multiple-validation' || stepId === 'custom-validation') && actionIndex === 1;
            const row = demo.table.getRow(secondRowId);
            if (rollback && guidedRollbackConfirmation?.accepted) target = null;
            else if (rollback && guidedRollbackConfirmation?.resolver
                && rowConfirmDialog.resolveCurrent === guidedRollbackConfirmation.resolver
                && rowConfirmDialog.element?.classList.contains('demo-crud-row-confirm-dialog--rollback')) {
                target = rowConfirmDialog.confirmButton;
            } else if (rollback) {
                target = row?.getElement().querySelector('[data-action="rollback"]');
                rowActionTarget = true;
            } else target = row?.getCell(field)?.getElement();
        }
        if (target === editingCell) target = null;
        const rays = target?.tagName === 'BUTTON';
        if (target?.isConnected && target.getClientRects().length > 0 && !target.matches(':disabled')) {
            if (highlightedControl === target && target.classList.contains('demo-crud-tutorial-target')
                && target.classList.contains('demo-crud-tutorial-target--pulse')
                && target.classList.contains('demo-crud-tutorial-target--rays') === rays) {
                if (rowActionTarget) syncRowActionGlow(target);
                return;
            }
            clearTutorialHighlight();
            target.classList.add('demo-crud-tutorial-target', 'demo-crud-tutorial-target--pulse');
            if (rays) target.classList.add('demo-crud-tutorial-target--rays');
            highlightedControl = target;
            if (rowActionTarget) syncRowActionGlow(target);
        } else clearTutorialHighlight();
    }

    async function resetTutorialScenario() {
        const generation = ++scenarioGeneration;
        editCandidates.clear();
        pendingRollback = null;
        guidedRollbackConfirmation = null;
        anomalyErrorKeys = null;
        editingCell = null;
        clearTutorialHighlight();
        demo.table.cancelEdit?.();
        reportDialog.close();
        rowConfirmDialog.destroy();
        demo.feedback.clear();
        await demo.setData(validationData.map(row => ({ ...row })));
        if (destroyed || generation !== scenarioGeneration) return false;
        syncTutorialHighlight();
        return true;
    }

    async function handleCreateAnomalies() {
        const generation = scenarioGeneration;
        const context = tutorial.capture();
        const previousErrors = new Set(demo.getStateReport().errors.cells.map(error => `${error.id}:${error.field}`));
        demo.feedback.clear();

        anomalyErrorKeys = null;
        await Promise.all(anomalyPatches.map(({ id, ...patch }) => demo.updateRow(id, patch)));
        if (destroyed || generation !== scenarioGeneration) return;
        demo.validateChanges();
        const report = demo.getStateReport();
        demo.feedback.show({
            type: 'warning',
            message: 'Anomalies created. Check highlighted cells or open the report.'
        });
        const introducedErrors = report.errors.cells.filter(error => !previousErrors.has(`${error.id}:${error.field}`)).length;
        if (context?.stepId === 'create-anomalies' && introducedErrors > 0) {
            anomalyErrorKeys = new Set(report.errors.cells
                .filter(error => !previousErrors.has(`${error.id}:${error.field}`)).map(errorKey));
        }
        tutorial.notify('create-anomalies', { introducedErrors, report }, context);
    }

    function handleShowReport() {
        const context = tutorial.capture();
        const details = openValidationReport();
        tutorial.notify('show-report', { opened: true, report: details.stateReport,
            errorKeys: anomalyErrorKeys }, context);
    }

    async function handleReload() {
        const wasHidden = tutorialState?.hidden;
        const reset = tutorialStarted ? tutorial.restart() : resetTutorialScenario();
        if (tutorialStarted && wasHidden) tutorial.skip();
        const restored = await reset;
        if (restored) demo.feedback.show({
            type: 'success', message: 'Validation demo data reloaded.'
        });
    }

    return demo;
}
