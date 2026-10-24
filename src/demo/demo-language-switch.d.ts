export type DemoLanguage = 'it' | 'en';

export const demoLanguageStorageKey: 'amb-grid-demo-language';
export function readDemoLanguage(): DemoLanguage;
export function writeDemoLanguage(language: unknown): DemoLanguage;
export function renderDemoLanguageSwitch(): string;
export function syncDemoLanguageSwitch(
    root: ParentNode,
    language: DemoLanguage,
    getText: (key: 'language.switchToEn' | 'language.switchToIt') => string
): void;
export function bindDemoLanguageSwitch(
    root: ParentNode,
    getLanguage: () => DemoLanguage,
    setLanguage: (language: DemoLanguage) => void
): void;
