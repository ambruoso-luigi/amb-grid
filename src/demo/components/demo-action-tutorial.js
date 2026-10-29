import './demo-action-tutorial.css';
import { publicExampleTranslations } from '../example-copy.js';

export function createDemoActionTutorial({ host, steps, locale = 'it', titleKey }) {
    let language = locale === 'en' ? 'en' : 'it';
    let index = 0;
    let generation = 0;
    let hidden = false;
    let destroyed = false;
    const root = document.createElement('section');
    const bar = document.createElement('div');
    const heading = document.createElement('strong');
    const counter = document.createElement('span');
    const instruction = document.createElement('p');
    const progress = document.createElement('ol');
    const controls = document.createElement('div');
    const skipButton = document.createElement('button');
    const restartButton = document.createElement('button');
    const reopenButton = document.createElement('button');
    const indicators = steps.map(() => document.createElement('li'));
    const copy = (key, values = {}) => Object.entries(values).reduce(
        (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
        publicExampleTranslations[language][key]
    );
    root.className = 'demo-action-tutorial';
    bar.className = 'demo-action-tutorial__bar';
    heading.className = 'demo-action-tutorial__title';
    counter.className = 'demo-action-tutorial__counter';
    instruction.className = 'demo-action-tutorial__instruction';
    instruction.setAttribute('aria-live', 'polite');
    instruction.setAttribute('aria-atomic', 'true');
    progress.className = 'demo-action-tutorial__progress';
    controls.className = 'demo-action-tutorial__controls';
    for (const button of [skipButton, restartButton, reopenButton]) {
        button.type = 'button';
        button.className = 'demo-action-tutorial__button';
    }
    skipButton.setAttribute('data-tutorial-action', 'skip');
    restartButton.setAttribute('data-tutorial-action', 'restart');
    reopenButton.setAttribute('data-tutorial-action', 'reopen');
    progress.append(...indicators);
    controls.append(restartButton, skipButton);
    bar.append(heading, counter, progress, instruction, controls);
    root.append(bar, reopenButton);
    host.append(root);

    function render() {
        if (destroyed) return;
        const complete = index === steps.length;
        root.setAttribute('aria-label', copy(titleKey));
        root.setAttribute('data-tutorial-step', complete ? 'complete' : steps[index].id);
        bar.hidden = hidden;
        reopenButton.hidden = !hidden;
        heading.textContent = copy(titleKey);
        counter.textContent = copy('tutorial.counter', { current: Math.min(index + 1, steps.length), total: steps.length });
        progress.setAttribute('aria-label', copy('tutorial.progress'));
        indicators.forEach((indicator, stepIndex) => {
            indicator.textContent = copy('tutorial.progressStep', { current: stepIndex + 1, total: steps.length });
            indicator.setAttribute('data-complete', String(stepIndex < index));
            indicator.setAttribute('aria-current', !complete && stepIndex === index ? 'step' : 'false');
        });
        const text = copy(complete ? 'tutorial.completed' : steps[index].instructionKey);
        if (instruction.textContent !== text) instruction.textContent = text;
        skipButton.textContent = copy('tutorial.skip');
        restartButton.textContent = copy('tutorial.restart');
        reopenButton.textContent = copy('tutorial.reopen');
    }

    function skip() {
        if (destroyed || hidden) return;
        hidden = true;
        generation += 1;
        render();
    }

    function reopen() {
        if (destroyed || !hidden) return;
        hidden = false;
        render();
    }

    function restart() {
        if (destroyed) return;
        index = 0;
        hidden = false;
        generation += 1;
        render();
    }

    function setLocale(nextLocale) {
        language = nextLocale === 'en' ? 'en' : 'it';
        render();
    }

    const handleLanguageChange = event => setLocale(event.detail?.language ?? document.documentElement.lang);
    skipButton.addEventListener('click', skip);
    reopenButton.addEventListener('click', reopen);
    restartButton.addEventListener('click', restart);
    window.addEventListener('amb-demo-language-change', handleLanguageChange);
    render();

    return {
        capture: () => destroyed || hidden || index === steps.length ? null : { generation, stepId: steps[index].id },
        notify(actionId, payload, context) {
            const step = steps[index];
            if (destroyed || hidden || !step || !context || context.generation !== generation || context.stepId !== step.id) return false;
            if (step.actionId !== actionId || step.isComplete(payload) !== true) return false;
            index += 1;
            render();
            return true;
        },
        setLocale, skip, reopen, restart,
        destroy() {
            if (destroyed) return;
            destroyed = true;
            generation += 1;
            skipButton.removeEventListener('click', skip);
            reopenButton.removeEventListener('click', reopen);
            restartButton.removeEventListener('click', restart);
            window.removeEventListener('amb-demo-language-change', handleLanguageChange);
            root.remove();
        }
    };
}
