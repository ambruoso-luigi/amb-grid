import fs from 'node:fs';
import { describe, expect, test } from 'vitest';

import { createDemoColumnGuide } from '../src/demo/utils/demo-column-guide.js';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('Public demo column guides', () => {
    const demos = [
        'basic-crud',
        'validation',
        'autocomplete',
        'multifield-lookup',
        'row-states',
        'column-calculations',
        'full-demo'
    ];

    test('renders one shared closed disclosure and shared card structure', () => {
        const markup = createDemoColumnGuide({
            summary: 'Guide',
            summaryKey: 'guide.summary',
            intro: 'Intro',
            introKey: 'guide.intro',
            columns: [{
                title: 'Name',
                titleKey: 'guide.name',
                badge: 'TEXT',
                description: 'Editable text.',
                descriptionKey: 'guide.name.description'
            }]
        });

        expect(markup).toContain('<details class="demo-disclosure">');
        expect(markup).not.toContain('<details class="demo-disclosure" open>');
        expect(markup).toContain('class="demo-column-guide"');
        expect(markup).toContain('class="demo-column-guide__item"');
        expect(markup).toContain('class="demo-column-guide__title"');
        expect(markup).toContain('class="demo-column-guide__badge"');
        expect(markup).toContain('class="demo-column-guide__description"');
    });

    test('is used by all six mini-examples and the JavaScript demo', () => {
        demos.forEach(fileName => {
            const source = read(`src/demo/${fileName}.js`);

            expect(source).toContain("import { createDemoColumnGuide } from './utils/demo-column-guide.js'");
            expect(source).toContain('createDemoColumnGuide({');
        });
    });

    test('keeps guide copy complete in Italian and English', () => {
        const copy = read('src/demo/demo-column-guide-copy.js');
        const exampleCopy = read('src/demo/example-copy.js');
        const main = read('src/demo/main.js');
        const requiredKeys = [
            'guides.basic.tempId.description',
            'guides.validation.alias.description',
            'guides.validation.document.description',
            'guides.autocomplete.strict.description',
            'guides.multifield.municipality.description',
            'guides.rowStates.lifecycle.description',
            'mainDemo.guide.summary',
            'mainDemo.guide.actions.description',
            'guides.main.itemCode.description',
            'guides.main.notes.description'
        ];

        requiredKeys.forEach(key => {
            expect(copy.match(new RegExp(`'${key.replace(/\./g, '\\.')}':`, 'g'))).toHaveLength(2);
        });
        expect(main).toContain("import { demoColumnGuideTranslations } from './demo-column-guide-copy.js'");
        expect(main).toContain('...demoColumnGuideTranslations.it');
        expect(main).toContain('...demoColumnGuideTranslations.en');

        const referencedKeys = new Set(demos.flatMap(fileName => {
            const source = read(`src/demo/${fileName}.js`);

            return [...source.matchAll(/(?:summaryKey|introKey|titleKey|descriptionKey): '([^']+)'/g)]
                .map(([, key]) => key);
        }));
        const allCopy = `${copy}\n${exampleCopy}`;

        referencedKeys.forEach(key => {
            expect(allCopy.match(new RegExp(`'${key.replace(/\./g, '\\.')}':`, 'g'))).toHaveLength(2);
        });
    });

    test('documents the real validation, lookup, and JavaScript demo behavior', () => {
        const validation = read('src/demo/validation.js');
        const multifield = read('src/demo/multifield-lookup.js');
        const fullDemo = read('src/demo/full-demo.js');

        expect(validation).toContain('Required, unique ignoring case, and between 3 and 20 characters.');
        expect(validation).toContain('rejects the reserved TMP prefix.');
        expect(multifield).toContain("badge: 'MASTER'");
        expect(multifield).toContain('Actionable master field: click it to open the municipality lookup.');
        expect(fullDemo).toContain('matching PRD-A001 format and unique ignoring case.');
        expect(fullDemo).toContain('Required integer with a minimum value of zero.');
        expect(fullDemo).toContain('Required status selected from a searchable lookup dialog.');
        expect(fullDemo).toContain('Clean and saved rows show Delete, modified or deleted rows show Rollback, and new rows show Remove new.');
    });

    test('uses only shared responsive guide classes in demo CSS', () => {
        const css = read('src/demo/demo.css');

        expect(css).toContain('.demo-column-guide {');
        expect(css).toContain('.demo-column-guide__item {');
        expect(css).toContain('grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));');
        expect(css).not.toContain('.basic-column-card');
        expect(css).not.toContain('.validation-column-card');
    });
});

describe('Public Column calculations interactions', () => {
    test('uses the standard Add toolbar and delete column with a valid editable row', () => {
        const source = read('src/demo/column-calculations.js');

        expect(source).toContain("buttons: ['add']");
        expect(source).toContain('onAdd: handleAdd');
        expect(source).toContain('deleteColumn: {');
        expect(source).toContain('enabled: true');
        expect(source).toContain('return grid.crud.addRow({');
        expect(source).toContain('id: nextProductId++');
        expect(source).toContain("product: 'New product'");
        expect(source).toContain("category: 'New category'");
        expect(source).not.toContain("'save'");
        expect(source).not.toContain("'payload'");
    });

    test('keeps all seven calculations and applies the demo-only summary formatter', () => {
        const source = read('src/demo/column-calculations.js');
        const css = read('src/demo/demo.css');
        const libraryCss = read('src/amb-grid.css');

        expect(source.match(/topCalc:/g)).toHaveLength(7);
        expect(source.match(/topCalcFormatter:/g)).toHaveLength(7);
        expect(source).toContain('topCalc: countPrintProducts');
        expect(source).toContain("label: 'PRINT'");
        expect(source.match(/className: 'demo-calculation-summary/g)).toHaveLength(7);
        expect(css).toContain('.demo-column-calculations-grid .tabulator-header .tabulator-calcs-holder');
        expect(css).toContain('.demo-column-calculations-grid .demo-calculation-summary .amb-calc-value');
        expect(libraryCss).not.toContain('demo-calculation-summary');
    });
});
