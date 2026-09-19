const pending = new WeakSet();
const handlers = new WeakMap();

export const queueCellAuxiliaryAction = cell => pending.add(cell);
export const consumeCellAuxiliaryAction = cell => {
    if (!pending.has(cell)) return false;
    pending.delete(cell);
    return true;
};
export const clearCellAuxiliaryActionRequest = cell => pending.delete(cell);
export const registerCellAuxiliaryAction = (cell, handler) => {
    handlers.set(cell, handler);
    return () => { if (handlers.get(cell) === handler) handlers.delete(cell); };
};
export const invokeCellAuxiliaryAction = (cell, context) => {
    const handler = handlers.get(cell);
    if (!handler) return false;
    handler(context);
    return true;
};
