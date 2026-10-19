import { AMB } from '../../dist-lib/index.js';

const multifield = AMB.multifieldLookup({
    id: 'typed-lookup',
    lookup: {
        keyField: 'id',
        load: async () => [],
        getByKey: () => ({ id: 'one', name: 'One' })
    },
    masterField: { field: 'name', from: 'name' },
    dependentFields: [{ field: 'instrumentId', from: 'id' }]
});

multifield.masterColumn({
    editorOptions: {
        applyRecord(cell, patch, record, rowData) {
            const current: object = cell.getRow().getData();
            const mapped: object = patch;
            const selected: object = record;
            const previous: object | undefined = rowData;
            void [current, mapped, selected, previous];
            return { quantity: 3 };
        }
    }
});

multifield.masterColumn({ editorOptions: { applyRecord: () => null } });
multifield.masterColumn({ editorOptions: { applyRecord: () => undefined } });
multifield.masterColumn({ editorOptions: {
    // @ts-expect-error A selection callback must return a patch or rejection.
    applyRecord: () => 'invalid'
} });
