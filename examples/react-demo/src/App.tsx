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
          <h2>Inventory Operations</h2>
          <p>Una dashboard moderna che integra AMB Grid con componenti React, UI applicativa, animazioni e backend simulato.</p>
        </header>
        <TableGuideAccordion />
        <InventoryShell />
      </section>
    </main>
  );
}
