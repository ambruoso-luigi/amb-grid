import { describe, expect, test } from 'vitest';
import { LookupDialog } from '../src/ui/lookup-dialog.js';

const createRows = count => Array.from({ length: count }, (_, index) => ({
    title: `Result ${index + 1}`
}));

class DialogElementMock {
    constructor(tagName = 'div') {
        this.tagName = tagName.toUpperCase();
        this.children = [];
        this.dataset = {};
        this.listeners = new Map();
        this.parentNode = null;
        this.style = {};
        this.value = '';
        this.hidden = false;
        this.disabled = false;
        this.removed = false;
        this.textContent = '';
        this._className = '';
        this._innerHTML = '';
        const classes = new Set();

        this.classList = {
            toggle: (className, force) => {
                if (force) {
                    classes.add(className);
                } else {
                    classes.delete(className);
                }

                this.className = [...classes].join(' ');
            },
            contains: className => classes.has(className)
        };
    }

    get className() {
        return this._className;
    }

    set className(value) {
        this._className = String(value || '');
    }

    get innerHTML() {
        return this._innerHTML;
    }

    set innerHTML(value) {
        this._innerHTML = String(value || '');
        this.children = [];
    }

    append(...children) {
        children.forEach(child => this.appendChild(child));
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    addEventListener(type, listener) {
        this.listeners.set(type, listener);
    }

    setAttribute(name, value) {
        this[name] = value;
    }

    querySelectorAll(selector) {
        const matches = [];
        const className = selector.startsWith('.') ? selector.slice(1) : null;

        this.children.forEach(child => {
            if (
                className
                && child.className.split(/\s+/).includes(className)
            ) {
                matches.push(child);
            }

            matches.push(...child.querySelectorAll(selector));
        });

        return matches;
    }

    focus() {}

    remove() {
        this.removed = true;

        if (this.parentNode) {
            this.parentNode.children = this.parentNode.children.filter(child => {
                return child !== this;
            });
        }
    }

    async dispatch(type, event = {}) {
        const listener = this.listeners.get(type);
        const dispatchedEvent = {
            type,
            target: this,
            defaultPrevented: false,
            preventDefault() {
                this.defaultPrevented = true;
            },
            ...event
        };

        if (listener) {
            await listener(dispatchedEvent);
        }

        return dispatchedEvent;
    }
}

const createDialogHarness = () => {
    const originalDocument = globalThis.document;
    const body = new DialogElementMock('body');
    const listeners = new Map();

    globalThis.document = {
        body,
        createElement: tagName => new DialogElementMock(tagName),
        addEventListener: (type, listener) => listeners.set(type, listener),
        removeEventListener: (type, listener) => {
            if (listeners.get(type) === listener) {
                listeners.delete(type);
            }
        }
    };

    return {
        restore() {
            globalThis.document = originalDocument;
        }
    };
};

const openDialog = options => {
    const dialog = new LookupDialog();
    const resultPromise = dialog.open({
        columns: [{ field: 'title' }],
        ...options
    });

    return { dialog, resultPromise };
};

const getRows = dialog => dialog.table.children[1].children;
const getFirstCellText = row => row.children[0].textContent;

describe('LookupDialog smart pagination', () => {
    test('hides default pagination when 50 results fit the default page size', async () => {
        const harness = createDialogHarness();

        try {
            const { dialog, resultPromise } = openDialog({
                data: createRows(50)
            });

            expect(dialog.options.pagination.pageSize).toBe(50);
            expect(getRows(dialog)).toHaveLength(50);
            expect(dialog.paginationElement.hidden).toBe(true);

            dialog.close(null);
            await expect(resultPromise).resolves.toBeNull();
        } finally {
            harness.restore();
        }
    });

    test('shows default pagination for 51 results and navigates to the single-row next page', async () => {
        const harness = createDialogHarness();

        try {
            const { dialog, resultPromise } = openDialog({
                data: createRows(51)
            });

            expect(dialog.paginationElement.hidden).toBe(false);
            expect(getRows(dialog)).toHaveLength(50);

            await dialog.nextPageButton.dispatch('click');

            expect(dialog.currentPage).toBe(2);
            expect(getRows(dialog)).toHaveLength(1);
            expect(getFirstCellText(getRows(dialog)[0])).toBe('Result 51');

            dialog.close(null);
            await expect(resultPromise).resolves.toBeNull();
        } finally {
            harness.restore();
        }
    });

    test.each([
        [20],
        [25]
    ])('hides custom page size 25 pagination when %i results fit one page', async count => {
        const harness = createDialogHarness();

        try {
            const { dialog, resultPromise } = openDialog({
                data: createRows(count),
                pagination: {
                    enabled: true,
                    pageSize: 25
                }
            });

            expect(getRows(dialog)).toHaveLength(count);
            expect(dialog.paginationElement.hidden).toBe(true);

            dialog.close(null);
            await expect(resultPromise).resolves.toBeNull();
        } finally {
            harness.restore();
        }
    });

    test('shows custom page size 25 pagination when 26 results exceed one page', async () => {
        const harness = createDialogHarness();

        try {
            const { dialog, resultPromise } = openDialog({
                data: createRows(26),
                pagination: {
                    enabled: true,
                    pageSize: 25
                }
            });

            expect(getRows(dialog)).toHaveLength(25);
            expect(dialog.paginationElement.hidden).toBe(false);

            dialog.close(null);
            await expect(resultPromise).resolves.toBeNull();
        } finally {
            harness.restore();
        }
    });

    test.each([
        false,
        { enabled: false }
    ])('keeps pagination hidden when configured as %j', async pagination => {
        const harness = createDialogHarness();

        try {
            const { dialog, resultPromise } = openDialog({
                data: createRows(75),
                pagination
            });

            expect(dialog.options.pagination.enabled).toBe(false);
            expect(getRows(dialog)).toHaveLength(75);
            expect(dialog.paginationElement.hidden).toBe(true);

            dialog.close(null);
            await expect(resultPromise).resolves.toBeNull();
        } finally {
            harness.restore();
        }
    });

    test('keeps pagination visible below the threshold when alwaysVisible is true', async () => {
        const harness = createDialogHarness();

        try {
            const { dialog, resultPromise } = openDialog({
                data: createRows(20),
                pagination: {
                    enabled: true,
                    pageSize: 25,
                    alwaysVisible: true
                }
            });

            expect(getRows(dialog)).toHaveLength(20);
            expect(dialog.paginationElement.hidden).toBe(false);
            expect(dialog.paginationSummary.textContent)
                .toBe('Showing 1-20 of 20 results | Page 1 of 1');

            dialog.close(null);
            await expect(resultPromise).resolves.toBeNull();
        } finally {
            harness.restore();
        }
    });

    test('updates pagination visibility and resets to page one while searching', async () => {
        const harness = createDialogHarness();

        try {
            const data = [
                ...Array.from({ length: 26 }, (_, index) => ({
                    title: `Large match ${index + 1}`
                })),
                ...Array.from({ length: 20 }, (_, index) => ({
                    title: `Small match ${index + 1}`
                }))
            ];
            const { dialog, resultPromise } = openDialog({
                data,
                pagination: {
                    enabled: true,
                    pageSize: 25
                }
            });

            expect(dialog.paginationElement.hidden).toBe(false);

            await dialog.nextPageButton.dispatch('click');
            expect(dialog.currentPage).toBe(2);

            dialog.search.value = 'Small';
            await dialog.search.dispatch('input');

            expect(dialog.currentPage).toBe(1);
            expect(dialog.filteredData).toHaveLength(20);
            expect(dialog.paginationElement.hidden).toBe(true);

            dialog.search.value = '';
            await dialog.search.dispatch('input');

            expect(dialog.currentPage).toBe(1);
            expect(dialog.filteredData).toHaveLength(46);
            expect(getRows(dialog)).toHaveLength(25);
            expect(dialog.paginationElement.hidden).toBe(false);

            dialog.close(null);
            await expect(resultPromise).resolves.toBeNull();
        } finally {
            harness.restore();
        }
    });

    test('searches the complete dataset after navigating away from page one', async () => {
        const harness = createDialogHarness();

        try {
            const data = [
                ...createRows(25),
                { title: 'Needle outside current page' },
                ...createRows(24).map((row, index) => ({
                    title: `Tail result ${index + 1}`
                }))
            ];
            const { dialog, resultPromise } = openDialog({
                data,
                pagination: {
                    enabled: true,
                    pageSize: 25
                }
            });

            await dialog.nextPageButton.dispatch('click');
            expect(dialog.currentPage).toBe(2);

            dialog.search.value = 'Needle';
            await dialog.search.dispatch('input');

            expect(dialog.currentPage).toBe(1);
            expect(dialog.filteredData).toEqual([
                { title: 'Needle outside current page' }
            ]);
            expect(getRows(dialog)).toHaveLength(1);
            expect(getFirstCellText(getRows(dialog)[0]))
                .toBe('Needle outside current page');

            dialog.close(null);
            await expect(resultPromise).resolves.toBeNull();
        } finally {
            harness.restore();
        }
    });
});
