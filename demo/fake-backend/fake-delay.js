export const delay = (ms = 400) => {
    return new Promise(resolve => {
        globalThis.setTimeout(resolve, ms);
    });
};
