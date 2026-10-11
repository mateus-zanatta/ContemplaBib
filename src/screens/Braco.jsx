import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, ChipGrid, ScreenTitle, Segmented } from '../components/ui.jsx';
import { PosPicker, ScaleBoard } from '../components/ScaleBoard.jsx';
import { useApp } from '../state.jsx';
import { buildPositions, fmtDegree, fmtNote, rootChipName, spellScale } from '../theory/music.js';
import { getScale, getTuning } from '../theory/data.js';
import { buzz, playNote } from '../audio.js';

const ROOTS = Array.from({ length: 12 }, (_, pc) => pc);

export function Braco() {
  const { tuningId, notation, goTo } = useApp();
  const tuning = getTuning(tuningId);
  const [rootPc, setRootPc] = useState(9);
  const [type, setType] = useState('minor-pent');
  const [position, setPosition] = useState(1);
  const [labelMode, setLabelMode] = useState('note');
  const [range, setRange] = useState('low');
  const scale = getScale(type);
  const spelled = useMemo(() => spellScale(rootPc, scale), [rootPc, scale]);
  const positions = useMemo(() => buildPositions(tuning.midi, rootPc, scale, 2), [tuning, rootPc, scale]);
  const pos = position > 0 ? positions[position - 1] : null;

  return (
    <div className="stack">
      <ScreenTitle emoji="🎸" title="Pentatônica no braço" subtitle="Toque nas bolinhas para ouvir cada nota." />

      <Card>
        <div className="row-between">
          <span className="label">Afinação</span>
          <button className="pill-btn" onClick={() => goTo(3)}>
            {tuning.name} · <span className="mono">{tuning.names.map((n) => fmtNote(n, notation)).join(' ')}</span> ✎
          </button>
        </div>

        <span className="label">Tom (tônica)</span>
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
            { value: 'minor-pent', label: '😢 Menor' },
            { value: 'major-pent', label: '😊 Maior' },
          ]}
        />
      </Card>

      <Card>
        <span className="label">Posição (caixa)</span>
        <PosPicker value={position} onChange={setPosition} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={position + type + rootPc}
            className="pos-info"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {pos
              ? `Posição ${position} · casas ${pos.lo}–${pos.hi}${position === 1 ? ' · começa na tônica da corda mais grave' : ''}`
              : 'As 5 caixas juntas, cada uma com sua cor: elas se encaixam como peças de quebra-cabeça.'}
          </motion.p>
        </AnimatePresence>

        <ScaleBoard tuning={tuning} rootPc={rootPc} scaleId={type} position={position} labelMode={labelMode} range={range} />

        <div className="opts">
          <Segmented
            small
            label="Mostrar"
            value={labelMode}
            onChange={setLabelMode}
            options={[
              { value: 'note', label: 'Notas' },
              { value: 'degree', label: 'Graus' },
              { value: 'hidden', label: '🙈 Treino' },
            ]}
          />
          {position === 0 && (
            <Segmented
              small
              label="Casas"
              value={range}
              onChange={setRange}
              options={[
                { value: 'low', label: 'Casas 0–12' },
                { value: 'high', label: 'Casas 12–24' },
              ]}
            />
          )}
        </div>
        {labelMode === 'hidden' && <p className="hint">Modo treino: tente adivinhar a nota e toque para revelar.</p>}
      </Card>

      <Card>
        <h2>Notas desta escala</h2>
        <div className="note-row">
          {spelled.map((n, i) => (
            <motion.button
              key={`${rootPc}${type}${i}`}
              className={`note-bubble big ${i === 0 ? 'root' : ''}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 16, delay: i * 0.05 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => {
                buzz(8);
                playNote(48 + rootPc + n.semi);
              }}
            >
              {fmtNote(n.name, notation)}
              <small>{fmtDegree(n.label)}</small>
            </motion.button>
          ))}
        </div>
        <p className="hint">
          <b className="root-text">Vermelho</b> = tônica (a nota “casa”). Termine suas frases nela e tudo soa resolvido.
        </p>
        {position > 0 && pos && (
          <p>
            <b>Como tocar:</b> coloque o dedo <b>indicador</b> na casa <b>{pos.lo}</b> e use o <b>anelar</b> (e o mindinho, se
            precisar) para as notas mais à frente. Use um dedo por casa e deixe a mão parada.
          </p>
        )}
      </Card>
    </div>
  );
}
