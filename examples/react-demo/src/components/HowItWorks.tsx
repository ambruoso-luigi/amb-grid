import { Activity, Box, Power, SlidersHorizontal } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

const concepts = [
  { icon: Box, title: 'Mount', text: 'React crea il container e inizializza AMB Grid nel lifecycle del componente.' },
  { icon: SlidersHorizontal, title: 'Controlli React', text: 'Pulsanti, filtri, dialog e pannelli React possono richiamare direttamente le API pubbliche di AMB Grid.' },
  { icon: Activity, title: 'Stato applicativo', text: 'Report, validazione e payload della griglia possono aggiornare KPI e componenti dell’interfaccia React.' },
  { icon: Power, title: 'Cleanup', text: <>Quando il componente viene smontato, <code>grid.destroy()</code> chiude correttamente il lifecycle della griglia.</> },
];

export function HowItWorks() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section animate={{ opacity: 1, y: 0 }} className="react-how-it-works" initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }} transition={{ duration: 0.32, ease: 'easeOut' }}>
      <p className="react-how-it-works__kicker">Come funziona</p>
      <h2>React gestisce l’esperienza. AMB Grid gestisce la griglia.</h2>
      <p className="react-how-it-works__summary">React controlla layout, componenti e interazioni applicative; AMB Grid mantiene il proprio ciclo di editing, validazione, stato e payload all’interno di un container React.</p>
      <div className="react-how-it-works__concepts">
        {concepts.map(({ icon: Icon, title, text }, index) => (
          <motion.article animate={{ opacity: 1, y: 0 }} className="react-how-it-works__concept" initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }} key={title} transition={{ delay: shouldReduceMotion ? 0 : 0.06 * index, duration: 0.28, ease: 'easeOut' }}>
            <Icon aria-hidden="true" className="react-how-it-works__icon" size={19} />
            <h3>{title}</h3>
            <p>{text}</p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
