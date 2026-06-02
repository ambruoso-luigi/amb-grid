const MESSAGE_TYPES = new Set(['error', 'warning', 'info', 'success']);

export class FloatingMessage {
    constructor(options = {}) {
        this.options = {
            offset: 8,
            hoverDelay: 300,
            ...options
        };
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

    show(targetElement, messageOptions = {}) {
        if (!targetElement) return;

        this._ensureElement();
        this._setType(messageOptions.type);

        this.titleElement.textContent = messageOptions.title || '';
        this.bodyElement.textContent = messageOptions.message || '';

        this._positionNear(targetElement);
        this.element.classList.add('teh-floating-message--visible');
    }

    scheduleShow(targetElement, messageOptions = {}) {
        this._clearShowTimer();

        this.showTimer = window.setTimeout(() => {
            this.showTimer = null;
            this.show(targetElement, messageOptions);
        }, this.options.hoverDelay);
    }

    hide() {
        this._clearShowTimer();

        if (!this.element) return;

        this.element.classList.remove('teh-floating-message--visible');
    }

    destroy() {
        this._clearShowTimer();

        if (!this.element) return;

        this.element.remove();
        this.element = null;
        this.titleElement = null;
        this.bodyElement = null;
    }
}
