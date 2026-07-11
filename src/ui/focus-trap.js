const DEFAULT_FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
].join(',');

const ARROW_KEYS = new Set([
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown'
]);

const resolveValue = value => {
    return typeof value === 'function' ? value() : value;
};

const toArray = value => {
    if (!value) return [];

    return Array.isArray(value) ? value : Array.from(value);
};

const isFocusable = element => {
    return element
        && element.disabled !== true
        && element.hidden !== true
        && typeof element.focus === 'function';
};

export const getFocusableElements = container => {
    if (!container || typeof container.querySelectorAll !== 'function') return [];

    return toArray(container.querySelectorAll(DEFAULT_FOCUSABLE_SELECTOR))
        .filter(isFocusable);
};

export const createFocusTrap = ({
    container,
    getElements,
    initialFocus,
    restoreFocusTo,
    fallbackFocus,
    trapArrowKeys = false
} = {}) => {
    let active = false;
    let previouslyFocusedElement = null;

    const getContainer = () => resolveValue(container);
    const getFallbackFocus = () => resolveValue(fallbackFocus) || getContainer();
    const getTrapElements = () => {
        const elements = typeof getElements === 'function'
            ? getElements()
            : getFocusableElements(getContainer());

        return toArray(elements).filter(isFocusable);
    };

    const focusElement = element => {
        if (!isFocusable(element)) return false;

        try {
            element.focus({ preventScroll: true });
        } catch {
            element.focus();
        }

        return true;
    };

    const focusInitial = () => {
        const target = resolveValue(initialFocus)
            || getTrapElements()[0]
            || getFallbackFocus();

        focusElement(target);
    };

    const restoreFocus = () => {
        const target = resolveValue(restoreFocusTo) || previouslyFocusedElement;

        previouslyFocusedElement = null;
        focusElement(target);
    };

    const handleKeydown = event => {
        if (!active || !event) return false;

        if (event.key === 'Tab') {
            const focusableElements = getTrapElements();
            const fallback = getFallbackFocus();

            if (!focusableElements.length) {
                event.preventDefault?.();
                event.stopPropagation?.();
                focusElement(fallback);
                return true;
            }

            const activeElement = document.activeElement;
            const activeIndex = focusableElements.indexOf(activeElement);
            const step = event.shiftKey ? -1 : 1;
            const nextIndex = activeIndex === -1
                ? 0
                : (activeIndex + step + focusableElements.length) % focusableElements.length;

            event.preventDefault?.();
            event.stopPropagation?.();
            focusElement(focusableElements[nextIndex]);
            return true;
        }

        if (trapArrowKeys && ARROW_KEYS.has(event.key)) {
            event.stopPropagation?.();
            return true;
        }

        return false;
    };

    return {
        activate({ focus = true } = {}) {
            active = true;
            previouslyFocusedElement = document.activeElement || null;

            if (focus) {
                focusInitial();
            }
        },
        deactivate({ restore = true } = {}) {
            if (!active) return;

            active = false;

            if (restore) {
                restoreFocus();
                return;
            }

            previouslyFocusedElement = null;
        },
        focusInitial,
        handleKeydown,
        restoreFocus
    };
};
