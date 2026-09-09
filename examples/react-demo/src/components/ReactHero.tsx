import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, Code2 } from 'lucide-react';
import { ApplicationPreview } from './ApplicationPreview';
import { Button } from './ui/button';

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

  const openInventory = () => {
    document.querySelector('#inventory-operations')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="react-hero-shell">
      <nav aria-label="React demo navigation" className="react-demo-topbar">
        <a className="react-demo-brand" href="#top">
          <span className="react-demo-brand__mark">AMB</span>
          <span>Grid</span>
        </a>
        <div className="react-demo-topbar__actions">
          <a className="react-demo-home-link" href="#top">Home</a>
          <span aria-label="Language: Italian" className="react-demo-language">IT <span>/</span> EN</span>
        </div>
      </nav>

      <div className="react-hero">
        <motion.div animate={{ opacity: 1, y: 0 }} className="react-hero__copy" initial={enter} transition={{ duration: 0.45, ease: 'easeOut' }}>
          <div className="react-identity">
            <motion.span animate={{ opacity: 1, scale: 1 }} className="react-identity__logo" initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.92 }} transition={{ duration: 0.38, ease: 'easeOut' }}>
              <ReactMark />
            </motion.span>
            <span>
              <strong>INTEGRAZIONE REACT</strong>
              <small>React + TypeScript</small>
            </span>
          </div>
          <h1>AMB Grid dentro un&apos;applicazione React</h1>
          <p>Una demo reale con lifecycle React, componenti TypeScript, UI moderna e la stessa logica CRUD di AMB Grid.</p>
          <p className="react-hero__stack">React · TypeScript · shadcn/ui · Motion · MSW</p>
          <div className="react-hero__actions">
            <Button onClick={openInventory} size="lg">Apri demo React <ArrowDown aria-hidden="true" className="size-4" /></Button>
            <Button disabled size="lg" variant="outline"><Code2 aria-hidden="true" className="size-4" /> Vedi integrazione</Button>
          </div>
        </motion.div>
        <ApplicationPreview />
      </div>
    </header>
  );
}
