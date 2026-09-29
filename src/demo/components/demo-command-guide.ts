import {
    commandGuideCopy,
    type DemoCommandGuideLocale,
    type DemoCommandGuideTab
} from './demo-command-guide-copy';

export type { DemoCommandGuideLocale, DemoCommandGuideTab } from './demo-command-guide-copy';

export type DemoCommandGuideController = {
    toggle(trigger?: HTMLElement): void;
    open(trigger?: HTMLElement): void;
    close(): void;
    setLocale(locale: DemoCommandGuideLocale): void;
    destroy(): void;
};

type DemoCommandGuideOptions = {
    host: HTMLElement;
    trigger?: HTMLElement;
    locale?: DemoCommandGuideLocale;
};

type SharedGuide = {
    ownerDocument: Document;
    panel: HTMLElement;
    title: HTMLElement;
    subtitle: HTMLElement;
    tabs: Map<DemoCommandGuideTab, HTMLButtonElement>;
    tabPanels: Map<DemoCommandGuideTab, HTMLElement>;
};

const tabs: readonly DemoCommandGuideTab[] = ['mouse', 'keyboard', 'editing', 'special'];
const panelId = 'demo-command-guide-panel';
let sharedGuide: SharedGuide | null = null;
let activeController: DemoCommandGuide | null = null;

const createElement = <TagName extends keyof HTMLElementTagNameMap>(tagName: TagName) => {
    return document.createElement(tagName);
};

const createSharedGuide = (): SharedGuide => {
    const panel = createElement('section');
    const inner = createElement('div');
    const header = createElement('header');
    const title = createElement('h2');
    const subtitle = createElement('p');
    const tablist = createElement('div');
    const content = createElement('div');
    const tabButtons = new Map<DemoCommandGuideTab, HTMLButtonElement>();
    const tabPanels = new Map<DemoCommandGuideTab, HTMLElement>();

    panel.id = panelId;
    panel.className = 'demo-command-guide';
    panel.inert = true;
    panel.setAttribute('aria-hidden', 'true');
    inner.className = 'demo-command-guide__inner';
    header.className = 'demo-command-guide__header';
    title.className = 'demo-command-guide__title';
    subtitle.className = 'demo-command-guide__subtitle';
    tablist.className = 'demo-command-guide__tabs';
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', 'Command guide sections');
    content.className = 'demo-command-guide__content';

    tabs.forEach((tab, index) => {
        const button = createElement('button');
        const tabPanel = createElement('div');

        button.type = 'button';
        button.className = 'demo-command-guide__tab';
        button.id = `demo-command-guide-tab-${tab}`;
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-controls', `demo-command-guide-tabpanel-${tab}`);
        button.setAttribute('aria-selected', String(index === 0));
        button.tabIndex = index === 0 ? 0 : -1;
        tabPanel.className = 'demo-command-guide__tabpanel';
        tabPanel.id = `demo-command-guide-tabpanel-${tab}`;
        tabPanel.setAttribute('role', 'tabpanel');
        tabPanel.setAttribute('aria-labelledby', button.id);
        tabPanel.hidden = index !== 0;
        tabButtons.set(tab, button);
        tabPanels.set(tab, tabPanel);
        tablist.appendChild(button);
        content.appendChild(tabPanel);
    });

    header.append(title, subtitle);
    inner.append(header, tablist, content);
    panel.appendChild(inner);

    return {
        ownerDocument: document,
        panel,
        title,
        subtitle,
        tabs: tabButtons,
        tabPanels
    };
};

const getSharedGuide = () => {
    if (!sharedGuide || sharedGuide.ownerDocument !== document) {
        sharedGuide = createSharedGuide();
    }
    return sharedGuide;
};

class DemoCommandGuide implements DemoCommandGuideController {
    private host: HTMLElement;
    private trigger: HTMLElement | undefined;
    private locale: DemoCommandGuideLocale;
    private selectedTab: DemoCommandGuideTab = 'mouse';
    private destroyed = false;

    constructor({ host, trigger, locale = 'it' }: DemoCommandGuideOptions) {
        this.host = host;
        this.trigger = trigger;
        this.locale = locale;
        this.deactivate();
    }

    toggle(trigger?: HTMLElement) {
        if (activeController === this) {
            this.close();
            return;
        }
        this.open(trigger);
    }

    open(trigger?: HTMLElement) {
        if (this.destroyed) return;
        if (trigger) this.trigger = trigger;
        activeController?.deactivate();
        activeController = this;
        const guide = getSharedGuide();

        if (guide.panel.parentElement !== this.host) this.host.appendChild(guide.panel);
        this.activateTrigger();
        this.render();
        guide.panel.classList.add('is-open');
        guide.panel.inert = false;
        guide.panel.setAttribute('aria-hidden', 'false');
    }

    close() {
        if (activeController !== this) return;
        const guide = getSharedGuide();

        guide.panel.classList.remove('is-open');
        guide.panel.inert = true;
        guide.panel.setAttribute('aria-hidden', 'true');
        this.deactivate();
        activeController = null;
    }

    setLocale(locale: DemoCommandGuideLocale) {
        this.locale = locale;
        if (activeController === this) this.render();
    }

    destroy() {
        if (this.destroyed) return;
        if (activeController === this) this.close();
        this.deactivate();
        this.destroyed = true;
    }

    private activateTrigger() {
        if (!this.trigger) return;
        this.trigger.classList.add('is-command-guide-active');
        this.trigger.setAttribute('aria-expanded', 'true');
        this.trigger.setAttribute('aria-controls', panelId);
    }

    private deactivate() {
        if (!this.trigger) return;
        this.trigger.classList.remove('is-command-guide-active');
        this.trigger.setAttribute('aria-expanded', 'false');
        this.trigger.setAttribute('aria-controls', panelId);
    }

    private render() {
        const guide = getSharedGuide();
        const copy = commandGuideCopy[this.locale];

        guide.title.textContent = copy.title;
        guide.subtitle.textContent = copy.subtitle;
        tabs.forEach(tab => {
            const button = guide.tabs.get(tab);
            const tabPanel = guide.tabPanels.get(tab);

            if (!button || !tabPanel) return;
            button.textContent = copy.tabs[tab].label;
            button.setAttribute('aria-selected', String(tab === this.selectedTab));
            button.tabIndex = tab === this.selectedTab ? 0 : -1;
            tabPanel.hidden = tab !== this.selectedTab;
            tabPanel.replaceChildren();

            copy.tabs[tab].items.forEach(item => {
                const itemElement = createElement('div');
                const keys = createElement('span');
                const text = createElement('p');

                itemElement.className = 'demo-command-guide__item';
                keys.className = 'demo-command-guide__keys';
                item.keys.forEach(key => {
                    const keycap = createElement('kbd');
                    keycap.className = 'demo-keycap';
                    keycap.textContent = key;
                    keys.appendChild(keycap);
                });
                text.textContent = item.text;
                itemElement.append(keys, text);
                tabPanel.appendChild(itemElement);
            });
        });

        this.bindTabEvents();
    }

    private bindTabEvents() {
        const guide = getSharedGuide();

        tabs.forEach(tab => {
            const button = guide.tabs.get(tab);
            if (!button) return;
            button.onclick = () => this.selectTab(tab);
            button.onkeydown = event => this.handleTabKeydown(event, tab);
        });
    }

    private selectTab(tab: DemoCommandGuideTab, focus = false) {
        this.selectedTab = tab;
        this.render();
        if (focus) getSharedGuide().tabs.get(tab)?.focus();
    }

    private handleTabKeydown(event: KeyboardEvent, tab: DemoCommandGuideTab) {
        const index = tabs.indexOf(tab);
        let nextIndex: number | null = null;

        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        this.selectTab(tabs[nextIndex], true);
    }
}

export const createDemoCommandGuide = (options: DemoCommandGuideOptions): DemoCommandGuideController => {
    return new DemoCommandGuide(options);
};
