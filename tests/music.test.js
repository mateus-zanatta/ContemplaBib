import { describe, it, expect } from 'vitest';
import { buildPositions, spellScale, fmtNote, scaleNotesInRange, makePattern, stepsOf } from '../src/theory/music.js';
import { SCALES, TUNINGS, getScale, STANDARD } from '../src/theory/data.js';

const minorPent = getScale('minor-pent');
const majorPent = getScale('major-pent');
const A = 9;

// frets por corda (6ª → 1ª) de uma posição
const shape = (pos) => {
  const rows = [[], [], [], [], [], []];
  pos.notes.forEach((n) => rows[n.s].push(n.f));
  return rows;
};

describe('grafia das notas', () => {
  it('A menor pentatônica', () => {
    expect(spellScale(A, minorPent).map((n) => n.name)).toEqual(['A', 'C', 'D', 'E', 'G']);
  });
  it('F# menor e Db maior usam grafias corretas', () => {
    expect(spellScale(6, minorPent).map((n) => n.name)).toEqual(['F#', 'A', 'B', 'C#', 'E']);
    expect(spellScale(1, majorPent).map((n) => n.name)).toEqual(['Db', 'Eb', 'F', 'Ab', 'Bb']);
  });
  it('blues tem a blue note b5', () => {
    expect(spellScale(A, getScale('blues-minor')).map((n) => n.name)).toEqual(['A', 'C', 'D', 'Eb', 'E', 'G']);
  });
  it('Lá maior (7 notas) tem F#, C#, G#', () => {
    expect(spellScale(A, getScale('major')).map((n) => n.name)).toEqual(['A', 'B', 'C#', 'D', 'E', 'F#', 'G#']);
  });
  it('formata em solfejo', () => {
    expect(fmtNote('C#', 'solfege')).toBe('Dó♯');
    expect(fmtNote('Bb', 'abc')).toBe('B♭');
    expect(fmtNote('A', 'solfege')).toBe('Lá');
  });
});

describe('caixas da pentatônica na afinação padrão (Lá menor)', () => {
  const pos = buildPositions(STANDARD.midi, A, minorPent, 2);
  it('são 5 e começam na casa 5', () => {
    expect(pos).toHaveLength(5);
    expect(pos[0].lo).toBe(5);
  });
  it('posição 1 (clássica)', () => {
    expect(shape(pos[0])).toEqual([[5, 8], [5, 7], [5, 7], [5, 7], [5, 8], [5, 8]]);
  });
  it('posição 2', () => {
    expect(shape(pos[1])).toEqual([[8, 10], [7, 10], [7, 10], [7, 9], [8, 10], [8, 10]]);
  });
  it('posição 3', () => {
    expect(shape(pos[2])).toEqual([[10, 12], [10, 12], [10, 12], [9, 12], [10, 13], [10, 12]]);
  });
  it('posição 4', () => {
    expect(shape(pos[3])).toEqual([[12, 15], [12, 15], [12, 14], [12, 14], [13, 15], [12, 15]]);
  });
  it('posição 5', () => {
    expect(shape(pos[4])).toEqual([[15, 17], [15, 17], [14, 17], [14, 17], [15, 17], [15, 17]]);
  });
  it('as notas sobem de altura a cada corda', () => {
    for (const p of pos) {
      const pitches = p.notes.map((n) => n.pitch);
      expect(pitches).toEqual([...pitches].sort((a, b) => a - b));
    }
  });
});

describe('Mi menor pentatônica usa as cordas soltas', () => {
  it('posição 1 em Mi', () => {
    const pos = buildPositions(STANDARD.midi, 4, minorPent, 2);
    expect(shape(pos[0])).toEqual([[0, 3], [0, 2], [0, 2], [0, 2], [0, 3], [0, 3]]);
  });
});

describe('todas as afinações e escalas', () => {
  it('toda posição respeita o número de notas e fica em casas válidas', () => {
    for (const t of TUNINGS) {
      for (const sc of SCALES) {
        for (let root = 0; root < 12; root++) {
          const pos = buildPositions(t.midi, root, sc, sc.per);
          expect(pos).toHaveLength(sc.intervals.length);
          for (const p of pos) {
            expect(p.notes).toHaveLength(6 * sc.per);
            for (const n of p.notes) expect(n.f).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });
  it('as notas das posições pertencem à escala', () => {
    const sc = majorPent;
    const pcs = new Set(sc.intervals.map((i) => (7 + i.semi) % 12));
    for (const t of TUNINGS) {
      for (const p of buildPositions(t.midi, 7, sc, 2)) {
        for (const n of p.notes) expect(pcs.has(n.pitch % 12)).toBe(true);
      }
    }
  });
  it('nomes das cordas batem com o número midi', () => {
    const letters = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    for (const t of TUNINGS) {
      t.names.forEach((nm, i) => {
        const pc = (letters[nm[0]] + (nm[1] === '#' ? 1 : nm[1] === 'b' ? -1 : 0) + 12) % 12;
        expect(t.midi[i] % 12).toBe(pc);
      });
    }
  });
});

describe('utilitários', () => {
  it('lista as notas de uma faixa de casas', () => {
    const notes = scaleNotesInRange(STANDARD.midi, A, minorPent, 0, 12);
    // 5 notas por oitava × 6 cordas ≈ 30 + repetições nas pontas
    expect(notes.length).toBeGreaterThan(30);
    expect(notes.find((n) => n.s === 0 && n.f === 5).label).toBe('1');
  });
  it('fórmula em passos da pentatônica menor: 3-2-2-3-2', () => {
    expect(stepsOf(minorPent)).toEqual([3, 2, 2, 3, 2]);
  });
  it('padrões de estudo', () => {
    expect(makePattern([1, 2, 3, 4], 'updown')).toEqual([1, 2, 3, 4, 3, 2, 1]);
    expect(makePattern([1, 2, 3, 4], 'threes')).toEqual([1, 2, 3, 2, 3, 4]);
  });
});
