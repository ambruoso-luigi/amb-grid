import ArrowRight from 'lucide/dist/esm/icons/arrow-right.mjs';
import CirclePlay from 'lucide/dist/esm/icons/circle-play.mjs';
import ClipboardList from 'lucide/dist/esm/icons/clipboard-list.mjs';
import FileCode from 'lucide/dist/esm/icons/file-code.mjs';
import ListChecks from 'lucide/dist/esm/icons/list-checks.mjs';

const icons = {
    arrowRight: ArrowRight,
    json: FileCode,
    report: ClipboardList,
    selected: ListChecks,
    video: CirclePlay
};

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
        className = 'demo-icon'
    } = options;

    if (!icon) return '';

    return `<svg class="${className}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${renderChildren(icon)}</svg>`;
};
