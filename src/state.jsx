import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { setMuted, setTone } from './audio.js';

const Ctx = createContext(null);
const KEY = 'pentatonica:v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function Provider({ children }) {
  const saved = useMemo(load, []);
  const [tuningId, setTuningId] = useState(saved.tuningId || 'standard');
  const [notation, setNotation] = useState(saved.notation || 'abc'); // abc | solfege
  const [sound, setSound] = useState(saved.sound !== false);
  const [tone, setToneState] = useState(saved.tone || 'crunch'); // clean | crunch | dist
  const [screen, setScreen] = useState(saved.screen || 0);

  useEffect(() => setMuted(!sound), [sound]);
  useEffect(() => setTone(tone), [tone]);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ tuningId, notation, sound, screen, tone }));
    } catch {
      /* modo privado: tudo bem */
    }
  }, [tuningId, notation, sound, screen, tone]);

  const [nav, setNav] = useState({ i: null, n: 0 });
  const goTo = useCallback((i) => setNav((s) => ({ i, n: s.n + 1 })), []);

  const toggleNotation = useCallback(() => setNotation((n) => (n === 'abc' ? 'solfege' : 'abc')), []);

  const value = { tuningId, setTuningId, tone, setTone: setToneState, notation, toggleNotation, sound, setSound, screen, setScreen, nav, goTo };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
