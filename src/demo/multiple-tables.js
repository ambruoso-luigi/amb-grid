import { AMB } from '../index.js';

export default function multipleTables(app) {
    app.innerHTML = `
        <h2>Multiple tables</h2>
        <div class="demo-grid">
            <section>
                <h3>Colors</h3>
                <div id="colors-table"></div>
            </section>
            <section>
                <h3>Signals</h3>
                <div id="signals-table"></div>
            </section>
        </div>
    `;

    const colors = AMB.table({
        selector: '#colors-table',
        height: '220px',
        data: [
            { id: 1, name: 'Cobalt', hex: '#0047ab' },
            { id: 2, name: 'Vermilion', hex: '#e34234' }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 70 },
            { title: 'Name', field: 'name', editor: AMB.editors.text({ trim: true }) },
            { title: 'Hex', field: 'hex', editor: AMB.editors.text({ trim: true }) }
        ]
    });

    const signals = AMB.table({
        selector: '#signals-table',
        height: '220px',
        data: [
            { id: 1, channel: 'Alpha', strength: 72 },
            { id: 2, channel: 'Beta', strength: 48 }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 70 },
            { title: 'Channel', field: 'channel', editor: AMB.editors.text({ trim: true }) },
            {
                title: 'Strength',
                field: 'strength',
                editor: AMB.editors.integer({ allowEmpty: true }),
                formatter: AMB.formatters.integer()
            }
        ]
    });

    return {
        destroy() {
            colors.destroy();
            signals.destroy();
        }
    };
}
