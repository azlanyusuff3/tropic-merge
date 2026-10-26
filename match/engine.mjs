// Monster Match: pure 8x8 match-three rules, independent of Merge and Sling.
export const SIZE = 8;
export const COLORS = 6;
// Six ordinary tiles stay on the board. Match 5 turns one into a rare evolved monster.
// Original monster IDs stay untouched; no separate rescue, levels or energy system.
export const EVOLUTIONS = Object.freeze([
  'groveling', // Slimelet
  'bubblo',    // Tidalon
  'shadebub',  // Puffling
  'groveling', // Sproutiball
  'infernodon',// Rockro
  'lumiorb'   // Frostbop
]);
export const POWERS = ['row', 'col', 'bomb', 'rainbow', 'evolved'];
const EVOLUTION_SET = new Set(EVOLUTIONS);
export const EVOLUTION_TITLES = Object.freeze({ 1: 'Evolution', 2: 'Enhanced Evolution', 3: 'Super Evolution' });
const rankForCount = count => count >= 7 ? 3 : count === 6 ? 2 : 1;
const tileRank = cell => cell?.special === 'evolved' && [1, 2, 3].includes(cell.rank) ? cell.rank : 1;
let lastId = 0;
const posKey = (r, c) => r * SIZE + c;
const position = key => [Math.floor(key / SIZE), key % SIZE];
const within = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
const pick = (max, rng) => Math.max(0, Math.min(max - 1, Math.floor(rng() * max)));
const newTile = (kind, special = null) => ({ id: ++lastId, kind, special });
export const cloneBoard = board => board.map(row => row.map(cell => cell ? { ...cell } : null));
// Evolved and legacy rainbow pieces are power tiles, not a seventh match color.
const kindAt = cell => cell && cell.special !== 'rainbow' && cell.special !== 'evolved' ? cell.kind : -1;

export function isValidBoard(board) {
  if (!Array.isArray(board) || board.length !== SIZE) return false;
  const seen = new Set();
  return board.every(row => Array.isArray(row) && row.length === SIZE && row.every(cell => {
    if (!cell || !Number.isSafeInteger(cell.id) || cell.id <= 0 || seen.has(cell.id) ||
        !Number.isInteger(cell.kind) || cell.kind < 0 || cell.kind >= COLORS ||
        (cell.special !== null && !POWERS.includes(cell.special)) ||
        (cell.special === 'evolved' && (cell.evolution !== EVOLUTIONS[cell.kind] || !EVOLUTION_SET.has(cell.evolution))) ||
        (cell.special !== 'evolved' && cell.evolution !== undefined) ||
        (cell.special === 'evolved' && cell.rank !== undefined && ![1, 2, 3].includes(cell.rank)) ||
        (cell.special !== 'evolved' && cell.rank !== undefined)) return false;
    seen.add(cell.id);
    return true;
  }));
}
export function restoreIds(board) {
  if (!isValidBoard(board)) return false;
  lastId = Math.max(lastId, ...board.flat().map(tile => tile.id));
  return true;
}

export function findRuns(board) {
  const runs = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE;) {
      const kind = kindAt(board[r][c]);
      let end = c + 1;
      if (kind >= 0) while (end < SIZE && kindAt(board[r][end]) === kind) end++;
      if (kind >= 0 && end - c >= 3) runs.push({ axis: 'row', keys: Array.from({ length: end - c }, (_, i) => posKey(r, c + i)) });
      c = end;
    }
  }
  for (let c = 0; c < SIZE; c++) {
    for (let r = 0; r < SIZE;) {
      const kind = kindAt(board[r][c]);
      let end = r + 1;
      if (kind >= 0) while (end < SIZE && kindAt(board[end][c]) === kind) end++;
      if (kind >= 0 && end - r >= 3) runs.push({ axis: 'col', keys: Array.from({ length: end - r }, (_, i) => posKey(r + i, c)) });
      r = end;
    }
  }
  return runs;
}

function groupedRuns(runs) {
  const groups = [];
  for (const run of runs) {
    let group = { keys: new Set(run.keys), runs: [run] };
    for (let i = groups.length - 1; i >= 0; i--) {
      if (run.keys.some(k => groups[i].keys.has(k)) || [...group.keys].some(k => groups[i].keys.has(k))) {
        for (const k of groups[i].keys) group.keys.add(k);
        group.runs.push(...groups[i].runs);
        groups.splice(i, 1);
      }
    }
    groups.push(group);
  }
  return groups;
}
function powerFor(group) {
  // Five matched monsters evolve regardless of shape (straight, T, L or +).
  // Previously an intersecting 3+3 (= five unique tiles) became a star/bomb
  // instead; players reasonably expect a real evolved monster from Match 5.
  if (group.keys.size >= 5) return 'evolved';
  const four = group.runs.find(run => run.keys.length >= 4);
  return four ? four.axis : null;
}
function centerAnchor(group) {
  // A cascade has no player-directed swap. Spawn its special at an actual
  // matched tile nearest the middle of the group, never at the old swap cell.
  const keys = [...group.keys];
  return keys.reduce((best, key) => {
    const [r, c] = position(key);
    const sum = keys.reduce((n, other) => {
      const [y, x] = position(other);
      return n + Math.abs(r - y) + Math.abs(c - x);
    }, 0);
    const [br, bc] = position(best.key);
    const oldSum = best.score;
    return sum < oldSum || (sum === oldSum && (r > br || (r === br && c > bc)))
      ? { key, score: sum } : best;
  }, { key: keys[0], score: Infinity }).key;
}
function swap(board, a, b) {
  const next = cloneBoard(board);
  [next[a[0]][a[1]], next[b[0]][b[1]]] = [next[b[0]][b[1]], next[a[0]][a[1]]];
  return next;
}
export function adjacent(a, b) {
  return Array.isArray(a) && Array.isArray(b) && within(...a) && within(...b) && Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}
export function hasMove(board) {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const nr = r + dr, nc = c + dc;
      if (!within(nr, nc)) continue;
      if (board[r][c]?.special || board[nr][nc]?.special) return true;
      if (findRuns(swap(board, [r, c], [nr, nc])).length) return true;
    }
  }
  return false;
}
export function findHint(board) {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const nr = r + dr, nc = c + dc;
      if (!within(nr, nc)) continue;
      if (board[r][c]?.special || board[nr][nc]?.special || findRuns(swap(board, [r, c], [nr, nc])).length) return [[r, c], [nr, nc]];
    }
  }
  return null;
}

export function createBoard(rng = Math.random) {
  // Avoid initial auto-matches, then reject boards that have no playable swap.
  for (let attempt = 0; attempt < 300; attempt++) {
    const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const choices = [];
      for (let k = 0; k < COLORS; k++) {
        if (c >= 2 && board[r][c - 1].kind === k && board[r][c - 2].kind === k) continue;
        if (r >= 2 && board[r - 1][c].kind === k && board[r - 2][c].kind === k) continue;
        choices.push(k);
      }
      board[r][c] = newTile(choices[pick(choices.length, rng)]);
    }
    if (hasMove(board)) return board;
  }
  throw Error('Unable to generate a playable Monster Match board');
}

function fallAndFill(board, rng) {
  for (let c = 0; c < SIZE; c++) {
    const survivors = [];
    for (let r = SIZE - 1; r >= 0; r--) if (board[r][c]) survivors.push(board[r][c]);
    for (let r = SIZE - 1; r >= 0; r--) board[r][c] = survivors[SIZE - 1 - r] || newTile(pick(COLORS, rng));
  }
}
// Every evolved monster has a unique, deterministic power. UI and resolver share this geometry.
export const ABILITY_NAMES = Object.freeze({
  bubblo: 'Tidal Wave', shadebub: 'Shadow Explosion', groveling: 'Vine Strike',
  lumiorb: 'Star Magic', infernodon: 'Inferno Blast'
});
function majorityKind(board) {
  const counts = Array(COLORS).fill(0);
  for (const row of board) for (const tile of row) if (tile && !tile.special) counts[tile.kind]++;
  return counts.indexOf(Math.max(...counts));
}
function squareKeys(r, c, radius) {
  const keys = [];
  for (let y = r - radius; y <= r + radius; y++) for (let x = c - radius; x <= c + radius; x++) {
    if (within(y, x)) keys.push(posKey(y, x));
  }
  return keys;
}
export function powerCells(board, r, c, evolution, partnerKind = null, rank = 1) {
  if (!within(r, c) || !ABILITY_NAMES[evolution]) return [];
  const strength = [1, 2, 3].includes(rank) ? rank : 1;
  const keys = new Set([posKey(r, c)]);
  const add = (y, x) => { if (within(y, x)) keys.add(posKey(y, x)); };
  // Extra evolution strength changes only the footprint, not the control scheme.
  const nearest = center => Array.from({ length: SIZE }, (_, i) => i).sort((a, b) =>
    Math.abs(a - center) - Math.abs(b - center) || (a >= center ? 0 : 1) - (b >= center ? 0 : 1) || a - b);
  if (evolution === 'bubblo') {
    // Sweep two full horizontal rows, keeping the effect within the board.
    for (const row of nearest(r).slice(0, strength + 1)) for (let x = 0; x < SIZE; x++) add(row, x);
  } else if (evolution === 'shadebub') {
    for (const key of squareKeys(r, c, strength)) keys.add(key);
  } else if (evolution === 'groveling') {
    // Two diagonals cross the evolved tile, even at the board edges.
    for (let d = -SIZE + 1; d < SIZE; d++) { add(r + d, c + d); add(r + d, c - d); }
    if (strength > 1) for (const key of squareKeys(r, c, strength - 1)) keys.add(key);
  } else if (evolution === 'lumiorb') {
    const kind = Number.isInteger(partnerKind) && partnerKind >= 0 && partnerKind < COLORS
      ? partnerKind : majorityKind(board);
    const counts = Array(COLORS).fill(0);
    for (const row of board) for (const tile of row) if (tile && !tile.special) counts[tile.kind]++;
    const types = [kind, ...Array.from({ length: COLORS }, (_, k) => k)
      .filter(k => k !== kind).sort((a, b) => counts[b] - counts[a] || a - b)].slice(0, strength);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      // Star Magic removes ordinary monsters only; other evolved pieces are preserved.
      if (board[y][x] && !board[y][x].special && types.includes(board[y][x].kind)) add(y, x);
    }
  } else if (evolution === 'infernodon') {
    for (const row of nearest(r).slice(0, strength)) for (let x = 0; x < SIZE; x++) add(row, x);
    for (const col of nearest(c).slice(0, strength)) for (let y = 0; y < SIZE; y++) add(y, col);
  }
  return [...keys].sort((a, b) => a - b).map(position);
}
// A tap shows the current power footprint; a directional swipe shows the exact landing cells.
export function previewPower(board, from, to = null) {
  if (!isValidBoard(board) || !Array.isArray(from) || !within(...from)) return null;
  const first = board[from[0]][from[1]];
  if (!to) {
    if (first?.special !== 'evolved') return null;
    return { type: 'evolved', evolution: first.evolution, rank: tileRank(first), r: from[0], c: from[1],
      precise: false, cells: powerCells(board, ...from, first.evolution, null, tileRank(first)) };
  }
  if (!adjacent(from, to)) return null;
  const second = board[to[0]][to[1]];
  if (first.special === 'evolved' && second.special === 'evolved') {
    return { type: 'mega', r: to[0], c: to[1], precise: true,
      cells: [...new Set([...squareKeys(...to, 2), posKey(...from)])].sort((a, b) => a - b).map(position) };
  }
  const evolved = first.special === 'evolved' ? first : second.special === 'evolved' ? second : null;
  if (!evolved) return null;
  const landing = first.special === 'evolved' ? to : from;
  const partner = first.special === 'evolved' ? second : first;
  const swapped = swap(board, from, to);
  return { type: 'evolved', evolution: evolved.evolution, rank: tileRank(evolved), r: landing[0], c: landing[1],
    precise: true, targetKind: partner.kind,
    cells: powerCells(swapped, ...landing, evolved.evolution, partner.kind, tileRank(evolved)) };
}

function collectPowerEffects(board, initial, effects = [], targetKinds = new Map(), skipEvolved = new Set()) {
  const clear = new Set(initial);
  const queue = [...initial];
  const activated = new Set();
  const add = (r, c) => {
    if (!within(r, c)) return;
    const key = posKey(r, c);
    if (!clear.has(key)) { clear.add(key); queue.push(key); }
  };
  while (queue.length) {
    const key = queue.pop();
    if (activated.has(key)) continue;
    activated.add(key);
    const [r, c] = position(key), tile = board[r][c];
    if (!tile?.special) continue;
    if (tile.special === 'row') for (let x = 0; x < SIZE; x++) add(r, x);
    if (tile.special === 'col') for (let y = 0; y < SIZE; y++) add(y, c);
    if (tile.special === 'bomb') for (let y = r - 1; y <= r + 1; y++) for (let x = c - 1; x <= c + 1; x++) add(y, x);
    if (tile.special === 'rainbow') for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (board[y][x]?.kind === tile.kind) add(y, x);
    if (tile.special === 'evolved' && !skipEvolved.has(key)) {
      const targetKind = targetKinds.get(key) ?? null;
      const rank = tileRank(tile);
      const cells = powerCells(board, r, c, tile.evolution, targetKind, rank);
      effects.push({ type: 'evolved', r, c, evolution: tile.evolution, rank,
        ability: ABILITY_NAMES[tile.evolution], targetKind, cells });
      for (const [y, x] of cells) add(y, x);
    }
  }
  return clear;
}

export function makeMove(board, from, to, rng = Math.random) {
  if (!isValidBoard(board) || !adjacent(from, to)) return { valid: false, board };
  restoreIds(board);
  let working = swap(board, from, to);
  const swapped = cloneBoard(working), a = working[from[0]][from[1]], b = working[to[0]][to[1]];
  const direct = new Set(), initialEffects = [], targetKinds = new Map(), skipEvolved = new Set();
  if (a.special === 'evolved' && b.special === 'evolved') {
    // Two evolved monsters swapped together trigger one 5x5 mega blast.
    const [centerR, centerC] = to;
    const area = squareKeys(centerR, centerC, 2);
    const cells = [...new Set([...area, posKey(...from), posKey(...to)])].map(position);
    initialEffects.push({ type: 'mega', r: centerR, c: centerC, radius: 2, cells });
    for (const key of area) direct.add(key);
    direct.add(posKey(...from)); direct.add(posKey(...to));
    // The swapped pair powers the mega attack; don't also fire two ordinary abilities.
    skipEvolved.add(posKey(...from)); skipEvolved.add(posKey(...to));
  } else if (a.special === 'rainbow' || b.special === 'rainbow') {
    const rainbowA = a.special === 'rainbow', rainbowB = b.special === 'rainbow';
    if (rainbowA && rainbowB) for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) direct.add(posKey(r, c));
    else {
      const color = rainbowA ? b.kind : a.kind;
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (working[r][c].kind === color) direct.add(posKey(r, c));
    }
    direct.add(posKey(...from)); direct.add(posKey(...to));
  } else {
    if (a.special) direct.add(posKey(...from));
    if (b.special) direct.add(posKey(...to));
    // A and b refer to their positions AFTER the swap.
    if (a.special === 'evolved') targetKinds.set(posKey(...from), b.kind);
    if (b.special === 'evolved') targetKinds.set(posKey(...to), a.kind);
  }
  if (!direct.size && !findRuns(working).length) return { valid: false, board, swapped };

  const stages = [];
  let score = 0;
  for (let chain = 1; chain <= 32; chain++) {
    const runs = findRuns(working);
    const groups = groupedRuns(runs);
    if (!groups.length && !(chain === 1 && direct.size)) break;
    // Visual-only metadata: original matching tiles before any blast or gravity.
    // This must never change the actual clearing rules, scoring or saved board.
    const matches = groups.map(group => {
      const cells = [...group.keys].map(position);
      const [firstR, firstC] = cells[0];
      const special = powerFor(group);
      return { kind: working[firstR][firstC].kind, cells,
        tier: special === 'evolved' ? Math.min(7, group.keys.size) : special ? 4 : 3 };
    });
    const seedClear = new Set(chain === 1 ? direct : []);
    for (const group of groups) for (const key of group.keys) seedClear.add(key);
    const effects = chain === 1 ? [...initialEffects] : [];
    const clears = collectPowerEffects(working, seedClear, effects, targetKinds, skipEvolved);
    const upgrades = [];
    const blockedAnchors = direct.size && chain === 1 ? collectPowerEffects(working, direct, [], targetKinds, skipEvolved) : new Set();
    for (const group of groups) {
      const special = powerFor(group);
      if (!special) continue;
      // Only the first cascade belongs to the player's swipe. Later chains
      // must not reuse the previous swipe coordinates as an arbitrary anchor.
      const preferred = chain === 1 ? [posKey(...to), posKey(...from)] : [];
      const anchor = preferred.find(k => group.keys.has(k)) ?? centerAnchor(group);
      // Specials spawned by a matched group must not survive a simultaneous blast.
      if (!blockedAnchors.has(anchor)) {
        upgrades.push({ key: anchor, special, rank: special === 'evolved' ? rankForCount(group.keys.size) : null });
      }
    }
    const anchored = new Set();
    for (const item of upgrades) if (!anchored.has(item.key)) {
      anchored.add(item.key);
      clears.delete(item.key);
    }
    for (const key of clears) {
      const [r, c] = position(key);
      working[r][c] = null;
    }
    const created = [];
    for (const { key, special, rank } of upgrades) if (anchored.has(key)) {
      const [r, c] = position(key), cell = working[r][c];
      if (cell) {
        cell.special = special;
        if (special === 'evolved') { cell.evolution = EVOLUTIONS[cell.kind]; cell.rank = rank; }
        created.push({ r, c, special, ...(special === 'evolved' ? { evolution: cell.evolution, rank } : {}) });
      }
    }
    const afterClear = cloneBoard(working);
    const removed = clears.size;
    const points = removed * 70 * chain + created.length * 160 + (chain > 1 ? (chain - 1) * 100 : 0) +
      effects.filter(effect => effect.type === 'evolved').length * 200 +
      effects.filter(effect => effect.type === 'mega').length * 500 +
      created.reduce((bonus, tile) => bonus + (tile.rank === 2 ? 360 : tile.rank === 3 ? 950 : 0), 0);
    score += points;
    fallAndFill(working, rng);
    stages.push({ clear: [...clears].map(position), matches, created, effects, points, chain, afterClear, afterFall: cloneBoard(working), removed });
  }
  let reshuffled = false;
  if (findRuns(working).length || !hasMove(working)) {
    working = createBoard(rng);
    reshuffled = true;
  }
  return { valid: true, swapped, board: working, score, chains: stages.length, stages, reshuffled };
}
