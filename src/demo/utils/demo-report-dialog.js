import { demoIcon } from '../demo-icons.js';

let nextDialogId = 1;

const normalizeReportText = ({ reportText, reportLines }) => {
    if (Array.isArray(reportLines)) {
        return reportLines.join('\n');
    }

    return reportText === null || reportText === undefined
        ? ''
        : String(reportText);
};

const escapeHtml = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const highlightJson = serialized => {
    const source = String(serialized ?? '');
    const tokens = [];
    let index = 0;

    const addToken = (className, value) => {
        tokens.push(`<span class="${className}">${escapeHtml(value)}</span>`);
    };

    while (index < source.length) {
        const character = source[index];

        if (/\s/.test(character)) {
            let end = index + 1;

            while (end < source.length && /\s/.test(source[end])) end += 1;

            tokens.push(escapeHtml(source.slice(index, end)));
            index = end;
            continue;
        }

        if (character === '"') {
            let end = index + 1;
            let escaped = false;

            while (end < source.length) {
                const current = source[end];

                if (current === '"' && !escaped) {
                    end += 1;
                    break;
                }

                escaped = current === '\\' && !escaped;

                if (current !== '\\') escaped = false;
                end += 1;
            }

            let lookahead = end;

            while (/\s/.test(source[lookahead] || '')) lookahead += 1;

            addToken(source[lookahead] === ':' ? 'demo-json-key' : 'demo-json-string', source.slice(index, end));
            index = end;
            continue;
        }

        if (/[{}\[\],:]/.test(character)) {
            addToken('demo-json-punctuation', character);
            index += 1;
            continue;
        }

        const number = source.slice(index).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);

        if (number) {
            addToken('demo-json-number', number[0]);
            index += number[0].length;
            continue;
        }

        const literal = source.slice(index).match(/^(?:true|false|null)/);

        if (literal) {
            const className = literal[0] === 'null'
                ? 'demo-json-null'
                : 'demo-json-boolean';

            addToken(className, literal[0]);
            index += literal[0].length;
            continue;
        }

        tokens.push(escapeHtml(character));
        index += 1;
    }

    return tokens.join('');
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
    reportButton.innerHTML = `${demoIcon('report')}<span>Report</span>`;
    jsonButton.type = 'button';
    jsonButton.className = 'demo-report-dialog__tab';
    jsonButton.setAttribute('role', 'tab');
    jsonButton.innerHTML = `${demoIcon('json')}<span>JSON</span>`;
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
    closeButton.innerHTML = `${demoIcon('arrowRight')}<span>Close</span>`;

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
            const serializedJson = JSON.stringify(jsonData, null, 2);

            json.innerHTML = highlightJson(serializedJson === undefined ? 'null' : serializedJson);
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
