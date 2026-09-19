// ---- Kanto Gym system (Phase 6) ----
// Fully data-driven: GYM_CATALOG is the only place a Gym's leader/type/team/
// levels/badge/rewards/unlock-requirement live, so Johto etc. later is just
// appending entries - no new UI or battle logic. Depends on adventure-state.js
// (getAdventurePlayer/saveAdventurePlayer/getAdventureDex) - load it first.
const GYM_CATALOG = [
  {
    gymId: "pewter", regionId: "kanto", locationId: "pewter-city", order: 1,
    leader: "Brock", type: "rock", requiresBadge: null,
    badge: { id: "boulder", name: "Kaya Rozeti", icon: "🪨" },
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
    badge: { id: "cascade", name: "Şelale Rozeti", icon: "💧" },
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
    badge: { id: "thunder", name: "Yıldırım Rozeti", icon: "⚡" },
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
    badge: { id: "rainbow", name: "Gökkuşağı Rozeti", icon: "🌈" },
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
    badge: { id: "soul", name: "Ruh Rozeti", icon: "💜" },
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
    badge: { id: "marsh", name: "Bataklık Rozeti", icon: "🔮" },
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
    badge: { id: "volcano", name: "Volkan Rozeti", icon: "🌋" },
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
    badge: { id: "earth", name: "Toprak Rozeti", icon: "🏔️" },
    description: "Gizemli lider Giovanni ile son Kanto savaşı!",
    team: [
      { speciesId: 111, level: 45 }, // Rhyhorn
      { speciesId: 31, level: 47 },  // Nidoqueen
      { speciesId: 112, level: 50 }  // Rhydon
    ],
    rewards: { trainerXp: 1000, coins: 2000 }
  },

  // ---- Johto (Phase 10C) ----
  // Same catalog, same functions below (getGymById/isGymUnlocked/
  // awardGymVictory/etc.) - `order` is only compared within a region (see
  // getGymsForRegion), so Johto's own 1-8 coexists with Kanto's without
  // clashing. `requiresBadge` chains through Johto's own badge ids only,
  // completely independent of Kanto's chain (Violet is unlocked purely by
  // requiresBadge: null, not by anything Kanto-related - the Kanto-Champion
  // gate lives one level up, at the Johto REGION itself, via
  // isRegionUnlocked/unlockedRegions - see region-data.js/league-data.js).
  {
    gymId: "johto_violet", regionId: "johto", locationId: "violet-city", order: 1,
    leader: "Falkner", type: "flying", requiresBadge: null,
    badge: { id: "zephyr", name: "Meltem Rozeti", icon: "🌪️" },
    description: "Uçan tip ustası Falkner ile savaş!",
    team: [
      { speciesId: 16, level: 7 }, // Pidgey
      { speciesId: 17, level: 9 }  // Pidgeotto
    ],
    rewards: { trainerXp: 400, coins: 800 }
  },
  {
    gymId: "johto_azalea", regionId: "johto", locationId: "azalea-town", order: 2,
    leader: "Bugsy", type: "bug", requiresBadge: "zephyr",
    badge: { id: "hive", name: "Kovan Rozeti", icon: "🐝" },
    description: "Böcek tip ustası Bugsy ile savaş!",
    team: [
      { speciesId: 11, level: 14 },  // Metapod
      { speciesId: 14, level: 14 },  // Kakuna
      { speciesId: 123, level: 16 }  // Scyther
    ],
    rewards: { trainerXp: 500, coins: 1000 }
  },
  {
    gymId: "johto_goldenrod", regionId: "johto", locationId: "goldenrod-city", order: 3,
    leader: "Whitney", type: "normal", requiresBadge: "hive",
    badge: { id: "plain", name: "Ova Rozeti", icon: "⚪" },
    description: "Normal tip ustası Whitney ile savaş!",
    team: [
      { speciesId: 35, level: 18 },  // Clefairy
      { speciesId: 241, level: 20 }  // Miltank
    ],
    rewards: { trainerXp: 600, coins: 1200 }
  },
  {
    gymId: "johto_ecruteak", regionId: "johto", locationId: "ecruteak-city", order: 4,
    leader: "Morty", type: "ghost", requiresBadge: "plain",
    badge: { id: "fog", name: "Sis Rozeti", icon: "🌫️" },
    description: "Hayalet tip ustası Morty ile savaş!",
    team: [
      { speciesId: 92, level: 21 }, // Gastly
      { speciesId: 93, level: 21 }, // Haunter
      { speciesId: 94, level: 25 }, // Gengar
      { speciesId: 93, level: 23 }  // Haunter
    ],
    rewards: { trainerXp: 700, coins: 1400 }
  },
  {
    gymId: "johto_cianwood", regionId: "johto", locationId: "cianwood-city", order: 5,
    leader: "Chuck", type: "fighting", requiresBadge: "fog",
    badge: { id: "storm", name: "Fırtına Rozeti", icon: "⛈️" },
    description: "Dövüş tip ustası Chuck ile savaş!",
    team: [
      { speciesId: 57, level: 27 }, // Primeape
      { speciesId: 62, level: 30 }  // Poliwrath
    ],
    rewards: { trainerXp: 800, coins: 1600 }
  },
  {
    gymId: "johto_olivine", regionId: "johto", locationId: "olivine-city", order: 6,
    leader: "Jasmine", type: "steel", requiresBadge: "storm",
    badge: { id: "mineral", name: "Mineral Rozeti", icon: "💎" },
    description: "Çelik tip ustası Jasmine ile savaş!",
    team: [
      { speciesId: 81, level: 30 },  // Magnemite
      { speciesId: 81, level: 30 },  // Magnemite
      { speciesId: 208, level: 35 }  // Steelix
    ],
    rewards: { trainerXp: 900, coins: 1800 }
  },
  {
    gymId: "johto_mahogany", regionId: "johto", locationId: "mahogany-town", order: 7,
    leader: "Pryce", type: "ice", requiresBadge: "mineral",
    badge: { id: "glacier", name: "Buzul Rozeti", icon: "🧊" },
    description: "Buz tip ustası Pryce ile savaş!",
    team: [
      { speciesId: 86, level: 30 },  // Seel
      { speciesId: 87, level: 32 },  // Dewgong
      { speciesId: 221, level: 34 }  // Piloswine
    ],
    rewards: { trainerXp: 1000, coins: 2000 }
  },
  {
    gymId: "johto_blackthorn", regionId: "johto", locationId: "blackthorn-city", order: 8,
    leader: "Clair", type: "dragon", requiresBadge: "glacier",
    badge: { id: "rising", name: "Yükselen Rozet", icon: "🐉" },
    description: "Ejderha tip ustası Clair ile Johto'nun son savaşı!",
    team: [
      { speciesId: 148, level: 37 }, // Dragonair
      { speciesId: 148, level: 37 }, // Dragonair
      { speciesId: 148, level: 37 }, // Dragonair
      { speciesId: 230, level: 40 }  // Kingdra
    ],
    rewards: { trainerXp: 1200, coins: 2500 }
  },

  // ---- Hoenn (Phase 14) ----
  // Same catalog/functions, same independence pattern as Johto: Hoenn's own
  // 1-8 badge chain via requiresBadge, gated as a REGION by
  // isRegionUnlocked (checked in gym-battle.html's init()) - not by
  // anything Kanto/Johto-specific. Petalburg is intentionally gym #5 even
  // though its city is reachable early in region-data.js's location
  // chain - requiresBadge:"heat" is what actually gates the challenge, the
  // location being visited is a separate, unrelated concept (see
  // region-data.js's own note on this).
  {
    gymId: "hoenn_rustboro", regionId: "hoenn", locationId: "rustboro-city", order: 1,
    leader: "Roxanne", type: "rock", requiresBadge: null,
    badge: { id: "stone", name: "Taş Rozeti", icon: "🪨" },
    description: "Kaya tipi ustası Roxanne ile Hoenn'in ilk savaşı!",
    team: [
      { speciesId: 74, level: 12 },  // Geodude
      { speciesId: 299, level: 15 }  // Nosepass
    ],
    rewards: { trainerXp: 300, coins: 600 }
  },
  {
    gymId: "hoenn_dewford", regionId: "hoenn", locationId: "dewford-town", order: 2,
    leader: "Brawly", type: "fighting", requiresBadge: "stone",
    badge: { id: "knuckle", name: "Yumruk Rozeti", icon: "👊" },
    description: "Dövüş tipi ustası Brawly ile savaş!",
    team: [
      { speciesId: 66, level: 17 },  // Machop
      { speciesId: 296, level: 19 }  // Makuhita
    ],
    rewards: { trainerXp: 380, coins: 750 }
  },
  {
    gymId: "hoenn_mauville", regionId: "hoenn", locationId: "mauville-city", order: 3,
    leader: "Wattson", type: "electric", requiresBadge: "knuckle",
    badge: { id: "dynamo", name: "Dinamo Rozeti", icon: "⚡" },
    description: "Elektrik tipi ustası Wattson ile savaş!",
    team: [
      { speciesId: 100, level: 20 }, // Voltorb
      { speciesId: 82, level: 22 },  // Magneton
      { speciesId: 310, level: 24 }  // Manectric
    ],
    rewards: { trainerXp: 480, coins: 950 }
  },
  {
    gymId: "hoenn_lavaridge", regionId: "hoenn", locationId: "lavaridge-town", order: 4,
    leader: "Flannery", type: "fire", requiresBadge: "dynamo",
    badge: { id: "heat", name: "Alev Rozeti", icon: "🌋" },
    description: "Ateş tipi ustası Flannery ile savaş!",
    team: [
      { speciesId: 322, level: 24 }, // Numel
      { speciesId: 218, level: 24 }, // Slugma
      { speciesId: 324, level: 27 }  // Torkoal
    ],
    rewards: { trainerXp: 580, coins: 1150 }
  },
  {
    gymId: "hoenn_petalburg", regionId: "hoenn", locationId: "petalburg-city", order: 5,
    leader: "Norman", type: "normal", requiresBadge: "heat",
    badge: { id: "balance", name: "Denge Rozeti", icon: "⚖️" },
    description: "Eğitmen babası Norman ile Hoenn'in orta sınavı!",
    team: [
      { speciesId: 287, level: 27 }, // Slakoth
      { speciesId: 264, level: 29 }, // Linoone
      { speciesId: 288, level: 31 }  // Vigoroth
    ],
    rewards: { trainerXp: 680, coins: 1350 }
  },
  {
    gymId: "hoenn_fortree", regionId: "hoenn", locationId: "fortree-city", order: 6,
    leader: "Winona", type: "flying", requiresBadge: "balance",
    badge: { id: "feather", name: "Tüy Rozeti", icon: "🪶" },
    description: "Uçan tip ustası Winona ile savaş!",
    team: [
      { speciesId: 333, level: 29 }, // Swablu
      { speciesId: 357, level: 30 }, // Tropius
      { speciesId: 334, level: 32 }  // Altaria
    ],
    rewards: { trainerXp: 780, coins: 1550 }
  },
  {
    gymId: "hoenn_mossdeep", regionId: "hoenn", locationId: "mossdeep-city", order: 7,
    leader: "Tate & Liza", type: "psychic", requiresBadge: "feather",
    badge: { id: "mind", name: "Zihin Rozeti", icon: "🔮" },
    description: "İkiz Ruh ustaları Tate & Liza ile savaş!",
    team: [
      { speciesId: 338, level: 41 }, // Solrock
      { speciesId: 337, level: 41 }  // Lunatone
    ],
    rewards: { trainerXp: 950, coins: 1900 }
  },
  {
    gymId: "hoenn_sootopolis", regionId: "hoenn", locationId: "sootopolis-city", order: 8,
    leader: "Juan", type: "water", requiresBadge: "mind",
    badge: { id: "rain", name: "Yağmur Rozeti", icon: "🌧️" },
    description: "Su tipi ustası Juan ile Hoenn'in son Salon savaşı!",
    team: [
      { speciesId: 370, level: 43 }, // Luvdisc
      { speciesId: 340, level: 44 }, // Whiscash
      { speciesId: 364, level: 44 }, // Sealeo
      { speciesId: 230, level: 46 }  // Kingdra
    ],
    rewards: { trainerXp: 1300, coins: 2700 }
  },

  // ---- Sinnoh (Phase 15) ----
  // Same catalog/functions, same independence pattern as Johto/Hoenn: Sinnoh's
  // own 1-8 badge chain via requiresBadge, gated as a REGION by
  // isRegionUnlocked (checked in gym-battle.html's init()) once Hoenn's
  // Champion is beaten. Real Sinnoh's own Gym order is notoriously
  // non-linear (Hearthome can be challenged earlier than its position here) -
  // this catalog deliberately uses a clean sequential 1->8 instead, per the
  // approved plan.
  {
    gymId: "sinnoh_oreburgh", regionId: "sinnoh", locationId: "oreburgh-city", order: 1,
    leader: "Roark", type: "rock", requiresBadge: null,
    badge: { id: "coal", name: "Kömür Rozeti", icon: "🪨" },
    description: "Kaya tipi ustası Roark ile Sinnoh'un ilk savaşı!",
    team: [
      { speciesId: 74, level: 12 },  // Geodude
      { speciesId: 408, level: 14 }  // Cranidos
    ],
    rewards: { trainerXp: 320, coins: 650 }
  },
  {
    gymId: "sinnoh_eterna", regionId: "sinnoh", locationId: "eterna-city", order: 2,
    leader: "Gardenia", type: "grass", requiresBadge: "coal",
    badge: { id: "forest", name: "Orman Rozeti", icon: "🌲" },
    description: "Çimen tipi ustası Gardenia ile savaş!",
    team: [
      { speciesId: 406, level: 19 }, // Budew
      { speciesId: 315, level: 21 }, // Roselia
      { speciesId: 421, level: 23 }  // Cherrim
    ],
    rewards: { trainerXp: 420, coins: 850 }
  },
  {
    gymId: "sinnoh_veilstone", regionId: "sinnoh", locationId: "veilstone-city", order: 3,
    leader: "Maylene", type: "fighting", requiresBadge: "forest",
    badge: { id: "cobble", name: "Çakıl Rozeti", icon: "🥊" },
    description: "Dövüş tipi ustası Maylene ile savaş!",
    team: [
      { speciesId: 307, level: 27 }, // Meditite
      { speciesId: 67, level: 29 },  // Machoke
      { speciesId: 448, level: 31 }  // Lucario
    ],
    rewards: { trainerXp: 520, coins: 1050 }
  },
  {
    gymId: "sinnoh_pastoria", regionId: "sinnoh", locationId: "pastoria-city", order: 4,
    leader: "Crasher Wake", type: "water", requiresBadge: "cobble",
    badge: { id: "fen", name: "Bataklık Rozeti", icon: "🌊" },
    description: "Su tipi ustası Crasher Wake ile savaş!",
    team: [
      { speciesId: 130, level: 27 }, // Gyarados
      { speciesId: 195, level: 27 }, // Quagsire
      { speciesId: 419, level: 30 }  // Floatzel
    ],
    rewards: { trainerXp: 600, coins: 1200 }
  },
  {
    gymId: "sinnoh_hearthome", regionId: "sinnoh", locationId: "hearthome-city", order: 5,
    leader: "Fantina", type: "ghost", requiresBadge: "fen",
    badge: { id: "relic", name: "Kalıntı Rozeti", icon: "👻" },
    description: "Hayalet tipi ustası Fantina ile savaş!",
    team: [
      { speciesId: 355, level: 32 }, // Duskull
      { speciesId: 93, level: 32 },  // Haunter
      { speciesId: 429, level: 34 }  // Mismagius
    ],
    rewards: { trainerXp: 700, coins: 1400 }
  },
  {
    gymId: "sinnoh_canalave", regionId: "sinnoh", locationId: "canalave-city", order: 6,
    leader: "Byron", type: "steel", requiresBadge: "relic",
    badge: { id: "mine", name: "Maden Rozeti", icon: "⛏️" },
    description: "Çelik tipi ustası Byron ile savaş!",
    team: [
      { speciesId: 82, level: 35 },  // Magneton
      { speciesId: 208, level: 37 }, // Steelix
      { speciesId: 411, level: 39 }  // Bastiodon
    ],
    rewards: { trainerXp: 850, coins: 1700 }
  },
  {
    gymId: "sinnoh_snowpoint", regionId: "sinnoh", locationId: "snowpoint-city", order: 7,
    leader: "Candice", type: "ice", requiresBadge: "mine",
    badge: { id: "icicle", name: "Buz Sarkıtı Rozeti", icon: "❄️" },
    description: "Buz tipi ustası Candice ile savaş!",
    team: [
      { speciesId: 215, level: 38 }, // Sneasel
      { speciesId: 308, level: 40 }, // Medicham
      { speciesId: 460, level: 42 }  // Abomasnow
    ],
    rewards: { trainerXp: 1000, coins: 2000 }
  },
  {
    gymId: "sinnoh_sunyshore", regionId: "sinnoh", locationId: "sunyshore-city", order: 8,
    leader: "Volkner", type: "electric", requiresBadge: "icicle",
    badge: { id: "beacon", name: "Fener Rozeti", icon: "🔆" },
    description: "Elektrik tipi ustası Volkner ile Sinnoh'un son Salon savaşı!",
    team: [
      { speciesId: 26, level: 46 },  // Raichu
      { speciesId: 405, level: 48 }, // Luxray
      { speciesId: 466, level: 50 }  // Electivire
    ],
    rewards: { trainerXp: 1200, coins: 2500 }
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
    // Atomic write, not saveAdventurePlayer: a badge must never be
    // clobbered by another tab/device's stale whole-player save landing
    // after this one.
    pushAdventureCloudAtomic({
      "player.badges": firebase.firestore.FieldValue.arrayUnion(gym.badge.id),
      "player.xp": firebase.firestore.FieldValue.increment(gym.rewards.trainerXp),
      "player.coins": firebase.firestore.FieldValue.increment(gym.rewards.coins)
    });
    return { ok: true, alreadyDefeated: false, gym, trainerXp: gym.rewards.trainerXp, coins: gym.rewards.coins };
  } finally {
    gymVictoryLocked[gymId] = false;
  }
}
