import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, Home } from 'lucide-react';
import { ApplicationPreview } from './ApplicationPreview';
import { Button } from './ui/button';

const ambGridLogo = new URL('../../../../src/demo/amb-grid-logo.png', import.meta.url).href;

type Language = 'it' | 'en';

const copy = {
  it: {
    integration: 'INTEGRAZIONE REACT',
    title: 'AMB Grid dentro un’applicazione React',
    description: 'Una demo reale con lifecycle React, componenti TypeScript, UI moderna e la stessa logica CRUD di AMB Grid.',
    openDemo: 'Apri demo React',
    home: 'Home',
  },
  en: {
    integration: 'REACT INTEGRATION',
    title: 'AMB Grid inside a React application',
    description: 'A real demo with the React lifecycle, TypeScript components, a modern UI and the same AMB Grid CRUD logic.',
    openDemo: 'Open React demo',
    home: 'Home',
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

export function ReactHero() {
  const shouldReduceMotion = useReducedMotion();
  const enter = shouldReduceMotion ? undefined : { opacity: 0, y: 14 };
  const [language, setLanguage] = useState<Language>('it');
  const text = copy[language];

  const openInventory = () => {
    document.querySelector('#inventory-operations')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="react-hero-shell">
      <nav aria-label="React demo navigation" className="react-demo-topbar">
        <a aria-label="AMB Grid home" className="react-demo-brand" href="#">
          <img alt="AMB Grid" src={ambGridLogo} />
        </a>
        <div className="react-demo-topbar__actions">
          <a className="react-demo-home-link" href="#">
            <Home aria-hidden="true" className="size-4" />
            {text.home}
          </a>
          <div aria-label="Select language" className="react-demo-language" role="group">
            {(['it', 'en'] as const).map((option) => (
              <button aria-pressed={language === option} className={language === option ? 'is-active' : ''} key={option} onClick={() => setLanguage(option)} type="button">
                {option.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </nav>

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
          <div className="react-hero__actions">
            <motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}>
              <Button onClick={openInventory} size="lg">{text.openDemo} <ArrowDown aria-hidden="true" className="size-4" /></Button>
            </motion.div>
          </div>
        </motion.div>
        <ApplicationPreview />
      </div>
    </header>
  );
}
