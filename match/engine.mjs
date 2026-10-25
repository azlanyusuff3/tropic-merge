// Monster Match: pure 8x8 match-three rules, independent of Merge and Sling.
export const SIZE = 8;
export const COLORS = 6;
export const POWERS = ['row', 'col', 'bomb', 'rainbow'];
let lastId = 0;
const posKey = (r, c) => r * SIZE + c;
const position = key => [Math.floor(key / SIZE), key % SIZE];
const within = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
const pick = (max, rng) => Math.max(0, Math.min(max - 1, Math.floor(rng() * max)));
const newTile = (kind, special = null) => ({ id: ++lastId, kind, special });
export const cloneBoard = board => board.map(row => row.map(cell => cell ? { ...cell } : null));
const kindAt = cell => cell && cell.special !== 'rainbow' ? cell.kind : -1;

export function isValidBoard(board) {
  if (!Array.isArray(board) || board.length !== SIZE) return false;
  const seen = new Set();
  return board.every(row => Array.isArray(row) && row.length === SIZE && row.every(cell => {
    if (!cell || !Number.isSafeInteger(cell.id) || cell.id <= 0 || seen.has(cell.id) ||
        !Number.isInteger(cell.kind) || cell.kind < 0 || cell.kind >= COLORS ||
        (cell.special !== null && !POWERS.includes(cell.special))) return false;
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
  if (group.runs.some(run => run.keys.length >= 5)) return 'rainbow';
  if (group.runs.some(run => run.axis === 'row') && group.runs.some(run => run.axis === 'col')) return 'bomb';
  const four = group.runs.find(run => run.keys.length >= 4);
  return four ? four.axis : null;
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
function collectPowerEffects(board, initial) {
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
  }
  return clear;
}

export function makeMove(board, from, to, rng = Math.random) {
  if (!isValidBoard(board) || !adjacent(from, to)) return { valid: false, board };
  restoreIds(board);
  let working = swap(board, from, to);
  const swapped = cloneBoard(working), a = working[from[0]][from[1]], b = working[to[0]][to[1]];
  const direct = new Set();
  if (a.special === 'rainbow' || b.special === 'rainbow') {
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
  }
  if (!direct.size && !findRuns(working).length) return { valid: false, board, swapped };

  const stages = [];
  let score = 0;
  for (let chain = 1; chain <= 32; chain++) {
    const runs = findRuns(working);
    const groups = groupedRuns(runs);
    if (!groups.length && !(chain === 1 && direct.size)) break;
    const seedClear = new Set(chain === 1 ? direct : []);
    for (const group of groups) for (const key of group.keys) seedClear.add(key);
    const clears = collectPowerEffects(working, seedClear);
    const upgrades = [];
    const blockedAnchors = direct.size && chain === 1 ? collectPowerEffects(working, direct) : new Set();
    for (const group of groups) {
      const special = powerFor(group);
      if (!special) continue;
      const preferred = [posKey(...to), posKey(...from)];
      const anchor = preferred.find(k => group.keys.has(k)) ?? [...group.keys][0];
      // Specials spawned by a matched group must not survive a simultaneous blast.
      if (!blockedAnchors.has(anchor)) {
        upgrades.push({ key: anchor, special });
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
    for (const { key, special } of upgrades) if (anchored.has(key)) {
      const [r, c] = position(key), cell = working[r][c];
      if (cell) { cell.special = special; created.push({ r, c, special }); }
    }
    const afterClear = cloneBoard(working);
    const removed = clears.size;
    const points = removed * 70 * chain + created.length * 160 + (chain > 1 ? (chain - 1) * 100 : 0);
    score += points;
    fallAndFill(working, rng);
    stages.push({ clear: [...clears].map(position), created, points, chain, afterClear, afterFall: cloneBoard(working), removed });
  }
  let reshuffled = false;
  if (findRuns(working).length || !hasMove(working)) {
    working = createBoard(rng);
    reshuffled = true;
  }
  return { valid: true, swapped, board: working, score, chains: stages.length, stages, reshuffled };
}
