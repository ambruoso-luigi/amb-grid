import { readFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import { decorateDemoEditorButtons } from '../src/demo/utils/decorate-demo-editor-button.js';

afterEach(() => vi.unstubAllGlobals());

test.each(['crud-row-states', 'validation', 'autocomplete', 'multifield-lookup', 'column-calculations', 'dates'])(
    '%s places its subtitle before the guide and only consumes decorations after Finish', name => {
        const source = readFileSync(new URL(`../src/demo/${name}.js`, import.meta.url), 'utf8');
        const heading = source.slice(source.indexOf('<div class="demo-crud-heading">'), source.indexOf('<div class="demo-action-tutorial-host">'));
        expect(heading.indexOf('.intro"')).toBeLessThan(heading.indexOf('createDemoColumnGuide({'));
        const launch = source.slice(source.indexOf('function handleTutorialLaunch()'), source.indexOf('function finishTutorial('));
        const finish = source.slice(source.indexOf('function finishTutorial('), source.indexOf('function finishTutorial(') + 400);
        expect(source).toContain('!tutorialState.hidden && state.hidden && !tutorialState.complete');
        expect(source).toContain('!tutorialState.resetting && !state.resetting && !state.destroyed) tutorialStarted = false');
        expect(launch).toContain('tutorial.restart()');
        expect(launch).not.toContain('tutorial.reopen()');
        expect(launch).not.toContain("setAttribute('data-demo-crud-rays-consumed'");
        expect(launch).toContain("if (started && !destroyed) tutorialLaunch.removeAttribute('data-demo-tutorial-finished')");
        expect(finish).toContain("if (!openGuide && !destroyed) tutorialLaunch.setAttribute('data-demo-tutorial-finished'");
    }
);

test('decorates dynamic buttons without replacing them and disconnects the observer', () => {
    let observer;
    vi.stubGlobal('MutationObserver', class {
        constructor(callback) { this.callback = callback; this.disconnect = vi.fn(); observer = this; }
        observe() {}
    });
    const makeButton = () => Object.assign(new EventTarget(), {
        dataset: {}, attributes: {}, innerHTML: 'emoji',
        getAttribute(name) { return this.attributes[name] || null; },
        setAttribute(name, value) { this.attributes[name] = value; }
    });
    const buttons = [makeButton()];
    const root = { querySelectorAll: () => buttons };
    const click = vi.fn();
    buttons[0].addEventListener('click', click);
    const stop = decorateDemoEditorButtons(root, { selector: 'button', icon: 'lookup', label: 'Search', strokeWidth: 2.5 });
    expect(buttons[0].innerHTML).toContain('width="17"');
    expect(buttons[0].innerHTML).toContain('stroke-width="2.5"');
    expect(buttons[0].innerHTML).toContain('<circle');
    buttons[0].dispatchEvent(new Event('click'));
    expect(click).toHaveBeenCalledOnce();
    buttons.push(makeButton());
    observer.callback();
    expect(buttons[1].innerHTML).toContain('stroke-width="2.5"');
    stop();
    expect(observer.disconnect).toHaveBeenCalledOnce();
    const date = makeButton();
    decorateDemoEditorButtons({ querySelectorAll: () => [date] }, { selector: 'button', icon: 'date', label: 'Open calendar' });
    expect(date.innerHTML).toContain('width="17"');
    expect(date.innerHTML).toContain('stroke-width="2"');
    expect(date.innerHTML).toContain('<rect');
});

test('keeps the JavaScript guide before its tutorial and scopes visual styles', () => {
    const source = readFileSync(new URL('../src/demo/full-demo.js', import.meta.url), 'utf8');
    const css = readFileSync(new URL('../src/demo/demo.css', import.meta.url), 'utf8');
    expect(source.indexOf('summaryKey: \'mainDemo.guide.summary\'')).toBeLessThan(source.indexOf('class="demo-main-tutorial-host"'));
    expect(source).toContain('stopLookupIcons();');
    expect(source).toContain('stopDateIcons();');
    expect(css).toContain('.demo-crud-tutorial-launch[data-demo-tutorial-finished]:not([hidden])::before');
    expect(css).toMatch(/data-demo-tutorial-finished\]:not\(\[hidden\]\)::before\s*\{[^}]*animation:\s*none;[^}]*content:\s*none;[^}]*display:\s*none;/);
    expect(css).toMatch(/data-demo-inventory-finished\]::before\s*\{[^}]*animation:\s*none;[^}]*content:\s*none;[^}]*display:\s*none;/);
    expect(css).toContain('.demo-disclosure--technical[open]::details-content');
    expect(css).not.toContain('.demo-disclosure--technical[open] > .demo-disclosure__body { grid-row:');
    expect(css).toContain('#javascript-demo .amb-lookup-editor__button');
    expect(css).toContain('#javascript-demo .tabulator-cell');
    expect(css).toMatch(/#javascript-demo \.demo-action-tutorial__instruction\s*\{[^}]*font-size:\s*16px;[^}]*font-weight:\s*500;[^}]*line-height:\s*1\.45;/);
    expect(css).toMatch(/#javascript-demo \.demo-action-tutorial__instruction strong\s*\{[^}]*color:\s*#0f2747;[^}]*font-weight:\s*750;/);
});
