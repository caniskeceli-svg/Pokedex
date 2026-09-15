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
const DEFAULT_ADVENTURE_PLAYER = { xp: 0, coins: 100, achievements: [], wildWins: 0, wildLosses: 0 };
const DEFAULT_ADVENTURE_INVENTORY = {
  pokeball: 5, greatball: 0, ultraball: 0,
  potion: 1, "super-potion": 0, revive: 0,
  berry: 2, "rare-candy": 0, "evolution-stone": 0
};
const DEFAULT_ADVENTURE_PROGRESS = { visitedLocations: [], currentLocationId: null };

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
