import database from './database.json' with { type: 'json' };
import { delay } from './fake-delay.js';

const clone = value => structuredClone(value);

const state = {
    statuses: clone(database.statuses),
    starships: clone(database.starships)
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

const getInsertedStarship = item => {
    return clone(item);
};

const getUpdatedStarship = change => {
    return clone(change.after || change);
};

const getNextStarshipId = () => {
    const maxId = state.starships.reduce((max, item) => {
        return typeof item.id === 'number' && item.id > max ? item.id : max;
    }, 0);

    return maxId + 1;
};

const hasRegistryDuplicate = payload => {
    const changes = payload.changes || {};
    const deletedIds = new Set((changes.deleted || []).map(change => getChangeId(change)));
    const pendingById = new Map();

    (changes.updated || []).forEach(change => {
        const starship = getUpdatedStarship(change);

        pendingById.set(getChangeId(starship), starship);
    });

    (changes.inserted || []).forEach(item => {
        const starship = getInsertedStarship(item);

        pendingById.set(getChangeId(starship), starship);
    });

    const candidates = [
        ...state.starships
            .filter(item => !deletedIds.has(item.id))
            .map(item => pendingById.get(getChangeId(item)) || item),
        ...(changes.inserted || []).map(getInsertedStarship)
            .filter(item => !state.starships.some(existing => getChangeId(existing) === getChangeId(item)))
    ];
    const seen = new Map();

    for (const item of candidates) {
        const registryCode = normalizeCode(item.registryCode);

        if (!registryCode) continue;

        if (seen.has(registryCode) && seen.get(registryCode) !== getChangeId(item)) {
            return {
                id: getChangeId(item),
                field: 'registryCode',
                message: 'Registry code already exists'
            };
        }

        seen.set(registryCode, getChangeId(item));
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

    async getStarships() {
        await delay();

        return clone(state.starships);
    },

    async saveStarshipChanges(payload) {
        await delay(700);

        const changes = payload.changes || {};
        const missingDelete = (changes.deleted || []).find(change => {
            return !state.starships.some(item => getChangeId(item) === getChangeId(change));
        });

        if (missingDelete) {
            return {
                ok: false,
                type: 'not-found',
                errors: [
                    {
                        id: getChangeId(missingDelete),
                        message: 'Starship not found'
                    }
                ]
            };
        }

        const duplicate = hasRegistryDuplicate(payload);

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
            const index = state.starships.findIndex(item => getChangeId(item) === id);

            if (index === -1) return;

            const [deleted] = state.starships.splice(index, 1);
            saved.deleted.push(clone(deleted));
        });

        (changes.updated || []).forEach(change => {
            const starship = getUpdatedStarship(change);
            const index = state.starships.findIndex(item => getChangeId(item) === getChangeId(starship));

            if (index === -1) return;

            state.starships[index] = starship;
            saved.updated.push(clone(starship));
        });

        (changes.inserted || []).forEach(item => {
            const starship = getInsertedStarship(item);
            const tempId = starship._ambTempId;

            if (starship.id === null || starship.id === undefined || starship.id === '') {
                starship.id = getNextStarshipId();

                if (tempId) {
                    generatedIds.push({
                        tempId,
                        id: starship.id
                    });
                } else {
                    unmappedInserted.push({
                        id: starship.id,
                        reason: 'missing-temp-id'
                    });
                }
            }

            delete starship._ambTempId;
            state.starships.push(starship);
            saved.inserted.push(clone(starship));
        });

        return {
            ok: true,
            generatedIds,
            unmappedInserted,
            saved
        };
    }
};
