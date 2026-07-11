import { createFocusTrap } from './focus-trap.js';

const DEFAULT_OPTIONS = {
    title: 'Confirm action',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
};
const CARET_NAVIGATION_KEYS = new Set([
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End'
]);

/**
 * Small promise-based confirmation dialog.
 */
export class ConfirmDialog {
    /**
     * Create a confirmation dialog.
     *
     * @param {object} [options] - Default dialog options.
     * @param {string} [options.title='Confirm action'] - Dialog title.
     * @param {string} [options.confirmText='Confirm'] - Confirm button text.
     * @param {string} [options.cancelText='Cancel'] - Cancel button text.
     */
    constructor(options = {}) {
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options
        };
        this.element = null;
        this.titleElement = null;
        this.messageElement = null;
        this.panelElement = null;
        this.confirmButton = null;
        this.cancelButton = null;
        this.resolveCurrent = null;
        this.previouslyFocusedElement = null;
        this.focusTrap = null;
        this.handleButtonFocus = () => {
            this._clearTextSelection();
        };
        this.handleButtonKeyDown = event => {
            if (!CARET_NAVIGATION_KEYS.has(event.key)) return;

            event.preventDefault();
            this._clearTextSelection();
        };
        this.handleKeyDown = event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                this._close(false);
                return;
            }

            if (event.key === 'Tab') {
                this.focusTrap?.handleKeydown(event);
            }
        };
    }

    _ensureElement() {
        if (this.element) return;

        this.element = document.createElement('div');
        this.element.className = 'teh-confirm-dialog';
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-modal', 'true');

        this.panelElement = document.createElement('div');
        this.panelElement.className = 'teh-confirm-dialog__panel';
        this.panelElement.tabIndex = -1;
        this.panelElement.setAttribute('contenteditable', 'false');

        this.titleElement = document.createElement('h2');
        this.titleElement.className = 'teh-confirm-dialog__title';

        this.messageElement = document.createElement('p');
        this.messageElement.className = 'teh-confirm-dialog__message';

        const actions = document.createElement('div');
        actions.className = 'teh-confirm-dialog__actions';

        this.cancelButton = document.createElement('button');
        this.cancelButton.type = 'button';
        this.cancelButton.className = 'teh-confirm-dialog__button teh-confirm-dialog__button--cancel';
        this._prepareButton(this.cancelButton);
        this.cancelButton.addEventListener('click', () => {
            this._close(false);
        });

        this.confirmButton = document.createElement('button');
        this.confirmButton.type = 'button';
        this.confirmButton.className = 'teh-confirm-dialog__button teh-confirm-dialog__button--confirm';
        this._prepareButton(this.confirmButton);
        this.confirmButton.addEventListener('click', () => {
            this._close(true);
        });

        actions.append(this.cancelButton, this.confirmButton);
        this.panelElement.append(this.titleElement, this.messageElement, actions);
        this.element.append(this.panelElement);
        document.body.appendChild(this.element);

        this.focusTrap = createFocusTrap({
            container: () => this.panelElement,
            getElements: () => [this.cancelButton, this.confirmButton],
            initialFocus: () => this.cancelButton,
            restoreFocusTo: () => this.previouslyFocusedElement,
            fallbackFocus: () => this.panelElement
        });
    }

    _prepareButton(button) {
        button.setAttribute('contenteditable', 'false');
        button.setAttribute('unselectable', 'on');
        button.addEventListener('focus', this.handleButtonFocus);
        button.addEventListener('keydown', this.handleButtonKeyDown);
    }

    _clearTextSelection() {
        const selection = typeof window !== 'undefined' && window.getSelection
            ? window.getSelection()
            : null;

        if (selection && typeof selection.removeAllRanges === 'function') {
            selection.removeAllRanges();
        }
    }

    _focusInitialElement() {
        this.focusTrap?.activate();
    }

    _restoreFocus() {
        this.focusTrap?.deactivate();
        this.previouslyFocusedElement = null;
    }

    _close(result) {
        if (!this.resolveCurrent) return;

        const resolve = this.resolveCurrent;

        this.resolveCurrent = null;
        document.removeEventListener('keydown', this.handleKeyDown);

        if (this.element) {
            this.element.classList.remove('teh-confirm-dialog--visible');
        }

        resolve(result);
        this._restoreFocus();
    }

    /**
     * Show a confirmation dialog.
     *
     * @param {object} options - Dialog content.
     * @param {string} [options.title] - Dialog title override.
     * @param {string} [options.message] - Dialog message.
     * @param {string} [options.confirmText] - Confirm button text override.
     * @param {string} [options.cancelText] - Cancel button text override.
     * @returns {Promise<boolean>} True when confirmed, false when canceled.
     */
    confirm(options = {}) {
        if (this.resolveCurrent) {
            this._close(false);
        }

        const dialogOptions = {
            ...this.options,
            ...options
        };

        this._ensureElement();
        this.previouslyFocusedElement = document.activeElement || null;

        this.titleElement.textContent = dialogOptions.title;
        this.messageElement.textContent = dialogOptions.message || '';
        this.confirmButton.textContent = dialogOptions.confirmText;
        this.cancelButton.textContent = dialogOptions.cancelText;
        this.element.classList.add('teh-confirm-dialog--visible');
        document.addEventListener('keydown', this.handleKeyDown);

        return new Promise(resolve => {
            this.resolveCurrent = resolve;
            this._focusInitialElement();
        });
    }

    /**
     * Remove the dialog element and cancel any pending confirmation.
     *
     * @returns {void}
     */
    destroy() {
        if (this.resolveCurrent) {
            this._close(false);
        }

        if (!this.element) return;

        this.element.remove();
        this.element = null;
        this.titleElement = null;
        this.messageElement = null;
        this.panelElement = null;
        this.confirmButton = null;
        this.cancelButton = null;
        this.previouslyFocusedElement = null;
        this.focusTrap = null;
    }
}
