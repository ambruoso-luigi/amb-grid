import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const css = readFileSync(new URL('../src/amb-grid.css', import.meta.url), 'utf8');

describe('AMB clean-row zebra styling', () => {
    test('uses only AMB row parity attributes', () => {
        expect(css).toContain(
            '.tabulator-row[data-state="clean"][data-amb-row-parity="odd"]'
        );
        expect(css).toContain(
            '.tabulator-row[data-state="clean"][data-amb-row-parity="even"]'
        );
        expect(css).not.toContain('.tabulator-row-even');
        expect(css).not.toContain('.tabulator-row-odd');
        expect(css).not.toMatch(/nth-child\s*\(/);
    });
});
