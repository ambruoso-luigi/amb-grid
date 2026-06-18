const DEFAULT_QUERY = '';

const normalizeQuery = query => {
    if (query === null || query === undefined) {
        return DEFAULT_QUERY;
    }

    return String(query);
};

const defaultCacheKey = ({ query }) => {
    return normalizeQuery(query).trim().toLowerCase();
};

const normalizeResult = result => {
    if (result === null || result === undefined) {
        return [];
    }

    return Array.isArray(result) ? result : [];
};

/**
 * Create a data source for the specialized lookup editor.
 *
 * Results are cached by query unless disabled. Editor calls pass `query`,
 * `rowData`, `field`, and `context` to the loader.
 *
 * @param {object} [options] - Lookup options.
 * @param {string} [options.valueField] - Field containing the stored code/value.
 * @param {string} [options.labelField] - Field containing the display label.
 * @param {object} [options.context] - Default context merged into load params.
 * @param {Function} [options.load] - Async or sync loader receiving `{ query, rowData, field, context }`.
 * @param {object} [options.cache] - Cache options.
 * @param {boolean} [options.cache.enabled=true] - Enable in-memory caching.
 * @param {number} [options.cache.ttl] - Cache time to live in milliseconds.
 * @param {Function} [options.cache.key] - Custom cache key function receiving normalized params.
 * @returns {{valueField: string, labelField: string, load: Function, refresh: Function, clearCache: Function}} Lookup instance.
 */
export function createLookup(options = {}) {
    const cache = new Map();
    const cacheOptions = options.cache || {};
    const cacheEnabled = cacheOptions.enabled !== false;
    const hasTtl = cacheOptions.ttl !== undefined && cacheOptions.ttl !== null;
    const loadFn = typeof options.load === 'function' ? options.load : null;
    const keyFn = typeof cacheOptions.key === 'function' ? cacheOptions.key : defaultCacheKey;

    const createParams = (params = {}) => {
        const query = normalizeQuery(params.query);

        return {
            ...params,
            query,
            context: params.context !== undefined ? params.context : options.context
        };
    };

    const getCacheKey = params => {
        return keyFn(params);
    };

    const isExpired = entry => {
        if (!hasTtl) return false;

        return Date.now() - entry.timestamp > cacheOptions.ttl;
    };

    /**
     * Load lookup rows for a query.
     *
     * @param {object} [params] - Load params.
     * @param {string} [params.query=''] - User query text.
     * @param {object} [params.rowData] - Current grid row data, when called by an editor.
     * @param {string} [params.field] - Current grid field, when called by an editor.
     * @param {object} [params.context] - Per-call context overriding the default context.
     * @returns {Promise<Array<object|string>>} Lookup suggestions.
     */
    const load = async (params = {}) => {
        const normalizedParams = createParams(params);

        if (!cacheEnabled) {
            return normalizeResult(loadFn ? await loadFn(normalizedParams) : []);
        }

        const key = getCacheKey(normalizedParams);
        const cached = cache.get(key);

        if (cached && !isExpired(cached)) {
            return cached.data;
        }

        if (cached) {
            cache.delete(key);
        }

        const data = normalizeResult(loadFn ? await loadFn(normalizedParams) : []);

        cache.set(key, {
            data,
            timestamp: Date.now()
        });

        return data;
    };

    /**
     * Clear every cached lookup result.
     *
     * @returns {void}
     */
    const clearCache = () => {
        cache.clear();
    };

    /**
     * Clear one cached result and load it again.
     *
     * @param {object} [params] - Same parameters accepted by `load`.
     * @returns {Promise<object[]>} Fresh lookup rows.
     */
    const refresh = async (params = {}) => {
        const normalizedParams = createParams(params);

        cache.delete(getCacheKey(normalizedParams));

        return load(normalizedParams);
    };

    return {
        valueField: options.valueField,
        labelField: options.labelField,
        load,
        clearCache,
        refresh
    };
}

/**
 * Alias for {@link createLookup}. Exposed as `AMB.lookup(options)`.
 * Use `AMB.lookup` as the primary public API; `createLookup` is the equivalent
 * named export for advanced or direct module usage.
 *
 * @function lookup
 * @param {object} [options] - Lookup options.
 * @returns {object} Lookup instance.
 */
export const lookup = createLookup;
