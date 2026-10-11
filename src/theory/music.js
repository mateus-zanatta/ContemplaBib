// Teoria musical pura (sem React) — assim dá para testar com `npm test`.

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
const SOLFEGE = { C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si' };

/** "C#" -> "C♯" (cifra) ou "Dó♯" (solfejo) */
export function fmtNote(name, notation = 'abc') {
  const letter = name[0];
  const acc = name.slice(1).replace(/##/g, '𝄪').replace(/#/g, '♯').replace(/bb/g, '𝄫').replace(/b/g, '♭');
  return (notation === 'solfege' ? SOLFEGE[letter] : letter) + acc;
}

/** "b3" -> "♭3", "#4" -> "♯4" */
export function fmtDegree(label) {
  return label.replace('b', '♭').replace('#', '♯');
}

const mod12 = (n) => ((n % 12) + 12) % 12;

function accOf(pc, letterIdx) {
  // diferença (em semitons) entre a nota desejada e a nota natural da letra, de -6 a +5
  let d = mod12(pc - LETTER_PC[letterIdx]);
  if (d > 6) d -= 12;
  return d;
}

function accStr(a) {
  if (a === 0) return '';
  return a > 0 ? '#'.repeat(a) : 'b'.repeat(-a);
}

/**
 * Escreve as notas da escala com a grafia correta (ex.: Fá# menor pentatônica = F# A B C# E).
 * Testa as grafias possíveis da tônica e escolhe a que usa menos acidentes.
 */
export function spellScale(rootPc, scale) {
  let best = null;
  for (let l = 0; l < 7; l++) {
    const rootAcc = accOf(rootPc, l);
    if (Math.abs(rootAcc) > 1) continue;
    let score = 0;
    const notes = scale.intervals.map((iv) => {
      const letterIdx = (l + iv.deg) % 7;
      const pc = mod12(rootPc + iv.semi);
      const a = accOf(pc, letterIdx);
      score += Math.abs(a) > 1 ? 10 : Math.abs(a);
      return { pc, semi: iv.semi, label: iv.label, name: LETTERS[letterIdx] + accStr(a) };
    });
    // empate: prefere bemol (ordem de teste: natural, depois a grafia com menor "acc" vem primeiro)
    const tie = rootAcc > 0 ? 0.01 : 0;
    if (!best || score + tie < best.score) best = { score: score + tie, notes };
  }
  return best.notes;
}

/** Nome da tônica para mostrar nos botões (teclas pretas mostram as duas grafias: "C♯/D♭") */
const CHIP_NAMES = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];
export function rootChipName(pc, notation) {
  return CHIP_NAMES[mod12(pc)]
    .split('/')
    .map((n) => fmtNote(n, notation))
    .join('/');
}

/** Nota "simples" de um pitch (usada para as cordas soltas e dicas) */
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const sharpName = (pitch) => SHARP_NAMES[mod12(pitch)];

export const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

/**
 * Monta as posições ("caixas") de uma escala em qualquer afinação.
 * Regra: em cada corda, tocar `per` notas da escala em sequência, começando na
 * primeira nota da escala acima da última nota da corda anterior.
 * Na afinação padrão isso gera exatamente as 5 caixas clássicas da pentatônica
 * (2 notas por corda) e os 7 padrões de 3 notas por corda das escalas de 7 notas.
 */
export function buildPositions(strings, rootPc, scale, per = 2) {
  const set = new Set(scale.intervals.map((iv) => mod12(rootPc + iv.semi)));
  const nextIn = (p) => {
    while (!set.has(mod12(p))) p++;
    return p;
  };
  let start = nextIn(strings[0]);
  while (mod12(start) !== mod12(rootPc)) start = nextIn(start + 1);

  const positions = [];
  for (let d = 0; d < scale.intervals.length; d++) {
    const notes = [];
    let prev = -Infinity;
    for (let s = 0; s < strings.length; s++) {
      let p = s === 0 ? start : nextIn(Math.max(prev + 1, strings[s]));
      for (let k = 0; k < per; k++) {
        notes.push({ s, f: p - strings[s], pitch: p });
        prev = p;
        if (k < per - 1) p = nextIn(p + 1);
      }
    }
    const frets = notes.map((n) => n.f);
    positions.push({ n: d + 1, notes, lo: Math.min(...frets), hi: Math.max(...frets) });
    start = nextIn(start + 1);
  }
  return positions;
}

/** Todas as notas da escala entre duas casas (inclusive) */
export function scaleNotesInRange(strings, rootPc, scale, from, to) {
  const degreeByPc = new Map(scale.intervals.map((iv) => [mod12(rootPc + iv.semi), iv]));
  const out = [];
  strings.forEach((open, s) => {
    for (let f = from; f <= to; f++) {
      const pitch = open + f;
      const iv = degreeByPc.get(mod12(pitch));
      if (iv) out.push({ s, f, pitch, pc: mod12(pitch), semi: iv.semi, label: iv.label });
    }
  });
  return out;
}

/** Descreve a distância entre notas em passos: 1=½ tom, 2=tom, 3=tom e meio */
export function stepsOf(scale, closeOctave = true) {
  const semis = scale.intervals.map((i) => i.semi);
  if (closeOctave) semis.push(12);
  return semis.slice(1).map((s, i) => s - semis[i]);
}

export const stepName = (n) => ({ 1: '½', 2: 'T', 3: 'T+½' })[n] || String(n);

/** Sequências de estudo a partir de uma lista de notas (já em ordem crescente) */
export function makePattern(notes, kind) {
  if (kind === 'up') return [...notes];
  if (kind === 'updown') return [...notes, ...[...notes].reverse().slice(1)];
  if (kind === 'threes') {
    const out = [];
    for (let i = 0; i + 2 < notes.length; i++) out.push(notes[i], notes[i + 1], notes[i + 2]);
    return out;
  }
  if (kind === 'skips') {
    // pulando uma nota: 1-3, 2-4, 3-5...
    const out = [];
    for (let i = 0; i + 2 < notes.length; i++) out.push(notes[i], notes[i + 2]);
    return out;
  }
  return notes;
}
