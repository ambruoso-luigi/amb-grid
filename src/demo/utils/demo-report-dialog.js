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
    const tabs = document.createElement('div');
    const reportButton = document.createElement('button');
    const jsonButton = document.createElement('button');
    const content = document.createElement('div');
    const report = document.createElement('pre');
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
    tabs.className = 'demo-report-dialog__tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Report views');
    reportButton.type = 'button';
    reportButton.className = 'demo-report-dialog__tab';
    reportButton.setAttribute('role', 'tab');
    reportButton.textContent = 'Report';
    jsonButton.type = 'button';
    jsonButton.className = 'demo-report-dialog__tab';
    jsonButton.setAttribute('role', 'tab');
    jsonButton.textContent = 'JSON';
    content.className = 'demo-report-dialog__content';
    report.className = 'demo-report-dialog__report';
    report.id = `demo-report-dialog-report-${dialogId}`;
    report.setAttribute('role', 'tabpanel');
    reportButton.setAttribute('aria-controls', report.id);
    json.className = 'demo-report-dialog__json';
    json.id = `demo-report-dialog-json-${dialogId}`;
    json.setAttribute('role', 'tabpanel');
    jsonButton.setAttribute('aria-controls', json.id);
    actions.className = 'demo-report-dialog__actions';
    closeButton.type = 'button';
    closeButton.className = 'demo-report-dialog__button';
    closeButton.textContent = 'Close';

    tabs.append(reportButton, jsonButton);
    header.append(title, tabs);
    content.append(report, json);
    actions.append(closeButton);
    panel.append(header, content, actions);
    overlay.append(panel);
    document.body.append(overlay);

    const setView = view => {
        const showReport = view !== 'json';

        report.hidden = !showReport;
        json.hidden = showReport;
        reportButton.classList.toggle('is-active', showReport);
        jsonButton.classList.toggle('is-active', !showReport);
        reportButton.setAttribute('aria-selected', String(showReport));
        jsonButton.setAttribute('aria-selected', String(!showReport));
        reportButton.tabIndex = showReport ? 0 : -1;
        jsonButton.tabIndex = showReport ? -1 : 0;
    };

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

    const showReport = () => setView('report');
    const showJson = () => setView('json');

    reportButton.addEventListener('click', showReport);
    jsonButton.addEventListener('click', showJson);
    closeButton.addEventListener('click', close);
    overlay.addEventListener('click', handleOverlayClick);

    return {
        open({
            title: dialogTitle = 'Report',
            reportText = '',
            reportLines,
            jsonData = null
        } = {}) {
            previouslyFocusedElement = document.activeElement;
            title.textContent = dialogTitle;
            report.textContent = normalizeReportText({ reportText, reportLines });
            json.textContent = JSON.stringify(jsonData, null, 2);
            setView('report');
            overlay.hidden = false;
            document.removeEventListener('keydown', handleKeyDown);
            document.addEventListener('keydown', handleKeyDown);
            closeButton.focus();
        },
        close,
        destroy() {
            document.removeEventListener('keydown', handleKeyDown);
            reportButton.removeEventListener('click', showReport);
            jsonButton.removeEventListener('click', showJson);
            closeButton.removeEventListener('click', close);
            overlay.removeEventListener('click', handleOverlayClick);
            overlay.remove();
        }
    };
};
