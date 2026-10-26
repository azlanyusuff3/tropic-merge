// Living monsters for Monster Match — purely visual.
// Mirrors the Monster Merge idea (breathing, sway, jelly landings, reactions)
// using compositor-friendly CSS transforms on DOM tiles. Nothing here touches
// the engine, score, cleared tiles or saved progress.
const SIZE = 8;
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
const TINTS = ['#a0fa78', '#77e8ff', '#ffc2ee', '#b2f68a', '#ffd58c', '#bbf5ff'];
const AMBIENT = ['mm-act-hop', 'mm-act-look', 'mm-act-wiggle', 'mm-act-stretch', 'mm-act-spin'];
const landTimers = new WeakMap();

const tileAt = (board, r, c) => board.querySelector(`.tile[data-r="${r}"][data-c="${c}"]`);
const bodyOf = tile => tile?.querySelector('.monster-body');

// Restart a one-shot CSS animation class on an element.
export function replay(node, className) {
  if (!node) return;
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
}
function oneShot(node, className, ms) {
  if (!node) return;
  replay(node, className);
  setTimeout(() => node.classList.remove(className), ms);
}

// Gravity-ish: duration grows with the square root of the drop distance.
export function fallMs(rows) {
  return rows <= 0 ? 0 : Math.round(Math.min(470, 150 + 72 * Math.sqrt(rows)));
}

// Called by render() for a tile that moved down (or spawned above the board).
export function startFall(tile, rows, delayMs = 0) {
  const body = bodyOf(tile);
  const ms = fallMs(rows);
  tile.style.setProperty('--fall-ms', ms + 'ms');
  tile.style.setProperty('--fall-delay', delayMs + 'ms');
  tile.classList.add('mm-dropping');
  clearTimeout(landTimers.get(tile));
  if (reduced()) { tile.classList.remove('mm-dropping'); return 0; }
  body?.classList.add('mm-falling');
  landTimers.set(tile, setTimeout(() => {
    tile.classList.remove('mm-dropping');
    tile.style.removeProperty('--fall-delay');
    body?.classList.remove('mm-falling');
    // Bigger drops land with a bigger jelly squash.
    body?.style.setProperty('--land', String(Math.min(1.35, .55 + rows * .16)));
    oneShot(body, 'mm-land', 560);
  }, ms + delayMs));
  return ms + delayMs;
}

// Swapped monsters hop over each other; a failed swap gets a little "nope" shake.
export function swapHop(board, from, to, valid) {
  if (reduced()) return;
  for (const [r, c] of [from, to]) oneShot(bodyOf(tileAt(board, r, c)), valid ? 'mm-swap' : 'mm-nope', 460);
}

// Matched monsters crouch, leap and lunge toward the centre of their group.
export function castPose(board, matches = []) {
  if (reduced()) return;
  for (const group of matches) {
    if (!group.cells?.length) continue;
    const cr = group.cells.reduce((s, [r]) => s + r, 0) / group.cells.length;
    const cc = group.cells.reduce((s, [, c]) => s + c, 0) / group.cells.length;
    for (const [r, c] of group.cells) {
      const body = bodyOf(tileAt(board, r, c));
      if (!body) continue;
      const dx = Math.max(-1, Math.min(1, cc - c)), dy = Math.max(-1, Math.min(1, cr - r));
      body.style.setProperty('--lx', `${dx * 16}%`);
      body.style.setProperty('--ly', `${dy * 16}%`);
      body.style.setProperty('--lean', `${dx * 9}deg`);
      replay(body, 'mm-cast');
    }
  }
}

// Bright little "poof" where each monster disappears, tinted by its element.
export function poof(board, cells = []) {
  if (reduced()) return;
  const host = document.createElement('div');
  host.className = 'mm-poof-layer';
  host.setAttribute('aria-hidden', 'true');
  for (const [r, c] of cells.slice(0, 24)) {
    const tile = tileAt(board, r, c);
    const kind = Number(tile?.dataset.kind);
    const p = document.createElement('span');
    p.className = 'mm-poof';
    p.style.left = `${(c + .5) * 100 / SIZE}%`;
    p.style.top = `${(r + .5) * 100 / SIZE}%`;
    p.style.setProperty('--tint', TINTS[kind] || '#fff6c8');
    p.style.setProperty('--spin', `${((r * 7 + c * 13) % 90) - 45}deg`);
    host.append(p);
  }
  board.append(host);
  setTimeout(() => host.remove(), 700);
}

// Monsters next to a power blast flinch in surprise.
export function shock(board, cells = []) {
  if (reduced()) return;
  const hit = new Set(cells.map(([r, c]) => r * SIZE + c));
  const near = new Set();
  for (const [r, c] of cells) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= SIZE || nc >= SIZE || hit.has(nr * SIZE + nc)) continue;
    near.add(nr * SIZE + nc);
  }
  for (const key of near) oneShot(bodyOf(tileAt(board, Math.floor(key / SIZE), key % SIZE)), 'mm-shock', 520);
}

// Board shake. level: 1 light, 2 medium, 3 heavy.
export function shake(frame, level = 1) {
  if (!frame || reduced()) return;
  frame.classList.remove('mm-shake-1', 'mm-shake-2', 'mm-shake-3');
  void frame.offsetWidth;
  frame.classList.add(`mm-shake-${level}`);
  setTimeout(() => frame.classList.remove(`mm-shake-${level}`), 620);
}

export function flash(board, color = '#ffffff') {
  if (reduced()) return;
  const f = document.createElement('div');
  f.className = 'mm-flash';
  f.style.setProperty('--flash', color);
  f.setAttribute('aria-hidden', 'true');
  board.append(f);
  setTimeout(() => f.remove(), 600);
}

// Light rays and a ring behind a freshly evolved monster.
export function evolveRays(board, item) {
  if (reduced()) return;
  const rays = document.createElement('div');
  rays.className = 'mm-rays';
  rays.dataset.rank = String(item.rank || 1);
  rays.style.left = `${(item.c + .5) * 100 / SIZE}%`;
  rays.style.top = `${(item.r + .5) * 100 / SIZE}%`;
  rays.setAttribute('aria-hidden', 'true');
  board.append(rays);
  setTimeout(() => rays.remove(), 1300);
}

// Everyone does a happy spin when the board is shuffled.
export function shuffleDance(board) {
  if (reduced()) return;
  for (const tile of board.querySelectorAll('.tile')) {
    const body = bodyOf(tile);
    body?.style.setProperty('--dance-delay', `${(Number(tile.dataset.r) + Number(tile.dataset.c)) * 22}ms`);
    oneShot(body, 'mm-dance', 760);
  }
}

// Ambient life: every couple of seconds a few monsters do something on their own.
let ambientTimer = 0;
export function startAmbient(board, isBusy) {
  clearTimeout(ambientTimer);
  const tick = () => {
    ambientTimer = setTimeout(tick, 900 + Math.random() * 1300);
    if (reduced() || document.hidden || isBusy()) return;
    const tiles = [...board.querySelectorAll('.tile:not(.chosen):not(.hinted):not(.power-preview)')];
    const count = 1 + (Math.random() < .45 ? 1 : 0);
    for (let i = 0; i < count && tiles.length; i++) {
      const tile = tiles.splice(Math.floor(Math.random() * tiles.length), 1)[0];
      const body = bodyOf(tile);
      if (!body || [...body.classList].some(c => c.startsWith('mm-') && c !== 'mm-idle')) continue;
      const act = AMBIENT[Math.floor(Math.random() * AMBIENT.length)];
      body.style.setProperty('--look', Math.random() < .5 ? '-1' : '1');
      oneShot(body, act, 1000);
    }
  };
  tick();
}
