import { demoIcon } from '../demo-icons.js';

const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderTranslatedText = ({ tag, key, text, className = '' }) => {
    const classAttribute = className ? ` class="${escapeHtml(className)}"` : '';
    const i18nAttribute = key ? ` data-i18n="${escapeHtml(key)}"` : '';

    return `<${tag}${classAttribute}${i18nAttribute}>${escapeHtml(text)}</${tag}>`;
};

const renderPoints = points => {
    if (!points.length) return '';

    return `
        <ul class="demo-explanation-list demo-explanation-list--compact">
            ${points.map(point => `<li>
                ${renderTranslatedText({ tag: 'strong', key: point.titleKey, text: point.title })}
                ${renderTranslatedText({ tag: 'span', key: point.descriptionKey, text: point.description })}
            </li>`).join('')}
        </ul>`;
};

const renderColumns = (columns, className = '') => `
    <ul class="demo-column-guide${className ? ` ${escapeHtml(className)}` : ''}">
        ${columns.map(column => `<li class="demo-column-guide__item">
            ${renderTranslatedText({
                tag: 'strong',
                text: column.title,
                className: 'demo-column-guide__title'
            })}
            <span class="demo-column-guide__badge">${escapeHtml(column.badge)}</span>
            ${renderTranslatedText({
                tag: 'small',
                key: column.descriptionKey,
                text: column.description,
                className: 'demo-column-guide__description'
            })}
        </li>`).join('')}
    </ul>`;

/**
 * Creates the shared, demo-only disclosure used to explain a grid and its columns.
 * All content is static application copy; data-i18n keys let the demo language
 * controller replace the supplied English fallback after the view is mounted.
 */
export const createDemoColumnGuide = ({
    summary,
    summaryKey,
    summaryDescription = '',
    summaryDescriptionKey = '',
    summaryIcon = '',
    intro = '',
    introKey = '',
    points = [],
    columns = [],
    className = ''
}) => {
    const hasRichSummary = Boolean(summaryDescription || summaryIcon);
    const summaryMarkup = hasRichSummary
        ? `<summary class="demo-disclosure__summary demo-disclosure__summary--rich">
            ${summaryIcon ? `<span class="demo-disclosure__summary-leading">${demoIcon(summaryIcon, { className: 'demo-disclosure__summary-icon', size: 20 })}</span>` : ''}
            <span class="demo-disclosure__summary-copy">
                ${renderTranslatedText({ tag: 'span', key: summaryKey, text: summary, className: 'demo-disclosure__summary-title' })}
                ${summaryDescription ? renderTranslatedText({ tag: 'span', key: summaryDescriptionKey, text: summaryDescription, className: 'demo-disclosure__summary-description' }) : ''}
            </span>
            <span class="demo-disclosure__summary-chevron">${demoIcon('chevronDown', { className: 'demo-disclosure__summary-chevron-icon', size: 20 })}</span>
        </summary>`
        : renderTranslatedText({
            tag: 'summary',
            key: summaryKey,
            text: summary,
            className: 'demo-disclosure__summary'
        });

    return `
    <details class="demo-disclosure${hasRichSummary ? ' demo-disclosure--rich' : ''}">
        ${summaryMarkup}
        <div class="demo-disclosure__content">
            ${intro ? renderTranslatedText({ tag: 'p', key: introKey, text: intro }) : ''}
            ${renderPoints(points)}
            ${renderColumns(columns, className)}
        </div>
    </details>`;
};
