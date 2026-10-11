import { midiToFreq } from './theory/music.js';

// Som de corda dedilhada gerado no próprio celular (algoritmo Karplus-Strong).
// Não precisa de arquivos de áudio, então funciona 100% offline.

let ctx = null;
let master = null;
let muted = false;
const cache = new Map();

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function makeBuffer(c, midi) {
  const freq = midiToFreq(midi);
  const sr = c.sampleRate;
  const len = Math.floor(sr * 2.2);
  const buf = c.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  const period = Math.max(2, Math.round(sr / freq));
  const delay = new Float32Array(period);
  // "beliscão" inicial: ruído filtrado
  let last = 0;
  for (let i = 0; i < period; i++) {
    const n = Math.random() * 2 - 1;
    last = last * 0.4 + n * 0.6;
    delay[i] = last;
  }
  const damping = 0.996 - Math.min(0.004, freq / 200000);
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const cur = delay[idx];
    const next = delay[(idx + 1) % period];
    data[i] = cur;
    delay[idx] = (cur + next) * 0.5 * damping;
    idx = (idx + 1) % period;
  }
  // entrada/saída suaves para não estalar
  const fade = Math.floor(sr * 0.25);
  for (let i = 0; i < fade; i++) data[len - 1 - i] *= i / fade;
  return buf;
}

export function setMuted(m) {
  muted = m;
}

/** Toca uma nota (número midi). `when` = atraso em segundos; `bus` = grupo cancelável. */
export function playNote(midi, when = 0, bus = null) {
  if (muted) return;
  const c = ensure();
  if (!c) return;
  let buf = cache.get(midi);
  if (!buf) {
    buf = makeBuffer(c, midi);
    cache.set(midi, buf);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = 0.9;
  src.connect(g);
  g.connect(bus || master);
  src.start(c.currentTime + when);
}

/** Cria um "grupo" de sons que pode ser cortado de uma vez (botão parar). */
export function createBus() {
  const c = ensure();
  if (!c) return { node: null, stop() {} };
  const node = c.createGain();
  node.connect(master);
  return {
    node,
    stop() {
      node.gain.cancelScheduledValues(c.currentTime);
      node.gain.setTargetAtTime(0, c.currentTime, 0.03);
      setTimeout(() => node.disconnect(), 300);
    },
  };
}

/** Vibração curtinha no celular (Android). */
export function buzz(ms = 8) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* ignorar */
  }
}

/** Estrondo de "acerto" (duas notas subindo) */
export function playSuccess() {
  playNote(76, 0);
  playNote(83, 0.09);
  playNote(88, 0.18);
}
export function playError() {
  playNote(40, 0);
}
