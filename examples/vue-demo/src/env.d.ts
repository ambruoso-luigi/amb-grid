/// <reference types="vite/client" />

declare module '*components/site-navbar.js' {
  export function mountSiteNavbar(
    container: HTMLElement | null,
    options?: { onLanguageChange?: (language: 'it' | 'en') => void }
  ): { sync: (language: 'it' | 'en') => void } | null;
}
