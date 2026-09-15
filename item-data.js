// ---- Adventure item catalog + effects (Phase 4, re-scoped in Phase 4.5) ----
// Single source of truth for prices/effects/names, used by pokemart.html
// (buying) and adventure-hq.html/wild-battle.html (using items). Everything
// here operates on the Adventure profile (adventure-state.js) ONLY - never
// on the classic Ayaz/Baba inventory/collection, which has its own much
// smaller item set (Poké Ball/Berry/Evolution Stone, unrelated to buying).
// Depends on adventure-state.js, battle-engine.js (for computeBattleStats)
// and move-data.js (for restoreAllPP) - load all three before this file.
const ITEM_CATALOG = {
  pokeball: { id: "pokeball", name: "Poké Ball", emoji: "⚪", price: 50,
    description: "Vahşi Pokémon yakalamak için temel top.",
    category: "ball", effect: { type: "catch", multiplier: 1 }, usableIn: ["wild-battle"] },
  greatball: { id: "greatball", name: "Great Ball", emoji: "🔵", price: 150,
    description: "Poké Ball'dan daha yüksek yakalama şansı.",
    category: "ball", effect: { type: "catch", multiplier: 1.5 }, usableIn: ["wild-battle"] },
  ultraball: { id: "ultraball", name: "Ultra Ball", emoji: "🟡", price: 400,
    description: "En yüksek yakalama şansına sahip top.",
    // Phase 13: Trainer Level's first real consequence - Ultra Ball must be
    // earned, not just afforded. minTrainerLevel is an optional field (only
    // this item has it); anything already in a player's inventory is
    // unaffected, this only gates future purchases.
    category: "ball", effect: { type: "catch", multiplier: 2 }, usableIn: ["wild-battle"], minTrainerLevel: 10 },
  potion: { id: "potion", name: "İksir", emoji: "🧪", price: 100,
    description: "Bir Pokémon'un HP'sini biraz iyileştirir.",
    category: "healing", effect: { type: "heal", amount: 20 }, usableIn: ["wild-battle", "adventure-hq"] },
  "super-potion": { id: "super-potion", name: "Süper İksir", emoji: "💊", price: 250,
    description: "Bir Pokémon'un HP'sini büyük ölçüde iyileştirir.",
    category: "healing", effect: { type: "heal", amount: 50 }, usableIn: ["wild-battle", "adventure-hq"] },
  revive: { id: "revive", name: "Canlandırıcı", emoji: "✨", price: 300,
    description: "Baygın bir Pokémon'u yarı HP ile tekrar savaşabilir hale getirir.",
    category: "healing", effect: { type: "revive", hpFraction: 0.5 }, usableIn: ["adventure-hq"] },
  berry: { id: "berry", name: "Meyve", emoji: "🍒", price: 30,
    description: "Küçük bir HP iyileştirmesi sağlar.",
    category: "healing", effect: { type: "heal", amount: 10 }, usableIn: ["wild-battle"] },
  "rare-candy": { id: "rare-candy", name: "Ender Şeker", emoji: "🍬", price: 500,
    description: "Seçtiğin Pokémon'u anında 1 seviye yükseltir.",
    category: "growth", effect: { type: "level-up", levels: 1 }, usableIn: ["adventure-hq"] },
  "evolution-stone": { id: "evolution-stone", name: "Evrim Taşı", emoji: "💎", price: 600,
    description: "Bazı Pokémon'ları evrimleştirmek için kullanılır. (Evrim sistemi yakında)",
    category: "evolution", effect: { type: "evolve" }, usableIn: ["adventure-hq"] }
};

function computeMonMaxHp(mon) {
  return computeBattleStats(mon.stats || {}, mon.level || 1).maxHp;
}

// currentHp is optional on older entries; anything missing it is simply
// treated as full HP until it takes damage once.
function computeMonCurrentHp(mon) {
  const maxHp = computeMonMaxHp(mon);
  if (mon.fainted) return 0;
  return mon.currentHp != null ? Math.min(mon.currentHp, maxHp) : maxHp;
}

function findMonIndex(mydex, instanceId) {
  return mydex.findIndex(p => p.instanceId === instanceId);
}

// Every apply* function re-reads the Adventure inventory/dex and re-checks
// its own preconditions right before writing, so calling one twice in a row
// (e.g. a double click) just fails the second time with a clear reason
// instead of double-spending the item.
function applyHealItem(instanceId, itemKey) {
  const item = ITEM_CATALOG[itemKey];
  if (!item || item.effect.type !== "heal") return { ok: false, reason: "invalid-item" };
  const inv = getAdventureInventory();
  if ((inv[itemKey] || 0) <= 0) return { ok: false, reason: "no-item" };
  const mydex = getAdventureDex();
  const idx = findMonIndex(mydex, instanceId);
  if (idx === -1) return { ok: false, reason: "not-found" };
  const mon = mydex[idx];
  if (mon.fainted) return { ok: false, reason: "fainted" };
  const maxHp = computeMonMaxHp(mon);
  const curHp = computeMonCurrentHp(mon);
  if (curHp >= maxHp) return { ok: false, reason: "full-hp" };
  const newHp = Math.min(maxHp, curHp + item.effect.amount);
  mydex[idx] = Object.assign({}, mon, { currentHp: newHp });
  saveAdventureDex(mydex);
  addAdventureItems(itemKey, -1);
  return { ok: true, newHp, maxHp };
}

function applyRevive(instanceId, itemKey) {
  itemKey = itemKey || "revive";
  const inv = getAdventureInventory();
  if ((inv[itemKey] || 0) <= 0) return { ok: false, reason: "no-item" };
  const mydex = getAdventureDex();
  const idx = findMonIndex(mydex, instanceId);
  if (idx === -1) return { ok: false, reason: "not-found" };
  const mon = mydex[idx];
  if (!mon.fainted) return { ok: false, reason: "not-fainted" };
  const maxHp = computeMonMaxHp(mon);
  const item = ITEM_CATALOG[itemKey];
  const newHp = Math.max(1, Math.round(maxHp * (item.effect.hpFraction || 0.5)));
  mydex[idx] = Object.assign({}, mon, { fainted: false, currentHp: newHp });
  saveAdventureDex(mydex);
  addAdventureItems(itemKey, -1);
  return { ok: true, newHp };
}

function applyRareCandy(instanceId) {
  const inv = getAdventureInventory();
  if ((inv["rare-candy"] || 0) <= 0) return { ok: false, reason: "no-item" };
  const mydex = getAdventureDex();
  const idx = findMonIndex(mydex, instanceId);
  if (idx === -1) return { ok: false, reason: "not-found" };
  const mon = mydex[idx];
  if ((mon.level || 1) >= 100) return { ok: false, reason: "max-level" };
  const oldMaxHp = computeMonMaxHp(mon);
  const oldCurrentHp = computeMonCurrentHp(mon);
  const oldLevel = mon.level || 1;
  const newLevel = oldLevel + 1;
  // Keep pxp consistent with the new level so a later battle XP gain
  // computes the right next level (never lower than what levelInfo implies).
  const newPxp = Math.max(mon.pxp || 0, (newLevel - 1) * POKEMON_XP_PER_LEVEL);
  const newMaxHp = computeMonMaxHp(Object.assign({}, mon, { level: newLevel }));
  const newCurrentHp = Math.min(newMaxHp, oldCurrentHp + (newMaxHp - oldMaxHp));
  const ensuredMon = ensureInstanceMoves(mon);
  const learnResult = checkLevelUpLearn(ensuredMon, oldLevel, newLevel);
  const leveled = Object.assign({}, ensuredMon, { level: newLevel, pxp: newPxp, currentHp: newCurrentHp });
  mydex[idx] = applyLevelUpLearn(leveled, learnResult);
  saveAdventureDex(mydex);
  addAdventureItems("rare-candy", -1);
  return { ok: true, newLevel };
}

// Free, unlimited, heals and revives every Adventure Pokemon - the Pokemon
// Center. Phase 11: also restores every move's PP to full (restoreAllPP is
// itself migration-safe via ensureInstanceMoves, so this works identically
// on a Pokemon that has never been through a move-based battle yet).
// Phase 12: also clears any burn/poison/paralysis status.
function healAllAtPokemonCenter() {
  const mydex = getAdventureDex();
  const healed = mydex.map(p => Object.assign({}, restoreAllPP(p), { fainted: false, currentHp: computeMonMaxHp(p), status: null }));
  saveAdventureDex(healed);
  return healed.length;
}

// ---- PokeCoin purchases (single spend path so "insufficient funds" and
// "never negative" are enforced in exactly one place) ----
function buyItem(itemId) {
  const item = ITEM_CATALOG[itemId];
  if (!item) return { ok: false, reason: "invalid-item" };
  // Phase 13: Trainer Level gate, checked here (not just in pokemart.html's
  // rendering) so a direct/bypassed call can never buy an item early -
  // same "never trust the UI alone" precedent as every other Adventure
  // write path in this codebase.
  if (item.minTrainerLevel) {
    const trainerLevel = levelInfo(getAdventurePlayer().xp).level;
    if (trainerLevel < item.minTrainerLevel) return { ok: false, reason: "level-too-low" };
  }
  if (!spendAdventureCoins(item.price)) return { ok: false, reason: "insufficient-coins" };
  addAdventureItems(itemId, 1);
  return { ok: true, newCoins: getAdventurePlayer().coins };
}
