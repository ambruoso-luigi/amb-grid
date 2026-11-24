import { afterEach, expect, test, vi } from 'vitest';
import { bindGuideCodeCopy } from '../src/demo/getting-started-javascript.js';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

const setup = writeText => {
    const win = new EventTarget();
    vi.stubGlobal('window', win);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const label = { textContent: 'Copia' };
    const icon = { innerHTML: '' };
    const status = { textContent: '' };
    const code = { textContent: 'const value = 42;\n' };
    const button = Object.assign(new EventTarget(), { dataset: {}, querySelector: selector => selector.includes('__icon') ? icon : label });
    const panel = { querySelector: selector => selector === 'code' ? code : status };
    button.closest = () => panel;
    const app = { querySelectorAll: () => [button] };
    let language = 'it';
    const copy = { it: { 'guide.copy': 'Copia', 'guide.copied': 'Copiato', 'guide.copyError': 'Copia non riuscita' }, en: { 'guide.copy': 'Copy', 'guide.copied': 'Copied', 'guide.copyError': 'Copy failed' } };
    const controller = bindGuideCodeCopy(app, key => copy[language][key]);
    return { button, label, status, icon, controller, win, language: value => { language = value; win.dispatchEvent(new Event('amb-demo-language-change')); } };
};

test('copies the exact source, localizes feedback and restores the button', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const { button, label, status, icon, controller, language } = setup(writeText);
    button.dispatchEvent(new Event('click'));
    expect(writeText).toHaveBeenCalledWith('const value = 42;\n');
    expect(label.textContent).toBe('Copia');
    await Promise.resolve();
    expect(label.textContent).toBe('Copiato');
    expect(status.textContent).toBe('Copiato');
    expect(icon.innerHTML).toContain('M20 6 9 17l-5-5');
    language('en');
    expect(label.textContent).toBe('Copied');
    expect(status.textContent).toBe('Copied');
    vi.advanceTimersByTime(1600);
    expect(label.textContent).toBe('Copy');
    expect(status.textContent).toBe('');
    controller.destroy();
});

test('reports clipboard failure and cleans up timers and listeners', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const { button, label, status, controller } = setup(writeText);
    button.dispatchEvent(new Event('click'));
    await Promise.resolve();
    expect(label.textContent).toBe('Copia non riuscita');
    expect(status.textContent).toBe('Copia non riuscita');
    controller.destroy();
    vi.runAllTimers();
    expect(label.textContent).toBe('Copia non riuscita');
    button.dispatchEvent(new Event('click'));
    expect(writeText).toHaveBeenCalledOnce();
});

test('ignores clipboard completion after the guide is destroyed', async () => {
    let resolveCopy;
    const { button, label, controller } = setup(vi.fn(() => new Promise(resolve => { resolveCopy = resolve; })));
    button.dispatchEvent(new Event('click'));
    controller.destroy();
    resolveCopy();
    await Promise.resolve();
    expect(label.textContent).toBe('Copia');
});
