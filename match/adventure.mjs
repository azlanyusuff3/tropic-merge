// Adventure mode uses the existing Monster Match 8x8 engine and original sprite IDs.
// Pure functions are shared with browser code and deterministic Node regression tests.
export const TOTAL_LEVELS = 100;
export const ISLANDS = Object.freeze([
  { name: 'Sunlit Shores', theme: 'beach', guardian: 'Slimelet', image: '01-slimelet.webp' },
  { name: 'Bamboo Bluffs', theme: 'jungle', guardian: 'Groveling', image: '08-groveling.webp' },
  { name: 'Coral Coves', theme: 'coral', guardian: 'Tidalon', image: '09-tidalon.webp' },
  { name: 'Skywind Peaks', theme: 'sky', guardian: 'Puffling', image: '03-puffling.webp' },
  { name: 'Razor Reef', theme: 'reef', guardian: 'Rockro', image: '05-rockro.webp' },
  { name: 'Ancient Stonewilds', theme: 'ancient', guardian: 'Infernodon', image: '11-infernodon.webp' },
  { name: 'Ironwreck Harbor', theme: 'harbor', guardian: 'Bubblo', image: '02-bubblo.webp' },
  { name: 'Shadowmist Isle', theme: 'shadow', guardian: 'Shadebub', image: '07-shadebub.webp' },
  { name: 'Abyssal Depths', theme: 'abyss', guardian: 'Frostbop', image: '06-frostbop.webp' },
  { name: 'Emberfall Caldera', theme: 'volcano', guardian: 'Lumiorb', image: '10-lumiorb.webp' }
]);
export const BASE_MONSTERS = Object.freeze([
  ['Slimelet', './assets/monsters/01-slimelet.webp'],
  ['Tidalon', './match/assets/tidalon-match.webp'],
  ['Puffling', './assets/monsters/03-puffling.webp'],
  ['Sproutiball', './assets/monsters/04-sproutiball.webp'],
  ['Rockro', './assets/monsters/05-rockro.webp'],
  ['Frostbop', './match/assets/frostbop-match.webp']
]);
export const EVOLVED_MONSTERS = Object.freeze([
  ['Groveling', './assets/monsters/08-groveling.webp'],
  ['Bubblo', './assets/monsters/02-bubblo.webp'],
  ['Shadebub', './assets/monsters/07-shadebub.webp'],
  ['Lumiorb', './assets/monsters/10-lumiorb.webp'],
  ['Infernodon', './assets/monsters/11-infernodon.webp']
]);
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Math.floor(Number(value)) : min));
const random = seed => {
  let n = seed >>> 0;
  return () => {
    n = (n + 0x6d2b79f5) | 0;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
export function sealPositions(level) {
  const count = level.seals || 0;
  if (!count) return [];
  const rng = random(level.id * 619 + 81);
  const positions = [];
  for (let r = 1; r < 7; r++) for (let c = 1; c < 7; c++) positions.push(r * 8 + c);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  return positions.slice(0, count).sort((a, b) => a - b);
}
export function getLevel(id) {
  const n = clamp(id, 1, TOTAL_LEVELS);
  const island = Math.floor((n - 1) / 10);
  const chapter = island + 1;
  const within = (n - 1) % 10 + 1;
  const boss = within === 10;
  const moves = boss ? 28 + Math.floor(island / 2) : 23 + Math.floor(island / 2) + (within > 6 ? 2 : 0);
  const kinds = n < 4 ? [((n + 4) * 3) % 6] : [(n + island) % 6, (n + island + 3) % 6];
  const goals = boss ? [] : kinds.map((kind, index) => ({
    kind,
    count: (n < 4 ? 9 : 7 + Math.floor(island / 2) + (within % 4)) + (index ? 1 : 0)
  }));
  const seals = !boss && n >= 21 && (within % 3 !== 0) ? Math.min(7, 3 + Math.floor(island / 2)) : 0;
  return Object.freeze({
    id: n, island, chapter, within, boss, moves, goals, seals,
    bossHp: boss ? 78 + island * 7 : 0,
    title: boss ? ISLANDS[island].guardian + ' Guardian' : 'Level ' + n
  });
}
export const LEVELS = Object.freeze(Array.from({ length: TOTAL_LEVELS }, (_, i) => getLevel(i + 1)));
export function freshProgress() {
  return { version: 2, unlocked: 1, stars: {}, bestScores: {}, active: null };
}
// User-owned Classic saves are never read from, or written to, this structure.
export function readProgress(raw) {
  const next = freshProgress();
  if (!raw || raw.version !== 2 || typeof raw !== 'object') return next;
  next.unlocked = clamp(raw.unlocked, 1, TOTAL_LEVELS);
  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    if (i < next.unlocked || i === TOTAL_LEVELS) {
      const star = clamp(raw.stars?.[i], 0, 3);
      if (star) next.stars[i] = star;
    }
    const best = clamp(raw.bestScores?.[i], 0, 999999999);
    if (best) next.bestScores[i] = best;
  }
  if (raw.active && Number.isInteger(raw.active.level) && raw.active.level >= 1 &&
      raw.active.level <= next.unlocked && raw.active.level <= TOTAL_LEVELS) next.active = raw.active;
  return next;
}
export function beginLevel(id, board) {
  const level = getLevel(id);
  return {
    level: level.id,
    game: { board, score: 0, best: 0, matches: 0, moves: 0 },
    counts: Array(6).fill(0),
    frozen: sealPositions(level),
    bossDamage: 0,
    status: 'playing'
  };
}
// Count actual disappeared tiles, not raw run lengths. Powered tiles and chains
// count once; upgraded anchor tiles are not incorrectly counted as removed.
export function applyLevelMove(level, run, result) {
  const counts = Array.from({ length: 6 }, (_, i) => clamp(run.counts?.[i], 0, 999999));
  const frozen = new Set(run.frozen || []);
  let bossDamage = clamp(run.bossDamage, 0, 999999);
  let before = result.swapped;
  for (const stage of result.stages || []) {
    for (const [r, c] of stage.clear) {
      const tile = before?.[r]?.[c];
      if (tile && Number.isInteger(tile.kind) && tile.kind >= 0 && tile.kind < 6) counts[tile.kind]++;
      const key = r * 8 + c;
      // Frost wards attach to squares; clearing on or next to a ward melts it.
      for (const ward of frozen) {
        if (Math.abs(Math.floor(ward / 8) - r) + Math.abs(ward % 8 - c) <= 1) frozen.delete(ward);
      }
      if (level.boss) bossDamage++;
    }
    if (level.boss) {
      bossDamage += (stage.effects || []).filter(effect => effect.type === 'evolved').length * 9;
      bossDamage += (stage.effects || []).filter(effect => effect.type === 'mega').length * 18;
      bossDamage += (stage.created || []).filter(tile => tile.special === 'evolved').reduce((n, tile) => n + (tile.rank || 1) * 3, 0);
    }
    before = stage.afterFall;
  }
  return { ...run, counts, frozen: [...frozen].sort((a, b) => a - b), bossDamage };
}
export function isLevelWon(level, run) {
  return level.goals.every(goal => (run.counts?.[goal.kind] || 0) >= goal.count) &&
    (!level.seals || !run.frozen?.length) &&
    (!level.boss || (run.bossDamage || 0) >= level.bossHp);
}
export function starsFor(level, movesUsed) {
  const left = Math.max(0, level.moves - movesUsed);
  return left >= Math.ceil(level.moves * .3) ? 3 : left >= Math.ceil(level.moves * .12) ? 2 : 1;
}
export function recordVictory(progress, level, score, movesUsed) {
  const stars = starsFor(level, movesUsed);
  return {
    ...progress,
    unlocked: Math.max(progress.unlocked, Math.min(TOTAL_LEVELS, level.id + 1)),
    stars: { ...progress.stars, [level.id]: Math.max(progress.stars?.[level.id] || 0, stars) },
    bestScores: { ...progress.bestScores, [level.id]: Math.max(progress.bestScores?.[level.id] || 0, score) }
  };
}
export function totalStars(progress) {
  return Object.values(progress.stars || {}).reduce((n, x) => n + clamp(x, 0, 3), 0);
}
