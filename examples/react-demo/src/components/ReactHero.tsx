import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Home } from 'lucide-react';

const ambGridLogo = new URL('../../../../src/demo/amb-grid-logo.png', import.meta.url).href;

type Language = 'it' | 'en';

const copy = {
  it: {
    integration: 'INTEGRAZIONE REACT',
    title: 'AMB Grid con React',
    description: 'Una demo reale con lifecycle React, componenti TypeScript, UI moderna e la stessa logica CRUD di AMB Grid.',
    home: 'Home',
    videoLabel: 'Demo React',
    videoOpen: 'Apri Demo React su YouTube',
  },
  en: {
    integration: 'REACT INTEGRATION',
    title: 'AMB Grid with React',
    description: 'A real demo with the React lifecycle, TypeScript components, a modern UI and the same AMB Grid CRUD logic.',
    home: 'Home',
    videoLabel: 'React Demo',
    videoOpen: 'Open the React Demo on YouTube',
  },
} as const;

const ReactMark = () => (
  <svg aria-hidden="true" className="react-mark" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="4" fill="currentColor" />
    <ellipse cx="32" cy="32" rx="28" ry="11" fill="none" stroke="currentColor" strokeWidth="3" />
    <ellipse cx="32" cy="32" rx="28" ry="11" fill="none" stroke="currentColor" strokeWidth="3" transform="rotate(60 32 32)" />
    <ellipse cx="32" cy="32" rx="28" ry="11" fill="none" stroke="currentColor" strokeWidth="3" transform="rotate(120 32 32)" />
  </svg>
);

const YouTubeMark = () => (
  <svg aria-hidden="true" className="react-video-preview__brand-icon" viewBox="0 0 24 24">
    <path d="M21.58 7.19a2.99 2.99 0 0 0-2.1-2.12C17.62 4.57 12 4.57 12 4.57s-5.62 0-7.48.5a2.99 2.99 0 0 0-2.1 2.12A31.2 31.2 0 0 0 1.92 12c0 1.62.2 3.23.5 4.81a2.99 2.99 0 0 0 2.1 2.12c1.86.5 7.48.5 7.48.5s5.62 0 7.48-.5a2.99 2.99 0 0 0 2.1-2.12c.3-1.58.5-3.19.5-4.81 0-1.62-.2-3.23-.5-4.81Z" fill="currentColor" />
    <path d="m10 15.5 5.2-3.5L10 8.5v7Z" fill="#fff" />
  </svg>
);

export function ReactHero() {
  const shouldReduceMotion = useReducedMotion();
  const enter = shouldReduceMotion ? undefined : { opacity: 0, y: 14 };
  const [language, setLanguage] = useState<Language>('it');
  const text = copy[language];

  return (
    <header className="react-hero-shell">
      <nav aria-label="React demo navigation" className="react-demo-topbar">
        <a aria-label="AMB Grid home" className="react-demo-brand" href="#">
          <img alt="AMB Grid" src={ambGridLogo} />
        </a>
        <div aria-label="Select language" className="react-demo-language" role="group">
          <button aria-pressed={language === 'it'} className="react-demo-language__label" onClick={() => setLanguage('it')} type="button">IT</button>
          <button aria-pressed={language === 'en'} className="react-demo-language__label" onClick={() => setLanguage('en')} type="button">EN</button>
        </div>
      </nav>

      <div className="react-hero__home">
        <a className="react-demo-home-link" href="#">
          <Home aria-hidden="true" className="size-4" />
          {text.home}
        </a>
      </div>
      <div className="react-hero">
        <motion.div animate={{ opacity: 1, y: 0 }} className="react-hero__copy" initial={enter} transition={{ duration: 0.45, ease: 'easeOut' }}>
          <div className="react-identity">
            <motion.span animate={{ opacity: 1, scale: 1 }} className="react-identity__logo" initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.92 }} transition={{ duration: 0.38, ease: 'easeOut' }}>
              <ReactMark />
            </motion.span>
            <span>
              <strong>{text.integration}</strong>
              <small>React + TypeScript</small>
            </span>
          </div>
          <h1>{text.title}</h1>
          <p>{text.description}</p>
          <p className="react-hero__stack">React · TypeScript · shadcn/ui · Motion · MSW</p>
        </motion.div>
        <motion.a animate={{ opacity: 1, scale: 1, y: 0 }} aria-label={text.videoOpen} className="react-video-preview" href="https://youtu.be/4m0EZ4vPmT0" initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 14 }} rel="noopener noreferrer" target="_blank" transition={{ delay: 0.12, duration: 0.5, ease: 'easeOut' }} whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}>
          <img alt="" className="react-video-preview__image" loading="eager" src="https://i.ytimg.com/vi/4m0EZ4vPmT0/hqdefault.jpg" />
          <span aria-hidden="true" className="react-video-preview__overlay" />
          <span className="react-video-preview__title">{text.videoLabel}</span>
          <span className="react-video-preview__destination"><span className="react-video-preview__brand"><YouTubeMark /></span><span>YouTube</span></span>
        </motion.a>
      </div>
    </header>
  );
}
