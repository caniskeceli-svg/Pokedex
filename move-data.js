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
  "ice-punch":    { id: "ice-punch",      name: "Buz Yumruğu",    type: "ice",      category: "physical", power: 75, accuracy: 100, pp: 15 },

  // Phase 20: a Pokemon used to stop learning anything new past a low level
  // (FALLBACK_TIER2_LEVEL=15 for most species, or the last curated
  // MOVESETS entry - level 36 at the latest) even though the level curve
  // now comfortably reaches 100. Two more tiers per type (see
  // TYPE_TIER3_MOVE_ID/TYPE_TIER4_MOVE_ID below), all real canonical
  // moves, give every Pokemon something new to learn well into the
  // Hoenn/Sinnoh/Unova level range instead of going quiet after Johto.
  "hyper-beam":     { id: "hyper-beam",     name: "Hiper Işın",      type: "normal",   category: "special",  power: 150, accuracy: 90,  pp: 5 },
  "close-combat":   { id: "close-combat",   name: "Yakın Dövüş",     type: "fighting", category: "physical", power: 120, accuracy: 100, pp: 5 },
  "sludge-bomb":    { id: "sludge-bomb",    name: "Lağım Bombası",   type: "poison",   category: "special",  power: 90,  accuracy: 100, pp: 10, effect: { type: "poison", chance: 30 } },
  "earth-power":    { id: "earth-power",    name: "Yer Gücü",        type: "ground",   category: "special",  power: 90,  accuracy: 100, pp: 10 },
  hurricane:        { id: "hurricane",      name: "Kasırga",         type: "flying",   category: "special",  power: 110, accuracy: 70,  pp: 10 },
  psychic:          { id: "psychic",        name: "Ruhsal Güç",      type: "psychic",  category: "special",  power: 90,  accuracy: 100, pp: 10 },
  "bug-buzz":       { id: "bug-buzz",       name: "Böcek Vızıltısı", type: "bug",      category: "special",  power: 90,  accuracy: 100, pp: 10 },
  "power-gem":      { id: "power-gem",      name: "Güç Taşı",        type: "rock",     category: "special",  power: 80,  accuracy: 100, pp: 20 },
  "phantom-force":  { id: "phantom-force",  name: "Hayalet Güç",     type: "ghost",    category: "physical", power: 90,  accuracy: 100, pp: 10 },
  "dragon-pulse":   { id: "dragon-pulse",   name: "Ejderha Nabzı",   type: "dragon",   category: "special",  power: 85,  accuracy: 100, pp: 10 },
  "dark-pulse":     { id: "dark-pulse",     name: "Karanlık Nabız",  type: "dark",     category: "special",  power: 80,  accuracy: 100, pp: 15 },
  "flash-cannon":   { id: "flash-cannon",   name: "Işık Topu",       type: "steel",    category: "special",  power: 80,  accuracy: 100, pp: 10 },
  "dazzling-gleam": { id: "dazzling-gleam", name: "Göz Kamaştırma",  type: "fairy",    category: "special",  power: 80,  accuracy: 100, pp: 10 },
  "fire-blast":     { id: "fire-blast",     name: "Ateş Fırtınası",  type: "fire",     category: "special",  power: 110, accuracy: 85,  pp: 5 },
  "hydro-pump":     { id: "hydro-pump",     name: "Su Pompası",      type: "water",    category: "special",  power: 110, accuracy: 80,  pp: 5 },
  "solar-beam":     { id: "solar-beam",     name: "Güneş Işını",     type: "grass",    category: "special",  power: 120, accuracy: 100, pp: 10 },
  thunder:          { id: "thunder",        name: "Gök Gürültüsü",   type: "electric", category: "special",  power: 110, accuracy: 70,  pp: 10 },
  blizzard:         { id: "blizzard",       name: "Kar Fırtınası",   type: "ice",      category: "special",  power: 110, accuracy: 70,  pp: 5 },

  "giga-impact":    { id: "giga-impact",    name: "Dev Darbe",       type: "normal",   category: "physical", power: 150, accuracy: 90,  pp: 5 },
  "focus-blast":    { id: "focus-blast",    name: "Odak Bombası",    type: "fighting", category: "special",  power: 120, accuracy: 70,  pp: 5 },
  "gunk-shot":      { id: "gunk-shot",      name: "Pislik Atışı",    type: "poison",   category: "physical", power: 120, accuracy: 80,  pp: 5 },
  earthquake:       { id: "earthquake",     name: "Deprem",          type: "ground",   category: "physical", power: 100, accuracy: 100, pp: 10 },
  "sky-attack":     { id: "sky-attack",     name: "Gökyüzü Saldırısı", type: "flying", category: "physical", power: 140, accuracy: 90,  pp: 5 },
  psystrike:        { id: "psystrike",      name: "Ruh Darbesi",     type: "psychic",  category: "special",  power: 100, accuracy: 100, pp: 10 },
  megahorn:         { id: "megahorn",       name: "Mega Boynuz",     type: "bug",      category: "physical", power: 120, accuracy: 85,  pp: 10 },
  "stone-edge":     { id: "stone-edge",     name: "Taş Kenarı",      type: "rock",     category: "physical", power: 100, accuracy: 80,  pp: 5 },
  "shadow-force":   { id: "shadow-force",   name: "Gölge Güç",       type: "ghost",    category: "physical", power: 120, accuracy: 100, pp: 5 },
  outrage:          { id: "outrage",        name: "Öfke",            type: "dragon",   category: "physical", power: 120, accuracy: 100, pp: 10 },
  "foul-play":      { id: "foul-play",      name: "Hileli Oyun",     type: "dark",     category: "physical", power: 95,  accuracy: 100, pp: 15 },
  "meteor-mash":    { id: "meteor-mash",    name: "Meteor Yumruğu",  type: "steel",    category: "physical", power: 90,  accuracy: 90,  pp: 10 },
  "play-rough":     { id: "play-rough",     name: "Sert Oyun",       type: "fairy",    category: "physical", power: 90,  accuracy: 90,  pp: 10 },
  "flare-blitz":    { id: "flare-blitz",    name: "Alev Hücumu",     type: "fire",     category: "physical", power: 120, accuracy: 100, pp: 15 },
  scald:            { id: "scald",          name: "Haşlama",         type: "water",    category: "special",  power: 80,  accuracy: 100, pp: 15, effect: { type: "burn", chance: 30 } },
  "petal-blizzard": { id: "petal-blizzard", name: "Yaprak Fırtınası", type: "grass",   category: "physical", power: 90,  accuracy: 100, pp: 15 },
  "wild-charge":    { id: "wild-charge",    name: "Vahşi Hücum",     type: "electric", category: "physical", power: 90,  accuracy: 100, pp: 15 },
  "ice-beam":       { id: "ice-beam",       name: "Buz Işını",       type: "ice",      category: "special",  power: 90,  accuracy: 100, pp: 10 }
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

// Phase 20: two more tiers so a fallback-moveset species (the vast
// majority of the dex) keeps learning something new well past level 15,
// matching the level-100 curve every region's Gym/League chain now
// actually reaches. Levels roughly track the Johto->Hoenn (tier3) and
// Sinnoh->Unova (tier4) floors from the Phase 18 rebalance.
const TYPE_TIER3_MOVE_ID = {
  normal: "hyper-beam", fighting: "close-combat", poison: "sludge-bomb", ground: "earth-power",
  flying: "hurricane", psychic: "psychic", bug: "bug-buzz", rock: "power-gem",
  ghost: "phantom-force", dragon: "dragon-pulse", dark: "dark-pulse", steel: "flash-cannon",
  fairy: "dazzling-gleam", fire: "fire-blast", water: "hydro-pump", grass: "solar-beam",
  electric: "thunder", ice: "blizzard"
};
const FALLBACK_TIER3_LEVEL = 40;

const TYPE_TIER4_MOVE_ID = {
  normal: "giga-impact", fighting: "focus-blast", poison: "gunk-shot", ground: "earthquake",
  flying: "sky-attack", psychic: "psystrike", bug: "megahorn", rock: "stone-edge",
  ghost: "shadow-force", dragon: "outrage", dark: "foul-play", steel: "meteor-mash",
  fairy: "play-rough", fire: "flare-blitz", water: "scald", grass: "petal-blizzard",
  electric: "wild-charge", ice: "ice-beam"
};
const FALLBACK_TIER4_LEVEL = 70;

// Ordered ascending by level - both fallbackMovesForTypes and
// checkLevelUpLearn walk this instead of repeating each tier's own
// if-check, so adding a future tier is just appending one more entry here.
const FALLBACK_TIERS = [
  { level: FALLBACK_TIER2_LEVEL, movesByType: TYPE_TIER2_MOVE_ID },
  { level: FALLBACK_TIER3_LEVEL, movesByType: TYPE_TIER3_MOVE_ID },
  { level: FALLBACK_TIER4_LEVEL, movesByType: TYPE_TIER4_MOVE_ID }
];

// Real, hand-curated learnsets - only for species a player actually controls
// across a level range (starters + their final evolutions, which also show
// up in Gym/League rosters). Every other species uses the fallback below.
const MOVESETS = {
  1: [ // Bulbasaur
    { level: 1, moveId: "tackle" }, { level: 1, moveId: "vine-whip" },
    { level: 3, moveId: "growl" }, { level: 13, moveId: "razor-leaf" },
    // Phase 20: kept learning past level 13, same reasoning as
    // TYPE_TIER3/4_MOVE_ID - real Bulbasaur-line moves (Sludge Bomb via
    // TM, Solar Beam by level in several games).
    { level: 45, moveId: "sludge-bomb" }, { level: 65, moveId: "solar-beam" }
  ],
  4: [ // Charmander
    { level: 1, moveId: "tackle" }, { level: 1, moveId: "ember" },
    { level: 9, moveId: "quick-attack" }, { level: 20, moveId: "flamethrower" },
    { level: 45, moveId: "fire-blast" }, { level: 70, moveId: "flare-blitz" }
  ],
  6: [ // Charizard
    { level: 1, moveId: "tackle" }, { level: 1, moveId: "ember" },
    { level: 1, moveId: "quick-attack" }, { level: 36, moveId: "flamethrower" },
    { level: 55, moveId: "fire-blast" }, { level: 80, moveId: "flare-blitz" }
  ],
  7: [ // Squirtle
    { level: 1, moveId: "tackle" }, { level: 1, moveId: "water-gun" },
    { level: 10, moveId: "quick-attack" }, { level: 24, moveId: "water-pulse" },
    { level: 45, moveId: "hydro-pump" }, { level: 70, moveId: "scald" }
  ],
  9: [ // Blastoise
    { level: 1, moveId: "tackle" }, { level: 1, moveId: "water-gun" },
    { level: 1, moveId: "quick-attack" }, { level: 36, moveId: "water-pulse" },
    { level: 55, moveId: "hydro-pump" }, { level: 80, moveId: "ice-beam" }
  ],
  25: [ // Pikachu
    { level: 1, moveId: "tackle" }, { level: 1, moveId: "thunder-shock" },
    { level: 10, moveId: "quick-attack" }, { level: 18, moveId: "thunder-wave" },
    { level: 26, moveId: "thunderbolt" },
    { level: 45, moveId: "wild-charge" }, { level: 70, moveId: "thunder" }
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
// guaranteed-neutral move, capped at 4, de-duplicated. Never random. Each
// FALLBACK_TIERS threshold crossed adds that type's stronger move (see
// TYPE_TIER2/3/4_MOVE_ID) - every Pokemon gets something new to learn as
// it levels, not just the hand-curated starter lines.
//
// Phase 20 fix: the cap used to keep the FIRST 4 unique ids, which meant a
// dual-type Pokemon's basic+tier2 moves already filled all 4 slots before
// a higher tier was even appended - the new, stronger moves silently never
// showed up. Now keeps the LAST 4 unique ids instead (scanning from the
// newest-pushed move backward), so the most recently learned moves always
// win, same as a real Pokemon forgetting an old move for a new one.
function fallbackMovesForTypes(types, level) {
  const ids = (types || []).map(t => TYPE_FALLBACK_MOVE_ID[t] || TYPE_FALLBACK_MOVE_ID.normal);
  FALLBACK_TIERS.forEach(tier => {
    if ((level || 1) >= tier.level) {
      (types || []).forEach(t => ids.push(tier.movesByType[t] || tier.movesByType.normal));
    }
  });
  ids.push(TYPE_FALLBACK_MOVE_ID.normal);
  const deduped = [];
  for (let i = ids.length - 1; i >= 0 && deduped.length < 4; i--) {
    if (!deduped.includes(ids[i])) deduped.push(ids[i]);
  }
  deduped.reverse();
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
// Phase 21: checkLevelUpLearn used to work by tracking which level RANGE
// was crossed (oldLevel -> newLevel) and looking up just that range's new
// move. That silently never re-fired for a Pokemon that was already past
// every tier threshold before this level<->move sync existed (or that's
// already sitting at/near the level-100 cap and will never cross another
// threshold again) - exactly the Pokemon players actually have after many
// hours of play, so nobody was ever seen learning anything. Now compares
// "what this Pokemon SHOULD know at `atLevel`" (movesKnownAtLevel, the
// same source of truth battle moves are hydrated from) against what it
// actually has, and returns whichever eligible move is missing - this
// works identically whether the gap is from a level-up that just happened
// or from years-old stale data, and correctly picks up more than one tier
// crossed in a single big jump (Rare Candy, a large XP gain) since
// movesKnownAtLevel already returns only the newest-eligible moves.
function findMissingLearnableMove(mon, atLevel) {
  const currentMoves = Array.isArray(mon.moves) ? mon.moves : [];
  if (!currentMoves.length) return null; // no moves yet at all - ensureInstanceMoves handles first-time init, not a "learned something new" event
  const currentIds = new Set(currentMoves.map(m => m.id));
  const target = movesKnownAtLevel(mon.id, atLevel, mon.types);
  const missing = target.filter(m => !currentIds.has(m.id));
  if (!missing.length) return null;
  // movesKnownAtLevel returns oldest-eligible-first, so the last missing
  // entry is normally the most recently learnable one - EXCEPT the
  // universal Tackle filler (TYPE_FALLBACK_MOVE_ID.normal), which
  // fallbackMovesForTypes always appends last regardless of level. Skip it
  // in favor of a real tiered move whenever one is also missing, so a
  // level-up never "teaches" the most boring possible move by accident.
  const meaningful = missing.filter(m => m.id !== TYPE_FALLBACK_MOVE_ID.normal);
  const pick = meaningful.length ? meaningful : missing;
  const moveId = pick[pick.length - 1].id;
  return { moveId, autoLearn: currentMoves.length < 4 };
}

// Called after a Pokemon's level actually changed (battle XP or Rare Candy).
// Returns null if nothing new was learned, otherwise the newest move
// learned. If the Pokemon already has 4 moves, learning is NOT automatic -
// the caller must offer a Replace/Keep choice (see
// applyLevelUpLearn/resolvePendingLearn) rather than silently dropping
// either the new move or an old one.
function checkLevelUpLearn(mon, oldLevel, newLevel) {
  if (newLevel <= oldLevel) return null;
  if (mon.pendingLearnMoveId) return null; // don't stomp an unresolved Replace/Keep choice
  return findMissingLearnableMove(mon, newLevel);
}

// Passive catch-up check, no level-up event required: is this Pokemon's
// CURRENT moveset missing something it should already know at its current
// level? Needed for exactly the case checkLevelUpLearn above can't reach -
// a Pokemon that's already sitting at (or near) the level-100 cap, so no
// future level-up will ever fire to trigger a re-check. Called once per
// view in adventure-hq.html's collection card render so every existing
// Pokemon catches up the first time its owner looks at it after this fix,
// without needing a separate one-time migration script.
function checkStaleLearn(mon) {
  if (mon.pendingLearnMoveId) return null;
  return findMissingLearnableMove(mon, mon.level || 1);
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
