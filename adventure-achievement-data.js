// ---- Adventure Achievements (Phase 8) ----
// A completely separate system from the classic Ayaz/Baba achievements
// (pokedex-data.js's own achievement catalog/logic) - this one only ever
// reads/writes the Adventure player's own `adventureAchievements` field
// inside profiles/adventure, and never touches profiles/ayaz or
// profiles/baba. Fully data-driven: each entry's `metric`/`targetValue` is
// the only place a threshold lives (also doubling as the progress bar the
// UI shows), so adding a new achievement later is just appending an entry -
// no new UI or unlock logic. Depends on adventure-state.js
// (getAdventurePlayer/saveAdventurePlayer/getAdventureDex/
// getAdventureProgress) and region-data.js (getLocationsForRegion) - load
// both before this file.
const ACHIEVEMENT_CATALOG = [
  { id: "collector_5", category: "Collector", name: "Küçük Koleksiyon", description: "5 Pokémon yakala", icon: "🎒", metric: ctx => ctx.dexCount, targetValue: 5, reward: { coins: 100, trainerXp: 100 } },
  { id: "collector_25", category: "Collector", name: "Koleksiyoncu", description: "25 Pokémon yakala", icon: "🎒", metric: ctx => ctx.dexCount, targetValue: 25, reward: { coins: 250, trainerXp: 200 } },
  { id: "collector_50", category: "Collector", name: "Usta Koleksiyoncu", description: "50 Pokémon yakala", icon: "🎒", metric: ctx => ctx.dexCount, targetValue: 50, reward: { coins: 500, trainerXp: 400 } },
  { id: "collector_100", category: "Collector", name: "Pokédex Efsanesi", description: "100 Pokémon yakala", icon: "🎒", metric: ctx => ctx.dexCount, targetValue: 100, reward: { coins: 1000, trainerXp: 800 } },

  { id: "explorer_3", category: "Explorer", name: "Meraklı Gezgin", description: "3 bölge keşfet", icon: "🧭", metric: ctx => ctx.visitedCount, targetValue: 3, reward: { coins: 100, trainerXp: 100 } },
  { id: "explorer_8", category: "Explorer", name: "Kanto Gezgini", description: "8 bölge keşfet", icon: "🧭", metric: ctx => ctx.visitedCount, targetValue: 8, reward: { coins: 250, trainerXp: 200 } },
  { id: "explorer_kanto_complete", category: "Explorer", name: "Kanto Kaşifi", description: "Kanto'daki tüm bölgeleri keşfet", icon: "🧭", metric: ctx => ctx.visitedCount, targetValue: ctx => ctx.totalKantoLocations, reward: { coins: 500, trainerXp: 400 } },

  { id: "battler_10", category: "Battler", name: "Acemi Savaşçı", description: "10 Wild Battle kazan", icon: "⚔️", metric: ctx => ctx.wildWins, targetValue: 10, reward: { coins: 150, trainerXp: 150 } },
  { id: "battler_50", category: "Battler", name: "Deneyimli Savaşçı", description: "50 Wild Battle kazan", icon: "⚔️", metric: ctx => ctx.wildWins, targetValue: 50, reward: { coins: 400, trainerXp: 350 } },
  { id: "battler_100", category: "Battler", name: "Savaş Ustası", description: "100 Wild Battle kazan", icon: "⚔️", metric: ctx => ctx.wildWins, targetValue: 100, reward: { coins: 800, trainerXp: 700 } },

  { id: "gym_first_badge", category: "Gym", name: "İlk Rozet", description: "İlk Gym rozetini kazan", icon: "🏅", metric: ctx => ctx.badgeCount, targetValue: 1, reward: { coins: 100, trainerXp: 100 } },
  { id: "gym_4_badges", category: "Gym", name: "Yarı Yolda", description: "4 Gym rozeti kazan", icon: "🏅", metric: ctx => ctx.badgeCount, targetValue: 4, reward: { coins: 300, trainerXp: 250 } },
  { id: "gym_8_badges", category: "Gym", name: "Kanto Şampiyonu Adayı", description: "8 Gym rozetinin hepsini kazan", icon: "🏅", metric: ctx => ctx.badgeCount, targetValue: 8, reward: { coins: 600, trainerXp: 500 } },

  { id: "league_elite_four", category: "League", name: "Elite Four Fatihi", description: "Elite Four'un tamamını yen", icon: "🏆", metric: ctx => ctx.eliteFourWins, targetValue: 4, reward: { coins: 500, trainerXp: 400 } },
  { id: "league_champion", category: "League", name: "Kanto Champion", description: "Kanto Champion'ı yen", icon: "🏆", metric: ctx => (ctx.kantoCompleted ? 1 : 0), targetValue: 1, reward: { coins: 1000, trainerXp: 800 } },

  { id: "evolution_first", category: "Evolution", name: "İlk Evrim", description: "İlk kez bir Pokémon'unu evrimleştir", icon: "🌟", metric: ctx => ctx.evolutionCount, targetValue: 1, reward: { coins: 100, trainerXp: 100 } },
  { id: "evolution_5", category: "Evolution", name: "Evrim Ustası", description: "5 kez evrimleştir", icon: "🌟", metric: ctx => ctx.evolutionCount, targetValue: 5, reward: { coins: 300, trainerXp: 250 } },
  { id: "evolution_10", category: "Evolution", name: "Evrim Efsanesi", description: "10 kez evrimleştir", icon: "🌟", metric: ctx => ctx.evolutionCount, targetValue: 10, reward: { coins: 600, trainerXp: 500 } },

  { id: "shiny_first", category: "Shiny", name: "Parıltılı Şans", description: "İlk shiny Pokémon'unu yakala", icon: "✨", metric: ctx => ctx.shinyCount, targetValue: 1, reward: { coins: 300, trainerXp: 200 } },
  { id: "shiny_3", category: "Shiny", name: "Şanslı Avcı", description: "3 shiny Pokémon yakala", icon: "✨", metric: ctx => ctx.shinyCount, targetValue: 3, reward: { coins: 800, trainerXp: 500 } },

  { id: "legendary_first", category: "Legendary", name: "Efsane Avcısı", description: "İlk efsanevi/güçlü Pokémon'unu yakala", icon: "🐲", metric: ctx => ctx.legendaryCount, targetValue: 1, reward: { coins: 500, trainerXp: 400 } },

  { id: "friendship_50", category: "Friendship", name: "Yakın Dost", description: "Bir Pokémon'unla 50 Friendship'e ulaş", icon: "❤️", metric: ctx => ctx.maxFriendship, targetValue: 50, reward: { coins: 100, trainerXp: 100 } },
  { id: "friendship_100", category: "Friendship", name: "Can Dostu", description: "Bir Pokémon'unla 100 Friendship'e ulaş", icon: "❤️", metric: ctx => ctx.maxFriendship, targetValue: 100, reward: { coins: 300, trainerXp: 250 } },

  // Phase 13: Johto/multi-region parity, purely additive - none of the
  // entries above changed (id/metric/targetValue), so an already-unlocked
  // achievement (checked via isAdventureAchievementUnlocked before any
  // metric ever runs) can never be affected by anything added here.
  { id: "explorer_johto_complete", category: "Explorer", name: "Johto Kaşifi", description: "Johto'daki tüm bölgeleri keşfet", icon: "🧭", metric: ctx => ctx.visitedJohtoCount, targetValue: ctx => ctx.totalJohtoLocations, reward: { coins: 500, trainerXp: 400 } },
  { id: "league_elite_four_johto", category: "League", name: "Johto Elite Four Fatihi", description: "Johto Elite Four'un tamamını yen", icon: "🏆", metric: ctx => ctx.eliteFourWinsJohto, targetValue: 4, reward: { coins: 500, trainerXp: 400 } },
  { id: "league_champion_johto", category: "League", name: "Johto Champion", description: "Johto Champion'ı yen", icon: "🏆", metric: ctx => (ctx.johtoCompleted ? 1 : 0), targetValue: 1, reward: { coins: 1000, trainerXp: 800 } },
  { id: "gym_16_badges", category: "Gym", name: "Efsanevi Eğitmen", description: "Kanto ve Johto'nun 16 rozetinin hepsini kazan", icon: "🏅", metric: ctx => ctx.badgeCount, targetValue: 16, reward: { coins: 1200, trainerXp: 1000 } },
  { id: "champion_both_regions", category: "League", name: "İki Bölgenin Şampiyonu", description: "Hem Kanto hem Johto Champion'ını yen", icon: "👑", metric: ctx => (ctx.kantoCompleted && ctx.johtoCompleted ? 1 : 0), targetValue: 1, reward: { coins: 1500, trainerXp: 1200 } },

  // Phase 14: Hoenn parity, same additive rule as Phase 13's Johto
  // entries - nothing above this line changed (id/metric/targetValue), so
  // gym_16_badges/champion_both_regions/gym_8_badges/every Kanto+Johto
  // achievement stay exactly as already earned. gym_24_badges and
  // champion_all_regions are new, higher tiers alongside (not replacing)
  // gym_16_badges/champion_both_regions - the same tiering convention this
  // catalog already uses for collector_5/25/50/100 etc.
  { id: "explorer_hoenn_complete", category: "Explorer", name: "Hoenn Kaşifi", description: "Hoenn'deki tüm bölgeleri keşfet", icon: "🧭", metric: ctx => ctx.visitedHoennCount, targetValue: ctx => ctx.totalHoennLocations, reward: { coins: 500, trainerXp: 400 } },
  { id: "league_elite_four_hoenn", category: "League", name: "Hoenn Elite Four Fatihi", description: "Hoenn Elite Four'un tamamını yen", icon: "🏆", metric: ctx => ctx.eliteFourWinsHoenn, targetValue: 4, reward: { coins: 600, trainerXp: 500 } },
  { id: "league_champion_hoenn", category: "League", name: "Hoenn Champion", description: "Hoenn Champion'ı yen", icon: "🏆", metric: ctx => (ctx.hoennCompleted ? 1 : 0), targetValue: 1, reward: { coins: 1200, trainerXp: 1000 } },
  { id: "gym_24_badges", category: "Gym", name: "Üç Bölgenin Ustası", description: "Kanto, Johto ve Hoenn'in 24 rozetinin hepsini kazan", icon: "🏅", metric: ctx => ctx.badgeCount, targetValue: 24, reward: { coins: 1800, trainerXp: 1500 } },
  { id: "champion_all_regions", category: "League", name: "Üç Bölgenin Şampiyonu", description: "Kanto, Johto ve Hoenn Champion'larının hepsini yen", icon: "👑", metric: ctx => (ctx.kantoCompleted && ctx.johtoCompleted && ctx.hoennCompleted ? 1 : 0), targetValue: 1, reward: { coins: 2500, trainerXp: 2000 } }
];

function getAdventureAchievementCategories() {
  const seen = [];
  ACHIEVEMENT_CATALOG.forEach(a => { if (seen.indexOf(a.category) === -1) seen.push(a.category); });
  return seen;
}

function adventureAchievementTargetValue(ach, ctx) {
  return typeof ach.targetValue === "function" ? ach.targetValue(ctx) : ach.targetValue;
}

function isAdventureAchievementUnlocked(player, achievementId) {
  return (player.adventureAchievements || []).some(a => a.id === achievementId);
}

function buildAdventureAchievementContext(player, dex, progress) {
  const kantoLeague = player.leagueProgress && player.leagueProgress.kanto;
  // Phase 13: Johto's own league progress, read the exact same literal way
  // Kanto's already is above (johto_league is the League catalog's actual
  // leagueId, same convention already used in league-data.js/hall-of-fame
  // rendering) - not a new pattern, just applied once more.
  const johtoLeague = player.leagueProgress && player.leagueProgress.johto_league;
  // Phase 14: same literal convention once more for Hoenn.
  const hoennLeague = player.leagueProgress && player.leagueProgress.hoenn_league;
  const visitedLocations = progress.visitedLocations || [];
  return {
    dexCount: dex.filter(p => p.id < 900000000).length,
    visitedCount: visitedLocations.length,
    totalKantoLocations: typeof getLocationsForRegion === "function" ? getLocationsForRegion("kanto").length : 0,
    wildWins: player.wildWins || 0,
    badgeCount: (player.badges || []).length,
    eliteFourWins: (kantoLeague && kantoLeague.eliteFourWins.length) || 0,
    kantoCompleted: !!(kantoLeague && kantoLeague.completed),
    evolutionCount: player.evolutionCount || 0,
    shinyCount: dex.filter(p => p.shiny).length,
    legendaryCount: dex.filter(p => (p.power || 0) >= 600).length,
    maxFriendship: dex.reduce((m, p) => Math.max(m, p.friendship || 0), 0),
    // Phase 13: Johto-equivalent fields, additive only - every field above
    // this line is unchanged from Phase 8.
    totalJohtoLocations: typeof getLocationsForRegion === "function" ? getLocationsForRegion("johto").length : 0,
    visitedJohtoCount: typeof getLocationsForRegion === "function"
      ? getLocationsForRegion("johto").filter(l => visitedLocations.includes(l.id)).length
      : 0,
    eliteFourWinsJohto: (johtoLeague && johtoLeague.eliteFourWins.length) || 0,
    johtoCompleted: !!(johtoLeague && johtoLeague.completed),
    // Phase 14: Hoenn-equivalent fields, additive only - every field above
    // this line is unchanged from Phase 13.
    totalHoennLocations: typeof getLocationsForRegion === "function" ? getLocationsForRegion("hoenn").length : 0,
    visitedHoennCount: typeof getLocationsForRegion === "function"
      ? getLocationsForRegion("hoenn").filter(l => visitedLocations.includes(l.id)).length
      : 0,
    eliteFourWinsHoenn: (hoennLeague && hoennLeague.eliteFourWins.length) || 0,
    hoennCompleted: !!(hoennLeague && hoennLeague.completed)
  };
}

let adventureAchievementLock = false;

// The single place an Adventure achievement is ever unlocked. Every check
// is a pure function of already-persisted state (owned Pokemon/visited
// locations/player counters), so re-running this after any event is
// naturally idempotent - an already-unlocked achievement is skipped, and
// the synchronous lock blocks a concurrent re-entrant call from
// double-granting a reward.
function checkAndUnlockAdventureAchievements() {
  if (adventureAchievementLock) return [];
  adventureAchievementLock = true;
  try {
    const player = getAdventurePlayer();
    if (!player.adventureAchievements) player.adventureAchievements = [];
    const dex = getAdventureDex();
    const progress = getAdventureProgress();
    const ctx = buildAdventureAchievementContext(player, dex, progress);

    const newlyUnlocked = [];
    ACHIEVEMENT_CATALOG.forEach(ach => {
      if (isAdventureAchievementUnlocked(player, ach.id)) return;
      if (ach.metric(ctx) < adventureAchievementTargetValue(ach, ctx)) return;
      player.adventureAchievements.push({ id: ach.id, unlockedAt: Date.now() });
      if (ach.reward) {
        player.xp += ach.reward.trainerXp || 0;
        player.coins = (player.coins || 0) + (ach.reward.coins || 0);
      }
      newlyUnlocked.push(ach);
    });
    if (newlyUnlocked.length) saveAdventurePlayer(player);
    return newlyUnlocked;
  } finally {
    adventureAchievementLock = false;
  }
}
