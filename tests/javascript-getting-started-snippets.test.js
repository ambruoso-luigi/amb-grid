import { expect, test, vi } from 'vitest';
import gettingStartedJavaScript from '../src/demo/getting-started-javascript.js';

test('visible snippets form one executable example with public callbacks', async () => {
    const app = { innerHTML: '' };
    gettingStartedJavaScript(app);
    const snippets = [...app.innerHTML.matchAll(/<pre class="demo-code-block"><code>([\s\S]*?)<\/code><\/pre>/g)]
        .map(([, html]) => html.replace(/<[^>]*>/g, '').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&'));
    expect(snippets).toHaveLength(4);
    expect(snippets[0]).toBe('<div id="grid"></div>');
    const addRow = vi.fn(async row => row);
    const getSavePayload = vi.fn(() => ({ changes: { inserted: [{ id: null }] } }));
    const grid = { addRow, getSavePayload };
    const table = vi.fn(() => grid);
    const AMB = {
        table,
        editors: { text: () => 'text', integer: () => 'integer' },
        formatters: { integer: () => 'integer-formatter' }
    };
    const log = vi.fn();
    const example = new Function('AMB', 'console', `${snippets.slice(1).join('\n')}\nreturn grid;`)(AMB, { log });
    expect(example).toBe(grid);
    const options = table.mock.calls[0][0];
    expect(options.selector).toBe('#grid');
    expect(options.data).toHaveLength(2);
    expect(options.columns.map(column => column.field)).toEqual(['sku', 'productName', 'stockQuantity']);
    expect(options.columns[2].validation).toEqual({ integer: true, min: { value: 0 } });
    expect(options.toolbar.buttons).toEqual(['add', 'payload']);
    await options.toolbar.onAdd({ grid });
    expect(addRow).toHaveBeenCalledWith({ id: null, sku: '', productName: '', stockQuantity: 0 });
    options.toolbar.onPayload({ payload: getSavePayload() });
    expect(log).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenLastCalledWith({ inserted: [{ id: null }] });
    expect(snippets.join('\n')).not.toMatch(/grid\.crud|saveRows/);
});
