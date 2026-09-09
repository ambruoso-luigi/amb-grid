import { InventoryShell } from './components/InventoryShell';
import { ReactHero } from './components/ReactHero';

export default function App() {
  return (
    <main className="react-demo-page">
      <ReactHero />
      <InventoryShell />
    </main>
  );
}
