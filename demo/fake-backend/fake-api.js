import database from './database.json' with { type: 'json' };
import { delay } from './fake-delay.js';

const clone = value => structuredClone(value);

const productNames = [
    'Adjustable scanner cradle',
    'Thermal label cartridge',
    'Mobile picking terminal',
    'Stackable storage bin',
    'Safety inspection kit',
    'Compact workbench module',
    'RFID shelf antenna',
    'Pallet wrap dispenser',
    'Maintenance tool trolley',
    'Inventory audit tablet',
    'Heavy-duty barcode printer',
    'Return handling container',
    'Cold-chain sensor pack',
    'Forklift battery monitor',
    'Assembly parts tray',
    'Packing verification scale',
    'Warehouse route badge',
    'Lot tracking clipboard',
    'Service spare cable',
    'Priority dispatch cart'
];

const productNotes = [
    'Used to demonstrate text editing, rollback, and payload updates in the main grid.',
    'Contains operational notes long enough to trigger the large text preview tooltip.',
    'Assigned to a rotating warehouse process so lookup changes are easy to inspect.',
    'Useful for validating numeric, currency, date, checkbox, and lookup behavior together.',
    'Intentionally generic demo item for showing CRUD changes without real catalog data.'
];

const warehouseCities = [
    ['A', 'Milano', 'Nord Distribution Area'],
    ['B', 'Roma', 'Est Spare Parts Hub'],
    ['C', 'Bologna', 'Central Handling Depot'],
    ['D', 'Torino', 'Ovest Returns Area'],
    ['E', 'Napoli', 'South Picking Line'],
    ['F', 'Padova', 'Light Assembly Storage'],
    ['G', 'Genova', 'Port Transit Warehouse'],
    ['H', 'Firenze', 'Service Parts Reserve'],
    ['J', 'Verona', 'Retail Replenishment Hub'],
    ['K', 'Bari', 'Adriatic Dispatch Point'],
    ['L', 'Parma', 'Packaging Materials Store'],
    ['M', 'Catania', 'Regional Maintenance Depot'],
    ['N', 'Pescara', 'Cross Docking Area'],
    ['P', 'Trieste', 'Import Control Warehouse'],
    ['Q', 'Ancona', 'Spare Components Room'],
    ['R', 'Cagliari', 'Island Stock Platform'],
    ['S', 'Perugia', 'Quality Sampling Bay'],
    ['T', 'Brescia', 'Heavy Equipment Yard'],
    ['U', 'Modena', 'Assembly Buffer Storage'],
    ['V', 'Lecce', 'Customer Returns Hub']
];

const warehouseAreas = [
    '',
    'Overflow Storage',
    'Fast Lane',
    'Inspection Area',
    'Night Shift Line',
    'Bulk Reserve',
    'Service Bay',
    'Transit Deck'
];

const createDemoWarehouses = count => {
    return Array.from({ length: count }, (_, index) => {
        const [prefix, city, description] = warehouseCities[index % warehouseCities.length];
        const number = String(index + 1).padStart(2, '0');
        const area = warehouseAreas[Math.floor(index / warehouseCities.length) % warehouseAreas.length];
        const code = `WH-${prefix}${number}`;

        return {
            code,
            description: `${city} ${description}${area ? ` ${area}` : ''}`,
            city,
            label: `${code} - ${city} ${description}${area ? ` ${area}` : ''}`
        };
    });
};

const createItemCode = index => {
    const prefixes = ['A', 'AB', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const prefix = prefixes[index % prefixes.length];
    const numeric = String(index + 1).padStart(prefix.length === 1 ? 3 : 2, '0');

    return `PRD-${prefix}${numeric}`;
};

const createDemoProducts = (count, warehouses, statuses) => {
    const startDate = new Date(Date.UTC(2026, 5, 1));

    return Array.from({ length: count }, (_, index) => {
        const warehouse = warehouses[index % warehouses.length];
        const status = statuses[(index * 7) % statuses.length];
        const checkDate = new Date(startDate);

        checkDate.setUTCDate(startDate.getUTCDate() + (index % 28));

        return {
            id: index + 1,
            itemCode: createItemCode(index),
            productName: `${productNames[index % productNames.length]} ${String(index + 1).padStart(2, '0')}`,
            warehouse: warehouse ? warehouse.label : '',
            status: status ? status.id : '',
            stockQuantity: (index * 17) % 240,
            unitPrice: Number((7.5 + ((index * 13) % 900) / 3).toFixed(2)),
            lastCheckDate: checkDate.toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                timeZone: 'UTC'
            }),
            requiresInspection: index % 4 === 0 || index % 9 === 0,
            notes: `${productNotes[index % productNotes.length]} Batch ${String(index + 1).padStart(3, '0')}.`
        };
    });
};

const state = {
    statuses: clone(database.statuses),
    warehouses: createDemoWarehouses(80),
    products: []
};

state.products = createDemoProducts(100, state.warehouses, state.statuses);

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

const hasItemCodeDuplicate = payload => {
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
        const itemCode = normalizeCode(item.itemCode);

        if (!itemCode) continue;

        if (seen.has(itemCode) && seen.get(itemCode) !== getChangeId(item)) {
            return {
                id: getChangeId(item),
                field: 'itemCode',
                message: 'Item code already exists'
            };
        }

        seen.set(itemCode, getChangeId(item));
    }

    return null;
};

const searchRecords = (records, query, fields) => {
    const q = String(query || '').toLowerCase();

    return clone(records.filter(item => {
        return fields.some(field => {
            return String(item[field] || '').toLowerCase().includes(q);
        });
    }));
};

export const fakeApi = {
    async getStatuses() {
        await delay();

        return clone(state.statuses);
    },

    async searchStatuses(query) {
        await delay();

        return searchRecords(state.statuses, query, ['id', 'description']);
    },

    async getWarehouses() {
        await delay();

        return clone(state.warehouses.map(item => item.label));
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

        const duplicate = hasItemCodeDuplicate(payload);

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
