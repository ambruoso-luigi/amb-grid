import type { DemoLanguage } from './demo-language-switch.js';

export function renderDemoFooter(): string;

export function syncDemoFooter(
    root: ParentNode,
    language?: DemoLanguage
): void;

export function listenDemoFooterLanguage(
    root: ParentNode
): () => void;

export function mountDemoFooter(
    host: Element | null
): () => void;
