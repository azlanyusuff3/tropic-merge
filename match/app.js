import { SIZE, createBoard, isValidBoard, restoreIds, cloneBoard, adjacent, makeMove, findHint } from './engine.mjs';

const SPRITES = [
  ['Slimelet', './assets/monsters/01-slimelet.webp'],
  ['Tidalon', './match/assets/tidalon-match.webp'],
  ['Puffling', './assets/monsters/03-puffling.webp'],
  ['Sproutiball', './assets/monsters/04-sproutiball.webp'],
  ['Rockro', './assets/monsters/05-rockro.webp'],
  ['Frostbop', './match/assets/frostbop-match.webp']
];
const SAVE_KEY = 'monsterMatchSaveV1';
const BEST_KEY = 'monsterMatchBestV1';
const AUDIO_KEY = 'monsterMatchSoundV1';
const el = id => document.getElementById(id);
const boardEl = el('board');
const tiles = new Map();
let soundOn = false;
let audio = null;
let busy = false;
let selected = null;
let touchStart = null;
let statusTimeout = 0;
let hintTimeout = 0;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const safeNumber = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
const initialBest = safeNumber(read(BEST_KEY));
let game = { board: createBoard(), score: 0, best: initialBest, matches: 0, moves: 0 };
try {
  const old = JSON.parse(read(SAVE_KEY));
  if (old && old.version === 1 && isValidBoard(old.board) &&
    [old.score, old.best, old.matches, old.moves].every(n => Number.isSafeInteger(n) && n >= 0)) {
    restoreIds(old.board);
    game = { board: cloneBoard(old.board), score: old.score, best: Math.max(old.best, initialBest, old.score), matches: old.matches, moves: old.moves };
  }
} catch {}
soundOn = read(AUDIO_KEY) === '1';

function store() {
  game.best = Math.max(game.best, game.score);
  write(BEST_KEY, String(game.best));
  write(SAVE_KEY, JSON.stringify({ version: 1, ...game }));
}
function tone(frequency = 480, duration = .08) {
  if (!soundOn) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.2, audio.currentTime + duration);
    gain.gain.setValueAtTime(.065, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(); oscillator.stop(audio.currentTime + duration);
  } catch {}
}
function showMessage(message, duration = 1900) {
  clearTimeout(statusTimeout);
  el('game-message').textContent = message;
  statusTimeout = setTimeout(() => { el('game-message').textContent = 'Swipe to match 3 or more monsters!'; }, duration);
}
function updateHud() {
  el('score').textContent = game.score.toLocaleString();
  el('best').textContent = game.best.toLocaleString();
  el('matches').textContent = game.matches.toLocaleString();
  el('sound-btn').classList.toggle('muted-btn', !soundOn);
  el('sound-btn').setAttribute('aria-label', soundOn ? 'Mute sound' : 'Enable sound');
  el('sound-btn').setAttribute('aria-pressed', String(soundOn));
}
function faceHTML(cell) {
  const icon = { row: '&#8596;', col: '&#8597;', bomb: '&#10022;', rainbow: '&#9733;' }[cell.special] || '';
  return `<span class="tile-well"><img src="${SPRITES[cell.kind][1]}" alt="" draggable="false" loading="eager"><span class="power-icon" aria-hidden="true">${icon}</span></span>`;
}
function render(board) {
  const used = new Set();
  board.forEach((row, r) => row.forEach((cell, c) => {
    if (!cell) return;
    used.add(cell.id);
    let button = tiles.get(cell.id);
    if (!button) {
      button = document.createElement('button');
      button.type = 'button'; button.className = 'tile is-new'; button.dataset.tileId = cell.id;
      button.tabIndex = -1;
      boardEl.append(button); tiles.set(cell.id, button);
      button.addEventListener('animationend', () => button.classList.remove('is-new'), { once: true });
    }
    button.style.setProperty('--c', c);
    button.style.setProperty('--r', r);
    button.dataset.r = r; button.dataset.c = c;
    const appearance = `${cell.kind}|${cell.special || ''}`;
    if (button.dataset.appearance !== appearance) {
      button.dataset.appearance = appearance;
      button.innerHTML = faceHTML(cell);
      button.classList.toggle('is-power', !!cell.special);
      button.classList.toggle('is-rainbow', cell.special === 'rainbow');
      button.setAttribute('aria-label', `${SPRITES[cell.kind][0]}${cell.special ? ', ' + cell.special + ' power' : ''}, row ${r + 1}, column ${c + 1}`);
    }
    button.classList.toggle('chosen', !!selected && selected[0] === r && selected[1] === c);
  }));
  for (const [id, node] of tiles) if (!used.has(id)) { node.remove(); tiles.delete(id); }
}
function clearHints() { clearTimeout(hintTimeout); boardEl.querySelectorAll('.hinted').forEach(node => node.classList.remove('hinted')); }
function clearSelection() { selected = null; boardEl.querySelectorAll('.chosen').forEach(node => node.classList.remove('chosen')); }
function highlight(cells, className) {
  for (const [r, c] of cells) {
    const node = boardEl.querySelector(`.tile[data-r="${r}"][data-c="${c}"]`);
    node?.classList.add(className);
  }
}
function popup(text, cell = [3, 3]) {
  const label = document.createElement('span');
  label.className = 'floating-score'; label.textContent = text;
  label.style.left = `${(cell[1] + .5) * 100 / SIZE}%`;
  label.style.top = `${(cell[0] + .5) * 100 / SIZE}%`;
  boardEl.append(label);
  setTimeout(() => label.remove(), 750);
}
function setBusy(value) {
  busy = value;
  boardEl.classList.toggle('busy', busy);
  for (const id of ['hint-btn', 'shuffle-btn', 'new-btn']) el(id).disabled = busy;
}
async function playMove(from, to) {
  if (busy || !adjacent(from, to)) return;
  setBusy(true); clearHints(); clearSelection();
  const result = makeMove(game.board, from, to);
  if (!result.valid) {
    if (result.swapped) { render(result.swapped); await delay(175); render(game.board); }
    showMessage('Try to match at least 3 monsters!');
    setBusy(false); return;
  }
  // Save the complete move immediately: leaving during an animation never loses progress.
  game.board = result.board; game.moves++;
  game.matches += result.stages.reduce((count, step) => count + step.removed, 0);
  game.score += result.score; game.best = Math.max(game.best, game.score);
  store(); updateHud();
  render(result.swapped); tone(330, .07);
  await delay(180);
  for (const stage of result.stages) {
    highlight(stage.clear, 'clearing');
    if (stage.chain > 1) {
      el('chain-badge').textContent = `COMBO x${stage.chain}!`;
      el('chain-badge').classList.add('combo-live');
    }
    popup(`+${stage.points.toLocaleString()}`, stage.clear[Math.floor(stage.clear.length / 2)] || [3, 3]);
    tone(400 + stage.chain * 95, .12);
    await delay(210);
    render(stage.afterClear);
    await delay(85);
    render(stage.afterFall);
    await delay(215);
  }
  if (result.reshuffled) { render(game.board); showMessage('Fresh board! No more available moves.'); }
  else if (result.chains > 1) showMessage(`Amazing! ${result.chains} chain combos!`);
  else showMessage('Nice match! Keep going.');
  el('chain-badge').classList.remove('combo-live');
  el('chain-badge').textContent = 'NO MOVE LIMIT';
  setBusy(false);
}

boardEl.addEventListener('pointerdown', event => {
  if (busy || event.button > 0) return;
  const tile = event.target.closest('.tile');
  if (!tile) return;
  touchStart = { id: event.pointerId, r: Number(tile.dataset.r), c: Number(tile.dataset.c), x: event.clientX, y: event.clientY };
  try { boardEl.setPointerCapture(event.pointerId); } catch {}
});
boardEl.addEventListener('pointerup', event => {
  if (!touchStart || event.pointerId !== touchStart.id || busy) return;
  const start = touchStart; touchStart = null;
  const dx = event.clientX - start.x, dy = event.clientY - start.y;
  const threshold = Math.max(15, boardEl.clientWidth / SIZE * .3);
  if (Math.max(Math.abs(dx), Math.abs(dy)) > threshold) {
    const to = Math.abs(dx) > Math.abs(dy) ? [start.r, start.c + Math.sign(dx)] : [start.r + Math.sign(dy), start.c];
    playMove([start.r, start.c], to);
    return;
  }
  const tile = boardEl.querySelector(`.tile[data-r="${start.r}"][data-c="${start.c}"]`);
  if (!tile) return;
  if (selected && adjacent(selected, [start.r, start.c])) playMove(selected, [start.r, start.c]);
  else {
    const same = selected?.[0] === start.r && selected?.[1] === start.c;
    selected = same ? null : [start.r, start.c];
    render(game.board);
  }
});
boardEl.addEventListener('pointercancel', () => { touchStart = null; });
boardEl.addEventListener('keydown', event => {
  if (busy) return;
  const directions = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
  if (directions[event.key]) {
    event.preventDefault();
    const from = selected || [3, 3], d = directions[event.key];
    playMove(from, [from[0] + d[0], from[1] + d[1]]);
  }
});
el('hint-btn').addEventListener('click', () => {
  if (busy) return;
  clearHints(); clearSelection();
  const pair = findHint(game.board);
  if (pair) { highlight(pair, 'hinted'); hintTimeout = setTimeout(clearHints, 2300); showMessage('Try swapping these glowing monsters!', 2300); }
});
el('shuffle-btn').addEventListener('click', () => {
  if (busy) return;
  clearHints(); clearSelection();
  game.board = createBoard(); store(); render(game.board); tone(540, .09);
  showMessage('Shuffled! Your score is safe.');
});
el('sound-btn').addEventListener('click', () => {
  soundOn = !soundOn; write(AUDIO_KEY, soundOn ? '1' : '0'); updateHud(); tone(640);
});
function modal(id, visible) {
  const node = el(id); node.hidden = !visible;
  if (visible) node.querySelector('button')?.focus();
  else el('board').focus({ preventScroll: true });
}
el('help-btn').addEventListener('click', () => modal('help-modal', true));
el('help-modal').querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => modal('help-modal', false)));
el('new-btn').addEventListener('click', () => { if (!busy) modal('reset-modal', true); });
el('cancel-reset').addEventListener('click', () => modal('reset-modal', false));
el('confirm-reset').addEventListener('click', () => {
  clearHints(); clearSelection();
  game = { board: createBoard(), score: 0, best: game.best, matches: 0, moves: 0 };
  store(); render(game.board); updateHud(); modal('reset-modal', false); showMessage('New game! Make your first match.');
});
for (const id of ['help-modal', 'reset-modal']) el(id).addEventListener('pointerdown', e => { if (e.target === el(id)) modal(id, false); });
addEventListener('keydown', event => { if (event.key === 'Escape') { modal('help-modal', false); modal('reset-modal', false); } });
addEventListener('pagehide', store);
render(game.board); updateHud();
// Small, read-only test hook for browser regression checks.
window.__monsterMatch = { state: () => ({ score: game.score, best: game.best, matches: game.matches, moves: game.moves, busy }), board: () => cloneBoard(game.board) };
