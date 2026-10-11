// Conteúdo didático: afinações e escalas.

/** midi: número da nota (E2 = 40). Ordem: da corda mais grave (6ª) para a mais aguda (1ª). */
export const TUNINGS = [
  {
    id: 'standard', name: 'Padrão', short: 'E A D G B E', midi: [40, 45, 50, 55, 59, 64],
    names: ['E', 'A', 'D', 'G', 'B', 'E'],
    desc: 'A afinação mais usada no mundo. Da corda mais grossa (6ª) para a mais fina (1ª). Se você está começando, comece por aqui.',
  },
  {
    id: 'halfdown', name: 'Meio tom abaixo', short: 'E♭ A♭ D♭ G♭ B♭ E♭', midi: [39, 44, 49, 54, 58, 63],
    names: ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb'],
    desc: 'Tudo meio tom mais grave. As cordas ficam mais “frouxas” (bends mais fáceis) e o som mais redondo. Muito comum no rock e no blues.',
  },
  {
    id: 'fulldown', name: 'Um tom abaixo', short: 'D G C F A D', midi: [38, 43, 48, 53, 57, 62],
    names: ['D', 'G', 'C', 'F', 'A', 'D'],
    desc: 'O mesmo desenho do padrão, um tom mais grave. Som encorpado, bom para adaptar a música à sua voz.',
  },
  {
    id: 'dropd', name: 'Drop D', short: 'D A D G B E', midi: [38, 45, 50, 55, 59, 64],
    names: ['D', 'A', 'D', 'G', 'B', 'E'],
    desc: 'Só a 6ª corda desce um tom (Mi → Ré). Dá para fazer um power chord com um dedo só nas 3 cordas graves. Ex.: “Everlong” (Foo Fighters).',
  },
  {
    id: 'dropc', name: 'Drop C', short: 'C G C F A D', midi: [36, 43, 48, 53, 57, 62],
    names: ['C', 'G', 'C', 'F', 'A', 'D'],
    desc: 'Drop D, só que um tom mais grave. Som pesado, muito usado no metal e no rock moderno.',
  },
  {
    id: 'doubledropd', name: 'Double Drop D', short: 'D A D G B D', midi: [38, 45, 50, 55, 59, 62],
    names: ['D', 'A', 'D', 'G', 'B', 'D'],
    desc: 'As duas cordas de Mi (6ª e 1ª) descem para Ré. Fica ótimo para riffs com oitavas de Ré no folk e no rock.',
  },
  {
    id: 'dadgad', name: 'DADGAD', short: 'D A D G A D', midi: [38, 45, 50, 55, 57, 62],
    names: ['D', 'A', 'D', 'G', 'A', 'D'],
    desc: 'Soltas, as cordas formam um acorde “suspenso” (sem terça): soa amplo e misterioso. Típica do folk celta e de “Kashmir” (Led Zeppelin).',
  },
  {
    id: 'opend', name: 'Open D (Ré aberto)', short: 'D A D F♯ A D', midi: [38, 45, 50, 54, 57, 62],
    names: ['D', 'A', 'D', 'F#', 'A', 'D'],
    desc: 'Tocando as cordas soltas você já ouve um acorde de Ré maior. Perfeita para slide (garrafinha) e blues.',
  },
  {
    id: 'openg', name: 'Open G (Sol aberto)', short: 'D G D G B D', midi: [38, 43, 50, 55, 59, 62],
    names: ['D', 'G', 'D', 'G', 'B', 'D'],
    desc: 'Soltas = acorde de Sol maior. Clássica do blues, do slide e de Keith Richards (Rolling Stones).',
  },
  {
    id: 'opene', name: 'Open E (Mi aberto)', short: 'E B E G♯ B E', midi: [40, 47, 52, 56, 59, 64],
    names: ['E', 'B', 'E', 'G#', 'B', 'E'],
    desc: 'Soltas = acorde de Mi maior (um tom acima da Open D). Muito usada em slide guitar.',
  },
  {
    id: 'opena', name: 'Open A (Lá aberto)', short: 'E A E A C♯ E', midi: [40, 45, 52, 57, 61, 64],
    names: ['E', 'A', 'E', 'A', 'C#', 'E'],
    desc: 'Soltas = acorde de Lá maior. Mesma ideia da Open E, com a 5ª e a 4ª cordas mais graves.',
  },
  {
    id: 'openc', name: 'Open C (Dó aberto)', short: 'C G C G C E', midi: [36, 43, 48, 55, 60, 64],
    names: ['C', 'G', 'C', 'G', 'C', 'E'],
    desc: 'Soltas = acorde de Dó maior. Som grande e cheio, usado no folk e no fingerstyle.',
  },
];

export const STANDARD = TUNINGS[0];
export const getTuning = (id) => TUNINGS.find((t) => t.id === id) || STANDARD;

const iv = (semi, deg, label) => ({ semi, deg, label });

/** deg = quantas "letras" acima da tônica (para escrever C#, Db etc. corretamente) */
export const SCALES = [
  {
    id: 'minor-pent', group: 'Pentatônicas', name: 'Menor pentatônica', per: 2, emoji: '😢',
    intervals: [iv(0, 0, '1'), iv(3, 2, 'b3'), iv(5, 3, '4'), iv(7, 4, '5'), iv(10, 6, 'b7')],
    mood: 'Som de rock e blues: “sujo”, emotivo, fácil de improvisar.',
  },
  {
    id: 'major-pent', group: 'Pentatônicas', name: 'Maior pentatônica', per: 2, emoji: '😊',
    intervals: [iv(0, 0, '1'), iv(2, 1, '2'), iv(4, 2, '3'), iv(7, 4, '5'), iv(9, 5, '6')],
    mood: 'Som alegre e aberto: country, pop, sertanejo, solos “cantáveis”.',
  },
  {
    id: 'blues-minor', group: 'Blues', name: 'Blues menor', per: 2, emoji: '🎷',
    intervals: [iv(0, 0, '1'), iv(3, 2, 'b3'), iv(5, 3, '4'), iv(6, 4, 'b5'), iv(7, 4, '5'), iv(10, 6, 'b7')],
    mood: 'A menor pentatônica + a “blue note” (♭5), que dá aquele tempero de blues.',
  },
  {
    id: 'blues-major', group: 'Blues', name: 'Blues maior', per: 2, emoji: '🤠',
    intervals: [iv(0, 0, '1'), iv(2, 1, '2'), iv(3, 2, 'b3'), iv(4, 2, '3'), iv(7, 4, '5'), iv(9, 5, '6')],
    mood: 'A maior pentatônica + ♭3: um blues mais doce e alegre.',
  },
  {
    id: 'major', group: 'Modos e escalas de 7 notas', name: 'Maior (Jônio)', per: 3, emoji: '☀️',
    intervals: [iv(0, 0, '1'), iv(2, 1, '2'), iv(4, 2, '3'), iv(5, 3, '4'), iv(7, 4, '5'), iv(9, 5, '6'), iv(11, 6, '7')],
    mood: 'A escala “dó-ré-mi”. Base da maior parte da música ocidental.',
  },
  {
    id: 'minor', group: 'Modos e escalas de 7 notas', name: 'Menor natural (Eólio)', per: 3, emoji: '🌧️',
    intervals: [iv(0, 0, '1'), iv(2, 1, '2'), iv(3, 2, 'b3'), iv(5, 3, '4'), iv(7, 4, '5'), iv(8, 5, 'b6'), iv(10, 6, 'b7')],
    mood: 'A escala menor “padrão”: séria, melancólica. Pentatônica menor + 2 e ♭6.',
  },
  {
    id: 'dorian', group: 'Modos e escalas de 7 notas', name: 'Dórico', per: 3, emoji: '🎸',
    intervals: [iv(0, 0, '1'), iv(2, 1, '2'), iv(3, 2, 'b3'), iv(5, 3, '4'), iv(7, 4, '5'), iv(9, 5, '6'), iv(10, 6, 'b7')],
    mood: 'Menor com 6ª maior: menos triste, groovada. Santana, funk, jazz.',
  },
  {
    id: 'phrygian', group: 'Modos e escalas de 7 notas', name: 'Frígio', per: 3, emoji: '🔥',
    intervals: [iv(0, 0, '1'), iv(1, 1, 'b2'), iv(3, 2, 'b3'), iv(5, 3, '4'), iv(7, 4, '5'), iv(8, 5, 'b6'), iv(10, 6, 'b7')],
    mood: 'Sombrio, “espanhol” e pesado por causa do ♭2.',
  },
  {
    id: 'lydian', group: 'Modos e escalas de 7 notas', name: 'Lídio', per: 3, emoji: '✨',
    intervals: [iv(0, 0, '1'), iv(2, 1, '2'), iv(4, 2, '3'), iv(6, 3, '#4'), iv(7, 4, '5'), iv(9, 5, '6'), iv(11, 6, '7')],
    mood: 'Maior com 4ª aumentada: som flutuante, de filme e sonhador.',
  },
  {
    id: 'mixolydian', group: 'Modos e escalas de 7 notas', name: 'Mixolídio', per: 3, emoji: '🤘',
    intervals: [iv(0, 0, '1'), iv(2, 1, '2'), iv(4, 2, '3'), iv(5, 3, '4'), iv(7, 4, '5'), iv(9, 5, '6'), iv(10, 6, 'b7')],
    mood: 'Maior com 7ª menor: rock clássico e blues alegre.',
  },
  {
    id: 'locrian', group: 'Modos e escalas de 7 notas', name: 'Lócrio', per: 3, emoji: '🌀',
    intervals: [iv(0, 0, '1'), iv(1, 1, 'b2'), iv(3, 2, 'b3'), iv(5, 3, '4'), iv(6, 4, 'b5'), iv(8, 5, 'b6'), iv(10, 6, 'b7')],
    mood: 'Instável e tenso (♭2 e ♭5). Raro de ouvir como “tom principal”.',
  },
  {
    id: 'harmonic-minor', group: 'Modos e escalas de 7 notas', name: 'Menor harmônica', per: 3, emoji: '🏰',
    intervals: [iv(0, 0, '1'), iv(2, 1, '2'), iv(3, 2, 'b3'), iv(5, 3, '4'), iv(7, 4, '5'), iv(8, 5, 'b6'), iv(11, 6, '7')],
    mood: 'Menor com 7ª maior: som clássico, árabe e neoclássico no metal.',
  },
  {
    id: 'melodic-minor', group: 'Modos e escalas de 7 notas', name: 'Menor melódica', per: 3, emoji: '🎹',
    intervals: [iv(0, 0, '1'), iv(2, 1, '2'), iv(3, 2, 'b3'), iv(5, 3, '4'), iv(7, 4, '5'), iv(9, 5, '6'), iv(11, 6, '7')],
    mood: 'Menor com 6ª e 7ª maiores. Muito usada no jazz.',
  },
];

export const getScale = (id) => SCALES.find((s) => s.id === id) || SCALES[0];
