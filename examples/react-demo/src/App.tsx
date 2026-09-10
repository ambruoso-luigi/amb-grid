import { InventoryShell } from './components/InventoryShell';
import { ApplicationPreview } from './components/ApplicationPreview';
import { ReactHero } from './components/ReactHero';

export default function App() {
  return (
    <main className="react-demo-page">
      <ReactHero />
      <section aria-label="Inventory Operations preview" className="react-application-preview-section">
        <ApplicationPreview />
      </section>
      <InventoryShell />
    </main>
  );
}
