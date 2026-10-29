import { afterEach, describe, expect, test, vi } from 'vitest';
import { createDemoActionTutorial } from '../src/demo/components/demo-action-tutorial.js';

class ElementMock extends EventTarget {
    constructor(tagName) {
        super();
        this.tagName = tagName;
        this.children = [];
        this.attributes = new Map();
        this.textContent = '';
        this.hidden = false;
    }
    append(...children) {
        children.forEach(child => { child.parentNode = this; this.children.push(child); });
    }
    setAttribute(key, value) { this.attributes.set(key, value); }
    getAttribute(key) { return this.attributes.get(key); }
    remove() { this.parentNode.children = this.parentNode.children.filter(child => child !== this); }
    click() { this.dispatchEvent(new Event('click')); }
}

const find = (element, predicate) => predicate(element) ? element : element.children.map(child => find(child, predicate)).find(Boolean);
const controllers = [];
const mount = () => {
    const windowMock = new EventTarget();
    const removeListener = vi.spyOn(windowMock, 'removeEventListener');
    vi.stubGlobal('window', windowMock);
    vi.stubGlobal('document', { createElement: tag => new ElementMock(tag), documentElement: { lang: 'it' }, activeElement: null });
    const host = new ElementMock('div');
    const steps = ['prepare-states', 'open-report', 'commit-restricted', 'backend-rejected', 'save-corrected'].map((id, index) => ({
        id,
        actionId: index < 3 ? id : 'save',
        instructionKey: `examples.crudRowStates.${['tutorialPrepare', 'tutorialReport', 'tutorialRestricted', 'tutorialReject', 'tutorialCorrect'][index]}`,
        isComplete: vi.fn(payload => payload.succeeded === true)
    }));
    const controller = createDemoActionTutorial({ host, steps, locale: 'en', titleKey: 'examples.crudRowStates.tutorialTitle' });
    controllers.push(controller);
    const root = host.children[0];
    const button = action => find(root, element => element.getAttribute('data-tutorial-action') === action);
    return { host, root, controller, steps, button, windowMock, removeListener };
};

afterEach(() => {
    controllers.splice(0).forEach(controller => controller.destroy());
    vi.unstubAllGlobals();
});

describe('demo action tutorial controller', () => {
    test('starts at step one with an accessible instruction and five progress indicators', () => {
        const { root } = mount();
        expect(root.getAttribute('data-tutorial-step')).toBe('prepare-states');
        expect(find(root, element => element.className === 'demo-action-tutorial__counter').textContent).toBe('1 of 5');
        expect(find(root, element => element.getAttribute('aria-live') === 'polite').textContent).toContain('Prepare states');
        const progress = find(root, element => element.tagName === 'ol');
        expect(progress.getAttribute('aria-label')).toBe('Tutorial progress');
        expect(progress.children).toHaveLength(5);
        expect(progress.children[0].getAttribute('aria-current')).toBe('step');
        expect(document.activeElement).toBeNull();
    });

    test('ignores unrelated, unsuccessful and missing-context notifications without caching them', () => {
        const { controller, root, steps } = mount();
        const context = controller.capture();
        expect(controller.notify('open-report', { succeeded: true }, context)).toBe(false);
        expect(steps[0].isComplete).not.toHaveBeenCalled();
        expect(controller.notify('prepare-states', { succeeded: false }, context)).toBe(false);
        expect(controller.notify('prepare-states', { succeeded: true })).toBe(false);
        expect(root.getAttribute('data-tutorial-step')).toBe('prepare-states');
        expect(controller.notify('prepare-states', { succeeded: true }, context)).toBe(true);
        expect(root.getAttribute('data-tutorial-step')).toBe('open-report');
    });

    test('advances once per verified operation, including consecutive save steps, then allows restart', () => {
        const { controller, root, steps, button } = mount();
        for (const step of steps) {
            const context = controller.capture();
            expect(controller.notify(step.actionId, { succeeded: true }, context)).toBe(true);
            expect(controller.notify(step.actionId, { succeeded: true }, context)).toBe(false);
        }
        expect(root.getAttribute('data-tutorial-step')).toBe('complete');
        expect(find(root, element => element.getAttribute('aria-live') === 'polite').textContent).toContain('Tutorial complete.');
        button('restart').click();
        expect(root.getAttribute('data-tutorial-step')).toBe('prepare-states');
    });

    test('skip and reopen preserve progress while invalidating in-flight work', () => {
        const { controller, root, button } = mount();
        controller.notify('prepare-states', { succeeded: true }, controller.capture());
        const pending = controller.capture();
        button('skip').click();
        const hiddenOperation = controller.capture();
        expect(root.children[0].hidden).toBe(true);
        expect(controller.notify('open-report', { succeeded: true }, pending)).toBe(false);
        expect(controller.notify('open-report', { succeeded: true }, hiddenOperation)).toBe(false);
        button('reopen').click();
        expect(root.children[0].hidden).toBe(false);
        expect(root.getAttribute('data-tutorial-step')).toBe('open-report');
        expect(controller.notify('open-report', { succeeded: true }, pending)).toBe(false);
        expect(controller.notify('open-report', { succeeded: true }, controller.capture())).toBe(true);
    });

    test('restart rejects a stale completion even when the step ID matches again', () => {
        const { controller, root } = mount();
        const pending = controller.capture();
        controller.restart();
        expect(controller.notify('prepare-states', { succeeded: true }, pending)).toBe(false);
        expect(root.getAttribute('data-tutorial-step')).toBe('prepare-states');
    });

    test('requires a verified boolean result rather than an unresolved asynchronous condition', () => {
        const { controller, steps, root } = mount();
        steps[0].isComplete.mockReturnValue(Promise.resolve(true));
        expect(controller.notify('prepare-states', {}, controller.capture())).toBe(false);
        expect(root.getAttribute('data-tutorial-step')).toBe('prepare-states');
    });

    test('updates language through the existing event without resetting or moving focus', () => {
        const { controller, root, windowMock } = mount();
        controller.notify('prepare-states', { succeeded: true }, controller.capture());
        const event = new Event('amb-demo-language-change');
        event.detail = { language: 'it' };
        windowMock.dispatchEvent(event);
        expect(root.getAttribute('data-tutorial-step')).toBe('open-report');
        expect(find(root, element => element.className === 'demo-action-tutorial__counter').textContent).toBe('2 di 5');
        expect(find(root, element => element.getAttribute('aria-live') === 'polite').textContent).toContain('Apri "Report"');
        expect(document.activeElement).toBeNull();
    });

    test('destroys its DOM and listeners idempotently and ignores late operations', () => {
        const { controller, host, button, removeListener } = mount();
        const skipButton = button('skip');
        const context = controller.capture();
        controller.destroy();
        controller.destroy();
        skipButton.click();
        controller.reopen();
        controller.restart();
        expect(controller.notify('prepare-states', { succeeded: true }, context)).toBe(false);
        expect(host.children).toHaveLength(0);
        expect(removeListener).toHaveBeenCalledTimes(1);
        expect(removeListener.mock.calls[0][0]).toBe('amb-demo-language-change');
    });
});
