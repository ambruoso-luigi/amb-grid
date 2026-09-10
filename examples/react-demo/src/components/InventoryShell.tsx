import { useCallback, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Braces, Filter, PackagePlus, Save, Search, ShieldCheck } from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { InventoryGrid, type InventoryGridController } from './InventoryGrid';
import { Button } from './ui/button';
import { inventoryRows } from '../data/inventory';

export function InventoryShell() {
  const shouldReduceMotion = useReducedMotion();
  const [grid, setGrid] = useState<InventoryGridController | null>(null);
  const [productCount, setProductCount] = useState(inventoryRows.length);
  const nextItemNumber = useRef(1009);
  const handleGridReady = useCallback((controller: InventoryGridController | null) => setGrid(controller), []);
  const addProduct = useCallback(() => {
    if (!grid) return;
    const itemCode = `ITM-${nextItemNumber.current++}`;
    void Promise.resolve(grid.addRow({ itemCode, productName: '', warehouse: 'Ancona', stockQuantity: 0, unitPrice: 0, status: 'ACTIVE', requiresInspection: false, lastCheckDate: '2026-09-10', notes: '' })).then(() => setProductCount((count) => count + 1));
  }, [grid]);
  const metrics = [['Products', productCount], ['Modified', 0], ['Errors', 0], ['Pending save', 0]] as const;

  return (
    <motion.section animate={{ opacity: 1, y: 0 }} className="inventory-operations" id="inventory-operations" initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
      <div className="inventory-operations__productbar"><span>AMB Grid <i>/</i> Inventory</span><strong>React + TS</strong></div>
      <div className="inventory-operations__body">
        <AppSidebar />
        <div className="inventory-workspace">
          <header className="inventory-workspace__header">
            <div><h2>Inventory</h2><p>Manage product inventory and pending changes.</p></div>
            <span className="inventory-workspace__tag">React + TypeScript</span>
          </header>

          <div className="inventory-kpis">
            {metrics.map(([metric, value]) => (
              <motion.article className="inventory-kpi" key={metric} transition={{ duration: 0.18 }} whileHover={shouldReduceMotion ? undefined : { y: -2 }}>
                <span>{metric}</span><strong>{value}</strong>
              </motion.article>
            ))}
          </div>

          <div className="inventory-toolbar" aria-label="Inventory toolbar">
            <div className="inventory-toolbar__actions">
              <Button disabled={!grid} onClick={addProduct}><PackagePlus aria-hidden="true" className="size-4" /> Add product</Button>
              <Button disabled variant="outline"><Save aria-hidden="true" className="size-4" /> Save</Button>
              <Button disabled variant="outline"><ShieldCheck aria-hidden="true" className="size-4" /> Validate</Button>
            </div>
            <div className="inventory-toolbar__utilities">
              <label className="inventory-search"><Search aria-hidden="true" size={16} /><input aria-label="Search inventory" disabled placeholder="Search inventory..." /></label>
              <Button disabled size="sm" variant="outline"><Filter aria-hidden="true" className="size-4" /> Filters</Button>
              <Button disabled size="sm" variant="outline"><Braces aria-hidden="true" className="size-4" /> Payload</Button>
            </div>
          </div>

          <div className="react-demo-grid-shell"><InventoryGrid onReady={handleGridReady} /></div>
        </div>
      </div>
    </motion.section>
  );
}
