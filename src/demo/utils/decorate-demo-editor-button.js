import { demoIcon } from '../demo-icons.js';

export const decorateDemoEditorButtons = (root, {
    selector,
    icon,
    label
}) => {
    const decorate = () => {
        root.querySelectorAll(selector).forEach(button => {
            if (button.dataset.demoIconDecorated) return;

            button.dataset.demoIconDecorated = 'true';
            button.setAttribute('aria-label', button.getAttribute('aria-label') || label);
            button.innerHTML = `${demoIcon(icon, { size: 17 })}<span class="demo-visually-hidden">${label}</span>`;
        });
    };

    decorate();

    if (typeof MutationObserver !== 'function') return () => {};

    const observer = new MutationObserver(decorate);

    observer.observe(root, { childList: true, subtree: true });

    return () => observer.disconnect();
};
