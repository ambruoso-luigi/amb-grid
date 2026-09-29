import { createDemoCommandGuide } from '../components/demo-command-guide.ts';
import { commandGuideCopy } from '../components/demo-command-guide-copy.ts';
import { demoIcon } from '../demo-icons.js';

const getLocale = () => document.documentElement.lang === 'en' ? 'en' : 'it';

export const createDemoCommandGuideToolbar = app => {
    let controller = null;
    let trigger = null;
    let mounted = false;

    const syncLocale = () => {
        const locale = getLocale();
        const copy = commandGuideCopy[locale].trigger;

        controller?.setLocale(locale);
        if (!(trigger instanceof HTMLElement)) return;

        const label = trigger.querySelector('.amb-toolbar__button-label');

        if (label) label.textContent = copy.label;
        trigger.title = copy.title;
        trigger.setAttribute('aria-label', copy.title);
    };
    const handleLanguageChange = () => syncLocale();

    return {
        button: {
            id: 'demo-command-guide',
            label: commandGuideCopy[getLocale()].trigger.label,
            title: commandGuideCopy[getLocale()].trigger.title,
            icon: demoIcon('help'),
            onClick: ({ event }) => {
                const currentTrigger = event.currentTarget;

                controller?.toggle(currentTrigger instanceof HTMLElement ? currentTrigger : undefined);
            }
        },
        mount() {
            if (mounted) return;

            const host = app.querySelector('.demo-command-guide-host');
            const toolbarTrigger = app.querySelector('[data-action="demo-command-guide"]');

            if (!(host instanceof HTMLElement)) return;

            trigger = toolbarTrigger instanceof HTMLElement ? toolbarTrigger : null;
            controller = createDemoCommandGuide({
                host,
                trigger: trigger || undefined,
                locale: getLocale()
            });
            mounted = true;
            syncLocale();
            window.addEventListener('amb-demo-language-change', handleLanguageChange);
        },
        destroy() {
            if (!mounted && !controller) return;

            window.removeEventListener('amb-demo-language-change', handleLanguageChange);
            controller?.destroy();
            controller = null;
            trigger = null;
            mounted = false;
        }
    };
};
