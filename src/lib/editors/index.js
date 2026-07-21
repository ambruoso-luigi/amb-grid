import { autocomplete } from './autocomplete-editor.js';
import { checkbox } from './checkbox-editor.js';
import { date } from './date-editor.js';
import { largeText } from './large-text-editor.js';
import { lookup } from './lookup-editor.js';
import { decimal, integer } from './number-editors.js';
import { select } from './select-editor.js';
import { text } from './text-editor.js';

/**
 * Editor factories for AMB Grid columns, compatible with the internal table engine.
 *
 * @namespace editors
 */
export const editors = {
    text,
    integer,
    decimal,
    date,
    checkbox,
    select,
    autocomplete,
    lookup,
    largeText
};
