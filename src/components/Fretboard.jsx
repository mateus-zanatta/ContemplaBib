import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const W = 360;
const PAD_L = 24;
const PAD_R = 10;
const PAD_T = 12;
const PAD_B = 22;
const SINGLE = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE = [12, 24];

/**
 * Braço da guitarra em SVG, com animações.
 * - strings: nomes das cordas, da mais grave (embaixo) para a mais aguda (em cima)
 * - dots: [{ key, s, f, kind: 'root'|'note'|'ghost', label, color }]
 * - playingKey: bolinha "acesa" agora (durante a reprodução)
 * - onDot(dot) / onCell(s, f): toques
 * - cellMarks: { 's-f': 'ok' | 'bad' } feedback do desafio
 */
export function Fretboard({
  strings,
  fretFrom = 0,
  fretTo = 12,
  dots = [],
  playingKey = null,
  onDot,
  onCell,
  cellMarks = {},
  sg: sgProp,
}) {
  const n = strings.length;
  const open = fretFrom === 0;
  const cols = open ? fretTo + 0.85 : fretTo - fretFrom + 1;
  const fw = (W - PAD_L - PAD_R) / cols;
  const sg = sgProp || (cols <= 8 ? 40 : 30);
  const H = PAD_T + n * sg + PAD_B;
  const openW = open ? fw * 0.85 : 0;
  const x0 = PAD_L;
  const nutX = x0 + openW;
  const r = Math.min(fw * 0.4, sg * 0.42, 17);

  const cx = (f) => (open ? (f === 0 ? x0 + openW / 2 : nutX + (f - 0.5) * fw) : x0 + (f - fretFrom + 0.5) * fw);
  const lineX = (f) => (open ? nutX + f * fw : x0 + (f - fretFrom) * fw); // linha à direita da casa f (aberto) / à esquerda (zoom)
  const cy = (s) => PAD_T + (n - 1 - s) * sg + sg / 2;
  const boardL = open ? x0 : x0;
  const boardR = W - PAD_R;
  const boardT = PAD_T;
  const boardB = PAD_T + n * sg;

  const frets = [];
  for (let f = open ? 1 : fretFrom; f <= fretTo; f++) frets.push(f);

  // vibração das cordas e ondas ao tocar
  const [vibes, setVibes] = useState({});
  const [pulses, setPulses] = useState([]);
  const pulseId = useRef(0);

  const trigger = (s, f) => {
    setVibes((v) => ({ ...v, [s]: (v[s] || 0) + 1 }));
    const id = ++pulseId.current;
    setPulses((p) => [...p.slice(-6), { id, x: cx(f), y: cy(s) }]);
  };

  // quando o pai acende uma bolinha (reprodução), dispara o efeito também
  const lastPlaying = useRef(null);
  useEffect(() => {
    if (playingKey && playingKey !== lastPlaying.current) {
      const d = dots.find((x) => x.key === playingKey);
      if (d) trigger(d.s, d.f);
    }
    lastPlaying.current = playingKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playingKey]);

  const handleDot = (d) => {
    trigger(d.s, d.f);
    onDot?.(d);
  };

  return (
    <div className="fretboard">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Braço da guitarra">
        <defs>
          <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1f2228" />
            <stop offset="0.5" stopColor="#181b20" />
            <stop offset="1" stopColor="#121418" />
          </linearGradient>
          <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x={boardL} y={boardT} width={boardR - boardL} height={boardB - boardT} rx="8" fill="url(#wood)" />

        {/* marcações (bolinhas do braço) */}
        {frets
          .filter((f) => SINGLE.includes(f) || DOUBLE.includes(f))
          .map((f) =>
            DOUBLE.includes(f) ? (
              <g key={`in${f}`} fill="rgba(255,255,255,.07)">
                <circle cx={cx(f)} cy={boardT + (boardB - boardT) * 0.3} r="5" />
                <circle cx={cx(f)} cy={boardT + (boardB - boardT) * 0.7} r="5" />
              </g>
            ) : (
              <circle key={`in${f}`} cx={cx(f)} cy={(boardT + boardB) / 2} r="5" fill="rgba(255,255,255,.07)" />
            ),
          )}

        {/* trastes */}
        {frets.map((f) => (
          <line
            key={`fr${f}`}
            x1={lineX(f)}
            x2={lineX(f)}
            y1={boardT}
            y2={boardB}
            stroke="#5d626d"
            strokeWidth="1.6"
            opacity=".9"
          />
        ))}
        {!open && <line x1={lineX(fretTo + 1)} x2={lineX(fretTo + 1)} y1={boardT} y2={boardB} stroke="#5d626d" strokeWidth="1.6" opacity=".9" />}
        {open && <rect x={nutX - 3} y={boardT} width="5" height={boardB - boardT} rx="1.5" fill="#f1f1f1" />}

        {/* cordas */}
        {strings.map((_, s) => (
          <motion.line
            key={`${s}-${vibes[s] || 0}`}
            x1={boardL + 2}
            x2={boardR - 2}
            y1={cy(s)}
            y2={cy(s)}
            stroke="#c9ccd3"
            strokeWidth={s < 3 ? 1 + (3 - s) * 0.45 : 1}
            opacity=".85"
            initial={{ y: 0 }}
            animate={vibes[s] ? { y: [0, -3, 3, -2.2, 2.2, -1.2, 1.2, 0] } : { y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}

        {/* áreas de toque (desafio) */}
        {onCell &&
          strings.map((_, s) =>
            [...(open ? [0] : []), ...frets].map((f) => {
              const mark = cellMarks[`${s}-${f}`];
              return (
                <g key={`c${s}-${f}`} onClick={() => onCell(s, f)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={f === 0 && open ? x0 : lineX(open ? f - 1 : f)}
                    y={cy(s) - sg / 2}
                    width={f === 0 && open ? openW : fw}
                    height={sg}
                    fill="transparent"
                  />
                  {mark === 'bad' && (
                    <motion.circle
                      cx={cx(f)}
                      cy={cy(s)}
                      r={r}
                      fill="#e03023"
                      initial={{ scale: 0.5, opacity: 1 }}
                      animate={{ scale: [0.5, 1.15, 1], opacity: [1, 1, 0] }}
                      transition={{ duration: 0.8, times: [0, 0.25, 1] }}
                      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    />
                  )}
                </g>
              );
            }),
          )}

        {/* bolinhas */}
        <AnimatePresence>
          {dots.map((d, i) => {
            const playing = d.key === playingKey;
            const x = cx(d.f);
            const y = cy(d.s);
            const ghost = d.kind === 'ghost';
            const root = d.kind === 'root';
            const rr = ghost ? r * 0.3 : r;
            return (
              <g key={d.key} transform={`translate(${x} ${y})`}>
                <motion.g
                  style={{ transformBox: 'fill-box', transformOrigin: 'center', cursor: ghost || !onDot ? 'default' : 'pointer' }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: playing ? 1.38 : 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', stiffness: 460, damping: 20, delay: playing ? 0 : Math.min(i * 0.008, 0.25) }}
                  whileTap={ghost ? undefined : { scale: 0.85 }}
                  onClick={ghost ? undefined : () => handleDot(d)}
                >
                  {!ghost && <circle r={r + 5} fill="transparent" />}
                  {root && !ghost && (
                    <motion.circle
                      r={r + 3.5}
                      fill="none"
                      stroke="var(--root)"
                      strokeWidth="1.8"
                      animate={{ opacity: [0.9, 0.25, 0.9], scale: [1, 1.12, 1] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    />
                  )}
                  <circle
                    r={rr}
                    fill={ghost ? 'rgba(255,255,255,.22)' : root ? 'var(--root)' : d.color || 'var(--note)'}
                    stroke={playing ? '#fff' : 'rgba(0,0,0,.45)'}
                    strokeWidth={playing ? 2.4 : 1}
                    filter={playing ? 'url(#glow)' : undefined}
                  />
                  {!ghost && d.label && (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={Math.max(8, r * (d.label.length > 2 ? 0.72 : 0.9))}
                      fontWeight="800"
                      fill={root ? '#fff' : '#0b0c0f'}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {d.label}
                    </text>
                  )}
                </motion.g>
              </g>
            );
          })}
        </AnimatePresence>

        {/* ondas ao tocar */}
        {pulses.map((p) => (
          <motion.circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={r}
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            initial={{ r, opacity: 0.9 }}
            animate={{ r: r + 20, opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            onAnimationComplete={() => setPulses((all) => all.filter((x) => x.id !== p.id))}
            style={{ pointerEvents: 'none' }}
          />
        ))}

        {/* nomes das cordas soltas */}
        {strings.map((name, s) => (
          <text key={`nm${s}`} x={PAD_L - 7} y={cy(s)} textAnchor="end" dominantBaseline="central" fontSize="10.5" fontWeight="700" fill="var(--muted)">
            {name}
          </text>
        ))}

        {/* números das casas */}
        {frets.map((f) => (
          <text
            key={`n${f}`}
            x={cx(f)}
            y={H - 6}
            textAnchor="middle"
            fontSize="9.5"
            fontWeight={SINGLE.includes(f) || DOUBLE.includes(f) ? 800 : 500}
            fill={SINGLE.includes(f) || DOUBLE.includes(f) ? 'var(--accent-text)' : 'var(--muted)'}
          >
            {f}
          </text>
        ))}
        {open && (
          <text x={cx(0)} y={H - 6} textAnchor="middle" fontSize="8.5" fill="var(--muted)">
            solta
          </text>
        )}
      </svg>
    </div>
  );
}
