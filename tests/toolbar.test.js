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
import { LookupDialog } from '../src/ui/lookup-dialog.js';

class ElementMock {
    constructor(tagName = 'div') {
        this.tagName = tagName;
        this.children = [];
        this.dataset = {};
        this.listeners = new Map();
        this.parentNode = null;
        this.disabled = false;
        this.removed = false;
        this.style = {};
        const classValues = new Set();

        this.classList = {
            toggle: (value, force) => {
                if (force) {
                    classValues.add(value);
                } else {
                    classValues.delete(value);
                }
            },
            contains: value => classValues.has(value)
        };
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

    removeAttribute(name) {
        delete this[name];
    }

    querySelector() {
        return null;
    }

    querySelectorAll() {
        return [];
    }

    focus() {}

    async dispatch(type) {
        const listener = this.listeners.get(type);

        if (listener) {
            await listener({
                type,
                target: this,
                preventDefault: vi.fn(),
                stopPropagation: vi.fn()
            });
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
                .toEqual(['add', 'reload', 'save']);
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
                .toEqual(['add', 'reload', 'save']);
            expect(group.children[0].title).toBe('Add row');
            expect(group.children[0]['aria-label']).toBe('Add row');
            expect(group.children[0].children[1].textContent).toBe('Row');
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

    test('keeps async action buttons focusable while guarding duplicate clicks with busy state', async () => {
        let resolveAdd;
        const onAdd = vi.fn(() => new Promise(resolve => {
            resolveAdd = resolve;
        }));
        const harness = createHarness({
            buttons: ['add'],
            onAdd
        });

        try {
            const [addButton] = harness.controller.element.children[0].children;
            const firstClick = addButton.dispatch('click');

            await Promise.resolve();

            expect(addButton.disabled).toBe(false);
            expect(addButton.dataset.busy).toBe('true');
            expect(addButton['aria-busy']).toBe('true');
            expect(addButton['aria-disabled']).toBe('true');

            await addButton.dispatch('click');

            expect(onAdd).toHaveBeenCalledTimes(1);

            resolveAdd();
            await firstClick;

            expect(addButton.disabled).toBe(false);
            expect(addButton.dataset.busy).toBeUndefined();
            expect(addButton['aria-busy']).toBeUndefined();
            expect(addButton['aria-disabled']).toBeUndefined();
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
                selectedFields: ['title'],
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

    test('normalizes selected fields and updates filter count and active state', async () => {
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
                columns: [
                    { field: 'title', title: 'Title' },
                    { field: 'tag', title: 'Tag' }
                ],
                table,
                floatingMessage,
                mountElement: harness.controller.searchMount
            });
            const searchToolbar = harness.controller.searchMount.children[0];
            const filtersButton = searchToolbar.children[1];
            const filtersCount = filtersButton.children[1];

            expect(searchController.getSearchState().selectedFields)
                .toEqual(['title', 'tag']);
            expect(filtersCount.hidden).toBe(true);
            expect(filtersButton.classList.contains(
                'amb-toolbar__filters-button--active'
            )).toBe(false);

            await filtersButton.dispatch('mouseover');
            expect(floatingMessage.scheduleShow).toHaveBeenLastCalledWith(
                filtersButton,
                expect.objectContaining({
                    message: 'Searching all columns'
                })
            );

            searchController.setSearchFields(['title']);

            expect(filtersCount.hidden).toBe(false);
            expect(filtersCount.textContent).toBe('1');
            expect(filtersButton.classList.contains(
                'amb-toolbar__filters-button--active'
            )).toBe(true);

            await filtersButton.dispatch('mouseover');
            expect(floatingMessage.scheduleShow).toHaveBeenLastCalledWith(
                filtersButton,
                expect.objectContaining({
                    message: 'Searching only in:\n- Title'
                })
            );

            searchController.setSearchFields([]);
            expect(searchController.getSearchState().selectedFields)
                .toEqual(['title', 'tag']);

            searchController.setSearchOptions({ caseSensitive: true });
            expect(filtersCount.hidden).toBe(true);
            expect(filtersButton.classList.contains(
                'amb-toolbar__filters-button--active'
            )).toBe(true);

            searchController.setSearchOptions({
                caseSensitive: false,
                wholeWord: true
            });
            expect(filtersButton.classList.contains(
                'amb-toolbar__filters-button--active'
            )).toBe(true);

            searchController.destroy();
        } finally {
            harness.controller.destroy();
            harness.restore();
        }
    });

    test('can disable search filter status hover without disabling the filters dialog', async () => {
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
                showFilterStatus: false,
                mountElement: harness.controller.searchMount
            });
            const searchToolbar = harness.controller.searchMount.children[0];
            const filtersButton = searchToolbar.children[1];

            expect(filtersButton.listeners.has('mouseover')).toBe(false);
            expect(filtersButton.listeners.has('mouseout')).toBe(false);

            await filtersButton.dispatch('mouseover');
            expect(floatingMessage.scheduleShow).not.toHaveBeenCalled();

            const dialogSpy = vi
                .spyOn(SearchFiltersDialog.prototype, 'open')
                .mockResolvedValue({ applied: false });

            await filtersButton.dispatch('click');
            expect(dialogSpy).toHaveBeenCalledOnce();

            dialogSpy.mockRestore();
            searchController.destroy();
        } finally {
            harness.controller.destroy();
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

    test('integrates the official feedback region with the table controller', () => {
        const tableFactorySource = fs.readFileSync(
            new URL('../src/lib/table/table-factory.js', import.meta.url),
            'utf8'
        );
        const libraryCss = fs.readFileSync(
            new URL('../src/amb-grid.css', import.meta.url),
            'utf8'
        );

        expect(tableFactorySource)
            .toContain("import { FeedbackRegion }");
        expect(tableFactorySource).toContain('feedback,');
        expect(tableFactorySource).toContain('feedback.destroy()');
        expect(libraryCss).toContain("@import './ui/feedback-region.css'");
    });

    test('uses a multi-action toolbar in the Basic CRUD demo', () => {
        const demoSource = fs.readFileSync(
            new URL('../src/demo/basic-crud.js', import.meta.url),
            'utf8'
        );

        expect(demoSource).toContain("buttons: [");
        expect(demoSource).toContain("'add'");
        expect(demoSource).toContain("'reload'");
        expect(demoSource).toContain("'save'");
        expect(demoSource).toContain("'payload'");
        expect(demoSource).toContain("search: {");
        expect(demoSource).toContain("filters: {");
        expect(demoSource).toContain("id: 'report'");
        expect(demoSource).toContain("id: 'selected'");
        expect(demoSource).toContain("onReload: handleReload");
        expect(demoSource).toContain("message: 'Data reloaded.'");
        expect(demoSource).toContain(
            "message: 'Changes saved successfully.'"
        );
        expect(demoSource).not.toContain('id="action-add-row"');
        expect(demoSource).not.toContain('id="action-show-report"');
        expect(demoSource).not.toContain('id="action-show-selected"');
    });

    test('documents the extended filters dialog controls in its source', () => {
        const dialogSource = fs.readFileSync(
            new URL('../src/ui/search-filters-dialog.js', import.meta.url),
            'utf8'
        );

        expect(dialogSource).toContain(
            "searchInText: 'Search only in these columns:'"
        );
        expect(dialogSource).toContain("caseSensitiveText: 'Case sensitive'");
        expect(dialogSource).toContain("wholeWordText: 'Whole word'");
        expect(dialogSource).not.toContain('Clear All');
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

            expect(dialog.options.searchInText)
                .toBe('Search only in these columns:');
            expect(dialog.checkboxes.map(input => input.checked))
                .toEqual([true, false]);

            dialog.caseSensitiveInput.checked = true;
            dialog.wholeWordInput.checked = true;

            const panel = body.children[0].children[0];
            const footer = panel.children[3];
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

    test('filters dialog starts with all columns and prevents deselecting the last one', async () => {
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
                    { field: 'title', title: 'Title' },
                    { field: 'tag', title: 'Tag' }
                ]
            });

            expect(dialog.checkboxes.map(input => input.checked))
                .toEqual([true, true]);

            dialog.checkboxes[0].checked = false;
            await dialog.checkboxes[0].dispatch('change');
            expect(dialog.checkboxes.map(input => input.checked))
                .toEqual([false, true]);

            dialog.checkboxes[1].checked = false;
            await dialog.checkboxes[1].dispatch('change');
            expect(dialog.checkboxes.map(input => input.checked))
                .toEqual([false, true]);
            expect(dialog.feedback.element.hidden).toBe(false);
            expect(dialog.feedback.messageElement.textContent)
                .toBe('Select at least one column.');
            expect(dialog.feedback.element.role).toBe('alert');
            expect(dialog.feedback.element['aria-live']).toBe('assertive');

            const panel = body.children[0].children[0];
            const feedbackElement = panel.children[1];
            const bodyElement = panel.children[2];
            const bulkActions = bodyElement.children[0];
            const searchInLabel = bodyElement.children[1];
            const list = bodyElement.children[2];
            const footer = panel.children[3];
            const applyButton = footer.children[1];

            expect(feedbackElement.className).toContain('amb-dialog-feedback');
            expect(bulkActions.children).toHaveLength(1);
            expect(searchInLabel.textContent)
                .toBe('Search only in these columns:');
            expect(bodyElement.children.indexOf(list))
                .toBe(bodyElement.children.indexOf(searchInLabel) + 1);

            dialog.checkboxes.forEach(input => {
                input.checked = false;
            });
            await applyButton.dispatch('click');
            expect(dialog.overlay).not.toBeNull();
            expect(dialog.feedback.messageElement.textContent)
                .toBe('Select at least one column.');

            dialog.checkboxes[1].checked = true;
            await applyButton.dispatch('click');
            await expect(resultPromise).resolves.toEqual({
                applied: true,
                selectedFields: ['tag'],
                caseSensitive: false,
                wholeWord: false
            });
        } finally {
            globalThis.document = originalDocument;
        }
    });

    test('lookup dialog includes feedback and reports no results without selecting a row', async () => {
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
            const dialog = new LookupDialog();
            const resultPromise = dialog.open({
                columns: [{ field: 'title', title: 'Title' }],
                data: []
            });
            const panel = body.children[0].children[0];

            expect(panel.children[1].className)
                .toContain('amb-dialog-feedback');
            expect(dialog.feedback.messageElement.textContent)
                .toBe('No results');
            expect(dialog.feedback.element.role).toBe('status');
            expect(dialog.selectedIndex).toBe(-1);

            dialog.close(null);
            await expect(resultPromise).resolves.toBeNull();
        } finally {
            globalThis.document = originalDocument;
        }
    });

    test('lookup dialog does not select the first available row automatically', async () => {
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
            const dialog = new LookupDialog();
            const resultPromise = dialog.open({
                columns: [{ field: 'title', title: 'Title' }],
                data: [{ title: 'First' }, { title: 'Second' }]
            });

            expect(dialog.selectedIndex).toBe(-1);
            expect(dialog.selectButton.disabled).toBe(true);

            dialog.moveSelection(1);
            expect(dialog.selectedIndex).toBe(0);

            dialog.close(null);
            await expect(resultPromise).resolves.toBeNull();
        } finally {
            globalThis.document = originalDocument;
        }
    });
});
