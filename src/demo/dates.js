import { AMB } from '../index.js';

export default function dates(app) {
    app.innerHTML = `
        <h2>Dates</h2>
        <p class="demo-note">Type eight digits and the editor inserts separators automatically.</p>
        <div id="dates-table"></div>
    `;

    return AMB.table({
        selector: '#dates-table',
        height: '260px',
        data: [
            { id: 1, eventName: 'First light', eventDate: '05/06/2026' },
            { id: 2, eventName: 'Open lab', eventDate: '20/07/2026' },
            { id: 3, eventName: 'Archive review', eventDate: '' }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 80 },
            { title: 'Event', field: 'eventName', editor: AMB.editors.text({ trim: true }) },
            {
                title: 'Event Date',
                field: 'eventDate',
                editor: AMB.editors.date({ format: 'dd/mm/yyyy', allowEmpty: true }),
                formatter: AMB.formatters.date('dd/mm/yyyy'),
                validation: {
                    date: {
                        format: 'dd/mm/yyyy',
                        message: 'Enter a real date'
                    }
                }
            }
        ]
    });
}
