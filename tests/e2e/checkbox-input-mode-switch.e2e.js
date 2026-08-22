import { expect, test } from '@playwright/test';

const TRACE_EVENTS = [
    'pointerdown', 'mousedown', 'focus', 'focusin', 'mouseup', 'click',
    'input', 'change', 'keydown', 'keyup', 'blur', 'focusout'
];

const openInventoryTestPage = async page => {
    await page.goto('/test/');
    await expect(page.locator('#inventory-test-table .tabulator-row').first()).toBeVisible();
    await page.evaluate(eventTypes => {
        const trace = { events: [], markers: [] };
        const observed = new WeakSet();
        const grid = document.querySelector('#inventory-test-table');
        const describe = value => {
            if (value === document) return 'document';
            if (!value) return null;
            const element = value.nodeType === Node.ELEMENT_NODE ? value : value.parentElement;
            if (!element) return value.nodeName || null;
            const cell = element.closest('.tabulator-cell');
            const field = cell ? cell.getAttribute('tabulator-field') : null;
            const id = element.id ? `#${element.id}` : '';
            const classes = typeof element.className === 'string' && element.className
                ? `.${element.className.trim().replace(/\s+/g, '.')}`
                : '';
            return `${element.tagName.toLowerCase()}${id}${classes}${field ? `[field=${field}]` : ''}`;
        };
        const currentEditingField = () => {
            const editingCell = document.querySelector('.tabulator-cell.tabulator-editing');
            return editingCell ? editingCell.getAttribute('tabulator-field') : null;
        };
        const attach = target => {
            if (!target || observed.has(target)) return;
            observed.add(target);
            eventTypes.forEach(type => {
                target.addEventListener(type, event => {
                    trace.events.push({
                        type: event.type,
                        target: describe(event.target),
                        currentTarget: describe(event.currentTarget),
                        key: event.key || null,
                        defaultPrevented: event.defaultPrevented,
                        cancelBubble: event.cancelBubble,
                        activeElement: describe(document.activeElement),
                        editingField: currentEditingField()
                    });
                }, true);
            });
        };
        const attachCurrentTargets = () => {
            if (!grid) return;
            attach(grid.querySelector('.tabulator-cell[tabulator-field="requiresInspection"]'));
            attach(grid.querySelector('.amb-checkbox-editor'));
            attach(grid.querySelector('.amb-checkbox-editor__input'));
        };

        attach(document);
        attach(grid);
        attachCurrentTargets();

        const observer = new MutationObserver(attachCurrentTargets);
        if (grid) observer.observe(grid, { childList: true, subtree: true });

        window.__checkboxEventTrace = trace;
        window.__checkboxEventTraceMark = label => trace.markers.push({
            label,
            activeElement: describe(document.activeElement),
            editingField: currentEditingField()
        });
    }, TRACE_EVENTS);
};

const markTrace = (page, label) => page.evaluate(value => {
    window.__checkboxEventTraceMark(value);
}, label);

const dumpTrace = async (page, label) => {
    const trace = await page.evaluate(() => window.__checkboxEventTrace);
    console.info(`[checkbox-event-trace] ${label}\n${JSON.stringify(trace, null, 2)}`);
};

const firstInventoryRow = page => page.locator('#inventory-test-table .tabulator-row').first();
const checkboxCell = page => firstInventoryRow(page).locator(
    '.tabulator-cell[tabulator-field="requiresInspection"]'
);
const checkboxInput = page => checkboxCell(page).locator('.amb-checkbox-editor__input');
const notesCell = page => firstInventoryRow(page).locator('.tabulator-cell[tabulator-field="notes"]');
const readCheckboxState = page => checkboxCell(page).evaluate(cell => cell.textContent.trim());

const focusCheckboxViaTab = async page => {
    const row = firstInventoryRow(page);
    const itemCodeCell = row.locator('.tabulator-cell[tabulator-field="itemCode"]');
    const itemCodeInput = itemCodeCell.locator('input');
    await itemCodeCell.click();
    await expect(itemCodeInput).toBeFocused();

    const fieldsAfterItemCode = [
        'productName', 'warehouse', 'stockQuantity', 'unitPrice',
        'lastCheckDate', 'status', 'requiresInspection'
    ];
    for (const field of fieldsAfterItemCode) {
        await page.keyboard.press('Tab');
        await expect(row.locator(`.tabulator-cell[tabulator-field="${field}"]`))
            .toHaveClass(/tabulator-editing/);
    }

    await expect(checkboxInput(page)).toBeVisible();
    await expect(checkboxInput(page)).toBeFocused();
};

test.describe('checkbox event trace', () => {
    test('A - mouse only baseline', async ({ page }) => {
        await openInventoryTestPage(page);
        try {
            const cell = checkboxCell(page);
            const initialState = await readCheckboxState(page);
            await markTrace(page, 'A: before first mouse click');
            await cell.click();
            await markTrace(page, 'A: after first mouse click');
            await cell.click();
            await markTrace(page, 'A: after second mouse click');
            await expect.poll(() => readCheckboxState(page)).toBe(initialState);
        } finally {
            await dumpTrace(page, 'A - mouse only baseline');
        }
    });

    test('B - mouse to Space', async ({ page }) => {
        await openInventoryTestPage(page);
        try {
            const cell = checkboxCell(page);
            const initialState = await readCheckboxState(page);
            await markTrace(page, 'B: before mouse click');
            await cell.click();
            await markTrace(page, 'B: after mouse click, before Space');
            await page.keyboard.press('Space');
            await markTrace(page, 'B: after Space');
            await expect.poll(() => readCheckboxState(page)).toBe(initialState);
        } finally {
            await dumpTrace(page, 'B - mouse to Space');
        }
    });

    test('C - keyboard to mouse on the real checkbox input', async ({ page }) => {
        await openInventoryTestPage(page);
        try {
            const initialState = await readCheckboxState(page);
            await focusCheckboxViaTab(page);
            await markTrace(page, 'C: checkbox input focused by Tab');
            await checkboxInput(page).click();
            await markTrace(page, 'C: after mouse click on checkbox input');
            await expect.poll(() => readCheckboxState(page)).not.toBe(initialState);
            await expect(notesCell(page)).not.toHaveClass(/tabulator-editing/);
            await expect(notesCell(page).locator('textarea, input')).toHaveCount(0);
        } finally {
            await dumpTrace(page, 'C - keyboard to mouse on input');
        }
    });

    test('D - keyboard to mouse on the empty part of the checkbox cell', async ({ page }) => {
        await openInventoryTestPage(page);
        try {
            const cell = checkboxCell(page);
            const initialState = await readCheckboxState(page);
            await focusCheckboxViaTab(page);
            await markTrace(page, 'D: checkbox input focused by Tab');
            const box = await cell.boundingBox();
            await cell.click({
                position: {
                    x: Math.max(1, (box?.width || 20) - 5),
                    y: Math.max(1, (box?.height || 20) / 2)
                }
            });
            await markTrace(page, 'D: after mouse click on empty cell area');
            await expect.poll(() => readCheckboxState(page)).not.toBe(initialState);
            await expect(notesCell(page)).not.toHaveClass(/tabulator-editing/);
        } finally {
            await dumpTrace(page, 'D - keyboard to mouse on cell');
        }
    });

    test('Enter trace after Tab reaches the checkbox', async ({ page }) => {
        await openInventoryTestPage(page);
        try {
            await focusCheckboxViaTab(page);
            await markTrace(page, 'Enter: checkbox input focused by Tab');
            await page.keyboard.press('Enter');
            await markTrace(page, 'Enter: after Enter');
        } finally {
            await dumpTrace(page, 'Enter trace');
        }
    });
});
