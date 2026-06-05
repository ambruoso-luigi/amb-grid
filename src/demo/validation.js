import { AMB } from '../index.js';

export default function validation(app) {
    app.innerHTML = `
        <h2>Validation</h2>
        <p class="demo-note">Edit cells to trigger required, email, and pattern validation.</p>
        <div id="validation-table"></div>
    `;

    return AMB.table({
        selector: '#validation-table',
        height: '260px',
        data: [
            { id: 1, alias: 'Nova', email: 'nova@example.test', code: 'ABC001' },
            { id: 2, alias: 'Quill', email: 'quill@example.test', code: 'QIL220' },
            { id: 3, alias: '', email: 'bad-email', code: 'x1' }
        ],
        layout: 'fitColumns',
        columns: [
            { title: 'ID', field: 'id', width: 80 },
            {
                title: 'Alias',
                field: 'alias',
                editor: AMB.editors.text({ trim: true }),
                required: true
            },
            {
                title: 'Contact Email',
                field: 'email',
                editor: AMB.editors.text({ trim: true }),
                validation: { email: { message: 'Enter a valid email' } }
            },
            {
                title: 'Access Code',
                field: 'code',
                editor: AMB.editors.text({ uppercase: true, trim: true }),
                validation: {
                    pattern: {
                        regex: /^[A-Z]{3}[0-9]{3}$/,
                        message: 'Use three letters and three digits'
                    }
                }
            }
        ]
    });
}
