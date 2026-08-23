import { renderDemoBrand } from './demo-brand.js';

export const renderDemoFooter = ({ demoHref = '#top' } = {}) => `
    <footer class="demo-footer">
        <div class="demo-footer__brand">
            ${renderDemoBrand({ href: demoHref })}
            <p data-i18n="footer.tagline">Framework-agnostic CRUD grid library for business applications.</p>
            <span data-i18n="footer.project">Open-source project</span>
        </div>
        <nav class="demo-footer__group" aria-labelledby="footer-resources-title">
            <h2 id="footer-resources-title" data-i18n="footer.resources">Resources</h2>
            <a href="${demoHref}" data-i18n="footer.demo">Main demo</a>
            <a href="#feature-examples" data-i18n="footer.examples">Feature examples</a>
            <a href="#getting-started-javascript" data-i18n="footer.guide">JavaScript guide</a>
        </nav>
        <nav class="demo-footer__group" aria-labelledby="footer-project-title">
            <h2 id="footer-project-title" data-i18n="footer.projectLinks">Project</h2>
            <a href="https://github.com/ambruoso-luigi/amb-grid" target="_blank" rel="noopener noreferrer" data-i18n="footer.github">GitHub</a>
            <a href="https://github.com/ambruoso-luigi/amb-grid/issues" target="_blank" rel="noopener noreferrer" data-i18n="footer.issues">Issues / Feedback</a>
            <span class="demo-footer__note" data-i18n="footer.license">Apache 2.0</span>
        </nav>
        <div class="demo-footer__meta">
            <span data-i18n="footer.maintainer">Created and maintained by Luigi Ambruoso</span>
            <span aria-hidden="true">·</span>
            <span>AMB Grid</span>
        </div>
    </footer>`;
