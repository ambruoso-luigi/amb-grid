import { useEffect, useState } from 'react';
import { InventoryShell } from './components/InventoryShell';
import { ReactHero } from './components/ReactHero';
import { TableGuideAccordion } from './components/TableGuideAccordion';

type Language = 'it' | 'en';

export default function App() {
  const [language, setLanguage] = useState<Language>('it');

  useEffect(() => {
    document.body.classList.add('amb-react-demo-active');

    return () => document.body.classList.remove('amb-react-demo-active');
  }, []);

  return (
    <main className="react-demo-page">
      <ReactHero language={language} onLanguageChange={setLanguage} />
      <section aria-label="React integration demo" className="react-demo-panel">
        <header className="react-demo-intro">
          <p className="react-demo-intro__kicker">Demo React + TypeScript</p>
          <h2>AMB Grid con React</h2>
          <p>Una demo moderna che mostra come integrare AMB Grid in un'applicazione React + TypeScript, mantenendo la stessa logica CRUD, validazione e payload della libreria.</p>
        </header>
        <TableGuideAccordion language={language} />
        <InventoryShell language={language} />
      </section>
    </main>
  );
}
