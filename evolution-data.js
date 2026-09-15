// ---- Adventure evolution system (Phase 5B) ----
// Data-driven: EVOLUTION_CATALOG is the only place species/level/stone
// requirements live, so adding more evolution lines later (Johto etc.) is
// just appending entries - no logic changes. Depends on adventure-state.js
// (getAdventureDex/saveAdventureDex/getAdventureInventory/addAdventureItems/
// fetchPokemonSpeciesData) and item-data.js (computeMonMaxHp/
// computeMonCurrentHp) and battle-engine.js - load all before this file.
// Evolution is never automatic: performEvolution() is only ever called from
// a player tapping an explicit "EVOLVE" button.
const EVOLUTION_CATALOG = [
  { fromId: 1, toId: 2, method: "level", level: 16 },   // Bulbasaur -> Ivysaur
  { fromId: 2, toId: 3, method: "level", level: 32 },   // Ivysaur -> Venusaur
  { fromId: 4, toId: 5, method: "level", level: 16 },   // Charmander -> Charmeleon
  { fromId: 5, toId: 6, method: "level", level: 36 },   // Charmeleon -> Charizard
  { fromId: 7, toId: 8, method: "level", level: 16 },   // Squirtle -> Wartortle
  { fromId: 8, toId: 9, method: "level", level: 36 },   // Wartortle -> Blastoise
  { fromId: 10, toId: 11, method: "level", level: 7 },  // Caterpie -> Metapod
  { fromId: 11, toId: 12, method: "level", level: 10 }, // Metapod -> Butterfree
  { fromId: 13, toId: 14, method: "level", level: 7 },  // Weedle -> Kakuna
  { fromId: 14, toId: 15, method: "level", level: 10 }, // Kakuna -> Beedrill
  { fromId: 16, toId: 17, method: "level", level: 18 }, // Pidgey -> Pidgeotto
  { fromId: 17, toId: 18, method: "level", level: 36 }, // Pidgeotto -> Pidgeot
  { fromId: 19, toId: 20, method: "level", level: 20 }, // Rattata -> Raticate
  { fromId: 21, toId: 22, method: "level", level: 20 }, // Spearow -> Fearow
  { fromId: 25, toId: 26, method: "stone" },            // Pikachu -> Raichu (Evolution Stone)
  { fromId: 27, toId: 28, method: "level", level: 22 }, // Sandshrew -> Sandslash
  { fromId: 29, toId: 30, method: "level", level: 16 }, // Nidoran-F -> Nidorina
  { fromId: 30, toId: 31, method: "stone" },            // Nidorina -> Nidoqueen (Evolution Stone)
  { fromId: 32, toId: 33, method: "level", level: 16 }, // Nidoran-M -> Nidorino
  { fromId: 33, toId: 34, method: "stone" },            // Nidorino -> Nidoking (Evolution Stone)
  { fromId: 35, toId: 36, method: "stone" },            // Clefairy -> Clefable (Evolution Stone)
  { fromId: 41, toId: 42, method: "level", level: 22 }, // Zubat -> Golbat
  { fromId: 46, toId: 47, method: "level", level: 24 }, // Paras -> Parasect
  { fromId: 74, toId: 75, method: "level", level: 25 }  // Geodude -> Graveler
];

function getEvolutionFor(speciesId) {
  return EVOLUTION_CATALOG.find(e => e.fromId === speciesId) || null;
}

// Returns null if this species has no evolution at all, otherwise
// { entry, ready, blockedReason } - blockedReason is only set when there IS
// an evolution path but it can't happen yet (level too low / no stone), so
// the UI can explain why instead of just hiding the option.
function checkEvolutionStatus(mon) {
  const entry = getEvolutionFor(mon.id);
  if (!entry) return null;
  if (entry.method === "level") {
    const ready = (mon.level || 1) >= entry.level;
    return { entry, ready, blockedReason: ready ? null : `Lv.${entry.level} gerekli (şu an Lv.${mon.level || 1})` };
  }
  // stone
  const hasStone = (getAdventureInventory()["evolution-stone"] || 0) > 0;
  return { entry, ready: hasStone, blockedReason: hasStone ? null : "Evrim Taşı gerekli" };
}

let evolutionLocked = {};

// Fully re-validates everything at write time (not just what the UI already
// checked), so a stale button, a double click, or two calls racing each
// other can never evolve twice or consume two stones for one evolution.
async function performEvolution(instanceId) {
  if (evolutionLocked[instanceId]) return { ok: false, reason: "in-progress" };
  evolutionLocked[instanceId] = true;
  try {
    const mydex = getAdventureDex();
    const idx = mydex.findIndex(p => p.instanceId === instanceId);
    if (idx === -1) return { ok: false, reason: "not-found" };
    const mon = mydex[idx];
    const status = checkEvolutionStatus(mon);
    if (!status) return { ok: false, reason: "no-evolution" };
    if (!status.ready) return { ok: false, reason: status.entry.method === "level" ? "level-too-low" : "no-stone" };

    const newSpecies = await fetchPokemonSpeciesData(status.entry.toId);

    // Re-check after the network round trip: another call (or another tab)
    // could have already evolved or altered this exact Pokemon meanwhile.
    const freshDex = getAdventureDex();
    const freshIdx = freshDex.findIndex(p => p.instanceId === instanceId);
    if (freshIdx === -1) return { ok: false, reason: "not-found" };
    const freshMon = freshDex[freshIdx];
    if (freshMon.id !== mon.id) return { ok: false, reason: "already-evolved" };
    if (status.entry.method === "stone" && (getAdventureInventory()["evolution-stone"] || 0) <= 0) {
      return { ok: false, reason: "no-stone" };
    }

    // Same HP-carry rule as Rare Candy (Phase 4): current HP moves by the
    // same amount max HP changed, capped at the new max, 0 if fainted.
    const oldMaxHp = computeMonMaxHp(freshMon);
    const oldCurrentHp = computeMonCurrentHp(freshMon);
    const newMaxHp = computeBattleStats(newSpecies.stats, freshMon.level || 1).maxHp;
    const newCurrentHp = freshMon.fainted ? 0 : Math.min(newMaxHp, oldCurrentHp + (newMaxHp - oldMaxHp));

    // Only species-derived fields change; instanceId and every piece of
    // instance metadata (level/pxp/friendship/shiny/source/caughtAt/
    // favorite/nickname/fainted) are carried over untouched via the spread.
    const evolved = Object.assign({}, freshMon, {
      id: newSpecies.id,
      name: newSpecies.name,
      img: newSpecies.img,
      types: newSpecies.types,
      stats: newSpecies.stats,
      power: newSpecies.power,
      currentHp: newCurrentHp
    });

    if (status.entry.method === "stone") {
      addAdventureItems("evolution-stone", -1);
    }
    freshDex[freshIdx] = evolved;
    saveAdventureDex(freshDex);
    return { ok: true, evolved };
  } catch (e) {
    console.error("Evolution failed", e);
    return { ok: false, reason: "network-error" };
  } finally {
    evolutionLocked[instanceId] = false;
  }
}
