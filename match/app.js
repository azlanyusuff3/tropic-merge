import { getLevel, ISLANDS, BASE_MONSTERS, LEVELS, readProgress, beginLevel, applyLevelMove, isLevelWon, starsFor, recordVictory, totalStars } from './adventure.mjs';
import { SIZE, shuffleBoard, EVOLUTIONS, createBoard, isValidBoard, restoreIds, cloneBoard, adjacent, makeMove, findHint, previewPower, ABILITY_NAMES } from './engine.mjs';
import { castElementalMatches, clearElementalCharge } from './effects.mjs';
import * as life from './life.mjs';
import * as faces from './faces.mjs';

const SPRITES = [
  ['Slimelet', './assets/monsters/01-slimelet.webp'],
  ['Tidalon', './match/assets/tidalon-match.webp'],
  ['Puffling', './assets/monsters/03-puffling.webp'],
  ['Sproutiball', './assets/monsters/04-sproutiball.webp'],
  ['Rockro', './assets/monsters/05-rockro.webp'],
  ['Frostbop', './match/assets/frostbop-match.webp']

];
// Match-only evolved characters; the artwork of Monster Merge and Sling is unchanged.
const EVOLVED_SPRITES = Object.freeze({
  groveling: ['Groveling', './assets/monsters/08-groveling.webp'],
  bubblo: ['Bubblo', './assets/monsters/02-bubblo.webp'],
  shadebub: ['Shadebub', './assets/monsters/07-shadebub.webp'],
  lumiorb: ['Lumiorb', './assets/monsters/10-lumiorb.webp'],
  infernodon: ['Infernodon', './assets/monsters/11-infernodon.webp']
});
const SAVE_KEY = 'monsterMatchSaveV1';
const BEST_KEY = 'monsterMatchBestV1';
const AUDIO_KEY = 'monsterMatchSoundV1';
const ADVENTURE_KEY = 'monsterMatchAdventureV2';
let adventure = readProgress(null);
try { adventure = readProgress(JSON.parse(localStorage.getItem(ADVENTURE_KEY))); } catch {}
let mode = 'classic', run = null;
const classicSnapshot = () => ({ ...game, board: cloneBoard(game.board) });
let classicGame = null;
const saveAdventure = () => write(ADVENTURE_KEY, JSON.stringify(adventure));
const el = id => document.getElementById(id);
const boardEl = el('board');
const frameEl = boardEl.closest('.board-frame');
const tiles = new Map();
let soundOn = false;
let audio = null;
let busy = false;
let selected = null;
let touchStart = null;
let statusTimeout = 0;
let hintTimeout = 0;
let previewTimeout = 0;
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
    const restored = cloneBoard(old.board);
    // Older Match-5 shapes saved star/bomb or rainbow badges instead of the
    // promised evolution creature. Upgrade those badges without losing scores.
    for (const row of restored) for (const tile of row) {
      if (tile.special === 'bomb' || tile.special === 'rainbow') {
        tile.special = 'evolved'; tile.evolution = EVOLUTIONS[tile.kind];
      }
    }
    game = { board: restored, score: old.score, best: Math.max(old.best, initialBest, old.score), matches: old.matches, moves: old.moves };
  }
} catch {}
soundOn = read(AUDIO_KEY) === '1';

function store() {
  game.best = Math.max(game.best, game.score);
  if (mode === 'adventure') { if (run) { run.game = { ...game, board: cloneBoard(game.board) }; adventure.active = run; } saveAdventure(); return; }
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
  el('matches').textContent = (mode === 'adventure' && run ? Math.max(0, getLevel(run.level).moves - game.moves) : game.matches).toLocaleString();
  el('sound-btn').classList.toggle('muted-btn', !soundOn);
  el('sound-btn').setAttribute('aria-label', soundOn ? 'Mute sound' : 'Enable sound');
  el('sound-btn').setAttribute('aria-pressed', String(soundOn));
}
function artwork(cell) {
  return cell.special === 'evolved' ? EVOLVED_SPRITES[cell.evolution] : SPRITES[cell.kind];
}
function faceHTML(cell) {
  const icon = { row: '&#8596;', col: '&#8597;', bomb: '&#10022;', rainbow: '&#9733;' }[cell.special] || '';
  const evolved = cell.special === 'evolved';
  // Keep the evolved sprite unobstructed. Only legacy/non-evolved powers
  // need a small power symbol; evolved monsters communicate via their face.
  const powerBadge = !evolved && icon ? `<span class="power-icon" aria-hidden="true">${icon}</span>` : '';
  const [name, url] = artwork(cell);
  return `<span class="tile-well"><span class="monster-body"><span class="sprite">${faces.spriteHTML(name.toLowerCase(), url)}</span></span>${powerBadge}</span>`;
}
// Returns how long (ms) the longest falling monster needs to land.
function render(board, { stagger = false } = {}) {
  const used = new Set();
  const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Monsters new to the board spawn above it, stacked per column, then fall in.
  const spawnCount = Array(SIZE).fill(0);
  board.forEach(row => row.forEach((cell, c) => { if (cell && !tiles.has(cell.id)) spawnCount[c]++; }));
  const drops = [];
  board.forEach((row, r) => row.forEach((cell, c) => {
    if (!cell) return;
    used.add(cell.id);
    let button = tiles.get(cell.id);
    if (!button) {
      button = document.createElement('button');
      button.type = 'button'; button.className = motion ? 'tile' : 'tile is-new'; button.dataset.tileId = cell.id;
      button.tabIndex = -1;
      // Personal rhythm, so the board never breathes in lock-step.
      button.style.setProperty('--ph', `${-((cell.id * 0.6180339) % 1 * 3.4).toFixed(2)}s`);
      if (motion) {
        button.style.setProperty('--c', c);
        button.style.setProperty('--r', r - spawnCount[c]);
        button.dataset.r = r - spawnCount[c];
      } else button.addEventListener('animationend', () => button.classList.remove('is-new'), { once: true });
      boardEl.append(button); tiles.set(cell.id, button);
    }
    const prevR = Number(button.dataset.r);
    if (motion && Number.isFinite(prevR) && r > prevR) drops.push([button, r - prevR, stagger ? c * 28 + (SIZE - 1 - r) * 10 : 0]);
    button.style.setProperty('--c', c);
    if (!(motion && r > prevR)) button.style.setProperty('--r', r);
    button.dataset.r = r; button.dataset.c = c; button.dataset.kind = cell.kind; button.dataset.evolution = cell.evolution || '';
    button.dataset.rank = String(cell.rank || 1);
    const appearance = `${cell.kind}|${cell.special || ''}|${cell.evolution || ''}|${cell.rank || 1}`;
    if (button.dataset.appearance !== appearance) {
      button.dataset.appearance = appearance;
      button.innerHTML = faceHTML(cell);
      button.classList.toggle('is-power', !!cell.special);
      button.classList.toggle('is-rainbow', cell.special === 'rainbow');
      button.classList.toggle('is-evolved', cell.special === 'evolved');
    }
      button.setAttribute('aria-label', `${artwork(cell)[0]}${cell.special === 'evolved' ? ', ' + (cell.rank === 3 ? 'Super ' : cell.rank === 2 ? 'Enhanced ' : '') + ABILITY_NAMES[cell.evolution] + ' power' : cell.special ? ', ' + cell.special + ' power' : ''}, row ${r + 1}, column ${c + 1}`);
    button.classList.toggle('chosen', !!selected && selected[0] === r && selected[1] === c);
  }));
  for (const [id, node] of tiles) if (!used.has(id)) { node.remove(); tiles.delete(id); }
  if (!drops.length) return 0;
  // Spawned tiles were placed above the board; one reflow commits that start
  // position, then the new --r values transition down with gravity easing.
  for (const [button, rows, wait] of drops) {
    button.style.setProperty('--fall-ms', life.fallMs(rows) + 'ms');
    button.style.setProperty('--fall-delay', wait + 'ms');
    button.classList.add('mm-dropping');
  }
  void boardEl.offsetHeight;
  let longest = 0;
  for (const [button, rows, wait] of drops) {
    button.style.setProperty('--r', button.dataset.r);
    longest = Math.max(longest, life.startFall(button, rows, wait));
  }
  return longest;
}
function clearHints() { clearTimeout(hintTimeout); boardEl.querySelectorAll('.hinted').forEach(node => node.classList.remove('hinted')); }
function clearSelection() { selected = null; boardEl.querySelectorAll('.chosen').forEach(node => node.classList.remove('chosen')); }
function clearPowerPreview() {
  clearTimeout(previewTimeout);
  boardEl.querySelectorAll('.power-preview').forEach(node => { node.classList.remove('power-preview'); delete node.dataset.preview; });
}
function showPowerPreview(from, to = null) {
  clearPowerPreview();
  if (busy) return null;
  const effect = previewPower(game.board, from, to);
  if (!effect) return null;
  for (const [r, c] of effect.cells) {
    const node = boardEl.querySelector(`.tile[data-r="${r}"][data-c="${c}"]`);
    if (node) { node.classList.add('power-preview'); node.dataset.preview = effect.evolution || 'mega'; }
  }
  previewTimeout = setTimeout(clearPowerPreview, 1800);
  return effect;
}
function highlight(cells, className) {
  for (const [r, c] of cells) {
    const node = boardEl.querySelector(`.tile[data-r="${r}"][data-c="${c}"]`);
    node?.classList.add(className);
  }
}
function popup(text, cell = [3, 3], { size = 1, chain = 1 } = {}) {
  const label = document.createElement('span');
  label.className = 'floating-score'; label.textContent = text;
  label.dataset.size = String(size); label.dataset.chain = String(Math.min(chain, 4));
  label.style.left = `${(cell[1] + .5) * 100 / SIZE}%`;
  label.style.top = `${(cell[0] + .5) * 100 / SIZE}%`;
  boardEl.append(label);
  setTimeout(() => label.remove(), 980);
}
function setBusy(value) {
  busy = value;
  boardEl.classList.toggle('busy', busy);
  for (const id of ['hint-btn', 'shuffle-btn', 'new-btn']) el(id).disabled = busy;
  document.querySelectorAll('.mode-tab').forEach(btn => btn.disabled = busy);
  document.querySelectorAll('.mode-tab').forEach(btn => btn.disabled = busy);
}
function showBlast(effect) {
  for (const [r, c] of effect.cells || []) {
    const tile = boardEl.querySelector(`.tile[data-r="${r}"][data-c="${c}"]`);
    if (tile) {
      tile.classList.add('power-hit');
      tile.dataset.hit = effect.evolution || 'mega';
    }
  }
  const fx = document.createElement('div');
  fx.className = `blast-fx ${effect.type === 'mega' ? 'is-mega' : 'is-' + effect.evolution}`;
  fx.dataset.rank = String(effect.rank || 1);
  fx.setAttribute('aria-hidden', 'true');
  const centerX = (effect.c + .5) * 100 / SIZE;
  const centerY = (effect.r + .5) * 100 / SIZE;
  fx.style.left = `${centerX}%`;
  fx.style.top = `${centerY}%`;
  fx.style.setProperty('--power-row', `${(effect.r + .5) * 100 / SIZE}%`);
  fx.style.setProperty('--power-col', `${(effect.c + .5) * 100 / SIZE}%`);
  // Draw only cells returned by the resolver, including rank and edge clipping.
  fx.style.left = '0'; fx.style.top = '0';
  fx.style.width = '100%'; fx.style.height = '100%';
  fx.classList.add('exact-footprint');
  for (const [r, c] of effect.cells || []) {
    const hit = document.createElement('span');
    hit.className = 'blast-cell';
    hit.style.setProperty('--travel', `${Math.min(420, Math.hypot(r - effect.r, c - effect.c) * 55)}ms`);
    hit.style.left = `${c * 100 / SIZE}%`;
    hit.style.top = `${r * 100 / SIZE}%`;
    fx.append(hit);
  }
  boardEl.append(fx);
  fx.addEventListener('animationend', event => { if (event.target === fx) fx.remove(); });
  setTimeout(() => fx.remove(), 1500);
}

function showEvolution(created) {
  for (const item of created) {
    if (item.special !== 'evolved') continue;
    const tile = boardEl.querySelector(`.tile[data-r="${item.r}"][data-c="${item.c}"]`);
    tile?.classList.add('evolve-born');
    life.evolveRays(boardEl, item);
    if (item.rank >= 2) life.flash(boardEl, item.rank === 3 ? '#fff0a0' : '#d6f6ff');
    setTimeout(() => tile?.classList.remove('evolve-born'), 950);
    tone(item.rank === 3 ? 1000 : item.rank === 2 ? 870 : 720, .18);
  }
}
async function playMove(from, to) {
  if (busy || !adjacent(from, to)) return;
  setBusy(true); clearHints(); clearSelection(); clearPowerPreview(); faces.clearSelectReact(boardEl);
  const result = makeMove(game.board, from, to);
  if (!result.valid) {
    if (result.swapped) { render(result.swapped); life.swapHop(boardEl, to, from, false); await delay(190); render(game.board); }
    showMessage('Try to match at least 3 monsters!');
    setBusy(false); return;
  }
  // Save the complete move immediately: leaving during an animation never loses progress.
  const beforeRun = run;
  game.board = result.board; game.moves++;
  if (mode === 'adventure' && beforeRun) run = applyLevelMove(getLevel(beforeRun.level), beforeRun, result);
  game.matches += result.stages.reduce((count, step) => count + step.removed, 0);
  game.score += result.score; game.best = Math.max(game.best, game.score);
  store(); updateHud();
  render(result.swapped); life.swapHop(boardEl, to, from, true); tone(330, .07);
  await delay(200);
  for (const stage of result.stages) {
    // Monsters visibly cast their own element BEFORE disappearing. Cascades
    // cast as well; special blasts keep their existing distinct effects.
    const cast = castElementalMatches(boardEl, stage.matches, stage.chain);
    if (cast) {
      life.castPose(boardEl, stage.matches);
      const g = stage.matches[0].cells, gr = g.reduce((t, [r]) => t + r, 0) / g.length, gc = g.reduce((t, [, c]) => t + c, 0) / g.length;
      faces.lookAt(boardEl, gr, gc, 1500, 3.6);
      if (cast.tier >= 7) life.shake(frameEl, 1);
      tone(260 + cast.kind * 72 + (cast.tier - 3) * 54 + Math.min(stage.chain, 4) * 24, .075);
      if (!cast.reducedMotion) await delay(cast.holdMs);
    }
    const gathering = life.gatherEvolution(boardEl, stage.matches, stage.created);
    if (gathering) await delay(gathering);
    clearElementalCharge(boardEl);
    highlight(stage.clear, 'clearing');
    const mega = stage.effects.some(effect => effect.type === 'mega');
    const powers = stage.effects.filter(effect => effect.type === 'evolved');
    const blast = powers.length > 0;
    const evolution = stage.created.some(item => item.special === 'evolved');
    // Only a genuine cascade shows its multiplier; powers rely on their visual effects.
    if (stage.chain > 1) {
      el('chain-badge').textContent = `CHAIN x${stage.chain}!`;
      el('chain-badge').classList.add('combo-live');
    }
    for (const [r,c] of stage.clear) {
      const tile = boardEl.querySelector(`.tile[data-r="${r}"][data-c="${c}"]`);
      const special = tile?.dataset.appearance?.split('|')[1];
      if (special === 'row' || special === 'col') showBlast({ type: 'line', evolution: special, r, c,
        cells: Array.from({length: SIZE}, (_, i) => special === 'row' ? [r,i] : [i,c]) });
    }
    for (const effect of stage.effects) showBlast(effect);
    if (mega) { life.shake(frameEl, 3); life.flash(boardEl, '#fff3c4'); }
    else if (powers.some(p => p.rank === 3)) life.shake(frameEl, 1);
    // Keep feedback on the ACTUAL matched area. The middle of stage.clear
    // could belong to an unrelated simultaneous cascade or a wide power blast.
    const mainMatch = stage.matches.find(group => group.tier === 5) || stage.matches[0];
    const center = mainMatch?.cells[Math.floor(mainMatch.cells.length / 2)] || stage.effects[0]?.cells?.[0] || stage.clear[0] || [3, 3];
    popup(`+${stage.points.toLocaleString()}`, center, {
      size: mega || powers.some(p => p.rank === 3) ? 3 : blast || (mainMatch?.tier || 3) >= 5 || stage.chain >= 3 ? 2 : 1,
      chain: stage.chain
    });
    if (!cast) tone(400 + stage.chain * 95, .12);
    // Allow the whole elemental attack to be seen before tiles disappear.
    // Evolved abilities also get their own longer, visible impact window.
    await delay(boardEl.querySelector('.blast-fx') ? (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 165 : mega ? 1200 : 1070) : cast ? 165 : 230);
    life.poof(boardEl, stage.clear);
    render(stage.afterClear);
    if (blast || mega) { life.shock(boardEl, stage.clear); faces.react(boardEl, neighbours(stage.clear), 'face-wow', 700); }
    showEvolution(stage.created);
    await delay(evolution ? (stage.created.some(t => t.rank === 3) ? 620 : stage.created.some(t => t.rank === 2) ? 500 : 390) : 85);
    const landing = render(stage.afterFall, { stagger: true });
    // Wait for the falling monsters to (nearly) land so chains read clearly.
    await delay(Math.max(stage.chain > 2 ? 125 : 190, landing));
  }
  const newEvolution = result.stages.flatMap(stage => stage.created).find(item => item.special === 'evolved');
  const megaBlast = result.stages.some(stage => stage.effects.some(effect => effect.type === 'mega'));
  const powerBlast = result.stages.some(stage => stage.effects.some(effect => effect.type === 'evolved'));
  if (result.reshuffled) { render(game.board); showMessage('Fresh board! No more available moves.'); }
  else if (newEvolution) showMessage('Evolved monster ready! Swap it to use its power.', 2600);
  else if (megaBlast || powerBlast) showMessage('Nice combo! Keep going.');
  else if (result.chains > 1) showMessage(`CHAIN x${result.chains}! Extra monsters matched automatically.`);
  else showMessage('Nice match! Keep going.');
  el('chain-badge').classList.remove('combo-live');
  el('chain-badge').textContent = 'NO MOVE LIMIT';
  if (mode === 'adventure' && run) {
    const level = getLevel(run.level);
    if (isLevelWon(level, run)) {
      adventure = recordVictory(adventure, level, game.score, game.moves);
      const earned = starsFor(level, game.moves);
      adventure.active = null; run = null; saveAdventure();
      document.getElementById('adventure-result-title').textContent = 'Level ' + level.id + ' Complete!';
      document.getElementById('adventure-result-details').textContent = '⭐'.repeat(earned) + ' · ' + game.score.toLocaleString() + ' points · ' + Math.max(0,level.moves-game.moves) + ' moves left';
      document.getElementById('result-retry').textContent = level.id === 100 ? 'Island Map' : 'Next Level';
      document.getElementById('result-retry').dataset.next = String(Math.min(100,level.id+1));
      document.getElementById('adventure-result').hidden = false;
    } else if (game.moves >= level.moves) {
      adventure.active = null; run = null; saveAdventure();
      document.getElementById('adventure-result-title').textContent = 'Out of Moves!';
      document.getElementById('adventure-result-details').textContent = 'Almost there! Try a different combo.';
      document.getElementById('result-retry').textContent = 'Retry Level';
      document.getElementById('result-retry').dataset.next = String(level.id);
      document.getElementById('adventure-result').hidden = false;
    } else updateAdventureObjectives();
  }
  setBusy(false);
}

boardEl.addEventListener('pointerdown', event => {
  if (busy || event.button > 0) return;
  const tile = event.target.closest('.tile');
  if (!tile) return;
  touchStart = { id: event.pointerId, r: Number(tile.dataset.r), c: Number(tile.dataset.c), x: event.clientX, y: event.clientY, previewTo: '' };
  const cell = game.board[touchStart.r][touchStart.c];
  if (cell.special === 'evolved') showPowerPreview([touchStart.r, touchStart.c]);
  try { boardEl.setPointerCapture(event.pointerId); } catch {}
});
boardEl.addEventListener('pointermove', event => {
  if (!touchStart || touchStart.id !== event.pointerId || busy) return;
  const start = touchStart;
  const dx = event.clientX - start.x, dy = event.clientY - start.y;
  const leaning = boardEl.querySelector(`.tile[data-r="${start.r}"][data-c="${start.c}"]`);
  leaning?.style.setProperty('--drag-lean', `${Math.max(-9, Math.min(9, dx / 5))}deg`);

  const threshold = Math.max(12, boardEl.clientWidth / SIZE * .25);
  if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
  const to = Math.abs(dx) > Math.abs(dy) ? [start.r, start.c + Math.sign(dx)] : [start.r + Math.sign(dy), start.c];
  if (!adjacent([start.r, start.c], to) || start.previewTo === to.join(',')) return;
  start.previewTo = to.join(',');
  showPowerPreview([start.r, start.c], to);
});
boardEl.addEventListener('pointerup', event => {
  boardEl.querySelectorAll('.tile').forEach(t => t.style.removeProperty('--drag-lean'));
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
    if (selected) {
      faces.lookAt(boardEl, selected[0], selected[1], 1600);
      const active = game.board[selected[0]][selected[1]];
      if (active.special === 'evolved') {
        const fx = showPowerPreview(selected);
        faces.selectReact(boardEl, selected[0], selected[1], active, fx?.cells || []);
        showMessage('Swap this monster with a neighbour to use its power.', 2500);
      } else { clearPowerPreview(); faces.selectReact(boardEl, selected[0], selected[1], active); }
    } else { clearPowerPreview(); faces.clearSelectReact(boardEl); }
  }
});
boardEl.addEventListener('pointercancel', () => { touchStart = null; clearPowerPreview(); boardEl.querySelectorAll('.tile').forEach(t => t.style.removeProperty('--drag-lean')); });
let keyboardCell = [3, 3];
boardEl.addEventListener('keydown', event => {
  if (busy) return;
  const directions = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
  const d = directions[event.key];
  if (d) {
    event.preventDefault();
    keyboardCell = [Math.max(0, Math.min(7, keyboardCell[0] + d[0])), Math.max(0, Math.min(7, keyboardCell[1] + d[1]))];
    boardEl.querySelector(`.tile[data-r="${keyboardCell[0]}"][data-c="${keyboardCell[1]}"]`)?.focus();
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    const node = event.target.closest('.tile');
    if (node) keyboardCell = [Number(node.dataset.r), Number(node.dataset.c)];
    if (selected && adjacent(selected, keyboardCell)) playMove(selected, keyboardCell);
    else { selected = [...keyboardCell]; render(game.board); const fx = showPowerPreview(selected); faces.selectReact(boardEl, selected[0], selected[1], game.board[selected[0]][selected[1]], fx?.cells || []); }
  }
});
el('hint-btn').addEventListener('click', () => {
  if (busy) return;
  clearHints(); clearSelection(); clearPowerPreview();
  const pair = findHint(game.board);
  if (pair) { highlight(pair, 'hinted'); hintTimeout = setTimeout(clearHints, 2300); showMessage('Try swapping these glowing monsters!', 2300); }
});
el('shuffle-btn').addEventListener('click', () => {
  if (busy) return;
  clearHints(); clearSelection();
  if (mode === 'adventure') { showMessage('Shuffle is available in Classic mode.'); return; }
  clearPowerPreview(); game.board = shuffleBoard(game.board); store(); render(game.board); life.shuffleDance(boardEl); tone(540, .09);
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
el('new-btn').addEventListener('click', () => { if (busy) return; if (mode === 'adventure') { openAdventureMap(); return; } modal('reset-modal', true); });
el('cancel-reset').addEventListener('click', () => modal('reset-modal', false));
el('confirm-reset').addEventListener('click', () => {
  clearHints(); clearSelection(); clearPowerPreview();
  game = { board: createBoard(), score: 0, best: game.best, matches: 0, moves: 0 };
  for (const node of tiles.values()) node.remove(); tiles.clear();
  store(); introDrop(); updateHud(); modal('reset-modal', false); showMessage('New game! Make your first match.');
});
for (const id of ['help-modal', 'reset-modal']) el(id).addEventListener('pointerdown', e => { if (e.target === el(id)) modal(id, false); });
addEventListener('keydown', event => { if (event.key === 'Escape') { modal('help-modal', false); modal('reset-modal', false); } });
addEventListener('pagehide', store);
function resetTiles() { clearHints(); clearSelection(); clearPowerPreview(); for (const node of tiles.values()) node.remove(); tiles.clear(); }
function enterClassic() {
  if (busy) return;
  if (mode === 'adventure') { store(); game = classicGame || game; }
  mode = 'classic'; run = null; classicGame = null;
  document.querySelector('.game-shell').classList.remove('map-open','adventure-active');
  el('adventure-map').hidden = true; el('adventure-objectives').hidden = true;
  el('mode-classic').classList.add('active'); el('mode-adventure').classList.remove('active');
  document.querySelector('.mode-pill').textContent = '∞ CLASSIC ENDLESS';
  el('chain-badge').textContent = 'NO MOVE LIMIT';
  resetTiles(); introDrop(); updateHud();
}
function openAdventureMap() {
  if (busy) return;
  if (mode === 'classic') { classicGame = classicSnapshot(); }
  else store();
  mode = 'adventure';
  document.querySelector('.game-shell').classList.add('map-open','adventure-active');
  el('adventure-map').hidden = false; el('adventure-objectives').hidden = true;
  el('mode-classic').classList.remove('active'); el('mode-adventure').classList.add('active');
  renderAdventureMap();
}
function renderAdventureMap() {
  el('island-list').replaceChildren();
  ISLANDS.forEach((island, index) => {
    const start = index * 10 + 1;
    const panel = document.createElement('section'); panel.className = 'island-panel' + (start > adventure.unlocked ? ' locked' : '');
    const heading = document.createElement('div'); heading.className = 'island-heading';
    const picture = document.createElement('img'); picture.src = './assets/monsters/' + island.image; picture.alt = '';
    const copy = document.createElement('div'); const name = document.createElement('strong'); name.textContent = 'Island ' + (index+1) + ' · ' + island.name;
    const info = document.createElement('small'); info.textContent = '⭐ ' + LEVELS.slice(index*10,index*10+10).reduce((n,l)=>n+(adventure.stars[l.id]||0),0) + '/30 · ' + (start > adventure.unlocked ? 'Locked' : 'Explore');
    copy.append(name,info); heading.append(picture,copy); panel.append(heading);
    const grid = document.createElement('div'); grid.className = 'level-grid';
    for (let id = start; id < start+10; id++) {
      const button = document.createElement('button'); button.type = 'button';
      button.className = 'level-button' + (id % 10 === 0 ? ' boss' : '') + (id === adventure.unlocked ? ' current' : '');
      button.disabled = id > adventure.unlocked; button.textContent = id > adventure.unlocked ? '🔒' : String(id);
      const stars = document.createElement('span'); stars.className = 'stars'; stars.textContent = '★'.repeat(adventure.stars[id]||0) + '☆'.repeat(3-(adventure.stars[id]||0));
      button.append(stars); button.addEventListener('click', () => startAdventureLevel(id)); grid.append(button);
    }
    panel.append(grid); el('island-list').append(panel);
  });
}
function startAdventureLevel(id) {
  if (id > adventure.unlocked || busy) return;
  const active = adventure.active;
  const valid = active?.level === id && isValidBoard(active.game?.board) && Number.isInteger(active.game?.moves) &&
    active.game.moves >= 0 && active.game.moves < getLevel(id).moves && Array.isArray(active.counts) && active.counts.length === 6 && Array.isArray(active.frozen);
  run = valid ? active : beginLevel(id, createBoard());
  game = { ...run.game, board: cloneBoard(run.game.board) };
  mode = 'adventure'; adventure.active = run;
  document.querySelector('.game-shell').classList.remove('map-open');
  el('adventure-map').hidden = true; el('adventure-objectives').hidden = false;
  document.querySelector('.mode-pill').textContent = getLevel(id).boss ? '👑 BOSS · LEVEL ' + id : '🏝 LEVEL ' + id;
  el('chain-badge').textContent = 'MOVES LIMITED';
  resetTiles(); store(); updateAdventureObjectives(); introDrop(); updateHud();
}
function updateAdventureObjectives() {
  if (!run) return;
  const level = getLevel(run.level), area = el('adventure-objectives'); area.replaceChildren();
  const title = document.createElement('strong'); title.textContent = 'Level ' + level.id + ' · ' + (level.boss ? 'Guardian Battle' : 'Goals');
  area.append(title);
  const goals = level.boss ? [{ text: '👑 HP ' + Math.max(0,level.bossHp-run.bossDamage) + '/' + level.bossHp, done: run.bossDamage >= level.bossHp }] :
    level.goals.map(goal => ({ text: BASE_MONSTERS[goal.kind][0] + ' ' + Math.min(goal.count,run.counts[goal.kind]) + '/' + goal.count, sprite: BASE_MONSTERS[goal.kind][1], done: run.counts[goal.kind] >= goal.count }));
  if (level.seals) goals.push({ text: '❄ Wards ' + run.frozen.length + '/' + level.seals, done: !run.frozen.length });
  goals.push({ text: 'Moves ' + Math.max(0,level.moves-game.moves), done: false });
  for (const goal of goals) {
    const item = document.createElement('span'); item.className = 'goal' + (goal.done ? ' done' : '');
    if (goal.sprite) { const img = document.createElement('img'); img.src = goal.sprite; img.alt = ''; item.append(img); }
    const label = document.createElement('span'); label.textContent = goal.text; item.append(label); area.append(item);
  }
}
el('mode-classic').addEventListener('click', enterClassic);
el('mode-adventure').addEventListener('click', openAdventureMap);
el('result-map').addEventListener('click', () => { el('adventure-result').hidden = true; openAdventureMap(); });
el('result-retry').addEventListener('click', event => {
  el('adventure-result').hidden = true;
  if (Number(event.currentTarget.dataset.next) === 100 && adventure.stars[100]) openAdventureMap();
  else startAdventureLevel(Number(event.currentTarget.dataset.next));
});

function neighbours(cells) {
  const hit = new Set(cells.map(([r, c]) => r * SIZE + c)), out = [];
  for (const [r, c] of cells) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nr = r + dr, nc = c + dc, k = nr * SIZE + nc;
    if (nr >= 0 && nc >= 0 && nr < SIZE && nc < SIZE && !hit.has(k)) { hit.add(k); out.push([nr, nc]); }
  }
  return out;
}
// Swap the plain sprites for living faces once their artwork has loaded,
// in place, so it never disturbs a move that is animating.
faces.preload().then(() => {
  for (const button of tiles.values()) {
    const r = Number(button.dataset.r), c = Number(button.dataset.c), cell = game.board[r]?.[c];
    const sprite = button.querySelector('.sprite');
    if (!sprite || !cell || String(cell.id) !== button.dataset.tileId) { button.dataset.appearance = ''; continue; }
    const [name, url] = artwork(cell);
    sprite.innerHTML = faces.spriteHTML(name.toLowerCase(), url);
  }
}).catch(() => {});
faces.start(boardEl, () => busy);
// Monsters tumble onto the board; input waits until they have landed.
function introDrop() {
  const landing = render(game.board, { stagger: true });
  if (!landing) return;
  setBusy(true);
  setTimeout(() => setBusy(false), landing + 60);
}
introDrop(); updateHud();
life.startAmbient(boardEl, () => busy || !!touchStart);
// Small, read-only test hook for browser regression checks.
window.__monsterMatch = { state: () => ({ score: game.score, best: game.best, matches: game.matches, moves: game.moves, busy }), board: () => cloneBoard(game.board) };
