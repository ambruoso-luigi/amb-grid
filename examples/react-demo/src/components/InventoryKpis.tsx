import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, Boxes, CirclePause, PackageMinus, Save, SquarePen } from 'lucide-react';
import { LOW_STOCK_THRESHOLD, type InventorySnapshot } from '../inventory-metrics';

export function InventoryKpis({ snapshot, language }: { snapshot: InventorySnapshot; language: 'it' | 'en' }) {
  const shouldReduceMotion = useReducedMotion();
  const integer = new Intl.NumberFormat(language === 'it' ? 'it-IT' : 'en-GB');
  const metrics = language === 'it' ? [
    ['Prodotti', snapshot.products, 'Prodotti correnti', Boxes, 'neutral'],
    ['Modificati', snapshot.modified, 'Righe con modifiche', SquarePen, 'neutral'],
    ['Errori', snapshot.errors, 'Celle non valide', AlertCircle, snapshot.errors ? 'error' : 'neutral'],
    ['Pronti da salvare', snapshot.ready, 'Righe valide da salvare', Save, 'neutral'],
    ['Scorte basse', snapshot.lowStock, `Prodotti sotto ${LOW_STOCK_THRESHOLD} unità`, PackageMinus, snapshot.lowStock ? 'low' : 'neutral'],
    ['Sospesi', snapshot.onHold, 'Prodotti sospesi', CirclePause, snapshot.onHold ? 'hold' : 'neutral'],
  ] as const : [
    ['Products', snapshot.products, 'Current products', Boxes, 'neutral'],
    ['Modified', snapshot.modified, 'Rows with changes', SquarePen, 'neutral'],
    ['Errors', snapshot.errors, 'Invalid cells', AlertCircle, snapshot.errors ? 'error' : 'neutral'],
    ['Ready to save', snapshot.ready, 'Valid rows to save', Save, 'neutral'],
    ['Low stock', snapshot.lowStock, `Products below ${LOW_STOCK_THRESHOLD} units`, PackageMinus, snapshot.lowStock ? 'low' : 'neutral'],
    ['On hold', snapshot.onHold, 'Products on hold', CirclePause, snapshot.onHold ? 'hold' : 'neutral'],
  ] as const;

  return <div className="inventory-kpis">{metrics.map(([label, value, helper, Icon, tone]) => (
    <motion.article className="inventory-kpi" data-tone={tone} key={label} transition={{ duration: 0.18 }} whileHover={shouldReduceMotion ? undefined : { y: -2 }}>
      <span className="inventory-kpi__heading"><Icon aria-hidden="true" size={18} strokeWidth={2} /><span>{label}</span></span>
      <motion.strong key={value} animate={{ opacity: 1, scale: 1 }} initial={shouldReduceMotion ? false : { opacity: .65, scale: .97 }}>{integer.format(value)}</motion.strong>
      <small>{helper}</small>
    </motion.article>
  ))}</div>;
}
