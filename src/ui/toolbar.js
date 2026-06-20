const DEFAULT_BUTTONS = ['save', 'reload'];

const ICONS = {
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
    `
};

const getTableElement = selector => {
    if (typeof selector === 'string') {
        return document.querySelector(selector);
    }

    return selector || null;
};

export const normalizeToolbarOptions = toolbar => {
    if (!toolbar) {
        return {
            enabled: false,
            buttons: [],
            onSave: null,
            onReload: null
        };
    }

    const options = toolbar === true ? {} : toolbar;

    return {
        enabled: options.enabled !== false,
        buttons: Array.isArray(options.buttons)
            ? options.buttons.filter(button => DEFAULT_BUTTONS.includes(button))
            : [...DEFAULT_BUTTONS],
        onSave: typeof options.onSave === 'function' ? options.onSave : null,
        onReload: typeof options.onReload === 'function' ? options.onReload : null
    };
};

const createButton = (action, callback) => {
    const button = document.createElement('button');
    const icon = document.createElement('span');
    const label = document.createElement('span');

    button.className = `amb-toolbar__button amb-toolbar__button--${action}`;
    button.type = 'button';
    button.dataset.action = action;
    button.disabled = !callback;
    button.setAttribute('aria-label', action === 'save' ? 'Save changes' : 'Reload data');

    icon.className = 'amb-toolbar__button-icon';
    icon.innerHTML = ICONS[action];
    label.className = 'amb-toolbar__button-label';
    label.textContent = action === 'save' ? 'Save' : 'Reload';

    button.append(icon, label);

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

    options.buttons.forEach(action => {
        const callback = action === 'save' ? options.onSave : options.onReload;
        const button = createButton(action, callback);

        if (callback) {
            const handler = async event => {
                const grid = getGrid();

                if (!grid || button.disabled) return;

                button.disabled = true;
                button.dataset.busy = 'true';

                try {
                    if (action === 'save') {
                        await callback({
                            grid,
                            payload: grid.crud.getSavePayload(),
                            event
                        });
                    } else {
                        await callback({ grid, event });
                    }
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
