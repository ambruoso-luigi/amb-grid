import './demo-action-tutorial.css';
import { publicExampleTranslations } from '../example-copy.js';
import { demoIcon } from '../demo-icons.js';

/**
 * A phase can keep its existing action fields or provide an ordered `actions` array.
 * Each action accepts `resultKey` for supporting text and `successKey` for completion feedback.
 * Capture a fresh context for each operation; feedback timers only change the displayed text.
 * Optional onRestart awaits application cleanup; onStateChange reports the current phase and visibility.
 */
export function createDemoActionTutorial({ host, steps, locale = 'it', titleKey, completedKey = 'tutorial.completed', onRestart, onStateChange, onCompleteAction, onCompleteSuccess, variant = 'default', initiallyHidden = false, externalOpenButton = null, panelId = '' }) {
    const isCrud = variant === 'crud';
    let language = locale === 'en' ? 'en' : 'it';
    let index = 0;
    let actionIndex = 0;
    let generation = 0;
    let hidden = initiallyHidden;
    let destroyed = false;
    let feedbackKey = null;
    let feedbackTimer = null;
    let presentationGeneration = 0;
    let instructionRevision = 0;
    let renderedInstructionSource = null;
    let renderedInstructionEmphasis = false;
    let resetting = false;
    let restartFailed = false;
    let restartSequence = 0;
    let completeActionPending = false;
    let completeActionFailed = false;
    const root = document.createElement('section');
    const bar = document.createElement('div');
    const identity = document.createElement('div');
    const icon = document.createElement('span');
    const headingGroup = document.createElement('div');
    const label = document.createElement('span');
    const heading = document.createElement('strong');
    const counter = document.createElement('span');
    const titleRow = isCrud ? document.createElement('div') : null;
    const instruction = document.createElement('p');
    const result = document.createElement('p');
    const progress = document.createElement('ol');
    const controls = document.createElement('div');
    const skipButton = document.createElement('button');
    const restartButton = document.createElement('button');
    const reopenButton = document.createElement('button');
    const completeActions = isCrud ? document.createElement('div') : null;
    const finishButton = isCrud ? document.createElement('button') : null;
    const finishLabel = isCrud ? document.createElement('span') : null;
    const completeButton = isCrud ? document.createElement('button') : null;
    const completeLabel = isCrud ? document.createElement('span') : null;
    const completeStatus = isCrud ? document.createElement('p') : null;
    const restartLabel = isCrud ? document.createElement('span') : null;
    const skipLabel = isCrud ? document.createElement('span') : null;
    const indicators = steps.map(() => document.createElement('li'));
    const copy = (key, values = {}) => Object.entries(values).reduce(
        (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
        publicExampleTranslations[language][key]
    );
    root.className = `demo-action-tutorial${isCrud ? ' demo-action-tutorial--crud' : ''}`;
    if (panelId) root.id = panelId;
    bar.className = 'demo-action-tutorial__bar';
    identity.className = 'demo-action-tutorial__identity';
    icon.className = 'demo-action-tutorial__icon';
    if (isCrud) icon.innerHTML = demoIcon('tutorialCap', { size: 28, strokeWidth: 2.2 });
    else icon.textContent = '\u203a';
    icon.setAttribute('aria-hidden', 'true');
    headingGroup.className = 'demo-action-tutorial__heading';
    label.className = 'demo-action-tutorial__label';
    heading.className = 'demo-action-tutorial__title';
    counter.className = 'demo-action-tutorial__counter';
    if (titleRow) titleRow.className = 'demo-action-tutorial__title-row';
    instruction.className = 'demo-action-tutorial__instruction';
    instruction.setAttribute('aria-live', 'polite');
    instruction.setAttribute('aria-atomic', 'true');
    result.className = 'demo-action-tutorial__result';
    progress.className = 'demo-action-tutorial__progress';
    controls.className = 'demo-action-tutorial__controls';
    for (const button of [skipButton, restartButton, reopenButton]) {
        button.type = 'button';
        button.className = 'demo-action-tutorial__button';
    }
    skipButton.setAttribute('data-tutorial-action', 'skip');
    restartButton.setAttribute('data-tutorial-action', 'restart');
    reopenButton.setAttribute('data-tutorial-action', 'reopen');
    if (isCrud) {
        completeActions.className = 'demo-action-tutorial__complete-actions';
        finishButton.type = 'button';
        finishButton.className = 'demo-action-tutorial__complete-button';
        finishButton.setAttribute('data-tutorial-action', 'finish');
        finishButton.innerHTML = demoIcon('selected', { size: 18 });
        finishButton.append(finishLabel);
        completeButton.type = 'button';
        completeButton.className = 'demo-action-tutorial__complete-button demo-action-tutorial__complete-button--guide';
        completeButton.setAttribute('data-tutorial-action', 'open-guide');
        completeButton.innerHTML = demoIcon('guide', { size: 18 });
        completeStatus.className = 'demo-action-tutorial__complete-status';
        completeStatus.setAttribute('role', 'status');
        completeStatus.setAttribute('aria-live', 'polite');
        completeButton.append(completeLabel);
        completeActions.append(finishButton, completeButton, completeStatus);
        const restartIcon = document.createElement('span');
        const skipIcon = document.createElement('span');
        restartIcon.className = 'demo-action-tutorial__button-icon';
        skipIcon.className = 'demo-action-tutorial__button-icon';
        restartIcon.setAttribute('aria-hidden', 'true');
        skipIcon.setAttribute('aria-hidden', 'true');
        restartIcon.innerHTML = demoIcon('rotateCcw', { size: 15 });
        skipIcon.innerHTML = demoIcon('close', { size: 15 });
        restartButton.append(restartIcon, restartLabel);
        skipButton.append(skipIcon, skipLabel);
    }
    progress.append(...indicators);
    controls.append(restartButton, skipButton);
    if (isCrud) {
        titleRow.append(heading, counter);
        headingGroup.append(label, titleRow);
    } else headingGroup.append(label, heading);
    identity.append(icon, headingGroup);
    if (isCrud) bar.append(identity, progress, instruction, result, completeActions, controls);
    else bar.append(identity, counter, progress, instruction, result, controls);
    root.append(bar, reopenButton);
    host.append(root);

    const hasMicroActions = step => Array.isArray(step.actions) && step.actions.length > 0;
    const actionsFor = step => hasMicroActions(step) ? step.actions : [step];

    function clearFeedback() {
        if (feedbackTimer !== null) globalThis.clearTimeout(feedbackTimer);
        feedbackTimer = null;
        feedbackKey = null;
        presentationGeneration += 1;
    }

    function render() {
        if (destroyed) return;
        const complete = index === steps.length;
        const action = complete ? null : actionsFor(steps[index])[actionIndex];
        root.setAttribute('aria-label', copy(isCrud && complete ? 'examples.crudRowStates.tutorialCompleteTitle' : titleKey));
        root.setAttribute('data-tutorial-step', complete ? 'complete' : steps[index].id);
        root.setAttribute('data-tutorial-action-index', complete ? '' : String(actionIndex));
        root.setAttribute('data-feedback', String(feedbackKey !== null));
        root.setAttribute('aria-busy', String(resetting || completeActionPending));
        root.setAttribute('data-resetting', String(resetting));
        if (isCrud) root.setAttribute('data-completing', String(completeActionPending));
        if (isCrud) root.setAttribute('data-hidden', String(hidden));
        root.hidden = hidden && Boolean(externalOpenButton);
        bar.hidden = hidden;
        reopenButton.hidden = !hidden || Boolean(externalOpenButton);
        heading.textContent = copy(isCrud && complete ? 'examples.crudRowStates.tutorialCompleteTitle' : titleKey);
        label.textContent = copy(isCrud ? 'examples.crudRowStates.tutorialLabel' : 'tutorial.title');
        counter.textContent = copy('tutorial.counter', { current: Math.min(index + 1, steps.length), total: steps.length });
        progress.setAttribute('aria-label', copy('tutorial.progress'));
        indicators.forEach((indicator, stepIndex) => {
            indicator.textContent = copy('tutorial.progressStep', { current: stepIndex + 1, total: steps.length });
            indicator.setAttribute('data-complete', String(stepIndex < index));
            indicator.setAttribute('aria-current', !complete && stepIndex === index ? 'step' : 'false');
        });
        const text = copy(resetting ? 'tutorial.restarting' : restartFailed ? 'tutorial.restartFailed'
            : feedbackKey ?? (complete ? completedKey : action.instructionKey));
        const emphasizeInstruction = isCrud && !resetting && !restartFailed && !feedbackKey && !complete;
        if (renderedInstructionSource !== text || renderedInstructionEmphasis !== emphasizeInstruction) {
            if (emphasizeInstruction) {
                const nodes = text.split(/(\[\[[^\]]+\]\])/g).filter(Boolean).map(segment => {
                    if (!segment.startsWith('[[')) return document.createTextNode(segment);
                    const strong = document.createElement('strong');
                    strong.textContent = segment.slice(2, -2);
                    return strong;
                });
                instruction.replaceChildren(...nodes);
            } else instruction.textContent = text;
            renderedInstructionSource = text;
            renderedInstructionEmphasis = emphasizeInstruction;
            instructionRevision += 1;
            instruction.setAttribute('data-transition', instructionRevision % 2 ? 'odd' : 'even');
        }
        result.hidden = resetting || restartFailed || Boolean(feedbackKey) || !action?.resultKey;
        result.textContent = result.hidden ? '' : copy(action.resultKey);
        if (isCrud) {
            completeActions.hidden = !complete || hidden;
            finishButton.disabled = completeActionPending;
            finishButton.setAttribute('aria-busy', String(completeActionPending));
            finishButton.setAttribute('aria-disabled', String(completeActionPending));
            finishLabel.textContent = copy('examples.crudRowStates.tutorialFinish');
            completeButton.disabled = completeActionPending;
            completeButton.setAttribute('aria-busy', String(completeActionPending));
            completeButton.setAttribute('aria-disabled', String(completeActionPending));
            completeLabel.textContent = copy('examples.crudRowStates.tutorialOpenGuide');
            completeStatus.hidden = !completeActionPending && !completeActionFailed;
            completeStatus.textContent = completeActionPending ? copy('examples.crudRowStates.tutorialRestoring')
                : completeActionFailed ? copy('examples.crudRowStates.tutorialRestoreFailed') : '';
            skipButton.disabled = completeActionPending;
            restartButton.disabled = completeActionPending;
            skipLabel.textContent = copy('examples.crudRowStates.tutorialClose');
            restartLabel.textContent = copy('tutorial.restart');
        } else {
            skipButton.textContent = copy('tutorial.skip');
            restartButton.textContent = copy('tutorial.restart');
        }
        reopenButton.textContent = copy('tutorial.reopen');
        restartButton.setAttribute('aria-disabled', String(resetting || completeActionPending));
        onStateChange?.({ stepId: complete ? null : steps[index].id, actionIndex, hidden, complete, resetting, restartFailed, destroyed });
    }

    function skip() {
        if (destroyed || hidden || completeActionPending) return;
        const restoreFocus = [skipButton, restartButton].includes(document.activeElement);
        clearFeedback();
        hidden = true;
        generation += 1;
        render();
        if (restoreFocus) (externalOpenButton || reopenButton).focus({ preventScroll: true });
    }

    function reopen() {
        if (destroyed || !hidden) return;
        const restoreFocus = document.activeElement === (externalOpenButton || reopenButton);
        clearFeedback();
        hidden = false;
        render();
        if (restoreFocus) restartButton.focus({ preventScroll: true });
    }

    function restart() {
        if (destroyed || resetting || completeActionPending) return;
        clearFeedback();
        completeActionFailed = false;
        index = 0;
        actionIndex = 0;
        hidden = false;
        generation += 1;
        restartFailed = false;
        if (typeof onRestart === 'function') {
            resetting = true;
            const sequence = ++restartSequence;
            render();
            const finish = succeeded => {
                if (destroyed || sequence !== restartSequence) return false;
                resetting = false;
                restartFailed = !succeeded;
                render();
                return succeeded;
            };
            try {
                return Promise.resolve(onRestart()).then(value => finish(value !== false), () => finish(false));
            } catch {
                return Promise.resolve(finish(false));
            }
        }
        render();
    }

    function setLocale(nextLocale) {
        if (destroyed) return;
        clearFeedback();
        language = nextLocale === 'en' ? 'en' : 'it';
        render();
    }

    async function completeAndExit(openGuide) {
        if (!isCrud || destroyed || hidden || index !== steps.length || completeActionPending) return false;
        completeActionPending = true;
        completeActionFailed = false;
        render();
        let succeeded = false;
        try {
            succeeded = await onCompleteAction?.() === true;
        } catch {
            succeeded = false;
        }
        if (destroyed) return false;
        completeActionPending = false;
        if (!succeeded) {
            completeActionFailed = true;
            render();
            return false;
        }
        clearFeedback();
        index = 0;
        actionIndex = 0;
        hidden = true;
        generation += 1;
        completeActionFailed = false;
        render();
        onCompleteSuccess?.({ openGuide });
        return true;
    }

    const handleFinish = () => completeAndExit(false);
    const handleOpenGuide = () => completeAndExit(true);

    const handleLanguageChange = event => setLocale(event.detail?.language ?? document.documentElement.lang);
    skipButton.addEventListener('click', skip);
    reopenButton.addEventListener('click', reopen);
    restartButton.addEventListener('click', restart);
    finishButton?.addEventListener('click', handleFinish);
    completeButton?.addEventListener('click', handleOpenGuide);
    window.addEventListener('amb-demo-language-change', handleLanguageChange);
    render();

    return {
        capture: () => destroyed || hidden || resetting || restartFailed || index === steps.length ? null : {
            generation, stepId: steps[index].id,
            ...(hasMicroActions(steps[index]) ? { actionIndex } : {})
        },
        notify(actionId, payload, context) {
            const step = steps[index];
            if (destroyed || hidden || resetting || restartFailed || !step || !context || context.generation !== generation || context.stepId !== step.id) return false;
            const actions = actionsFor(step);
            const hasActions = hasMicroActions(step);
            if (hasActions && context.actionIndex !== actionIndex) return false;
            const action = actions[actionIndex];
            if (action.actionId !== actionId || action.isComplete(payload) !== true) return false;
            clearFeedback();
            actionIndex += 1;
            if (actionIndex === actions.length) {
                index += 1;
                actionIndex = 0;
            }
            if (hasActions && !(isCrud && index === steps.length)) {
                feedbackKey = action.successKey ?? 'tutorial.actionCompleted';
                const revision = presentationGeneration;
                feedbackTimer = globalThis.setTimeout(() => {
                    if (destroyed || hidden || revision !== presentationGeneration) return;
                    clearFeedback();
                    render();
                }, 400);
            }
            render();
            return true;
        },
        setLocale, skip, reopen, restart,
        destroy() {
            if (destroyed) return;
            clearFeedback();
            destroyed = true;
            generation += 1;
            restartSequence += 1;
            completeActionPending = false;
            onStateChange?.({ stepId: null, actionIndex, hidden: true, complete: false, resetting: false, restartFailed: false, destroyed: true });
            skipButton.removeEventListener('click', skip);
            reopenButton.removeEventListener('click', reopen);
            restartButton.removeEventListener('click', restart);
            finishButton?.removeEventListener('click', handleFinish);
            completeButton?.removeEventListener('click', handleOpenGuide);
            window.removeEventListener('amb-demo-language-change', handleLanguageChange);
            root.remove();
        }
    };
}
