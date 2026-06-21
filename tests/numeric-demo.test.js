import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const source = readFileSync(
    new URL('../src/demo/numeric.js', import.meta.url),
    'utf8'
);

const getColumnSource = (title, nextTitle) => {
    const start = source.indexOf(`title: '${title}'`);
    const end = nextTitle
        ? source.indexOf(`title: '${nextTitle}'`, start)
        : source.length;

    return source.slice(start, end);
};

describe('Numeric demo configuration', () => {
    test('keeps the demo compact and hides the CRUD toolbar', () => {
        expect(source).toContain('toolbar: false');
        expect(source).toContain(
            'Numeric editors keep user input constrained while validators enforce the accepted numeric shape.'
        );
        expect(source).toContain(
            '<summary class="demo-disclosure__summary">Numeric behavior</summary>'
        );
        expect(source).not.toContain('<details class="demo-disclosure" open>');
    });

    test('limits Count to ten non-negative integer digits', () => {
        const column = getColumnSource('Count', 'Measure');

        expect(column).toContain('AMB.editors.integer({');
        expect(column).toContain('allowEmpty: true');
        expect(column).toContain('maxLength: 10');
        expect(column).toContain('integer: {');
        expect(column).toContain('maxLength: {');
        expect(column).toContain('value: 10');
        expect(column).not.toContain('allowNegative: true');
    });

    test('uses three ratio decimals and up to one displayed percentage decimal', () => {
        const measure = getColumnSource('Measure', 'Credits');
        const credits = getColumnSource('Credits', 'Progress');
        const progress = getColumnSource('Progress');

        expect(measure.match(/decimalDigits: 3/g)).toHaveLength(2);
        expect(measure).toContain('AMB.formatters.decimal(3)');
        expect(measure).toContain('integerDigits: 3');
        expect(measure).toContain('allowNegative: true');

        expect(progress.match(/decimalDigits: 3/g)).toHaveLength(2);
        expect(progress).toContain('AMB.formatters.percentFromRatio(3)');
        expect(progress).toContain('integerDigits: 1');
        expect(source).toContain(
            'Progress: stored as a ratio with 3 decimal places and displayed as a percentage with up to 1 decimal digit.'
        );

        expect(credits.match(/decimalDigits: 2/g)).toHaveLength(2);
        expect(credits).toContain('AMB.formatters.currency()');
    });
});
