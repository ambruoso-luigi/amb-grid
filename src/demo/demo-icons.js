import {
    ArrowRight,
    Atom,
    Blocks,
    Box,
    Braces,
    Calendar,
    CirclePlay,
    ClipboardList,
    CodeXml,
    Component,
    Database,
    FileCode,
    FileJson,
    Keyboard,
    Layers,
    ListChecks,
    MonitorCog,
    Pencil,
    RotateCcw,
    Rows3,
    Save,
    Search,
    Server,
    ShieldCheck,
    Sparkles,
    Trash2,
    Workflow
} from 'lucide';

export const demoIcons = {
    angular: Component,
    api: Server,
    arrowRight: ArrowRight,
    autocomplete: Sparkles,
    backend: Database,
    crud: Workflow,
    date: Calendar,
    delete: Trash2,
    edit: Pencil,
    framework: Blocks,
    javascript: CodeXml,
    json: FileCode,
    keyboard: Keyboard,
    legacy: Box,
    lookup: Search,
    modern: MonitorCog,
    payload: FileJson,
    react: Atom,
    report: ClipboardList,
    rollback: RotateCcw,
    rowStates: Rows3,
    save: Save,
    selected: ListChecks,
    validation: ShieldCheck,
    video: CirclePlay,
    vue: Layers
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
    const icon = demoIcons[name];
    const {
        size = 18,
        strokeWidth = 2,
        className = 'demo-icon'
    } = options;

    if (!icon) return '';

    return `<svg class="${className}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${renderChildren(icon)}</svg>`;
};
