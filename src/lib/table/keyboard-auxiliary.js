const pending = new WeakSet();

export const queueCellAuxiliaryAction = cell => pending.add(cell);
export const consumeCellAuxiliaryAction = cell => {
    if (!pending.has(cell)) return false;
    pending.delete(cell);
    return true;
};
export const clearCellAuxiliaryActionRequest = cell => pending.delete(cell);
