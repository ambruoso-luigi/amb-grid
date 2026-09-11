import { focusCellWithoutEditing, getInitialValue, toCssSize } from './shared.js';
import { createFocusTrap } from '../../ui/focus-trap.js';

let dialogSequence = 0;

    /**
     * Modal textarea editor for long text.
     *
     * Keyboard behavior: `Escape` cancels, `Ctrl+Enter` saves, and the dialog
     * traps `Tab`/`Shift+Tab` across its textarea and actions. Closing restores
     * keyboard focus to the source cell without reopening the editor.
     *
     * @param {object} [options] - Large text editor options.
     * @param {string} [options.title='Edit text'] - Dialog title.
     * @param {number} [options.rows=10] - Textarea row count.
     * @param {string} [options.placeholder=''] - Textarea placeholder.
     * @param {string} [options.saveText='Save'] - Save button text.
     * @param {string} [options.cancelText='Cancel'] - Cancel button text.
     * @param {number|string} [options.width=640] - Panel width.
     * @param {number|string} [options.maxWidth='90vw'] - Panel maximum width.
     * @param {number|string} [options.height='auto'] - Panel height. `auto` keeps the panel content-sized.
     * @param {number|string} [options.textareaHeight=260] - Textarea height.
     * @param {boolean} [options.horizontalScroll=false] - Keep long lines on one line.
     * @param {string} [options.resize='vertical'] - CSS resize value for the textarea.
     * @param {boolean} [options.closeOnBackdropClick=true] - Close the editor when the backdrop is pressed.
     * @returns {Function} Grid editor function compatible with the internal table engine.
     * @example
     * {
     *   title: 'Notes',
     *   field: 'notes',
     *   editor: AMB.editors.largeText(),
     *   formatter: AMB.formatters.largeTextPreview()
     * }
     */
export function largeText(options = {}) {
        const normalizedOptions = {
            title: 'Edit text',
            rows: 10,
            placeholder: '',
            saveText: 'Save',
            cancelText: 'Cancel',
            width: 640,
            maxWidth: '90vw',
            height: 'auto',
            textareaHeight: 260,
            horizontalScroll: false,
            resize: 'vertical',
            closeOnBackdropClick: true,
            ...options
        };

        const editor = (cell, onRendered, success, cancel) => {
            const placeholder = document.createElement('span');
            const overlay = document.createElement('div');
            const panel = document.createElement('div');
            const title = document.createElement('h2');
            const textarea = document.createElement('textarea');
            const actions = document.createElement('div');
            const cancelButton = document.createElement('button');
            const saveButton = document.createElement('button');
            const sourceRow = cell.getRow?.();
            const sourceField = cell.getField?.();
            const titleId = `amb-large-text-title-${++dialogSequence}`;
            let closed = false;
            let focusTrap;

            placeholder.textContent = '';
            overlay.className = 'amb-large-text-editor';
            panel.className = 'amb-large-text-editor__panel';
            title.className = 'amb-large-text-editor__title';
            title.id = titleId;
            textarea.className = 'amb-large-text-editor__textarea';
            actions.className = 'amb-large-text-editor__actions';
            cancelButton.className = 'amb-large-text-editor__button';
            saveButton.className = 'amb-large-text-editor__button amb-large-text-editor__button--primary';

            title.textContent = normalizedOptions.title;
            textarea.value = getInitialValue(cell);
            textarea.rows = normalizedOptions.rows;
            textarea.placeholder = normalizedOptions.placeholder;
            cancelButton.type = 'button';
            cancelButton.textContent = normalizedOptions.cancelText;
            saveButton.type = 'button';
            saveButton.textContent = normalizedOptions.saveText;
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-labelledby', titleId);

            panel.style.width = toCssSize(normalizedOptions.width);
            panel.style.maxWidth = toCssSize(normalizedOptions.maxWidth);

            if (normalizedOptions.height !== 'auto') {
                panel.style.height = toCssSize(normalizedOptions.height);
            }

            textarea.style.height = toCssSize(normalizedOptions.textareaHeight);
            textarea.style.resize = normalizedOptions.resize;

            if (normalizedOptions.horizontalScroll) {
                textarea.style.overflowX = 'auto';
                textarea.style.whiteSpace = 'pre';
                textarea.wrap = 'off';
            } else {
                textarea.style.overflowX = 'hidden';
                textarea.style.whiteSpace = 'pre-wrap';
                textarea.wrap = 'soft';
            }

            actions.append(cancelButton, saveButton);
            panel.append(title, textarea, actions);
            overlay.appendChild(panel);

            const destroyPopup = () => {
                overlay.remove();
            };

            const restoreSourceFocus = () => {
                const restore = () => {
                    const sourceCell = sourceRow?.getCell?.(sourceField) || cell;

                    focusCellWithoutEditing(sourceCell);
                };

                if (typeof globalThis.requestAnimationFrame === 'function') {
                    globalThis.requestAnimationFrame(restore);
                } else {
                    Promise.resolve().then(restore);
                }
            };

            const closeWithSuccess = () => {
                if (closed) return;

                closed = true;
                focusTrap?.deactivate({ restore: false });
                success(textarea.value);
                destroyPopup();
                restoreSourceFocus();
            };

            const closeWithCancel = () => {
                if (closed) return;

                closed = true;
                focusTrap?.deactivate({ restore: false });
                cancel();
                destroyPopup();
                restoreSourceFocus();
            };

            cancelButton.addEventListener('click', closeWithCancel);
            saveButton.addEventListener('click', closeWithSuccess);
            overlay.addEventListener('mousedown', event => {
                if (event.target !== overlay) return;

                event.preventDefault();
                event.stopPropagation();

                if (normalizedOptions.closeOnBackdropClick === false) return;

                closeWithCancel();
            });
            overlay.addEventListener('keydown', event => {
                if (focusTrap?.handleKeydown(event)) return;
                if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation?.();
                    closeWithCancel();
                    return;
                }

                if (event.key === 'Enter' && event.ctrlKey) {
                    event.preventDefault();
                    event.stopPropagation?.();
                    closeWithSuccess();
                }
            });

            focusTrap = createFocusTrap({
                container: panel,
                getElements: () => [textarea, cancelButton, saveButton],
                initialFocus: textarea,
                fallbackFocus: panel
            });

            document.body.appendChild(overlay);

            onRendered(() => {
                focusTrap.activate();
                textarea.setSelectionRange(textarea.value.length, textarea.value.length);
            });

            return placeholder;
        };

        editor._ambEditorType = 'largeText';
        editor._ambKeyboardFocusOnly = true;

        return editor;
}
