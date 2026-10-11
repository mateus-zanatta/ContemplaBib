import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, ChipGrid, ScreenTitle, Segmented } from '../components/ui.jsx';
import { PitchRing } from '../components/PitchRing.jsx';
import { useApp } from '../state.jsx';
import { fmtNote, rootChipName, spellScale, stepName, stepsOf } from '../theory/music.js';
import { getScale } from '../theory/data.js';
import { buzz, playNote } from '../audio.js';

const ROOTS = Array.from({ length: 12 }, (_, pc) => pc);

function InstallCard() {
  const [evt, setEvt] = useState(null);
  const [done, setDone] = useState(false);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone;

  useEffect(() => {
    const on = (e) => {
      e.preventDefault();
      setEvt(e);
    };
    const installed = () => setDone(true);
    window.addEventListener('beforeinstallprompt', on);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', on);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  if (standalone || done) return null;
  return (
    <Card className="install">
      <h2>Instale na tela inicial</h2>
      {evt ? (
        <>
          <p>Abra como um app de verdade, em tela cheia e até sem internet.</p>
          <button
            className="btn btn-primary"
            onClick={async () => {
              evt.prompt();
              await evt.userChoice;
              setEvt(null);
            }}
          >
            Instalar app
          </button>
        </>
      ) : ios ? (
        <p>
          No iPhone: toque em <b>Compartilhar</b> (o quadrado com a seta) e depois em <b>“Adicionar à Tela de Início”</b>.
        </p>
      ) : (
        <p>
          No Android (Chrome): toque nos <b>⋮ três pontinhos</b> e escolha <b>“Instalar app”</b> ou <b>“Adicionar à tela inicial”</b>.
        </p>
      )}
    </Card>
  );
}

export function Teoria() {
  const { notation } = useApp();
  const [rootPc, setRootPc] = useState(9);
  const [type, setType] = useState('minor-pent');
  const scale = getScale(type);
  const spelled = spellScale(rootPc, scale);
  const steps = stepsOf(scale);
  const relPc = type === 'minor-pent' ? (rootPc + 3) % 12 : (rootPc + 9) % 12;
  const relScale = getScale(type === 'minor-pent' ? 'major-pent' : 'minor-pent');
  const relName = spellScale(relPc, relScale)[0].name;
  const rootName = spelled[0].name;

  return (
    <div className="stack">
      <ScreenTitle kicker="Comece por aqui" title="O que é a pentatônica?" subtitle="Penta = cinco. Só 5 notas, e quase nada soa errado." />

      <Card>
        <h2>Cinco notas em vez de sete</h2>
        <p>
          A escala “normal” (dó-ré-mi-fá-sol-lá-si) tem <b>7 notas</b>. A pentatônica <b>tira as 2 notas mais “tensas”</b> e
          deixa só 5. Resultado: você pode tocar quase qualquer uma delas por cima de uma música que vai soar bem.
        </p>
        <p className="hint">Escolha um tom e toque nas bolinhas do círculo.</p>

        <ChipGrid
          label="Tônica"
          cols={6}
          value={rootPc}
          onChange={setRootPc}
          options={ROOTS.map((pc) => ({ value: pc, label: rootChipName(pc, notation) }))}
        />
        <div className="gap" />
        <Segmented
          label="Tipo"
          value={type}
          onChange={setType}
          options={[
            { value: 'minor-pent', label: 'Menor' },
            { value: 'major-pent', label: 'Maior' },
          ]}
        />
        <PitchRing rootPc={rootPc} scale={scale} notation={notation} />
        <p className="center strong">
          {fmtNote(rootName, notation)} {type === 'minor-pent' ? 'menor' : 'maior'} pentatônica
        </p>
      </Card>

      <Card>
        <h2>A “receita” da escala</h2>
        <p>
          Cada nota fica a uma distância da anterior. <b>T</b> = um tom (2 casas), <b>½</b> = meio tom (1 casa),{' '}
          <b>T+½</b> = tom e meio (3 casas).
        </p>
        <div className="formula">
          <AnimatePresence mode="popLayout">
            {spelled.map((n, i) => (
              <motion.div
                key={type + n.pc + i}
                className="formula-item"
                layout
                initial={{ opacity: 0, y: 14, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22, delay: i * 0.06 }}
              >
                <motion.button
                  className={`note-bubble ${i === 0 ? 'root' : ''}`}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => {
                    buzz(8);
                    playNote(48 + rootPc + n.semi);
                  }}
                >
                  {fmtNote(n.name, notation)}
                </motion.button>
                <small>{n.label.replace('b', '♭')}</small>
                <span className="step">{stepName(steps[i])}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <p className="hint">
          {type === 'minor-pent'
            ? 'Menor: 3 – 2 – 2 – 3 – 2 casas. Saiu a 2ª e a 6ª da escala menor.'
            : 'Maior: 2 – 2 – 3 – 2 – 3 casas. Saiu a 4ª e a 7ª da escala maior.'}
        </p>
      </Card>

      <Card>
        <h2>Menor e maior são “irmãs”</h2>
        <p>
          <b>
            {fmtNote(rootName, notation)} {type === 'minor-pent' ? 'menor' : 'maior'}
          </b>{' '}
          usa exatamente as mesmas notas que{' '}
          <b>
            {fmtNote(relName, notation)} {type === 'minor-pent' ? 'maior' : 'menor'}
          </b>
          . O desenho no braço é o mesmo; muda só qual nota você trata como “casa” (a tônica).
        </p>
        <div className="relative">
          <motion.div key={rootName + type} className="rel-box" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            {fmtNote(rootName, notation)}
            <small>{type === 'minor-pent' ? 'menor' : 'maior'}</small>
          </motion.div>
          <motion.div className="rel-arrow" animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            ⇄
          </motion.div>
          <motion.div key={relName + type} className="rel-box alt" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            {fmtNote(relName, notation)}
            <small>{type === 'minor-pent' ? 'maior' : 'menor'}</small>
          </motion.div>
        </div>
        <p className="hint">Regra prática: a maior está 3 casas acima da menor relativa.</p>
      </Card>

      <Card>
        <h2>Por que todo guitarrista começa por ela?</h2>
        <ul className="bullets">
          <li><b>Fácil:</b> o desenho no braço é pequeno e se repete.</li>
          <li><b>Seguro:</b> sem notas que “brigam” com os acordes.</li>
          <li><b>Versátil:</b> rock, blues, pop, country, MPB, sertanejo…</li>
          <li><b>Móvel:</b> o mesmo desenho, deslizado pelo braço, vira outro tom.</li>
        </ul>
        <p className="hint">Deslize para o lado ➜ para ver no braço da guitarra.</p>
      </Card>

      <InstallCard />
    </div>
  );
}
