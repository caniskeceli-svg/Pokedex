// ---- Adventure RPG: region / location / encounter data (Phase 2) ----
// Pure data, no logic tied to battle/catch yet (that's Phase 3+). Loading
// this file is opt-in (only adventure.html includes it) so every other
// page's behavior is completely unaffected by its presence.
//
// A LOCATION becomes unlocked once the location named in its `requires`
// field has been visited (see isLocationUnlocked() below). A location with
// `requires: null` is always unlocked - Kanto's starting town.

const REGIONS = {
  kanto: { id: "kanto", name: "Kanto", order: 1, unlocked: true },
  johto: { id: "johto", name: "Johto", order: 2, unlocked: false },
  hoenn: { id: "hoenn", name: "Hoenn", order: 3, unlocked: false },
  sinnoh: { id: "sinnoh", name: "Sinnoh", order: 4, unlocked: false },
  unova: { id: "unova", name: "Unova", order: 5, unlocked: false },
  kalos: { id: "kalos", name: "Kalos", order: 6, unlocked: false },
  alola: { id: "alola", name: "Alola", order: 7, unlocked: false },
  galar: { id: "galar", name: "Galar", order: 8, unlocked: false },
  paldea: { id: "paldea", name: "Paldea", order: 9, unlocked: false }
};

// encounters: [{ speciesId, minLevel, maxLevel, weight }]
// weight is relative (doesn't need to sum to 100) - higher = more common.
const LOCATIONS = [
  {
    id: "pallet-town", region: "kanto", name: "Pallet Town", type: "town",
    order: 1, requires: null, gymId: null, encounters: []
  },
  {
    id: "route-1", region: "kanto", name: "Route 1", type: "route",
    order: 2, requires: "pallet-town", gymId: null,
    encounters: [
      { speciesId: 16, minLevel: 2, maxLevel: 4, weight: 50 }, // Pidgey
      { speciesId: 19, minLevel: 2, maxLevel: 4, weight: 50 }  // Rattata
    ]
  },
  {
    id: "viridian-city", region: "kanto", name: "Viridian City", type: "town",
    order: 3, requires: "route-1", gymId: "viridian", encounters: []
  },
  {
    id: "viridian-forest", region: "kanto", name: "Viridian Forest", type: "route",
    order: 4, requires: "viridian-city", gymId: null,
    encounters: [
      { speciesId: 10, minLevel: 3, maxLevel: 5, weight: 30 }, // Caterpie
      { speciesId: 11, minLevel: 4, maxLevel: 6, weight: 15 }, // Metapod
      { speciesId: 13, minLevel: 3, maxLevel: 5, weight: 30 }, // Weedle
      { speciesId: 14, minLevel: 4, maxLevel: 6, weight: 15 }, // Kakuna
      { speciesId: 25, minLevel: 4, maxLevel: 7, weight: 5 }   // Pikachu (rare)
    ]
  },
  {
    id: "pewter-city", region: "kanto", name: "Pewter City", type: "town",
    order: 5, requires: "viridian-forest", gymId: "pewter", encounters: []
  },
  {
    id: "route-3", region: "kanto", name: "Route 3", type: "route",
    order: 6, requires: "pewter-city", gymId: null,
    encounters: [
      { speciesId: 16, minLevel: 6, maxLevel: 9, weight: 25 },  // Pidgey
      { speciesId: 21, minLevel: 6, maxLevel: 9, weight: 25 },  // Spearow
      { speciesId: 27, minLevel: 6, maxLevel: 9, weight: 25 },  // Sandshrew
      { speciesId: 29, minLevel: 6, maxLevel: 9, weight: 12 },  // Nidoran-F
      { speciesId: 32, minLevel: 6, maxLevel: 9, weight: 13 }   // Nidoran-M
    ]
  },
  {
    id: "mt-moon", region: "kanto", name: "Mt. Moon", type: "route",
    order: 7, requires: "route-3", gymId: null,
    encounters: [
      { speciesId: 41, minLevel: 7, maxLevel: 10, weight: 40 }, // Zubat
      { speciesId: 46, minLevel: 7, maxLevel: 10, weight: 25 }, // Paras
      { speciesId: 74, minLevel: 7, maxLevel: 10, weight: 25 }, // Geodude
      { speciesId: 35, minLevel: 8, maxLevel: 10, weight: 10 }  // Clefairy (rare)
    ]
  },
  {
    id: "cerulean-city", region: "kanto", name: "Cerulean City", type: "town",
    order: 8, requires: "mt-moon", gymId: "cerulean", encounters: []
  },
  // Phase 6: the remaining Gym cities, chained on so every Kanto Gym has a
  // real map node (no new routes/encounters between them yet - that's a
  // separate, later expansion of the map itself, not this phase's scope).
  {
    id: "vermilion-city", region: "kanto", name: "Vermilion City", type: "town",
    order: 9, requires: "cerulean-city", gymId: "vermilion", encounters: []
  },
  {
    id: "celadon-city", region: "kanto", name: "Celadon City", type: "town",
    order: 10, requires: "vermilion-city", gymId: "celadon", encounters: []
  },
  {
    id: "fuchsia-city", region: "kanto", name: "Fuchsia City", type: "town",
    order: 11, requires: "celadon-city", gymId: "fuchsia", encounters: []
  },
  {
    id: "saffron-city", region: "kanto", name: "Saffron City", type: "town",
    order: 12, requires: "fuchsia-city", gymId: "saffron", encounters: []
  },
  {
    id: "cinnabar-island", region: "kanto", name: "Cinnabar Island", type: "town",
    order: 13, requires: "saffron-city", gymId: "cinnabar", encounters: []
  },
  // Phase 7: the Pokemon League itself, reachable once Viridian City (the
  // last Gym stop) is visited. Whether its Challenge is actually available
  // depends on holding all 8 badges - that's leagueStatus()/league-data.js,
  // completely separate from this map-reachability check.
  {
    id: "pokemon-league", region: "kanto", name: "Pokémon League", type: "town",
    order: 14, requires: "viridian-city", gymId: null, leagueId: "kanto", encounters: []
  },

  // ---- Johto (Phase 10A) ----
  // Map/progression data only - no Gym catalog, no wild battle changes, no
  // starter gate. Reachability here (isLocationUnlocked, via `requires`) is
  // completely separate from whether the Johto REGION itself is unlocked
  // (isRegionUnlocked in league-data.js, gated on Kanto Champion) - a fresh
  // Adventure's `requires: null` New Bark Town would otherwise look
  // "reachable" on its own chain even before Johto unlocks, so
  // adventure.html's region tabs check isRegionUnlocked before ever
  // rendering any Johto node at all. `gymId` is deliberately left null on
  // every Johto town (even the real Gym cities) rather than added as a
  // forward-looking placeholder: gym-data.js has no Johto catalog yet, and
  // a set gymId would already draw a "🏟️ Gym" tag/badge on the map (see
  // renderPath()'s tag logic) for a battle that doesn't exist - Phase 10C
  // adds the field and the catalog together.
  {
    id: "new-bark-town", region: "johto", name: "New Bark Town", type: "town",
    order: 1, requires: null, gymId: null, encounters: []
  },
  {
    id: "route-29", region: "johto", name: "Route 29", type: "route",
    order: 2, requires: "new-bark-town", gymId: null,
    encounters: [
      { speciesId: 163, minLevel: 3, maxLevel: 5, weight: 30 }, // Hoothoot
      { speciesId: 16, minLevel: 2, maxLevel: 4, weight: 30 },  // Pidgey
      { speciesId: 19, minLevel: 2, maxLevel: 4, weight: 25 },  // Rattata
      { speciesId: 161, minLevel: 2, maxLevel: 4, weight: 15 }  // Sentret
    ]
  },
  {
    id: "cherrygrove-city", region: "johto", name: "Cherrygrove City", type: "town",
    order: 3, requires: "route-29", gymId: null, encounters: []
  },
  {
    id: "route-30", region: "johto", name: "Route 30", type: "route",
    order: 4, requires: "cherrygrove-city", gymId: null,
    encounters: [
      { speciesId: 163, minLevel: 4, maxLevel: 6, weight: 25 }, // Hoothoot
      { speciesId: 10, minLevel: 3, maxLevel: 5, weight: 25 },  // Caterpie
      { speciesId: 11, minLevel: 4, maxLevel: 6, weight: 10 },  // Metapod
      { speciesId: 167, minLevel: 3, maxLevel: 5, weight: 20 }, // Spinarak
      { speciesId: 165, minLevel: 3, maxLevel: 5, weight: 20 }  // Ledyba
    ]
  },
  {
    id: "route-31", region: "johto", name: "Route 31", type: "route",
    order: 5, requires: "route-30", gymId: null,
    encounters: [
      { speciesId: 69, minLevel: 4, maxLevel: 6, weight: 30 },  // Bellsprout
      { speciesId: 16, minLevel: 4, maxLevel: 6, weight: 25 },  // Pidgey
      { speciesId: 19, minLevel: 4, maxLevel: 6, weight: 25 },  // Rattata
      { speciesId: 163, minLevel: 4, maxLevel: 6, weight: 20 }  // Hoothoot
    ]
  },
  {
    id: "violet-city", region: "johto", name: "Violet City", type: "town",
    order: 6, requires: "route-31", gymId: "johto_violet", encounters: []
  },
  {
    id: "sprout-tower", region: "johto", name: "Sprout Tower", type: "route",
    order: 7, requires: "violet-city", gymId: null, encounters: []
  },
  {
    id: "route-32", region: "johto", name: "Route 32", type: "route",
    order: 8, requires: "violet-city", gymId: null,
    encounters: [
      { speciesId: 41, minLevel: 5, maxLevel: 7, weight: 30 },  // Zubat
      { speciesId: 69, minLevel: 5, maxLevel: 7, weight: 25 },  // Bellsprout
      { speciesId: 19, minLevel: 5, maxLevel: 7, weight: 25 },  // Rattata
      { speciesId: 95, minLevel: 6, maxLevel: 8, weight: 5 }    // Onix (rare)
    ]
  },
  {
    id: "union-cave", region: "johto", name: "Union Cave", type: "route",
    order: 9, requires: "route-32", gymId: null,
    encounters: [
      { speciesId: 41, minLevel: 6, maxLevel: 8, weight: 35 },  // Zubat
      { speciesId: 74, minLevel: 6, maxLevel: 8, weight: 25 },  // Geodude
      { speciesId: 95, minLevel: 8, maxLevel: 10, weight: 10 }, // Onix
      { speciesId: 79, minLevel: 6, maxLevel: 8, weight: 15 }   // Slowpoke
    ]
  },
  {
    id: "route-33", region: "johto", name: "Route 33", type: "route",
    order: 10, requires: "union-cave", gymId: null,
    encounters: [
      { speciesId: 19, minLevel: 6, maxLevel: 8, weight: 25 },  // Rattata
      { speciesId: 21, minLevel: 6, maxLevel: 8, weight: 25 },  // Spearow
      { speciesId: 56, minLevel: 6, maxLevel: 8, weight: 25 },  // Mankey
      { speciesId: 69, minLevel: 6, maxLevel: 8, weight: 25 }   // Bellsprout
    ]
  },
  {
    id: "azalea-town", region: "johto", name: "Azalea Town", type: "town",
    order: 11, requires: "route-33", gymId: "johto_azalea", encounters: []
  },
  {
    id: "slowpoke-well", region: "johto", name: "Slowpoke Well", type: "route",
    order: 12, requires: "azalea-town", gymId: null,
    encounters: [
      { speciesId: 79, minLevel: 7, maxLevel: 9, weight: 60 }, // Slowpoke
      { speciesId: 41, minLevel: 7, maxLevel: 9, weight: 40 }  // Zubat
    ]
  },
  {
    id: "ilex-forest", region: "johto", name: "Ilex Forest", type: "route",
    order: 13, requires: "azalea-town", gymId: null,
    encounters: [
      { speciesId: 10, minLevel: 7, maxLevel: 9, weight: 25 },  // Caterpie
      { speciesId: 13, minLevel: 7, maxLevel: 9, weight: 25 },  // Weedle
      { speciesId: 11, minLevel: 8, maxLevel: 10, weight: 10 }, // Metapod
      { speciesId: 14, minLevel: 8, maxLevel: 10, weight: 10 }, // Kakuna
      { speciesId: 41, minLevel: 7, maxLevel: 9, weight: 15 },  // Zubat
      { speciesId: 43, minLevel: 8, maxLevel: 10, weight: 15 } // Oddish
    ]
  },
  {
    id: "goldenrod-city", region: "johto", name: "Goldenrod City", type: "town",
    order: 14, requires: "ilex-forest", gymId: "johto_goldenrod", encounters: []
  },
  {
    id: "route-34", region: "johto", name: "Route 34", type: "route",
    order: 15, requires: "goldenrod-city", gymId: null,
    encounters: [
      { speciesId: 63, minLevel: 10, maxLevel: 13, weight: 25 },  // Abra
      { speciesId: 96, minLevel: 10, maxLevel: 13, weight: 25 },  // Drowzee
      { speciesId: 81, minLevel: 10, maxLevel: 13, weight: 25 },  // Magnemite
      { speciesId: 165, minLevel: 10, maxLevel: 13, weight: 25 }  // Ledyba
    ]
  },
  {
    id: "route-35", region: "johto", name: "Route 35", type: "route",
    order: 16, requires: "route-34", gymId: null,
    encounters: [
      { speciesId: 165, minLevel: 11, maxLevel: 14, weight: 25 }, // Ledyba
      { speciesId: 167, minLevel: 11, maxLevel: 14, weight: 25 }, // Spinarak
      { speciesId: 187, minLevel: 11, maxLevel: 14, weight: 25 }, // Hoppip
      { speciesId: 16, minLevel: 11, maxLevel: 14, weight: 25 }   // Pidgey
    ]
  },
  {
    id: "national-park", region: "johto", name: "National Park", type: "route",
    order: 17, requires: "route-35", gymId: null,
    encounters: [
      { speciesId: 48, minLevel: 12, maxLevel: 15, weight: 30 },  // Venonat
      { speciesId: 165, minLevel: 12, maxLevel: 15, weight: 25 }, // Ledyba
      { speciesId: 167, minLevel: 12, maxLevel: 15, weight: 25 }, // Spinarak
      { speciesId: 191, minLevel: 12, maxLevel: 15, weight: 20 }  // Sunkern
    ]
  },
  {
    id: "route-36", region: "johto", name: "Route 36", type: "route",
    order: 18, requires: "national-park", gymId: null,
    encounters: [
      { speciesId: 179, minLevel: 13, maxLevel: 16, weight: 30 }, // Mareep
      { speciesId: 21, minLevel: 13, maxLevel: 16, weight: 30 },  // Spearow
      { speciesId: 19, minLevel: 13, maxLevel: 16, weight: 20 },  // Rattata
      { speciesId: 163, minLevel: 13, maxLevel: 16, weight: 20 }  // Hoothoot
    ]
  },
  {
    id: "route-37", region: "johto", name: "Route 37", type: "route",
    order: 19, requires: "route-36", gymId: null,
    encounters: [
      { speciesId: 179, minLevel: 14, maxLevel: 17, weight: 35 }, // Mareep
      { speciesId: 92, minLevel: 14, maxLevel: 17, weight: 30 },  // Gastly
      { speciesId: 16, minLevel: 14, maxLevel: 17, weight: 35 }   // Pidgey
    ]
  },
  {
    id: "ecruteak-city", region: "johto", name: "Ecruteak City", type: "town",
    order: 20, requires: "route-37", gymId: "johto_ecruteak", encounters: []
  },
  {
    id: "route-38", region: "johto", name: "Route 38", type: "route",
    order: 21, requires: "ecruteak-city", gymId: null,
    encounters: [
      { speciesId: 52, minLevel: 16, maxLevel: 19, weight: 35 }, // Meowth
      { speciesId: 81, minLevel: 16, maxLevel: 19, weight: 30 }, // Magnemite
      { speciesId: 88, minLevel: 16, maxLevel: 19, weight: 35 }  // Grimer
    ]
  },
  {
    id: "route-39", region: "johto", name: "Route 39", type: "route",
    order: 22, requires: "route-38", gymId: null,
    encounters: [
      { speciesId: 19, minLevel: 17, maxLevel: 20, weight: 35 },  // Rattata
      { speciesId: 69, minLevel: 17, maxLevel: 20, weight: 30 },  // Bellsprout
      { speciesId: 241, minLevel: 20, maxLevel: 22, weight: 10 }  // Miltank (rare)
    ]
  },
  {
    id: "olivine-city", region: "johto", name: "Olivine City", type: "town",
    order: 23, requires: "route-39", gymId: "johto_olivine", encounters: []
  },
  {
    id: "route-40", region: "johto", name: "Route 40", type: "route",
    order: 24, requires: "olivine-city", gymId: null, encounters: []
  },
  {
    id: "route-41", region: "johto", name: "Route 41", type: "route",
    order: 25, requires: "route-40", gymId: null, encounters: []
  },
  {
    id: "cianwood-city", region: "johto", name: "Cianwood City", type: "town",
    order: 26, requires: "route-41", gymId: "johto_cianwood", encounters: []
  },
  {
    id: "mahogany-town", region: "johto", name: "Mahogany Town", type: "town",
    order: 27, requires: "ecruteak-city", gymId: "johto_mahogany", encounters: []
  },
  {
    id: "route-42", region: "johto", name: "Route 42", type: "route",
    order: 28, requires: "mahogany-town", gymId: null,
    encounters: [
      { speciesId: 114, minLevel: 20, maxLevel: 24, weight: 60 }, // Tangela
      { speciesId: 183, minLevel: 20, maxLevel: 24, weight: 40 }  // Marill
    ]
  },
  {
    id: "lake-of-rage", region: "johto", name: "Lake of Rage", type: "route",
    order: 29, requires: "route-42", gymId: null,
    encounters: [
      { speciesId: 129, minLevel: 15, maxLevel: 20, weight: 90 }, // Magikarp
      { speciesId: 130, minLevel: 25, maxLevel: 30, weight: 10 }  // Gyarados (rare - "Red Gyarados" flavor)
    ]
  },
  {
    id: "route-43", region: "johto", name: "Route 43", type: "route",
    order: 30, requires: "lake-of-rage", gymId: null,
    encounters: [
      { speciesId: 58, minLevel: 22, maxLevel: 26, weight: 35 }, // Growlithe
      { speciesId: 19, minLevel: 22, maxLevel: 26, weight: 30 }, // Rattata
      { speciesId: 21, minLevel: 22, maxLevel: 26, weight: 35 }  // Spearow
    ]
  },
  {
    id: "route-44", region: "johto", name: "Route 44", type: "route",
    order: 31, requires: "route-43", gymId: null,
    encounters: [
      { speciesId: 183, minLevel: 23, maxLevel: 27, weight: 35 }, // Marill
      { speciesId: 79, minLevel: 23, maxLevel: 27, weight: 30 },  // Slowpoke
      { speciesId: 202, minLevel: 25, maxLevel: 27, weight: 10 }  // Wobbuffet (rare)
    ]
  },
  {
    id: "ice-path", region: "johto", name: "Ice Path", type: "route",
    order: 32, requires: "route-44", gymId: null,
    encounters: [
      { speciesId: 220, minLevel: 24, maxLevel: 28, weight: 45 }, // Swinub
      { speciesId: 41, minLevel: 24, maxLevel: 28, weight: 35 },  // Zubat
      { speciesId: 124, minLevel: 26, maxLevel: 28, weight: 5 }   // Jynx (rare)
    ]
  },
  {
    id: "blackthorn-city", region: "johto", name: "Blackthorn City", type: "town",
    order: 33, requires: "ice-path", gymId: "johto_blackthorn", encounters: []
  }
];

function getLocationsForRegion(regionId) {
  return LOCATIONS.filter(l => l.region === regionId).sort((a, b) => a.order - b.order);
}

function getLocationById(locationId) {
  return LOCATIONS.find(l => l.id === locationId) || null;
}

// A location is unlocked once its prerequisite has been visited (or it has
// no prerequisite at all). Already-visited locations always count as unlocked
// too, so re-visiting a completed spot never looks locked.
function isLocationUnlocked(location, adventureState) {
  if (!location.requires) return true;
  if (adventureState.visitedLocations.includes(location.id)) return true;
  return adventureState.visitedLocations.includes(location.requires);
}

function weightedPick(entries) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;
  for (const e of entries) {
    roll -= e.weight;
    if (roll <= 0) return e;
  }
  return entries[entries.length - 1];
}

const SHINY_CHANCE = 1 / 50;

// Picks a wild encounter for `location`, respecting the "no duplicate normal
// species" and "shiny is a separate slot" rules:
//  - a species already owned as non-shiny can still be encountered shiny
//  - a species already owned as shiny can still be encountered non-shiny
// Returns { speciesId, level, shiny } or null if every possible outcome for
// this location is already owned (caller should fall back to a small
// consolation reward instead of a battle).
function generateWildEncounter(location, mydex) {
  const encounters = location.encounters || [];
  if (!encounters.length) return null;

  const ownedNormal = new Set(mydex.filter(p => !p.shiny).map(p => p.id));
  const ownedShiny = new Set(mydex.filter(p => p.shiny).map(p => p.id));

  const wantShiny = Math.random() < SHINY_CHANCE;
  const primaryPool = encounters.filter(e => !(wantShiny ? ownedShiny : ownedNormal).has(e.speciesId));
  // If the rolled rarity has nothing left, try the other rarity before giving up entirely.
  const fallbackPool = encounters.filter(e => !(wantShiny ? ownedNormal : ownedShiny).has(e.speciesId));

  let pool = primaryPool;
  let shiny = wantShiny;
  if (!pool.length) {
    pool = fallbackPool;
    shiny = !wantShiny;
  }
  if (!pool.length) return null;

  const picked = weightedPick(pool);
  const level = picked.minLevel + Math.floor(Math.random() * (picked.maxLevel - picked.minLevel + 1));
  return { speciesId: picked.speciesId, level, shiny };
}
