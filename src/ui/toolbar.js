const DEFAULT_BUTTONS = ['add', 'save', 'reload'];

const ICONS = {
    add: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14"></path>
        </svg>
    `,
    save: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 3h12l2 2v16H5z"></path>
            <path d="M8 3v6h8V3M8 21v-8h8v8"></path>
        </svg>
    `,
    reload: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 6v6h-6"></path>
            <path d="M19 12a7 7 0 1 0-2 5"></path>
        </svg>
    `,
    validate: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m5 12 4 4L19 6"></path>
        </svg>
    `,
    payload: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 4H5v16h3M16 4h3v16h-3M10 9l-2 3 2 3M14 9l2 3-2 3"></path>
        </svg>
    `
};

const BUILT_IN_BUTTONS = {
    add: {
        label: 'Add row',
        callback: 'onAdd'
    },
    save: {
        label: 'Save',
        callback: 'onSave',
        includePayload: true
    },
    reload: {
        label: 'Reload',
        callback: 'onReload'
    },
    validate: {
        label: 'Validate',
        callback: 'onValidate'
    },
    payload: {
        label: 'Show payload',
        callback: 'onPayload',
        includePayload: true
    }
};

const getTableElement = selector => {
    if (typeof selector === 'string') {
        return document.querySelector(selector);
    }

    return selector || null;
};

const normalizeButton = (button, options) => {
    if (typeof button === 'string') {
        const definition = BUILT_IN_BUTTONS[button];

        if (!definition) return null;

        return {
            id: button,
            label: definition.label,
            icon: ICONS[button],
            callback: options[definition.callback],
            includePayload: definition.includePayload === true
        };
    }

    if (!button || typeof button !== 'object' || !button.id) return null;

    return {
        id: String(button.id),
        label: button.label || String(button.id),
        icon: button.icon || '',
        callback: typeof button.onClick === 'function' ? button.onClick : null,
        includePayload: button.includePayload === true
    };
};

export const normalizeToolbarOptions = toolbar => {
    if (!toolbar) {
        return {
            enabled: false,
            buttons: [],
            onAdd: null,
            onSave: null,
            onReload: null,
            onValidate: null,
            onPayload: null
        };
    }

    const options = toolbar === true ? {} : toolbar;
    const callbacks = {
        onAdd: typeof options.onAdd === 'function' ? options.onAdd : null,
        onSave: typeof options.onSave === 'function' ? options.onSave : null,
        onReload: typeof options.onReload === 'function' ? options.onReload : null,
        onValidate: typeof options.onValidate === 'function' ? options.onValidate : null,
        onPayload: typeof options.onPayload === 'function' ? options.onPayload : null
    };
    const configuredButtons = Array.isArray(options.buttons)
        ? options.buttons
        : DEFAULT_BUTTONS;
    const seenIds = new Set();
    const buttons = configuredButtons
        .map(button => normalizeButton(button, callbacks))
        .filter(button => {
            if (!button || seenIds.has(button.id)) return false;

            seenIds.add(button.id);
            return true;
        });

    return {
        enabled: options.enabled !== false,
        buttons,
        ...callbacks
    };
};

const createButton = definition => {
    const button = document.createElement('button');
    const icon = document.createElement('span');
    const label = document.createElement('span');

    button.className = `amb-toolbar__button amb-toolbar__button--${definition.id}`;
    button.type = 'button';
    button.dataset.action = definition.id;
    button.disabled = !definition.callback;
    button.setAttribute('aria-label', definition.label);

    icon.className = 'amb-toolbar__button-icon';
    icon.innerHTML = definition.icon;
    label.className = 'amb-toolbar__button-label';
    label.textContent = definition.label;

    if (definition.icon) {
        button.appendChild(icon);
    }

    button.appendChild(label);

    return button;
};

/**
 * Create the optional AMB Grid CRUD toolbar.
 *
 * Save and Reload are backend-agnostic. They invoke developer callbacks and
 * never perform network requests directly.
 *
 * @param {object} options - Toolbar integration options.
 * @param {string|HTMLElement} options.selector - Table selector or element.
 * @param {boolean|object} options.toolbar - Toolbar configuration.
 * @param {Function} options.getGrid - Return the AMB table controller.
 * @returns {object|null} Toolbar controller, or null when disabled.
 * @private
 * @internal
 * @ignore
 */
export const createToolbar = ({ selector, toolbar, getGrid }) => {
    const options = normalizeToolbarOptions(toolbar);

    if (!options.enabled) return null;

    const tableElement = getTableElement(selector);

    if (!tableElement || !tableElement.parentNode) return null;

    const element = document.createElement('div');
    const group = document.createElement('div');
    const listeners = [];

    element.className = 'amb-toolbar';
    group.className = 'amb-toolbar__group';
    element.appendChild(group);

    options.buttons.forEach(definition => {
        const button = createButton(definition);

        if (definition.callback) {
            const handler = async event => {
                const grid = getGrid();

                if (!grid || button.disabled) return;

                button.disabled = true;
                button.dataset.busy = 'true';

                try {
                    const context = { grid, event };

                    if (definition.includePayload) {
                        context.payload = grid.crud.getSavePayload();
                    }

                    await definition.callback(context);
                } finally {
                    button.disabled = false;
                    delete button.dataset.busy;
                }
            };

            button.addEventListener('click', handler);
            listeners.push({ button, handler });
        }

        group.appendChild(button);
    });

    tableElement.parentNode.insertBefore(element, tableElement);

    return {
        element,
        destroy() {
            listeners.forEach(({ button, handler }) => {
                button.removeEventListener('click', handler);
            });
            listeners.length = 0;
            element.remove();
        }
    };
};
