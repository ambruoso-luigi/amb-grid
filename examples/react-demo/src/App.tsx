import { InventoryShell } from './components/InventoryShell';
import { HowItWorks } from './components/HowItWorks';
import { ReactHero } from './components/ReactHero';

export default function App() {
  return (
    <main className="react-demo-page">
      <ReactHero />
      <section aria-label="React integration demo" className="react-demo-panel">
        <HowItWorks />
        <div aria-hidden="true" className="react-demo-panel__divider" />
        <header className="react-demo-intro">
          <p className="react-demo-intro__kicker">Demo React + TypeScript</p>
          <h2>Inventory Operations</h2>
          <p>Una dashboard moderna che integra AMB Grid con componenti React, UI applicativa, animazioni e backend simulato.</p>
        </header>
        <InventoryShell />
      </section>
    </main>
  );
}
