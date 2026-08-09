import { expect, test } from '@playwright/test';

const TABLE = '#column-calculations-test-table';
const INITIAL_CALCULATIONS = {
    id: ['COUNT:', '30'],
    code: ['CONCAT:', 'A01A02A03A04A05A06A07A08A09A10A11A12A13A14A15A16A17A18A19A20A21A22A23A24A25A26A27A28A29A30'],
    product: ['RANGE:', '34'],
    category: ['UNIQUE:', '7'],
    quantity: ['SUM:', '339'],
    unitPrice: ['AVG:', '152,86'],
    deliveryDays: ['MIN:', '1'],
    score: ['MAX:', '100']
};

const calcCell = (page, field) => {
    return page.locator(
        `${TABLE} .tabulator-calcs-top .tabulator-cell[tabulator-field="${field}"]`
    );
};

const expectTopCalculationClasses = async page => {
    const row = page.locator(`${TABLE} .amb-calc-row.amb-calc-row--top`);

    await expect(row).toHaveCount(1);
    await expect(row.locator('.tabulator-cell:not(.amb-calc-cell)'))
        .toHaveCount(0);
};

const expectAverageFormatterClasses = async page => {
    const average = calcCell(page, 'unitPrice');

    await expect(average.locator('.amb-calc-content.test-calc-highlight'))
        .toHaveCount(1);
    await expect(average.locator('.amb-calc-label')).toHaveText('AVG:');
    await expect(average.locator('.amb-calc-value')).toHaveText('152,86');
};

const dataRow = (page, code) => {
    return page.locator(`${TABLE} .tabulator-row:not(.tabulator-calcs)`).filter({
        has: page.locator(`.tabulator-cell[tabulator-field="code"]`, {
            hasText: code
        })
    });
};

const expectCalculations = async (page, expected) => {
    await Promise.all(Object.entries(expected).map(([field, [label, value]]) => {
        return expect(calcCell(page, field)).toHaveText(`${label}${value}`);
    }));
};

const expectOrderIndependentCalculations = async page => {
    const { code: _code, ...orderIndependent } = INITIAL_CALCULATIONS;

    await expectCalculations(page, orderIndependent);
};

const confirmDialog = async page => {
    const dialog = page.locator('.teh-confirm-dialog--visible');

    await expect(dialog).toBeVisible();
    await dialog.locator('.teh-confirm-dialog__button--confirm').click();
};

const editCell = async (row, field, value) => {
    const cell = row.locator(`.tabulator-cell[tabulator-field="${field}"]`);
    let input = cell.locator('input');

    if (await input.count() === 0) {
        await cell.dblclick();
        input = cell.locator('input');
    }

    await expect(input).toBeVisible();
    await input.fill(value);
    await input.press('Enter');
};

const openCalculationsPage = async page => {
    await page.goto('/test/');
    await expect(page.locator(`${TABLE}.tabulator`)).toBeVisible();
    await expectCalculations(page, INITIAL_CALCULATIONS);
};

test('calculation pagination, filtering, sorting and public APIs stay coherent', async ({ page }) => {
    await openCalculationsPage(page);
    await expectTopCalculationClasses(page);
    await expectAverageFormatterClasses(page);
    await expect(page.locator(`${TABLE} .tabulator-row:not(.tabulator-calcs)`))
        .toHaveCount(10);

    for (const pageNumber of [2, 3]) {
        await page.locator(TABLE).getByRole('button', {
            name: `Show Page ${pageNumber}`
        }).click();
        await expectCalculations(page, INITIAL_CALCULATIONS);
        await expectTopCalculationClasses(page);
    }

    const pageSize = page.locator(TABLE).getByRole('combobox', {
        name: 'Page Size'
    });

    for (const size of ['20', '50', '10']) {
        await pageSize.selectOption(size);
        await expectCalculations(page, INITIAL_CALCULATIONS);
    }

    const search = page.getByPlaceholder('Filtra calcoli...');

    await search.fill('Security');
    await expectCalculations(page, {
        id: ['COUNT:', '3'],
        code: ['CONCAT:', 'A12A13A22'],
        product: ['RANGE:', '5'],
        category: ['UNIQUE:', '1'],
        quantity: ['SUM:', '35'],
        unitPrice: ['AVG:', '202,83'],
        deliveryDays: ['MIN:', '2'],
        score: ['MAX:', '96']
    });
    await expectTopCalculationClasses(page);

    await search.clear();
    await expectCalculations(page, INITIAL_CALCULATIONS);

    await page.locator(TABLE).getByRole('columnheader', {
        name: 'Punteggio'
    }).click();
    await expectOrderIndependentCalculations(page);

    await page.getByRole('button', {
        name: 'Mostra risultati calcoli',
        exact: true
    }).click();
    const outputText = await page.locator('#test-output').textContent();
    const calculationResults = JSON.parse(outputText.split('\n\n')[1]);

    expect(calculationResults.top.id).toBe(30);
    expect(Number(calculationResults.top.unitPrice)).toBeCloseTo(152.8643, 4);

    await page.getByRole('button', {
        name: 'Ricalcola risultati',
        exact: true
    }).click();
    await expect(page.locator('#test-output')).toContainText('Risultati ricalcolati');
    await expectOrderIndependentCalculations(page);
    await expectTopCalculationClasses(page);
    await expectAverageFormatterClasses(page);
});

test('delete and rollback on page three update the complete calculation dataset', async ({ page }) => {
    await openCalculationsPage(page);
    await page.locator(TABLE).getByRole('button', { name: 'Show Page 3' }).click();
    const cloudBackupRow = dataRow(page, 'A27');

    await cloudBackupRow.locator('.amb-row-action-button--delete').click();
    await confirmDialog(page);
    await expect(cloudBackupRow).toHaveAttribute('data-state', 'deleted');
    await expect(cloudBackupRow.locator('.amb-row-action-button--rollback'))
        .toBeVisible();
    await expectCalculations(page, {
        id: ['COUNT:', '29'],
        code: ['CONCAT:', 'A01A02A03A04A05A06A07A08A09A10A11A12A13A14A15A16A17A18A19A20A21A22A23A24A25A26A28A29A30'],
        product: ['RANGE:', '34'],
        category: ['UNIQUE:', '6'],
        quantity: ['SUM:', '327'],
        unitPrice: ['AVG:', '155,72'],
        deliveryDays: ['MIN:', '1'],
        score: ['MAX:', '100']
    });
    await expectTopCalculationClasses(page);

    await cloudBackupRow.locator('.amb-row-action-button--rollback').click();
    await confirmDialog(page);
    await expect(cloudBackupRow).toHaveAttribute('data-state', 'clean');
    await expectCalculations(page, INITIAL_CALCULATIONS);
});

test('editing another page and adding a row update calculations', async ({ page }) => {
    await openCalculationsPage(page);
    await page.locator(TABLE).getByRole('button', { name: 'Show Page 2' }).click();
    await editCell(dataRow(page, 'A15'), 'quantity', '35');
    await expect(calcCell(page, 'quantity')).toHaveText('SUM:349');

    await page.locator(TABLE).getByRole('button', { name: 'Show Page 1' }).click();
    await expect(calcCell(page, 'quantity')).toHaveText('SUM:349');

    await openCalculationsPage(page);
    await page.locator('.amb-toolbar__button--add').last().click();
    await expectCalculations(page, INITIAL_CALCULATIONS);
    const newRow = page.locator(
        `${TABLE} .tabulator-row:not(.tabulator-calcs)[data-state="new"]`
    );

    await expect(newRow).toBeVisible();
    await editCell(newRow, 'code', 'A31');
    await editCell(newRow, 'product', 'Integration');
    await editCell(newRow, 'category', 'Integration');
    await editCell(newRow, 'quantity', '5');
    await editCell(newRow, 'unitPrice', '80,00');
    await editCell(newRow, 'deliveryDays', '10');
    await editCell(newRow, 'score', '105');
    await expect(newRow.locator('.tabulator-cell[tabulator-field="unitPrice"]'))
        .toHaveText('80,00');
    await expectCalculations(page, {
        id: ['COUNT:', '30'],
        code: ['CONCAT:', 'A01A02A03A04A05A06A07A08A09A10A11A12A13A14A15A16A17A18A19A20A21A22A23A24A25A26A27A28A29A30A31'],
        product: ['RANGE:', '39'],
        category: ['UNIQUE:', '8'],
        quantity: ['SUM:', '344'],
        unitPrice: ['AVG:', '150,51'],
        deliveryDays: ['MIN:', '1'],
        score: ['MAX:', '105']
    });

    await newRow.locator('.amb-row-action-button--remove-new').click();
    await confirmDialog(page);
    await expect(newRow).toHaveCount(0);
    await expectCalculations(page, INITIAL_CALCULATIONS);
});

test('technical mounts do not separate toolbar or feedback from their tables', async ({ page }) => {
    await page.goto('/test/');
    await expect(page.locator('#inventory-test-table.tabulator')).toBeVisible();
    await expect(page.locator('#multifield-lookup-test-table.tabulator')).toBeVisible();

    await expect.poll(() => page.evaluate(() => ({
        inventory: getComputedStyle(
            document.querySelector('#inventory-test-table')
        ).marginTop,
        multifield: getComputedStyle(
            document.querySelector('#multifield-lookup-test-table')
        ).marginTop
    }))).toEqual({
        inventory: '0px',
        multifield: '0px'
    });
});
