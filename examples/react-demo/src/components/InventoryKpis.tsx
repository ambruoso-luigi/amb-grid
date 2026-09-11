import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, BadgeEuro, Boxes, PackageCheck, Save, SquarePen } from 'lucide-react';

export type InventorySnapshot = {
  products: number;
  modified: number;
  errors: number;
  pending: number;
  totalStock: number;
  inventoryValue: number;
};

const integer = new Intl.NumberFormat('it-IT');
const currency = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', useGrouping: true });

export function InventoryKpis({ snapshot }: { snapshot: InventorySnapshot }) {
  const shouldReduceMotion = useReducedMotion();
  const metrics = [
    ['Products', integer.format(snapshot.products), 'righe correnti', Boxes, 'neutral'],
    ['Modified', integer.format(snapshot.modified), 'record modificati', SquarePen, snapshot.modified ? 'pending' : 'neutral'],
    ['Errors', integer.format(snapshot.errors), 'celle non valide', AlertCircle, snapshot.errors ? 'error' : 'neutral'],
    ['Pending save', integer.format(snapshot.pending), 'insert · update · delete', Save, snapshot.pending ? 'pending' : 'neutral'],
    ['Total stock', integer.format(snapshot.totalStock), 'unità disponibili', PackageCheck, 'neutral'],
    ['Inventory value', currency.format(snapshot.inventoryValue), 'stock × prezzo', BadgeEuro, 'neutral'],
  ] as const;

  return <div className="inventory-kpis">{metrics.map(([label, value, helper, Icon, tone]) => (
    <motion.article className="inventory-kpi" data-tone={tone} key={label} transition={{ duration: 0.18 }} whileHover={shouldReduceMotion ? undefined : { y: -2 }}>
      <span className="inventory-kpi__icon"><Icon aria-hidden="true" size={17} /></span>
      <span>{label}</span>
      <motion.strong key={value} animate={{ opacity: 1, scale: 1 }} initial={shouldReduceMotion ? false : { opacity: .65, scale: .97 }}>{value}</motion.strong>
      <small>{helper}</small>
    </motion.article>
  ))}</div>;
}
