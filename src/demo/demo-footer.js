import { renderDemoBrand } from './demo-brand.js';
import { demoIcon } from './demo-icons.js';

export const renderDemoFooter = ({ demoHref = '#top' } = {}) => `
    <section class="demo-next-step" aria-labelledby="demo-next-step-title">
        <div class="demo-next-step__content">
            <p class="demo-kicker" data-i18n="footer.cta.kicker">Next step</p>
            <h2 id="demo-next-step-title" data-i18n="footer.cta.title">Bring AMB Grid into your project</h2>
            <p class="demo-next-step__text" data-i18n="footer.cta.description">Explore the JavaScript guide, try the feature examples, or follow the project on GitHub.</p>
        </div>
        <div class="demo-next-step__actions">
            <a class="demo-button demo-button--primary" href="#getting-started-javascript">
                ${demoIcon('guide')}
                <span data-i18n="footer.cta.guide">JavaScript guide</span>
            </a>
            <a class="demo-button" href="#feature-examples">
                ${demoIcon('selected')}
                <span data-i18n="footer.cta.examples">View examples</span>
            </a>
            <a class="demo-button" href="https://github.com/ambruoso-luigi/amb-grid" target="_blank" rel="noopener noreferrer">
                ${demoIcon('github')}
                <span data-i18n="footer.cta.github">GitHub</span>
            </a>
        </div>
    </section>
    <footer class="demo-footer">
        <div class="demo-footer__brand">
            ${renderDemoBrand({ href: demoHref })}
            <p data-i18n="footer.tagline">Framework-agnostic CRUD grid library for business applications.</p>
            <span data-i18n="footer.project">Open-source project</span>
        </div>
        <nav class="demo-footer__links" aria-label="Footer links">
            <a href="${demoHref}" data-i18n="footer.demo">Main demo</a>
            <a href="#feature-examples" data-i18n="footer.examples">Feature examples</a>
            <a href="#getting-started-javascript" data-i18n="footer.guide">JavaScript guide</a>
            <a href="https://github.com/ambruoso-luigi/amb-grid" target="_blank" rel="noopener noreferrer" data-i18n="footer.github">GitHub</a>
            <a href="https://github.com/ambruoso-luigi/amb-grid/issues" target="_blank" rel="noopener noreferrer" data-i18n="footer.issues">Issues / Feedback</a>
        </nav>
        <div class="demo-footer__meta">
            <span data-i18n="footer.license">Apache 2.0</span>
            <span aria-hidden="true">·</span>
            <span data-i18n="footer.maintainer">Created and maintained by Luigi Ambruoso</span>
        </div>
    </footer>`;
