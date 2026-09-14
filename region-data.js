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
