import ArrowRight from 'lucide/dist/esm/icons/arrow-right.mjs';
import CirclePlay from 'lucide/dist/esm/icons/circle-play.mjs';
import CirclePlus from 'lucide/dist/esm/icons/circle-plus.mjs';
import CircleX from 'lucide/dist/esm/icons/circle-x.mjs';
import ClipboardList from 'lucide/dist/esm/icons/clipboard-list.mjs';
import Copy from 'lucide/dist/esm/icons/copy.mjs';
import ExternalLink from 'lucide/dist/esm/icons/external-link.mjs';
import FileCode from 'lucide/dist/esm/icons/file-code.mjs';
import Funnel from 'lucide/dist/esm/icons/funnel.mjs';
import ListChecks from 'lucide/dist/esm/icons/list-checks.mjs';
import RefreshCw from 'lucide/dist/esm/icons/refresh-cw.mjs';
import RotateCcw from 'lucide/dist/esm/icons/rotate-ccw.mjs';
import Save from 'lucide/dist/esm/icons/save.mjs';
import ShieldCheck from 'lucide/dist/esm/icons/shield-check.mjs';
import Trash2 from 'lucide/dist/esm/icons/trash-2.mjs';
import TriangleAlert from 'lucide/dist/esm/icons/triangle-alert.mjs';
import Undo2 from 'lucide/dist/esm/icons/undo-2.mjs';

const icons = {
    add: CirclePlus,
    anomalies: TriangleAlert,
    arrowRight: ArrowRight,
    copy: Copy,
    delete: Trash2,
    externalLink: ExternalLink,
    filter: Funnel,
    json: FileCode,
    payload: FileCode,
    reload: RefreshCw,
    removeNew: CircleX,
    report: ClipboardList,
    reset: RotateCcw,
    rollback: Undo2,
    save: Save,
    selected: ListChecks,
    validate: ShieldCheck,
    video: CirclePlay
};

const toolbarActionIcons = {
    add: 'add',
    reload: 'reload',
    save: 'save',
    payload: 'payload',
    validate: 'validate',
    report: 'report',
    'show-report': 'report'
};

const rowActionIcons = {
    delete: 'delete',
    rollback: 'rollback',
    'remove-new': 'removeNew'
};

export const demoDeleteColumnIcons = Object.freeze({
    delete: '',
    rollback: '',
    removeNew: ''
});

const stringifyAttributes = attributes => Object.entries(attributes)
    .map(([name, value]) => `${name}="${String(value)}"`)
    .join(' ');

const renderChildren = children => children
    .map(([tag, attributes, nestedChildren]) => {
        const renderedChildren = Array.isArray(nestedChildren)
            ? renderChildren(nestedChildren)
            : '';

        return `<${tag} ${stringifyAttributes(attributes)}>${renderedChildren}</${tag}>`;
    })
    .join('');

export const demoIcon = (name, options = {}) => {
    const icon = icons[name];
    const {
        size = 18,
        strokeWidth = 2,
        className = 'demo-icon amb-demo-icon'
    } = options;

    if (!icon) return '';

    return `<svg class="${className}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${renderChildren(icon)}</svg>`;
};

const setIconMarkup = (container, iconName, options = {}) => {
    if (!container || !iconName) return;

    container.innerHTML = demoIcon(iconName, {
        className: 'amb-demo-icon',
        ...options
    });
};

const applyToolbarIcons = root => {
    root.querySelectorAll('.amb-toolbar__button[data-action]').forEach(button => {
        const iconName = toolbarActionIcons[button.dataset.action];
        const iconElement = button.querySelector('.amb-toolbar__button-icon');

        if (!iconName || !iconElement) return;

        button.classList.add('amb-demo-icon-button');
        setIconMarkup(iconElement, iconName);
    });
};

const applyFilterIcons = root => {
    root.querySelectorAll('.amb-search-toolbar__filters-button .amb-toolbar__button-icon')
        .forEach(iconElement => {
            const button = iconElement.closest('.amb-search-toolbar__filters-button');

            if (button) button.classList.add('amb-demo-icon-button', 'amb-demo-icon-button--filter');
            setIconMarkup(iconElement, 'filter');
        });
};

const applyRowActionIcons = root => {
    root.querySelectorAll('.amb-row-action-button[data-action]').forEach(button => {
        const iconName = rowActionIcons[button.dataset.action];

        if (!iconName) return;

        button.classList.add('amb-demo-row-action');
        button.textContent = '';
        setIconMarkup(button, iconName, { size: 17 });
    });
};

export const applyDemoGridIcons = root => {
    const targetRoot = root || document;

    applyToolbarIcons(targetRoot);
    applyFilterIcons(targetRoot);
    applyRowActionIcons(targetRoot);
};

export const installDemoGridIcons = (demo, root) => {
    const targetRoot = root || document;
    let queued = false;
    const applyQueued = () => {
        queued = false;
        applyDemoGridIcons(targetRoot);
    };
    const queueApply = () => {
        if (queued) return;

        queued = true;
        globalThis.requestAnimationFrame(applyQueued);
    };
    const observer = new MutationObserver(queueApply);

    applyDemoGridIcons(targetRoot);
    observer.observe(targetRoot, {
        childList: true,
        subtree: true
    });

    if (!demo || typeof demo.destroy !== 'function') {
        return () => observer.disconnect();
    }

    const originalDestroy = demo.destroy.bind(demo);

    demo.destroy = () => {
        observer.disconnect();
        originalDestroy();
    };

    return () => observer.disconnect();
};
