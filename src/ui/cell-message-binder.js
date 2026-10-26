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
        enabled = true, floatingMessagesByField = new Map(),
        validationErrors = true, lookupDescriptions = true, largeTextPreviews = true } = {}) {
        this.table = table;
        this.tableElement = tableElement;
        this.crudHelper = crudHelper;
        this.floatingMessage = floatingMessage;
        this.enabled = enabled !== false;
        this.destroyed = false;
        this.floatingMessagesByField = floatingMessagesByField;
        this.options = {
            validationErrors: validationErrors !== false,
            lookupDescriptions: lookupDescriptions !== false,
            largeTextPreviews: largeTextPreviews !== false
        };
        this.pointerCell = null;
        this.pointerMessageKey = null;
        this.focusCell = null;
        this.activeSource = null;
        this.suspended = false;
        this.handlePointerMove = event => this._handlePointerMove(event);
        this.handlePointerLeave = () => this._handlePointerLeave();
        this.handleFocusIn = event => this._handleFocusIn(event);
        this.handleFocusOut = event => this._handleFocusOut(event);
        this.handleDocumentFocusIn = event => this._handleDocumentFocusIn(event);
        this.handleLookupMetadataInitialized = () => this._handleLookupMetadataInitialized();

        this.tableElement?.addEventListener?.('pointermove', this.handlePointerMove);
        this.tableElement?.addEventListener?.('pointerleave', this.handlePointerLeave);
        this.tableElement?.addEventListener?.('focusin', this.handleFocusIn);
        this.tableElement?.addEventListener?.('focusout', this.handleFocusOut);
        this.tableElement?.addEventListener?.('amb:lookup-metadata-initialized', this.handleLookupMetadataInitialized);
        globalThis.document?.addEventListener?.('focusin', this.handleDocumentFocusIn);
        this.unsubscribeHandlers = [
            this.crudHelper?.on?.('cell-error', payload => this._handleCellError(payload)),
            this.crudHelper?.on?.('cell-error-cleared', payload => this._handleCellErrorCleared(payload))
        ].filter(Boolean);
    }

    _findCell(target) {
        return target?.closest?.('.tabulator-cell') || null;
    }

    replaceColumnMessages(floatingMessagesByField) {
        if (this.destroyed) return;
        const wasVisible = this.floatingMessage?.element?.classList?.contains('teh-floating-message--visible');
        // hide() also cancels the pending hover timer before options are replaced.
        this.floatingMessage?.hide?.();
        this.floatingMessagesByField = floatingMessagesByField;
        const isCurrentCell = element => element && element.isConnected !== false
            && this.tableElement?.contains?.(element) && this._getRow(element);
        if (!isCurrentCell(this.pointerCell)) this.pointerCell = null;
        if (!isCurrentCell(this.focusCell)) this.focusCell = null;
        if (this.activeSource === 'keyboard' && !this.focusCell) {
            this.activeSource = this.pointerCell ? 'mouse' : null;
        } else if (this.activeSource === 'mouse' && !this.pointerCell) {
            this.activeSource = this.focusCell ? 'keyboard' : null;
        }
        this.pointerMessageKey = null;
        if (this.activeSource === 'mouse' && wasVisible) {
            this.pointerMessageKey = this._getMessageKey(this._render(this.pointerCell, true));
        } else {
            this._renderActive();
        }
    }

    _getRow(cellElement) {
        if (cellElement?.closest?.('.tabulator-calcs, .amb-calc-row')) return null;
        const rowElement = cellElement?.closest?.('.tabulator-row');

        if (!rowElement) return null;
        return this.table?.getRows?.().find(row => row.getElement?.() === rowElement) || null;
    }

    resolveValidationMessage(cellElement) {
        const presentation = this._resolveChannel(cellElement, 'validationErrors', 'Validation error');
        if (!presentation) return null;

        const row = this._getRow(cellElement);
        if (!row) return null;
        const field = cellElement?.getAttribute?.('tabulator-field');
        const key = this._getRowKey(row);
        const message = this.crudHelper?.getCellErrors?.().find(error => {
            return error.key === key && error.field === field;
        })?.message;

        return message ? { type: 'error', ...presentation, message } : null;
    }

    _resolveChannel(cellElement, channel, defaultTitle) {
        if (!this.enabled) return null;
        const field = cellElement?.getAttribute?.('tabulator-field');
        const local = this.floatingMessagesByField.get(field)?.[channel];
        const enabled = typeof local?.enabled === 'boolean' ? local.enabled : this.options[channel];
        if (!enabled) return null;
        return {
            title: typeof local?.title === 'string' ? local.title : defaultTitle,
            ...(typeof local?.className === 'string' ? { className: local.className } : {})
        };
    }

    _getRowKey(row) {
        const data = row?.getData?.() || {};
        const idField = this.crudHelper?.options?.idField || 'id';
        const tempIdField = this.crudHelper?.options?.tempIdField || '_ambTempId';
        const id = data[idField];

        return id === null || id === undefined || id === ''
            ? data[tempIdField]
            : id;
    }

    resolveLookupDescription(cellElement) {
        const presentation = this._resolveChannel(cellElement, 'lookupDescriptions', 'Description');
        if (!presentation) return null;

        const field = cellElement?.dataset?.lookupField;
        const row = field ? this._getRow(cellElement) : null;
        const description = row && getLookupMetadata(row.getData?.(), field)?.current?.description;

        return description ? { type: 'info', ...presentation, message: String(description) } : null;
    }

    resolveLargeTextPreview(cellElement) {
        const presentation = this._resolveChannel(cellElement, 'largeTextPreviews', 'Text');
        if (!presentation) return null;

        const field = cellElement?.dataset?.largeTextField;
        const row = field ? this._getRow(cellElement) : null;
        const value = row?.getData?.()?.[field];

        if (value === null || value === undefined || value === '') return null;

        const maxLength = this.floatingMessagesByField.get(field)?.largeTextPreviews?.maxLength;
        const text = String(value);
        const message = Number.isInteger(maxLength) && maxLength > 0 && text.length > maxLength
            ? `${text.slice(0, maxLength - 1)}…`
            : text;
        return { type: 'info', ...presentation, message };
    }

    resolveCellMessage(cellElement) {
        return this.resolveValidationMessage(cellElement)
            || this.resolveLookupDescription(cellElement)
            || this.resolveLargeTextPreview(cellElement);
    }

    _render(cellElement, immediate) {
        if (this.suspended || !cellElement) {
            this.floatingMessage?.hide?.();
            return null;
        }

        const message = this.resolveCellMessage(cellElement);

        if (!message) {
            this.floatingMessage?.hide?.();
        } else if (immediate) {
            this.floatingMessage?.show?.(cellElement, message);
        } else {
            this.floatingMessage?.scheduleShow?.(cellElement, message);
        }

        return message;
    }

    _renderActive() {
        if (this.activeSource === 'keyboard') {
            this._render(this.focusCell, true);
        } else if (this.activeSource === 'mouse') {
            const message = this._render(this.pointerCell, false);

            this.pointerMessageKey = this._getMessageKey(message);
        } else {
            this.pointerMessageKey = null;
            this.floatingMessage?.hide?.();
        }
    }

    _getMessageKey(message) {
        return message
            ? `${message.type}\u0000${message.title}\u0000${message.message}\u0000${message.className || ''}`
            : null;
    }

    _handlePointerMove(event) {
        const cellElement = this._findCell(event.target);

        if (
            cellElement === this.pointerCell
            && this.activeSource === 'mouse'
            && !this.suspended
            && this._getMessageKey(this.resolveCellMessage(cellElement)) === this.pointerMessageKey
        ) {
            return;
        }

        this.pointerCell = cellElement;
        this.activeSource = cellElement ? 'mouse' : null;
        this.suspended = false;
        this._renderActive();
    }

    _handlePointerLeave() {
        this.pointerCell = null;
        this.pointerMessageKey = null;
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

    _handleLookupMetadataInitialized() {
        if (this.activeSource) this._renderActive();
    }

    _handleCellError({ cell } = {}) {
        const cellElement = cell?.getElement?.();

        if (!cellElement) return;

        cellElement.removeAttribute?.('title');
        if (cellElement === this.focusCell || cellElement === this.pointerCell) this._renderActive();
    }

    _handleCellErrorCleared({ cell } = {}) {
        const cellElement = cell?.getElement?.();

        if (!cellElement) return;
        if (cellElement === this.focusCell || cellElement === this.pointerCell) this._renderActive();
    }

    destroy() {
        this.destroyed = true;
        this.floatingMessagesByField = new Map();
        this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
        this.unsubscribeHandlers = [];
        this.tableElement?.removeEventListener?.('pointermove', this.handlePointerMove);
        this.tableElement?.removeEventListener?.('pointerleave', this.handlePointerLeave);
        this.tableElement?.removeEventListener?.('focusin', this.handleFocusIn);
        this.tableElement?.removeEventListener?.('focusout', this.handleFocusOut);
        this.tableElement?.removeEventListener?.('amb:lookup-metadata-initialized', this.handleLookupMetadataInitialized);
        globalThis.document?.removeEventListener?.('focusin', this.handleDocumentFocusIn);
        this.pointerCell = null;
        this.pointerMessageKey = null;
        this.focusCell = null;
        this.activeSource = null;
        this.floatingMessage?.hide?.();
    }
}
