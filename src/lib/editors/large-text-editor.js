import { getInitialValue, toCssSize } from './shared.js';

    /**
     * Modal textarea editor for long text.
     *
     * @param {object} [options] - Large text editor options.
     * @param {string} [options.title='Edit text'] - Dialog title.
     * @param {number} [options.rows=10] - Textarea row count.
     * @param {string} [options.placeholder=''] - Textarea placeholder.
     * @param {string} [options.saveText='Save'] - Save button text.
     * @param {string} [options.cancelText='Cancel'] - Cancel button text.
     * @param {number|string} [options.width=640] - Panel width.
     * @param {number|string} [options.maxWidth='90vw'] - Panel maximum width.
     * @param {number|string} [options.textareaHeight=260] - Textarea height.
     * @param {boolean} [options.horizontalScroll=false] - Keep long lines on one line.
     * @param {string} [options.resize='vertical'] - CSS resize value for the textarea.
     * @param {boolean} [options.closeOnBackdropClick=true] - Close the editor when the backdrop is pressed.
     * @returns {Function} Tabulator editor.
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

        return (cell, onRendered, success, cancel) => {
            const placeholder = document.createElement('span');
            const overlay = document.createElement('div');
            const panel = document.createElement('div');
            const title = document.createElement('h2');
            const textarea = document.createElement('textarea');
            const actions = document.createElement('div');
            const cancelButton = document.createElement('button');
            const saveButton = document.createElement('button');
            let closed = false;

            placeholder.textContent = '';
            overlay.className = 'amb-large-text-editor';
            panel.className = 'amb-large-text-editor__panel';
            title.className = 'amb-large-text-editor__title';
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

            const closeWithSuccess = () => {
                if (closed) return;

                closed = true;
                success(textarea.value);
                destroyPopup();
            };

            const closeWithCancel = () => {
                if (closed) return;

                closed = true;
                cancel();
                destroyPopup();
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
            textarea.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    closeWithCancel();
                    return;
                }

                if (event.key === 'Enter' && event.ctrlKey) {
                    event.preventDefault();
                    closeWithSuccess();
                }
            });

            document.body.appendChild(overlay);

            onRendered(() => {
                textarea.focus();
                textarea.setSelectionRange(textarea.value.length, textarea.value.length);
            });

            return placeholder;
        };
}
