const metadataByEditor = new WeakMap();

const canOwnMetadata = editor => {
    return (typeof editor === 'function' || typeof editor === 'object')
        && editor !== null;
};

/**
 * Associates AMB-only column behavior with its editor without adding custom
 * options to the Tabulator column definition.
 *
 * @param {object} definition - Prepared column definition.
 * @param {object} metadata - Internal AMB column metadata.
 * @returns {object} The original definition.
 * @private
 * @internal
 */
export const setAmbColumnMetadata = (definition, metadata) => {
    const editor = definition?.editor;

    if (!canOwnMetadata(editor)) return definition;

    metadataByEditor.set(editor, {
        ...metadataByEditor.get(editor),
        ...metadata
    });

    return definition;
};

/**
 * Returns AMB-only metadata for a prepared or runtime column definition.
 *
 * @param {object|null|undefined} definition - Column definition.
 * @returns {object} Internal metadata.
 * @private
 * @internal
 */
export const getAmbColumnMetadata = definition => {
    const editor = definition?.editor;
    const metadata = canOwnMetadata(editor)
        ? metadataByEditor.get(editor)
        : null;

    if (metadata) return metadata;

    // Retain support for pre-sidecar definitions supplied by an existing
    // runtime while AMB itself no longer emits these keys to Tabulator.
    return {
        interactive: definition?._ambInteractive === true,
        managedColumn: definition?._ambManagedColumn,
        focusSelector: definition?._ambFocusSelector
            || definition?._ambInteractiveSelector,
        keyboardFocusOnly: definition?._ambKeyboardFocusOnly === true
    };
};
