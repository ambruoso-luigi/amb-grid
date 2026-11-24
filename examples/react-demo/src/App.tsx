import { useEffect, useState } from 'react';
import { readDemoLanguage } from '../../../src/demo/demo-language-switch.js';
import { InventoryShell } from './components/InventoryShell';
import { ReactHero } from './components/ReactHero';
import { ReactGettingStarted } from './components/ReactGettingStarted';
import { TableGuideAccordion } from './components/TableGuideAccordion';

type Language = 'it' | 'en';

export default function App() {
  const [language, setLanguage] = useState<Language>(() => readDemoLanguage());

  useEffect(() => {
    document.body.classList.add('amb-react-demo-active');
    const syncLanguage = (event: Event) => setLanguage((event as CustomEvent<{ language: Language }>).detail.language);
    window.addEventListener('amb-demo-language-change', syncLanguage);

    return () => {
      document.body.classList.remove('amb-react-demo-active');
      window.removeEventListener('amb-demo-language-change', syncLanguage);
    };
  }, []);

  return (
    <main className="react-demo-page">
      <ReactHero language={language} />
      <section aria-label="React integration demo" className="react-demo-panel">
        <TableGuideAccordion language={language} />
        <InventoryShell language={language} />
      </section>
      <ReactGettingStarted language={language} />
    </main>
  );
}
