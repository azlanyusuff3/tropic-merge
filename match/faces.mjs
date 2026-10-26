// Living faces for Monster Match — the same idea as Monster Merge's faces:
// the sprite is drawn with its eyes and mouth painted out, and the real eyes
// and mouth are layered back on top so they can blink, glance around, talk,
// smile and react. Purely visual; engine, score and saves are untouched.
import { FACE_RIG } from './face-rig.mjs';

const BASE = './match/faces/';
const pct = n => `${+(n * 100 / 512).toFixed(3)}%`;
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
let ready = false;

export const isReady = () => ready;

// Load every bare sprite and patch once, so faces appear without flicker.
export function preload() {
  const urls = [];
  for (const [name, rig] of Object.entries(FACE_RIG)) {
    urls.push(`${BASE}${name}.webp`);
    for (const [k, i] of rig.f) urls.push(`${BASE}${name}-${k === 'm' ? 'm' : 'e' + i}.webp`);
  }
  return Promise.all(urls.map(src => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => (image.decode ? image.decode().catch(() => {}) : Promise.resolve()).then(resolve);
    image.onerror = reject;
    image.src = src;
  }))).then(() => { ready = true; return true; });
}

// Inner HTML of a tile's .sprite box. Without face assets, the original art.
export function spriteHTML(key, originalUrl) {
  const rig = FACE_RIG[key];
  if (!ready || !rig || reduced()) return `<img src="${originalUrl}" alt="" draggable="false" loading="eager">`;
  let parts = '';
  for (const [k, i, cx, cy, rx, ry, px, py, pw, ph] of rig.f) {
    const mouth = k === 'm';
    const file = `${BASE}${key}-${mouth ? 'm' : 'e' + i}.webp`;
    // Pivot points follow Merge: eyes close toward their lower lid, the mouth opens downward.
    const ox = (cx - px) / pw * 100, oy = ((mouth ? cy - ry * .55 : cy + ry * .3) - py) / ph * 100;
    const look = rig.t === 'closed' ? .35 : 1;
    parts += `<i class="ft ${mouth ? 'mouth' : 'eye'}" style="left:${pct(px)};top:${pct(py)};width:${pct(pw)};height:${pct(ph)};` +
      `background-image:url('${file}');transform-origin:${ox.toFixed(1)}% ${oy.toFixed(1)}%;` +
      `--mx:${(rx * .17 / pw * 100 * look).toFixed(2)}%;--my:${(ry * .15 / ph * 100 * look).toFixed(2)}%"></i>`;
    // Happy-crescent eyes can pop open into round eyes (peek / surprise).
    if (!mouth && rig.t === 'closed') {
      const er = rx * .6, eh = rx * .74, ey = cy + ry * .1;
      parts += `<i class="pk" style="left:${pct(cx - er)};top:${pct(ey - eh)};width:${pct(er * 2)};height:${pct(eh * 2)};` +
        `--mx:${(rx * .25 / (er * 2) * 100).toFixed(2)}%;--my:${(ry * .2 / (eh * 2) * 100).toFixed(2)}%"></i>`;
    }
  }
  return `<img src="${BASE}${key}.webp" alt="" draggable="false" loading="eager"><span class="face" data-t="${rig.t}" aria-hidden="true">${parts}</span>`;
}

// Timed class on a tile, restarting cleanly if it is already playing.
const flagTimers = new WeakMap();
export function flag(tile, cls, ms) {
  if (!tile) return;
  let timers = flagTimers.get(tile);
  if (!timers) flagTimers.set(tile, timers = {});
  clearTimeout(timers[cls]);
  tile.classList.remove(cls);
  void tile.offsetWidth;
  tile.classList.add(cls);
  timers[cls] = setTimeout(() => tile.classList.remove(cls), ms);
}

const state = new WeakMap();
function gaze(tile, x, y) {
  tile.style.setProperty('--lx', x.toFixed(2));
  tile.style.setProperty('--ly', y.toFixed(2));
}

// Everyone nearby turns their eyes toward a board cell for a moment.
export function lookAt(board, r, c, ms = 1400, radius = 3.2) {
  if (reduced()) return;
  const until = performance.now() + ms;
  for (const tile of board.querySelectorAll('.tile')) {
    const dr = r - Number(tile.dataset.r), dc = c - Number(tile.dataset.c), d = Math.hypot(dr, dc);
    if (d < .5 || d > radius) continue;
    gaze(tile, dc / d, dr / d);
    const s = state.get(tile);
    if (s) s.lookAt = until;
  }
}

// --- Reactions when the player picks a monster -------------------------------
// Same kind nearby: happy ("let's match!"). Elemental rival nearby: scared.
// An evolved monster: everyone inside its power area is scared of the blast.
// Kinds: 0 Slimelet, 1 Tidalon, 2 Puffling, 3 Sproutiball, 4 Rockro, 5 Frostbop.
// Water puts out lava, lava melts ice, ice freezes sprouts, sprouts soak up water.
// Puffling and Slimelet are friends with everyone.
export const FEARS = Object.freeze({ 1: [4], 4: [5], 5: [3], 3: [1] });
const MOODS = ['face-happy', 'face-scared'];
const BODY = ['mm-joy', 'mm-scared'];

function setMood(tile, mood, away, ms) {
  const body = tile.querySelector('.monster-body');
  flag(tile, mood, ms);
  if (!body) return;
  if (away) { body.style.setProperty('--ax', `${(away[1] * 9).toFixed(1)}%`); body.style.setProperty('--ay', `${(away[0] * 9).toFixed(1)}%`); }
  flag(body, mood === 'face-happy' ? 'mm-joy' : 'mm-scared', ms);
}

export function clearSelectReact(board) {
  for (const node of board.querySelectorAll('.face-happy,.face-scared,.mm-joy,.mm-scared')) node.classList.remove(...MOODS, ...BODY);
}

// cell: the selected engine cell. powerCells: [[r,c]] an evolved monster would hit.
export function selectReact(board, r, c, cell, powerCells = []) {
  clearSelectReact(board);
  if (reduced() || !cell) return { happy: 0, scared: 0 };
  const ms = 1900, out = { happy: 0, scared: 0 };
  const inPower = new Set(powerCells.map(([pr, pc]) => pr * 8 + pc));
  for (const tile of board.querySelectorAll('.tile')) {
    const tr = Number(tile.dataset.r), tc = Number(tile.dataset.c);
    const dr = tr - r, dc = tc - c, ring = Math.max(Math.abs(dr), Math.abs(dc));
    if (!ring) continue;
    const d = Math.hypot(dr, dc), away = [dr / d, dc / d];
    if (cell.special === 'evolved') {
      if (inPower.has(tr * 8 + tc) || ring === 1) { setMood(tile, 'face-scared', away, ms); out.scared++; }
      continue;
    }
    const kind = Number(tile.dataset.kind), evolved = tile.classList.contains('is-evolved');
    if (!evolved && kind === cell.kind && ring <= 2) { setMood(tile, 'face-happy', null, ms); out.happy++; }
    else if (!evolved && ring === 1 && FEARS[cell.kind]?.includes(kind)) { setMood(tile, 'face-scared', away, ms); out.scared++; }
  }
  return out;
}

// Short facial reaction on specific cells: 'face-wow', 'face-smile', 'face-ow'.
export function react(board, cells, cls = 'face-wow', ms = 650) {
  if (reduced()) return;
  for (const [r, c] of cells) flag(board.querySelector(`.tile[data-r="${r}"][data-c="${c}"]`), cls, ms);
}

let loop = 0, chatterAt = 0;
export function start(board, isBusy) {
  clearInterval(loop);
  loop = setInterval(() => {
    if (!ready || reduced() || document.hidden) return;
    const now = performance.now();
    const tiles = board.querySelectorAll('.tile');
    for (const tile of tiles) {
      const face = tile.querySelector('.face');
      if (!face) continue;
      let s = state.get(tile);
      if (!s) state.set(tile, s = { blinkAt: now + 300 + Math.random() * 3600, lookAt: now + Math.random() * 2500, peekAt: now + 1500 + Math.random() * 7000 });
      const closed = face.dataset.t === 'closed';
      if (now >= s.blinkAt) {
        if (!closed || tile.classList.contains('face-peek')) flag(tile, 'face-blink', 180);
        s.blinkAt = now + (Math.random() < .16 ? 240 : 1700 + Math.random() * 3800);
      }
      if (now >= s.lookAt) {
        if (Math.random() < .35) gaze(tile, 0, .2);
        else gaze(tile, Math.random() * 2 - 1, Math.random() * 1.3 - .65);
        s.lookAt = now + 1100 + Math.random() * 2800;
      }
      if (closed && now >= s.peekAt) {
        flag(tile, 'face-peek', 1150);
        s.peekAt = now + 5200 + Math.random() * 7500;
      }
    }
    // Now and then one monster chats or grins to itself.
    if (now >= chatterAt && !isBusy()) {
      chatterAt = now + 1600 + Math.random() * 2600;
      const pick = tiles[Math.floor(Math.random() * tiles.length)];
      if (pick?.querySelector('.face')) Math.random() < .55 ? flag(pick, 'face-talk', 1300) : flag(pick, 'face-smile', 1100);
    }
  }, 100);
}
