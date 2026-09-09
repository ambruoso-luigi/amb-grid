import { motion, useReducedMotion } from 'motion/react';

const PreviewRows = () => (
  <div className="application-preview__rows" aria-hidden="true">
    {[0, 1, 2, 3].map((row) => <span className="application-preview__row" key={row}><i /> <i /> <i /></span>)}
  </div>
);

export function ApplicationPreview() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.aside animate={{ opacity: 1, scale: 1, y: 0 }} aria-label="Inventory Operations application preview" className="application-preview" initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 14 }} transition={{ delay: 0.12, duration: 0.5, ease: 'easeOut' }}>
      <div className="application-preview__bar"><strong>Inventory Operations</strong><span>React + TS</span></div>
      <div className="application-preview__tabs"><span className="is-active">Products</span><span>Modified</span><span>Errors</span></div>
      <div className="application-preview__toolbar"><i /> <i /> <i /></div>
      <PreviewRows />
      <div className="application-preview__footer">AMB Grid workspace</div>
    </motion.aside>
  );
}
