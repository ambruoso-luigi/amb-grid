import { AMB } from '../../dist-lib/index.js';

const grid = AMB.table({ selector: '#grid', columns: [] });
const validate = () => true;

grid.addCellValidator('name', 'Invalid', validate);
grid.addCellValidator('name', 'Invalid', validate, { scope: 'cell' });
grid.addCellValidator('endDate', 'Invalid', validate, {
    scope: 'row', dependsOn: ['startDate', 'endDate']
});
grid.addCellValidator('code', 'Duplicate', validate, { scope: 'field' });
grid.addCellValidator('quota', 'Invalid', validate, { scope: 'grid', dependsOn: '*' });
// @ts-expect-error Invalid validation scope.
grid.addCellValidator('code', 'Duplicate', validate, { scope: 'banana' });
