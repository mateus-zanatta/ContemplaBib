import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, ChipGrid, ScreenTitle, Segmented } from '../components/ui.jsx';
import { Fretboard } from '../components/Fretboard.jsx';
import { PosPicker, ScaleBoard } from '../components/ScaleBoard.jsx';
import { Confetti } from '../components/Confetti.jsx';
import { useApp } from '../state.jsx';
import { STANDARD } from '../theory/data.js';
import { fmtNote, sharpName, spellScale } from '../theory/music.js';
import { getScale } from '../theory/data.js';
import { buzz, playError, playNote, playSuccess } from '../audio.js';

const A = 9;

/* ---------- Passo 2: desafio "ache a tônica" ---------- */
function RootChallenge() {
  const { notation } = useApp();
  const roots = useMemo(() => {
    const out = [];
    STANDARD.midi.forEach((open, s) => {
      for (let f = 0; f <= 12; f++) if ((open + f) % 12 === A) out.push(`${s}-${f}`);
    });
    return out;
  }, []);
  const [found, setFound] = useState(() => new Set());
  const [marks, setMarks] = useState({});
  const [msg, setMsg] = useState('');
  const [hint, setHint] = useState(false);
  const [party, setParty] = useState(false);
  const done = found.size === roots.length;

  const tap = (s, f) => {
    const key = `${s}-${f}`;
    const midi = STANDARD.midi[s] + f;
    playNote(midi);
    if (found.has(key)) return;
    if (roots.includes(key)) {
      buzz(15);
      const next = new Set(found).add(key);
      setFound(next);
      setMsg(next.size === roots.length ? '🎉 Você achou todas as notas Lá!' : `Isso! Falta${roots.length - next.size > 1 ? 'm' : ''} ${roots.length - next.size}.`);
      if (next.size === roots.length) {
        setTimeout(() => {
          playSuccess();
          setParty(true);
          setTimeout(() => setParty(false), 2200);
        }, 250);
      }
    } else {
      buzz([20, 30, 20]);
      setTimeout(playError, 120);
      setMarks((m) => ({ ...m, [key]: 'bad' }));
      setTimeout(() => setMarks((m) => { const c = { ...m }; delete c[key]; return c; }), 700);
      setMsg(`Essa é ${fmtNote(sharpName(midi), notation)}. Procure a nota ${fmtNote('A', notation)}!`);
    }
  };

  const dots = [
    ...(hint ? roots.filter((k) => !found.has(k)).map((k) => { const [s, f] = k.split('-').map(Number); return { key: 'h' + k, s, f, kind: 'note', color: 'rgba(255,255,255,.35)', label: '?' }; }) : []),
    ...[...found].map((k) => { const [s, f] = k.split('-').map(Number); return { key: k, s, f, kind: 'root', label: fmtNote('A', notation) }; }),
  ];

  return (
    <div className="challenge">
      <Fretboard strings={STANDARD.names.map((n) => fmtNote(n, notation))} fretFrom={0} fretTo={12} dots={dots} onCell={tap} cellMarks={marks} />
      <div className="progress-line">
        <motion.div className="progress-fill" animate={{ width: `${(found.size / roots.length) * 100}%` }} transition={{ type: 'spring', stiffness: 200, damping: 24 }} />
      </div>
      <div className="row-between">
        <b>{found.size}/{roots.length} encontradas</b>
        <button
          className="pill-btn"
          onClick={() => {
            setHint(true);
            setTimeout(() => setHint(false), 1800);
          }}
        >
          💡 Dica
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={msg} className={`challenge-msg ${done ? 'win' : ''}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {msg || 'Toque no braço onde você acha que está a nota Lá.'}
        </motion.p>
      </AnimatePresence>
      {found.size > 0 && (
        <button className="pill-btn" onClick={() => { setFound(new Set()); setMsg(''); }}>
          ↺ Recomeçar
        </button>
      )}
      <Confetti show={party} />
    </div>
  );
}

/* ---------- Passo 5: mova a forma ---------- */
function MoveShape() {
  const { notation } = useApp();
  const [fret, setFret] = useState(5);
  const rootPc = (STANDARD.midi[0] + fret) % 12;
  const name = spellScale(rootPc, getScale('minor-pent'))[0].name;
  return (
    <div>
      <ScaleBoard tuning={STANDARD} rootPc={rootPc} scaleId="minor-pent" position={1} labelMode="degree" controls={false} />
      <div className="slider-wrap">
        <label htmlFor="fret">
          Tônica na casa <b>{fret}</b> da 6ª corda → <b className="root-text">{fmtNote(name, notation)} menor pentatônica</b>
        </label>
        <input
          id="fret"
          type="range"
          min="0"
          max="11"
          value={fret}
          onChange={(e) => {
            setFret(+e.target.value);
            buzz(4);
          }}
          onPointerUp={() => playNote(STANDARD.midi[0] + fret)}
        />
        <div className="slider-ticks">{Array.from({ length: 12 }, (_, i) => <span key={i}>{i}</span>)}</div>
      </div>
    </div>
  );
}

/* ---------- Passo 6: checklist ---------- */
const TODO = [
  'Toque a posição 1 subindo e descendo, devagar 🐢',
  'Experimente o padrão “De 3 em 3”',
  'Comece e termine sempre na tônica (a bolinha vermelha)',
  'Escolha outro tom e repita',
  'Aprenda as outras 4 posições na tela Braço',
];

function Checklist() {
  const [ticked, setTicked] = useState(() => new Set());
  return (
    <ul className="todo">
      {TODO.map((t, i) => {
        const on = ticked.has(i);
        return (
          <motion.li key={i} whileTap={{ scale: 0.97 }} onClick={() => { buzz(8); setTicked((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; }); }} className={on ? 'on' : ''}>
            <span className="box">
              <svg viewBox="0 0 20 20">
                <motion.path d="M4 10.5l4 4 8-9" fill="none" stroke="#0c0f1c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: 0.25 }} />
              </svg>
            </span>
            {t}
          </motion.li>
        );
      })}
    </ul>
  );
}

/* ---------- Os passos ---------- */
function MajorMinor() {
  const { notation } = useApp();
  const [kind, setKind] = useState('minor');
  const minor = kind === 'minor';
  return (
    <>
      <Segmented
        label="Escala"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'minor', label: `${fmtNote('A', notation)} menor` },
          { value: 'major', label: `${fmtNote('C', notation)} maior` },
        ]}
      />
      <div className="gap" />
      <ScaleBoard
        tuning={STANDARD}
        rootPc={minor ? 9 : 0}
        scaleId={minor ? 'minor-pent' : 'major-pent'}
        position={minor ? 1 : 5}
        lowest
        labelMode="degree"
        controls={false}
      />
      <p className="hint">Repare: as bolinhas não mudaram de lugar. Só a vermelha (a tônica) pulou!</p>
    </>
  );
}

function AllBoxes() {
  const [pos, setPos] = useState(0);
  return (
    <>
      <PosPicker value={pos} onChange={setPos} />
      <div className="gap" />
      <ScaleBoard tuning={STANDARD} rootPc={A} scaleId="minor-pent" position={pos} labelMode="note" />
    </>
  );
}

function useSteps(notation) {
  const note = (n) => fmtNote(n, notation);
  return [
    {
      emoji: '🖐️',
      title: 'Só cinco notas',
      body: (
        <>
          <p>
            Vamos aprender a <b>{note('A')} menor pentatônica</b>, a mais famosa. Suas notas são{' '}
            <b>{['A', 'C', 'D', 'E', 'G'].map(note).join(' – ')}</b>.
          </p>
          <ScaleBoard tuning={STANDARD} rootPc={A} scaleId="minor-pent" position={0} labelMode="note" />
          <p className="hint">Cada bolinha é uma nota da escala. Toque nelas e aperte ▶ para ouvir tudo.</p>
        </>
      ),
    },
    {
      emoji: '🎯',
      title: 'Desafio: ache a tônica',
      body: (
        <>
          <p>
            A <b>tônica</b> (ou raiz) é a nota que dá nome à escala — aqui, <b>{note('A')}</b>. Ache todas no braço! Para se
            guiar: na corda mais grossa, cada casa sobe meio tom ({['E', 'F', 'F#', 'G', 'G#', 'A'].map(note).join(' → ')}…).
          </p>
          <RootChallenge />
        </>
      ),
    },
    {
      emoji: '📦',
      title: 'A caixa 1',
      body: (
        <>
          <p>
            Agora o desenho: <b>2 notas em cada corda</b>, na região das casas 5 a 8. Os números mostram o <b>grau</b> de cada nota
            na escala (1 = tônica).
          </p>
          <ScaleBoard tuning={STANDARD} rootPc={A} scaleId="minor-pent" position={1} labelMode="degree" />
          <p>
            <b>Mão:</b> indicador na casa 5, anelar nas casas 7 e 8. Mantenha a mão parada e use um dedo por casa.
          </p>
        </>
      ),
    },
    {
      emoji: '🧩',
      title: 'As 5 caixas',
      body: (
        <>
          <p>
            Uma caixa só cobre 4 casas. Para o braço inteiro existem <b>5 caixas</b> que se encaixam. Toque em cada número e veja
            como uma começa onde a outra termina.
          </p>
          <AllBoxes />
        </>
      ),
    },
    {
      emoji: '👯',
      title: 'Menor e maior: mesmo desenho',
      body: (
        <>
          <p>
            {note('A')} menor e {note('C')} maior usam as <b>mesmas notas</b>. Alterne e observe só a tônica mudar.
          </p>
          <MajorMinor />
        </>
      ),
    },
    {
      emoji: '🛝',
      title: 'Deslize para trocar de tom',
      body: (
        <>
          <p>
            A grande mágica: o desenho é sempre igual, <b>o tom muda conforme a casa da tônica</b>. Arraste o controle e veja a caixa
            1 andar pelo braço.
          </p>
          <MoveShape />
        </>
      ),
    },
    {
      emoji: '🚀',
      title: 'Hora de praticar',
      body: (
        <>
          <p>Treine com calma. Marque o que já fez:</p>
          <Checklist />
          <ScaleBoard tuning={STANDARD} rootPc={A} scaleId="minor-pent" position={1} labelMode="note" />
        </>
      ),
    },
  ];
}

export function Aula() {
  const { notation, goTo } = useApp();
  const steps = useSteps(notation);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [party, setParty] = useState(false);
  const [finished, setFinished] = useState(false);
  const top = useRef(null);
  const last = i === steps.length - 1;

  const go = (n) => {
    if (n < 0 || n >= steps.length) return;
    buzz(8);
    setDir(n > i ? 1 : -1);
    setI(n);
    top.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  useEffect(() => {
    if (!party) return;
    playSuccess();
    const t = setTimeout(() => setParty(false), 2200);
    return () => clearTimeout(t);
  }, [party]);

  const step = steps[i];
  return (
    <div className="stack" ref={top}>
      <ScreenTitle emoji="📚" title="Aula guiada" subtitle="Passo a passo, na afinação padrão." />

      <div className="steps" role="tablist" aria-label="Passos da aula">
        {steps.map((s, k) => (
          <button key={k} className={k <= i ? 'on' : ''} onClick={() => go(k)} aria-label={`Passo ${k + 1}: ${s.title}`}>
            <motion.span initial={false} animate={{ scaleX: k <= i ? 1 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
          </button>
        ))}
      </div>

      <Card className="lesson">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={i}
            custom={dir}
            variants={{
              enter: (d) => ({ x: d * 50, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d) => ({ x: d * -50, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 320, damping: 32, duration: 0.2 }}
          >
            <div className="lesson-head">
              <motion.span className="lesson-emoji" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.1 }}>
                {step.emoji}
              </motion.span>
              <div>
                <small>
                  Passo {i + 1} de {steps.length}
                </small>
                <h2>{step.title}</h2>
              </div>
            </div>
            {step.body}
          </motion.div>
        </AnimatePresence>
      </Card>

      <div className="lesson-nav">
        <button className="btn btn-ghost" disabled={i === 0} onClick={() => go(i - 1)}>
          ‹ Voltar
        </button>
        {last ? (
          <motion.button className="btn btn-primary" whileTap={{ scale: 0.94 }} animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} onClick={() => { setParty(true); setFinished(true); }}>
            🎉 Concluir aula
          </motion.button>
        ) : (
          <button className="btn btn-primary" onClick={() => go(i + 1)}>
            Próximo ›
          </button>
        )}
      </div>

      <AnimatePresence>
        {finished && (
          <motion.div className="finish" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <b>Parabéns! Você já conhece a pentatônica 🎸</b>
            <button className="btn btn-primary" onClick={() => goTo(1)}>
              Ir para o Braço →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <Confetti show={party} />
    </div>
  );
}
