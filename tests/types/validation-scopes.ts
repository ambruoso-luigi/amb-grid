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
AMB.table({ selector: '#validation-row', columns: [{ field: 'endDate', validation: {
    custom: { message: 'Invalid interval', validate: () => true, scope: 'row', dependsOn: ['startDate', 'endDate'] }
} }] });
AMB.table({ selector: '#validation-field', columns: [{ field: 'code', validation: {
    custom: { validate: () => true, scope: 'field' }
} }] });
AMB.table({ selector: '#validation-grid', columns: [{ field: 'quota', validation: {
    custom: { validate: () => true, scope: 'grid', dependsOn: '*' }
} }] });
AMB.table({ selector: '#validation-invalid', columns: [{ field: 'code', validation: {
    custom: { validate: () => true,
        // @ts-expect-error Invalid declarative validation scope.
        scope: 'banana' }
} }] });
// @ts-expect-error Invalid validation scope.
grid.addCellValidator('code', 'Duplicate', validate, { scope: 'banana' });
