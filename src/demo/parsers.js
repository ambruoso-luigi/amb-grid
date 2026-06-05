import { AMB } from '../index.js';

export default function parsers(app) {
    app.innerHTML = `
        <h2>Parsers</h2>
        <div class="toolbar">
            <button type="button" data-value="05/06/2026">dd/mm/yyyy to yyyymmdd</button>
            <button type="button" data-value="2026-06-05">yyyy-mm-dd to dd/mm/yyyy</button>
            <button type="button" data-value="31/02/2026">Invalid date</button>
        </div>
        <pre class="demo-output" id="parser-output"></pre>
    `;

    const output = app.querySelector('#parser-output');

    app.querySelector('[data-value="05/06/2026"]').addEventListener('click', () => {
        output.textContent = AMB.parsers.date({
            inputFormat: 'dd/mm/yyyy',
            outputFormat: 'yyyymmdd'
        }).parse('05/06/2026');
    });

    app.querySelector('[data-value="2026-06-05"]').addEventListener('click', () => {
        output.textContent = AMB.parsers.date({
            inputFormat: 'yyyy-mm-dd',
            outputFormat: 'dd/mm/yyyy'
        }).parse('2026-06-05');
    });

    app.querySelector('[data-value="31/02/2026"]').addEventListener('click', () => {
        output.textContent = String(AMB.parsers.date().parse('31/02/2026'));
    });

    output.textContent = "Try from console: AMB.parsers.date({ inputFormat: 'dd/mm/yyyy', outputFormat: 'yyyymmdd' }).parse('05/06/2026')";

    return null;
}
