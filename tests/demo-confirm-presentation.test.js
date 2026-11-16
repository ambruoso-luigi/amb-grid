import { afterEach, expect, test, vi } from 'vitest';
import { decorateDangerRowDialog, decoratePartialSaveDialog } from '../src/demo/components/demo-confirm-presentation.js';

class Element {
    constructor() {
        this.children = [];
        this.className = '';
        this.classList = {
            add: (...names) => { this.className = [...new Set([...this.className.split(' ').filter(Boolean), ...names])].join(' '); },
            contains: name => this.className.split(' ').includes(name)
        };
    }
    append(...children) { this.children.push(...children); }
    prepend(child) { this.children.unshift(child); }
    replaceChildren(...children) { this.children = children; }
    setAttribute() {}
    insertAdjacentHTML(_position, html) { this.innerHTML = (this.innerHTML || '') + html; }
    querySelector(selector) { return this.children.find(child => child.className?.split(' ').includes(selector.slice(1))) || null; }
}

const createDialog = () => ({
    element: new Element(), panelElement: new Element(), titleElement: new Element(),
    messageElement: new Element(), confirmButton: new Element()
});

afterEach(() => vi.unstubAllGlobals());

test('partial-save presentation reuses its header and renders supplied details', () => {
    vi.stubGlobal('document', { createElement: () => new Element() });
    const dialog = createDialog();
    const render = detailsLines => decoratePartialSaveDialog(dialog, {
        intro: 'Intro', detailsHeading: 'Excluded', detailsLines, explanation: 'Pending'
    });
    render(['Row 1 — missing value']);
    render(['Row 2 — invalid value']);
    expect(dialog.panelElement.children).toHaveLength(1);
    expect(dialog.element.classList.contains('demo-crud-partial-save-dialog')).toBe(true);
    expect(dialog.messageElement.children[1].children[1].textContent).toBe('Row 2 — invalid value');
    expect(dialog.messageElement.children[2].textContent).toBe('Pending');
});

test('danger presentation reuses the CRUD header and destructive variant', () => {
    vi.stubGlobal('document', { createElement: () => new Element() });
    const dialog = createDialog();
    decorateDangerRowDialog(dialog);
    decorateDangerRowDialog(dialog);
    expect(dialog.panelElement.children).toHaveLength(1);
    expect(dialog.element.classList.contains('demo-crud-row-confirm-dialog--delete')).toBe(true);
    expect(dialog.panelElement.children[0].children[1]).toBe(dialog.titleElement);
});
