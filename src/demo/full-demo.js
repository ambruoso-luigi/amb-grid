import { AMB } from '../index.js';
import { fakeApi } from '../../demo/fake-backend/fake-api.js';
import { createDemoReportDialog } from './utils/demo-report-dialog.js';
import { createDemoCheckboxFormatter } from './utils/demo-checkbox.js';
import { generateInventoryItemCode } from './utils/inventory-item-code.js';
import { decorateDangerRowDialog, decoratePartialSaveDialog } from './components/demo-confirm-presentation.js';
import { createInventoryTutorial } from './components/js-inventory-tutorial.js';
import { bindDemoColumnGuideAnimations, createDemoColumnGuide } from './utils/demo-column-guide.js';
import { createDemoCommandGuide } from './components/demo-command-guide.ts';
import { commandGuideCopy } from './components/demo-command-guide-copy.ts';
import { demoIcon } from './demo-icons.js';

const DEMO_SAVE_POLICY = 'valid-only';
let savedSinceTutorialReset = false;

export function createInventorySavedHighlights() {
    const highlighted = new Map();
    const clear = () => {
        for (const [element, listener] of highlighted) {
            element.removeEventListener('animationend', listener);
            element.classList.remove('demo-inventory-just-saved');
        }
        highlighted.clear();
    };
    const show = (rows, saved) => {
        clear();
        for (const row of rows) {
            const data = row.getData();
            if (!saved.some(item => (item.id != null && item.id === data.id) || (item.tempId && item.tempId === data._ambTempId))) continue;
            const element = row.getElement();
            if (!element?.isConnected || !element.getClientRects().length) continue;
            const holder = element.closest('.tabulator-tableholder');
            if (holder) {
                const rect = element.getBoundingClientRect();
                const bounds = holder.getBoundingClientRect();
                if (rect.bottom <= bounds.top || rect.top >= bounds.bottom) continue;
            }
            const onEnd = event => {
                if (event.target !== element || event.animationName !== 'demo-inventory-saved') return;
                element.removeEventListener('animationend', onEnd);
                element.classList.remove('demo-inventory-just-saved');
                highlighted.delete(element);
            };
            element.addEventListener('animationend', onEnd);
            highlighted.set(element, onEnd);
            element.classList.add('demo-inventory-just-saved');
        }
    };
    return { show, clear };
}

export async function showInventoryRow(demo, row) {
    const data = row?.getData?.();
    const identifier = data?.id ?? data?._ambTempId;
    if (identifier == null) return false;
    try {
        await demo.setPageToRow(identifier);
        await row.scrollTo?.('nearest', false);
    } catch {
        return false;
    }
    const element = row.getElement?.();
    if (!element?.isConnected || !element.getClientRects().length) return false;
    const holder = element.closest?.('.tabulator-tableholder');
    if (!holder) return true;
    const rect = element.getBoundingClientRect();
    const bounds = holder.getBoundingClientRect();
    return rect.bottom > bounds.top && rect.top < bounds.bottom;
}

export async function addInventoryTopRow(demo, rowData, isCurrent) {
    const rows = await demo.addData([rowData], true);
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row || !isCurrent()) return { row, ready: false };
    const visible = await showInventoryRow(demo, row);
    if (!isCurrent()) return { row, ready: false };
    const cell = visible ? row.getCell?.('productName') : null;
    const element = cell?.getElement?.();
    if (!element || typeof cell.edit !== 'function') return { row, ready: false };
    const ready = await new Promise(resolve => {
        let settled = false;
        const finish = result => {
            if (settled) return;
            settled = true;
            element.removeEventListener('focusin', onFocus);
            demo.table.off?.('cellEdited', onClose);
            demo.table.off?.('cellEditCancelled', onClose);
            resolve(result && isCurrent());
        };
        const isReady = () => {
            const editor = element.querySelector('input, textarea, select, [contenteditable="true"]');
            return Boolean(element.classList.contains('tabulator-editing') && editor && document.activeElement === editor);
        };
        const onFocus = () => { if (isReady()) finish(true); };
        const onClose = edited => { if (edited === cell || edited?.getElement?.() === element) finish(false); };
        element.addEventListener('focusin', onFocus);
        demo.table.on?.('cellEdited', onClose);
        demo.table.on?.('cellEditCancelled', onClose);
        try {
            const result = cell.edit();
            if (isReady()) finish(true);
            else if (result === false || !element.classList.contains('tabulator-editing')) finish(false);
        } catch {
            finish(false);
        }
    });
    return { row, ready };
}

export async function presentGuidedInventorySave({ demo, row, savedHighlights, savedResult, isCurrent, showFeedback, notify }) {
    const prepared = await showInventoryRow(demo, row);
    if (!isCurrent()) return false;
    if (prepared) savedHighlights.show(demo.table.getRows('active'), savedResult.saved);
    showFeedback(prepared);
    if (prepared) notify();
    return prepared;
}

const messages = {
    it: {
        reloaded: 'Dati ricaricati.',
        noChanges: 'Non ci sono modifiche da salvare.',
        noUniqueProductCode: 'Non è disponibile un codice prodotto univoco.',
        invalid: 'Correggi gli errori evidenziati prima di salvare.',
        saved: 'Modifiche salvate e stati riallineati.',
        partialSaved: 'Modifiche valide salvate. Le righe con errori restano da correggere.',
        rowUnavailable: 'La nuova riga non è visibile: verifica i filtri della tabella.',
        saveError: 'Il backend fake ha restituito errori di validazione.',
        payloadTitle: 'Payload di salvataggio',
        reportTitle: 'Report stato righe',
        validationTitle: 'Report validazione',
        saveTitle: 'Risultato salvataggio',
        validationValid: 'Tutte le righe attive sono valide.',
        validationInvalid: 'Sono presenti righe con errori.',
        stateReport: 'Report stato righe',
        totalRows: 'Righe totali',
        validChangedRows: 'Righe modificate valide',
        invalidChangedRows: 'Righe modificate non valide',
        errorRows: 'Righe con errori',
        selectedRows: 'Righe selezionate',
        savePolicy: 'Policy',
        partialSave: 'Salvataggio parziale',
        partialSaveAvailable: 'Salvataggio parziale disponibile',
        canSave: 'Salvabile',
        inserted: 'Inserite',
        updated: 'Aggiornate',
        deleted: 'Eliminate',
        generatedIds: 'ID backend generati',
        rowsStillNeedingCorrection: 'Righe rimaste da correggere',
        partialSaveTitle: 'Alcune righe non sono valide',
        partialSaveConfirm: 'Salva righe valide',
        partialSaveCancel: 'Annulla',
        partialSaveIntro: 'Vuoi salvare soltanto le modifiche valide?',
        partialExcludedOne: '1 riga esclusa dal salvataggio',
        partialExcludedMany: '{count} righe escluse dal salvataggio',
        partialExplanation: 'Le modifiche valide saranno salvate. Le righe con errori resteranno disponibili per la correzione.',
        removeNewTitle: 'Rimuovere la nuova riga?',
        removeNewBody: 'La riga non è ancora stata salvata. Se prosegui, le informazioni inserite verranno eliminate.',
        removeNewConfirm: 'Rimuovi riga',
        removeNewCancel: 'Annulla',
        tutorialResetTitle: 'Avviare il tutorial?',
        tutorialResetMessage: 'Avviare una nuova sessione ripristina i dati iniziali.',
        tutorialResetIntro: 'Le modifiche effettuate nella demo saranno annullate.',
        tutorialResetDetails: 'Modifiche che verranno annullate',
        tutorialResetDetail: 'Le modifiche pendenti e quelle già salvate saranno eliminate.',
        tutorialResetExplanation: 'Avviando una nuova sessione, la tabella tornerà ai dati iniziali.',
        tutorialResetConfirm: 'Avvia tutorial',
        tutorialResetCancel: 'Annulla',
        tutorialRestartTitle: 'Ricominciare il tutorial?',
        tutorialRestartExplanation: 'La tabella tornerà ai dati iniziali e il tutorial ripartirà dal primo passaggio.',
        tutorialRestartConfirm: 'Ricomincia',
        tutorialResetError: 'Impossibile ripristinare i dati del tutorial. Riprova.',
        row: 'Riga',
        validChangesCanSave: '{count} modifiche valide possono comunque essere salvate.',
        invalidRowsRemainPending: 'Le righe con errori resteranno in attesa di correzione.',
        saveValidChangesQuestion: 'Vuoi salvare le modifiche valide?'
    },
    en: {
        reloaded: 'Data reloaded.',
        noChanges: 'There are no changes to save.',
        noUniqueProductCode: 'No unique product code is available.',
        invalid: 'Fix highlighted errors before saving.',
        saved: 'Changes saved and row states aligned.',
        partialSaved: 'Valid changes saved. Rows with errors are still pending correction.',
        rowUnavailable: 'The new row is not visible: check the table filters.',
        saveError: 'The fake backend returned validation errors.',
        payloadTitle: 'Save payload',
        reportTitle: 'Row state report',
        validationTitle: 'Validation report',
        saveTitle: 'Save result',
        validationValid: 'All active rows are valid.',
        validationInvalid: 'Some rows contain errors.',
        stateReport: 'Row state report',
        totalRows: 'Total rows',
        validChangedRows: 'Valid changed rows',
        invalidChangedRows: 'Invalid changed rows',
        errorRows: 'Rows with errors',
        selectedRows: 'Selected rows',
        savePolicy: 'Policy',
        partialSave: 'Partial save',
        partialSaveAvailable: 'Partial save available',
        canSave: 'Can save',
        inserted: 'Inserted',
        updated: 'Updated',
        deleted: 'Deleted',
        generatedIds: 'Generated backend IDs',
        rowsStillNeedingCorrection: 'Rows still needing correction',
        partialSaveTitle: 'Some rows are invalid',
        partialSaveConfirm: 'Save valid rows',
        partialSaveCancel: 'Cancel',
        partialSaveIntro: 'Would you like to save only valid changes?',
        partialExcludedOne: '1 row excluded from saving',
        partialExcludedMany: '{count} rows excluded from saving',
        partialExplanation: 'Valid changes will be saved. Rows with errors will remain available for correction.',
        removeNewTitle: 'Remove the new row?',
        removeNewBody: 'This row has not been saved yet. If you continue, the information entered in it will be discarded.',
        removeNewConfirm: 'Remove row',
        removeNewCancel: 'Cancel',
        tutorialResetTitle: 'Start the tutorial?',
        tutorialResetMessage: 'Starting a new session restores the initial data.',
        tutorialResetIntro: 'Changes made in the demo will be discarded.',
        tutorialResetDetails: 'Changes that will be discarded',
        tutorialResetDetail: 'Pending and already saved changes will be discarded.',
        tutorialResetExplanation: 'Starting a new session restores the initial grid data.',
        tutorialResetConfirm: 'Start tutorial',
        tutorialResetCancel: 'Cancel',
        tutorialRestartTitle: 'Restart the tutorial?',
        tutorialRestartExplanation: 'The table will return to its initial data and the tutorial will restart from the first step.',
        tutorialRestartConfirm: 'Restart',
        tutorialResetError: 'Unable to restore tutorial data. Please try again.',
        row: 'Row',
        validChangesCanSave: '{count} valid changes can still be saved.',
        invalidRowsRemainPending: 'Rows with errors will remain pending for correction.',
        saveValidChangesQuestion: 'Do you want to save the valid changes?'
    }
};

const getLanguage = () => {
    return document.documentElement.lang === 'en' ? 'en' : 'it';
};

const t = key => messages[getLanguage()][key] || messages.it[key] || key;

const formatInspectionCheckbox = createDemoCheckboxFormatter();

const demoRowActionMessages = {
    removeNew: 'Remove this new product?'
};

const demoRowActionLabels = {
    delete: 'Delete product',
    rollback: 'Rollback product changes',
    removeNew: 'Remove new product'
};

const countRowsByState = (report, state) => {
    return report.rows.filter(row => row.state === state).length;
};

const getValidChangesCount = payload => {
    const changes = payload.changes || {};

    return (changes.inserted || []).length
        + (changes.updated || []).length
        + (changes.deleted || []).length;
};

const getInvalidChangedRowLines = validateResult => {
    const groupedRows = new Map();

    validateResult.rows
        .filter(row => !row.isValid)
        .forEach(row => {
            const rowLabel = row.rowNumber ?? row.id ?? row.key ?? 'n/a';
            const fields = [...new Set(row.errors.map(error => error.field))];

            groupedRows.set(rowLabel, fields);
        });

    return [...groupedRows.entries()].map(([rowLabel, fields]) => {
        return `${t('row')} ${rowLabel}: ${fields.join(', ')}`;
    });
};

const buildPayloadReport = payload => [
    `${t('savePolicy')}: ${payload.savePolicy}`,
    `${t('inserted')}: ${payload.changes.inserted.length}`,
    `${t('updated')}: ${payload.changes.updated.length}`,
    `${t('deleted')}: ${payload.changes.deleted.length}`,
    `${t('validChangedRows')}: ${payload.hasValidChanges ? getValidChangesCount(payload) : 0}`,
    `${t('invalidChangedRows')}: ${payload.hasInvalidChanges ? payload.summary.invalidChangedRowsCount : 0}`,
    `${t('partialSave')}: ${payload.isPartialSave}`,
    `${t('canSave')}: ${payload.canSave}`
];

const buildStateReport = (report, payload, selectedRows) => [
    t('stateReport'),
    '',
    `${t('totalRows')}: ${report.totalRows}`,
    `${t('selectedRows')}: ${selectedRows.length}`,
    `Clean: ${countRowsByState(report, 'clean')}`,
    `New: ${countRowsByState(report, 'new')}`,
    `Modified: ${countRowsByState(report, 'modified')}`,
    `Deleted: ${countRowsByState(report, 'deleted')}`,
    `Saved: ${countRowsByState(report, 'saved')}`,
    `${t('errorRows')}: ${report.errorRowsCount}`,
    `${t('validChangedRows')}: ${report.validChangedRowsCount}`,
    `${t('invalidChangedRows')}: ${report.invalidChangedRowsCount}`,
    `${t('partialSaveAvailable')}: ${payload.isPartialSave}`,
    `${t('canSave')}: ${payload.canSave}`
];

const buildValidationReport = validateResult => [
    validateResult.isValid ? t('validationValid') : t('validationInvalid'),
    '',
    ...getInvalidChangedRowLines(validateResult)
];

const buildSaveReport = ({ result, applyIdsResult, savedResult, payload, validateResult }) => [
    t('saveTitle'),
    '',
    `${t('inserted')}: ${result.saved.inserted.length}`,
    `${t('updated')}: ${result.saved.updated.length}`,
    `${t('deleted')}: ${result.saved.deleted.length}`,
    `${t('generatedIds')}: ${(result.generatedIds || []).length}`,
    `Applied IDs: ${applyIdsResult.applied.length}`,
    `Saved rows: ${savedResult.saved.length}`,
    ...(payload.isPartialSave
        ? [`${t('rowsStillNeedingCorrection')}: ${getInvalidChangedRowLines(validateResult).length}`]
        : [])
];

export default async function fullDemo(app, options = {}) {
    const {
        className = '',
        compactHeader = false,
        showHeader = true,
        tableHeight = null,
        variant = 'default'
    } = options;
    const extraClasses = [
        variant && variant !== 'default' ? `demo-shell--${variant}` : '',
        compactHeader ? 'demo-shell--compact-header' : '',
        className
    ]
        .join(' ')
        .split(/\s+/)
        .filter(Boolean);

    if (extraClasses.length) {
        app.classList.add(...extraClasses);
    }
    document.body.classList.add('demo-main-demo-active');

    if (tableHeight) {
        app.style.setProperty('--demo-table-height', tableHeight);
    } else {
        app.style.removeProperty('--demo-table-height');
    }

    app.innerHTML = `
        <div class="demo-inventory-panel card bg-base-100 text-base-content" data-theme="light">
            <div class="demo-app-shell card bg-base-100">
                <div class="demo-app-shell__meta card-body">
                    ${showHeader ? `<h2 data-i18n="mainDemo.title">Gestione prodotti e giacenze</h2>` : ''}
                </div>
                ${showHeader ? `<p class="demo-note demo-main-description" data-i18n="mainDemo.description">Demo gestionale classica per contesti server-rendered e legacy-friendly: modifica prodotti, valida i dati e prepara il payload backend nello stesso flusso.</p>` : ''}
                <div class="demo-main-tutorial-host"></div>
                ${createDemoColumnGuide({
                    variant: 'technical',
                    summary: 'Demo technical guide',
                    summaryKey: 'mainDemo.guide.summary',
                    summaryIcon: 'guide',
                    intro: 'Edit inventory data directly while AMB Grid coordinates CRUD state, validation, lookup, search, payload, and save actions.',
                    introKey: 'mainDemo.guide.intro',
                    points: [
                        { title: 'Edit and add', titleKey: 'mainDemo.guide.edit.title', description: 'Edit cells directly or use Add Row to create a new local product.', descriptionKey: 'mainDemo.guide.edit.description' },
                        { title: 'Selection and row actions', titleKey: 'mainDemo.guide.actions.title', description: 'The checkbox selects one or more products; the row action column provides Delete, Rollback, and Remove new according to the row state.', descriptionKey: 'mainDemo.guide.actions.description' },
                        { title: 'Validation and lookup', titleKey: 'mainDemo.guide.validation.title', description: 'Field rules validate edits; autocomplete and lookup editors guide controlled selections.', descriptionKey: 'mainDemo.guide.validation.description' },
                        { title: 'Payload and save', titleKey: 'mainDemo.guide.save.title', description: 'The payload separates inserted, updated and deleted records. If some changed rows contain errors, Save can persist the valid changes after confirmation while invalid rows remain pending.', descriptionKey: 'mainDemo.guide.save.description' },
                        { title: 'Search and filters', titleKey: 'mainDemo.guide.search.title', description: 'Search and filter controls narrow the visible inventory without changing the underlying data.', descriptionKey: 'mainDemo.guide.search.description' }
                    ],
                    columns: [
                        { title: 'Item code', titleKey: 'guides.main.itemCode.title', badge: 'UNIQUE', description: 'Product code automatically generated for new rows, editable and validated against the PRD-XXXX format. It must be unique, case-insensitively.', descriptionKey: 'guides.main.itemCode.description' },
                        { title: 'Product name', titleKey: 'guides.main.productName.title', badge: 'REQUIRED', description: 'Required trimmed text with a minimum length of 3 characters.', descriptionKey: 'guides.main.productName.description' },
                        { title: 'Warehouse', titleKey: 'guides.main.warehouse.title', badge: 'AUTOCOMPLETE', description: 'Required value selected from the known warehouse options.', descriptionKey: 'guides.main.warehouse.description' },
                        { title: 'Stock quantity', titleKey: 'guides.main.stock.title', badge: 'INTEGER', description: 'Required integer with a minimum value of zero.', descriptionKey: 'guides.main.stock.description' },
                        { title: 'Unit price', titleKey: 'guides.main.price.title', badge: 'DECIMAL', description: 'Required non-negative decimal with two decimal places and currency formatting.', descriptionKey: 'guides.main.price.description' },
                        { title: 'Last check date', titleKey: 'guides.main.date.title', badge: 'DATE', description: 'Required real date edited and displayed in dd/mm/yyyy format.', descriptionKey: 'guides.main.date.description' },
                        { title: 'Status', titleKey: 'guides.main.status.title', badge: 'LOOKUP', description: 'Required status selected from a searchable lookup dialog.', descriptionKey: 'guides.main.status.description' },
                        { title: 'Requires inspection', titleKey: 'guides.main.inspection.title', badge: 'BOOLEAN', description: 'Editable checkbox that records whether the product needs inspection.', descriptionKey: 'guides.main.inspection.description' },
                        { title: 'Notes', titleKey: 'guides.main.notes.title', badge: 'LONG TEXT', description: 'Free long text edited in a dialog and shown as a compact preview.', descriptionKey: 'guides.main.notes.description' }
                    ]
                })}
                <div class="demo-table-workbench">
                    <div class="demo-command-guide-host"></div>
                    <div id="inventory-table" class="amb-demo-inventory-grid demo-business-grid"></div>
                </div>
            </div>
        </div>
    `;

    const tutorialLaunch = document.createElement('button');
    tutorialLaunch.type = 'button';
    tutorialLaunch.className = 'demo-crud-tutorial-launch';
    tutorialLaunch.dataset.action = 'tutorial-launch';
    tutorialLaunch.setAttribute('aria-controls', 'javascript-inventory-tutorial');
    tutorialLaunch.setAttribute('aria-expanded', 'false');
    tutorialLaunch.innerHTML = `${demoIcon('tutorialPlay', { size: 21, strokeWidth: 2.6 })}<span>Avvia tutorial</span>`;
    app.querySelector('.demo-disclosure--technical').before(tutorialLaunch);
    const destroyColumnGuideAnimations = bindDemoColumnGuideAnimations(app);

    const statusLookup = AMB.lookup({
        keyField: 'id',
        valueField: 'id',
        labelField: 'description',
        columns: [
            { field: 'id', title: 'Code', visible: true, width: 110 },
            { field: 'description', title: 'Description', visible: true, width: 360 }
        ],
        search: {
            fields: 'visible'
        },
        load: ({ query }) => fakeApi.searchStatuses(query)
    });
    const statusDialog = new AMB.LookupDialog();
    const reportDialog = createDemoReportDialog();
    const partialSaveDialog = new AMB.ConfirmDialog();
    const rowConfirmDialog = new AMB.ConfirmDialog();
    const tutorialConfirmDialog = new AMB.ConfirmDialog();
    const warehouseOptions = await fakeApi.getWarehouses();
    const statusOptions = (await fakeApi.getStatuses()).map(status => status.id);
    const products = await fakeApi.getProducts();
    let crud = null;
    let commandGuide = null;
    let tutorialResetGeneration = 0;
    let demoDisposed = false;
    let tutorialNewRow = null;
    const savedHighlights = createInventorySavedHighlights();

    const tableOptions = {
        selector: '#inventory-table',
        selectionColumn: {
            enabled: true,
            mode: 'multiple'
        },
        rowActionColumn: {
            enabled: true,
            width: 55,
            confirmRemoveNewMessage: demoRowActionMessages.removeNew,
            confirmProvider: handleRowConfirmation,
            labels: demoRowActionLabels
        },
        search: {
            enabled: true,
            placeholder: 'Search inventory...',
            filters: {
                enabled: true
            }
        },
        toolbar: {
            buttons: [
                'add',
                'reload',
                'save',
                'payload',
                {
                    id: 'show-report',
                    label: 'Report',
                    title: 'Show state report',
                    onClick: handleShowReport
                },
                {
                    id: 'demo-command-guide',
                    label: commandGuideCopy[getLanguage()].trigger.label,
                    title: commandGuideCopy[getLanguage()].trigger.title,
                    icon: demoIcon('help'),
                    onClick: handleCommandGuide
                }
            ],
            onAdd: handleAdd,
            onReload: handleReload,
            onSave: handleSave,
            onPayload: handleShowPayload
        },
        data: products,
        layout: 'fitColumns',
        pagination: true,
        paginationMode: 'local',
        paginationSize: 10,
        paginationSizeSelector: [10, 20, 50],
        columns: [
            {
                title: 'Item code',
                field: 'itemCode',
                minWidth: 110,
                widthGrow: 0.8,
                editor: AMB.editors.text({ uppercase: true, trim: true }),
                required: true,
                validation: {
                    pattern: {
                        regex: /^PRD-[A-Z0-9]{4}$/,
                        message: 'Use PRD-A001 format'
                    },
                    unique: {
                        caseSensitive: false,
                        message: 'Item code must be unique'
                    }
                }
            },
            {
                title: 'Product name',
                field: 'productName',
                minWidth: 170,
                widthGrow: 1.8,
                editor: AMB.editors.text({ trim: true }),
                required: true,
                validation: {
                    minLength: {
                        value: 3,
                        message: 'Product name must be at least 3 characters'
                    }
                }
            },
            {
                title: 'Warehouse',
                field: 'warehouse',
                minWidth: 150,
                widthGrow: 1.2,
                required: true,
                editor: AMB.editors.autocomplete(warehouseOptions, {
                    maxOptions: 8,
                    trimInput: true
                }),
                validation: {
                    allowedValues: {
                        values: warehouseOptions,
                        message: 'Choose a known warehouse'
                    }
                }
            },
            {
                title: 'Stock quantity',
                field: 'stockQuantity',
                minWidth: 140,
                widthGrow: 0.65,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                required: true,
                validation: {
                    integer: true,
                    min: {
                        value: 0,
                        message: 'Stock quantity cannot be negative'
                    }
                }
            },
            {
                title: 'Unit price',
                field: 'unitPrice',
                minWidth: 110,
                widthGrow: 0.65,
                editor: AMB.editors.decimal({ integerDigits: 7, decimalDigits: 2, allowEmpty: false }),
                formatter: AMB.formatters.currency(),
                required: true,
                validation: {
                    decimal: {
                        integerDigits: 7,
                        decimalDigits: 2,
                        allowNegative: false,
                        message: 'Enter a valid non-negative unit price'
                    }
                }
            },
            {
                title: 'Last check date',
                field: 'lastCheckDate',
                minWidth: 150,
                widthGrow: 0.7,
                editor: AMB.editors.date({
                    format: 'dd/mm/yyyy',
                    allowEmpty: false,
                    picker: true
                }),
                formatter: AMB.formatters.date('dd/mm/yyyy'),
                required: true,
                validation: {
                    date: {
                        format: 'dd/mm/yyyy',
                        allowEmpty: false,
                        message: 'Enter a real check date'
                    }
                }
            },
            {
                title: 'Status',
                field: 'status',
                minWidth: 105,
                widthGrow: 0.7,
                required: true,
                validation: {
                    allowedValues: {
                        values: statusOptions,
                        message: 'Unknown status code'
                    }
                },
                editor: AMB.editors.lookup(statusLookup, {
                    uppercase: true,
                    allowEmpty: false,
                    dialog: statusDialog,
                    dialogTitle: 'Search status',
                    invalidMessage: 'Unknown status code',
                    autoComplete: true,
                    autoCompleteMinChars: 1,
                    autoCompleteOnTab: true,
                    dialogOptions: {
                        closeOnBackdropClick: false,
                        pagination: {
                            enabled: true,
                            pageSize: 8,
                            controls: 'full'
                        },
                        destroyOnClose: true
                    }
                })
            },
            {
                title: 'Requires inspection',
                field: 'requiresInspection',
                minWidth: 175,
                widthGrow: 0.65,
                hozAlign: 'center',
                cssClass: 'demo-business-checkbox-cell',
                formatter: formatInspectionCheckbox,
                editor: AMB.editors.checkbox({
                    checkedLabel: '',
                    uncheckedLabel: ''
                })
            },
            {
                title: 'Notes',
                field: 'notes',
                minWidth: 180,
                widthGrow: 1.7,
                formatter: AMB.formatters.largeTextPreview({ maxLength: 42 }),
                editor: AMB.editors.largeText({
                    title: 'Edit inventory notes',
                    rows: 10,
                    closeOnBackdropClick: false
                })
            }
        ]
    };

    if (tableHeight) {
        tableOptions.height = tableHeight;
    }

    const demo = AMB.table(tableOptions);
    crud = demo.crud;
    const inventoryTutorial = createInventoryTutorial({
        host: app.querySelector('.demo-main-tutorial-host'),
        launch: app.querySelector('[data-action="tutorial-launch"]'),
        app, demo, statusDialog, statusOptions,
        resetData: resetTutorialData,
        hasPendingChanges: () => savedSinceTutorialReset || demo.getStateReport().hasChanges || Boolean(app.querySelector('#inventory-table .tabulator-editing')),
        confirmStart: () => confirmTutorialReset(false),
        confirmRestart: () => confirmTutorialReset(true),
        onOpenCommandGuide: () => commandGuide?.open(commandGuideTrigger instanceof HTMLElement ? commandGuideTrigger : undefined),
        onResetError: () => demo.feedback.show({ type: 'error', message: t('tutorialResetError') }),
        locale: getLanguage()
    });
    function confirmTutorialReset(restart) {
            const confirmation = tutorialConfirmDialog.confirm({
                title: t(restart ? 'tutorialRestartTitle' : 'tutorialResetTitle'), message: t('tutorialResetIntro'),
                confirmText: t(restart ? 'tutorialRestartConfirm' : 'tutorialResetConfirm'), cancelText: t('tutorialResetCancel')
            });
            decoratePartialSaveDialog(tutorialConfirmDialog, {
                intro: t('tutorialResetIntro'), detailsHeading: t('tutorialResetDetails'),
                detailsLines: [t('tutorialResetDetail')], explanation: t(restart ? 'tutorialRestartExplanation' : 'tutorialResetExplanation')
            });
            return confirmation;
    }
    const commandGuideHost = app.querySelector('.demo-command-guide-host');
    const commandGuideTrigger = app.querySelector('[data-action="demo-command-guide"]');
    const updateCommandGuideTrigger = () => {
        commandGuide?.setLocale(getLanguage());

        if (!(commandGuideTrigger instanceof HTMLElement)) return;
        const commandGuideLabel = commandGuideTrigger.querySelector('.amb-toolbar__button-label');

        const triggerCopy = commandGuideCopy[getLanguage()].trigger;

        if (commandGuideLabel) commandGuideLabel.textContent = triggerCopy.label;
        commandGuideTrigger.title = triggerCopy.title;
        commandGuideTrigger.setAttribute('aria-label', triggerCopy.title);
    };
    const handleDemoLanguageChange = () => updateCommandGuideTrigger();

    if (commandGuideHost instanceof HTMLElement) {
        commandGuide = createDemoCommandGuide({
            host: commandGuideHost,
            trigger: commandGuideTrigger instanceof HTMLElement ? commandGuideTrigger : undefined,
            locale: getLanguage()
        });
        updateCommandGuideTrigger();
    }
    window.addEventListener('amb-demo-language-change', handleDemoLanguageChange);
    const originalDestroy = demo.destroy.bind(demo);

    demo.destroy = () => {
        demoDisposed = true;
        savedHighlights.clear();
        tutorialResetGeneration += 1;
        destroyColumnGuideAnimations();
        window.removeEventListener('amb-demo-language-change', handleDemoLanguageChange);
        inventoryTutorial.destroy();
        commandGuide?.destroy();
        commandGuide = null;
        reportDialog.destroy();
        partialSaveDialog.destroy();
        rowConfirmDialog.destroy();
        tutorialConfirmDialog.destroy();
        app.style.removeProperty('--demo-table-height');
        document.body.classList.remove('demo-main-demo-active');
        if (extraClasses.length) {
            app.classList.remove(...extraClasses);
        }

        if (statusDialog.resolve) {
            statusDialog.close(null);
        } else {
            statusDialog.destroy();
        }

        originalDestroy();
    };

    function handleCommandGuide({ event }) {
        const trigger = event?.currentTarget;

        commandGuide?.toggle(trigger instanceof HTMLElement ? trigger : undefined);
    }

    async function resetTutorialData() {
        tutorialResetGeneration += 1;
        if (statusDialog.resolve) statusDialog.close(null);
        demo.table.cancelEdit?.();
        partialSaveDialog.destroy();
        rowConfirmDialog.destroy();
        reportDialog.close();
        demo.feedback.clear();
        demo.clearSelection();
        demo.clearSearch();
        demo.setSearchFields([]);
        demo.setSearchOptions({ caseSensitive: false, wholeWord: false });
        demo.clearFilter(true);
        const products = await fakeApi.resetDemoProducts();
        if (demoDisposed) return false;
        await demo.setData(products);
        if (demoDisposed) return false;
        await demo.setPage(1);
        savedSinceTutorialReset = false;
        demo.feedback.clear();
        return true;
    }

    function handleRowConfirmation({ action, message }) {
        const removeNew = action === 'remove-new';
        const confirmation = rowConfirmDialog.confirm(removeNew ? {
            title: t('removeNewTitle'),
            message: t('removeNewBody'),
            confirmText: t('removeNewConfirm'),
            cancelText: t('removeNewCancel')
        } : { message });
        if (removeNew) decorateDangerRowDialog(rowConfirmDialog);
        return confirmation;
    }

    function openPayloadReport(payload = demo.getSavePayload({
        savePolicy: DEMO_SAVE_POLICY,
        includeInvalid: true
    })) {
        reportDialog.open({
            title: t('payloadTitle'),
            apiMethods: ['grid.getSavePayload()'],
            reportLines: buildPayloadReport(payload),
            jsonData: payload
        });
    }

    function openStateReport() {
        const report = demo.getStateReport();
        const selectedRows = demo.getSelectedData();
        const payload = demo.getSavePayload({
            savePolicy: DEMO_SAVE_POLICY,
            includeInvalid: true
        });

        reportDialog.open({
            title: t('reportTitle'),
            apiMethods: [
                'grid.getStateReport()',
                'grid.getSelectedData()'
            ],
            reportLines: buildStateReport(report, payload, selectedRows),
            jsonData: {
                report,
                payload,
                selection: {
                    count: selectedRows.length,
                    rows: selectedRows.map(({ itemCode, productName }) => ({
                        itemCode,
                        productName
                    }))
                }
            }
        });
    }

    function openValidationReport(validateResult) {
        reportDialog.open({
            title: t('validationTitle'),
            reportLines: buildValidationReport(validateResult),
            jsonData: {
                validateResult,
                payload: demo.getSavePayload({
                    savePolicy: DEMO_SAVE_POLICY,
                    includeInvalid: true
                })
            }
        });
    }

    async function handleAdd() {
        const resetGeneration = tutorialResetGeneration;
        const tutorialContext = inventoryTutorial.capture();
        demo.feedback.clear();
        const itemCode = generateInventoryItemCode(demo.getData());
        if (itemCode === null) {
            demo.feedback.show({ type: 'warning', message: t('noUniqueProductCode') });
            return null;
        }

        const { row, ready } = await addInventoryTopRow(demo, {
            id: null,
            itemCode,
            productName: '',
            warehouse: '',
            stockQuantity: 0,
            unitPrice: '',
            lastCheckDate: '',
            status: '',
            requiresInspection: false,
            notes: ''
        }, () => resetGeneration === tutorialResetGeneration && !demoDisposed);
        if (resetGeneration !== tutorialResetGeneration) return row;
        if (!row) return null;
        if (!ready) demo.feedback.show({ type: 'warning', message: t('rowUnavailable') });
        if (inventoryTutorial.added(row, tutorialContext, ready)) tutorialNewRow = row;
        return row;
    }

    async function handleReload() {
        demo.feedback.clear();
        reportDialog.close();

        const reloadedProducts = await fakeApi.getProducts();

        await demo.setData(reloadedProducts);
        demo.clearSelection();
        demo.feedback.show({
            type: 'success',
            message: t('reloaded')
        });
    }

    function handleShowPayload() {
        openPayloadReport();
    }

    function handleShowReport() {
        openStateReport();
    }

    async function handleSave() {
        const resetGeneration = tutorialResetGeneration;
        let tutorialContext = inventoryTutorial.capture();
        let partialConfirmed = false;
        demo.feedback.clear();

        const validateResult = demo.validateChanges();
        const payload = demo.getSavePayload({
            savePolicy: DEMO_SAVE_POLICY,
            includeInvalid: true
        });

        if (payload.hasChanges === false) {
            demo.feedback.show({
                type: 'info',
                message: t('noChanges')
            });
            return;
        }

        if (payload.hasValidChanges === false && payload.hasInvalidChanges === true) {
            openValidationReport(validateResult);
            demo.feedback.show({
                type: 'warning',
                message: t('invalid')
            });
            return;
        }

        if (payload.hasValidChanges
            && payload.hasInvalidChanges
            && payload.isPartialSave
            && payload.canSave) {
            const confirmation = partialSaveDialog.confirm({
                title: t('partialSaveTitle'),
                message: t('partialSaveIntro'),
                confirmText: t('partialSaveConfirm'),
                cancelText: t('partialSaveCancel')
            });
            const invalidRows = validateResult.rows.filter(row => !row.isValid).map(row => {
                const identifier = row.id ?? row.tempId ?? `${t('row')} ${row.rowNumber}`;
                return `${identifier} — ${row.errors.map(error => error.message).join(' ')}`;
            });
            decoratePartialSaveDialog(partialSaveDialog, {
                intro: `${t('partialSaveIntro')}\n${t('validChangedRows')}: ${getValidChangesCount(payload)}`,
                detailsHeading: t(invalidRows.length === 1 ? 'partialExcludedOne' : 'partialExcludedMany').replace('{count}', invalidRows.length),
                detailsLines: invalidRows,
                explanation: t('partialExplanation')
            });
            tutorialContext = inventoryTutorial.partialOpened(payload, tutorialContext, Boolean(partialSaveDialog.resolveCurrent), partialSaveDialog.confirmButton);
            const confirmed = await confirmation;
            inventoryTutorial.partialClosed();

            if (resetGeneration !== tutorialResetGeneration) return;

            if (!confirmed) {
                return;
            }
            partialConfirmed = true;
        }

        if (!payload.canSave) {
            openValidationReport(validateResult);
            demo.feedback.show({
                type: 'warning',
                message: t('invalid')
            });
            return;
        }

        const result = await fakeApi.saveProductChanges(payload);

        if (resetGeneration !== tutorialResetGeneration) return;

        if (result.ok) {
            savedSinceTutorialReset ||= ['inserted', 'updated', 'deleted'].some(key => (result.saved?.[key]?.length || 0) > 0);
            const applyIdsResult = crud.applyBackendIds(result.generatedIds || []);
            const savedResult = crud.markValidChangesSaved();
            const report = crud.getStateReport();
            const details = {
                result,
                applyIdsResult,
                savedResult,
                payload,
                validateResult,
                report
            };
            const current = inventoryTutorial.capture();
            const newRowData = tutorialNewRow?.getData?.();
            const pendingNewRow = newRowData?._ambTempId && report.invalidChangedRows.some(row => row.tempId === newRowData._ambTempId && row.state === 'new');
            const backendSavedCount = ['inserted', 'updated', 'deleted'].reduce((total, key) => total + (result.saved?.[key]?.length || 0), 0);
            const appliedIds = applyIdsResult.applied.length === (result.generatedIds || []).length;
            const guided = partialConfirmed && payload.isPartialSave && tutorialContext?.stepId === 'partial-save'
                && tutorialContext.actionIndex === 1 && current?.generation === tutorialContext.generation
                && current?.stepId === tutorialContext.stepId && current?.actionIndex === tutorialContext.actionIndex
                && backendSavedCount > 0 && appliedIds && savedResult.saved.length > 0 && pendingNewRow;
            if (guided) {
                await presentGuidedInventorySave({
                    demo, row: tutorialNewRow, savedHighlights, savedResult,
                    isCurrent: () => resetGeneration === tutorialResetGeneration && !demoDisposed,
                    showFeedback: prepared => demo.feedback.show({ type: 'success', message: prepared ? t('partialSaved') : `${t('partialSaved')} ${t('rowUnavailable')}` }),
                    notify: () => inventoryTutorial.partialSaved(tutorialContext, partialConfirmed, result, savedResult, report, true)
                });
            } else {
                reportDialog.open({
                    title: t('saveTitle'),
                    reportLines: buildSaveReport(details),
                    jsonData: details
                });
                demo.feedback.show({
                    type: 'success',
                    message: payload.isPartialSave ? t('partialSaved') : t('saved')
                });
            }
            return;
        }

        (result.errors || []).forEach(error => {
            if (error.field) {
                crud.markCellError(error.id, error.field, error.message);
                return;
            }

            crud.markRowError(error.id, error.message);
        });

        reportDialog.open({
            title: t('saveTitle'),
            reportLines: [t('saveError')],
            jsonData: result
        });
        demo.feedback.show({
            type: 'warning',
            message: t('saveError')
        });
    }

    return demo;
}
