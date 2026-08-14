import { AMB } from '../index.js';
import { countPrintProducts } from './utils/demo-calculations.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';

const formatAveragePrice = value => Number(value).toFixed(2);

export default function columnCalculations(app) {
    let nextProductId = 1011;

    app.innerHTML = `
        <h2 data-i18n="examples.columnCalculations.title">Column calculations</h2>
        <p class="demo-note" data-i18n="examples.columnCalculations.intro">Edit the business values and see each aggregate update in its own column.</p>
        ${createDemoColumnGuide({
            summary: 'How column calculations work',
            summaryKey: 'examples.columnCalculations.detailsTitle',
            intro: 'AMB Grid displays aggregate values in the calculation row. Each result uses its own column values and updates when the data changes.',
            introKey: 'examples.columnCalculations.detailsText',
            points: [
                { title: 'Own column', titleKey: 'examples.columnCalculations.point1Title', description: 'Every calculation receives only the values from the column where it is displayed.', descriptionKey: 'examples.columnCalculations.detail1' },
                { title: 'Live updates', titleKey: 'examples.columnCalculations.point2Title', description: 'Edit, add, delete, or undo and the corresponding aggregates follow the active rows.', descriptionKey: 'examples.columnCalculations.detail2' },
                { title: 'Built-in row', titleKey: 'examples.columnCalculations.point3Title', description: 'The calculation row keeps aggregates in the grid without external manual summaries.', descriptionKey: 'examples.columnCalculations.detail3' }
            ],
            columns: [
                { title: 'ID', titleKey: 'examples.columnCalculations.id', badge: 'COUNT', description: 'COUNT returns the number of rows.', descriptionKey: 'examples.columnCalculations.idCalc' },
                { title: 'Product', titleKey: 'examples.columnCalculations.product', badge: 'PRINT', description: 'The custom calculation counts product names containing "print".', descriptionKey: 'examples.columnCalculations.productCalc' },
                { title: 'Category', titleKey: 'examples.columnCalculations.category', badge: 'UNIQUE', description: 'UNIQUE counts the distinct categories.', descriptionKey: 'examples.columnCalculations.categoryCalc' },
                { title: 'Quantity', titleKey: 'examples.columnCalculations.quantity', badge: 'SUM', description: 'SUM adds all quantities.', descriptionKey: 'examples.columnCalculations.quantityCalc' },
                { title: 'Unit price', titleKey: 'examples.columnCalculations.unitPrice', badge: 'AVG', description: 'AVG calculates the average unit price.', descriptionKey: 'examples.columnCalculations.unitPriceCalc' },
                { title: 'Delivery days', titleKey: 'examples.columnCalculations.deliveryDays', badge: 'MIN', description: 'MIN returns the shortest delivery time.', descriptionKey: 'examples.columnCalculations.deliveryDaysCalc' },
                { title: 'Score', titleKey: 'examples.columnCalculations.score', badge: 'MAX', description: 'MAX returns the highest score.', descriptionKey: 'examples.columnCalculations.scoreCalc' }
            ]
        })}
        <div class="demo-table-workbench">
            <div id="column-calculations-table" class="demo-business-grid demo-business-grid--viewport demo-column-calculations-grid"></div>
        </div>
    `;

    const grid = AMB.table({
        selector: '#column-calculations-table',
        deleteColumn: {
            enabled: true,
            confirmDeleteMessage: 'Delete this product?',
            confirmRollbackMessage: 'Rollback this product?',
            confirmRemoveNewMessage: 'Remove this new product?'
        },
        toolbar: {
            buttons: ['add'],
            onAdd: handleAdd
        },
        data: [
            { id: 1001, product: 'Barcode printer', category: 'Hardware', quantity: 8, unitPrice: 84.5, deliveryDays: 3, score: 88 },
            { id: 1002, product: 'Label printer', category: 'Hardware', quantity: 5, unitPrice: 219.9, deliveryDays: 5, score: 92 },
            { id: 1003, product: 'Shipping labels', category: 'Supplies', quantity: 40, unitPrice: 12.75, deliveryDays: 2, score: 81 },
            { id: 1004, product: 'Storage bin', category: 'Warehouse', quantity: 24, unitPrice: 18.2, deliveryDays: 4, score: 85 },
            { id: 1005, product: 'Packing tape', category: 'Supplies', quantity: 36, unitPrice: 4.8, deliveryDays: 1, score: 79 },
            { id: 1006, product: 'Safety gloves', category: 'Safety', quantity: 18, unitPrice: 9.6, deliveryDays: 3, score: 95 },
            { id: 1007, product: 'Steel shelving', category: 'Warehouse', quantity: 6, unitPrice: 148, deliveryDays: 7, score: 90 },
            { id: 1008, product: 'Thermal printer', category: 'Hardware', quantity: 10, unitPrice: 300, deliveryDays: 4, score: 93 },
            { id: 1009, product: 'Bubble wrap', category: 'Supplies', quantity: 50, unitPrice: 20, deliveryDays: 2, score: 84 },
            { id: 1010, product: 'Print server', category: 'Warehouse', quantity: 3, unitPrice: 432.25, deliveryDays: 6, score: 91 }
        ],
        layout: 'fitColumns',
        columns: [
            {
                title: 'ID', field: 'id', minWidth: 70, widthGrow: 0.45,
                topCalc: 'count',
                topCalcFormatter: AMB.formatters.calculation({ label: 'COUNT', className: 'demo-calculation-summary demo-calculation-summary--count' })
            },
            {
                title: 'Product', field: 'product', minWidth: 150, widthGrow: 1.5,
                editor: AMB.editors.text({ trim: true }),
                topCalc: countPrintProducts,
                topCalcFormatter: AMB.formatters.calculation({ label: 'PRINT', className: 'demo-calculation-summary demo-calculation-summary--print' })
            },
            {
                title: 'Category', field: 'category', minWidth: 115, widthGrow: 1,
                editor: AMB.editors.text({ trim: true }),
                topCalc: 'unique',
                topCalcFormatter: AMB.formatters.calculation({ label: 'UNIQUE', className: 'demo-calculation-summary demo-calculation-summary--count' })
            },
            {
                title: 'Quantity', field: 'quantity', minWidth: 100, widthGrow: 0.75,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                topCalc: 'sum',
                topCalcFormatter: AMB.formatters.calculation({ label: 'SUM', className: 'demo-calculation-summary demo-calculation-summary--numeric' })
            },
            {
                title: 'Unit price', field: 'unitPrice', minWidth: 110, widthGrow: 0.85,
                editor: AMB.editors.decimal({ integerDigits: 7, decimalDigits: 2, allowEmpty: false }),
                formatter: AMB.formatters.decimal(2),
                topCalc: 'avg',
                topCalcParams: { precision: false },
                topCalcFormatter: AMB.formatters.calculation({ label: 'AVG', className: 'demo-calculation-summary demo-calculation-summary--numeric', formatValue: formatAveragePrice })
            },
            {
                title: 'Delivery days', field: 'deliveryDays', minWidth: 115, widthGrow: 0.8,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                topCalc: 'min',
                topCalcFormatter: AMB.formatters.calculation({ label: 'MIN', className: 'demo-calculation-summary demo-calculation-summary--range' })
            },
            {
                title: 'Score', field: 'score', minWidth: 88, widthGrow: 0.6,
                editor: AMB.editors.integer({ allowEmpty: false }),
                formatter: AMB.formatters.integer(),
                topCalc: 'max',
                topCalcFormatter: AMB.formatters.calculation({ label: 'MAX', className: 'demo-calculation-summary demo-calculation-summary--range' })
            }
        ]
    });

    function handleAdd() {
        grid.feedback.clear();

        return grid.crud.addRow({
            id: nextProductId++,
            product: 'New product',
            category: 'New category',
            quantity: 0,
            unitPrice: 0,
            deliveryDays: 0,
            score: 0
        });
    }

    return {
        destroy() {
            grid.destroy();
        }
    };
}
