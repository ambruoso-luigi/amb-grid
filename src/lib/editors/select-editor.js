import {
    containEditorSpatialNavigation,
    createSelectOption,
    getInitialValue,
    handleEditorCommitCancelKeydown,
    normalizeSelectOption,
    scheduleEditorFocusRestore
} from './shared.js';

    /**
     * Native select editor. Saves the selected option value as a string. While
     * keyboard navigation is enabled, commit/cancel use table bindings. On
     * activation the native picker is opened when the browser supports it;
     * arrow-key option browsing remains in the editor until commit or cancel.
     * A browser popup may consume the first `Escape`; its corresponding keyup
     * still cancels the editor when delivered to the native control.
     *
     * @param {object} [options] - Select editor options.
     * @param {Array<string|object>} [options.options=[]] - Available options.
     * @param {boolean} [options.allowEmpty=true] - Add an empty option.
     * @param {string} [options.emptyLabel=''] - Label for the empty option.
     * @param {string} [options.valueField='value'] - Value field for object options.
     * @param {string} [options.labelField='label'] - Label field for object options.
     * @returns {Function} Grid editor function compatible with the internal table engine.
     */
export function select(options = {}) {
        const normalizedOptions = {
            options: [],
            allowEmpty: true,
            emptyLabel: '',
            valueField: 'value',
            labelField: 'label',
            ...options
        };

        return (cell, onRendered, success, cancel) => {
            const select = document.createElement('select');

            select.className = 'amb-cell-editor amb-cell-editor--select';

            if (normalizedOptions.allowEmpty) {
                select.appendChild(createSelectOption({
                    value: '',
                    label: normalizedOptions.emptyLabel
                }));
            }

            normalizedOptions.options.forEach(option => {
                select.appendChild(createSelectOption(
                    normalizeSelectOption(option, normalizedOptions)
                ));
            });

            const initialValue = getInitialValue(cell);
            let draftValue = initialValue;
            let closed = false;
            let keyboardOptionNavigation = false;

            select.value = initialValue;

            const cleanup = () => {
                select.removeEventListener('change', handleChange);
                select.removeEventListener('blur', handleBlur);
                select.removeEventListener('pointerdown', handlePointerDown);
                select.removeEventListener('mousedown', handlePointerDown);
                select.removeEventListener('keydown', handleKeydown);
                select.removeEventListener('keyup', handleKeyup);
            };

            const closeWithSuccess = () => {
                if (closed) return;

                closed = true;
                cleanup();
                success(draftValue);
            };

            const closeWithCancel = ({ restoreFocus = false } = {}) => {
                if (closed) return;

                closed = true;
                draftValue = initialValue;
                select.value = initialValue;
                cleanup();
                cancel();

                if (restoreFocus) scheduleEditorFocusRestore(cell);
            };

            const handleChange = () => {
                draftValue = select.value;
                if (keyboardOptionNavigation) return;

                closeWithSuccess();
                scheduleEditorFocusRestore(cell);
            };

            const handleBlur = () => {
                if (closed || keyboardOptionNavigation) return;

                draftValue = select.value;
                closeWithSuccess();
            };

            const handlePointerDown = () => {
                keyboardOptionNavigation = false;
            };

            const handleKeydown = event => {
                containEditorSpatialNavigation(event);
                if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                    keyboardOptionNavigation = true;
                    return;
                }
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    event.preventDefault();
                    return;
                }
                handleEditorCommitCancelKeydown({
                    cell,
                    event,
                    onCommit: closeWithSuccess,
                    onCancel: closeWithCancel
                });
            };

            const handleKeyup = event => {
                if (event.key !== 'Escape' || closed) return;

                event.preventDefault();
                event.stopPropagation();
                closeWithCancel({ restoreFocus: true });
            };

            select.addEventListener('change', handleChange);
            select.addEventListener('blur', handleBlur);
            select.addEventListener('pointerdown', handlePointerDown);
            select.addEventListener('mousedown', handlePointerDown);
            select.addEventListener('keydown', handleKeydown);
            select.addEventListener('keyup', handleKeyup);

            onRendered(() => {
                select.focus();

                if (typeof select.showPicker !== 'function') return;

                try {
                    select.showPicker();
                } catch {
                    // Browsers may reject picker opening outside a trusted activation.
                }
            });
            return select;
        };
}
