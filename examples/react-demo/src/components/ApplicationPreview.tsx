import { motion, useReducedMotion } from 'motion/react';

const PreviewRows = () => (
  <div className="application-preview__rows" aria-hidden="true">
    <span className="application-preview__columns"><i>Product</i><i>Stock</i><i>Status</i></span>
    {[
      ['Cable organizer', '128', 'In stock'],
      ['Laptop stand', '42', 'Low'],
      ['USB-C hub', '76', 'In stock'],
      ['Desk light', '16', 'Review'],
    ].map(([product, stock, status]) => <span className="application-preview__row" key={product}><i>{product}</i><i>{stock}</i><i>{status}</i></span>)}
  </div>
);

export function ApplicationPreview() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.aside animate={{ opacity: 1, scale: 1, y: 0 }} aria-label="Inventory Operations application preview" className="application-preview" initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 14 }} transition={{ delay: 0.12, duration: 0.5, ease: 'easeOut' }} whileHover={shouldReduceMotion ? undefined : { y: -3 }}>
      <div className="application-preview__bar"><strong>Inventory Operations</strong><span>React + TS</span></div>
      <div className="application-preview__tabs"><span className="is-active">Products</span><span>Modified</span><span>Errors</span></div>
      <div className="application-preview__toolbar"><i /> <i /> <i /></div>
      <PreviewRows />
      <div className="application-preview__footer">AMB Grid workspace</div>
    </motion.aside>
  );
}
