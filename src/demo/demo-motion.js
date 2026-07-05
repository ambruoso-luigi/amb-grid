import { animate, inView, stagger } from 'motion';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
const revealedElements = new WeakSet();

const prefersReducedMotion = () => (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(reducedMotionQuery).matches
);

const getElements = (root, selector) => Array.from(root.querySelectorAll(selector));

const reveal = (elements, options = {}) => {
    const visibleElements = elements.filter(element => !revealedElements.has(element));

    if (!visibleElements.length) return;

    visibleElements.forEach(element => revealedElements.add(element));

    animate(
        visibleElements,
        {
            opacity: [0, 1],
            y: [options.offset ?? 14, 0]
        },
        {
            delay: options.delay ?? 0,
            duration: options.duration ?? 0.42,
            ease: [0.22, 1, 0.36, 1]
        }
    );
};

const revealWhenVisible = (root, containerSelector, itemSelector, options = {}) => {
    const containers = getElements(root, containerSelector);

    if (!containers.length) return;

    inView(
        containers,
        container => {
            reveal(getElements(container, itemSelector), options);
        },
        {
            amount: options.amount ?? 0.24,
            margin: '0px 0px -8% 0px'
        }
    );
};

export const initDemoMotion = (root = document) => {
    if (prefersReducedMotion()) return;

    const heroElements = getElements(
        root,
        '.demo-hero__content, .demo-hero__metrics > div'
    );

    reveal(heroElements, {
        delay: stagger(0.06),
        duration: 0.48,
        offset: 12
    });

    revealWhenVisible(root, '.demo-frameworks', '.demo-framework-card', {
        amount: 0.18,
        delay: stagger(0.05),
        duration: 0.4,
        offset: 10
    });

    revealWhenVisible(root, '.demo-section--flow', '.demo-flow-card', {
        amount: 0.18,
        delay: stagger(0.04),
        duration: 0.38,
        offset: 10
    });

    revealWhenVisible(root, '.demo-feature-grid', '.demo-feature-card', {
        amount: 0.18,
        delay: stagger(0.035),
        duration: 0.36,
        offset: 8
    });
};
