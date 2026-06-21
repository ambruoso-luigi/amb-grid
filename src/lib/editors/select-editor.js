import { createSelectOption, getInitialValue, normalizeSelectOption } from './shared.js';

    /**
     * Native select editor. Saves the selected option value as a string.
     *
     * @param {object} [options] - Select editor options.
     * @param {Array<string|object>} [options.options=[]] - Available options.
     * @param {boolean} [options.allowEmpty=true] - Add an empty option.
     * @param {string} [options.emptyLabel=''] - Label for the empty option.
     * @param {string} [options.valueField='value'] - Value field for object options.
     * @param {string} [options.labelField='label'] - Label field for object options.
     * @returns {Function} Tabulator editor.
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

            select.value = getInitialValue(cell);

            const commit = () => {
                success(select.value);
            };

            select.addEventListener('change', commit);
            select.addEventListener('blur', commit);
            select.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    cancel();
                }
            });

            onRendered(() => {
                select.focus();
            });
            return select;
        };
}
