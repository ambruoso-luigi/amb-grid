import 'tabulator-tables/dist/css/tabulator.min.css';
import 'vanillajs-datepicker/css/datepicker.min.css';
import '../amb-grid.css';
import './demo.css';
import { AMB } from '../index.js';
import basicCrud from './basic-crud.js';
import validation from './validation.js';
import numeric from './numeric.js';
import dates from './dates.js';
import autocomplete from './autocomplete.js';
import multifieldLookup from './multifield-lookup.js';
import parsers from './parsers.js';
import rowStates from './row-states.js';
import multipleTables from './multiple-tables.js';
import fullDemo from './full-demo.js';

window.AMB = AMB;
window.LookupDialog = AMB.LookupDialog;

const examples = [
    { id: 'basic-crud', label: 'Basic CRUD', mount: basicCrud },
    { id: 'validation', label: 'Validation', mount: validation },
    { id: 'numeric', label: 'Numeric', mount: numeric },
    { id: 'dates', label: 'Dates', mount: dates },
    { id: 'autocomplete', label: 'Autocomplete', mount: autocomplete },
    { id: 'multifield-lookup', label: 'Multifield lookup', mount: multifieldLookup },
    { id: 'parsers', label: 'Parsers', mount: parsers },
    { id: 'row-states', label: 'Row states', mount: rowStates },
    { id: 'multiple-tables', label: 'Multiple tables', mount: multipleTables },
    { id: 'full-demo', label: 'Starship Registry', mount: fullDemo }
];

const root = document.querySelector('#app');
let currentExample = null;
let loadToken = 0;

const clearExample = () => {
    if (currentExample && typeof currentExample.destroy === 'function') {
        currentExample.destroy();
    }

    currentExample = null;
    root.innerHTML = '';
};

const renderShell = selectedId => {
    root.innerHTML = `
        <main class="demo-page">
            <header class="demo-header">
                <h1>amb-grid demos</h1>
                <p>Small examples for AMB.table, editors, validators, formatters, parsers, and row state tracking.</p>
            </header>
            <nav class="demo-menu" aria-label="Demo examples">
                ${examples.map(example => `
                    <button
                        type="button"
                        class="demo-menu-button${example.id === selectedId ? ' is-active' : ''}"
                        data-example="${example.id}"
                    >
                        ${example.label}
                    </button>
                `).join('')}
            </nav>
            <section id="demo-example" class="demo-example"></section>
        </main>
    `;

    root.querySelectorAll('[data-example]').forEach(button => {
        button.addEventListener('click', () => loadExample(button.dataset.example));
    });
};

const loadExample = async id => {
    const example = examples.find(item => item.id === id) || examples[0];
    const token = loadToken + 1;

    loadToken = token;
    clearExample();
    renderShell(example.id);

    const mountedExample = await example.mount(root.querySelector('#demo-example'));

    if (token !== loadToken) {
        if (mountedExample && typeof mountedExample.destroy === 'function') {
            mountedExample.destroy();
        }

        return;
    }

    currentExample = mountedExample || null;
};

loadExample(examples[0].id);
