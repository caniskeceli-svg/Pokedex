// ---- Item catalog + effects (Phase 4) ----
// Single source of truth for prices/effects, used by pokemart.html (buying),
// mypokemon.html (using items on a Pokemon / Pokemon Center), and
// wild-battle.html (using Potion/Berry mid-battle, and ball consumption
// which already existed since Phase 3). Depends on pokedex-data.js (for
// getInventory/getMyDexShared/addItems/ITEM_INFO/POKEMON_XP_PER_LEVEL) and
// battle-engine.js (for computeBattleStats) - load both before this file.
//
// ITEM_INFO (pokedex-data.js) stays the single source for name/emoji so the
// bag screen (which doesn't need prices) keeps working unchanged; this
// catalog layers price/description/category/effect/usableIn on top of it.
const ITEM_CATALOG = {
  pokeball: Object.assign({ id: "pokeball", price: 50,
    description: "Vahşi Pokémon yakalamak için temel top.",
    category: "ball", effect: { type: "catch", multiplier: 1 }, usableIn: ["wild-battle"] }, ITEM_INFO.pokeball),
  greatball: Object.assign({ id: "greatball", price: 150,
    description: "Poké Ball'dan daha yüksek yakalama şansı.",
    category: "ball", effect: { type: "catch", multiplier: 1.5 }, usableIn: ["wild-battle"] }, ITEM_INFO.greatball),
  ultraball: Object.assign({ id: "ultraball", price: 400,
    description: "En yüksek yakalama şansına sahip top.",
    category: "ball", effect: { type: "catch", multiplier: 2 }, usableIn: ["wild-battle"] }, ITEM_INFO.ultraball),
  potion: Object.assign({ id: "potion", price: 100,
    description: "Bir Pokémon'un HP'sini biraz iyileştirir.",
    category: "healing", effect: { type: "heal", amount: 20 }, usableIn: ["wild-battle", "trainer-hq"] }, ITEM_INFO.potion),
  "super-potion": Object.assign({ id: "super-potion", price: 250,
    description: "Bir Pokémon'un HP'sini büyük ölçüde iyileştirir.",
    category: "healing", effect: { type: "heal", amount: 50 }, usableIn: ["wild-battle", "trainer-hq"] }, ITEM_INFO["super-potion"]),
  revive: Object.assign({ id: "revive", price: 300,
    description: "Baygın bir Pokémon'u yarı HP ile tekrar savaşabilir hale getirir.",
    category: "healing", effect: { type: "revive", hpFraction: 0.5 }, usableIn: ["trainer-hq"] }, ITEM_INFO.revive),
  berry: Object.assign({ id: "berry", price: 30,
    description: "Küçük bir HP iyileştirmesi sağlar.",
    category: "healing", effect: { type: "heal", amount: 10 }, usableIn: ["wild-battle"] }, ITEM_INFO.berry),
  "rare-candy": Object.assign({ id: "rare-candy", price: 500,
    description: "Seçtiğin Pokémon'u anında 1 seviye yükseltir.",
    category: "growth", effect: { type: "level-up", levels: 1 }, usableIn: ["trainer-hq"] }, ITEM_INFO["rare-candy"]),
  "evolution-stone": Object.assign({ id: "evolution-stone", price: 600,
    description: "Bazı Pokémon'ları evrimleştirmek için kullanılır. (Evrim sistemi yakında)",
    category: "evolution", effect: { type: "evolve" }, usableIn: ["trainer-hq"] }, ITEM_INFO["evolution-stone"])
};

function computeMonMaxHp(mon) {
  return computeBattleStats(mon.stats || {}, mon.level || 1).maxHp;
}

// currentHp is optional on older entries (before this phase); anything
// missing it is simply treated as full HP until it takes damage once.
function computeMonCurrentHp(mon) {
  const maxHp = computeMonMaxHp(mon);
  if (mon.fainted) return 0;
  return mon.currentHp != null ? Math.min(mon.currentHp, maxHp) : maxHp;
}

function findMonIndex(mydex, instanceId) {
  return mydex.findIndex(p => p.instanceId === instanceId);
}

// Every apply* function re-reads inventory/mydex fresh and re-checks its own
// preconditions right before writing, so calling one twice in a row (e.g. a
// double click) just fails the second time with a clear reason instead of
// double-spending the item.
function applyHealItem(instanceId, itemKey) {
  const item = ITEM_CATALOG[itemKey];
  if (!item || item.effect.type !== "heal") return { ok: false, reason: "invalid-item" };
  const inv = getInventory();
  if ((inv[itemKey] || 0) <= 0) return { ok: false, reason: "no-item" };
  const mydex = getMyDexShared();
  const idx = findMonIndex(mydex, instanceId);
  if (idx === -1) return { ok: false, reason: "not-found" };
  const mon = mydex[idx];
  if (mon.fainted) return { ok: false, reason: "fainted" };
  const maxHp = computeMonMaxHp(mon);
  const curHp = computeMonCurrentHp(mon);
  if (curHp >= maxHp) return { ok: false, reason: "full-hp" };
  const newHp = Math.min(maxHp, curHp + item.effect.amount);
  mydex[idx] = Object.assign({}, mon, { currentHp: newHp });
  saveMyDexShared(mydex);
  addItems(itemKey, -1);
  return { ok: true, newHp, maxHp };
}

function applyRevive(instanceId, itemKey) {
  itemKey = itemKey || "revive";
  const inv = getInventory();
  if ((inv[itemKey] || 0) <= 0) return { ok: false, reason: "no-item" };
  const mydex = getMyDexShared();
  const idx = findMonIndex(mydex, instanceId);
  if (idx === -1) return { ok: false, reason: "not-found" };
  const mon = mydex[idx];
  if (!mon.fainted) return { ok: false, reason: "not-fainted" };
  const maxHp = computeMonMaxHp(mon);
  const item = ITEM_CATALOG[itemKey];
  const newHp = Math.max(1, Math.round(maxHp * (item.effect.hpFraction || 0.5)));
  mydex[idx] = Object.assign({}, mon, { fainted: false, currentHp: newHp });
  saveMyDexShared(mydex);
  addItems(itemKey, -1);
  return { ok: true, newHp };
}

function applyRareCandy(instanceId) {
  const inv = getInventory();
  if ((inv["rare-candy"] || 0) <= 0) return { ok: false, reason: "no-item" };
  const mydex = getMyDexShared();
  const idx = findMonIndex(mydex, instanceId);
  if (idx === -1) return { ok: false, reason: "not-found" };
  const mon = mydex[idx];
  if ((mon.level || 1) >= 100) return { ok: false, reason: "max-level" };
  const oldMaxHp = computeMonMaxHp(mon);
  const oldCurrentHp = computeMonCurrentHp(mon);
  const newLevel = (mon.level || 1) + 1;
  // Keep pxp consistent with the new level so a later battle XP gain
  // computes the right next level (never lower than what levelInfo implies).
  const newPxp = Math.max(mon.pxp || 0, (newLevel - 1) * POKEMON_XP_PER_LEVEL);
  const newMaxHp = computeMonMaxHp(Object.assign({}, mon, { level: newLevel }));
  const newCurrentHp = Math.min(newMaxHp, oldCurrentHp + (newMaxHp - oldMaxHp));
  mydex[idx] = Object.assign({}, mon, { level: newLevel, pxp: newPxp, currentHp: newCurrentHp });
  saveMyDexShared(mydex);
  addItems("rare-candy", -1);
  return { ok: true, newLevel };
}

// Free, unlimited, heals and revives every owned Pokemon - the Pokemon Center.
function healAllAtPokemonCenter() {
  const mydex = getMyDexShared();
  const healed = mydex.map(p => Object.assign({}, p, { fainted: false, currentHp: computeMonMaxHp(p) }));
  saveMyDexShared(healed);
  return healed.length;
}

// ---- PokeCoin purchases (single spend path so "insufficient funds" and
// "never negative" are enforced in exactly one place) ----
function buyItem(itemId) {
  const item = ITEM_CATALOG[itemId];
  if (!item) return { ok: false, reason: "invalid-item" };
  if (!spendCoins(item.price)) return { ok: false, reason: "insufficient-coins" };
  addItems(itemId, 1);
  return { ok: true, newCoins: getPlayer().coins };
}
