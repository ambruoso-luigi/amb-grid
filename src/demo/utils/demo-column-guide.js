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
    summaryMeta = '',
    summaryMetaKey = '',
    variant = 'default',
    intro = '',
    introKey = '',
    points = [],
    columns = [],
    className = ''
}) => {
    const isTechnical = variant === 'technical';
    const hasRichSummary = Boolean(summaryDescription || summaryIcon) && !isTechnical;
    const summaryMarkup = isTechnical
        ? `<summary class="demo-disclosure__summary demo-disclosure__summary--technical">
            <span class="demo-disclosure__technical-leading" aria-hidden="true">${demoIcon(summaryIcon, { className: 'demo-disclosure__technical-icon', size: 17, strokeWidth: 2.2 })}</span>
            ${renderTranslatedText({ tag: 'span', key: summaryKey, text: summary, className: 'demo-disclosure__technical-title' })}
            ${summaryMeta ? renderTranslatedText({ tag: 'span', key: summaryMetaKey, text: summaryMeta, className: 'demo-disclosure__technical-meta' }) : ''}
            <span class="demo-disclosure__technical-chevron" aria-hidden="true">${demoIcon('chevronDown', { className: 'demo-disclosure__technical-chevron-icon', size: 18, strokeWidth: 2.4 })}</span>
        </summary>`
        : hasRichSummary
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
    const contentMarkup = `
        <div class="demo-disclosure__content">
            ${intro ? renderTranslatedText({ tag: 'p', key: introKey, text: intro }) : ''}
            ${renderPoints(points)}
            ${renderColumns(columns, className)}
        </div>`;
    const bodyMarkup = hasRichSummary || isTechnical
        ? `<div class="demo-disclosure__body"><div class="demo-disclosure__body-inner">${contentMarkup}</div></div>`
        : contentMarkup;

    return `
    <details class="demo-disclosure${hasRichSummary ? ' demo-disclosure--rich' : isTechnical ? ' demo-disclosure--technical' : ''}">
        ${summaryMarkup}
        ${bodyMarkup}
    </details>`;
};

/**
 * Coordinates animated demo disclosures while leaving native details
 * and summary semantics in control of focus and keyboard activation.
 */
export const bindDemoColumnGuideAnimations = root => {
    const disclosures = Array.from(root?.querySelectorAll?.('.demo-disclosure--rich, .demo-disclosure--technical') || []);
    const cleanups = disclosures.map(details => {
        const summary = details.querySelector('.demo-disclosure__summary');
        const body = details.querySelector('.demo-disclosure__body');

        if (!summary || !body) return () => {};

        let openingFrame = null;
        let closeFallback = null;
        const prefersReducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
        const finishClosing = () => {
            if (!details.classList.contains('is-closing')) return;

            details.open = false;
            details.classList.remove('is-closing');
            if (closeFallback) {
                clearTimeout(closeFallback);
                closeFallback = null;
            }
        };
        const onTransitionEnd = event => {
            if (event.target === body && event.propertyName === 'grid-template-rows') {
                finishClosing();
            }
        };
        const onClick = event => {
            if (prefersReducedMotion() || details.classList.contains('is-opening') || details.classList.contains('is-closing')) {
                return;
            }

            event.preventDefault();
            if (details.open) {
                details.classList.add('is-closing');
                closeFallback = setTimeout(finishClosing, 280);
                return;
            }

            details.open = true;
            details.classList.add('is-opening');
            openingFrame = requestAnimationFrame(() => {
                openingFrame = null;
                details.classList.remove('is-opening');
            });
        };

        summary.addEventListener('click', onClick);
        body.addEventListener('transitionend', onTransitionEnd);

        return () => {
            summary.removeEventListener('click', onClick);
            body.removeEventListener('transitionend', onTransitionEnd);
            if (openingFrame !== null) cancelAnimationFrame(openingFrame);
            if (closeFallback) clearTimeout(closeFallback);
            if (details.classList.contains('is-closing')) details.open = false;
            details.classList.remove('is-opening', 'is-closing');
        };
    });

    return () => cleanups.forEach(cleanup => cleanup());
};
