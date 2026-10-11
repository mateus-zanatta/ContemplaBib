import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const COLORS = ['#ff5d73', '#ffb627', '#33d6a6', '#6c8cff', '#ff7ac8', '#b58cff'];

export function Confetti({ show }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 340,
        y: -120 - Math.random() * 160,
        rot: Math.random() * 720 - 360,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
        delay: Math.random() * 0.12,
      })),
    [show],
  );
  return (
    <div className="confetti" aria-hidden>
      <AnimatePresence>
        {show &&
          bits.map((b) => (
            <motion.span
              key={b.id}
              style={{ background: b.color, width: b.size, height: b.size * 0.45 }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
              animate={{ x: b.x, y: [0, b.y, 260], opacity: [1, 1, 0], rotate: b.rot }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.9, delay: b.delay, ease: 'easeOut', times: [0, 0.35, 1] }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}
