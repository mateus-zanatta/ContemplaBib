import { useId } from 'react';
import { motion } from 'framer-motion';
import { buzz } from '../audio.js';

/** Seletor com “pílula” que desliza entre as opções */
export function Segmented({ options, value, onChange, small, label }) {
  const id = useId();
  return (
    <div className={`seg ${small ? 'seg-small' : ''}`} role="tablist" aria-label={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            className={active ? 'on' : ''}
            onClick={() => {
              buzz(6);
              onChange(o.value);
            }}
          >
            {active && <motion.span layoutId={`seg-${id}`} className="seg-pill" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />}
            <span className="seg-label">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Grade de botões (tônicas, escalas...) com destaque animado */
export function ChipGrid({ options, value, onChange, cols = 6, label }) {
  const id = useId();
  return (
    <div className="chips" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} role="listbox" aria-label={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <motion.button
            key={o.value}
            role="option"
            aria-selected={active}
            className={`chip ${active ? 'on' : ''}`}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              buzz(6);
              onChange(o.value);
            }}
          >
            {active && <motion.span layoutId={`chip-${id}`} className="chip-bg" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
            <span className="chip-label">{o.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** Cartão que “sobe” suavemente quando aparece */
export function Card({ children, className = '', delay = 0, ...rest }) {
  return (
    <motion.section
      className={`card ${className}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24, delay }}
      {...rest}
    >
      {children}
    </motion.section>
  );
}

export function ScreenTitle({ kicker, title, subtitle }) {
  return (
    <header className="screen-title">
      {kicker && (
        <motion.span className="kicker" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
          {kicker}
        </motion.span>
      )}
      <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
        {title}
      </motion.h1>
      {subtitle && <p>{subtitle}</p>}
      <svg className="title-arrow" viewBox="0 0 320 16" aria-hidden>
        <motion.path
          d="M2 8H312M303 2l10 6-10 6"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
        />
      </svg>
    </header>
  );
}

export function Button({ children, variant = 'primary', ...props }) {
  return (
    <motion.button className={`btn btn-${variant}`} whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.02 }} {...props}>
      {children}
    </motion.button>
  );
}
