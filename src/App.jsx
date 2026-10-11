import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useApp } from './state.jsx';
import { Teoria } from './screens/Teoria.jsx';
import { Braco } from './screens/Braco.jsx';
import { Aula } from './screens/Aula.jsx';
import { Afinacoes } from './screens/Afinacoes.jsx';
import { Escalas } from './screens/Escalas.jsx';
import { buzz } from './audio.js';

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const SCREENS = [
  { id: 'teoria', label: 'Teoria', Comp: Teoria, icon: <Icon><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z" /></Icon> },
  { id: 'braco', label: 'Braço', Comp: Braco, icon: <Icon><rect x="2" y="7" width="20" height="10" rx="2" /><path d="M8 7v10M14 7v10M5 12h.01M11 12h.01M17 12h.01" /></Icon> },
  { id: 'aula', label: 'Aula', Comp: Aula, icon: <Icon><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 21V5M9 8h6" /></Icon> },
  { id: 'afinacoes', label: 'Afinações', Comp: Afinacoes, icon: <Icon><path d="M7 3v8a3 3 0 0 0 6 0V3M10 14v7M17 3v18M14 7h6" /></Icon> },
  { id: 'escalas', label: 'Escalas', Comp: Escalas, icon: <Icon><path d="M3 20h4v-4h4v-4h4V8h4V4" /></Icon> },
];

function Panel({ index, progress, children, id }) {
  // quanto mais longe da tela atual, menor e mais apagado
  const dist = useTransform(progress, (v) => Math.min(1, Math.abs(v * (SCREENS.length - 1) - index)));
  const scale = useTransform(dist, [0, 1], [1, 0.9]);
  const opacity = useTransform(dist, [0, 1], [1, 0.25]);
  const rotateY = useTransform(progress, (v) => (v * (SCREENS.length - 1) - index) * -14);
  return (
    <section className="panel" id={id} role="tabpanel" aria-label={SCREENS[index].label}>
      <motion.div className="panel-inner" style={{ scale, opacity, rotateY, transformPerspective: 900 }}>
        {children}
      </motion.div>
    </section>
  );
}

function SwipeHint({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <div className="swipe-wrap">
          <motion.div className="swipe-hint" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <motion.span animate={{ x: [-10, 12, -10] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}>
              👆
            </motion.span>
            Deslize para os lados
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const { screen, setScreen, nav, notation, toggleNotation, sound, setSound } = useApp();
  const pager = useRef(null);
  const [active, setActive] = useState(Math.min(screen, SCREENS.length - 1));
  const [hint, setHint] = useState(false);
  const raf = useRef(0);

  const { scrollXProgress } = useScroll({ container: pager });
  const bar = useSpring(scrollXProgress, { stiffness: 200, damping: 30 });

  const scrollToIndex = useCallback((i, smooth = true) => {
    const el = pager.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  // restaura a última tela
  useLayoutEffect(() => scrollToIndex(active, false), []); // eslint-disable-line react-hooks/exhaustive-deps

  // outras telas pedindo para navegar (ex.: botão "ir para o Braço")
  useEffect(() => {
    if (nav.i !== null) scrollToIndex(nav.i);
  }, [nav, scrollToIndex]);

  const onScroll = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = pager.current;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      if (i !== active) {
        setActive(i);
        setScreen(i);
        buzz(6);
      }
      setHint(false);
    });
  };

  useEffect(() => {
    const onResize = () => scrollToIndex(active, false);
    const onKey = (e) => {
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight') scrollToIndex(Math.min(active + 1, SCREENS.length - 1));
      if (e.key === 'ArrowLeft') scrollToIndex(Math.max(active - 1, 0));
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
    };
  }, [active, scrollToIndex]);

  // dica de “deslize” só na primeira vez
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem('pentatonica:swipe') === '1';
    } catch { /* ok */ }
    if (seen) return;
    const t1 = setTimeout(() => setHint(true), 1800);
    const t2 = setTimeout(() => {
      setHint(false);
      try { localStorage.setItem('pentatonica:swipe', '1'); } catch { /* ok */ }
    }, 7500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <motion.img
            className="brand-logo"
            src={`${import.meta.env.BASE_URL}icons/logo-em.png`}
            alt="Logo E.M. Aulas de Música"
            width="38"
            height="38"
            initial={{ rotate: -120, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 14 }}
          />
          <div className="brand-text">
            <b>EM Aulas de Música</b>
            <small>Pentatônica</small>
          </div>
        </div>
        <div className="top-actions">
          <motion.button className="icon-btn" whileTap={{ scale: 0.88 }} onClick={toggleNotation} aria-label="Alternar entre cifras e solfejo" title="Alternar entre cifras (A B C) e solfejo (Lá Si Dó)">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={notation} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.12 }}>
                {notation === 'abc' ? 'A B C' : 'Dó Ré'}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <motion.button className="icon-btn" whileTap={{ scale: 0.88 }} onClick={() => setSound(!sound)} aria-label={sound ? 'Desligar som' : 'Ligar som'}>
            {sound ? '🔊' : '🔇'}
          </motion.button>
        </div>
        <motion.div className="scroll-bar" style={{ scaleX: bar }} />
      </header>

      <main className="pager" ref={pager} onScroll={onScroll}>
        {SCREENS.map(({ id, Comp }, i) => (
          <Panel key={id} id={id} index={i} progress={scrollXProgress}>
            <Comp />
          </Panel>
        ))}
      </main>

      <SwipeHint visible={hint} />

      <nav className="tabbar" aria-label="Seções">
        {SCREENS.map((s, i) => (
          <button key={s.id} className={i === active ? 'on' : ''} onClick={() => scrollToIndex(i)} aria-current={i === active ? 'page' : undefined}>
            {i === active && <motion.span layoutId="tab-ind" className="tab-ind" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
            <motion.span className="tab-icon" animate={i === active ? { y: [0, -6, 0], scale: [1, 1.2, 1] } : { y: 0, scale: 1 }} transition={{ duration: 0.4 }}>
              {s.icon}
            </motion.span>
            <span className="tab-label">{s.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
