import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, ChipGrid, ScreenTitle, Segmented } from '../components/ui.jsx';
import { ScaleBoard } from '../components/ScaleBoard.jsx';
import { useApp } from '../state.jsx';
import { SCALES, TUNINGS, getScale, getTuning } from '../theory/data.js';
import { fmtDegree, fmtNote, rootChipName, spellScale, stepName, stepsOf } from '../theory/music.js';
import { buzz, playNote } from '../audio.js';

const ROOTS = Array.from({ length: 12 }, (_, pc) => pc);
const GROUPS = [...new Set(SCALES.map((s) => s.group))];

export function Escalas() {
  const { tuningId, setTuningId, notation } = useApp();
  const tuning = getTuning(tuningId);
  const [rootPc, setRootPc] = useState(9);
  const [scaleId, setScaleId] = useState('minor-pent');
  const [labelMode, setLabelMode] = useState('note');
  const [range, setRange] = useState('low');
  const scale = getScale(scaleId);
  const spelled = useMemo(() => spellScale(rootPc, scale), [rootPc, scale]);
  const steps = stepsOf(scale);
  const changed = tuning.midi.map((m, i) => m - TUNINGS[0].midi[i]);

  return (
    <div className="stack">
      <ScreenTitle emoji="🎼" title="Todas as escalas" subtitle="Escolha a afinação, o tom e a escala." />

      <Card>
        <label className="label" htmlFor="tuning-select">Afinação</label>
        <div className="select-wrap">
          <select id="tuning-select" value={tuningId} onChange={(e) => { buzz(8); setTuningId(e.target.value); }}>
            {TUNINGS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.names.map((n) => fmtNote(n, notation)).join(' ')}
              </option>
            ))}
          </select>
        </div>
        <AnimatePresence initial={false}>
          {tuning.id !== 'standard' && (
            <motion.p className="hint" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              Nesta afinação, as cordas mudaram ({changed.map((c) => (c === 0 ? '=' : c > 0 ? `+${c}` : `−${-c}`)).join(' ')}), então os
              desenhos mudam também — mas as notas da escala continuam as mesmas!
            </motion.p>
          )}
        </AnimatePresence>

        <span className="label">Tom (tônica)</span>
        <ChipGrid
          label="Tônica"
          cols={6}
          value={rootPc}
          onChange={setRootPc}
          options={ROOTS.map((pc) => ({ value: pc, label: rootChipName(pc, notation) }))}
        />
      </Card>

      <Card>
        <span className="label">Escala</span>
        {GROUPS.map((g) => (
          <div key={g} className="scale-group">
            <h3>{g}</h3>
            <ChipGrid
              label={g}
              cols={2}
              value={scaleId}
              onChange={setScaleId}
              options={SCALES.filter((s) => s.group === g).map((s) => ({ value: s.id, label: `${s.emoji} ${s.name}` }))}
            />
          </div>
        ))}
      </Card>

      <Card>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={scaleId}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            <h2>
              {scale.emoji} {fmtNote(spelled[0].name, notation)} {scale.name}
            </h2>
            <p>{scale.mood}</p>
            <div className="formula">
              {spelled.map((n, i) => (
                <div key={i} className="formula-item">
                  <motion.button
                    className={`note-bubble ${i === 0 ? 'root' : ''}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 16, delay: i * 0.04 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                      buzz(8);
                      playNote(48 + rootPc + n.semi);
                    }}
                  >
                    {fmtNote(n.name, notation)}
                  </motion.button>
                  <small>{fmtDegree(n.label)}</small>
                  <span className="step">{stepName(steps[i])}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <ScaleBoard tuning={tuning} rootPc={rootPc} scaleId={scaleId} position={0} labelMode={labelMode} range={range} />

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
        </div>
      </Card>
    </div>
  );
}
