/**
 * Creates the export and printing methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Export methods for the flat controller API.
 * @private
 * @internal
 */
export const createExportMethods = ({ table }) => ({
    /**
     * Returns the current grid data as an HTML table string.
     *
     * Optional arguments can select the row range, include grid styling and
     * override the configured HTML output options.
     *
     * The output follows the current column and export configuration. This
     * method does not create an AMB Grid save payload or modify grid state.
     *
     * @param {...*} args - HTML output arguments.
     * @returns {string} Generated HTML table string.
     */
    getHtml(...args) {
        return table.getHtml(...args);
    },

    /**
     * Generates and downloads grid data using a configured downloader.
     *
     * The download type, file name, downloader options and any additional
     * arguments are forwarded unchanged. The generated output follows the
     * current export and column configuration.
     *
     * This method does not create an AMB Grid save payload or directly modify
     * row data and CRUD state.
     *
     * @param {...*} args - Download type, file name, options and additional arguments.
     * @returns {void} Result of starting the download.
     */
    download(...args) {
        return table.download(...args);
    },

    /**
     * Generates export data and opens it in a new browser tab.
     *
     * Browser handling of the generated content depends on browser
     * configuration and the selected downloader.
     *
     * @param {...*} args - Downloader type, options and additional arguments.
     * @returns {void} Result of opening the generated export.
     */
    downloadToTab(...args) {
        return table.downloadToTab(...args);
    },

    /**
     * Prints grid data using the current print configuration.
     *
     * Optional arguments can control the printed row range and formatting. The
     * operation does not directly modify row data or AMB Grid CRUD state.
     *
     * @param {...*} args - Print range, style and configuration arguments.
     * @returns {void} Result of starting the print operation.
     */
    print(...args) {
        return table.print(...args);
    }
});
