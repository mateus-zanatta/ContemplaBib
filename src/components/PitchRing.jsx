import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { buzz, createBus, playNote } from '../audio.js';
import { fmtDegree, fmtNote, spellScale } from '../theory/music.js';

const R = 112;
const C = 150;
const ang = (i) => ((i * 30 - 90) * Math.PI) / 180;
const pt = (i, r = R) => [C + r * Math.cos(ang(i)), C + r * Math.sin(ang(i))];

/**
 * Círculo dos 12 sons. A tônica fica sempre no topo, então o “desenho”
 * da escala é o mesmo em qualquer tom — é isso que a pentatônica ensina.
 */
export function PitchRing({ rootPc, scale, notation }) {
  const spelled = spellScale(rootPc, scale);
  const bySemi = new Map(spelled.map((n) => [n.semi, n]));
  const [active, setActive] = useState(null);
  const [playing, setPlaying] = useState(false);
  const timers = useRef([]);
  const bus = useRef(null);
  const rootMidi = 48 + rootPc;

  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    bus.current?.stop();
    setActive(null);
    setPlaying(false);
  };
  useEffect(() => () => stop(), []);
  useEffect(stop, [rootPc, scale]);

  const hit = (semi) => {
    buzz(8);
    playNote(rootMidi + semi);
    setActive(semi);
    clearTimeout(timers.current.tap);
    timers.current.tap = setTimeout(() => setActive(null), 450);
  };

  const run = () => {
    stop();
    setPlaying(true);
    bus.current = createBus();
    const semis = [...scale.intervals.map((i) => i.semi), 12];
    semis.forEach((semi, i) => {
      playNote(rootMidi + semi, 0.05 + i * 0.42, bus.current.node);
      timers.current.push(setTimeout(() => setActive(semi), 50 + i * 420));
    });
    timers.current.push(setTimeout(stop, 50 + semis.length * 420 + 300));
  };

  const poly = scale.intervals.map((iv, k) => `${k ? 'L' : 'M'}${pt(iv.semi).join(' ')}`).join(' ') + ' Z';

  return (
    <div className="ring">
      <svg viewBox="0 0 300 300" role="img" aria-label="Círculo dos 12 sons">
        <circle cx={C} cy={C} r={R} fill="none" stroke="var(--line)" strokeDasharray="2 6" />
        <motion.path
          key={scale.id + rootPc}
          d={poly}
          fill="rgba(224,48,35,.12)"
          stroke="var(--accent)"
          strokeWidth="2.2"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        />
        {Array.from({ length: 12 }, (_, semi) => {
          const n = bySemi.get(semi);
          const [x, y] = pt(semi);
          const on = !!n;
          const isActive = active === semi;
          const [lx, ly] = pt(semi, R + 24);
          return (
            <g key={semi} onClick={() => on && hit(semi)} style={{ cursor: on ? 'pointer' : 'default' }}>
              {on && <circle cx={x} cy={y} r="26" fill="transparent" />}
              <motion.circle
                cx={x}
                cy={y}
                initial={false}
                animate={{ r: on ? (isActive ? 22 : 18) : 4.5, fill: on ? (semi === 0 ? '#e03023' : '#f4f4f4') : '#3a3e48' }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                stroke={isActive ? '#fff' : 'none'}
                strokeWidth="2.5"
              />
              {on && (
                <>
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="800" fill={semi === 0 ? '#fff' : '#0b0c0f'} pointerEvents="none">
                    {fmtNote(n.name, notation)}
                  </text>
                  <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize="10.5" fontWeight="700" fill="var(--accent-text)" pointerEvents="none">
                    {fmtDegree(n.label)}
                  </text>
                </>
              )}
            </g>
          );
        })}
        <text x={C} y={C - 6} textAnchor="middle" fontSize="12" fill="var(--muted)">
          {scale.intervals.length} notas
        </text>
        <text x={C} y={C + 14} textAnchor="middle" fontSize="12" fill="var(--muted)">
          de 12 possíveis
        </text>
      </svg>
      <button className="btn btn-primary ring-btn" onClick={playing ? stop : run}>
        {playing ? '■ Parar' : '▶ Ouvir a escala'}
      </button>
    </div>
  );
}
