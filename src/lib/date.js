const DATE_FORMAT_INPUT_ALIASES = {
    'dd/mm/yyyy': ['dd/mm/yyyy'],
    'dd-mm-yyyy': ['dd-mm-yyyy'],
    'dd.mm.yyyy': ['dd.mm.yyyy'],
    'mm/dd/yyyy': ['mm/dd/yyyy'],
    'mm-dd-yyyy': ['mm-dd-yyyy'],
    'yyyy-mm-dd': ['yyyy-mm-dd'],
    'yyyy/mm/dd': ['yyyy/mm/dd'],
    yyyymmdd: ['yyyymmdd'],
    it: ['dd/mm/yyyy'],
    iso: ['yyyy-mm-dd'],
    legacy: ['yyyymmdd']
};

const normalizeMode = options => {
    if (options.mode) return options.mode;
    if (options.picker === true) return 'manualWithPickerButton';

    return 'manualWithPickerButton';
};

const getInputFormats = options => {
    if (Array.isArray(options.inputFormats) && options.inputFormats.length > 0) {
        return options.inputFormats;
    }

    return DATE_FORMAT_INPUT_ALIASES[options.editFormat]
        || DATE_FORMAT_INPUT_ALIASES[options.format]
        || [options.editFormat || options.format];
};

/**
 * Date helper utilities.
 *
 * @namespace AMB.date
 */
export const date = {
    /**
     * Create a shared date configuration for formatter, editor, validator, and parser.
     *
     * `format` is a shorthand for display and edit formats. The datepicker
     * helps selection, but AMB Grid keeps manual input, validation, formatting,
     * and payload normalization as separate steps.
     *
     * @param {object} [options] - Date configuration options.
     * @param {string} [options.format='dd/mm/yyyy'] - Shared display/edit format.
     * @param {string} [options.displayFormat] - Formatter output format.
     * @param {string} [options.editFormat] - Editor and validator input format.
     * @param {string[]} [options.inputFormats] - Parser input formats.
     * @param {string} [options.payloadFormat='yyyy-mm-dd'] - Payload date format.
     * @param {'manual'|'manualWithPickerButton'|'pickerOnly'} [options.mode='manualWithPickerButton'] - Date editor mode.
     * @param {string|Date} [options.minDate] - Earliest allowed date.
     * @param {string|Date} [options.maxDate] - Latest allowed date.
     * @param {boolean} [options.allowEmpty=true] - Whether empty values are accepted.
     * @param {'commitRaw'|'cancel'} [options.invalidBehavior='commitRaw'] - Invalid manual input behavior.
     * @param {object} [options.messages] - Date validation messages by category.
     * @returns {{format: string, displayFormat: string, editFormat: string, inputFormats: string[], payloadFormat: string, mode: string, formatter: string, editor: object, validator: object, parser: object, picker: object}}
     */
    createConfig(options = {}) {
        const format = options.format || 'dd/mm/yyyy';
        const displayFormat = options.displayFormat || format;
        const editFormat = options.editFormat || format;
        const payloadFormat = options.payloadFormat || 'yyyy-mm-dd';
        const mode = normalizeMode(options);
        const allowEmpty = options.allowEmpty !== undefined ? options.allowEmpty : true;
        const invalidBehavior = options.invalidBehavior || 'commitRaw';
        const inputFormats = getInputFormats({
            ...options,
            format,
            editFormat
        });

        return {
            format,
            displayFormat,
            editFormat,
            inputFormats,
            payloadFormat,
            mode,
            formatter: displayFormat,
            editor: {
                format: editFormat,
                allowEmpty,
                invalidBehavior,
                minDate: options.minDate,
                maxDate: options.maxDate,
                mode
            },
            validator: {
                format: editFormat,
                allowEmpty,
                minDate: options.minDate,
                maxDate: options.maxDate,
                messages: options.messages
            },
            parser: {
                inputFormats,
                outputFormat: payloadFormat,
                allowEmpty,
                emptyAs: options.emptyAs
            },
            picker: {
                mode,
                format: editFormat,
                minDate: options.minDate,
                maxDate: options.maxDate
            }
        };
    }
};
