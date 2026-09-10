import { InventoryShell } from './components/InventoryShell';
import { ReactHero } from './components/ReactHero';
import { TableGuideAccordion } from './components/TableGuideAccordion';

export default function App() {
  return (
    <main className="react-demo-page">
      <ReactHero />
      <section aria-label="React integration demo" className="react-demo-panel">
        <header className="react-demo-intro">
          <p className="react-demo-intro__kicker">Demo React + TypeScript</p>
          <h2>AMB Grid con React</h2>
          <p>Una demo moderna che mostra come integrare AMB Grid in un'applicazione React + TypeScript, mantenendo la stessa logica CRUD, validazione e payload della libreria.</p>
        </header>
        <TableGuideAccordion />
        <InventoryShell />
      </section>
    </main>
  );
}
