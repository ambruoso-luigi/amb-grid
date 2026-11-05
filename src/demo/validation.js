import { AMB } from '../index.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';
import { createDemoCommandGuideToolbar } from './utils/demo-command-guide-toolbar.js';
import { createDemoActionTutorial } from './components/demo-action-tutorial.js';
import { demoIcon } from './demo-icons.js';
import { publicExampleTranslations } from './example-copy.js';

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
        <div class="demo-crud-heading">
            <h2 data-i18n="examples.validation.title">Validation</h2>
            <div class="demo-crud-heading__commands">
                <button type="button" class="demo-crud-tutorial-launch" data-action="tutorial-launch" aria-controls="validation-tutorial" aria-expanded="false">${demoIcon('tutorialPlay', { size: 21, strokeWidth: 2.6 })}<span>Start tutorial</span></button>
        ${createDemoColumnGuide({
            summary: 'Validation Technical Guide',
            summaryKey: 'examples.validation.detailsTitle',
            summaryMeta: 'Rules · errors · constraints', summaryMetaKey: 'examples.validation.guideMeta', summaryIcon: 'guideText', variant: 'technical',
            className: 'demo-column-guide--validation',
            intro: 'This example shows built-in and custom validation rules. Edit fields, create anomalies and inspect the report to understand how errors are detected and displayed.',
            introKey: 'examples.validation.guideIntro',
            points: [
                { title: 'Field rules', titleKey: 'examples.validation.point1Title', description: 'Fields demonstrate built-in validators such as required, unique, length, pattern, and format, while also supporting custom rules defined by the developer.', descriptionKey: 'examples.validation.detail1', descriptionEmphasisKey: 'examples.validation.detail1Emphasis' },
                { title: 'Visible errors', titleKey: 'examples.validation.point2Title', description: 'Leaving an invalid edited cell associates feedback with that cell and row.', descriptionKey: 'examples.validation.detail2' },
                { title: 'Valid and invalid data', titleKey: 'examples.validation.point3Title', description: 'Create anomalies makes the contrast visible; the report lists the rules that failed.', descriptionKey: 'examples.validation.detail3' },
                { title: 'Payload and save', titleKey: 'examples.validation.point4Title', description: 'Invalid changed rows cannot enter the save-ready portion of the payload.', descriptionKey: 'examples.validation.detail4' },
                { title: 'Correct and retry', titleKey: 'examples.validation.point5Title', description: 'Correct a highlighted value and validate again to clear its error.', descriptionKey: 'examples.validation.detail5' }
            ],
            columns: [
                { title: 'Alias', titleKey: 'guides.validation.alias.title', badge: 'REQUIRED', description: 'Required, unique ignoring case, and between 3 and 20 characters.', descriptionKey: 'guides.validation.alias.description' },
                { title: 'Email', titleKey: 'guides.validation.email.title', badge: 'EMAIL', description: 'Checks the value against a valid email-address format.', descriptionKey: 'guides.validation.email.description' },
                { title: 'Access Code', titleKey: 'guides.validation.accessCode.title', badge: 'PATTERN', description: 'Uppercase code with exactly 3 letters followed by 3 digits.', descriptionKey: 'guides.validation.accessCode.description' },
                { title: 'Codice Fiscale', titleKey: 'guides.validation.fiscalCode.title', badge: 'FISCAL CODE', description: 'Uppercase value checked with the Italian fiscal-code validator.', descriptionKey: 'guides.validation.fiscalCode.description' },
                { title: 'Partita IVA', titleKey: 'guides.validation.vat.title', badge: 'VAT', description: 'Accepts exactly 11 numeric digits.', descriptionKey: 'guides.validation.vat.description' },
                { title: 'CF or P.IVA', titleKey: 'guides.validation.combined.title', badge: 'ANY OF', description: 'Accepts either a valid Codice Fiscale or an 11-digit VAT number.', descriptionKey: 'guides.validation.combined.description' },
                { title: 'Italian IBAN', titleKey: 'guides.validation.iban.title', badge: 'IBAN', description: 'Uppercase Italian IBAN validated in its 27-character format.', descriptionKey: 'guides.validation.iban.description' },
                { title: 'Passport/Document', titleKey: 'guides.validation.document.title', badge: 'CUSTOM', description: 'Example of custom validation: in addition to the alphanumeric format rule, a developer-defined function rejects document numbers using the reserved TMP prefix.', descriptionKey: 'guides.validation.document.description', descriptionEmphasisKey: 'guides.validation.document.emphasis' }
            ]
        })}
            </div>
        </div>
        <p class="demo-note" data-i18n="examples.validation.intro" data-i18n-emphasis="examples.validation.introEmphasis">Validation shows built-in rules and custom validations defined by the developer. Edit the data or use Create anomalies to inspect errors, reports, and correction.</p>
        <div class="demo-action-tutorial-host"></div>
        <div class="demo-table-workbench">
            <div class="demo-command-guide-host"></div>
            <div id="validation-table" class="demo-business-grid demo-business-grid--viewport demo-validation-grid"></div>
        </div>
    `;

    let destroyed = false;
    let demo = null;
    let tutorialState = null;
    let highlightedControl = null;
    let highlightedStep = null;
    let tutorialStarted = false;
    let scenarioGeneration = 0;
    const editCandidates = new Map();
    const editKey = cell => `${cell.getRow().getData().id}:${cell.getField()}`;
    const t = key => publicExampleTranslations[document.documentElement.lang === 'en' ? 'en' : 'it'][`examples.validation.${key}`];
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
            tutorialState = state;
            tutorialLaunch.hidden = !state.hidden;
            tutorialLaunch.setAttribute('aria-expanded', String(!state.hidden));
            tutorialLaunchLabel.textContent = t(tutorialStarted ? 'tutorialResume' : 'tutorialStart');
            syncTutorialHighlight();
        },
        steps: [
            {
                id: 'create-anomalies', actionId: 'create-anomalies', instructionKey: 'examples.validation.tutorialAnomalies',
                isComplete: ({ introducedErrors, report }) => introducedErrors > 0 && report.errorRowsCount > 0
            },
            {
                id: 'inspect-report', actionId: 'show-report', instructionKey: 'examples.validation.tutorialReport',
                isComplete: ({ opened, report }) => opened === true && report.errorRowsCount > 0 && report.errors.cells.length > 0
            },
            {
                id: 'correct-value', actionId: 'cell-edited', instructionKey: 'examples.validation.tutorialCorrect',
                isComplete: ({ corrected, report, id, field }) => corrected === true && report.rows.some(row => row.id === id
                    && !row.cellErrors.some(error => error.field === field))
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
            confirmRemoveNewMessage: 'Remove this new row?'
        },
        toolbar: {
            buttons: [
                'reload',
                {
                    id: 'show-report',
                    label: 'Show report',
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
    tutorialLaunch.addEventListener('click', handleTutorialLaunch);
    commandGuideToolbar.mount();
    const reportDialog = createDemoReportDialog();
    const originalDestroy = demo.destroy.bind(demo);

    const handleEditStart = cell => {
        const context = tutorial.capture();
        if (!context || context.stepId !== 'correct-value') return;
        const id = cell.getRow().getData().id;
        const field = cell.getField();
        const report = demo.getStateReport();
        if (!report.rows.some(row => row.id === id && row.cellErrors.some(error => error.field === field))) return;
        editCandidates.set(editKey(cell), { context, id, field, oldValue: cell.getValue() });
    };
    const handleEditCancelled = cell => editCandidates.delete(editKey(cell));
    const handleEditConfirmed = cell => {
        const key = editKey(cell);
        const candidate = editCandidates.get(key);
        editCandidates.delete(key);
        if (!candidate || destroyed) return;
        const report = demo.getStateReport();
        const row = report.rows.find(item => item.id === candidate.id);
        const corrected = Boolean(row) && cell.getValue() !== candidate.oldValue
            && row?.after?.[candidate.field] === cell.getValue()
            && !row.cellErrors.some(error => error.field === candidate.field);
        tutorial.notify('cell-edited', { corrected, report, id: candidate.id, field: candidate.field }, candidate.context);
    };
    demo.table.on('cellEditing', handleEditStart);
    demo.table.on('cellEditCancelled', handleEditCancelled);
    demo.table.on('cellEdited', handleEditConfirmed);
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
            reportText: buildReadableReport(details),
            jsonData: details
        });
        return details;
    };

    demo.destroy = () => {
        destroyed = true;
        scenarioGeneration += 1;
        clearTutorialHighlight();
        editCandidates.clear();
        tutorialLaunch.removeEventListener('click', handleTutorialLaunch);
        window.removeEventListener('amb-demo-language-change', syncTutorialLaunchLabel);
        demo.table.off('cellEditing', handleEditStart);
        demo.table.off('cellEditCancelled', handleEditCancelled);
        demo.table.off('cellEdited', handleEditConfirmed);
        demo.table.off('renderComplete', syncTutorialHighlight);
        demo.table.off('scrollVertical', syncTutorialHighlight);
        demo.table.off('scrollHorizontal', syncTutorialHighlight);
        demo.table.off('dataFiltered', syncTutorialHighlight);
        reportDialog.destroy();
        commandGuideToolbar.destroy();
        tutorial.destroy();
        originalDestroy();
    };

    function syncTutorialLaunchLabel() {
        tutorialLaunchLabel.textContent = t(tutorialStarted ? 'tutorialResume' : 'tutorialStart');
    }

    function handleTutorialLaunch() {
        if (destroyed || !tutorialState?.hidden) return;
        tutorialLaunch.setAttribute('data-demo-crud-rays-consumed', '');
        tutorialStarted = true;
        tutorial.reopen();
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
        const stepId = tutorialState.stepId;
        let target = null;
        if (stepId === 'create-anomalies' || stepId === 'inspect-report') {
            target = app.querySelector(`[data-action="${stepId === 'create-anomalies' ? 'create-anomalies' : 'show-report'}"]`);
        } else if (stepId === 'correct-value') {
            target = demo.table.getRow(3)?.getCell('alias')?.getElement();
        }
        const rays = target?.tagName === 'BUTTON';
        if (target?.isConnected && target.getClientRects().length > 0 && !target.matches(':disabled')) {
            if (highlightedControl === target && target.classList.contains('demo-crud-tutorial-target')
                && target.classList.contains('demo-crud-tutorial-target--pulse')
                && target.classList.contains('demo-crud-tutorial-target--rays') === rays) return;
            clearTutorialHighlight();
            target.classList.add('demo-crud-tutorial-target', 'demo-crud-tutorial-target--pulse');
            if (rays) target.classList.add('demo-crud-tutorial-target--rays');
            highlightedControl = target;
        } else clearTutorialHighlight();
    }

    async function resetTutorialScenario() {
        const generation = ++scenarioGeneration;
        editCandidates.clear();
        clearTutorialHighlight();
        demo.table.cancelEdit?.();
        reportDialog.close();
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

        anomalyPatches.forEach(({ id, ...patch }) => {
            demo.updateRow(id, patch);
        });

        await new Promise(resolve => window.setTimeout(resolve, 0));
        if (destroyed || generation !== scenarioGeneration) return;
        demo.validateChanges();
        const report = demo.getStateReport();
        demo.feedback.show({
            type: 'warning',
            message: 'Anomalies created. Check highlighted cells or open the report.'
        });
        const introducedErrors = report.errors.cells.filter(error => !previousErrors.has(`${error.id}:${error.field}`)).length;
        tutorial.notify('create-anomalies', { introducedErrors, report }, context);
    }

    function handleShowReport() {
        const context = tutorial.capture();
        const details = openValidationReport();
        tutorial.notify('show-report', { opened: true, report: details.stateReport }, context);
    }

    async function handleReload() {
        if (await resetTutorialScenario()) demo.feedback.show({
            type: 'success', message: 'Validation demo data reloaded.'
        });
    }

    return demo;
}
