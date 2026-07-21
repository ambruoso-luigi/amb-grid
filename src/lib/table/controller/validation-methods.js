/**
 * Creates the AMB-aware validation methods exposed by the public controller.
 *
 * Validation is performed by the AMB Grid CRUD layer because column rules,
 * error tracking and validation reports belong to the AMB-managed workflow.
 * The similarly named method of the underlying table engine is intentionally
 * not used.
 *
 * @param {object} context - Required method dependencies.
 * @param {CrudHelper} context.crud
 *   AMB Grid CRUD and validation layer.
 * @returns {object} Validation methods for the flat controller API.
 * @private
 * @internal
 */
export const createValidationMethods = ({ crud }) => ({
    /**
     * Validates the AMB-managed rows.
     *
     * The supplied options are forwarded unchanged to the CRUD validation
     * layer. Validation can update AMB Grid error tracking and visual error
     * markers, but it does not change row lifecycle state, original snapshots
     * or save-payload classification.
     *
     * This public controller method intentionally overrides the similarly named
     * engine operation so application code receives the AMB Grid validation
     * report.
     *
     * @param {object} [options] - AMB Grid validation options.
     * @param {boolean} [options.includeDeleted=false]
     *   Include rows marked for deletion in the technical validation report.
     * @returns {{isValid: boolean, rows: object[], errors: object[]}}
     *   AMB Grid validation report.
     */
    validate(...args) {
        return crud.validateAll(...args);
    }
});
