import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, ScreenTitle } from '../components/ui.jsx';
import { useApp } from '../state.jsx';
import { TUNINGS, STANDARD } from '../theory/data.js';
import { fmtNote } from '../theory/music.js';
import { buzz, playNote } from '../audio.js';

function StringButton({ name, midi, index, diff, notation }) {
  const [ring, setRing] = useState(0);
  return (
    <div className="string-col">
      <motion.button
        className="string-btn"
        whileTap={{ scale: 0.88 }}
        onClick={() => {
          buzz(10);
          playNote(midi);
          setRing((r) => r + 1);
        }}
        aria-label={`Corda ${6 - index}: ${name}`}
      >
        <small>{6 - index}ª</small>
        <strong>{fmtNote(name, notation)}</strong>
        {ring > 0 && (
          <motion.span
            key={ring}
            className="string-ring"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 0.7 }}
          />
        )}
      </motion.button>
      <motion.span
        className={`diff ${diff < 0 ? 'down' : diff > 0 ? 'up' : ''}`}
        style={{ height: 8 + Math.abs(diff) * 7 }}
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 260, damping: 16, delay: index * 0.05 }}
      />
      <small className="diff-n">{diff === 0 ? '=' : diff > 0 ? `+${diff}` : `−${-diff}`}</small>
    </div>
  );
}

function TuningCard({ t, active, onUse, notation, index }) {
  const timers = useRef([]);
  const strum = () => {
    timers.current.forEach(clearTimeout);
    t.midi.forEach((m, i) => playNote(m, i * 0.12));
    buzz(20);
  };
  return (
    <motion.section
      className={`card tuning ${active ? 'active' : ''}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24, delay: Math.min(index * 0.04, 0.2) }}
    >
      {active && <motion.span layoutId="tuning-glow" className="tuning-glow" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />}
      <div className="tuning-inner">
        <div className="row-between">
          <h2>{t.name}</h2>
          <AnimatePresence>
            {active && (
              <motion.span className="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                ✓ em uso
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="strings">
          {t.midi.map((m, i) => (
            <StringButton key={i} name={t.names[i]} midi={m} index={i} diff={m - STANDARD.midi[i]} notation={notation} />
          ))}
        </div>
        <p className="desc">{t.desc}</p>
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={strum}>
            Ouvir
          </button>
          <button className={`btn ${active ? 'btn-ghost' : 'btn-primary'}`} onClick={onUse} disabled={active}>
            {active ? 'Selecionada' : 'Usar nas telas'}
          </button>
        </div>
      </div>
    </motion.section>
  );
}

export function Afinacoes() {
  const { tuningId, setTuningId, notation } = useApp();
  return (
    <div className="stack">
      <ScreenTitle kicker="Deixe afinado" title="Afinações" subtitle="Toque em uma corda para ouvir como ela deve soar." />

      <Card>
        <h2>Como afinar de ouvido</h2>
        <p>
          Na afinação padrão, <b>aperte a casa 5</b> de uma corda: ela deve soar igual à <b>corda solta de baixo</b> (a mais fina
          ao lado). Exceção: da 3ª para a 2ª corda é a <b>casa 4</b>.
        </p>
        <p className="hint">
          Os números embaixo de cada corda mostram quantos semitons ela está diferente da afinação padrão (<b>+</b> mais aguda,{' '}
          <b>−</b> mais grave).
        </p>
      </Card>

      {TUNINGS.map((t, i) => (
        <TuningCard key={t.id} t={t} index={i} active={t.id === tuningId} notation={notation} onUse={() => { buzz(15); setTuningId(t.id); }} />
      ))}
    </div>
  );
}
