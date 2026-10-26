// Visual-only elemental casting for all normal matches (3, 4 and 5+).
// Nothing here changes score, cleared tiles, power behavior or saved progress.
export const ELEMENTS = Object.freeze([
  Object.freeze({ key: 'slime', title: 'SLIME SPLASH', tint: '#a0fa78' }),
  Object.freeze({ key: 'water', title: 'WATER SPLASH', tint: '#77e8ff' }),
  Object.freeze({ key: 'puff',  title: 'PUFF BURST', tint: '#ffc2ee' }),
  Object.freeze({ key: 'leaf',  title: 'LEAF STORM', tint: '#b2f68a' }),
  Object.freeze({ key: 'rock',  title: 'ROCK SMASH', tint: '#ffd58c' }),
  Object.freeze({ key: 'ice',   title: 'ICE SHATTER', tint: '#bbf5ff' })
]);
const SIZE = 8;
const MAX_GROUP_FX = 4;

export function clearElementalCharge(board) {
  for (const node of board.querySelectorAll('.element-charged')) {
    node.classList.remove('element-charged');
    node.style.removeProperty('--cast-duration');
    delete node.dataset.element;
  }
}

export function castElementalMatches(board, matches = [], chain = 1) {
  if (!matches.length) return null;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  const width = board.clientWidth;
  const cellSize = width / SIZE;
  const first = matches[0];
  const strongestTier = Math.max(...matches.map(group => group.tier));
  // Primary animation stays visible for more than a second; later cascades
  // remain snappier to avoid forcing long waits during multi-chain clears.
  const duration = prefersReducedMotion ? 140 : chain > 2 ? 820 :
    strongestTier >= 7 ? 1630 : strongestTier === 6 ? 1510 :
    strongestTier >= 5 ? 1420 : strongestTier === 4 ? 1280 : 1180;
  const holdMs = prefersReducedMotion ? 50 : Math.max(550, duration - 175);
  const primary = ELEMENTS[first.kind];
  if (!primary) return null;
  // Energize all true matched tiles, not unrelated tiles hit by an evolved power.
  for (const group of matches) {
    const profile = ELEMENTS[group.kind];
    if (!profile) continue;
    for (const [r, c] of group.cells) {
      const node = board.querySelector(`.tile[data-r="${r}"][data-c="${c}"]`);
      if (!node) continue;
      node.classList.add('element-charged');
      node.dataset.element = profile.key;
      node.style.setProperty('--cast-duration', duration + 'ms');
    }
  }

  // Caps keep cascades light even when many groups resolve simultaneously.
  const maxGroups = width < 310 ? 3 : MAX_GROUP_FX;
  matches.slice(0, maxGroups).forEach((group, groupIndex) => {
    const profile = ELEMENTS[group.kind];
    if (!profile || !group.cells.length) return;
    const host = document.createElement('span');
    host.className = 'elemental-cast';
    host.dataset.element = profile.key;
    host.dataset.tier = String(group.tier);
    host.dataset.chain = String(Math.min(chain, 5));
    host.setAttribute('aria-hidden', 'true');
    const row = group.cells.reduce((sum, [r]) => sum + r + .5, 0) / group.cells.length;
    const col = group.cells.reduce((sum, [, c]) => sum + c + .5, 0) / group.cells.length;
    host.style.left = `${col * 100 / SIZE}%`;
    host.style.top = `${row * 100 / SIZE}%`;
    host.style.setProperty('--fx-radius', `${Math.round(cellSize * (group.tier >= 5 ? 1.75 : group.tier === 4 ? 1.44 : 1.2))}px`);
    host.style.setProperty('--fx-tint', profile.tint);
    host.style.setProperty('--cast-duration', duration + 'ms');

    const ring = document.createElement('span');
    ring.className = 'elemental-ring';
    host.append(ring);
    const core = document.createElement('span');
    core.className = 'elemental-core';
    host.append(core);
    // An elemental streak connects the actual matching monsters, so their
    // attack visibly travels through the matched line, not unrelated tiles.
    const lines = new Map();
    for (const [r, c] of group.cells) {
      for (const [axis, index, value] of [['row', r, c], ['col', c, r]]) {
        const key = axis + index;
        const values = lines.get(key) || { axis, index, values: [] };
        values.values.push(value);
        lines.set(key, values);
      }
    }
    if (!prefersReducedMotion) for (const line of lines.values()) {
      if (line.values.length < 3) continue;
      const low = Math.min(...line.values), high = Math.max(...line.values);
      const horizontal = line.axis === 'row';
      const beam = document.createElement('span');
      beam.className = 'elemental-beam';
      beam.dataset.axis = line.axis;
      beam.style.left = `${((horizontal ? (low + high + 1) / 2 : line.index + .5) - col) * cellSize}px`;
      beam.style.top = `${((horizontal ? line.index + .5 : (low + high + 1) / 2) - row) * cellSize}px`;
      beam.style.width = `${horizontal ? (high - low + 1) * cellSize : Math.max(8, cellSize * .21)}px`;
      beam.style.height = `${horizontal ? Math.max(8, cellSize * .21) : (high - low + 1) * cellSize}px`;
      host.append(beam);
    }
    const count = prefersReducedMotion ? 0 : Math.min(chain > 2 ? 6 : 7 + (group.tier - 3), 12);
    const distance = cellSize * (group.tier >= 7 ? 2.6 : group.tier >= 6 ? 2.3 : group.tier >= 5 ? 2.05 : group.tier === 4 ? 1.75 : 1.38);
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('i');
      particle.className = 'elemental-particle';
      const angle = (i * 2.399963 + group.kind * .47 + groupIndex * .36);
      const spread = (.58 + (i % 4) * .13) * distance;
      particle.style.setProperty('--dx', `${Math.round(Math.cos(angle) * spread)}px`);
      particle.style.setProperty('--dy', `${Math.round(Math.sin(angle) * spread)}px`);
      particle.style.setProperty('--turn', `${((i * 73) % 360) - 180}deg`);
      particle.style.setProperty('--delay', `${(i % 3) * 16}ms`);
      particle.style.setProperty('--particle-size', `${Math.max(5, Math.round(cellSize * (.12 + (i % 3) * .045)))}px`);
      host.append(particle);
    }
    // Visual attack only: no on-board text or floating effect names.
    board.append(host);
    const cleanup = () => host.remove();
    // animationend may not fire if a page is hidden or reduced motion is on.
    host.addEventListener('animationend', e => { if (e.target === host) cleanup(); });
    setTimeout(cleanup, prefersReducedMotion ? 165 : duration + 100);
  });
  return { kind: first.kind, tier: strongestTier, duration, holdMs, reducedMotion: prefersReducedMotion };
}
