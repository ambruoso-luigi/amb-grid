import {
    ArrowRight,
    Atom,
    Blocks,
    Box,
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

const escapeAttribute = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const stringifyAttributes = attributes => Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([name, value]) => `${name}="${escapeAttribute(value)}"`)
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
        className = 'demo-icon',
        ariaLabel = null
    } = options;

    if (!icon) return '';

    const accessibilityAttributes = ariaLabel
        ? {
            role: 'img',
            'aria-label': ariaLabel
        }
        : {
            'aria-hidden': 'true'
        };
    const svgAttributes = {
        class: className,
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': strokeWidth,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        focusable: 'false',
        ...accessibilityAttributes
    };

    return `<svg ${stringifyAttributes(svgAttributes)}>${renderChildren(icon)}</svg>`;
};

export const frameworkIcon = name => {
    if (!['javascript', 'react', 'vue', 'angular'].includes(name)) {
        return demoIcon(name, { className: 'demo-card-icon demo-card-icon--framework', size: 34 });
    }

    return `
        <span class="demo-framework-logo demo-framework-logo--${escapeAttribute(name)}" aria-hidden="true">
            <span class="demo-framework-logo__mark" aria-hidden="true">
                ${name === 'javascript' ? '<span class="demo-framework-logo__letters">JS</span>' : ''}
                ${name === 'react' ? '<span class="demo-framework-logo__orbit demo-framework-logo__orbit--one"></span><span class="demo-framework-logo__orbit demo-framework-logo__orbit--two"></span><span class="demo-framework-logo__orbit demo-framework-logo__orbit--three"></span><span class="demo-framework-logo__nucleus"></span>' : ''}
                ${name === 'vue' ? '<span class="demo-framework-logo__vue-back"></span><span class="demo-framework-logo__vue-front"></span>' : ''}
                ${name === 'angular' ? '<span class="demo-framework-logo__shield"><span>A</span></span>' : ''}
            </span>
        </span>
    `;
};
