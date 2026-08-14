export const countPrintProducts = values => {
    return values.filter(value => String(value || '').toLowerCase().includes('print')).length;
};
