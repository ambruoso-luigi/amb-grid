import { expect, test } from '@playwright/test';

const POLL_TIMEOUT_MS = 2000;

const formatReport = report => {
    return [
        `scenario: ${report.scenario}`,
        `iteration: ${report.iteration}`,
        `phase: ${report.phase}`,
        `activeElement.tagName: ${report.activeElement.tagName}`,
        `activeElement.className: ${report.activeElement.className}`,
        `activeElement.ariaLabel: ${report.activeElement.ariaLabel}`,
        `actionButtonFocused: ${report.actionButtonFocused}`,
        `activeInsideTabulatorCell: ${report.activeInsideTabulatorCell}`,
        `activeCellField: ${report.activeCellField}`,
        `newRowsVisible: ${report.newRowsVisible}`,
        `currentPage: ${report.currentPage}`,
        `pageSize: ${report.pageSize}`,
        `newRowExists: ${report.newRowExists}`,
        `targetCellField: ${report.targetField}`,
        `targetCellExists: ${report.targetCellExists}`,
        `targetCellEditing: ${report.targetCellEditing}`,
        `targetEditorExists: ${report.targetEditorExists}`,
        `targetEditorFocused: ${report.targetEditorFocused}`,
        `targetCellContainsActiveElement: ${report.targetCellContainsActiveElement}`,
        `buttonBusy: ${report.buttonBusy}`
    ].join('\n');
};

const formatDiagnostic = diagnostic => {
    return [
        `classification: ${diagnostic.classification}`,
        `scenario: ${diagnostic.scenario}`,
        `iteration: ${diagnostic.iteration}`,
        `pollOutcome: ${diagnostic.pollOutcome}`,
        `busyImmediate: ${diagnostic.busyImmediate}`,
        `busyAfter50ms: ${diagnostic.busyAfter50ms}`,
        `busyAfterPolling: ${diagnostic.busyAfterPolling}`,
        '--- immediate report ---',
        formatReport(diagnostic.immediate),
        '--- delayed report ---',
        formatReport(diagnostic.delayed),
        diagnostic.extra ? `--- extra ---\n${JSON.stringify(diagnostic.extra, null, 2)}` : ''
    ].filter(Boolean).join('\n');
};

const classifyDiagnostic = diagnostic => {
    const { delayed, busyImmediate, busyAfter50ms, extra } = diagnostic;

    if (delayed.targetEditorExists && delayed.targetCellContainsActiveElement) {
        return 'editor opened and retained focus';
    }

    if (delayed.targetEditorExists && !delayed.targetCellContainsActiveElement) {
        return 'E) editor opened but focus was lost';
    }

    if (delayed.actionButtonFocused) {
        return 'action button received focus';
    }

    if (extra && extra.cellEditCalled === false) {
        return 'C) cell.edit was not called';
    }

    if (
        extra
        && extra.cellEditCalled === true
        && Array.isArray(extra.cellEditCalls)
        && extra.cellEditCalls.some(call => call.editorExistsAfter)
        && !delayed.targetEditorExists
    ) {
        return 'E) editor opened after cell.edit, then closed or lost focus before the delayed report';
    }

    if (extra && extra.cellEditCalled === true && !delayed.targetEditorExists) {
        return 'D) cell.edit was called but no editor opened';
    }

    if (busyImmediate !== 'true' && busyAfter50ms !== 'true') {
        return 'B) toolbar callback did not keep the Add button busy';
    }

    return 'A) timing inconclusive or editor never appeared before polling timeout';
};

const collectFocusReport = async (page, {
    scenario,
    iteration,
    phase,
    tableSelector,
    targetField,
    addButtonSelector = null
}) => {
    return page.evaluate(({
        scenario,
        iteration,
        phase,
        tableSelector,
        targetField,
        addButtonSelector
    }) => {
        const tableRoot = document.querySelector(tableSelector);
        const activeElement = document.activeElement;
        const actionButton = activeElement && typeof activeElement.closest === 'function'
            ? activeElement.closest('.amb-row-action-button')
            : null;
        const activeCell = activeElement && typeof activeElement.closest === 'function'
            ? activeElement.closest('.tabulator-cell')
            : null;
        const visibleNewRows = tableRoot
            ? Array.from(tableRoot.querySelectorAll('.tabulator-row[data-state="new"]'))
                .filter(row => row.offsetParent !== null)
            : [];
        const newRow = visibleNewRows[visibleNewRows.length - 1] || null;
        const targetCell = newRow
            ? newRow.querySelector(`.tabulator-cell[tabulator-field="${targetField}"]`)
            : null;
        const targetEditor = targetCell
            ? targetCell.querySelector('input, textarea, select, [contenteditable="true"]')
            : null;
        const activePage = tableRoot
            ? tableRoot.querySelector('.tabulator-page.active')
            : null;
        const pageSizeSelect = tableRoot
            ? tableRoot.querySelector('.tabulator-page-size')
            : null;
        const addButton = addButtonSelector
            ? document.querySelector(addButtonSelector)
            : null;

        return {
            scenario,
            iteration,
            phase,
            activeElement: {
                tagName: activeElement ? activeElement.tagName : null,
                className: activeElement ? String(activeElement.className || '') : null,
                ariaLabel: activeElement ? activeElement.getAttribute('aria-label') : null
            },
            actionButtonFocused: Boolean(actionButton),
            activeInsideTabulatorCell: Boolean(activeCell),
            activeCellField: activeCell ? activeCell.getAttribute('tabulator-field') : null,
            newRowsVisible: visibleNewRows.length,
            currentPage: activePage ? activePage.textContent.trim() : null,
            pageSize: pageSizeSelect ? pageSizeSelect.value : null,
            newRowExists: Boolean(newRow),
            targetField,
            targetCellExists: Boolean(targetCell),
            targetCellEditing: Boolean(
                targetCell && targetCell.classList.contains('tabulator-editing')
            ),
            targetEditorExists: Boolean(targetEditor),
            targetEditorFocused: Boolean(targetEditor && targetEditor === activeElement),
            targetCellContainsActiveElement: Boolean(
                targetCell && activeElement && targetCell.contains(activeElement)
            ),
            buttonBusy: addButton ? addButton.dataset.busy || null : null
        };
    }, {
        scenario,
        iteration,
        phase,
        tableSelector,
        targetField,
        addButtonSelector
    });
};

const readBusyState = async (page, selector) => {
    return page.locator(selector).evaluate(button => button.dataset.busy || null);
};

const waitForFocusOutcome = async (page, {
    tableSelector,
    targetField
}) => {
    try {
        return await page.waitForFunction(({ tableSelector, targetField }) => {
            const tableRoot = document.querySelector(tableSelector);
            const activeElement = document.activeElement;
            const actionButton = activeElement && typeof activeElement.closest === 'function'
                ? activeElement.closest('.amb-row-action-button')
                : null;
            const visibleNewRows = tableRoot
                ? Array.from(tableRoot.querySelectorAll('.tabulator-row[data-state="new"]'))
                    .filter(row => row.offsetParent !== null)
                : [];
            const newRow = visibleNewRows[visibleNewRows.length - 1] || null;
            const targetCell = newRow
                ? newRow.querySelector(`.tabulator-cell[tabulator-field="${targetField}"]`)
                : null;
            const targetEditor = targetCell
                ? targetCell.querySelector('input, textarea, select, [contenteditable="true"]')
                : null;

            if (targetEditor) return 'target-editor-exists';
            if (targetCell && activeElement && targetCell.contains(activeElement)) return 'active-in-target-cell';
            if (actionButton) return 'active-in-action-button';

            return false;
        }, { tableSelector, targetField }, { timeout: POLL_TIMEOUT_MS }).then(handle => handle.jsonValue());
    } catch (error) {
        return 'poll-timeout';
    }
};

const runToolbarDiagnostic = async (page, {
    scenario,
    iteration,
    tableSelector,
    targetField,
    addButtonSelector
}) => {
    const addButton = page.locator(addButtonSelector);

    await addButton.click();

    const immediate = await collectFocusReport(page, {
        scenario,
        iteration,
        phase: 'immediate',
        tableSelector,
        targetField,
        addButtonSelector
    });
    const busyImmediate = await readBusyState(page, addButtonSelector);

    await page.waitForTimeout(50);
    const busyAfter50ms = await readBusyState(page, addButtonSelector);

    const pollOutcome = await waitForFocusOutcome(page, { tableSelector, targetField });
    const delayed = await collectFocusReport(page, {
        scenario,
        iteration,
        phase: 'after-polling',
        tableSelector,
        targetField,
        addButtonSelector
    });
    const busyAfterPolling = await readBusyState(page, addButtonSelector);
    const diagnostic = {
        scenario,
        iteration,
        pollOutcome,
        immediate,
        delayed,
        busyImmediate,
        busyAfter50ms,
        busyAfterPolling,
        extra: {
            addRowReturnIsPromise: 'not measurable from the demo toolbar without exposing the grid controller',
            cellEditCalled: 'not measurable from the demo toolbar without monkey-patching the grid controller'
        }
    };

    diagnostic.classification = classifyDiagnostic(diagnostic);
    console.info(formatDiagnostic(diagnostic));

    return diagnostic;
};

const assertDiagnosticSuccess = diagnostic => {
    const message = formatDiagnostic(diagnostic);

    expect(diagnostic.delayed.actionButtonFocused, `Focus is on the action/remove button.\n${message}`)
        .toBe(false);
    expect(diagnostic.delayed.targetCellExists, `Target cell is missing.\n${message}`)
        .toBe(true);
    expect(diagnostic.delayed.targetEditorExists, `Target cell did not open a real editor.\n${message}`)
        .toBe(true);
    expect(
        diagnostic.delayed.targetEditorFocused || diagnostic.delayed.targetCellContainsActiveElement,
        `Active element is not inside the target field editor/cell.\n${message}`
    ).toBe(true);
};

const openInventoryDemo = async page => {
    await page.goto('/src/demo/index.html#getting-started-javascript');
    await expect(page.locator('#inventory-table.tabulator')).toBeVisible();

    const pageSize = page.locator('#inventory-table .tabulator-page-size');

    if (await pageSize.count()) {
        await pageSize.selectOption('10');
        await expect(pageSize).toHaveValue('10');
    }
};

const openBasicCrudDemo = async page => {
    await page.goto('/src/demo/index.html#feature-examples');
    await expect(page.locator('#basic-table.tabulator')).toBeVisible();
};

test.describe('browser addRow focus diagnostic', () => {
    test('Gestionale Magazzino Classico reports immediate and delayed focus after repeated Add row', async ({ page }) => {
        await openInventoryDemo(page);

        for (let iteration = 1; iteration <= 3; iteration += 1) {
            const diagnostic = await runToolbarDiagnostic(page, {
                scenario: 'Gestionale Magazzino Classico paginated deleteColumn via toolbar',
                iteration,
                tableSelector: '#inventory-table',
                targetField: 'itemCode',
                addButtonSelector: '#javascript-demo .amb-toolbar__button--add'
            });

            assertDiagnosticSuccess(diagnostic);
        }
    });

    test('Basic CRUD reports immediate and delayed focus after Add row', async ({ page }) => {
        await openBasicCrudDemo(page);

        const diagnostic = await runToolbarDiagnostic(page, {
            scenario: 'Basic CRUD non-paginated deleteColumn via toolbar',
            iteration: 1,
            tableSelector: '#basic-table',
            targetField: 'title',
            addButtonSelector: '#feature-example .amb-toolbar__button--add'
        });

        assertDiagnosticSuccess(diagnostic);
    });

    test('direct awaited crud.addRow fixture compares core focus without toolbar timing', async ({ page }) => {
        await page.goto('/tests/e2e/fixtures/add-row-direct.html');
        await expect(page.locator('#fixture-table.tabulator')).toBeVisible();

        const directResult = await page.evaluate(() => window.__ambAddRowDiagnostic.addDirect());
        const pollOutcome = await waitForFocusOutcome(page, {
            tableSelector: '#fixture-table',
            targetField: 'itemCode'
        });
        const delayed = await collectFocusReport(page, {
            scenario: 'Direct awaited crud.addRow fixture',
            iteration: 1,
            phase: 'after-direct-await',
            tableSelector: '#fixture-table',
            targetField: 'itemCode'
        });
        const extra = await page.evaluate(directResult => {
            const diagnostics = window.__ambAddRowDiagnostic.diagnostics;
            const lastEditCall = diagnostics.cellEditCalls[diagnostics.cellEditCalls.length - 1] || null;

            return {
                directResult,
                addRowReturnIsPromise: diagnostics.directAddReturnIsPromise,
                cellEditCalled: diagnostics.cellEditCalls.length > 0,
                cellEditField: lastEditCall ? lastEditCall.field : null,
                cellEditCalls: diagnostics.cellEditCalls
            };
        }, directResult);
        const diagnostic = {
            scenario: 'Direct awaited crud.addRow fixture',
            iteration: 1,
            pollOutcome,
            immediate: delayed,
            delayed,
            busyImmediate: null,
            busyAfter50ms: null,
            busyAfterPolling: null,
            extra
        };

        diagnostic.classification = classifyDiagnostic(diagnostic);
        console.info(formatDiagnostic(diagnostic));

        assertDiagnosticSuccess(diagnostic);
    });
});
