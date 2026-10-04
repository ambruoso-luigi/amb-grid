import { normalizeSelectOption } from './shared.js';

/**
 * Creates an AMB Select editor declaration backed internally by Tabulator List.
 * Values and labels are normalized before the table runtime is created; the
 * public factory continues to accept the same Select options as before.
 *
 * @param {object} [options] - Select editor options.
 * @param {Array<string|object>} [options.options=[]] - Available options.
 * @param {boolean} [options.allowEmpty=true] - Add an empty option.
 * @param {string} [options.emptyLabel=''] - Label for the empty option.
 * @param {string} [options.valueField='value'] - Value field for object options.
 * @param {string} [options.labelField='label'] - Label field for object options.
 * @returns {Function} AMB editor declaration transformed into Tabulator List by the table pipeline.
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
    const editor = () => {
        throw new Error('AMB Select editors must be initialized through AMB.table().');
    };

    editor._ambEditorType = 'select';
    editor._ambSelectConfig = normalizedOptions;

    return editor;
}

/**
 * Converts the public Select option contract into Tabulator List values.
 *
 * @param {object} [options] - Normalized Select options.
 * @returns {Array<{value: string, label: string}>} List values.
 * @private
 * @internal
 */
export const normalizeSelectValues = (options = {}) => {
    const normalizedOptions = {
        options: [],
        allowEmpty: true,
        emptyLabel: '',
        valueField: 'value',
        labelField: 'label',
        ...options
    };
    const values = normalizedOptions.options.map(option => normalizeSelectOption(option, normalizedOptions));

    if (normalizedOptions.allowEmpty) {
        values.unshift({ value: '', label: String(normalizedOptions.emptyLabel ?? '') });
    }

    return values.map(option => ({ value: String(option.value ?? ''), label: String(option.label ?? '') }));
};
