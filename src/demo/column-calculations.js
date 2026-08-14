import { AMB } from '../index.js';

const formatAveragePrice = value => Number(value).toFixed(2);

export default function columnCalculations(app) {
    app.innerHTML = `
        <h2 data-i18n="examples.columnCalculations.title">Column calculations</h2>
        <p class="demo-note" data-i18n="examples.columnCalculations.intro">Edit the business values and see each aggregate update in its own column.</p>
        <details class="demo-disclosure">
            <summary class="demo-disclosure__summary" data-i18n="examples.columnCalculations.detailsTitle">How column calculations work</summary>
            <div class="demo-disclosure__content">
                <p data-i18n="examples.columnCalculations.detailsText">AMB Grid displays aggregate values in the calculation row. Each result uses its own column values and updates when the data changes.</p>
                <ul class="demo-explanation-list demo-explanation-list--compact">
                    <li><strong data-i18n="examples.columnCalculations.point1Title">Own column</strong><span data-i18n="examples.columnCalculations.detail1">Every calculation receives only the values from the column where it is displayed.</span></li>
                    <li><strong data-i18n="examples.columnCalculations.point2Title">Live updates</strong><span data-i18n="examples.columnCalculations.detail2">Edit a business value and the corresponding aggregate updates with the grid data.</span></li>
                    <li><strong data-i18n="examples.columnCalculations.point3Title">Built-in row</strong><span data-i18n="examples.columnCalculations.detail3">The calculation row keeps aggregates in the grid without external manual summaries.</span></li>
                </ul>
                <ul class="demo-calculation-map" aria-label="Column calculation mapping">
                    <li><strong>COUNT</strong><span>ID</span></li>
                    <li><strong>UNIQUE</strong><span data-i18n="examples.columnCalculations.category">Category</span></li>
                    <li><strong>SUM</strong><span data-i18n="examples.columnCalculations.quantity">Quantity</span></li>
                    <li><strong>AVG</strong><span data-i18n="examples.columnCalculations.unitPrice">Unit price</span></li>
                    <li><strong>MIN</strong><span data-i18n="examples.columnCalculations.deliveryDays">Delivery days</span></li>
                    <li><strong>MAX</strong><span data-i18n="examples.columnCalculations.score">Score</span></li>
                </ul>
            </div>
        </details>
        <div class="demo-table-workbench">
            <div id="column-calculations-table" class="demo-business-grid demo-business-grid--viewport"></div>
        </div>
    `;

    const grid = AMB.table({
        selector: '#column-calculations-table',
        toolbar: false,
        data: [
            { id: 1001, product: 'Barcode scanner', category: 'Hardware', quantity: 8, unitPrice: 84.5, deliveryDays: 3, score: 88 },
            { id: 1002, product: 'Label printer', category: 'Hardware', quantity: 5, unitPrice: 219.9, deliveryDays: 5, score: 92 },
            { id: 1003, product: 'Shipping labels', category: 'Supplies', quantity: 40, unitPrice: 12.75, deliveryDays: 2, score: 81 },
            { id: 1004, product: 'Storage bin', category: 'Warehouse', quantity: 24, unitPrice: 18.2, deliveryDays: 4, score: 85 },
            { id: 1005, product: 'Packing tape', category: 'Supplies', quantity: 36, unitPrice: 4.8, deliveryDays: 1, score: 79 },
            { id: 1006, product: 'Safety gloves', category: 'Safety', quantity: 18, unitPrice: 9.6, deliveryDays: 3, score: 95 },
            { id: 1007, product: 'Steel shelving', category: 'Warehouse', quantity: 6, unitPrice: 148, deliveryDays: 7, score: 90 },
            { id: 1008, product: 'Mobile terminal', category: 'Hardware', quantity: 10, unitPrice: 300, deliveryDays: 4, score: 93 },
            { id: 1009, product: 'Bubble wrap', category: 'Supplies', quantity: 50, unitPrice: 20, deliveryDays: 2, score: 84 },
            { id: 1010, product: 'Loading ramp', category: 'Warehouse', quantity: 3, unitPrice: 432.25, deliveryDays: 6, score: 91 }
        ],
        layout: 'fitColumns',
        columns: [
            {
                title: 'ID', field: 'id', minWidth: 70, widthGrow: 0.45,
                topCalc: 'count',
                topCalcFormatter: AMB.formatters.calculation({ label: 'COUNT:' })
            },
            { title: 'Product', field: 'product', minWidth: 150, widthGrow: 1.5, editor: AMB.editors.text({ trim: true }) },
            {
                title: 'Category', field: 'category', minWidth: 115, widthGrow: 1,
                editor: AMB.editors.text({ trim: true }),
                topCalc: 'unique',
                topCalcFormatter: AMB.formatters.calculation({ label: 'UNIQUE:' })
            },
            {
                title: 'Quantity', field: 'quantity', minWidth: 100, widthGrow: 0.75,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                topCalc: 'sum',
                topCalcFormatter: AMB.formatters.calculation({ label: 'SUM:' })
            },
            {
                title: 'Unit price', field: 'unitPrice', minWidth: 110, widthGrow: 0.85,
                editor: AMB.editors.decimal({ integerDigits: 7, decimalDigits: 2, allowEmpty: false }),
                formatter: AMB.formatters.decimal(2),
                topCalc: 'avg',
                topCalcParams: { precision: false },
                topCalcFormatter: AMB.formatters.calculation({ label: 'AVG:', formatValue: formatAveragePrice })
            },
            {
                title: 'Delivery days', field: 'deliveryDays', minWidth: 115, widthGrow: 0.8,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                topCalc: 'min',
                topCalcFormatter: AMB.formatters.calculation({ label: 'MIN:' })
            },
            {
                title: 'Score', field: 'score', minWidth: 88, widthGrow: 0.6,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                topCalc: 'max',
                topCalcFormatter: AMB.formatters.calculation({ label: 'MAX:' })
            }
        ]
    });

    return {
        destroy() {
            grid.destroy();
        }
    };
}
