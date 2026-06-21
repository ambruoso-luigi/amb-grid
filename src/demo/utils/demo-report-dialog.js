let nextDialogId = 1;

const normalizeReportText = ({ reportText, reportLines }) => {
    if (Array.isArray(reportLines)) {
        return reportLines.join('\n');
    }

    return reportText === null || reportText === undefined
        ? ''
        : String(reportText);
};

export const createDemoReportDialog = () => {
    const dialogId = nextDialogId;
    const titleId = `demo-report-dialog-title-${dialogId}`;
    const overlay = document.createElement('div');
    const panel = document.createElement('div');
    const header = document.createElement('div');
    const title = document.createElement('h3');
    const content = document.createElement('div');
    const reportSection = document.createElement('section');
    const reportTitle = document.createElement('h4');
    const report = document.createElement('pre');
    const jsonSection = document.createElement('section');
    const jsonTitle = document.createElement('h4');
    const json = document.createElement('pre');
    const actions = document.createElement('div');
    const closeButton = document.createElement('button');
    let previouslyFocusedElement = null;

    nextDialogId += 1;
    overlay.className = 'demo-report-dialog';
    overlay.hidden = true;
    panel.className = 'demo-report-dialog__panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', titleId);
    header.className = 'demo-report-dialog__header';
    title.id = titleId;
    title.className = 'demo-report-dialog__title';
    content.className = 'demo-report-dialog__content';
    reportSection.className = 'demo-report-dialog__section';
    reportTitle.className = 'demo-report-dialog__section-title';
    reportTitle.textContent = 'Report';
    report.className = 'demo-report-dialog__report';
    jsonSection.className = 'demo-report-dialog__section';
    jsonTitle.className = 'demo-report-dialog__section-title';
    jsonTitle.textContent = 'JSON';
    json.className = 'demo-report-dialog__json';
    actions.className = 'demo-report-dialog__actions';
    closeButton.type = 'button';
    closeButton.className = 'demo-report-dialog__button';
    closeButton.textContent = 'Close';

    header.append(title);
    reportSection.append(reportTitle, report);
    jsonSection.append(jsonTitle, json);
    content.append(reportSection, jsonSection);
    actions.append(closeButton);
    panel.append(header, content, actions);
    overlay.append(panel);
    document.body.append(overlay);

    const close = () => {
        if (overlay.hidden) return;

        overlay.hidden = true;
        document.removeEventListener('keydown', handleKeyDown);

        if (
            previouslyFocusedElement
            && typeof previouslyFocusedElement.focus === 'function'
        ) {
            previouslyFocusedElement.focus();
        }

        previouslyFocusedElement = null;
    };

    function handleKeyDown(event) {
        if (event.key === 'Escape') {
            close();
        }
    }

    const handleOverlayClick = event => {
        if (event.target === overlay) {
            close();
        }
    };

    closeButton.addEventListener('click', close);
    overlay.addEventListener('click', handleOverlayClick);

    return {
        open({
            title: dialogTitle = 'Report',
            reportText = '',
            reportLines,
            jsonData = null,
            jsonLabel = 'JSON'
        } = {}) {
            previouslyFocusedElement = document.activeElement;
            title.textContent = dialogTitle;
            report.textContent = normalizeReportText({ reportText, reportLines });
            jsonTitle.textContent = jsonLabel;
            json.textContent = JSON.stringify(jsonData, null, 2);
            overlay.hidden = false;
            document.removeEventListener('keydown', handleKeyDown);
            document.addEventListener('keydown', handleKeyDown);
            closeButton.focus();
        },
        close,
        destroy() {
            document.removeEventListener('keydown', handleKeyDown);
            closeButton.removeEventListener('click', close);
            overlay.removeEventListener('click', handleOverlayClick);
            overlay.remove();
        }
    };
};
