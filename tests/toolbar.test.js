import fs from 'node:fs';
import { describe, expect, test, vi } from 'vitest';
import {
    createToolbar,
    normalizeToolbarOptions
} from '../src/ui/toolbar.js';
import {
    createSearchController,
    matchesSearchValue
} from '../src/lib/table/search-controller.js';
import { SearchFiltersDialog } from '../src/ui/search-filters-dialog.js';

class ElementMock {
    constructor(tagName = 'div') {
        this.tagName = tagName;
        this.children = [];
        this.dataset = {};
        this.listeners = new Map();
        this.parentNode = null;
        this.disabled = false;
        this.removed = false;
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

    removeEventListener(type, listener) {
        if (this.listeners.get(type) === listener) {
            this.listeners.delete(type);
        }
    }

    setAttribute(name, value) {
        this[name] = value;
    }

    querySelector() {
        return null;
    }

    focus() {}

    async dispatch(type) {
        const listener = this.listeners.get(type);

        if (listener) {
            await listener({ type, target: this });
        }
    }

    remove() {
        this.removed = true;

        if (this.parentNode) {
            this.parentNode.children = this.parentNode.children.filter(child => child !== this);
        }
    }
}

const createHarness = toolbar => {
    const originalDocument = globalThis.document;
    const parent = new ElementMock();
    const tableElement = new ElementMock();
    const grid = {
        crud: {
            getSavePayload: vi.fn(() => ({
                canSave: true,
                changes: {
                    inserted: [{ id: null, title: 'New' }],
                    updated: [],
                    deleted: []
                }
            }))
        }
    };

    parent.appendChild(tableElement);
    parent.insertBefore = (element, reference) => {
        const index = parent.children.indexOf(reference);

        element.parentNode = parent;
        parent.children.splice(index, 0, element);
    };

    globalThis.document = {
        createElement: tagName => new ElementMock(tagName),
        querySelector: selector => selector === '#table' ? tableElement : null
    };

    const controller = createToolbar({
        selector: '#table',
        toolbar,
        getGrid: () => grid
    });

    return {
        controller,
        grid,
        parent,
        restore() {
            globalThis.document = originalDocument;
        }
    };
};

describe('AMB toolbar', () => {
    test('renders by default and supports explicit opt-out', () => {
        expect(normalizeToolbarOptions(false).enabled).toBe(false);
        expect(normalizeToolbarOptions({ enabled: false }).enabled).toBe(false);
        expect(normalizeToolbarOptions(undefined).enabled).toBe(true);

        const defaultHarness = createHarness(undefined);

        try {
            const buttons = defaultHarness.controller.actions.children;

            expect(buttons.map(button => button.dataset.action))
                .toEqual(['add', 'save']);
            expect(buttons.every(button => button.disabled)).toBe(true);
        } finally {
            defaultHarness.controller.destroy();
            defaultHarness.restore();
        }

        const harness = createHarness(false);

        try {
            expect(harness.controller).toBeNull();
            expect(harness.parent.children).toHaveLength(1);
        } finally {
            harness.restore();
        }
    });

    test('renders configured buttons and invokes backend-agnostic callbacks', async () => {
        const onSave = vi.fn();
        const onReload = vi.fn();
        const harness = createHarness({
            buttons: ['save', 'reload'],
            onSave,
            onReload
        });

        try {
            const group = harness.controller.element.children[0];
            const [saveButton, reloadButton] = group.children;

            expect(harness.parent.children[0]).toBe(harness.controller.element);
            expect(saveButton.disabled).toBe(false);
            expect(reloadButton.disabled).toBe(false);
            expect(saveButton.title).toBe('Save changes');

            await saveButton.dispatch('click');
            await reloadButton.dispatch('click');

            expect(harness.grid.crud.getSavePayload).toHaveBeenCalledTimes(1);
            expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
                grid: harness.grid,
                payload: expect.objectContaining({
                    changes: expect.objectContaining({
                        inserted: [{ id: null, title: 'New' }]
                    })
                })
            }));
            expect(onReload).toHaveBeenCalledWith(expect.objectContaining({
                grid: harness.grid
            }));

            harness.controller.destroy();

            expect(saveButton.listeners.size).toBe(0);
            expect(reloadButton.listeners.size).toBe(0);
            expect(harness.controller.element.removed).toBe(true);
        } finally {
            harness.restore();
        }
    });

    test('disables missing callbacks and removes listeners and markup on destroy', () => {
        const harness = createHarness(true);

        try {
            const group = harness.controller.element.children[0];

            expect(group.children.map(button => button.dataset.action))
                .toEqual(['add', 'save']);
            expect(group.children[0].title).toBe('Add row');
            expect(group.children[0]['aria-label']).toBe('Add row');
            expect(group.children.every(button => button.disabled)).toBe(true);

            harness.controller.destroy();

            expect(harness.controller.element.removed).toBe(true);
            expect(harness.parent.children).toHaveLength(1);
        } finally {
            harness.restore();
        }
    });

    test('invokes add, validate, payload, and simple custom button callbacks', async () => {
        const onAdd = vi.fn();
        const onValidate = vi.fn();
        const onPayload = vi.fn();
        const onCustom = vi.fn();
        const harness = createHarness({
            buttons: [
                'add',
                'validate',
                'payload',
                {
                    id: 'selected',
                    label: 'Show selected',
                    onClick: onCustom
                }
            ],
            onAdd,
            onValidate,
            onPayload
        });

        try {
            const [addButton, validateButton, payloadButton, customButton] =
                harness.controller.element.children[0].children;

            await addButton.dispatch('click');
            await validateButton.dispatch('click');
            await payloadButton.dispatch('click');
            await customButton.dispatch('click');

            expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
                grid: harness.grid
            }));
            expect(onValidate).toHaveBeenCalledWith(expect.objectContaining({
                grid: harness.grid
            }));
            expect(onPayload).toHaveBeenCalledWith(expect.objectContaining({
                grid: harness.grid,
                payload: expect.objectContaining({
                    canSave: true
                })
            }));
            expect(onCustom).toHaveBeenCalledWith(expect.objectContaining({
                grid: harness.grid
            }));
        } finally {
            harness.controller.destroy();
            harness.restore();
        }
    });

    test('can be destroyed and initialized again without duplicate markup', () => {
        const harness = createHarness({
            buttons: ['add'],
            onAdd: vi.fn()
        });

        try {
            harness.controller.destroy();
            expect(harness.parent.children).toHaveLength(1);

            const secondController = createToolbar({
                selector: '#table',
                toolbar: {
                    buttons: ['add'],
                    onAdd: vi.fn()
                },
                getGrid: () => harness.grid
            });

            expect(harness.parent.children).toHaveLength(2);
            expect(harness.parent.children.filter(element => {
                return String(element.className || '').includes('amb-toolbar');
            })).toHaveLength(1);

            secondController.destroy();
        } finally {
            harness.restore();
        }
    });

    test('mounts search and filters inside the toolbar without creating a second bar', () => {
        const harness = createHarness({
            buttons: ['add'],
            onAdd: vi.fn()
        });
        const table = {
            addFilter: vi.fn(),
            removeFilter: vi.fn()
        };
        const floatingMessage = {
            scheduleShow: vi.fn(),
            hide: vi.fn()
        };

        try {
            const searchController = createSearchController({
                selector: '#table',
                search: {
                    enabled: true,
                    filters: { enabled: true }
                },
                columns: [{ field: 'title', title: 'Title' }],
                table,
                floatingMessage,
                mountElement: harness.controller.searchMount
            });

            expect(harness.controller.searchMount.children).toHaveLength(1);
            expect(harness.controller.searchMount.children[0].className)
                .toContain('amb-search-toolbar--integrated');
            const integratedSearch = harness.controller.searchMount.children[0];
            const filtersButton = integratedSearch.children[1];

            expect(filtersButton.title).toBe('Filters');
            expect(filtersButton['aria-label']).toBe('Filters');
            expect(filtersButton.children).toHaveLength(2);
            expect(harness.parent.children.filter(element => {
                return element.className === 'amb-search-toolbar';
            })).toHaveLength(0);

            searchController.destroy();

            expect(harness.controller.searchMount.children).toHaveLength(0);
        } finally {
            harness.controller.destroy();
            harness.restore();
        }
    });

    test('keeps the standalone search toolbar when the CRUD toolbar is absent', () => {
        const harness = createHarness(false);
        const table = {
            addFilter: vi.fn(),
            removeFilter: vi.fn()
        };
        const floatingMessage = {
            scheduleShow: vi.fn(),
            hide: vi.fn()
        };

        try {
            const searchController = createSearchController({
                selector: '#table',
                search: { enabled: true },
                columns: [{ field: 'title', title: 'Title' }],
                table,
                floatingMessage
            });

            expect(harness.parent.children[0].className).toBe('amb-search-toolbar');
            expect(harness.parent.children[1].tagName).toBe('div');

            searchController.destroy();
            expect(harness.parent.children).toHaveLength(1);
        } finally {
            harness.restore();
        }
    });

    test('supports case-sensitive, whole-word, and escaped special-character matching', () => {
        expect(matchesSearchValue('Atlas', 'atlas')).toBe(true);
        expect(matchesSearchValue('Atlas', 'atlas', {
            caseSensitive: true
        })).toBe(false);
        expect(matchesSearchValue('Article', 'art')).toBe(true);
        expect(matchesSearchValue('Article', 'art', {
            wholeWord: true
        })).toBe(false);
        expect(matchesSearchValue('red apple', 'red', {
            wholeWord: true
        })).toBe(true);
        expect(matchesSearchValue('Use C++ today', 'C++', {
            caseSensitive: true,
            wholeWord: true
        })).toBe(true);
    });

    test('returns and applies extended search state', () => {
        const harness = createHarness(false);
        const table = {
            addFilter: vi.fn(),
            removeFilter: vi.fn()
        };
        const floatingMessage = {
            scheduleShow: vi.fn(),
            hide: vi.fn()
        };

        try {
            const searchController = createSearchController({
                selector: '#table',
                search: { enabled: true },
                columns: [{ field: 'title', title: 'Title' }],
                table,
                floatingMessage
            });

            searchController.setSearchQuery('atlas');
            searchController.setSearchOptions({
                caseSensitive: true,
                wholeWord: true
            });

            expect(searchController.getSearchState()).toEqual({
                query: 'atlas',
                selectedFields: [],
                caseSensitive: true,
                wholeWord: true
            });

            const filter = table.addFilter.mock.calls.at(-1)[0];

            expect(filter({ title: 'atlas project' })).toBe(true);
            expect(filter({ title: 'Atlas project' })).toBe(false);
            expect(filter({ title: 'atlases' })).toBe(false);

            searchController.destroy();
        } finally {
            harness.restore();
        }
    });

    test('keeps library and demo CSS imports separate', () => {
        const demoMain = fs.readFileSync(
            new URL('../src/demo/main.js', import.meta.url),
            'utf8'
        );
        const compatibilityCss = fs.readFileSync(
            new URL('../src/style.css', import.meta.url),
            'utf8'
        );

        expect(demoMain).toContain("import '../amb-grid.css'");
        expect(demoMain).toContain("import './demo.css'");
        expect(demoMain).not.toContain("import '../style.css'");
        expect(compatibilityCss).toBe(
            "@import './amb-grid.css';\n@import './demo/demo.css';\n"
        );
    });

    test('uses a multi-action toolbar in the Basic CRUD demo', () => {
        const demoSource = fs.readFileSync(
            new URL('../src/demo/basic-crud.js', import.meta.url),
            'utf8'
        );

        expect(demoSource).toContain("buttons: [");
        expect(demoSource).toContain("'add'");
        expect(demoSource).toContain("'save'");
        expect(demoSource).toContain("'payload'");
        expect(demoSource).toContain("search: {");
        expect(demoSource).toContain("filters: {");
        expect(demoSource).toContain("id: 'report'");
        expect(demoSource).toContain("id: 'selected'");
        expect(demoSource).not.toContain('id="action-add-row"');
        expect(demoSource).not.toContain('id="action-show-report"');
        expect(demoSource).not.toContain('id="action-show-selected"');
    });

    test('documents the extended filters dialog controls in its source', () => {
        const dialogSource = fs.readFileSync(
            new URL('../src/ui/search-filters-dialog.js', import.meta.url),
            'utf8'
        );

        expect(dialogSource).toContain("searchInText: 'Search in:'");
        expect(dialogSource).toContain("caseSensitiveText: 'Case sensitive'");
        expect(dialogSource).toContain("wholeWordText: 'Whole word'");
        expect(dialogSource).toContain('caseSensitive: caseSensitiveInput.checked');
        expect(dialogSource).toContain('wholeWord: wholeWordInput.checked');
    });

    test('filters dialog returns selected fields and matching options', async () => {
        const originalDocument = globalThis.document;
        const body = new ElementMock('body');
        const documentListeners = new Map();

        globalThis.document = {
            body,
            createElement: tagName => new ElementMock(tagName),
            addEventListener: (type, listener) => documentListeners.set(type, listener),
            removeEventListener: (type, listener) => {
                if (documentListeners.get(type) === listener) {
                    documentListeners.delete(type);
                }
            }
        };

        try {
            const dialog = new SearchFiltersDialog();
            const resultPromise = dialog.open({
                columns: [
                    { field: 'name', title: 'Name', selected: true },
                    { field: 'code', title: 'Code', selected: false }
                ]
            });

            expect(dialog.options.searchInText).toBe('Search in:');

            dialog.caseSensitiveInput.checked = true;
            dialog.wholeWordInput.checked = true;

            const panel = body.children[0].children[0];
            const footer = panel.children[2];
            const applyButton = footer.children[1];

            await applyButton.dispatch('click');

            await expect(resultPromise).resolves.toEqual({
                applied: true,
                selectedFields: ['name'],
                caseSensitive: true,
                wholeWord: true
            });
            expect(documentListeners.size).toBe(0);
        } finally {
            globalThis.document = originalDocument;
        }
    });
});
