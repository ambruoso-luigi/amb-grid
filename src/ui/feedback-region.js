const SUPPORTED_TYPES = new Set(['success', 'warning', 'error', 'info']);

/**
 * Accessible status region used by AMB Grid and its dialogs.
 */
export class FeedbackRegion {
    /**
     * @param {object} [options] - Feedback region options.
     * @param {string} [options.className] - Additional component class.
     */
    constructor(options = {}) {
        this.extraClassName = options.className || '';
        this.element = document.createElement('div');
        this.titleElement = document.createElement('div');
        this.messageElement = document.createElement('div');

        this.titleElement.className = 'amb-feedback-region__title';
        this.messageElement.className = 'amb-feedback-region__message';
        this.element.append(this.titleElement, this.messageElement);
        this.clear();
    }

    /**
     * Show a feedback message.
     *
     * @param {object} options - Message options.
     * @param {'success'|'warning'|'error'|'info'} [options.type='info'] - Message type.
     * @param {string} [options.title] - Optional message title.
     * @param {string} options.message - Human-readable message.
     * @returns {void}
     */
    show({ type = 'info', title = '', message = '' } = {}) {
        if (!this.element) return;

        const normalizedType = SUPPORTED_TYPES.has(type) ? type : 'info';
        const urgent = normalizedType === 'warning' || normalizedType === 'error';

        this.element.className = [
            'amb-feedback-region',
            this.extraClassName,
            'amb-feedback-region--visible',
            `amb-feedback-region--${normalizedType}`
        ].filter(Boolean).join(' ');
        this.element.hidden = false;
        this.element.setAttribute('role', urgent ? 'alert' : 'status');
        this.element.setAttribute('aria-live', urgent ? 'assertive' : 'polite');
        this.titleElement.textContent = String(title || '');
        this.titleElement.hidden = !title;
        this.messageElement.textContent = String(message || '');
    }

    /**
     * Hide and empty the feedback region.
     *
     * @returns {void}
     */
    clear() {
        if (!this.element) return;

        this.element.className = [
            'amb-feedback-region',
            this.extraClassName
        ].filter(Boolean).join(' ');
        this.element.hidden = true;
        this.element.setAttribute('role', 'status');
        this.element.setAttribute('aria-live', 'polite');
        this.titleElement.textContent = '';
        this.titleElement.hidden = true;
        this.messageElement.textContent = '';
    }

    /**
     * Remove the feedback region from the DOM.
     *
     * @returns {void}
     */
    destroy() {
        if (!this.element) return;

        this.element.remove();
        this.element = null;
        this.titleElement = null;
        this.messageElement = null;
    }
}
