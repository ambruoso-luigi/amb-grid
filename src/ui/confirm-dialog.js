const DEFAULT_OPTIONS = {
    title: 'Confirm action',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
};

export class ConfirmDialog {
    constructor(options = {}) {
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options
        };
        this.element = null;
        this.titleElement = null;
        this.messageElement = null;
        this.confirmButton = null;
        this.cancelButton = null;
        this.resolveCurrent = null;
        this.handleKeyDown = event => {
            if (event.key === 'Escape') {
                this._close(false);
            }
        };
    }

    _ensureElement() {
        if (this.element) return;

        this.element = document.createElement('div');
        this.element.className = 'teh-confirm-dialog';
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-modal', 'true');

        const panel = document.createElement('div');
        panel.className = 'teh-confirm-dialog__panel';

        this.titleElement = document.createElement('h2');
        this.titleElement.className = 'teh-confirm-dialog__title';

        this.messageElement = document.createElement('p');
        this.messageElement.className = 'teh-confirm-dialog__message';

        const actions = document.createElement('div');
        actions.className = 'teh-confirm-dialog__actions';

        this.cancelButton = document.createElement('button');
        this.cancelButton.type = 'button';
        this.cancelButton.className = 'teh-confirm-dialog__button teh-confirm-dialog__button--cancel';
        this.cancelButton.addEventListener('click', () => {
            this._close(false);
        });

        this.confirmButton = document.createElement('button');
        this.confirmButton.type = 'button';
        this.confirmButton.className = 'teh-confirm-dialog__button teh-confirm-dialog__button--confirm';
        this.confirmButton.addEventListener('click', () => {
            this._close(true);
        });

        actions.append(this.cancelButton, this.confirmButton);
        panel.append(this.titleElement, this.messageElement, actions);
        this.element.append(panel);
        document.body.appendChild(this.element);
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
    }

    /**
     * Show a confirmation dialog.
     *
     * @param {{title?: string, message?: string, confirmText?: string, cancelText?: string}} options - Dialog content.
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

        this.titleElement.textContent = dialogOptions.title;
        this.messageElement.textContent = dialogOptions.message || '';
        this.confirmButton.textContent = dialogOptions.confirmText;
        this.cancelButton.textContent = dialogOptions.cancelText;
        this.element.classList.add('teh-confirm-dialog--visible');
        document.addEventListener('keydown', this.handleKeyDown);

        return new Promise(resolve => {
            this.resolveCurrent = resolve;
            this.confirmButton.focus();
        });
    }

    destroy() {
        if (this.resolveCurrent) {
            this._close(false);
        }

        if (!this.element) return;

        this.element.remove();
        this.element = null;
        this.titleElement = null;
        this.messageElement = null;
        this.confirmButton = null;
        this.cancelButton = null;
    }
}
