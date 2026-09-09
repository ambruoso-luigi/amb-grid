import { motion, useReducedMotion } from 'motion/react';
import { Braces, Filter, PackagePlus, Save, Search, ShieldCheck } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';

const metrics = ['Products', 'Modified', 'Errors', 'Pending save'];

export function InventoryShell() {
  const shouldReduceMotion = useReducedMotion();

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
            {metrics.map((metric) => (
              <motion.article className="inventory-kpi" key={metric} transition={{ duration: 0.18 }} whileHover={shouldReduceMotion ? undefined : { y: -2 }}>
                <span>{metric}</span><strong>—</strong>
              </motion.article>
            ))}
          </div>

          <div className="inventory-toolbar" aria-label="Inventory toolbar preview">
            <div className="inventory-toolbar__actions">
              <Button disabled><PackagePlus aria-hidden="true" className="size-4" /> Add product</Button>
              <Button disabled variant="outline"><Save aria-hidden="true" className="size-4" /> Save</Button>
              <Button disabled variant="outline"><ShieldCheck aria-hidden="true" className="size-4" /> Validate</Button>
            </div>
            <div className="inventory-toolbar__utilities">
              <label className="inventory-search"><Search aria-hidden="true" size={16} /><input aria-label="Search inventory" disabled placeholder="Search inventory..." /></label>
              <Button disabled size="sm" variant="outline"><Filter aria-hidden="true" className="size-4" /> Filters</Button>
              <Button disabled size="sm" variant="outline"><Braces aria-hidden="true" className="size-4" /> Payload</Button>
            </div>
          </div>

          <div className="react-demo-grid-shell">
            <div className="react-demo-grid-placeholder">
              <div className="react-demo-grid-placeholder__heading"><span>AMB Grid</span><small>Grid container ready for lifecycle mount</small></div>
              <div className="react-demo-grid-placeholder__skeleton" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((row) => <span key={row}><i /><i /><i /><i /></span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
