const MESSAGE_TYPES = new Set(['error', 'warning', 'info', 'success']);

/**
 * Floating message shown near a target element.
 */
export class FloatingMessage {
    /**
     * Create a floating message controller.
     *
     * @param {object} [options] - Message options.
     * @param {number} [options.offset=8] - Vertical offset from the target element in pixels.
     * @param {number} [options.hoverDelay=300] - Delay used by `scheduleShow`, in milliseconds.
     * @param {boolean} [options.enabled=true] - When `false`, no floating message DOM or timers are created.
     */
    constructor(options = {}) {
        this.options = {
            offset: 8,
            hoverDelay: 300,
            enabled: true,
            ...options
        };
        this.options.enabled = this.options.enabled !== false;
        this.element = null;
        this.titleElement = null;
        this.bodyElement = null;
        this.showTimer = null;
    }

    _ensureElement() {
        if (this.element) return;

        this.element = document.createElement('div');
        this.element.className = 'teh-floating-message';
        this.element.setAttribute('role', 'status');

        this.titleElement = document.createElement('div');
        this.titleElement.className = 'teh-floating-message__title';

        this.bodyElement = document.createElement('div');
        this.bodyElement.className = 'teh-floating-message__body';

        this.element.append(this.titleElement, this.bodyElement);
        document.body.appendChild(this.element);
    }

    _setType(type) {
        const normalizedType = MESSAGE_TYPES.has(type) ? type : 'info';

        MESSAGE_TYPES.forEach(messageType => {
            this.element.classList.remove(`teh-floating-message--${messageType}`);
        });

        this.element.classList.add(`teh-floating-message--${normalizedType}`);
    }

    _positionNear(targetElement) {
        const rect = targetElement.getBoundingClientRect();

        this.element.style.top = `${window.scrollY + rect.top - this.options.offset}px`;
        this.element.style.left = `${window.scrollX + rect.left + rect.width / 2}px`;
    }

    _clearShowTimer() {
        if (!this.showTimer) return;

        clearTimeout(this.showTimer);
        this.showTimer = null;
    }

    /**
     * Show a message near a target element.
     *
     * @param {HTMLElement} targetElement - Element used for positioning.
     * @param {object} [messageOptions] - Message content.
     * @param {'error'|'warning'|'info'|'success'} [messageOptions.type='info'] - Visual message type.
     * @param {string} [messageOptions.title] - Message title.
     * @param {string} [messageOptions.message] - Message body.
     * @returns {void}
     */
    show(targetElement, messageOptions = {}) {
        if (!this.options.enabled) return;
        if (!targetElement) return;

        this._ensureElement();
        this._setType(messageOptions.type);

        this.titleElement.textContent = messageOptions.title || '';
        this.bodyElement.textContent = messageOptions.message || '';

        this._positionNear(targetElement);
        this.element.classList.add('teh-floating-message--visible');
    }

    /**
     * Show a message after the configured hover delay.
     *
     * @param {HTMLElement} targetElement - Element used for positioning.
     * @param {object} [messageOptions] - Same options accepted by `show`.
     * @returns {void}
     */
    scheduleShow(targetElement, messageOptions = {}) {
        this._clearShowTimer();

        if (!this.options.enabled) return;

        this.showTimer = window.setTimeout(() => {
            this.showTimer = null;
            this.show(targetElement, messageOptions);
        }, this.options.hoverDelay);
    }

    /**
     * Hide the message and cancel any scheduled display.
     *
     * @returns {void}
     */
    hide() {
        this._clearShowTimer();

        if (!this.element) return;

        this.element.classList.remove('teh-floating-message--visible');
    }

    /**
     * Remove the message element and cancel timers.
     *
     * @returns {void}
     */
    destroy() {
        this._clearShowTimer();

        if (!this.element) return;

        this.element.remove();
        this.element = null;
        this.titleElement = null;
        this.bodyElement = null;
    }
}
