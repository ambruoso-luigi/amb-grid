const SPACE = 36 ** 4;
const START = parseInt('X001', 36);

export function generateInventoryItemCode(rows) {
    const occupied = new Set(rows.map(row => String(row.itemCode ?? '').trim().toUpperCase()));

    for (let offset = 0; offset < SPACE; offset += 1) {
        const suffix = ((START + offset) % SPACE).toString(36).toUpperCase().padStart(4, '0');
        const candidate = `PRD-${suffix}`;
        if (!occupied.has(candidate)) return candidate;
    }

    return null;
}
