import { containEditorSpatialNavigation, focusInput, getInitialValue, handleEditorCommitCancelKeydown } from './shared.js';

    /**
     * Single-line text editor. While keyboard navigation is enabled, commit/cancel
     * use the table bindings (Enter/Escape by default); otherwise legacy behavior applies.
     *
     * @param {object} [options] - Text editor options.
     * @param {boolean} [options.trim=false] - Trim leading and trailing whitespace before saving.
     * @param {boolean} [options.uppercase=false] - Convert input to uppercase while editing.
     * @param {boolean} [options.lowercase=false] - Convert input to lowercase while editing.
     * @param {number} [options.maxLength] - Native input maximum length.
     * @param {boolean} [options.selectOnFocus=false] - Select the full value when editing starts.
     * @returns {Function} Grid editor function compatible with the internal table engine.
     */
export function text(options = {}) {
        return (cell, onRendered, success, cancel) => {
            const input = document.createElement('input');

            input.type = 'text';
            input.className = 'amb-cell-editor';
            input.value = getInitialValue(cell);

            if (options.maxLength !== undefined) {
                input.maxLength = options.maxLength;
            }

            const normalizeInputValue = () => {
                if (options.uppercase) {
                    input.value = input.value.toUpperCase();
                }

                if (options.lowercase) {
                    input.value = input.value.toLowerCase();
                }
            };

            const getValue = () => {
                return options.trim ? input.value.trim() : input.value;
            };

            let closed = false;
            const closeWithSuccess = () => {
                if (closed) return;
                closed = true;
                success(getValue());
            };
            const closeWithCancel = () => {
                if (closed) return;
                closed = true;
                cancel();
            };

            input.addEventListener('input', normalizeInputValue);
            input.addEventListener('keydown', event => {
                containEditorSpatialNavigation(event);
                handleEditorCommitCancelKeydown({
                    cell,
                    event,
                    onCommit: closeWithSuccess,
                    onCancel: closeWithCancel
                });
            });
            input.addEventListener('blur', () => {
                closeWithSuccess();
            });

            focusInput(input, onRendered, {
                selectOnFocus: options.selectOnFocus === true
            });
            return input;
        };
}
