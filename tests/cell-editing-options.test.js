import { describe, expect, test } from 'vitest';
import { normalizeCellEditingOptions } from '../src/lib/table/cell-editing-options.js';

describe('cell editing options', () => {
    test.each([
        [undefined, 'double-click'],
        [{}, 'double-click'],
        [{ mouseTrigger: 'double-click' }, 'double-click'],
        [{ mouseTrigger: 'single-click' }, 'single-click']
    ])('normalizes %o', (options, mouseTrigger) => {
        expect(normalizeCellEditingOptions(options)).toEqual({ mouseTrigger });
    });

    test.each([null, [], 'single-click'])('rejects an invalid cellEditing object: %o', options => {
        expect(() => normalizeCellEditingOptions(options))
            .toThrow('AMB.table: `cellEditing` must be an object.');
    });

    test('rejects an unknown mouse trigger', () => {
        expect(() => normalizeCellEditingOptions({ mouseTrigger: 'triple-click' }))
            .toThrow('AMB.table: `cellEditing.mouseTrigger` must be `double-click` or `single-click`.');
    });
});
