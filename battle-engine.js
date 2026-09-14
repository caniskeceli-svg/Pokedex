// ---- Shared wild-battle engine (Phase 3) ----
// Used by the Adventure wild-encounter flow today; Gym and League battles
// (later phases) are meant to reuse the exact same functions rather than
// re-implement combat. Deliberately simplified: no held items, no status
// conditions, no accuracy/evasion - just HP, a couple of type-flavored
// moves, type effectiveness (reusing pokedex-data.js's TYPE_CHART), a
// crit chance, and STAB. Battles are tuned to end in roughly 1-5 turns.
//
// This file only depends on pokedex-data.js (for TYPE_CHART/typeMultiplier
// and TYPE_TR) and is safe to include anywhere pokedex-data.js is already
// loaded; it does not touch CLOUD_STATE or Firestore itself - callers own
// persisting the outcome.

// One simple "signature move" per type plus a universal Normal filler, so
// every Pokémon has 2-3 recognizable move buttons without needing to fetch
// or model real movesets.
const TYPE_SIGNATURE_MOVE = {
  normal: { name: "Hızlı Saldırı", power: 45 },
  fire: { name: "Alev Topu", power: 65 },
  water: { name: "Su Tabancası", power: 65 },
  electric: { name: "Şimşek", power: 65 },
  grass: { name: "Yaprak Bıçağı", power: 65 },
  ice: { name: "Buz Nefesi", power: 65 },
  fighting: { name: "Karate Darbesi", power: 65 },
  poison: { name: "Zehir Isırığı", power: 60 },
  ground: { name: "Toprak Darbesi", power: 65 },
  flying: { name: "Gaga Saldırısı", power: 60 },
  psychic: { name: "Ruh Dalgası", power: 65 },
  bug: { name: "Böcek Isırığı", power: 55 },
  rock: { name: "Kaya Fırlat", power: 65 },
  ghost: { name: "Gölge Darbesi", power: 65 },
  dragon: { name: "Ejderha Nefesi", power: 70 },
  dark: { name: "Karanlık Darbe", power: 65 },
  steel: { name: "Metal Pençe", power: 60 },
  fairy: { name: "Peri Rüzgarı", power: 60 }
};
const FILLER_MOVE = { name: "Tackle", type: "normal", power: 40 };

function buildMoveset(types) {
  const moves = (types || []).slice(0, 2).map(t => Object.assign({ type: t }, TYPE_SIGNATURE_MOVE[t] || FILLER_MOVE));
  if (!moves.some(m => m.type === "normal")) moves.push(FILLER_MOVE);
  // De-duplicate by move name (e.g. a pure Normal-type mon would otherwise see Tackle twice).
  const seen = new Set();
  return moves.filter(m => (seen.has(m.name) ? false : (seen.add(m.name), true)));
}

// Simple level-scaled stat, shared by HP/attack/defense - deliberately the
// same curve for all three so we don't need a full stat spread simulation.
function scaledStat(baseStat, level) {
  return Math.max(1, Math.round((baseStat || 50) * (level / 50 + 1)));
}

function computeBattleStats(baseStats, level) {
  const hp = scaledStat(baseStats.hp, level) + Math.round(level * 1.5);
  return {
    maxHp: hp,
    attack: scaledStat(baseStats.attack, level),
    defense: scaledStat(baseStats.defense, level)
  };
}

// Returns { damage, effectiveness, isCrit, isStab }. `effectiveness` is the
// raw type multiplier (0, 0.25, 0.5, 1, 2, 4) so the UI can show "Etkili!" etc.
function calcDamage({ move, attackerTypes, attackerStats, defenderTypes, defenderStats }) {
  const effectiveness = typeMultiplier(move.type, defenderTypes);
  if (effectiveness === 0) return { damage: 0, effectiveness, isCrit: false, isStab: false };
  const isStab = (attackerTypes || []).includes(move.type);
  const isCrit = Math.random() < 0.1;
  const randomFactor = 0.85 + Math.random() * 0.15;
  const base = ((2 * 20 / 5 + 2) * move.power * (attackerStats.attack / Math.max(1, defenderStats.defense))) / 50 + 2;
  const damage = Math.max(1, Math.round(base * effectiveness * (isStab ? 1.5 : 1) * (isCrit ? 1.5 : 1) * randomFactor));
  return { damage, effectiveness, isCrit, isStab };
}

// ---- Catch mechanics ----
const BALL_MULTIPLIER = { pokeball: 1, greatball: 1.5, ultraball: 2 };

// Classic-inspired but simplified: lower opponent HP fraction and better
// balls both raise the odds; a fixed rarity factor lets rarer species (by
// base total stats, a proxy we already have) resist capture a bit more.
function computeCatchChance({ hpFraction, ballType, rarityFactor }) {
  const ballMult = BALL_MULTIPLIER[ballType] ?? 1;
  const base = (1 - hpFraction) * 0.7 + 0.15; // 0.15 at full HP, 0.85 near 0 HP
  const chance = base * ballMult * (rarityFactor ?? 1);
  return Math.max(0.05, Math.min(0.95, chance));
}

// Legendary/Mythical (or just very high base-stat-total) Pokémon are harder
// to catch. `power` is the same base-stat-total already computed elsewhere
// in this app (mydex power field), so no new data source is needed.
function rarityFactorForPower(power) {
  if (power >= 600) return 0.4;
  if (power >= 450) return 0.7;
  return 1;
}

function attemptCatch({ hpFraction, ballType, rarityFactor }) {
  const chance = computeCatchChance({ hpFraction, ballType, rarityFactor });
  return Math.random() < chance;
}
