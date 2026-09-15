// ---- Kanto Gym system (Phase 6) ----
// Fully data-driven: GYM_CATALOG is the only place a Gym's leader/type/team/
// levels/badge/rewards/unlock-requirement live, so Johto etc. later is just
// appending entries - no new UI or battle logic. Depends on adventure-state.js
// (getAdventurePlayer/saveAdventurePlayer/getAdventureDex) - load it first.
const GYM_CATALOG = [
  {
    gymId: "pewter", regionId: "kanto", locationId: "pewter-city", order: 1,
    leader: "Brock", type: "rock", requiresBadge: null,
    badge: { id: "boulder", name: "Boulder Badge", icon: "🪨" },
    description: "Kayaların ustası Brock ile savaş!",
    team: [
      { speciesId: 74, level: 12 }, // Geodude
      { speciesId: 95, level: 14 }  // Onix
    ],
    rewards: { trainerXp: 250, coins: 500 }
  },
  {
    gymId: "cerulean", regionId: "kanto", locationId: "cerulean-city", order: 2,
    leader: "Misty", type: "water", requiresBadge: "boulder",
    badge: { id: "cascade", name: "Cascade Badge", icon: "💧" },
    description: "Su ustası Misty ile savaş!",
    team: [
      { speciesId: 120, level: 18 }, // Staryu
      { speciesId: 121, level: 21 }  // Starmie
    ],
    rewards: { trainerXp: 350, coins: 700 }
  },
  {
    gymId: "vermilion", regionId: "kanto", locationId: "vermilion-city", order: 3,
    leader: "Lt. Surge", type: "electric", requiresBadge: "cascade",
    badge: { id: "thunder", name: "Thunder Badge", icon: "⚡" },
    description: "Elektrik ustası Lt. Surge ile savaş!",
    team: [
      { speciesId: 100, level: 21 }, // Voltorb
      { speciesId: 25, level: 18 },  // Pikachu
      { speciesId: 26, level: 24 }   // Raichu
    ],
    rewards: { trainerXp: 450, coins: 900 }
  },
  {
    gymId: "celadon", regionId: "kanto", locationId: "celadon-city", order: 4,
    leader: "Erika", type: "grass", requiresBadge: "thunder",
    badge: { id: "rainbow", name: "Rainbow Badge", icon: "🌈" },
    description: "Çimen ustası Erika ile savaş!",
    team: [
      { speciesId: 114, level: 24 }, // Tangela
      { speciesId: 71, level: 29 }   // Victreebel
    ],
    rewards: { trainerXp: 550, coins: 1100 }
  },
  {
    gymId: "fuchsia", regionId: "kanto", locationId: "fuchsia-city", order: 5,
    leader: "Koga", type: "poison", requiresBadge: "rainbow",
    badge: { id: "soul", name: "Soul Badge", icon: "💜" },
    description: "Zehir ustası Koga ile savaş!",
    team: [
      { speciesId: 109, level: 33 }, // Koffing
      { speciesId: 89, level: 36 },  // Muk
      { speciesId: 110, level: 39 }  // Weezing
    ],
    rewards: { trainerXp: 650, coins: 1300 }
  },
  {
    gymId: "saffron", regionId: "kanto", locationId: "saffron-city", order: 6,
    leader: "Sabrina", type: "psychic", requiresBadge: "soul",
    badge: { id: "marsh", name: "Marsh Badge", icon: "🔮" },
    description: "Ruh ustası Sabrina ile savaş!",
    team: [
      { speciesId: 64, level: 38 },  // Kadabra
      { speciesId: 122, level: 37 }, // Mr. Mime
      { speciesId: 65, level: 43 }   // Alakazam
    ],
    rewards: { trainerXp: 750, coins: 1500 }
  },
  {
    gymId: "cinnabar", regionId: "kanto", locationId: "cinnabar-island", order: 7,
    leader: "Blaine", type: "fire", requiresBadge: "marsh",
    badge: { id: "volcano", name: "Volcano Badge", icon: "🌋" },
    description: "Ateş ustası Blaine ile savaş!",
    team: [
      { speciesId: 58, level: 42 },  // Growlithe
      { speciesId: 78, level: 40 },  // Rapidash
      { speciesId: 59, level: 47 }   // Arcanine
    ],
    rewards: { trainerXp: 850, coins: 1700 }
  },
  {
    gymId: "viridian", regionId: "kanto", locationId: "viridian-city", order: 8,
    leader: "Giovanni", type: "ground", requiresBadge: "volcano",
    badge: { id: "earth", name: "Earth Badge", icon: "🏔️" },
    description: "Gizemli lider Giovanni ile son Kanto savaşı!",
    team: [
      { speciesId: 111, level: 45 }, // Rhyhorn
      { speciesId: 31, level: 47 },  // Nidoqueen
      { speciesId: 112, level: 50 }  // Rhydon
    ],
    rewards: { trainerXp: 1000, coins: 2000 }
  }
];

function getGymById(gymId) {
  return GYM_CATALOG.find(g => g.gymId === gymId) || null;
}
function getGymsForRegion(regionId) {
  return GYM_CATALOG.filter(g => g.regionId === regionId).sort((a, b) => a.order - b.order);
}

function hasBadge(player, badgeId) {
  return (player.badges || []).includes(badgeId);
}
function isGymUnlocked(gym, player) {
  return !gym.requiresBadge || hasBadge(player, gym.requiresBadge);
}
function isGymDefeated(gym, player) {
  return hasBadge(player, gym.badge.id);
}
// "Challenge" (unlocked, not yet defeated) vs "Defeated" vs "Locked" - the
// three states the Gym card UI needs.
function gymStatus(gym, player) {
  if (isGymDefeated(gym, player)) return "defeated";
  if (isGymUnlocked(gym, player)) return "challenge";
  return "locked";
}

let gymVictoryLocked = {};

// The single place a Gym win is ever recorded. Re-reads the player fresh
// and checks the badge array before writing anything, so:
//  - pressing "Victory" repeatedly (or two calls racing in the same tab)
//    grants the badge/XP/coins exactly once - every call after the first
//    reports alreadyDefeated:true and changes nothing.
//  - a genuine cross-tab/device race (two tabs both writing at once) is
//    bounded by whichever write reaches Firestore last winning, same as
//    every other save in this app (saveAdventurePlayer/saveAdventureDex) -
//    there is no transaction API in use anywhere in this codebase, so this
//    intentionally doesn't introduce one just for Gyms; see Phase 6 report.
function awardGymVictory(gymId) {
  if (gymVictoryLocked[gymId]) return { ok: false, reason: "in-progress" };
  gymVictoryLocked[gymId] = true;
  try {
    const gym = getGymById(gymId);
    if (!gym) return { ok: false, reason: "invalid-gym" };
    const player = getAdventurePlayer();
    if (!player.badges) player.badges = [];
    if (player.badges.includes(gym.badge.id)) {
      return { ok: true, alreadyDefeated: true, gym };
    }
    player.badges.push(gym.badge.id);
    player.xp += gym.rewards.trainerXp;
    player.coins = (player.coins || 0) + gym.rewards.coins;
    saveAdventurePlayer(player);
    return { ok: true, alreadyDefeated: false, gym, trainerXp: gym.rewards.trainerXp, coins: gym.rewards.coins };
  } finally {
    gymVictoryLocked[gymId] = false;
  }
}
