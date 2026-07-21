import { navigateEditableCellAfterClose } from './shared.js';

const DEFAULT_TOGGLE_KEYS = [' '];
const DEFAULT_CHECKED_KEYS = ['1', 'y', 'Y', 's', 'S'];
const DEFAULT_UNCHECKED_KEYS = ['0', 'n', 'N'];

const normalizeKeyList = (keys, fallback) => {
    const value = keys === undefined ? fallback : keys;

    return Array.isArray(value) ? value.map(String) : [String(value)];
};

const keyMatches = (event, keys) => keys.includes(event.key);

    /**
     * Checkbox editor. Saves `checkedValue` or `uncheckedValue`.
     *
     * Keyboard behavior: `Space` and configured toggle keys change the
     * current checkbox state, configured checked/unchecked keys force a state,
     * `Enter` confirms, `Escape` cancels, and `Tab`/`Shift+Tab` confirm and
     * navigate without an extra toggle.
     *
     * @param {object} [options] - Checkbox editor options.
     * @param {*} [options.checkedValue=true] - Value saved for checked state.
     * @param {*} [options.uncheckedValue=false] - Value saved for unchecked state.
     * @param {string} [options.checkedLabel] - Optional label shown while checked.
     * @param {string} [options.uncheckedLabel] - Optional label shown while unchecked.
     * @param {string[]} [options.toggleKeys=[' ']] - Keys that toggle the current checkbox state.
     * @param {string[]} [options.checkedKeys=['1','y','Y','s','S']] - Keys that force checked state.
     * @param {string[]} [options.uncheckedKeys=['0','n','N']] - Keys that force unchecked state.
     * @returns {Function} Grid editor function compatible with the internal table engine.
     */
export function checkbox(options = {}) {
        const hasCheckedLabel = Object.prototype.hasOwnProperty.call(options, 'checkedLabel');
        const hasUncheckedLabel = Object.prototype.hasOwnProperty.call(options, 'uncheckedLabel');
        const hasAnyLabel = hasCheckedLabel || hasUncheckedLabel;
        const normalizedOptions = {
            checkedValue: true,
            uncheckedValue: false,
            checkedLabel: '',
            uncheckedLabel: '',
            toggleKeys: DEFAULT_TOGGLE_KEYS,
            checkedKeys: DEFAULT_CHECKED_KEYS,
            uncheckedKeys: DEFAULT_UNCHECKED_KEYS,
            ...options
        };
        const keyOptions = {
            toggleKeys: normalizeKeyList(options.toggleKeys, DEFAULT_TOGGLE_KEYS),
            checkedKeys: normalizeKeyList(options.checkedKeys, DEFAULT_CHECKED_KEYS),
            uncheckedKeys: normalizeKeyList(options.uncheckedKeys, DEFAULT_UNCHECKED_KEYS)
        };

        const editor = (cell, onRendered, success, cancel) => {
            const container = document.createElement('label');
            const input = document.createElement('input');
            const label = hasAnyLabel ? document.createElement('span') : null;
            const initialValue = cell.getValue();
            const initialChecked = initialValue === normalizedOptions.checkedValue;
            let closed = false;

            container.className = hasAnyLabel
                ? 'amb-checkbox-editor'
                : 'amb-checkbox-editor amb-checkbox-editor--no-label';
            input.className = 'amb-checkbox-editor__input';
            input.type = 'checkbox';
            input.checked = initialChecked;

            if (label) {
                label.className = 'amb-checkbox-editor__label';
            }

            const getValue = () => {
                return input.checked
                    ? normalizedOptions.checkedValue
                    : normalizedOptions.uncheckedValue;
            };

            const updateLabel = () => {
                if (!label) return;

                label.textContent = input.checked
                    ? normalizedOptions.checkedLabel
                    : normalizedOptions.uncheckedLabel;
            };

            const setChecked = checked => {
                input.checked = checked;
                updateLabel();
            };

            const closeWithSuccess = direction => {
                if (closed) return;

                closed = true;
                success(getValue());

                if (direction) {
                    navigateEditableCellAfterClose(cell, direction);
                }
            };

            const closeWithCancel = () => {
                if (closed) return;

                setChecked(initialChecked);
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
                    return;
                }

                if (event.key === 'Tab') {
                    event.preventDefault();
                    event.stopPropagation();

                    if (typeof event.stopImmediatePropagation === 'function') {
                        event.stopImmediatePropagation();
                    }

                    closeWithSuccess(event.shiftKey ? 'prev' : 'next');
                    return;
                }

                if (keyMatches(event, keyOptions.toggleKeys)) {
                    event.preventDefault();
                    setChecked(!input.checked);
                    return;
                }

                if (keyMatches(event, keyOptions.checkedKeys)) {
                    event.preventDefault();
                    setChecked(true);
                    return;
                }

                if (keyMatches(event, keyOptions.uncheckedKeys)) {
                    event.preventDefault();
                    setChecked(false);
                }
            });
            input.addEventListener('blur', closeWithSuccess);

            if (label) {
                container.append(input, label);
            } else {
                container.append(input);
            }

            onRendered(() => {
                input.focus();
            });

            return container;
        };
        editor._ambEditorType = 'checkbox';
        editor._ambCheckboxConfig = {
            checkedValue: normalizedOptions.checkedValue,
            uncheckedValue: normalizedOptions.uncheckedValue
        };

        return editor;
}
