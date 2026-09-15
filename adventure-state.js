// ---- Adventure RPG profile: fully independent of the classic Ayaz/Baba
// profiles (Phase 4.5 architecture fix) ----
//
// Phases 1-4 bolted Adventure data (coins, wild-caught Pokemon, wildWins,
// visited locations...) onto whichever classic profile document happened to
// be active on the device. That meant switching Ayaz<->Baba silently
// switched "which Adventure save" you were in, and Direct Add / wild catches
// lived in the same mydex array. This file gives Adventure its own single
// Firestore document (profiles/adventure) that never changes based on which
// classic profile is selected, and a one-time, idempotent migration that
// recovers whatever Adventure progress already exists inside the ayaz/baba
// documents before this fix, then strips it back out of those documents.
//
// Every classic page is completely unaffected: pokedex-data.js's own
// CLOUD_STATE/getMyDexShared/getPlayer/getInventory and Direct Add are
// untouched. Only adventure.html, wild-battle.html, pokemart.html and
// adventure-hq.html load this file.

const ADVENTURE_DOC_ID = "adventure";
const DEFAULT_ADVENTURE_PLAYER = {
  xp: 0, coins: 100, achievements: [], wildWins: 0, wildLosses: 0, badges: [],
  // Phase 7: per-league progress (eliteFourWins is only ever used to gate a
  // one-time reward - it never lets a run skip a stage; see league-data.js),
  // plus the two region-progression fields future regions read from.
  leagueProgress: {},
  completedRegions: [],
  unlockedRegions: ["kanto"]
};
const DEFAULT_ADVENTURE_INVENTORY = {
  pokeball: 5, greatball: 0, ultraball: 0,
  potion: 1, "super-potion": 0, revive: 0,
  berry: 2, "rare-candy": 0, "evolution-stone": 0
};
// leagueAttempt is the "gauntlet in progress" record (Phase 7): which league,
// which stage (elite four member id / "champion"), and which owned Pokemon
// instance is fighting it through - kept here (not on `player`) since it's
// transient run state, not a permanent unlock. A loss or give-up resets it
// back to this exact default so a future entry restarts at stage one; it
// never touches a Pokemon's own currentHp/fainted, so losing and retrying
// can never be used to "free-heal" (see league-data.js endLeagueAttempt).
const DEFAULT_LEAGUE_ATTEMPT = { leagueId: null, active: false, stage: null, instanceId: null, startedAt: null };
const DEFAULT_ADVENTURE_PROGRESS = { visitedLocations: [], currentLocationId: null, leagueAttempt: DEFAULT_LEAGUE_ATTEMPT };

let ADVENTURE_STATE = {
  player: DEFAULT_ADVENTURE_PLAYER,
  inventory: DEFAULT_ADVENTURE_INVENTORY,
  mydex: [],
  progress: DEFAULT_ADVENTURE_PROGRESS
};
let adventureDocRef = null;
let adventureReady = false;
let adventureReadyResolvers = [];
let adventureChangeCallbacks = [];
let adventureBootstrapped = false;

function onAdventureCloudChange(cb) { adventureChangeCallbacks.push(cb); }
function waitForAdventureCloud() {
  if (!adventureBootstrapped) {
    adventureBootstrapped = true;
    startAdventureCloudSync();
  }
  if (adventureReady) return Promise.resolve();
  return new Promise(resolve => adventureReadyResolvers.push(resolve));
}
function pushAdventureCloud(partial) {
  adventureDocRef.set(partial, { merge: true }).catch(err => console.error("Adventure Firestore yazma hatası:", err));
}

// One-time recovery of pre-fix Adventure data that's mixed into the ayaz/baba
// classic documents, then strips it back out of them. Safe to call multiple
// times (each classic doc is marked `_adventureMigrated` once handled, and
// once the "adventure" document itself exists this never runs again at all -
// see startAdventureCloudSync below).
async function migrateLegacyAdventureData() {
  let recovered = null;
  for (const profileId of ["ayaz", "baba"]) {
    try {
      const docRef = cloudDb.collection("profiles").doc(profileId);
      const snap = await docRef.get();
      if (!snap.exists) continue;
      const data = snap.data() || {};
      if (data._adventureMigrated) continue;

      const legacyProgress = data.adventure || {};
      const legacyMydex = data.mydex || [];
      const wildMons = legacyMydex.filter(p => p.source === "wild");
      const classicMons = legacyMydex.filter(p => p.source !== "wild");
      const legacyPlayer = data.player || {};
      const hasLegacyAdventureData = wildMons.length > 0 ||
        (legacyProgress.visitedLocations || []).length > 0 ||
        !!legacyPlayer.coins || !!legacyPlayer.wildWins || !!legacyPlayer.wildLosses;

      if (hasLegacyAdventureData && !recovered) {
        // Trainer XP was mixed with classic XP with no way to separate it
        // after the fact, so Adventure's trainer level restarts clean - but
        // every field the plan explicitly calls out (coins, inventory,
        // Pokemon instances/level/pxp/friendship/currentHp/fainted,
        // wildWins/wildLosses, visited locations) is carried over exactly.
        recovered = {
          player: Object.assign({}, DEFAULT_ADVENTURE_PLAYER, {
            coins: legacyPlayer.coins || 0,
            wildWins: legacyPlayer.wildWins || 0,
            wildLosses: legacyPlayer.wildLosses || 0
          }),
          inventory: Object.assign({}, DEFAULT_ADVENTURE_INVENTORY, data.inventory || {}),
          mydex: wildMons,
          progress: Object.assign({}, DEFAULT_ADVENTURE_PROGRESS, legacyProgress)
        };
      }

      if (hasLegacyAdventureData) {
        const cleanedPlayer = Object.assign({}, legacyPlayer);
        delete cleanedPlayer.coins;
        delete cleanedPlayer.wildWins;
        delete cleanedPlayer.wildLosses;
        await docRef.set({
          mydex: classicMons,
          player: cleanedPlayer,
          adventure: firebase.firestore.FieldValue.delete(),
          _adventureMigrated: true
        }, { merge: true });
      } else {
        await docRef.set({ _adventureMigrated: true }, { merge: true });
      }
    } catch (e) {
      console.error("Adventure migration error for profile", profileId, e);
    }
  }
  return recovered;
}

function startAdventureCloudSync() {
  adventureDocRef = cloudDb.collection("profiles").doc(ADVENTURE_DOC_ID);
  adventureDocRef.onSnapshot(async (snap) => {
    if (!snap.exists) {
      const recovered = await migrateLegacyAdventureData();
      ADVENTURE_STATE = recovered || {
        player: DEFAULT_ADVENTURE_PLAYER,
        inventory: DEFAULT_ADVENTURE_INVENTORY,
        mydex: [],
        progress: DEFAULT_ADVENTURE_PROGRESS
      };
      adventureDocRef.set(ADVENTURE_STATE);
    } else {
      const data = snap.data() || {};
      ADVENTURE_STATE = {
        player: Object.assign({}, DEFAULT_ADVENTURE_PLAYER, data.player || {}),
        inventory: Object.assign({}, DEFAULT_ADVENTURE_INVENTORY, data.inventory || {}),
        mydex: data.mydex || [],
        progress: Object.assign({}, DEFAULT_ADVENTURE_PROGRESS, data.progress || {})
      };
    }
    adventureReady = true;
    adventureReadyResolvers.forEach(r => r());
    adventureReadyResolvers = [];
    adventureChangeCallbacks.forEach(cb => { try { cb(); } catch (e) { console.error(e); } });
  }, (err) => {
    console.error("Adventure Firestore bağlantı hatası:", err);
  });
}

function getAdventureDex() { return ADVENTURE_STATE.mydex; }
function saveAdventureDex(list) { ADVENTURE_STATE.mydex = list; pushAdventureCloud({ mydex: list }); }

function getAdventurePlayer() { return ADVENTURE_STATE.player; }
function saveAdventurePlayer(p) { ADVENTURE_STATE.player = p; pushAdventureCloud({ player: p }); }

function getAdventureInventory() { return ADVENTURE_STATE.inventory; }
function saveAdventureInventory(inv) { ADVENTURE_STATE.inventory = inv; pushAdventureCloud({ inventory: inv }); }
function addAdventureItems(itemKey, qty) {
  const inv = getAdventureInventory();
  inv[itemKey] = (inv[itemKey] || 0) + qty;
  saveAdventureInventory(inv);
  return inv;
}

function getAdventureProgress() { return ADVENTURE_STATE.progress; }
function saveAdventureProgress(progress) { ADVENTURE_STATE.progress = progress; pushAdventureCloud({ progress }); }
function visitAdventureLocation(locationId) {
  const progress = getAdventureProgress();
  const alreadyVisited = progress.visitedLocations.includes(locationId);
  const next = {
    visitedLocations: alreadyVisited ? progress.visitedLocations : [...progress.visitedLocations, locationId],
    currentLocationId: locationId
  };
  saveAdventureProgress(next);
  return next;
}

// Central Trainer XP grant (Phase 6) - Gym victories and any future League/
// quest/achievement source should call this rather than touching
// player.xp directly, so it's never confused with a Pokemon's own pxp
// (a completely separate value on each owned instance).
function addAdventureTrainerXP(amount, reason) {
  const player = getAdventurePlayer();
  player.xp += Math.max(0, Math.round(amount || 0));
  saveAdventurePlayer(player);
  return { xp: player.xp, reason };
}

function addAdventureCoins(amount) {
  const player = getAdventurePlayer();
  player.coins = (player.coins || 0) + Math.max(0, Math.round(amount || 0));
  saveAdventurePlayer(player);
  return player.coins;
}
function spendAdventureCoins(amount) {
  const player = getAdventurePlayer();
  if ((player.coins || 0) < amount) return false;
  player.coins -= amount;
  saveAdventurePlayer(player);
  return true;
}

// Minimal catch-reward handler, scoped entirely to the Adventure profile -
// the classic processCatch() (pokedex-data.js) is never called from
// Adventure code, so classic achievements/XP are never touched by a wild catch.
function processAdventureCatch() {
  const player = getAdventurePlayer();
  player.xp += 10;
  saveAdventurePlayer(player);
  addAdventureItems("pokeball", 1);
  addAdventureItems("berry", 2);
  return {
    xpEvents: [{ label: "Pokémon yakalandı", xp: 10 }],
    items: [{ key: "pokeball", qty: 1 }, { key: "berry", qty: 2 }]
  };
}

// Shared PokeAPI lookup (id/name/types/stats/power/artwork) used anywhere
// Adventure needs a species' data: starter selection and evolution both
// call this instead of duplicating the fetch/shape logic.
async function fetchPokemonSpeciesData(speciesId) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesId}`);
  const data = await res.json();
  const statMap = {};
  data.stats.forEach(s => { statMap[s.stat.name] = s.base_stat; });
  return {
    id: data.id,
    name: data.name,
    types: data.types.map(t => t.type.name),
    stats: statMap,
    power: data.stats.reduce((s, st) => s + st.base_stat, 0),
    img: data.sprites?.other?.["official-artwork"]?.front_default || data.sprites?.front_default
      || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`
  };
}

// Central, idempotent-safe friendship adjuster (Phase 5C). Every Adventure
// system that grants/removes friendship (battle wins, catches, berries, and
// future Gym/League victories) should call this rather than touching the
// field directly, so the 0-100 clamp only needs enforcing in one place.
function increaseFriendship(instanceId, amount, reason) {
  const mydex = getAdventureDex();
  const idx = mydex.findIndex(p => p.instanceId === instanceId);
  if (idx === -1) return { ok: false, reason: "not-found" };
  const mon = mydex[idx];
  const current = typeof mon.friendship === "number" ? mon.friendship : 0;
  const next = Math.max(0, Math.min(100, current + amount));
  if (next === current) return { ok: true, friendship: current, changed: false };
  mydex[idx] = Object.assign({}, mon, { friendship: next });
  saveAdventureDex(mydex);
  return { ok: true, friendship: next, changed: true, reason };
}
