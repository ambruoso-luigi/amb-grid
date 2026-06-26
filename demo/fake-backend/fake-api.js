import database from './database.json' with { type: 'json' };
import { delay } from './fake-delay.js';

const clone = value => structuredClone(value);

const state = {
    statuses: clone(database.statuses),
    products: clone(database.products)
};

const normalizeCode = value => {
    return String(value || '').trim().toUpperCase();
};

const getChangeId = item => {
    if (!item) return undefined;

    return item.id === null || item.id === undefined || item.id === ''
        ? item._ambTempId
        : item.id;
};

const getInsertedProduct = item => {
    return clone(item);
};

const getUpdatedProduct = change => {
    return clone(change.after || change);
};

const getNextProductId = () => {
    const maxId = state.products.reduce((max, item) => {
        return typeof item.id === 'number' && item.id > max ? item.id : max;
    }, 0);

    return maxId + 1;
};

const hasSkuDuplicate = payload => {
    const changes = payload.changes || {};
    const deletedIds = new Set((changes.deleted || []).map(change => getChangeId(change)));
    const pendingById = new Map();

    (changes.updated || []).forEach(change => {
        const product = getUpdatedProduct(change);

        pendingById.set(getChangeId(product), product);
    });

    (changes.inserted || []).forEach(item => {
        const product = getInsertedProduct(item);

        pendingById.set(getChangeId(product), product);
    });

    const candidates = [
        ...state.products
            .filter(item => !deletedIds.has(item.id))
            .map(item => pendingById.get(getChangeId(item)) || item),
        ...(changes.inserted || []).map(getInsertedProduct)
            .filter(item => !state.products.some(existing => getChangeId(existing) === getChangeId(item)))
    ];
    const seen = new Map();

    for (const item of candidates) {
        const sku = normalizeCode(item.sku);

        if (!sku) continue;

        if (seen.has(sku) && seen.get(sku) !== getChangeId(item)) {
            return {
                id: getChangeId(item),
                field: 'sku',
                message: 'SKU already exists'
            };
        }

        seen.set(sku, getChangeId(item));
    }

    return null;
};

export const fakeApi = {
    async getStatuses() {
        await delay();

        return clone(state.statuses);
    },

    async searchStatuses(query) {
        await delay();

        const q = String(query || '').toLowerCase();

        return clone(state.statuses.filter(item => {
            return item.id.toLowerCase().includes(q)
                || item.description.toLowerCase().includes(q);
        }));
    },

    async getProducts() {
        await delay();

        return clone(state.products);
    },

    async saveProductChanges(payload) {
        await delay(700);

        const changes = payload.changes || {};
        const missingDelete = (changes.deleted || []).find(change => {
            return !state.products.some(item => getChangeId(item) === getChangeId(change));
        });

        if (missingDelete) {
            return {
                ok: false,
                type: 'not-found',
                errors: [
                    {
                        id: getChangeId(missingDelete),
                        message: 'Product not found'
                    }
                ]
            };
        }

        const duplicate = hasSkuDuplicate(payload);

        if (duplicate) {
            return {
                ok: false,
                type: 'validation',
                errors: [duplicate]
            };
        }

        const saved = {
            inserted: [],
            updated: [],
            deleted: []
        };
        const generatedIds = [];
        const unmappedInserted = [];

        (changes.deleted || []).forEach(change => {
            const id = getChangeId(change);
            const index = state.products.findIndex(item => getChangeId(item) === id);

            if (index === -1) return;

            const [deleted] = state.products.splice(index, 1);
            saved.deleted.push(clone(deleted));
        });

        (changes.updated || []).forEach(change => {
            const product = getUpdatedProduct(change);
            const index = state.products.findIndex(item => getChangeId(item) === getChangeId(product));

            if (index === -1) return;

            state.products[index] = product;
            saved.updated.push(clone(product));
        });

        (changes.inserted || []).forEach(item => {
            const product = getInsertedProduct(item);
            const tempId = product._ambTempId;

            if (product.id === null || product.id === undefined || product.id === '') {
                product.id = getNextProductId();

                if (tempId) {
                    generatedIds.push({
                        tempId,
                        id: product.id
                    });
                } else {
                    unmappedInserted.push({
                        id: product.id,
                        reason: 'missing-temp-id'
                    });
                }
            }

            delete product._ambTempId;
            state.products.push(product);
            saved.inserted.push(clone(product));
        });

        return {
            ok: true,
            generatedIds,
            unmappedInserted,
            saved
        };
    }
};
