import { midiToFreq } from './theory/music.js';

// Som de GUITARRA ELÉTRICA gerado no próprio celular, sem arquivos de áudio.
//
//  1) corda: síntese Karplus-Strong com "captador" (filtro em pente que simula a
//     posição do captador perto da ponte → timbre mais nasalado e brilhante)
//  2) amplificador: distorção suave (WaveShaper) + corte de graves/agudos
//     (simula alto-falante), com 3 timbres: limpo, crunch e distorção.

export const TONES = [
  { id: 'clean', label: 'Limpo', drive: 1.2, post: 0.9, lowpass: 5200 },
  { id: 'crunch', label: 'Crunch', drive: 6, post: 0.28, lowpass: 3800 },
  { id: 'dist', label: 'Distorção', drive: 22, post: 0.19, lowpass: 3200 },
];

let ctx = null;
let input = null; // entrada do "amplificador"
let shaper = null;
let lowpass = null;
let postGain = null;
let muted = false;
let toneId = 'crunch';
const cache = new Map();

function curve(k) {
  const n = 2048;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(k * x) / Math.tanh(k); // saturação suave
  }
  return c;
}

/** Monta o amplificador em qualquer contexto (real ou offline, para testes). */
export function buildAmp(c, tone, out) {
  const pre = c.createGain();
  pre.gain.value = tone.drive;
  const sh = c.createWaveShaper();
  sh.curve = curve(Math.max(1, tone.drive * 0.35));
  sh.oversample = '4x';
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 85;
  const mid = c.createBiquadFilter(); // "presença" do alto-falante
  mid.type = 'peaking';
  mid.frequency.value = 1800;
  mid.Q.value = 0.9;
  mid.gain.value = 4;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = tone.lowpass;
  lp.Q.value = 0.7;
  const post = c.createGain();
  post.gain.value = tone.post;
  pre.connect(sh);
  sh.connect(hp);
  hp.connect(mid);
  mid.connect(lp);
  lp.connect(post);
  post.connect(out);
  return { pre, sh, lp, post };
}

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    const amp = buildAmp(ctx, TONES.find((t) => t.id === toneId), master);
    input = amp.pre;
    shaper = amp.sh;
    lowpass = amp.lp;
    postGain = amp.post;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Troca o timbre (limpo / crunch / distorção) na hora. */
export function setTone(id) {
  const t = TONES.find((x) => x.id === id) || TONES[1];
  toneId = t.id;
  if (ctx) {
    input.gain.value = t.drive;
    shaper.curve = curve(Math.max(1, t.drive * 0.35));
    lowpass.frequency.value = t.lowpass;
    postGain.gain.value = t.post;
  }
}

/** A corda "crua", antes do amplificador. */
export function makePluck(sr, midi) {
  const freq = midiToFreq(midi);
  const len = Math.floor(sr * 3);
  const out = new Float32Array(len);
  const period = Math.max(4, Math.round(sr / freq));
  const delay = new Float32Array(period);
  // palheta: ruído brilhante
  let seed = 1234567 + midi * 977;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  for (let i = 0; i < period; i++) delay[i] = rnd();
  // captador perto da ponte: subtrai uma cópia deslocada (filtro em pente)
  const pk = Math.max(1, Math.round(period * 0.18));
  const exc = delay.slice();
  for (let i = 0; i < period; i++) delay[i] = exc[i] - exc[(i - pk + period) % period];
  // sustain longo; as notas agudas perdem energia um pouco mais rápido
  const damping = 0.9988 - Math.min(0.0025, freq / 400000);
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const cur = delay[idx];
    const next = delay[(idx + 1) % period];
    out[i] = cur;
    delay[idx] = (cur + next) * 0.5 * damping;
    idx = (idx + 1) % period;
  }
  const fade = Math.floor(sr * 0.3);
  for (let i = 0; i < fade; i++) out[len - 1 - i] *= i / fade;
  // normaliza para o amplificador receber sempre o mesmo nível
  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(out[i]));
  for (let i = 0; i < len; i++) out[i] = (out[i] / (peak || 1)) * 0.7;
  return out;
}

function getBuffer(c, midi) {
  let buf = cache.get(midi);
  if (!buf) {
    const data = makePluck(c.sampleRate, midi);
    buf = c.createBuffer(1, data.length, c.sampleRate);
    buf.copyToChannel(data, 0);
    cache.set(midi, buf);
  }
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
  const src = c.createBufferSource();
  src.buffer = getBuffer(c, midi);
  const g = c.createGain();
  g.gain.value = 1;
  src.connect(g);
  g.connect(bus || input);
  src.start(c.currentTime + when);
}

/** Cria um "grupo" de sons que pode ser cortado de uma vez (botão parar). */
export function createBus() {
  const c = ensure();
  if (!c) return { node: null, stop() {} };
  const node = c.createGain();
  node.connect(input);
  return {
    node,
    stop() {
      node.gain.cancelScheduledValues(c.currentTime);
      node.gain.setTargetAtTime(0, c.currentTime, 0.03);
      setTimeout(() => node.disconnect(), 300);
    },
  };
}

/** Gera a nota já com amplificador, sem tocar (usado em testes e para conferir o timbre). */
export async function renderPreview(midi, id = 'crunch', seconds = 2.5, sr = 44100) {
  const t = TONES.find((x) => x.id === id) || TONES[1];
  const oc = new OfflineAudioContext(1, Math.floor(sr * seconds), sr);
  const src = oc.createBufferSource();
  const raw = makePluck(sr, midi);
  const buf = oc.createBuffer(1, raw.length, sr);
  buf.copyToChannel(raw, 0);
  src.buffer = buf;
  const amp = buildAmp(oc, t, oc.destination);
  src.connect(amp.pre);
  src.start();
  return (await oc.startRendering()).getChannelData(0);
}

/** Vibração curtinha no celular (Android). */
export function buzz(ms = 8) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* ignorar */
  }
}

/** Som de "acerto" (três notas subindo) */
export function playSuccess() {
  playNote(76, 0);
  playNote(83, 0.09);
  playNote(88, 0.18);
}
export function playError() {
  playNote(40, 0);
}
