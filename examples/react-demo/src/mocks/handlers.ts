import { delay, http, HttpResponse } from 'msw';
import { inventoryRows, type InventoryRow } from '../data/inventory';

type InsertedProduct = Omit<InventoryRow, 'id'> & { id?: number; _ambTempId?: string };
type UpdatedProduct = { id: number; after: InventoryRow };
type DeletedProduct = { id: number };
type SaveRequest = {
  inserted?: InsertedProduct[];
  updated?: UpdatedProduct[];
  deleted?: DeletedProduct[];
};

let products = inventoryRows.map((row) => ({ ...row }));
let nextId = Math.max(...products.map(({ id }) => id)) + 1;

const cleanInsertedProduct = (product: InsertedProduct, id: number): InventoryRow => {
  const { _ambTempId: _tempId, ...data } = product;
  return { ...data, id } as InventoryRow;
};

export const handlers = [
  http.get('/api/products', async () => {
    await delay(140);
    return HttpResponse.json({ products: products.map((row) => ({ ...row })) });
  }),

  http.post('/api/products/save', async ({ request }) => {
    const changes = await request.json() as SaveRequest;
    const insertedIds = (changes.inserted ?? []).map((product) => {
      const id = nextId++;
      products.push(cleanInsertedProduct(product, id));
      return { tempId: product._ambTempId, id };
    });

    for (const update of changes.updated ?? []) {
      products = products.map((product) => product.id === update.id ? { ...update.after, id: update.id } : product);
    }

    const deletedIds = new Set((changes.deleted ?? []).map(({ id }) => id));
    products = products.filter(({ id }) => !deletedIds.has(id));

    await delay(180);
    return HttpResponse.json({ insertedIds, products: products.map((row) => ({ ...row })) });
  }),
];
