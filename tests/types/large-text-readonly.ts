import { AMB } from '../../dist-lib/index.js';

AMB.editors.largeText();
const readOnly: boolean = true;
const closeText: string = 'Chiudi';
AMB.table({
    selector: '#grid',
    data: [{ id: 1, notes: 'Historical notes' }],
    columns: [{
        title: 'Notes', field: 'notes',
        editor: AMB.editors.largeText({ readOnly, closeText })
    }]
});
AMB.editors.largeText({ readOnly: false });

// @ts-expect-error readOnly must be boolean.
AMB.editors.largeText({ readOnly: 'true' });
// @ts-expect-error closeText must be a string.
AMB.editors.largeText({ closeText: 42 });
