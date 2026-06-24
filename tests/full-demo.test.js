import fs from 'node:fs';
import { describe, expect, test } from 'vitest';

const source = fs.readFileSync(
    new URL('../src/demo/full-demo.js', import.meta.url),
    'utf8'
);

describe('Starship Registry demo', () => {
    test('keeps the status lookup and date focus columns together', () => {
        expect(source).toContain("title: 'Status'");
        expect(source).toContain("field: 'status'");
        expect(source).toContain('AMB.editors.lookup(statusLookup');
        expect(source).toContain('fakeApi.searchStatuses(query)');
        expect(source).toContain('dialogOptions: {');
        expect(source).toContain('closeOnBackdropClick: false');
        expect(source).toContain("controls: 'full'");
        expect(source).toContain("title: 'After Date'");
        expect(source).toContain("field: 'afterDateNote'");
        expect(source).toContain("title: 'Final Text'");
        expect(source).toContain("field: 'finalText'");
    });

    test('includes status and focus fields in newly inserted starships', () => {
        expect(source).toContain("status: ''");
        expect(source).toContain("afterDateNote: ''");
        expect(source).toContain("finalText: ''");
        expect(source).toContain('crud.getSavePayload()');
        expect(source).toContain('fakeApi.saveStarshipChanges(payload)');
    });
});
