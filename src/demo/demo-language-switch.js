export const demoLanguageStorageKey = 'amb-grid-demo-language';

export const readDemoLanguage = () => {
    try {
        return globalThis.localStorage?.getItem(demoLanguageStorageKey) === 'en' ? 'en' : 'it';
    } catch {
        return 'it';
    }
};

export const writeDemoLanguage = language => {
    const value = language === 'en' ? 'en' : 'it';
    try { globalThis.localStorage?.setItem(demoLanguageStorageKey, value); } catch { /* storage is optional */ }
    return value;
};

export const renderDemoLanguageSwitch = () => `
    <div class="language-switch is-it" data-language-switch aria-label="Language">
        <button type="button" class="language-switch__label language-switch__label--en" data-language-label="en" data-language-set="en" aria-label="English" aria-pressed="false">EN</button>
        <button type="button" class="language-switch__control" data-language-toggle role="switch" aria-checked="true" aria-label="Switch language">
            <span class="language-switch__knob" aria-hidden="true"></span>
        </button>
        <button type="button" class="language-switch__label language-switch__label--it" data-language-label="it" data-language-set="it" aria-label="Italiano" aria-pressed="true">IT</button>
    </div>`;

export const syncDemoLanguageSwitch = (root, language, getText) => {
    root.querySelectorAll('[data-language-switch]').forEach(element => {
        element.classList.toggle('is-it', language === 'it');
        element.classList.toggle('is-en', language === 'en');
    });
    root.querySelectorAll('[data-language-label]').forEach(element => {
        const active = element.dataset.languageLabel === language;
        element.classList.toggle('is-active', active);
        element.setAttribute('aria-pressed', String(active));
    });
    root.querySelectorAll('[data-language-toggle]').forEach(button => {
        const label = getText(language === 'it' ? 'language.switchToEn' : 'language.switchToIt');
        button.setAttribute('aria-checked', String(language === 'it'));
        button.setAttribute('aria-label', label);
        button.title = label;
    });
};

export const bindDemoLanguageSwitch = (root, getLanguage, setLanguage) => {
    root.querySelectorAll('[data-language-toggle]').forEach(button => button.addEventListener('click', () => {
        setLanguage(getLanguage() === 'it' ? 'en' : 'it');
    }));
    root.querySelectorAll('[data-language-set]').forEach(button => button.addEventListener('click', () => {
        setLanguage(button.dataset.languageSet === 'en' ? 'en' : 'it');
    }));
};
