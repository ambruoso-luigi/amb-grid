import { AMB } from '../index.js';

const formatAveragePrice = value => Number(value).toFixed(2);

export default function columnCalculations(app) {
    app.innerHTML = `
        <h2>Column calculations</h2>
        <p class="demo-note">Edit the business values and see each aggregate update in its own column.</p>
        <div id="column-calculations-table"></div>
    `;

    const grid = AMB.table({
        selector: '#column-calculations-table',
        height: '320px',
        toolbar: false,
        data: [
            { id: 1001, product: 'Barcode scanner', category: 'Hardware', quantity: 8, unitPrice: 84.5, deliveryDays: 3, score: 88 },
            { id: 1002, product: 'Label printer', category: 'Hardware', quantity: 5, unitPrice: 219.9, deliveryDays: 5, score: 92 },
            { id: 1003, product: 'Shipping labels', category: 'Supplies', quantity: 40, unitPrice: 12.75, deliveryDays: 2, score: 81 },
            { id: 1004, product: 'Storage bin', category: 'Warehouse', quantity: 24, unitPrice: 18.2, deliveryDays: 4, score: 85 },
            { id: 1005, product: 'Packing tape', category: 'Supplies', quantity: 36, unitPrice: 4.8, deliveryDays: 1, score: 79 },
            { id: 1006, product: 'Safety gloves', category: 'Safety', quantity: 18, unitPrice: 9.6, deliveryDays: 3, score: 95 },
            { id: 1007, product: 'Steel shelving', category: 'Warehouse', quantity: 6, unitPrice: 148, deliveryDays: 7, score: 90 }
        ],
        layout: 'fitColumns',
        columns: [
            {
                title: 'ID', field: 'id', minWidth: 75,
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
                title: 'Quantity', field: 'quantity', minWidth: 105,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                topCalc: 'sum',
                topCalcFormatter: AMB.formatters.calculation({ label: 'SUM:' })
            },
            {
                title: 'Unit price', field: 'unitPrice', minWidth: 120,
                editor: AMB.editors.decimal({ integerDigits: 7, decimalDigits: 2, allowEmpty: false }),
                formatter: AMB.formatters.decimal(2),
                topCalc: 'avg',
                topCalcParams: { precision: false },
                topCalcFormatter: AMB.formatters.calculation({ label: 'AVG:', formatValue: formatAveragePrice })
            },
            {
                title: 'Delivery days', field: 'deliveryDays', minWidth: 125,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                topCalc: 'min',
                topCalcFormatter: AMB.formatters.calculation({ label: 'MIN:' })
            },
            {
                title: 'Score', field: 'score', minWidth: 95,
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
