export class CellMessageBinder {
    constructor(crudHelper, floatingMessage, options = {}) {
        this.crudHelper = crudHelper;
        this.floatingMessage = floatingMessage;
        this.options = {
            defaultTitle: 'Validation error',
            type: 'error',
            enabled: true,
            ...options
        };
        this.options.enabled = this.options.enabled !== false;
        this.cellListeners = new Map();
        this.unsubscribeHandlers = [
            this.crudHelper.on('cell-error', payload => {
                this._handleCellError(payload);
            }),
            this.crudHelper.on('cell-error-cleared', payload => {
                this._handleCellErrorCleared(payload);
            })
        ];
    }

    _handleCellError({ cell, message }) {
        const cellElement = cell && cell.getElement();

        if (!cellElement) return;

        cellElement.removeAttribute('title');

        if (!this.options.enabled) return;

        const existingListeners = this.cellListeners.get(cellElement);

        if (existingListeners) {
            existingListeners.message = message;
            return;
        }

        const listeners = {
            message,
            mouseenter: () => {
                this.floatingMessage.scheduleShow(cellElement, {
                    type: this.options.type,
                    title: this.options.defaultTitle,
                    message: listeners.message
                });
            },
            mouseleave: () => {
                this.floatingMessage.hide();
            }
        };

        cellElement.addEventListener('mouseenter', listeners.mouseenter);
        cellElement.addEventListener('mouseleave', listeners.mouseleave);
        this.cellListeners.set(cellElement, listeners);
    }

    _handleCellErrorCleared({ cell }) {
        this.floatingMessage.hide();

        const cellElement = cell && cell.getElement();

        this._removeCellListeners(cellElement);
    }

    _removeCellListeners(cellElement) {
        const listeners = cellElement && this.cellListeners.get(cellElement);

        if (!cellElement || !listeners) return;

        cellElement.removeEventListener('mouseenter', listeners.mouseenter);
        cellElement.removeEventListener('mouseleave', listeners.mouseleave);
        this.cellListeners.delete(cellElement);
    }

    destroy() {
        this.unsubscribeHandlers.forEach(unsubscribe => {
            unsubscribe();
        });
        this.unsubscribeHandlers = [];

        this.cellListeners.forEach((listeners, cellElement) => {
            cellElement.removeEventListener('mouseenter', listeners.mouseenter);
            cellElement.removeEventListener('mouseleave', listeners.mouseleave);
        });
        this.cellListeners.clear();
        this.floatingMessage.hide();
    }
    
}
