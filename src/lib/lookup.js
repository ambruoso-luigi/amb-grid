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

    const clearCache = () => {
        cache.clear();
    };

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

export const lookup = createLookup;
