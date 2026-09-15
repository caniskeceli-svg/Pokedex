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

// Phase 11: base stats already carry every PokeAPI stat key (statMap in
// fetchPokemonSpeciesData/fetchWildSpecies loops over ALL of them), so
// spAttack/spDefense/speed need no new fetch - they were sitting unused in
// `baseStats["special-attack"]` etc. all along. maxHp/attack/defense keep
// their exact prior meaning and values - only new fields were added, so
// every existing caller (computeMonMaxHp, evolution HP-carry math, the old
// physical-only damage call shape) keeps working unmodified.
function computeBattleStats(baseStats, level) {
  const hp = scaledStat(baseStats.hp, level) + Math.round(level * 1.5);
  return {
    maxHp: hp,
    attack: scaledStat(baseStats.attack, level),
    defense: scaledStat(baseStats.defense, level),
    spAttack: scaledStat(baseStats["special-attack"], level),
    spDefense: scaledStat(baseStats["special-defense"], level),
    speed: scaledStat(baseStats.speed, level)
  };
}

// ---- Phase 11: RNG-injectable combat rules ----
// Every random roll in combat goes through one of these, each taking an
// optional `rng` (a zero-arg function returning [0,1), defaulting to
// Math.random) - tests inject a fake to get fully deterministic hits/
// misses/crits/turn order without touching the rules themselves.
function rollCrit(rng) {
  return (rng || Math.random)() < 0.1;
}
function rollDamageVariance(rng) {
  return 0.85 + (rng || Math.random)() * 0.15;
}
function rollAccuracy(move, rng) {
  const acc = move.accuracy == null ? 100 : move.accuracy;
  return (rng || Math.random)() < (acc / 100);
}
// Faster Pokemon acts first; equal speed ties broken by `rng` (defaults to
// a coin flip) rather than always favoring one side.
function decideTurnOrder(speedA, speedB, rng) {
  if (speedA > speedB) return "a";
  if (speedB > speedA) return "b";
  return (rng || Math.random)() < 0.5 ? "a" : "b";
}

// ---- Phase 12: status effects (burn/poison/paralysis only) ----
// Classic 25% "fully paralyzed" chance - rolled once per paralyzed
// Pokemon's turn, before it would otherwise act.
function rollParalysisPrevented(rng) {
  return (rng || Math.random)() < 0.25;
}
// Classic 1/8 max HP residual damage (rounded down, minimum 1) for both
// burn and poison - identical formula for both, matching the real games.
function residualStatusDamage(maxHp) {
  return Math.max(1, Math.floor(maxHp / 8));
}

// Returns { damage, effectiveness, isCrit, isStab }. `effectiveness` is the
// raw type multiplier (0, 0.25, 0.5, 1, 2, 4) so the UI can show "Etkili!" etc.
// Phase 11: branches on move.category - physical uses attack/defense exactly
// as before (so an old-shaped move with no category still resolves as
// physical, unchanged), special uses spAttack/spDefense, status/zero-power
// moves always deal 0 without rolling a crit (nothing to crit on).
function calcDamage({ move, attackerTypes, attackerStats, defenderTypes, defenderStats, rng }) {
  const effectiveness = typeMultiplier(move.type, defenderTypes);
  if (effectiveness === 0 || move.category === "status" || !move.power) {
    return { damage: 0, effectiveness, isCrit: false, isStab: false };
  }
  const isSpecial = move.category === "special";
  const atk = isSpecial ? (attackerStats.spAttack ?? attackerStats.attack) : attackerStats.attack;
  const def = isSpecial ? (defenderStats.spDefense ?? defenderStats.defense) : defenderStats.defense;
  const isStab = (attackerTypes || []).includes(move.type);
  const isCrit = rollCrit(rng);
  const randomFactor = rollDamageVariance(rng);
  const base = ((2 * 20 / 5 + 2) * move.power * (atk / Math.max(1, def))) / 50 + 2;
  const damage = Math.max(1, Math.round(base * effectiveness * (isStab ? 1.5 : 1) * (isCrit ? 1.5 : 1) * randomFactor));
  return { damage, effectiveness, isCrit, isStab };
}

// Accuracy + damage + status-application in one call - the single place a
// move's outcome is ever decided, so every battle page (wild/gym/league)
// resolves misses/crits/effectiveness/status identically. Returns
// { hit:false } (no damage rolled, no status attempted) on a miss - PP is
// still the caller's responsibility to decrement, since a miss still costs
// the move's PP. `defenderStatus` is the target's CURRENT status (or null)
// - a move's effect only has a chance to apply when the target has none
// (Phase 12 rule: single status slot, no stacking, not even the same
// condition re-applied). A move with no `effect` field behaves byte-
// identical to Phase 11 (appliedStatus is always null).
function resolveMoveUse({ move, attackerTypes, attackerStats, defenderTypes, defenderStats, defenderStatus, rng }) {
  if (!rollAccuracy(move, rng)) {
    return { hit: false, damage: 0, effectiveness: 1, isCrit: false, isStab: false, appliedStatus: null };
  }
  const dmgResult = calcDamage({ move, attackerTypes, attackerStats, defenderTypes, defenderStats, rng });
  let appliedStatus = null;
  if (move.effect && move.effect.type && !defenderStatus) {
    if ((rng || Math.random)() < (move.effect.chance / 100)) appliedStatus = move.effect.type;
  }
  return Object.assign({ hit: true, appliedStatus }, dmgResult);
}

// Minimal enemy AI (Phase 11 spec #16, deliberately not smart): prefers a
// super-effective move if one is available and has PP; otherwise picks
// uniformly among whatever still has PP (falling back to the full moveset
// if every move is out of PP, so an enemy can never be permanently stuck).
function chooseEnemyMove(enemyMoves, defenderTypes, rng) {
  const usable = enemyMoves.filter(m => m.pp > 0);
  const pool = usable.length ? usable : enemyMoves;
  const superEffective = pool.filter(m => m.power > 0 && typeMultiplier(m.type, defenderTypes) > 1);
  const choices = superEffective.length ? superEffective : pool;
  const idx = Math.floor((rng || Math.random)() * choices.length);
  return choices[idx];
}

// Resolves one full combat turn (the player's chosen move + the enemy's
// AI-chosen move) in speed order, stopping early if either side faints
// mid-turn - this is the ONE place turn order/PP-consumption/accuracy/
// damage/status are decided for wild/gym/league battles alike, so no
// battle page re-implements any of these rules itself. Mutates `player`/
// `enemy`'s `hp`/`status` and the used move's `pp` in place (the move
// objects living in their own `.moves` arrays) and returns a log-friendly
// step list for the page to render in whatever style it already uses.
//
// Phase 12: a paralyzed Pokemon rolls a 25% chance to be fully prevented
// from acting - if so, its move is never actually used (no PP cost, exactly
// like the real games), logged as its own step kind so pages can show
// "fully paralyzed!" instead of a move name. After both actions for the
// turn resolve (or the loop already ended on a faint), one end-of-turn
// residual pass applies burn/poison chip damage in a fixed player-then-
// enemy order; if the first tick faints its target, the battle is over at
// that point and the second Pokemon's residual tick is never applied.
function resolveBattleTurn({ player, playerMoveIndex, enemy, rng }) {
  const playerMove = player.moves[playerMoveIndex];
  const enemyMove = chooseEnemyMove(enemy.moves, player.types, rng);
  const order = decideTurnOrder(player.battleStats.speed, enemy.battleStats.speed, rng);
  const actors = order === "a"
    ? [{ side: "player", mon: player, move: playerMove, target: enemy },
       { side: "enemy", mon: enemy, move: enemyMove, target: player }]
    : [{ side: "enemy", mon: enemy, move: enemyMove, target: player },
       { side: "player", mon: player, move: playerMove, target: enemy }];

  const steps = [];
  for (const step of actors) {
    if (step.mon.hp <= 0) continue; // fainted earlier this same turn - skip its action

    if (step.mon.status === "paralysis" && rollParalysisPrevented(rng)) {
      steps.push({ side: step.side, move: step.move, prevented: true, reason: "paralysis", hit: false, damage: 0, effectiveness: 1, isCrit: false, isStab: false, appliedStatus: null, targetFaintedByThis: false });
      continue;
    }

    if (step.move.pp > 0) step.move.pp -= 1;
    const result = resolveMoveUse({
      move: step.move, attackerTypes: step.mon.types, attackerStats: step.mon.battleStats,
      defenderTypes: step.target.types, defenderStats: step.target.battleStats,
      defenderStatus: step.target.status, rng
    });
    if (result.hit) step.target.hp = Math.max(0, step.target.hp - result.damage);
    if (result.appliedStatus) step.target.status = result.appliedStatus;
    steps.push(Object.assign({ side: step.side, move: step.move, targetFaintedByThis: result.hit && step.target.hp <= 0 }, result));
    if (step.target.hp <= 0) break; // the battle-ending faint stops the turn here
  }

  // Residual burn/poison damage only runs if the turn's actions didn't
  // already end the battle - a move-caused faint already stopped the loop
  // above, so both sides being alive here is the correct gate.
  if (player.hp > 0 && enemy.hp > 0) {
    const residualOrder = [{ side: "player", mon: player }, { side: "enemy", mon: enemy }];
    for (const entry of residualOrder) {
      if (entry.mon.hp <= 0) continue;
      if (entry.mon.status !== "burn" && entry.mon.status !== "poison") continue;
      const dmg = residualStatusDamage(entry.mon.maxHp);
      entry.mon.hp = Math.max(0, entry.mon.hp - dmg);
      const faintedByThis = entry.mon.hp <= 0;
      steps.push({ side: entry.side, kind: "status-damage", status: entry.mon.status, damage: dmg, targetFaintedByThis: faintedByThis });
      if (faintedByThis) break; // battle is over here - the other side's residual tick never happens
    }
  }

  return steps;
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
