/**
 * Composes internal AMB Grid controller method groups.
 *
 * Each method name may appear only once. Duplicates are development errors so
 * extracted groups cannot silently override each other.
 *
 * @param {...object|null|undefined} methodGroups - Method groups to compose.
 * @returns {object} Composed method map.
 * @throws {Error} When two groups expose the same method name.
 * @private
 * @internal
 */
export const composeControllerMethods = (...methodGroups) => {
    const composed = {};

    methodGroups.forEach(group => {
        Object.entries(group || {}).forEach(([name, method]) => {
            if (Object.prototype.hasOwnProperty.call(composed, name)) {
                throw new Error(`Duplicate AMB Grid controller method: ${name}`);
            }

            composed[name] = method;
        });
    });

    return composed;
};
