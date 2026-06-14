import { AMB } from '../index.js';

export default function dates(app) {
    app.innerHTML = `
        <h2>Dates</h2>
        <p class="demo-note">Type eight digits and the editor inserts separators automatically. The parser supports Italian, ISO, US, and compact legacy formats.</p>
        <div id="dates-table"></div>
    `;

    return AMB.table({
        selector: '#dates-table',
        height: '260px',
        data: [
            { id: 1, eventName: 'First light', italianDate: '05/06/2026', isoDate: '2026-06-05', usDate: '06/05/2026', legacyDate: '20260605' },
            { id: 2, eventName: 'Open lab', italianDate: '20/07/2026', isoDate: '2026-07-20', usDate: '07/20/2026', legacyDate: '20260720' },
            { id: 3, eventName: 'Archive review', italianDate: '', isoDate: '', usDate: '', legacyDate: '' }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 80 },
            { title: 'Event', field: 'eventName', editor: AMB.editors.text({ trim: true }) },
            {
                title: 'Italian Date',
                field: 'italianDate',
                editor: AMB.editors.date({ format: 'dd/mm/yyyy', allowEmpty: true }),
                formatter: AMB.formatters.date('dd/mm/yyyy'),
                validation: {
                    date: {
                        format: 'dd/mm/yyyy',
                        message: 'Enter a real date'
                    }
                }
            },
            {
                title: 'ISO Date',
                field: 'isoDate',
                editor: AMB.editors.date({ format: 'iso', allowEmpty: true }),
                formatter: AMB.formatters.date('iso'),
                validation: {
                    date: {
                        format: 'iso',
                        message: 'Enter a real ISO date'
                    }
                }
            },
            {
                title: 'US Date',
                field: 'usDate',
                editor: AMB.editors.date({ format: 'mm/dd/yyyy', allowEmpty: true }),
                formatter: AMB.formatters.date('mm/dd/yyyy'),
                validation: {
                    date: {
                        format: 'mm/dd/yyyy',
                        message: 'Enter a real US date'
                    }
                }
            },
            {
                title: 'Legacy Date',
                field: 'legacyDate',
                editor: AMB.editors.date({ format: 'legacy', allowEmpty: true }),
                formatter: AMB.formatters.date('legacy'),
                validation: {
                    date: {
                        format: 'legacy',
                        message: 'Enter a real compact date'
                    }
                }
            }
        ]
    });
}
