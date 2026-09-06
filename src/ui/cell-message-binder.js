import { getLookupMetadata } from '../lib/lookup-metadata.js';

/**
 * Owns contextual cell messages for validation, lookup descriptions and
 * large-text previews across pointer and keyboard interactions.
 *
 * @private
 * @internal
 */
export class CellMessageBinder {
    constructor({ table, tableElement = table?.element, crudHelper, floatingMessage,
        validationErrors = true, lookupDescriptions = true, largeTextPreviews = true } = {}) {
        this.table = table;
        this.tableElement = tableElement;
        this.crudHelper = crudHelper;
        this.floatingMessage = floatingMessage;
        this.options = {
            validationErrors: validationErrors !== false,
            lookupDescriptions: lookupDescriptions !== false,
            largeTextPreviews: largeTextPreviews !== false
        };
        this.validationMessages = new WeakMap();
        this.pointerCell = null;
        this.focusCell = null;
        this.activeSource = null;
        this.suspended = false;
        this.handlePointerMove = event => this._handlePointerMove(event);
        this.handlePointerLeave = () => this._handlePointerLeave();
        this.handleFocusIn = event => this._handleFocusIn(event);
        this.handleFocusOut = event => this._handleFocusOut(event);
        this.handleDocumentFocusIn = event => this._handleDocumentFocusIn(event);

        this.tableElement?.addEventListener?.('pointermove', this.handlePointerMove);
        this.tableElement?.addEventListener?.('pointerleave', this.handlePointerLeave);
        this.tableElement?.addEventListener?.('focusin', this.handleFocusIn);
        this.tableElement?.addEventListener?.('focusout', this.handleFocusOut);
        globalThis.document?.addEventListener?.('focusin', this.handleDocumentFocusIn);
        this.unsubscribeHandlers = [
            this.crudHelper?.on?.('cell-error', payload => this._handleCellError(payload)),
            this.crudHelper?.on?.('cell-error-cleared', payload => this._handleCellErrorCleared(payload))
        ].filter(Boolean);
    }

    _findCell(target) {
        return target?.closest?.('.tabulator-cell') || null;
    }

    _getRow(cellElement) {
        const rowElement = cellElement?.closest?.('.tabulator-row');

        if (!rowElement) return null;
        if (typeof this.table?.getRow === 'function') return this.table.getRow(rowElement) || null;

        return this.table?.getRows?.().find(row => row.getElement?.() === rowElement) || null;
    }

    resolveValidationMessage(cellElement) {
        if (!this.options.validationErrors) return null;

        const message = this.validationMessages.get(cellElement);

        return message ? { type: 'error', title: 'Validation error', message } : null;
    }

    resolveLookupDescription(cellElement) {
        if (!this.options.lookupDescriptions) return null;

        const field = cellElement?.dataset?.lookupField;
        const row = field ? this._getRow(cellElement) : null;
        const description = row && getLookupMetadata(row.getData?.(), field)?.current?.description;

        return description ? { type: 'info', title: 'Description', message: String(description) } : null;
    }

    resolveLargeTextPreview(cellElement) {
        if (!this.options.largeTextPreviews) return null;

        const field = cellElement?.dataset?.largeTextField;
        const row = field ? this._getRow(cellElement) : null;
        const value = row?.getData?.()?.[field];

        return value === null || value === undefined || value === ''
            ? null
            : { type: 'info', title: 'Text', message: String(value) };
    }

    resolveCellMessage(cellElement) {
        return this.resolveValidationMessage(cellElement)
            || this.resolveLookupDescription(cellElement)
            || this.resolveLargeTextPreview(cellElement);
    }

    _render(cellElement, immediate) {
        if (this.suspended || !cellElement) {
            this.floatingMessage?.hide?.();
            return;
        }

        const message = this.resolveCellMessage(cellElement);

        if (!message) {
            this.floatingMessage?.hide?.();
        } else if (immediate) {
            this.floatingMessage?.show?.(cellElement, message);
        } else {
            this.floatingMessage?.scheduleShow?.(cellElement, message);
        }
    }

    _renderActive() {
        if (this.activeSource === 'keyboard') this._render(this.focusCell, true);
        else if (this.activeSource === 'mouse') this._render(this.pointerCell, false);
        else this.floatingMessage?.hide?.();
    }

    _handlePointerMove(event) {
        const cellElement = this._findCell(event.target);

        this.pointerCell = cellElement;
        this.activeSource = cellElement ? 'mouse' : null;
        this.suspended = false;
        this._renderActive();
    }

    _handlePointerLeave() {
        this.pointerCell = null;
        if (this.activeSource !== 'mouse') return;

        this.activeSource = this.focusCell ? 'keyboard' : null;
        this._renderActive();
    }

    _handleFocusIn(event) {
        const cellElement = this._findCell(event.target);

        if (!cellElement) return;

        this.focusCell = cellElement;
        this.activeSource = 'keyboard';
        this.suspended = false;
        this._renderActive();
    }

    _handleFocusOut(event) {
        const currentCell = this._findCell(event.target);

        if (!currentCell || currentCell.contains?.(event.relatedTarget)) return;

        this.focusCell = null;
        if (this.activeSource !== 'keyboard') return;

        this.activeSource = this.pointerCell ? 'mouse' : null;
        this._renderActive();
    }

    _handleDocumentFocusIn(event) {
        const target = event.target;
        const dialog = target?.closest?.('[role="dialog"], .amb-lookup-dialog, .amb-large-text-editor');

        if (!dialog || this.tableElement?.contains?.(target)) return;

        this.suspended = true;
        this.floatingMessage?.hide?.();
    }

    _handleCellError({ cell, message } = {}) {
        const cellElement = cell?.getElement?.();

        if (!cellElement) return;

        cellElement.removeAttribute?.('title');
        if (this.options.validationErrors) this.validationMessages.set(cellElement, message);
        if (cellElement === this.focusCell || cellElement === this.pointerCell) this._renderActive();
    }

    _handleCellErrorCleared({ cell } = {}) {
        const cellElement = cell?.getElement?.();

        if (!cellElement) return;

        this.validationMessages.delete(cellElement);
        if (cellElement === this.focusCell || cellElement === this.pointerCell) this._renderActive();
    }

    destroy() {
        this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
        this.unsubscribeHandlers = [];
        this.tableElement?.removeEventListener?.('pointermove', this.handlePointerMove);
        this.tableElement?.removeEventListener?.('pointerleave', this.handlePointerLeave);
        this.tableElement?.removeEventListener?.('focusin', this.handleFocusIn);
        this.tableElement?.removeEventListener?.('focusout', this.handleFocusOut);
        globalThis.document?.removeEventListener?.('focusin', this.handleDocumentFocusIn);
        this.pointerCell = null;
        this.focusCell = null;
        this.activeSource = null;
        this.floatingMessage?.hide?.();
    }
}
