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
    focus() { document.activeElement = this; }
}

const find = (element, predicate) => predicate(element) ? element : element.children.map(child => find(child, predicate)).find(Boolean);
const controllers = [];
const mount = (customSteps, options = {}) => {
    const windowMock = new EventTarget();
    const removeListener = vi.spyOn(windowMock, 'removeEventListener');
    vi.stubGlobal('window', windowMock);
    vi.stubGlobal('document', { createElement: tag => new ElementMock(tag), documentElement: { lang: 'it' }, activeElement: null });
    const host = new ElementMock('div');
    const steps = customSteps ?? ['prepare-states', 'open-report', 'commit-restricted', 'backend-rejected', 'save-corrected'].map((id, index) => ({
        id,
        actionId: index < 3 ? id : 'save',
        instructionKey: `examples.crudRowStates.${['tutorialPrepare', 'tutorialReport', 'tutorialRestricted', 'tutorialReject', 'tutorialCorrect'][index]}`,
        isComplete: vi.fn(payload => payload.succeeded === true)
    }));
    const controller = createDemoActionTutorial({ host, steps, locale: 'en', titleKey: 'examples.crudRowStates.tutorialTitle', ...options });
    controllers.push(controller);
    const root = host.children[0];
    const button = action => find(root, element => element.getAttribute('data-tutorial-action') === action);
    return { host, root, controller, steps, button, windowMock, removeListener };
};

afterEach(() => {
    controllers.splice(0).forEach(controller => controller.destroy());
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('demo action tutorial controller', () => {
    test('awaits an optional application restart and invalidates old work without moving focus', async () => {
        vi.useFakeTimers();
        let finish;
        const onRestart = vi.fn(() => new Promise(resolve => { finish = resolve; }));
        const onStateChange = vi.fn();
        const { controller, root, button } = mount(undefined, { onRestart, onStateChange });
        controller.notify('prepare-states', { succeeded: true }, controller.capture());
        const oldContext = controller.capture();
        button('restart').focus();
        const restarted = controller.restart();
        expect(onRestart).toHaveBeenCalledTimes(1);
        expect(controller.capture()).toBeNull();
        expect(root.getAttribute('aria-busy')).toBe('true');
        expect(button('restart').getAttribute('aria-disabled')).toBe('true');
        controller.restart();
        expect(onRestart).toHaveBeenCalledTimes(1);
        controller.skip();
        controller.reopen();
        controller.setLocale('it');
        expect(controller.notify('open-report', { succeeded: true }, oldContext)).toBe(false);
        const focusDuringReset = document.activeElement;
        finish(true);
        expect(await restarted).toBe(true);
        expect(controller.capture().stepId).toBe('prepare-states');
        expect(root.getAttribute('aria-busy')).toBe('false');
        expect(document.activeElement).toBe(focusDuringReset);
        expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ stepId: 'prepare-states', resetting: false, hidden: false }));
    });

    test('keeps a failed restart blocked until retried and ignores a reset completing after destroy', async () => {
        let finish;
        const onRestart = vi.fn().mockRejectedValueOnce(new Error('Replacement failed'))
            .mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
        const onStateChange = vi.fn();
        const { controller, host, root } = mount(undefined, { onRestart, onStateChange });
        expect(await controller.restart()).toBe(false);
        expect(controller.capture()).toBeNull();
        expect(find(root, element => element.getAttribute('aria-live') === 'polite').textContent).toContain('Press Restart');
        const restarted = controller.restart();
        controller.destroy();
        const callsAfterDestroy = onStateChange.mock.calls.length;
        finish(true);
        expect(await restarted).toBe(false);
        expect(host.children).toHaveLength(0);
        expect(onStateChange).toHaveBeenCalledTimes(callsAfterDestroy);
        expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ hidden: true, destroyed: true }));
    });

    test('orders micro-actions within a main phase and rejects duplicate contexts even for the same action ID', () => {
        vi.useFakeTimers();
        const { controller, root } = mount([
            {
                id: 'phase-one', actions: [
                    { actionId: 'save', instructionKey: 'examples.crudRowStates.tutorialPrepare', isComplete: payload => payload.first === true },
                    { actionId: 'save', instructionKey: 'examples.crudRowStates.tutorialReport', isComplete: payload => payload.second === true }
                ]
            },
            { id: 'phase-two', actionId: 'finish', instructionKey: 'examples.crudRowStates.tutorialCorrect', isComplete: payload => payload.succeeded === true }
        ]);
        const counter = find(root, element => element.className === 'demo-action-tutorial__counter');
        const instruction = find(root, element => element.getAttribute('aria-live') === 'polite');
        const first = controller.capture();
        expect(controller.notify('finish', { succeeded: true }, first)).toBe(false);
        expect(controller.notify('save', { second: true }, first)).toBe(false);
        expect(controller.notify('save', { first: true }, first)).toBe(true);
        expect(counter.textContent).toBe('1 of 2');
        expect(root.getAttribute('data-tutorial-step')).toBe('phase-one');
        expect(instruction.textContent).toBe('Action completed.');
        expect(controller.notify('save', { second: true }, first)).toBe(false);
        expect(controller.notify('save', { second: true }, { generation: first.generation, stepId: first.stepId })).toBe(false);
        vi.advanceTimersByTime(400);
        expect(instruction.textContent).toContain('Open "Report"');
        expect(counter.textContent).toBe('1 of 2');
        const second = controller.capture();
        expect(controller.notify('save', { first: true }, second)).toBe(false);
        expect(controller.notify('save', { second: true }, second)).toBe(true);
        expect(root.getAttribute('data-tutorial-step')).toBe('phase-two');
        expect(counter.textContent).toBe('2 of 2');
        vi.advanceTimersByTime(400);
        expect(controller.notify('finish', { succeeded: true }, controller.capture())).toBe(true);
        expect(root.getAttribute('data-tutorial-step')).toBe('complete');
        expect(vi.getTimerCount()).toBe(0);
        expect(document.activeElement).toBeNull();
    });

    test('cancels presentation timers across language, skip, restart and destroy without late progress', () => {
        vi.useFakeTimers();
        const { controller, root, host } = mount([{
            id: 'phase', actions: [
                { actionId: 'first', instructionKey: 'examples.crudRowStates.tutorialPrepare', isComplete: () => true },
                { actionId: 'second', instructionKey: 'examples.crudRowStates.tutorialReport', isComplete: () => true }
            ]
        }]);
        controller.notify('first', {}, controller.capture());
        expect(vi.getTimerCount()).toBe(1);
        controller.setLocale('it');
        expect(vi.getTimerCount()).toBe(0);
        expect(find(root, element => element.getAttribute('aria-live') === 'polite').textContent).toContain('Apri "Report"');
        controller.restart();
        controller.notify('first', {}, controller.capture());
        const pending = controller.capture();
        controller.skip();
        expect(vi.getTimerCount()).toBe(0);
        controller.reopen();
        expect(controller.notify('second', {}, pending)).toBe(false);
        expect(controller.capture().actionIndex).toBe(1);
        controller.restart();
        expect(controller.capture().actionIndex).toBe(0);
        controller.notify('first', {}, controller.capture());
        controller.restart();
        vi.runAllTimers();
        expect(controller.capture().actionIndex).toBe(0);
        controller.notify('first', {}, controller.capture());
        const late = controller.capture();
        controller.destroy();
        expect(vi.getTimerCount()).toBe(0);
        vi.runAllTimers();
        expect(host.children).toHaveLength(0);
        expect(controller.notify('second', {}, late)).toBe(false);
    });

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

    test('supports two image steps and a dedicated completion message without changing the shared defaults', () => {
        const windowMock = new EventTarget();
        vi.stubGlobal('window', windowMock);
        vi.stubGlobal('document', { createElement: tag => new ElementMock(tag), documentElement: { lang: 'it' }, activeElement: null });
        const host = new ElementMock('div');
        const controller = createDemoActionTutorial({
            host,
            locale: 'it',
            titleKey: 'examples.imagePreviewViewer.tutorialTitle',
            completedKey: 'examples.imagePreviewViewer.tutorialCompleted',
            steps: [
                { id: 'explore-gallery', actionId: 'viewer-closed', instructionKey: 'examples.imagePreviewViewer.tutorialGallery', isComplete: payload => payload.galleryId === 'TRV-001' && payload.navigated },
                { id: 'explore-portrait', actionId: 'viewer-closed', instructionKey: 'examples.imagePreviewViewer.tutorialPortrait', isComplete: payload => payload.galleryId === 'TRV-002' && payload.portraitViewed && payload.focusRestored }
            ]
        });
        controllers.push(controller);
        const root = host.children[0];
        const instruction = find(root, element => element.getAttribute('aria-live') === 'polite');
        expect(find(root, element => element.tagName === 'ol').children).toHaveLength(2);
        expect(find(root, element => element.className === 'demo-action-tutorial__counter').textContent).toBe('1 di 2');
        expect(controller.notify('viewer-closed', { galleryId: 'TRV-001', navigated: false }, controller.capture())).toBe(false);
        expect(controller.notify('viewer-closed', { galleryId: 'TRV-001', navigated: true }, controller.capture())).toBe(true);
        expect(root.getAttribute('data-tutorial-step')).toBe('explore-portrait');
        controller.setLocale('en');
        expect(instruction.textContent).toContain('Nature and Villages');
        expect(find(root, element => element.className === 'demo-action-tutorial__counter').textContent).toBe('2 of 2');
        expect(controller.notify('viewer-closed', { galleryId: 'TRV-002', portraitViewed: true, focusRestored: true }, controller.capture())).toBe(true);
        expect(instruction.textContent).toBe('Tutorial complete. You explored galleries and photos with different aspect ratios.');
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

    test('keeps focus on visible tutorial commands after explicit skip and reopen', () => {
        const { button } = mount();
        button('skip').focus();
        button('skip').click();
        expect(document.activeElement).toBe(button('reopen'));
        button('reopen').click();
        expect(document.activeElement).toBe(button('restart'));
    });

    test('does not steal grid focus when skip and reopen are called programmatically', () => {
        const { controller } = mount();
        const gridCell = document.createElement('div');
        gridCell.focus();
        controller.skip();
        expect(document.activeElement).toBe(gridCell);
        controller.reopen();
        expect(document.activeElement).toBe(gridCell);
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
