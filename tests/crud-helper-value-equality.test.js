import { describe, expect, test } from 'vitest';
import { CrudHelper, ROW_STATE } from '../src/lib/crud-helper.js';

const fixture = () => ({
    id: 1,
    name: 'Atlas',
    quantity: 4,
    images: [{ src: '/one.jpg', alt: 'One' }, { src: '/two.jpg', alt: 'Two' }],
    details: { address: { city: 'Roma', tags: ['home', 'office'] }, enabled: true }
});

// Same row/cell/event harness pattern as the existing CRUD validation tests.
const createHarness = (data = fixture()) => {
    const element = () => ({ dataset: {}, removeAttribute() {} });
    const cells = new Map();
    const handlers = new Map();
    const rowElement = element();
    const row = {
        getData: () => data,
        getElement: () => rowElement,
        getCells: () => [...cells.values()],
        getCell: field => {
            if (!cells.has(field)) {
                const cellElement = element();
                cells.set(field, {
                    getField: () => field,
                    getValue: () => data[field],
                    getRow: () => row,
                    getElement: () => cellElement
                });
            }
            return cells.get(field);
        },
        update: patch => { Object.assign(data, patch); }
    };
    Object.keys(data).forEach(row.getCell);
    const table = {
        getRows: () => [row],
        on: (event, handler) => handlers.set(event, handler),
        off: event => handlers.delete(event)
    };
    const crud = new CrudHelper(table);
    return {
        crud, row, data,
        render: () => handlers.get('renderComplete')(),
        edit: (field, value) => {
            row.getCell(field);
            row.update({ [field]: value });
            handlers.get('cellEdited')(row.getCell(field));
        }
    };
};

const markers = row => row.getCells().filter(cell => cell.getElement().dataset.cellState === 'modified')
    .map(cell => cell.getField()).sort();
const emptyChanges = { inserted: [], updated: [], deleted: [] };
const expectState = ({ crud, row, data }, fields) => {
    const changed = fields.length > 0;
    expect(markers(row)).toEqual([...fields].sort());
    expect(data._state).toBe(changed ? ROW_STATE.MODIFIED : ROW_STATE.CLEAN);
    expect(row.getElement().dataset.state).toBe(data._state);
    const changes = crud.getChanges();
    const report = crud.getStateReport();
    const payload = crud.getSavePayload();
    expect([...report.rows[0].changedFields].sort()).toEqual([...fields].sort());
    expect(report.hasChanges).toBe(changed);
    expect(report.changedRowsCount).toBe(Number(changed));
    expect(report.changes).toEqual(changes);
    expect(report.validChanges).toEqual(changes);
    expect(payload.hasChanges).toBe(changed);
    expect(payload.canSave).toBe(changed);
    expect(payload.changes).toEqual(changes);
    if (changed) {
        expect(changes.updated).toHaveLength(1);
        expect(changes.updated[0].changedFields.sort()).toEqual([...fields].sort());
        for (const field of fields) expect(changes.updated[0].after[field]).toEqual(data[field]);
    } else {
        expect(changes).toEqual(emptyChanges);
    }
};

describe('CrudHelper complex value equality', () => {
    test('initial cell markers are clean for copied arrays and objects', () => {
        const { row } = createHarness();
        expect(markers(row)).toEqual([]);
    });

    test('initial row state remains clean', () => {
        const { row, data } = createHarness();
        expect(data._state).toBe(ROW_STATE.CLEAN);
        expect(row.getElement().dataset.state).toBe(ROW_STATE.CLEAN);
    });

    test('initial getChanges contains no updates', () => {
        expect(createHarness().crud.getChanges()).toEqual(emptyChanges);
    });

    test('initial state report has neither changed rows nor changedFields', () => {
        const report = createHarness().crud.getStateReport();
        expect(report.hasChanges).toBe(false);
        expect(report.changedRows).toEqual([]);
        expect(report.rows[0].changedFields).toEqual([]);
    });

    test('initial save payload contains no updates and cannot save', () => {
        const payload = createHarness().crud.getSavePayload();
        expect(payload.hasChanges).toBe(false);
        expect(payload.canSave).toBe(false);
        expect(payload.changes).toEqual(emptyChanges);
    });

    test('a primitive edit reports only that field despite unchanged complex values', () => {
        const harness = createHarness();
        harness.edit('name', 'Updated');
        expectState(harness, ['name']);
    });

    test.each(['getChanges', 'getStateReport', 'getSavePayload'])('%s excludes unchanged complex fields after a primitive edit', method => {
        const harness = createHarness();
        harness.edit('name', 'Updated');
        const result = harness.crud[method]();
        const fields = method === 'getStateReport' ? result.rows[0].changedFields
            : (result.changes || result).updated[0].changedFields;
        expect(fields).toEqual(['name']);
    });

    test.each(['images', 'details'])('identical replacement of %s remains clean across updates and renders', field => {
        const harness = createHarness();
        harness.crud.updateRowFields(1, { [field]: structuredClone(harness.data[field]) });
        harness.render();
        expectState(harness, []);
    });

    test.each([
        ['images', data => { data.images[1].alt = 'Changed'; }],
        ['images', data => { data.images.reverse(); }],
        ['details', data => { data.details.address.city = 'Milano'; }],
        ['details', data => { data.details.address.tags.push('other'); }]
    ])('detects a deep or ordered change in %s and clears it after restoration', (field, mutate) => {
        const harness = createHarness();
        const original = structuredClone(harness.data[field]);
        mutate(harness.data);
        harness.edit(field, harness.data[field]);
        expectState(harness, [field]);
        expect(harness.crud.getChanges().updated[0].before[field]).toEqual(original);
        harness.edit(field, structuredClone(original));
        harness.render();
        expectState(harness, []);
    });

    test('object property order does not cause modifications', () => {
        const harness = createHarness();
        const { address, enabled } = harness.data.details;
        harness.edit('details', { enabled, address: { tags: [...address.tags], city: address.city } });
        expectState(harness, []);
    });

    test('missing and undefined nested properties differ in both directions', () => {
        const harness = createHarness({ id: 1, value: { optional: undefined } });
        harness.edit('value', {});
        expectState(harness, ['value']);
        harness.edit('value', { optional: undefined });
        expectState(harness, []);
        const other = createHarness({ id: 1, value: {} });
        other.edit('value', { optional: undefined });
        expectState(other, ['value']);
    });

    test('missing and undefined top-level fields differ without marking technical or virtual cells', () => {
        const harness = createHarness({ id: 1, value: undefined });
        harness.row.getCell('_state');
        harness.row.getCell('virtual');
        delete harness.data.value;
        harness.crud.updateRowFields(1, {});
        expectState(harness, ['value']);
        harness.edit('value', undefined);
        expectState(harness, []);
        harness.edit('optional', undefined);
        expectState(harness, ['optional']);
    });

    test('sparse arrays differ from explicit undefined and from different lengths', () => {
        const harness = createHarness({ id: 1, value: Array(1) });
        harness.edit('value', [undefined]);
        expectState(harness, ['value']);
        harness.edit('value', Array(1));
        expectState(harness, []);
        harness.edit('value', Array(2));
        expectState(harness, ['value']);
    });

    test('rollback restores complex contents and remains clean after rendering', () => {
        const harness = createHarness();
        harness.crud.updateRowFields(1, { images: [], details: { address: { city: 'Milano' } } });
        expectState(harness, ['images', 'details']);
        expect(harness.crud.rollbackRow(1)).toBe(true);
        harness.render();
        expectState(harness, []);
        expect(harness.data.images).toEqual(fixture().images);
        expect(harness.data.details).toEqual(fixture().details);
    });

    test('rollback restores absence of a newly added field', () => {
        const harness = createHarness({ id: 1, name: 'Atlas' });
        harness.edit('optional', undefined);
        expectState(harness, ['optional']);
        expect(harness.crud.rollbackRow(1)).toBe(true);
        harness.render();
        expectState(harness, []);
        expect(Object.hasOwn(harness.data, 'optional')).toBe(false);
    });

    test('async rollback restores both missing fields and explicit undefined', async () => {
        const harness = createHarness({ id: 1, value: undefined });
        delete harness.data.value;
        harness.edit('optional', { nested: true });
        harness.crud.updateRowFields(1, {});
        expectState(harness, ['value', 'optional']);
        const operations = [];
        const update = harness.row.update;
        harness.row.update = patch => {
            const operation = Promise.resolve().then(() => update(patch));
            operations.push(operation);
            return operation;
        };
        expect(harness.crud.rollbackRow(1)).toBe(true);
        await Promise.all(operations);
        harness.render();
        expectState(harness, []);
        expect(Object.hasOwn(harness.data, 'value')).toBe(true);
        expect(Object.hasOwn(harness.data, 'optional')).toBe(false);
    });

    test('rebase accepts a new complex snapshot and tracks subsequent changes against it', async () => {
        const harness = createHarness();
        harness.crud.updateRowFields(1, { images: [], details: { nested: { count: 2 } } });
        await harness.crud.rebaseCurrentData();
        harness.render();
        expectState(harness, []);
        harness.edit('details', { nested: { count: 3 } });
        expectState(harness, ['details']);
        expect(harness.crud.getChanges().updated[0].before.details).toEqual({ nested: { count: 2 } });
    });

    test.each([
        [null, null], [undefined, undefined], ['', ''], ['a', 'a'], ['a', 'b'],
        [0, 0], [0, -0], [4, 5], [NaN, NaN], [NaN, 0], [Infinity, Infinity],
        [true, true], [true, false], [1, '1'], [null, undefined], [1n, 1n], [1n, 2n]
    ])('preserves Object.is semantics for primitive values (%s → %s)', (before, after) => {
        const harness = createHarness({ id: 1, value: before });
        expectState(harness, []);
        harness.edit('value', after);
        expectState(harness, Object.is(before, after) ? [] : ['value']);
    });

    test('dates compare timestamps, including nested dates and invalid dates', () => {
        const harness = createHarness({ id: 1, value: { date: new Date('2026-01-01'), invalid: new Date(NaN) } });
        expectState(harness, []);
        harness.edit('value', structuredClone(harness.data.value));
        expectState(harness, []);
        harness.data.value.date.setUTCDate(2);
        harness.edit('value', harness.data.value);
        expectState(harness, ['value']);
    });

    test('null-prototype plain objects compare by their own properties', () => {
        const value = Object.assign(Object.create(null), { name: 'Atlas', optional: undefined });
        const harness = createHarness({ id: 1, value });
        expectState(harness, []);
        harness.edit('value', { optional: undefined, name: 'Atlas' });
        expectState(harness, []);
    });

    test('non-plain object types retain identity semantics and are not mistaken for empty objects', () => {
        const { crud } = createHarness({ id: 1 });
        for (const value of [new Map(), new Set(), /image/, new Uint8Array([1])]) {
            expect(crud._valuesAreEqual(value, value)).toBe(true);
            expect(crud._valuesAreEqual(value, structuredClone(value))).toBe(false);
            expect(crud._valuesAreEqual(value, {})).toBe(false);
        }
        expect(crud._valuesAreEqual([], {})).toBe(false);
        expect(crud._valuesAreEqual(new Date(0), {})).toBe(false);
    });

    test('cyclic plain data terminates and still detects changes', () => {
        const value = { label: 'before' };
        value.self = value;
        const harness = createHarness({ id: 1, value });
        expectState(harness, []);
        harness.data.value.label = 'after';
        harness.edit('value', harness.data.value);
        expectState(harness, ['value']);
    });
});
