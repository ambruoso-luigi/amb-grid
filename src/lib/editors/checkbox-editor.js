import { getInitialValue } from './shared.js';

    /**
     * Checkbox editor. Saves `checkedValue` or `uncheckedValue`.
     *
     * @param {object} [options] - Checkbox editor options.
     * @param {*} [options.checkedValue=true] - Value saved for checked state.
     * @param {*} [options.uncheckedValue=false] - Value saved for unchecked state.
     * @param {string} [options.checkedLabel='Yes'] - Label shown while checked.
     * @param {string} [options.uncheckedLabel='No'] - Label shown while unchecked.
     * @returns {Function} Tabulator editor.
     */
export function checkbox(options = {}) {
        const normalizedOptions = {
            checkedValue: true,
            uncheckedValue: false,
            checkedLabel: 'Yes',
            uncheckedLabel: 'No',
            ...options
        };

        return (cell, onRendered, success, cancel) => {
            const container = document.createElement('label');
            const input = document.createElement('input');
            const label = document.createElement('span');
            let closed = false;

            container.className = 'amb-checkbox-editor';
            input.className = 'amb-checkbox-editor__input';
            input.type = 'checkbox';
            input.checked = cell.getValue() === normalizedOptions.checkedValue;
            label.className = 'amb-checkbox-editor__label';

            const getValue = () => {
                return input.checked
                    ? normalizedOptions.checkedValue
                    : normalizedOptions.uncheckedValue;
            };

            const updateLabel = () => {
                label.textContent = input.checked
                    ? normalizedOptions.checkedLabel
                    : normalizedOptions.uncheckedLabel;
            };

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

            updateLabel();

            input.addEventListener('change', () => {
                updateLabel();
                closeWithSuccess();
            });
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    closeWithSuccess();
                    return;
                }

                if (event.key === 'Escape') {
                    event.preventDefault();
                    closeWithCancel();
                }
            });
            input.addEventListener('blur', closeWithSuccess);

            container.append(input, label);

            onRendered(() => {
                input.focus();
            });

            return container;
        };
}
