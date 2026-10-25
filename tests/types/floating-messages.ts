import { AMB } from '../../dist-lib/index.js';

type Column = NonNullable<NonNullable<Parameters<typeof AMB.table>[0]>['columns']>[number];
const columns: Column[] = [{
    field: 'notes',
    floatingMessages: {
        validationErrors: { enabled: true, title: 'Validation problem', className: 'custom-error' },
        lookupDescriptions: { enabled: false, title: 'Description', className: 'custom-lookup' },
        largeTextPreviews: { enabled: true, title: 'Historical notes', className: 'antique-notes-tooltip' }
    }
}, {
    title: 'Details',
    columns: [{ field: 'summary', floatingMessages: { largeTextPreviews: { enabled: true } } }]
}];
AMB.table({ selector: '#grid', columns, floatingMessages: { largeTextPreviews: false } });

// @ts-expect-error enabled must be boolean.
const wrongEnabled: Column = { floatingMessages: { validationErrors: { enabled: 'yes' } } };
// @ts-expect-error title must be a string.
const wrongTitle: Column = { floatingMessages: { lookupDescriptions: { title: 42 } } };
// @ts-expect-error className must be a string.
const wrongClass: Column = { floatingMessages: { largeTextPreviews: { className: false } } };
// @ts-expect-error Table-level channels still use boolean options.
AMB.table({ selector: '#grid', floatingMessages: { validationErrors: { enabled: true } } });
// @ts-expect-error searchFilterStatus is exclusively global.
const wrongChannel: Column = { floatingMessages: { searchFilterStatus: { enabled: true } } };
void [wrongEnabled, wrongTitle, wrongClass, wrongChannel];
