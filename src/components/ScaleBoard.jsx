import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Fretboard } from './Fretboard.jsx';
import { Segmented } from './ui.jsx';
import { useApp } from '../state.jsx';
import { TONES, buzz, createBus, playNote } from '../audio.js';
import { buildPositions, fmtDegree, fmtNote, makePattern, scaleNotesInRange, spellScale } from '../theory/music.js';
import { getScale } from '../theory/data.js';

export const POS_COLORS = ['#f4f4f4', '#f2b84b', '#4fd1c5', '#8ab4ff', '#c792ea'];
const SPEEDS = [
  { value: 700, label: 'Lento' },
  { value: 420, label: 'Médio' },
  { value: 230, label: 'Rápido' },
];
const PATTERNS = [
  { value: 'up', label: 'Subir' },
  { value: 'updown', label: 'Sobe-desce' },
  { value: 'threes', label: '3 em 3' },
  { value: 'skips', label: 'Pulando' },
];

/** Botões Todas / 1 / 2 / 3 / 4 / 5 */
export function PosPicker({ value, onChange }) {
  return (
    <div className="pos-row">
      {[0, 1, 2, 3, 4, 5].map((p) => (
        <motion.button
          key={p}
          className={`pos-btn ${value === p ? 'on' : ''}`}
          style={{ '--c': p ? POS_COLORS[p - 1] : 'var(--accent)' }}
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            buzz(6);
            onChange(p);
          }}
        >
          {value === p && <motion.span layoutId="pos-bg" className="pos-bg" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />}
          <span>{p === 0 ? 'Todas' : p}</span>
        </motion.button>
      ))}
    </div>
  );
}

/**
 * Braço + controles de reprodução para qualquer escala/afinação.
 * position: 0 = todas as posições, 1..N = zoom naquela posição
 */
export function ScaleBoard({
  tuning,
  rootPc,
  scaleId,
  position = 0,
  labelMode = 'note',
  range = 'low',
  controls = true,
  lowest = false,
  onPlayStateChange,
}) {
  const { notation, tone, setTone } = useApp();
  const scale = getScale(scaleId);
  const spelled = useMemo(() => spellScale(rootPc, scale), [rootPc, scale]);
  const nameByPc = useMemo(() => new Map(spelled.map((n) => [n.pc, n.name])), [spelled]);
  const positions = useMemo(() => buildPositions(tuning.midi, rootPc, scale, scale.per), [tuning, rootPc, scale]);

  const [pattern, setPattern] = useState('updown');
  const [speed, setSpeed] = useState(420);
  const [playingKey, setPlayingKey] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [revealed, setRevealed] = useState(() => new Set());
  const timers = useRef([]);
  const bus = useRef(null);

  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    bus.current?.stop();
    bus.current = null;
    setPlayingKey(null);
    setIsPlaying(false);
  };
  useEffect(() => () => stop(), []); // limpa ao sair da tela
  useEffect(() => {
    stop();
    setRevealed(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, rootPc, scaleId, tuning.id, range]);
  useEffect(() => onPlayStateChange?.(isPlaying), [isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----- monta as bolinhas -----
  const view = useMemo(() => {
    const labelFor = (pc, deg, key) => {
      if (labelMode === 'degree') return fmtDegree(deg);
      if (labelMode === 'hidden' && !revealed.has(key)) return '';
      return fmtNote(nameByPc.get(pc), notation);
    };

    if (position > 0) {
      let pos = positions[position - 1];
      let shift = 0;
      if (pos.lo >= 12 && (lowest || pos.hi > 24)) shift = -12;
      const notes = pos.notes.map((n) => ({ ...n, f: n.f + shift, pitch: n.pitch + shift }));
      const lo = Math.min(...notes.map((n) => n.f));
      const hi = Math.max(...notes.map((n) => n.f));
      let from = lo <= 1 ? 0 : lo - 1;
      let to = Math.min(24, Math.max(hi + 1, from + 4));
      const color = POS_COLORS[(position - 1) % POS_COLORS.length];
      const own = new Set(notes.map((n) => `${n.s}-${n.f}`));
      const sel = notes.map((n) => {
        const pc = n.pitch % 12;
        const iv = scale.intervals.find((i) => (rootPc + i.semi) % 12 === pc);
        const key = `${n.s}-${n.f}`;
        return { key, s: n.s, f: n.f, pitch: n.pitch, kind: iv.semi === 0 ? 'root' : 'note', color, label: labelFor(pc, iv.label, key) };
      });
      const ghosts = scaleNotesInRange(tuning.midi, rootPc, scale, from, to)
        .filter((n) => !own.has(`${n.s}-${n.f}`))
        .map((n) => ({ key: `${n.s}-${n.f}`, s: n.s, f: n.f, pitch: n.pitch, kind: 'ghost' }));
      return { from, to, dots: [...ghosts, ...sel], seq: sel.slice().sort((a, b) => a.pitch - b.pitch) };
    }

    // todas as posições: cada nota recebe a cor da primeira caixa que a contém
    const from = range === 'high' ? 12 : 0;
    const to = range === 'high' ? 24 : 12;
    const owner = new Map();
    if (scale.per === 2) {
      positions.forEach((p, i) => {
        for (const off of [-12, 0, 12]) {
          for (const n of p.notes) {
            const f = n.f + off;
            if (f >= 0 && f <= 24 && !owner.has(`${n.s}-${f}`)) owner.set(`${n.s}-${f}`, i);
          }
        }
      });
    }
    const dots = scaleNotesInRange(tuning.midi, rootPc, scale, from, to).map((n) => {
      const key = `${n.s}-${n.f}`;
      const o = owner.get(key);
      return {
        key, s: n.s, f: n.f, pitch: n.pitch,
        kind: n.semi === 0 ? 'root' : 'note',
        color: o !== undefined ? POS_COLORS[o % POS_COLORS.length] : undefined,
        label: labelFor(n.pc, n.label, key),
      };
    });
    const seen = new Set();
    const seq = dots
      .slice()
      .sort((a, b) => a.pitch - b.pitch)
      .filter((d) => (seen.has(d.pitch) ? false : (seen.add(d.pitch), true)));
    return { from, to, dots, seq };
  }, [position, positions, range, labelMode, revealed, tuning, rootPc, scale, nameByPc, notation, lowest]);

  const onDot = (d) => {
    buzz(8);
    playNote(d.pitch);
    if (labelMode === 'hidden') setRevealed((r) => new Set(r).add(d.key));
  };

  const play = () => {
    stop();
    const seq = makePattern(view.seq, pattern);
    if (!seq.length) return;
    bus.current = createBus();
    setIsPlaying(true);
    seq.forEach((d, i) => {
      playNote(d.pitch, 0.05 + (i * speed) / 1000, bus.current.node);
      timers.current.push(
        setTimeout(() => {
          setPlayingKey(d.key);
          if (labelMode === 'hidden') setRevealed((r) => new Set(r).add(d.key));
        }, 50 + i * speed),
      );
    });
    timers.current.push(setTimeout(stop, 50 + seq.length * speed + 300));
  };

  return (
    <div className="scaleboard">
      <Fretboard
        strings={tuning.names.map((n) => fmtNote(n, notation))}
        fretFrom={view.from}
        fretTo={view.to}
        dots={view.dots}
        playingKey={playingKey}
        onDot={onDot}
      />
      {controls && (
        <div className="player">
          <Segmented small label="Padrão" options={PATTERNS} value={pattern} onChange={setPattern} />
          <div className="player-row">
            <motion.button
              className={`play-btn ${isPlaying ? 'is-playing' : ''}`}
              whileTap={{ scale: 0.94 }}
              onClick={isPlaying ? stop : play}
              aria-label={isPlaying ? 'Parar' : 'Tocar'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isPlaying ? 'stop' : 'play'}
                  className="play-icon"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ duration: 0.16 }}
                >
                  {isPlaying ? '■ Parar' : '▶ Tocar'}
                </motion.span>
              </AnimatePresence>
              {isPlaying && <span className="play-ripple" />}
            </motion.button>
            <Segmented small label="Velocidade" options={SPEEDS} value={speed} onChange={setSpeed} />
          </div>
          <Segmented small label="Timbre da guitarra" options={TONES.map((t) => ({ value: t.id, label: t.label }))} value={tone} onChange={setTone} />
        </div>
      )}
    </div>
  );
}
