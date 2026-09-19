// ---- Adventure move data (Phase 11) ----
// Data-driven move catalog + per-species learnsets, sitting entirely on top
// of battle-engine.js's combat math (damage/accuracy/crit/turn order all
// live there - this file only supplies WHICH moves a Pokemon has and HOW
// they're learned/persisted). Adventure-only: never touched by classic
// Ayaz/Baba mydex instances, which have no `moves` field and never call
// anything here.
//
// Scope (deliberately not exhaustive - see Phase 11 spec #23): real,
// hand-curated learnsets exist only for the species a player actually
// controls across a full level range (the four starter lines + Pikachu/
// Raichu, plus their fully-evolved forms since those also appear in
// Gym/League rosters). Every other species - every wild encounter, every
// Gym/Elite Four/Champion team member without a curated entry above - gets
// a deterministic, type-derived fallback moveset instead of an exhaustive
// hand-written catalog for 1000+ Pokemon. `usesFallbackMoveset()` makes
// which path a species took explicitly testable rather than a silent
// guess.

// category/power/accuracy/pp are real, canonical values from the actual
// games (not derived from a type formula - Pokemon's physical/special split
// is per-move, not per-type, e.g. Vine Whip is Physical despite being
// Grass-type while Gust is Special despite being Flying-type).
const MOVE_CATALOG = {
  tackle:         { id: "tackle",         name: "Çarpma",         type: "normal",   category: "physical", power: 40, accuracy: 100, pp: 35 },
  "quick-attack": { id: "quick-attack",   name: "Hızlı Saldırı",  type: "normal",   category: "physical", power: 40, accuracy: 100, pp: 30 },
  growl:          { id: "growl",          name: "Hırlama",        type: "normal",   category: "status",   power: 0,  accuracy: 100, pp: 40 },
  "karate-chop":  { id: "karate-chop",    name: "Karate Darbesi", type: "fighting", category: "physical", power: 50, accuracy: 100, pp: 25 },
  "poison-sting": { id: "poison-sting",   name: "Zehir İğnesi",   type: "poison",   category: "physical", power: 15, accuracy: 100, pp: 35,
    // Phase 12: real canonical Poison Sting also carries a 30% poison
    // chance - the fallback move for every Poison-type species, so poison
    // is exercisable without touching any Gym/League roster.
    effect: { type: "poison", chance: 30 } },
  "mud-slap":     { id: "mud-slap",       name: "Çamur Şaplağı",  type: "ground",   category: "special",  power: 20, accuracy: 100, pp: 10 },
  gust:           { id: "gust",           name: "Rüzgar",         type: "flying",   category: "special",  power: 40, accuracy: 100, pp: 35 },
  confusion:      { id: "confusion",      name: "Şaşkınlık",      type: "psychic",  category: "special",  power: 50, accuracy: 100, pp: 25 },
  "bug-bite":     { id: "bug-bite",       name: "Böcek Isırığı",  type: "bug",      category: "physical", power: 60, accuracy: 100, pp: 20 },
  "rock-throw":   { id: "rock-throw",     name: "Kaya Fırlatma",  type: "rock",     category: "physical", power: 50, accuracy: 90,  pp: 15 },
  lick:           { id: "lick",           name: "Yalama",         type: "ghost",    category: "physical", power: 30, accuracy: 100, pp: 30 },
  "dragon-breath": { id: "dragon-breath", name: "Ejderha Nefesi", type: "dragon",   category: "special",  power: 60, accuracy: 100, pp: 20 },
  bite:           { id: "bite",           name: "Isırık",         type: "dark",     category: "physical", power: 60, accuracy: 100, pp: 25 },
  "metal-claw":   { id: "metal-claw",     name: "Metal Pençe",    type: "steel",    category: "physical", power: 50, accuracy: 95,  pp: 35 },
  "fairy-wind":   { id: "fairy-wind",     name: "Peri Rüzgarı",   type: "fairy",    category: "special",  power: 40, accuracy: 100, pp: 30 },
  ember:          { id: "ember",          name: "Kıvılcım",       type: "fire",     category: "special",  power: 40, accuracy: 100, pp: 25,
    // Phase 12: real canonical Ember also carries a 10% burn chance - this
    // is the intended, minimal way burn actually gets tested/experienced in
    // real Adventure battles (Charmander/Charmeleon/Charizard's own
    // learnset already includes Ember, so no roster changed to enable it).
    effect: { type: "burn", chance: 10 } },
  "water-gun":    { id: "water-gun",      name: "Su Tabancası",   type: "water",    category: "special",  power: 40, accuracy: 100, pp: 25 },
  "vine-whip":    { id: "vine-whip",      name: "Asma Kırbacı",   type: "grass",    category: "physical", power: 45, accuracy: 100, pp: 25 },
  "thunder-shock": { id: "thunder-shock", name: "Şimşek Şoku",    type: "electric", category: "special",  power: 40, accuracy: 100, pp: 30 },
  "powder-snow":  { id: "powder-snow",    name: "Kar Tozu",       type: "ice",      category: "special",  power: 40, accuracy: 100, pp: 25 },
  // Phase 12: real canonical Thunder Wave - pure status move, 100% chance
  // to paralyze on hit (its own 90 accuracy is the only way it can fail).
  "thunder-wave": { id: "thunder-wave",   name: "Şimşek Dalgası", type: "electric", category: "status",  power: 0,  accuracy: 90,  pp: 20, effect: { type: "paralysis", chance: 100 } },

  // Extra flavor moves for the curated starter learnsets below.
  "razor-leaf":   { id: "razor-leaf",     name: "Yaprak Bıçağı",  type: "grass",    category: "physical", power: 55, accuracy: 95,  pp: 25 },
  flamethrower:   { id: "flamethrower",   name: "Alev Püskürtme", type: "fire",     category: "special",  power: 90, accuracy: 100, pp: 15 },
  "water-pulse":  { id: "water-pulse",    name: "Su Nabzı",       type: "water",    category: "special",  power: 60, accuracy: 100, pp: 20 },
  thunderbolt:    { id: "thunderbolt",    name: "Yıldırım",       type: "electric", category: "special",  power: 90, accuracy: 100, pp: 15 },

  // Phase 16: a second, stronger move per type for every OTHER (fallback-
  // moveset) species - learned at level 15, same "you get something new as
  // you level" feeling the curated starter lines already had, without
  // hand-writing a full learnset for every one of ~1000 species. See
  // TYPE_TIER2_MOVE_ID below.
  headbutt:       { id: "headbutt",       name: "Kafa Vuruşu",    type: "normal",   category: "physical", power: 70, accuracy: 100, pp: 15 },
  "brick-break":  { id: "brick-break",    name: "Tuğla Kırma",    type: "fighting", category: "physical", power: 75, accuracy: 100, pp: 15 },
  sludge:         { id: "sludge",         name: "Lağım",          type: "poison",   category: "special",  power: 65, accuracy: 100, pp: 20 },
  dig:            { id: "dig",            name: "Kazma",          type: "ground",   category: "physical", power: 80, accuracy: 100, pp: 10 },
  "wing-attack":  { id: "wing-attack",    name: "Kanat Saldırısı", type: "flying",  category: "physical", power: 60, accuracy: 100, pp: 35 },
  psybeam:        { id: "psybeam",        name: "Psişik Işın",    type: "psychic",  category: "special",  power: 65, accuracy: 100, pp: 20 },
  "x-scissor":    { id: "x-scissor",      name: "Çapraz Makas",   type: "bug",      category: "physical", power: 80, accuracy: 100, pp: 15 },
  "rock-slide":   { id: "rock-slide",     name: "Kaya Kayması",   type: "rock",     category: "physical", power: 75, accuracy: 90,  pp: 10 },
  "shadow-ball":  { id: "shadow-ball",    name: "Gölge Topu",     type: "ghost",    category: "special",  power: 80, accuracy: 100, pp: 15 },
  "dragon-claw":  { id: "dragon-claw",    name: "Ejderha Pençesi", type: "dragon",  category: "physical", power: 80, accuracy: 100, pp: 15 },
  crunch:         { id: "crunch",         name: "Çıtırdatma",     type: "dark",     category: "physical", power: 80, accuracy: 100, pp: 15 },
  "iron-head":    { id: "iron-head",      name: "Demir Kafa",     type: "steel",    category: "physical", power: 80, accuracy: 100, pp: 15 },
  moonblast:      { id: "moonblast",      name: "Ay Işını",       type: "fairy",    category: "special",  power: 95, accuracy: 100, pp: 15 },
  "ice-punch":    { id: "ice-punch",      name: "Buz Yumruğu",    type: "ice",      category: "physical", power: 75, accuracy: 100, pp: 15 }
};

function getMoveById(id) {
  return MOVE_CATALOG[id] || null;
}

// One canonical move per type, used both to build the deterministic
// fallback moveset and as the universal filler every fallback pool falls
// back to when a type is unrecognized.
const TYPE_FALLBACK_MOVE_ID = {
  normal: "tackle", fighting: "karate-chop", poison: "poison-sting", ground: "mud-slap",
  flying: "gust", psychic: "confusion", bug: "bug-bite", rock: "rock-throw",
  ghost: "lick", dragon: "dragon-breath", dark: "bite", steel: "metal-claw",
  fairy: "fairy-wind", fire: "ember", water: "water-gun", grass: "vine-whip",
  electric: "thunder-shock", ice: "powder-snow"
};

// The stronger move a fallback-moveset species (anything without a
// hand-curated MOVESETS entry) learns at FALLBACK_TIER2_LEVEL - see
// fallbackMovesForTypes/checkLevelUpLearn. Fire/water/grass/electric reuse
// the exact moves the curated starter lines already learn at a similar
// level, so a wild Charmander-line-adjacent Fire-type and an actual
// Charmander end up feeling consistent.
const TYPE_TIER2_MOVE_ID = {
  normal: "headbutt", fighting: "brick-break", poison: "sludge", ground: "dig",
  flying: "wing-attack", psychic: "psybeam", bug: "x-scissor", rock: "rock-slide",
  ghost: "shadow-ball", dragon: "dragon-claw", dark: "crunch", steel: "iron-head",
  fairy: "moonblast", fire: "flamethrower", water: "water-pulse", grass: "razor-leaf",
  electric: "thunderbolt", ice: "ice-punch"
};
const FALLBACK_TIER2_LEVEL = 15;

// Real, hand-curated learnsets - only for species a player actually controls
// across a level range (starters + their final evolutions, which also show
// up in Gym/League rosters). Every other species uses the fallback below.
const MOVESETS = {
  1: [ // Bulbasaur
    { level: 1, moveId: "tackle" }, { level: 1, moveId: "vine-whip" },
    { level: 3, moveId: "growl" }, { level: 13, moveId: "razor-leaf" }
  ],
  4: [ // Charmander
    { level: 1, moveId: "tackle" }, { level: 1, moveId: "ember" },
    { level: 9, moveId: "quick-attack" }, { level: 20, moveId: "flamethrower" }
  ],
  6: [ // Charizard
    { level: 1, moveId: "tackle" }, { level: 1, moveId: "ember" },
    { level: 1, moveId: "quick-attack" }, { level: 36, moveId: "flamethrower" }
  ],
  7: [ // Squirtle
    { level: 1, moveId: "tackle" }, { level: 1, moveId: "water-gun" },
    { level: 10, moveId: "quick-attack" }, { level: 24, moveId: "water-pulse" }
  ],
  9: [ // Blastoise
    { level: 1, moveId: "tackle" }, { level: 1, moveId: "water-gun" },
    { level: 1, moveId: "quick-attack" }, { level: 36, moveId: "water-pulse" }
  ],
  25: [ // Pikachu
    { level: 1, moveId: "tackle" }, { level: 1, moveId: "thunder-shock" },
    { level: 10, moveId: "quick-attack" }, { level: 18, moveId: "thunder-wave" },
    { level: 26, moveId: "thunderbolt" }
  ]
};

function getLearnsetFor(speciesId) {
  return MOVESETS[speciesId] || null;
}

// True whenever a species has no curated learnset and will use the
// deterministic type-based fallback instead - lets tests assert exactly
// which species take which path instead of guessing from behavior.
function usesFallbackMoveset(speciesId) {
  return !MOVESETS[speciesId];
}

// Deterministic fallback: one move per (up to 2) types, always topped up
// with the universal Tackle filler so every Pokemon has at least one
// guaranteed-neutral move, capped at 4, de-duplicated. Never random. At
// FALLBACK_TIER2_LEVEL+, each type's stronger tier-2 move is added too
// (see TYPE_TIER2_MOVE_ID) - every Pokemon gets something new to learn as
// it levels, not just the hand-curated starter lines.
function fallbackMovesForTypes(types, level) {
  const ids = (types || []).map(t => TYPE_FALLBACK_MOVE_ID[t] || TYPE_FALLBACK_MOVE_ID.normal);
  if ((level || 1) >= FALLBACK_TIER2_LEVEL) {
    (types || []).forEach(t => ids.push(TYPE_TIER2_MOVE_ID[t] || TYPE_TIER2_MOVE_ID.normal));
  }
  ids.push(TYPE_FALLBACK_MOVE_ID.normal);
  const deduped = [...new Set(ids)].slice(0, 4);
  return deduped.map(id => getMoveById(id));
}

// The moves a species would know at `level`, capped at 4 (the most
// recently-learned ones win, same as a freshly-caught/started Pokemon in
// the real games). Falls back to type-based moves when there's no curated
// learnset for this species at all.
function movesKnownAtLevel(speciesId, level, types) {
  const learnset = getLearnsetFor(speciesId);
  if (!learnset) return fallbackMovesForTypes(types, level);
  const eligible = learnset.filter(m => m.level <= (level || 1)).sort((a, b) => a.level - b.level);
  if (!eligible.length) return fallbackMovesForTypes(types, level);
  const ids = eligible.map(m => m.moveId);
  const lastFour = ids.slice(-4);
  return lastFour.map(id => getMoveById(id)).filter(Boolean);
}

// ---- Instance moves: migration + persistence shape ----
// Adventure Pokemon instances store `moves` as [{id, pp}] (pp is the
// CURRENT remaining PP, persisted exactly like currentHp - never reset
// except by the Pokemon Center). This function is the one-time, idempotent
// migration point: a pre-Phase-11 instance (or a freshly-caught one) with
// no `moves` field yet gets a deterministic default from its own
// species+level; an instance that already has moves is returned unchanged.
// Only ever called on Adventure dex entries - classic mydex instances never
// pass through this file.
function ensureInstanceMoves(mon) {
  if (Array.isArray(mon.moves) && mon.moves.length > 0) return mon;
  const moves = movesKnownAtLevel(mon.id, mon.level || 1, mon.types);
  return Object.assign({}, mon, { moves: moves.map(m => ({ id: m.id, pp: m.pp })) });
}

// The types of the moves this instance actually knows right now - used by
// the switch-picker/party-picker "Xx yer, Yx vurur" hint so its "vurur"
// number matches what the player can really do in battle (a Pokemon whose
// only moves are its weaker STAB type shouldn't be advertised at its
// stronger, unlearned type's multiplier just because it happens to also
// carry that type). Works on both a raw dex entry (moves: [{id,pp}]) and an
// already-hydrated battle move list (full catalog objects, which already
// carry `.type` and skip the catalog lookup).
function knownMoveTypes(mon) {
  const ensured = ensureInstanceMoves(mon);
  return ensured.moves.map(entry => {
    const catalog = entry.type ? entry : getMoveById(entry.id);
    return catalog ? catalog.type : null;
  }).filter(Boolean);
}

// Builds the battle-ready move list (full catalog data + this instance's
// current PP) from a (migration-ensured) instance's stored `moves`. Battle
// pages mutate the returned objects' `.pp` in place during the fight, then
// persist them back with serializeBattleMoves.
function hydrateBattleMoves(mon) {
  const ensured = ensureInstanceMoves(mon);
  return ensured.moves.map(entry => {
    const catalog = getMoveById(entry.id) || getMoveById(TYPE_FALLBACK_MOVE_ID.normal);
    return Object.assign({}, catalog, { pp: entry.pp != null ? entry.pp : catalog.pp, maxPp: catalog.pp });
  });
}

// A plain, full-PP battle moveset for a non-owned combatant (a wild
// Pokemon, or a Gym/League team member) - these never persist PP across
// separate battles, only within one, so they always start full.
function freshBattleMoves(speciesId, level, types) {
  return movesKnownAtLevel(speciesId, level, types).map(m => Object.assign({}, m, { maxPp: m.pp }));
}

function serializeBattleMoves(moves) {
  return moves.map(m => ({ id: m.id, pp: m.pp }));
}

// ---- Level-up move learning ----
// Called after a Pokemon's level actually changed (battle XP or Rare Candy)
// with the levels straddled. Returns null if nothing new was learned in
// that range, otherwise the newest move learned. If the Pokemon already has
// 4 moves, learning is NOT automatic - the caller must offer a Replace/Keep
// choice (see applyLevelUpLearn/resolvePendingLearn) rather than silently
// dropping either the new move or an old one.
function checkLevelUpLearn(mon, oldLevel, newLevel) {
  if (newLevel <= oldLevel) return null;
  const currentMoves = Array.isArray(mon.moves) ? mon.moves : [];
  const learnset = getLearnsetFor(mon.id);
  let moveId;
  if (learnset) {
    const newlyEligible = learnset.filter(m => m.level > oldLevel && m.level <= newLevel).sort((a, b) => a.level - b.level);
    if (!newlyEligible.length) return null;
    moveId = newlyEligible[newlyEligible.length - 1].moveId;
  } else {
    // Fallback-moveset species (everything without a curated MOVESETS
    // entry) - crossing FALLBACK_TIER2_LEVEL learns its type's tier-2
    // move, same "something new as you level" feeling curated lines get.
    // A dual-type Pokemon's second type's move is a nice-to-have this
    // doesn't chase - only one move is ever returned per level-up here,
    // matching the curated path's own "newest one only" behavior.
    if (!(oldLevel < FALLBACK_TIER2_LEVEL && newLevel >= FALLBACK_TIER2_LEVEL)) return null;
    const t = (mon.types || [])[0];
    if (!t) return null;
    moveId = TYPE_TIER2_MOVE_ID[t] || TYPE_TIER2_MOVE_ID.normal;
  }
  if (currentMoves.some(m => m.id === moveId)) return null;
  return { moveId, autoLearn: currentMoves.length < 4 };
}

// Applies a checkLevelUpLearn() result to a (moves-ensured) instance. When
// there's room, the move is learned immediately with full PP; otherwise the
// choice is parked on `pendingLearnMoveId` for the UI to resolve later - the
// Pokemon keeps fighting with its current 4 moves in the meantime.
function applyLevelUpLearn(mon, learnResult) {
  if (!learnResult) return mon;
  if (learnResult.autoLearn) {
    const catalog = getMoveById(learnResult.moveId);
    const moves = (Array.isArray(mon.moves) ? mon.moves : []).concat([{ id: catalog.id, pp: catalog.pp }]);
    return Object.assign({}, mon, { moves, pendingLearnMoveId: null });
  }
  return Object.assign({}, mon, { pendingLearnMoveId: learnResult.moveId });
}

// Resolves a pending 5th-move choice from the Collection screen.
// choice: "keep" (discard the new move) or "replace" (swap it in for
// `replaceMoveId`, given fresh full PP).
function resolvePendingLearn(mon, choice, replaceMoveId) {
  if (!mon.pendingLearnMoveId) return mon;
  if (choice !== "replace") return Object.assign({}, mon, { pendingLearnMoveId: null });
  const catalog = getMoveById(mon.pendingLearnMoveId);
  if (!catalog) return Object.assign({}, mon, { pendingLearnMoveId: null });
  const moves = (mon.moves || []).map(m => m.id === replaceMoveId ? { id: catalog.id, pp: catalog.pp } : m);
  return Object.assign({}, mon, { moves, pendingLearnMoveId: null });
}

// Restores every move's PP to full - the move-learning half of the
// Pokemon Center's existing full-heal, called alongside it (never on its
// own) so HP and PP are always restored together.
function restoreAllPP(mon) {
  const ensured = ensureInstanceMoves(mon);
  return Object.assign({}, ensured, {
    moves: ensured.moves.map(m => ({ id: m.id, pp: (getMoveById(m.id) || {}).pp ?? m.pp }))
  });
}
