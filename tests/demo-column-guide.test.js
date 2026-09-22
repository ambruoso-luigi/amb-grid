import { describe, expect, test } from 'vitest';
import { demoIcons } from '../src/demo/demo-icons.js';
import { bindDemoColumnGuideAnimations, createDemoColumnGuide } from '../src/demo/utils/demo-column-guide.js';

describe('createDemoColumnGuide', () => {
    test('keeps the simple summary markup for shared mini-demo guides', () => {
        const markup = createDemoColumnGuide({
            summary: 'Example',
            summaryKey: 'example.summary'
        });

        expect(markup).toContain('<details class="demo-disclosure">');
        expect(markup).toContain('<summary class="demo-disclosure__summary" data-i18n="example.summary">Example</summary>');
        expect(markup).not.toContain('demo-disclosure--rich');
        expect(markup).not.toContain('demo-disclosure--technical');
        expect(markup).not.toContain('demo-disclosure__summary--rich');
        expect(markup).not.toContain('demo-disclosure__summary-description');
        expect(markup).not.toContain('demo-disclosure__summary-chevron');
        expect(markup).not.toContain('demo-disclosure__body');
    });

    test('renders the optional rich summary with translated copy and registry icons', () => {
        const markup = createDemoColumnGuide({
            summary: 'Example',
            summaryKey: 'example.summary',
            summaryDescription: 'Example description',
            summaryDescriptionKey: 'example.description',
            summaryIcon: 'guide'
        });

        expect(demoIcons.guide).toBeTruthy();
        expect(demoIcons.chevronDown).toBeTruthy();
        expect(markup).toContain('demo-disclosure demo-disclosure--rich');
        expect(markup).toContain('demo-disclosure__summary demo-disclosure__summary--rich');
        expect(markup).toContain('demo-disclosure__summary-icon');
        expect(markup).toContain('demo-disclosure__summary-description');
        expect(markup).toContain('data-i18n="example.summary"');
        expect(markup).toContain('data-i18n="example.description"');
        expect(markup).toContain('demo-disclosure__summary-chevron-icon');
        expect(markup).toContain('demo-disclosure__body');
        expect(markup).toContain('demo-disclosure__body-inner');
        expect(markup).toContain('demo-disclosure__content');
        expect(markup).toContain('<details class="demo-disclosure demo-disclosure--rich">');
        expect(markup).toContain('aria-hidden="true"');
        expect(markup).not.toContain('demo-disclosure--technical');
        expect(markup).not.toContain('Open guide');
        expect(markup).not.toContain('Close guide');
    });

    test('renders the technical summary as a separate disclosure variant', () => {
        const markup = createDemoColumnGuide({
            summary: 'How the example works',
            summaryKey: 'example.summary',
            summaryMeta: 'Input · output',
            summaryMetaKey: 'example.meta',
            summaryIcon: 'help',
            variant: 'technical'
        });

        expect(demoIcons.help).toBeTruthy();
        expect(markup).toContain('<details class="demo-disclosure demo-disclosure--technical">');
        expect(markup).toContain('demo-disclosure__summary demo-disclosure__summary--technical');
        expect(markup).toContain('demo-disclosure__technical-leading');
        expect(markup).toContain('demo-disclosure__technical-icon');
        expect(markup).toContain('demo-disclosure__technical-title');
        expect(markup).toContain('demo-disclosure__technical-meta');
        expect(markup).toContain('data-i18n="example.meta"');
        expect(markup).toContain('demo-disclosure__technical-chevron-icon');
        expect(markup).toContain('demo-disclosure__body');
        expect(markup).not.toContain('demo-disclosure--rich');
        expect(markup).not.toContain('demo-disclosure__summary--rich');
    });

    test('exports the disclosure animation binder without requiring a DOM test dependency', () => {
        expect(bindDemoColumnGuideAnimations).toBeTypeOf('function');
    });
});
