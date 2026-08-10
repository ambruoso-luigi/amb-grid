import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const examples = {
    react: resolve(projectRoot, 'examples/frameworks/react.md'),
    vue: resolve(projectRoot, 'examples/frameworks/vue.md'),
    angular: resolve(projectRoot, 'examples/frameworks/angular.md')
};
const required = {
    react: ['npm install amb-grid', "from 'amb-grid'", "'amb-grid/style.css'", 'AMB.table', 'useEffect', 'destroy()'],
    vue: ['npm install amb-grid', "from 'amb-grid'", "'amb-grid/style.css'", 'AMB.table', 'onMounted', 'onBeforeUnmount', 'destroy()'],
    angular: ['npm install amb-grid', "from 'amb-grid'", "'amb-grid/style.css'", 'AMB.table', 'AfterViewInit', 'OnDestroy', 'destroy()']
};
const forbidden = [
    'tabulator-tables',
    'new Tabulator',
    "from 'src/",
    'from "src/',
    "from 'lib/",
    'from "lib/',
    'AMB.AMB'
];

Object.entries(examples).forEach(([framework, path]) => {
    if (!existsSync(path)) throw new Error(`Missing ${framework} example: ${path}`);

    const source = readFileSync(path, 'utf8');

    required[framework].forEach(fragment => {
        if (!source.includes(fragment)) {
            throw new Error(`${framework} example is missing: ${fragment}`);
        }
    });

    forbidden.forEach(fragment => {
        if (source.includes(fragment)) {
            throw new Error(`${framework} example contains forbidden usage: ${fragment}`);
        }
    });
});

console.log('AMB Grid framework examples verification passed.');
