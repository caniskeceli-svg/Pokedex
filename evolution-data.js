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
  { fromId: 74, toId: 75, method: "level", level: 25 }, // Geodude -> Graveler

  // Phase 10B: Johto wild-encounter species. Same rules as Kanto above -
  // trade-only evolutions (Kadabra->Alakazam, Haunter->Gengar) are left out
  // since this catalog has no trade mechanic, matching how Kanto already
  // omits them; "stone" here is the same generic Evolution Stone item as
  // Kanto's Pikachu/Nidoran/Clefairy lines, not a specific real stone type.
  { fromId: 161, toId: 162, method: "level", level: 15 }, // Sentret -> Furret
  { fromId: 163, toId: 164, method: "level", level: 20 }, // Hoothoot -> Noctowl
  { fromId: 165, toId: 166, method: "level", level: 18 }, // Ledyba -> Ledian
  { fromId: 167, toId: 168, method: "level", level: 22 }, // Spinarak -> Ariados
  { fromId: 179, toId: 180, method: "level", level: 15 }, // Mareep -> Flaaffy
  { fromId: 187, toId: 188, method: "level", level: 18 }, // Hoppip -> Skiploom
  { fromId: 220, toId: 221, method: "level", level: 33 }, // Swinub -> Piloswine
  { fromId: 43, toId: 44, method: "level", level: 21 },   // Oddish -> Gloom
  { fromId: 44, toId: 45, method: "stone" },              // Gloom -> Vileplume (Evolution Stone)
  { fromId: 48, toId: 49, method: "level", level: 31 },   // Venonat -> Venomoth
  { fromId: 52, toId: 53, method: "level", level: 28 },   // Meowth -> Persian
  { fromId: 56, toId: 57, method: "level", level: 28 },   // Mankey -> Primeape
  { fromId: 58, toId: 59, method: "stone" },              // Growlithe -> Arcanine (Evolution Stone)
  { fromId: 63, toId: 64, method: "level", level: 16 },   // Abra -> Kadabra
  { fromId: 79, toId: 80, method: "level", level: 37 },   // Slowpoke -> Slowbro
  { fromId: 81, toId: 82, method: "level", level: 30 },   // Magnemite -> Magneton
  { fromId: 88, toId: 89, method: "level", level: 38 },   // Grimer -> Muk
  { fromId: 92, toId: 93, method: "level", level: 25 },   // Gastly -> Haunter
  { fromId: 96, toId: 97, method: "level", level: 26 },   // Drowzee -> Hypno
  { fromId: 129, toId: 130, method: "level", level: 20 }, // Magikarp -> Gyarados
  { fromId: 183, toId: 184, method: "level", level: 18 }, // Marill -> Azumarill
  { fromId: 191, toId: 192, method: "stone" },            // Sunkern -> Sunflora (Evolution Stone)

  // Phase 14: Hoenn wild-encounter species. Same rules as Kanto/Johto above.
  // Two mechanics this catalog can't model natively get the smallest
  // compatible substitute rather than a new mechanic:
  //  - Feebas -> Milotic normally requires a high Beauty/contest stat (no
  //    such stat exists anywhere in this app) - reuses the existing
  //    generic "stone" method exactly like every other non-level Kanto/
  //    Johto evolution already does for real stone-types.
  //  - Nincada -> Ninjask normally also spawns a bonus Shedinja - only the
  //    Ninjask evolution itself is implemented, as a plain level evolution;
  //    no bonus-Pokemon mechanic is introduced.
  // Clamperl -> Huntail/Gorebyss requires trade + a held item, so (matching
  // this catalog's existing, already-documented Kadabra/Haunter precedent
  // of leaving trade-only evolutions out entirely) it has no entry at all -
  // Clamperl simply never evolves in this app.
  { fromId: 261, toId: 262, method: "level", level: 18 },  // Poochyena -> Mightyena
  { fromId: 263, toId: 264, method: "level", level: 20 },  // Zigzagoon -> Linoone
  { fromId: 270, toId: 271, method: "level", level: 14 },  // Lotad -> Lombre
  { fromId: 273, toId: 274, method: "level", level: 14 },  // Seedot -> Nuzleaf
  { fromId: 276, toId: 277, method: "level", level: 22 },  // Taillow -> Swellow
  { fromId: 278, toId: 279, method: "level", level: 25 },  // Wingull -> Pelipper
  { fromId: 280, toId: 281, method: "level", level: 20 },  // Ralts -> Kirlia
  { fromId: 281, toId: 282, method: "level", level: 30 },  // Kirlia -> Gardevoir
  { fromId: 285, toId: 286, method: "level", level: 23 },  // Shroomish -> Breloom
  { fromId: 287, toId: 288, method: "level", level: 18 },  // Slakoth -> Vigoroth
  { fromId: 288, toId: 289, method: "level", level: 36 },  // Vigoroth -> Slaking
  { fromId: 290, toId: 291, method: "level", level: 20 },  // Nincada -> Ninjask (Shedinja bonus-spawn not modeled)
  { fromId: 293, toId: 294, method: "level", level: 20 },  // Whismur -> Loudred
  { fromId: 294, toId: 295, method: "level", level: 40 },  // Loudred -> Exploud
  { fromId: 296, toId: 297, method: "level", level: 24 },  // Makuhita -> Hariyama
  { fromId: 304, toId: 305, method: "level", level: 32 },  // Aron -> Lairon
  { fromId: 305, toId: 306, method: "level", level: 42 },  // Lairon -> Aggron
  { fromId: 307, toId: 308, method: "level", level: 37 },  // Meditite -> Medicham
  { fromId: 309, toId: 310, method: "level", level: 26 },  // Electrike -> Manectric
  { fromId: 322, toId: 323, method: "level", level: 33 },  // Numel -> Camerupt
  { fromId: 325, toId: 326, method: "level", level: 32 },  // Spoink -> Grumpig
  { fromId: 328, toId: 329, method: "level", level: 35 },  // Trapinch -> Vibrava
  { fromId: 329, toId: 330, method: "level", level: 45 },  // Vibrava -> Flygon
  { fromId: 331, toId: 332, method: "level", level: 32 },  // Cacnea -> Cacturne
  { fromId: 333, toId: 334, method: "level", level: 35 },  // Swablu -> Altaria
  { fromId: 339, toId: 340, method: "level", level: 30 },  // Barboach -> Whiscash
  { fromId: 341, toId: 342, method: "level", level: 30 },  // Corphish -> Crawdaunt
  { fromId: 343, toId: 344, method: "level", level: 36 },  // Baltoy -> Claydol
  { fromId: 349, toId: 350, method: "stone" },             // Feebas -> Milotic (Evolution Stone, substitutes Beauty)
  { fromId: 353, toId: 354, method: "level", level: 37 },  // Shuppet -> Banette
  { fromId: 355, toId: 356, method: "level", level: 37 },  // Duskull -> Dusclops
  { fromId: 361, toId: 362, method: "level", level: 42 },  // Snorunt -> Glalie
  { fromId: 363, toId: 364, method: "level", level: 32 },  // Spheal -> Sealeo
  { fromId: 364, toId: 365, method: "level", level: 44 },  // Sealeo -> Walrein
  { fromId: 371, toId: 372, method: "level", level: 30 },  // Bagon -> Shelgon
  { fromId: 372, toId: 373, method: "level", level: 50 },  // Shelgon -> Salamence
  { fromId: 374, toId: 375, method: "level", level: 20 },  // Beldum -> Metang
  { fromId: 375, toId: 376, method: "level", level: 45 },  // Metang -> Metagross

  // ---- Sinnoh (Phase 15) ----
  // Same rules as every region above - level/stone only. Several real
  // Sinnoh evolutions use mechanics this catalog can't model (friendship,
  // held item + time of day, trade + item, gender + Dawn Stone) and are
  // deliberately left absent rather than approximated with a fake
  // level/stone requirement, exactly like the existing Kadabra/Haunter
  // trade-evolution precedent:
  //  - Budew -> Roselia (friendship, day) - Budew has no evolution here.
  //  - Chingling -> Chimecho (friendship, night) - no evolution here.
  //  - Buneary -> Lopunny (friendship) - not added to any encounter table.
  //  - Sneasel -> Weavile (Razor Claw held at night) - Sneasel is the final
  //    player-obtainable form; Weavile is wild-catchable directly instead
  //    (see route-222/victory-road-sinnoh).
  //  - Rhydon -> Rhyperior, Electabuzz -> Electivire, Magmar -> Magmortar
  //    (trade + held item) - left absent; the fully-evolved forms still
  //    appear as enemy-only Gym/League Pokemon (Bertha, Volkner) exactly
  //    like Erika's non-wild-catchable Tangela already does in Kanto.
  //  - Snorunt(female) -> Froslass (Dawn Stone) - left absent; the existing
  //    Snorunt -> Glalie level-42 entry above is Snorunt's only reachable
  //    path regardless of gender, since this engine has no gender field.
  //  - Machoke -> Machamp (trade only) - left absent, same rule as Kadabra/
  //    Haunter.
  { fromId: 396, toId: 397, method: "level", level: 18 },  // Starly -> Staravia
  { fromId: 397, toId: 398, method: "level", level: 34 },  // Staravia -> Staraptor
  { fromId: 399, toId: 400, method: "level", level: 15 },  // Bidoof -> Bibarel
  { fromId: 401, toId: 402, method: "level", level: 10 },  // Kricketot -> Kricketune
  { fromId: 403, toId: 404, method: "level", level: 15 },  // Shinx -> Luxio
  { fromId: 404, toId: 405, method: "level", level: 30 },  // Luxio -> Luxray
  { fromId: 418, toId: 419, method: "level", level: 26 },  // Buizel -> Floatzel
  { fromId: 422, toId: 423, method: "level", level: 30 },  // Shellos -> Gastrodon
  { fromId: 425, toId: 426, method: "level", level: 28 },  // Drifloon -> Drifblim
  { fromId: 436, toId: 437, method: "level", level: 33 },  // Bronzor -> Bronzong
  { fromId: 443, toId: 444, method: "level", level: 24 },  // Gible -> Gabite
  { fromId: 444, toId: 445, method: "level", level: 48 },  // Gabite -> Garchomp
  { fromId: 449, toId: 450, method: "level", level: 34 },  // Hippopotas -> Hippowdon
  { fromId: 451, toId: 452, method: "level", level: 40 },  // Skorupi -> Drapion
  { fromId: 453, toId: 454, method: "level", level: 37 },  // Croagunk -> Toxicroak
  { fromId: 456, toId: 457, method: "level", level: 31 },  // Finneon -> Lumineon
  { fromId: 459, toId: 460, method: "level", level: 40 },  // Snover -> Abomasnow
  { fromId: 66, toId: 67, method: "level", level: 28 },    // Machop -> Machoke
  { fromId: 77, toId: 78, method: "level", level: 40 }     // Ponyta -> Rapidash
];

function getEvolutionFor(speciesId) {
  return EVOLUTION_CATALOG.find(e => e.fromId === speciesId) || null;
}

function getPrevEvolutionFor(speciesId) {
  return EVOLUTION_CATALOG.find(e => e.toId === speciesId) || null;
}

// Walks EVOLUTION_CATALOG in both directions to build the full family line
// for any species that appears in it - e.g. calling this with Charmeleon's
// id returns the whole Charmander -> Charmeleon -> Charizard line, not just
// what comes after Charmeleon. Purely derived from the existing catalog, no
// new data. Each entry is { id, viaEntry } where viaEntry is the catalog
// entry that leads INTO this id (null for the line's base form), so the UI
// can label each arrow with its level/stone requirement.
function getEvolutionChainFor(speciesId) {
  if (!getEvolutionFor(speciesId) && !getPrevEvolutionFor(speciesId)) return [];
  let base = speciesId;
  let guard = 0;
  while (getPrevEvolutionFor(base) && guard++ < 10) base = getPrevEvolutionFor(base).fromId;
  const chain = [{ id: base, viaEntry: null }];
  let cur = base;
  guard = 0;
  while (getEvolutionFor(cur) && guard++ < 10) {
    const entry = getEvolutionFor(cur);
    chain.push({ id: entry.toId, viaEntry: entry });
    cur = entry.toId;
  }
  return chain;
}

function evoRequirementLabel(entry) {
  if (!entry) return '';
  return entry.method === 'level' ? `Lv.${entry.level}` : '💎 Taş';
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
    // evolutionHistory records every species this exact instance has ever
    // been, oldest first - a Pokemon caught before this field existed simply
    // starts its own history right here instead of having no prior entry.
    const priorHistory = Array.isArray(freshMon.evolutionHistory) && freshMon.evolutionHistory.length
      ? freshMon.evolutionHistory
      : [{ id: freshMon.id, name: freshMon.name, level: freshMon.level || 1, at: freshMon.caughtAt || Date.now() }];
    const evolved = Object.assign({}, freshMon, {
      id: newSpecies.id,
      name: newSpecies.name,
      img: newSpecies.img,
      types: newSpecies.types,
      stats: newSpecies.stats,
      power: newSpecies.power,
      currentHp: newCurrentHp,
      evolutionHistory: [...priorHistory, { id: newSpecies.id, name: newSpecies.name, level: freshMon.level || 1, at: Date.now() }]
    });

    if (status.entry.method === "stone") {
      addAdventureItems("evolution-stone", -1);
    }
    freshDex[freshIdx] = evolved;
    saveAdventureDex(freshDex);

    // Phase 8: evolutionCount is the account-wide tally used by Evolution
    // achievements. Phase 22 added evolutionHistory (above) as the per-
    // instance record of which species THIS Pokemon has actually been, for
    // the HQ detail card's own timeline - the two serve different UIs, both
    // are kept.
    const player = getAdventurePlayer();
    player.evolutionCount = (player.evolutionCount || 0) + 1;
    pushAdventureCloudAtomic({ "player.evolutionCount": firebase.firestore.FieldValue.increment(1) });
    if (typeof recordAdventureEvent === "function") recordAdventureEvent("evolve_pokemon");

    return { ok: true, evolved, previous: { name: freshMon.name, img: freshMon.img } };
  } catch (e) {
    console.error("Evolution failed", e);
    return { ok: false, reason: "network-error" };
  } finally {
    evolutionLocked[instanceId] = false;
  }
}
