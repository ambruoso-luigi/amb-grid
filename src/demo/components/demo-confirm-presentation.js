import { demoIcon } from '../demo-icons.js';

export function decoratePartialSaveDialog(dialog, { intro, detailsHeading, detailsLines, explanation }) {
    const { element, panelElement, titleElement, messageElement, confirmButton } = dialog;
    if (!element.classList.contains('demo-crud-partial-save-dialog')) {
        element.classList.add('demo-crud-partial-save-dialog');
        const header = document.createElement('div');
        header.className = 'demo-crud-partial-save-dialog__header';
        const badge = document.createElement('span');
        badge.className = 'demo-crud-partial-save-dialog__badge';
        badge.innerHTML = demoIcon('warning', { size: 24, strokeWidth: 2.2 });
        header.append(badge, titleElement);
        panelElement.prepend(header);
    }
    const introElement = document.createElement('span');
    introElement.className = 'demo-crud-partial-save-dialog__intro';
    introElement.textContent = intro;
    const details = document.createElement('span');
    details.className = 'demo-crud-partial-save-dialog__details';
    const heading = document.createElement('span');
    heading.className = 'demo-crud-partial-save-dialog__details-heading';
    heading.innerHTML = demoIcon('warning', { size: 16, strokeWidth: 2.1 });
    const count = document.createElement('span');
    count.textContent = detailsHeading;
    heading.append(count);
    details.append(heading);
    detailsLines.forEach(line => {
        const item = document.createElement('span');
        item.className = 'demo-crud-partial-save-dialog__details-line';
        item.textContent = line;
        details.append(item);
    });
    const explanationElement = document.createElement('span');
    explanationElement.className = 'demo-crud-partial-save-dialog__explanation';
    explanationElement.textContent = explanation;
    messageElement.replaceChildren(introElement, details, explanationElement);
    confirmButton.insertAdjacentHTML('afterbegin', demoIcon('check', { size: 18, strokeWidth: 2.6 }));
}

export function decorateDangerRowDialog(dialog) {
    const { element, panelElement, titleElement, confirmButton } = dialog;
    element.classList.add('demo-crud-row-confirm-dialog', 'demo-crud-row-confirm-dialog--delete');
    if (!panelElement.querySelector('.demo-crud-row-confirm-dialog__header')) {
        const header = document.createElement('div');
        header.className = 'demo-crud-row-confirm-dialog__header';
        const badge = document.createElement('span');
        badge.className = 'demo-crud-row-confirm-dialog__badge';
        badge.setAttribute('aria-hidden', 'true');
        badge.innerHTML = demoIcon('delete', { size: 22, strokeWidth: 2.2 });
        header.append(badge, titleElement);
        panelElement.prepend(header);
    }
    confirmButton.insertAdjacentHTML('afterbegin', demoIcon('delete', { size: 18, strokeWidth: 2.2 }));
}
