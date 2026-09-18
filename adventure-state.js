// ---- Adventure RPG profile: fully independent of the classic Ayaz/Baba
// profiles (Phase 4.5 architecture fix) ----
//
// Phases 1-4 bolted Adventure data (coins, wild-caught Pokemon, wildWins,
// visited locations...) onto whichever classic profile document happened to
// be active on the device. That meant switching Ayaz<->Baba silently
// switched "which Adventure save" you were in, and Direct Add / wild catches
// lived in the same mydex array. This file gives Adventure its own
// Firestore document that never changes what it holds based on which
// classic profile is selected... except which DOCUMENT that is: since each
// player (Ayaz/Baba) wants their own independent Adventure playthrough
// (their own starter pick, their own badges), the doc id is
// "adventure_<profile>" - one per classic profile, decided by the exact
// same device-remembered profile choice (waitForCloud/CURRENT_PROFILE) the
// classic pages already use. A one-time, idempotent migration recovers
// whatever Adventure progress already existed inside the ayaz/baba
// documents from BEFORE the 4.5 fix, then strips it back out of them; the
// single shared "adventure" doc that existed briefly between Phase 4.5 and
// this per-profile split held no real progress (nobody had played yet) and
// is deleted outright rather than migrated - see
// cleanupLegacySharedAdventureDoc.
//
// Every classic page is completely unaffected: pokedex-data.js's own
// CLOUD_STATE/getMyDexShared/getPlayer/getInventory and Direct Add are
// untouched. Only adventure.html, wild-battle.html, pokemart.html and
// adventure-hq.html load this file.

let ADVENTURE_DOC_ID = null;
const DEFAULT_ADVENTURE_PLAYER = {
  xp: 0, coins: 100, achievements: [], wildWins: 0, wildLosses: 0, badges: [],
  // Phase 7: per-league progress (eliteFourWins is only ever used to gate a
  // one-time reward - it never lets a run skip a stage; see league-data.js),
  // plus the two region-progression fields future regions read from.
  leagueProgress: {},
  completedRegions: [],
  unlockedRegions: ["kanto"],
  // Phase 8: dailyQuests is set lazily by quest-data.js's ensureDailyQuests()
  // (there's no "day 0" default to fill in here - it needs a server
  // round-trip). adventureAchievements and evolutionCount are the Adventure-
  // only achievement system's state, completely separate from the classic
  // Ayaz/Baba `achievements` field above.
  adventureAchievements: [],
  evolutionCount: 0
};
const DEFAULT_ADVENTURE_INVENTORY = {
  pokeball: 5, greatball: 0, ultraball: 0,
  potion: 1, "super-potion": 0, revive: 0,
  berry: 2, "rare-candy": 0, "evolution-stone": 0
};
// leagueAttempts is the "gauntlet(s) in progress" record: which league,
// which stage (elite four member id / "champion"), and which owned Pokemon
// instance is fighting it through - kept here (not on `player`) since it's
// transient run state, not a permanent unlock. A loss or give-up resets a
// league's own slot back to this exact default shape so a future entry
// restarts at stage one; it never touches a Pokemon's own currentHp/fainted,
// so losing and retrying can never be used to "free-heal" (see
// league-data.js endLeagueAttempt).
//
// Phase 10D: this was a single `leagueAttempt` object (only one league,
// Kanto, existed). With Johto added, it became a map keyed by leagueId
// (`{ [leagueId]: {...} }`) so a Kanto attempt and a Johto attempt can each
// be in progress without overwriting each other - see
// migrateLegacyLeagueAttempt below for the one-time, non-destructive upgrade
// of any pre-existing single-object save.
const DEFAULT_LEAGUE_ATTEMPT = { leagueId: null, active: false, stage: null, instanceId: null, startedAt: null };
const DEFAULT_ADVENTURE_PROGRESS = { visitedLocations: [], currentLocationId: null, leagueAttempts: {} };

// One-time, idempotent migration of the pre-Phase-10D single `leagueAttempt`
// object into the new `leagueAttempts` map. Only folds it in when the map
// doesn't already have that league's slot, so it can never clobber a
// Johto attempt that already exists there; the legacy field is simply left
// unused going forward (saveAdventureProgress never writes it again) rather
// than explicitly deleted, matching this file's existing "old field just
// stops being written" migration style (see _adventureMigrated above).
function migrateLegacyLeagueAttempt(progressData) {
  const data = progressData || {};
  const attempts = Object.assign({}, data.leagueAttempts || {});
  const legacy = data.leagueAttempt;
  if (legacy && legacy.active && legacy.leagueId && !attempts[legacy.leagueId]) {
    attempts[legacy.leagueId] = legacy;
  }
  return attempts;
}

let ADVENTURE_STATE = {
  player: DEFAULT_ADVENTURE_PLAYER,
  inventory: DEFAULT_ADVENTURE_INVENTORY,
  mydex: [],
  progress: DEFAULT_ADVENTURE_PROGRESS,
  // Phase 9: Hall of Fame memories - a top-level field like `mydex`, since
  // it's a growing list of records rather than a player stat. Owned here
  // (raw Firestore-backed accessors only); hall-of-fame-data.js builds the
  // actual victory-memory domain logic on top, same layering as
  // gym-data.js/league-data.js sit on top of getAdventurePlayer/etc.
  memories: []
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
    // Reuses the classic pages' own profile picker/localStorage
    // (waitForCloud -> CURRENT_PROFILE) so "which Adventure save" is
    // decided by "which classic profile is active on this device" - the
    // exact same choice already used for Ayaz's vs Baba's own Pokedex. On a
    // device that hasn't picked a profile yet, this shows that same "Sen
    // kimsin?" picker before Adventure can know which save to load.
    waitForCloud().then(() => {
      ADVENTURE_DOC_ID = "adventure_" + CURRENT_PROFILE;
      cleanupLegacySharedAdventureDoc();
      startAdventureCloudSync();
    });
  }
  if (adventureReady) return Promise.resolve();
  return new Promise(resolve => adventureReadyResolvers.push(resolve));
}
// Guarded against writing before the real snapshot has ever loaded: until
// then, ADVENTURE_STATE is still sitting at its empty/default shape, so any
// write here would merge those defaults (e.g. mydex: []) over whatever the
// player actually has saved in Firestore - permanently wiping it. This was
// reachable through adventure-hq.html's Pokemon Center button, which was
// wired to click before the page's own data-ready check (now fixed there
// too, but this guard protects every write path, present and future).
function pushAdventureCloud(partial) {
  if (!adventureReady) { console.error("Adventure verisi henüz yüklenmeden yazma engellendi:", partial); return; }
  adventureDocRef.set(partial, { merge: true }).catch(err => console.error("Adventure Firestore yazma hatası:", err));
}

// One-time best-effort delete of the single shared "adventure" doc that
// existed briefly before this per-profile split - it never held real
// progress (created but unplayed), so it's discarded outright rather than
// migrated into either profile's new adventure_<profile> doc. Guarded by a
// localStorage flag so this is attempted only once per device; deleting an
// already-gone doc is a harmless no-op in Firestore, so a failed attempt
// (offline, etc.) safely just retries next session.
function cleanupLegacySharedAdventureDoc() {
  const FLAG = "adventure_legacy_cleanup_done_v1";
  try { if (localStorage.getItem(FLAG)) return; } catch (e) { return; }
  cloudDb.collection("profiles").doc("adventure").delete()
    .then(() => { try { localStorage.setItem(FLAG, "1"); } catch (e) {} })
    .catch(() => {});
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
          progress: Object.assign({}, DEFAULT_ADVENTURE_PROGRESS, legacyProgress, { leagueAttempts: migrateLegacyLeagueAttempt(legacyProgress) }),
          memories: []
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

// Phase 14: a player who already beat Johto's Champion BEFORE this phase
// existed has leagueProgress.johto_league.completed permanently true, and
// awardChampionVictory() only ever pushes `unlocksRegion` into
// unlockedRegions inside its one-time "not already completed" branch - so
// simply adding unlocksRegion:"hoenn" to the Johto catalog entry would
// never reach an already-completed player. This is the one-time,
// idempotent backfill for that gap: same shape/call-site pattern as
// migrateLegacyLeagueAttempt above. A no-op once "hoenn" is already present
// or Johto isn't completed yet; never touches completedRegions or anything
// else.
function backfillHoennUnlock(player) {
  const johtoLeague = player.leagueProgress && player.leagueProgress.johto_league;
  if (!johtoLeague || !johtoLeague.completed) return player;
  if ((player.unlockedRegions || []).includes("hoenn")) return player;
  return Object.assign({}, player, {
    unlockedRegions: (player.unlockedRegions || ["kanto"]).concat(["hoenn"])
  });
}

function startAdventureCloudSync() {
  adventureDocRef = cloudDb.collection("profiles").doc(ADVENTURE_DOC_ID);

  // Same stalled-connection safety net as the classic profile's own
  // startCloudSync (pokedex-data.js) - without it, every Adventure page just
  // hangs on "Yükleniyor..." forever with no indication anything's wrong.
  const connectionTimeout = setTimeout(() => {
    if (!adventureReady) showConnectionRetryBanner("Bağlantı uzun sürüyor... internetini kontrol et.");
  }, 10000);

  adventureDocRef.onSnapshot(async (snap) => {
    if (!snap.exists) {
      const recovered = await migrateLegacyAdventureData();
      ADVENTURE_STATE = recovered || {
        player: DEFAULT_ADVENTURE_PLAYER,
        inventory: DEFAULT_ADVENTURE_INVENTORY,
        mydex: [],
        progress: DEFAULT_ADVENTURE_PROGRESS,
        memories: []
      };
      adventureDocRef.set(ADVENTURE_STATE);
    } else {
      const data = snap.data() || {};
      const mergedProgress = Object.assign({}, DEFAULT_ADVENTURE_PROGRESS, data.progress || {});
      mergedProgress.leagueAttempts = migrateLegacyLeagueAttempt(data.progress);
      ADVENTURE_STATE = {
        player: backfillHoennUnlock(Object.assign({}, DEFAULT_ADVENTURE_PLAYER, data.player || {})),
        inventory: Object.assign({}, DEFAULT_ADVENTURE_INVENTORY, data.inventory || {}),
        mydex: data.mydex || [],
        progress: mergedProgress,
        memories: data.memories || []
      };
    }
    adventureReady = true;
    clearTimeout(connectionTimeout);
    clearConnectionRetryBanner();
    adventureReadyResolvers.forEach(r => r());
    adventureReadyResolvers = [];
    adventureChangeCallbacks.forEach(cb => { try { cb(); } catch (e) { console.error(e); } });
  }, (err) => {
    console.error("Adventure Firestore bağlantı hatası:", err);
    clearTimeout(connectionTimeout);
    showConnectionRetryBanner("Bağlantı hatası oluştu.");
  });
}

function getAdventureDex() { return ADVENTURE_STATE.mydex; }
function saveAdventureDex(list) { ADVENTURE_STATE.mydex = list; pushAdventureCloud({ mydex: list }); }

function getAdventureMemories() { return ADVENTURE_STATE.memories; }
function saveAdventureMemories(list) { ADVENTURE_STATE.memories = list; pushAdventureCloud({ memories: list }); }

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
// Spreads the EXISTING progress object rather than replacing it wholesale,
// so fields this function doesn't know about (like Phase 7/10D's leagueAttempts)
// are never dropped by a location visit. Returns `wasNewVisit` so callers
// can fire a one-time "explore_location" event only on a genuinely new spot.
function visitAdventureLocation(locationId) {
  const progress = getAdventureProgress();
  const alreadyVisited = progress.visitedLocations.includes(locationId);
  const next = Object.assign({}, progress, {
    visitedLocations: alreadyVisited ? progress.visitedLocations : [...progress.visitedLocations, locationId],
    currentLocationId: locationId
  });
  saveAdventureProgress(next);
  return Object.assign({}, next, { wasNewVisit: !alreadyVisited });
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

// Wraps fetch with a timeout (default 10s) so a stalled PokeAPI request
// (flaky network, PokeAPI unreachable) rejects instead of leaving the
// caller's `await` hanging forever - every PokeAPI call in Adventure goes
// through this rather than a bare fetch().
function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms || 10000);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

// Shared PokeAPI lookup (id/name/types/stats/power/artwork) used anywhere
// Adventure needs a species' data: starter selection and evolution both
// call this instead of duplicating the fetch/shape logic.
async function fetchPokemonSpeciesData(speciesId) {
  const res = await fetchWithTimeout(`https://pokeapi.co/api/v2/pokemon/${speciesId}`);
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
  // Phase 8: lets the Friendship achievement tier react without every
  // friendship call site needing to know about the achievement system.
  if (typeof recordAdventureEvent === "function") recordAdventureEvent("increase_friendship");
  return { ok: true, friendship: next, changed: true, reason };
}
