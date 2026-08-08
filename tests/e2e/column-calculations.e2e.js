import { expect, test } from '@playwright/test';

const TABLE = '#column-calculations-test-table';

const calcCell = (page, field) => {
    return page.locator(
        `${TABLE} .tabulator-calcs-top .tabulator-cell[tabulator-field="${field}"]`
    );
};

const expectTopCalculationClasses = async page => {
    const row = page.locator(
        `${TABLE} .amb-calc-row.amb-calc-row--top`
    );

    await expect(row).toHaveCount(1);
    await expect(row.locator('.tabulator-cell:not(.amb-calc-cell)'))
        .toHaveCount(0);
};

const dataRow = (page, code) => {
    return page.locator(`${TABLE} .tabulator-row:not(.tabulator-calcs)`).filter({
        has: page.locator(`.tabulator-cell[tabulator-field="code"]`, {
            hasText: code
        })
    });
};

const expectCalculations = async (page, expected) => {
    await Promise.all(Object.entries(expected).map(([field, value]) => {
        return expect(calcCell(page, field)).toHaveText(value);
    }));
};

const confirmDialog = async page => {
    const dialog = page.locator('.teh-confirm-dialog--visible');

    await expect(dialog).toBeVisible();
    await dialog.locator('.teh-confirm-dialog__button--confirm').click();
};

const editCell = async (row, field, value) => {
    const cell = row.locator(
        `.tabulator-cell[tabulator-field="${field}"]`
    );
    let input = cell.locator('input');

    if (await input.count() === 0) {
        await cell.dblclick();
        input = cell.locator('input');
    }

    await expect(input).toBeVisible();
    await input.fill(value);
    await input.press('Enter');
};

test('technical calculation grid follows CRUD state and decimal defaults', async ({ page }) => {
    await page.goto('/test/');
    await expect(page.locator(`${TABLE}.tabulator`)).toBeVisible();

    const initial = {
        id: 'count: 10',
        code: 'concat: A01A02A03A04A05A06A07A08A09A10',
        product: 'range: 29',
        category: 'unique: 4',
        quantity: 'sum: 105',
        unitPrice: 'avg: 83,81',
        deliveryDays: 'min: 1',
        score: 'max: 95'
    };

    await expectCalculations(page, initial);
    await expectTopCalculationClasses(page);

    const deletedRow = dataRow(page, 'A07');

    await deletedRow.locator('.amb-row-action-button--delete').click();
    await confirmDialog(page);
    await expect(deletedRow).toHaveAttribute('data-state', 'deleted');
    await expect(deletedRow.locator('.amb-row-action-button--rollback'))
        .toBeVisible();
    await expectCalculations(page, {
        id: 'count: 9',
        code: 'concat: A01A02A03A04A05A06A08A09A10',
        product: 'range: 29',
        category: 'unique: 3',
        quantity: 'sum: 101',
        unitPrice: 'avg: 88,46',
        deliveryDays: 'min: 2',
        score: 'max: 95'
    });
    await expectTopCalculationClasses(page);

    await deletedRow.locator('.amb-row-action-button--rollback').click();
    await confirmDialog(page);
    await expect(deletedRow).toHaveAttribute('data-state', 'clean');
    await expectCalculations(page, initial);
    await expectTopCalculationClasses(page);

    const firstRow = dataRow(page, 'A01');
    const quantityCell = firstRow.locator(
        '.tabulator-cell[tabulator-field="quantity"]'
    );
    const priceCell = firstRow.locator(
        '.tabulator-cell[tabulator-field="unitPrice"]'
    );

    await expect(priceCell).toHaveText('120,50');
    await priceCell.dblclick();
    const priceEditor = priceCell.locator('input');

    await expect(priceEditor).toHaveValue('120,50');
    await priceEditor.fill('130,50');
    await priceEditor.press('Enter');
    await expect(priceCell).toHaveText('130,50');

    await quantityCell.dblclick();
    await quantityCell.locator('input').fill('15');
    await quantityCell.locator('input').press('Enter');
    await expect(calcCell(page, 'quantity')).toHaveText('sum: 115');

    await page.locator('.amb-toolbar__button--add').last().click();
    await expect(calcCell(page, 'product')).toHaveText('range: 29');

    const newRow = page.locator(
        `${TABLE} .tabulator-row:not(.tabulator-calcs)[data-state="new"]`
    );

    await expect(newRow).toBeVisible();
    await editCell(newRow, 'code', 'A11');
    await editCell(newRow, 'product', 'Dock');
    await editCell(newRow, 'category', 'Peripherals');
    await editCell(newRow, 'quantity', '5');
    await editCell(newRow, 'unitPrice', '50,00');
    await editCell(newRow, 'deliveryDays', '9');
    await editCell(newRow, 'score', '100');
    await expectCalculations(page, {
        id: 'count: 10',
        code: 'concat: A01A02A03A04A05A06A07A08A09A10A11',
        product: 'range: 34',
        category: 'unique: 5',
        quantity: 'sum: 120',
        unitPrice: 'avg: 81,65',
        deliveryDays: 'min: 1',
        score: 'max: 100'
    });

    await newRow.locator('.amb-row-action-button--remove-new').click();
    await confirmDialog(page);
    await expect(newRow).toHaveCount(0);
    await expectCalculations(page, {
        ...initial,
        quantity: 'sum: 115',
        unitPrice: 'avg: 84,81'
    });
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
