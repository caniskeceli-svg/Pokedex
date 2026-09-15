// ---- Adventure Daily Quests (Phase 8) ----
// Fully data-driven like every other Adventure catalog: QUEST_CATALOG is the
// only place a quest's target event/targetValue/reward/icon lives, so adding
// a new quest later is just appending an entry - no new UI or progress
// logic. Depends on adventure-state.js (getAdventurePlayer/
// saveAdventurePlayer/ADVENTURE_DOC_ID) and pokedex-data.js's `cloudDb` -
// load both before this file.
const QUEST_CATALOG = [
  { id: "explore_location", name: "Kaşif", description: "1 yeni bölge keşfet", category: "Explorer", target: "explore_location", targetValue: 1, reward: { coins: 100, trainerXp: 50 }, icon: "🗺️" },
  { id: "win_wild_battle", name: "Savaşçı", description: "3 Wild Battle kazan", category: "Battler", target: "win_wild_battle", targetValue: 3, reward: { coins: 150, trainerXp: 100 }, icon: "⚔️" },
  { id: "catch_pokemon", name: "Koleksiyoncu", description: "1 Pokémon yakala", category: "Collector", target: "catch_pokemon", targetValue: 1, reward: { coins: 150, trainerXp: 0 }, icon: "🎯" },
  { id: "use_berry", name: "Bakıcı", description: "1 Berry kullan", category: "Care", target: "use_berry", targetValue: 1, reward: { coins: 50, trainerXp: 0 }, icon: "🍓" },
  { id: "challenge_gym", name: "Meydan Okuyucu", description: "1 Gym battle yap", category: "Gym", target: "challenge_gym", targetValue: 1, reward: { coins: 200, trainerXp: 100 }, icon: "🏟️" },

  // Phase 13: quest-pool variety, reusing event types that already fire
  // (win_gym/league_progress/increase_friendship/evolve_pokemon) but were
  // never consumed by any quest before now - the engine itself (this file's
  // own functions below) needed zero changes for this.
  { id: "win_gym", name: "Rozet Avcısı", description: "1 Gym Lideri'ni yen", category: "Gym", target: "win_gym", targetValue: 1, reward: { coins: 250, trainerXp: 150 }, icon: "🏅" },
  { id: "league_progress", name: "Lig Yolcusu", description: "League'de 1 rakip yen (Elite Four veya Champion)", category: "League", target: "league_progress", targetValue: 1, reward: { coins: 300, trainerXp: 200 }, icon: "🏆" },
  { id: "increase_friendship", name: "Dost Canlısı", description: "Pokémon'larınla 5 kez dostluk kazan", category: "Friendship", target: "increase_friendship", targetValue: 5, reward: { coins: 80, trainerXp: 50 }, icon: "❤️" },
  { id: "evolve_pokemon", name: "Değişim Ustası", description: "1 Pokémon'unu evrimleştir", category: "Evolution", target: "evolve_pokemon", targetValue: 1, reward: { coins: 200, trainerXp: 150 }, icon: "🌟" }
];

function getQuestCatalogEntry(questId) {
  return QUEST_CATALOG.find(q => q.id === questId) || null;
}

// Picks 3 quests, preferring distinct categories (so the same category never
// crowds out the others while different ones are available) - only falls
// back to repeats if the catalog doesn't have 3 distinct categories to offer.
function pickDailyQuestIds() {
  const pool = QUEST_CATALOG.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  const picked = [];
  const usedCategories = new Set();
  for (const q of pool) {
    if (picked.length >= 3) break;
    if (usedCategories.has(q.category)) continue;
    picked.push(q);
    usedCategories.add(q.category);
  }
  for (const q of pool) {
    if (picked.length >= 3) break;
    if (picked.indexOf(q) === -1) picked.push(q);
  }
  return picked.map(q => q.id);
}

// Firestore's own clock, not the device's - a player rolling their local
// time forward or backward can't mint a new day's quests early (or
// repeatedly) just by changing their clock, and (Phase 9) can't backdate or
// fast-forward a Hall of Fame memory's date either. Round-trips one tiny
// field through a real write+read so "now" is always judged by Firestore's
// server time, not `Date.now()`. Returns milliseconds since epoch.
async function getServerTimestampMs() {
  const ref = cloudDb.collection("profiles").doc(ADVENTURE_DOC_ID);
  await ref.set({ _serverTimePing: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  const snap = await ref.get();
  const ts = snap.data()._serverTimePing;
  const date = ts && typeof ts.toDate === "function" ? ts.toDate() : new Date();
  return date.getTime();
}

async function getServerDateKey() {
  const ms = await getServerTimestampMs();
  return new Date(ms).toISOString().slice(0, 10); // "YYYY-MM-DD", UTC
}

let ensureDailyQuestsLock = false;

// Creates today's 3 quests the first time this runs (a brand new profile,
// or a genuine new server day), and otherwise leaves an already-generated
// day's quests completely untouched - so a refresh mid-day never re-rolls
// the picks or resets progress/claimed state.
async function ensureDailyQuests() {
  if (ensureDailyQuestsLock) return getAdventurePlayer().dailyQuests;
  ensureDailyQuestsLock = true;
  try {
    const dateKey = await getServerDateKey();
    const player = getAdventurePlayer();
    if (player.dailyQuests && player.dailyQuests.dateKey === dateKey) {
      return player.dailyQuests;
    }
    const quests = pickDailyQuestIds().map(id => ({ id, progress: 0, claimed: false }));
    player.dailyQuests = { dateKey, quests };
    saveAdventurePlayer(player);
    return player.dailyQuests;
  } finally {
    ensureDailyQuestsLock = false;
  }
}

// Adds progress toward every active, not-yet-claimed quest whose `target`
// matches this event type. Only ever called from recordAdventureEvent
// (adventure-events.js), never directly from gameplay code.
function updateQuestProgress(eventType, amount) {
  const player = getAdventurePlayer();
  const dq = player.dailyQuests;
  if (!dq) return;
  let changed = false;
  dq.quests.forEach(q => {
    const catalogEntry = getQuestCatalogEntry(q.id);
    if (catalogEntry && catalogEntry.target === eventType && !q.claimed && q.progress < catalogEntry.targetValue) {
      q.progress = Math.min(catalogEntry.targetValue, q.progress + (amount || 1));
      changed = true;
    }
  });
  if (changed) saveAdventurePlayer(player);
}

let questClaimLocked = {};

// The single place a quest reward is ever granted. Re-reads the player
// fresh and re-checks completion/claimed state before writing anything, so
// a double click, a stale button, or two calls racing each other can only
// ever grant the reward once - every call after the first reports
// already-claimed and changes nothing.
function claimDailyQuest(questId) {
  if (questClaimLocked[questId]) return { ok: false, reason: "in-progress" };
  questClaimLocked[questId] = true;
  try {
    const player = getAdventurePlayer();
    const dq = player.dailyQuests;
    if (!dq) return { ok: false, reason: "no-quests" };
    const entry = dq.quests.find(q => q.id === questId);
    if (!entry) return { ok: false, reason: "not-found" };
    if (entry.claimed) return { ok: false, reason: "already-claimed" };
    const catalogEntry = getQuestCatalogEntry(questId);
    if (!catalogEntry) return { ok: false, reason: "invalid-quest" };
    if (entry.progress < catalogEntry.targetValue) return { ok: false, reason: "not-complete" };

    entry.claimed = true;
    player.xp += catalogEntry.reward.trainerXp || 0;
    player.coins = (player.coins || 0) + (catalogEntry.reward.coins || 0);
    saveAdventurePlayer(player);
    return { ok: true, reward: catalogEntry.reward, quest: catalogEntry };
  } finally {
    questClaimLocked[questId] = false;
  }
}
