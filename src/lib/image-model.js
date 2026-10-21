const URL_BASE = 'https://amb-grid.invalid/';

const normalizeUrl = value => {
    if (typeof value !== 'string') return null;

    const url = value.trim();
    if (!url) return null;

    try {
        const parsed = new URL(url, URL_BASE);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url : null;
    } catch {
        return null;
    }
};

const normalizeItem = value => {
    const source = typeof value === 'string' ? { src: value } : value;
    if (!source || typeof source !== 'object' || Array.isArray(source)) return null;

    const src = normalizeUrl(source.src);
    if (!src) return null;

    const thumbnail = normalizeUrl(source.thumbnail);
    return {
        src,
        ...(thumbnail ? { thumbnail } : {}),
        alt: typeof source.alt === 'string' ? source.alt : '',
        caption: typeof source.caption === 'string' ? source.caption : ''
    };
};

export const normalizeImages = value => {
    if (Array.isArray(value)) {
        return value.map(item => typeof item === 'string' ? null : normalizeItem(item)).filter(Boolean);
    }

    const item = normalizeItem(value);
    return item ? [item] : [];
};
